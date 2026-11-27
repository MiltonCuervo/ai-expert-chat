'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
type Mode = 'login'|'register'|'forgot'|'reset';
export function AuthForm({mode}:{mode:Mode}) {
 const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [message,setMessage]=useState(''); const [busy,setBusy]=useState(false); const router=useRouter();
 const labels={login:'Iniciar sesión',register:'Crear cuenta',forgot:'Recuperar contraseña',reset:'Nueva contraseña'};
 async function submit(e:React.FormEvent) { e.preventDefault(); setBusy(true); setMessage(''); const supabase=createClient(); try {
  if(mode==='login') { const {error}=await supabase.auth.signInWithPassword({email,password}); if(error) throw error; router.push('/chat'); router.refresh(); }
  if(mode==='register') { const {data,error}=await supabase.auth.signUp({email,password,options:{emailRedirectTo:`${window.location.origin}/auth/callback?next=/chat`}}); if(error) throw error; if(data.session) {router.push('/chat'); router.refresh();} else setMessage('Revisa tu correo para confirmar la cuenta.'); }
  if(mode==='forgot') { const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${window.location.origin}/auth/callback?next=/reset-password`}); if(error) throw error; setMessage('Si la cuenta existe, recibirás un enlace de recuperación.'); }
  if(mode==='reset') { const {error}=await supabase.auth.updateUser({password}); if(error) throw error; setMessage('Contraseña actualizada. Ya puedes iniciar sesión.'); }
 } catch(error) {setMessage(error instanceof Error ? error.message : 'Ocurrió un error. Inténtalo de nuevo.');} finally {setBusy(false);} }
 return <main className="mx-auto flex min-h-screen max-w-md items-center px-5"><div className="card w-full"><Link href="/">← AI Expert Chat</Link><h1 className="mb-6 mt-8 text-2xl font-bold">{labels[mode]}</h1><form onSubmit={submit} className="space-y-4">{mode!=='reset' && <label className="block text-sm">Correo electrónico<input className="mt-1" type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>}{mode!=='forgot' && <label className="block text-sm">Contraseña<input className="mt-1" type="password" required minLength={6} autoComplete={mode==='login'?'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)}/></label>}<button disabled={busy} className="w-full">{busy?'Procesando…':labels[mode]}</button></form>{message && <p role="status" className="mt-4 text-sm text-cyan-200">{message}</p>}<div className="mt-6 flex flex-wrap gap-4 text-sm"><Link href="/login">Entrar</Link><Link href="/register">Registrarse</Link><Link href="/forgot-password">Olvidé mi contraseña</Link></div></div></main>;
}
