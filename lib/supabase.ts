import { createClient } from '@supabase/supabase-js'

// 客户端使用的 Supabase 客户端（使用 anon key）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 服务端使用的 Supabase 客户端（使用 service role key，具有完全访问权限）
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
