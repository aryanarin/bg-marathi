import { Redirect } from "expo-router";

import { useAuth } from "@/lib/auth";
import { Loading } from "@/components/ui";

/**
 * Initial route at "/". Redirects to the app or auth group once the stored
 * session resolves. Using <Redirect> (not just an effect) ensures a valid
 * initial screen in release builds.
 */
export default function Index() {
  const { initializing, session } = useAuth();

  if (initializing) return <Loading />;

  return session ? (
    <Redirect href="/(app)/(tabs)/dashboard" />
  ) : (
    <Redirect href="/(auth)/login" />
  );
}
