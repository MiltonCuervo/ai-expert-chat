'use server';
import {redirect} from 'next/navigation';
import {revalidatePath} from 'next/cache';
import {requireUser} from '@/lib/auth';
export async function newConversation() { const {supabase,user}=await requireUser(); const {data,error}=await supabase.from('conversations').insert({user_id:user.id}).select('id').single(); if(error || !data) throw new Error('No se pudo crear la conversación'); redirect(`/chat?id=${data.id}`); }
export async function deleteConversation(form:FormData) { const {supabase,user}=await requireUser(); const id=form.get('id'); if(typeof id!=='string') throw new Error('Conversación inválida'); const {error}=await supabase.from('conversations').delete().eq('id',id).eq('user_id',user.id); if(error) throw new Error('No se pudo eliminar la conversación'); revalidatePath('/chat'); redirect('/chat'); }
export async function signOut() { const {supabase}=await requireUser(); await supabase.auth.signOut(); redirect('/'); }
