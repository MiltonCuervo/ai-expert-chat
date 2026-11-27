-- Ejecutar una sola vez en el SQL Editor de un proyecto nuevo.
create extension if not exists pgcrypto;
create type public.app_role as enum ('USER', 'ADMIN');
create type public.message_role as enum ('user', 'assistant');
-- auth.users es la tabla users administrada por Supabase Auth.
create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, email text not null, role public.app_role not null default 'USER', created_at timestamptz not null default now());
create table public.conversations (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, title text not null default 'Nueva conversación', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.messages (id uuid primary key default gen_random_uuid(), conversation_id uuid not null references public.conversations(id) on delete cascade, role public.message_role not null, content text not null check (char_length(content) between 1 and 30000), created_at timestamptz not null default now());
create table public.assistant_settings (id boolean primary key default true check (id), system_prompt text not null check (char_length(system_prompt) between 1 and 12000), updated_at timestamptz not null default now());
create index conversations_user_updated_idx on public.conversations(user_id, updated_at desc);
create index messages_conversation_created_idx on public.messages(conversation_id, created_at, id);
insert into public.assistant_settings (id, system_prompt) values (true, 'Eres AI Expert Chat, un asistente experto en programación y desarrollo de software. Responde en el idioma del usuario de forma técnica, clara y didáctica. Explica conceptos, errores y sus causas; ofrece ejemplos de código cuando ayuden y menciona supuestos y riesgos relevantes. Reconoce incertidumbre y no inventes resultados. Limita tus respuestas a programación y temas directamente relacionados; ante consultas ajenas, explica brevemente tu especialidad e invita a formular una pregunta de programación.');
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$ begin insert into public.profiles(id,email) values (new.id, coalesce(new.email,'')); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
create function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$ select exists(select 1 from public.profiles where id = auth.uid() and role = 'ADMIN') $$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.assistant_settings enable row level security;
create policy profiles_read on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
-- Los roles solo cambian mediante una función que valida al administrador.
create policy conversations_own on public.conversations for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy messages_read on public.messages for select to authenticated using (exists(select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid()));
create policy messages_insert on public.messages for insert to authenticated with check (role = 'user' and exists(select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid()));
create policy settings_read on public.assistant_settings for select to authenticated using (true);
create policy settings_admin_update on public.assistant_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());
create function public.set_user_role(target_id uuid, new_role public.app_role) returns void language plpgsql security definer set search_path = '' as $$ begin if not public.is_admin() then raise exception 'Forbidden'; end if; if target_id = auth.uid() then raise exception 'Cannot change your own role'; end if; update public.profiles set role = new_role where id = target_id; if not found then raise exception 'User not found'; end if; end $$;
revoke all on function public.set_user_role(uuid, public.app_role) from public;
grant execute on function public.set_user_role(uuid, public.app_role) to authenticated;
-- Solo el servidor, mediante service_role, puede insertar respuestas del asistente.
