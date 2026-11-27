import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
export async function requireUser() { const supabase = await createClient(); const {data:{user}} = await supabase.auth.getUser(); if (!user) redirect('/login'); return {supabase,user}; }
export async function requireAdmin() { const result = await requireUser(); const {data} = await result.supabase.from('profiles').select('role').eq('id',result.user.id).single(); if (data?.role !== 'ADMIN') redirect('/chat'); return result; }
