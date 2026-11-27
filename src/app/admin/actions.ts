'use server';
import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {requireAdmin} from '@/lib/auth';
export async function updateRole(form:FormData) { const {supabase}=await requireAdmin(); const parsed=z.object({id:z.string().uuid(),role:z.enum(['USER','ADMIN'])}).parse({id:form.get('id'),role:form.get('role')}); const {error}=await supabase.rpc('set_user_role',{target_id:parsed.id,new_role:parsed.role}); if(error) throw new Error('No se pudo cambiar el rol'); revalidatePath('/admin'); }
export async function updatePrompt(form:FormData) { const {supabase}=await requireAdmin(); const prompt=z.string().trim().min(1).max(12000).parse(form.get('prompt')); const {error}=await supabase.from('assistant_settings').update({system_prompt:prompt,updated_at:new Date().toISOString()}).eq('id',true); if(error) throw new Error('No se pudo guardar el prompt'); revalidatePath('/admin'); }
