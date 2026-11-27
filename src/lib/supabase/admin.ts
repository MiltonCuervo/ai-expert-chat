import 'server-only';
import { createClient } from '@supabase/supabase-js';
export function hasAdminKey() { const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(); return !!key && key !== 'server-only-service-role-key' && !key.startsWith('TU_'); }
export function createAdminClient() { if (!hasAdminKey()) throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY en el servidor'); return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } }); }
