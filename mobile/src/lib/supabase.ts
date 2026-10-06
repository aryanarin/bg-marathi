/**
 * Supabase client for React Native.
 *
 * Uses the anon key with the signed-in user's JWT (set automatically after
 * sign-in). Sessions persist in AsyncStorage so the user stays logged in
 * across app restarts. `detectSessionInUrl` is disabled (no browser URL on
 * native); auth deep links are handled explicitly in the auth layer.
 */
import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/config";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
