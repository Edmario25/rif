import { createClient } from '@supabase/supabase-js'

// Este cliente usa a SERVICE_ROLE_KEY e nunca deve ser importado em código client-side.
// Apenas em API routes (server-side).
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
