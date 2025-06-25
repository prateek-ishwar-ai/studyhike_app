import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { Database } from "@/types/database"

export function createServerClient() {
  const cookieStore = cookies()

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, 
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}
