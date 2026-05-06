import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
export const createClient = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              // In Server Components, cookie mutations are not allowed.
              // Supabase can still read the session, so we safely ignore writes here.
              cookieStore.set(name, value, options);
            } catch {
              // no-op
            }
          });
        },
      },
    },
  );
};
