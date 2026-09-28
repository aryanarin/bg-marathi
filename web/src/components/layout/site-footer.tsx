import Link from "next/link";

import { Container } from "@/components/layout/container";
import { siteConfig } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-rule-gold bg-cream/60">
      <Container width="wide" className="py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="font-devanagari font-semibold text-ink">
              {siteConfig.name}
            </p>
            <p className="text-sm text-ink-subtle">{siteConfig.tagline}</p>
          </div>

          <nav aria-label="तळटीप दुवे" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link href="/about" className="rounded text-ink-muted hover:text-saffron">
              आमच्याविषयी
            </Link>
            <Link href="/chapters" className="rounded text-ink-muted hover:text-saffron">
              अध्याय
            </Link>
          </nav>
        </div>

        <p className="mt-6 text-xs leading-relaxed text-ink-subtle">
          श्लोक, भाषांतर आणि भावार्थ श्रील प्रभुपादांच्या
          <span className="italic"> भगवद्गीता जशी आहे तशी </span>
          या ग्रंथावर आधारित आहेत.
        </p>
      </Container>
    </footer>
  );
}
