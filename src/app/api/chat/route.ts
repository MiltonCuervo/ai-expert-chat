import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient, hasAdminKey } from '@/lib/supabase/admin';
import { getAIProvider, type ChatMessage } from '@/lib/ai/provider';
const input = z.object({conversationId:z.string().uuid(), content:z.string().trim().min(1).max(8000)});
export async function POST(request: Request) {
 try {
  const supabase = await createClient(); const {data:{user}} = await supabase.auth.getUser(); if (!user) return NextResponse.json({error:'Inicia sesión.'},{status:401});
  const parsed = input.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({error:'Mensaje o conversación inválidos.'},{status:400});
  if (!hasAdminKey()) return NextResponse.json({error:'El servidor no tiene configurada la clave secreta de Supabase. Contacta al administrador.'},{status:503});
  if (process.env.AI_PROVIDER === 'gemini' && (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.startsWith('TU_'))) return NextResponse.json({error:'El servidor no tiene configurada la clave de Gemini. Contacta al administrador.'},{status:503});
  const {conversationId,content} = parsed.data;
  const {data:conversation,error:ownerError} = await supabase.from('conversations').select('id,title').eq('id',conversationId).eq('user_id',user.id).maybeSingle(); if (ownerError || !conversation) return NextResponse.json({error:'Conversación no encontrada.'},{status:404});
  const {data:history,error:historyError} = await supabase.from('messages').select('role,content').eq('conversation_id',conversationId).order('created_at',{ascending:false}).limit(20); if (historyError) throw historyError;
  const {data:settings,error:settingsError} = await supabase.from('assistant_settings').select('system_prompt').eq('id',true).single(); if (settingsError || !settings) throw settingsError || new Error('Falta configuración');
  const {error:insertError} = await supabase.from('messages').insert({conversation_id:conversationId,role:'user',content}); if (insertError) throw insertError;
  const reply = await getAIProvider().reply(settings.system_prompt,[...(history.reverse() as ChatMessage[]),{role:'user',content}]);
  const admin = createAdminClient(); const {error:replyError} = await admin.from('messages').insert({conversation_id:conversationId,role:'assistant',content:reply}); if (replyError) throw replyError;
  await supabase.from('conversations').update({updated_at:new Date().toISOString(), ...(conversation.title === 'Nueva conversación' ? {title:content.slice(0,60)} : {})}).eq('id',conversationId);
  return NextResponse.json({reply});
 } catch (error) { console.error('Chat error:', error); const detail = error instanceof Error && (error.message.startsWith('Gemini alcanzó') || error.message.startsWith('El modelo Gemini') || error.message.startsWith('No se pudo obtener una respuesta de Gemini') || error.message.startsWith('Gemini no devolvió')) ? ` ${error.message}` : ''; return NextResponse.json({error:`No fue posible generar la respuesta. Tu mensaje puede haberse guardado; revisa el historial antes de reintentar.${detail}`},{status:500}); }
}
