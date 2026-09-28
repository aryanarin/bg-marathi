import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

/**
 * Sign-out control. A form posting to the signOut Server Action, which clears
 * the session and redirects. A button (not a link) because it mutates state.
 */
export function SignOutButton({ variant = "ghost" }: { variant?: "ghost" | "outline" }) {
  return (
    <form action={signOut}>
      <Button type="submit" variant={variant} size="sm">
        बाहेर पडा
      </Button>
    </form>
  );
}
