import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Container width="reading" className="py-16">
      <div className="flex flex-col items-center gap-4 text-center">
        <p aria-hidden="true" className="font-verse text-3xl text-gold-dark">
          ॐ
        </p>
        <h1 className="font-devanagari text-2xl text-ink">हे पान सापडले नाही</h1>
        <p className="max-w-sm text-ink-muted prose-marathi">
          आपण शोधत असलेले पान उपलब्ध नाही. कृपया अध्यायांच्या यादीतून पुढे जा.
        </p>
        <Button asChild className="mt-2">
          <Link href="/chapters">अध्याय पहा</Link>
        </Button>
      </div>
    </Container>
  );
}
