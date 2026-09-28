import Link from "next/link";
import { BookOpen, Headphones, LineChart, NotebookPen } from "lucide-react";

import { Container } from "@/components/layout/container";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";

const features = [
  {
    icon: BookOpen,
    title: "सर्व अध्याय व श्लोक",
    description:
      "प्रत्येक श्लोकासाठी संस्कृत पाठ, शब्दार्थ, भाषांतर आणि भावार्थ एकाच ठिकाणी.",
  },
  {
    icon: NotebookPen,
    title: "सोपे स्पष्टीकरण",
    description:
      "कठीण तत्त्वज्ञान सोप्या मराठीत, दैनंदिन जीवनातील उदाहरणांसह समजावले जाते.",
  },
  {
    icon: Headphones,
    title: "संस्कृत उच्चार",
    description:
      "प्रत्येक श्लोकाचे शुद्ध संस्कृत उच्चारण ऐकून पाठांतर करणे सोपे होते.",
  },
  {
    icon: LineChart,
    title: "आपली प्रगती",
    description:
      "वाचलेले श्लोक, पाठ केलेले श्लोक आणि अभ्यासाचा एकूण वेळ नोंदवला जातो.",
  },
] as const;

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader>
        <nav aria-label="मुख्य" className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/chapters">अध्याय</Link>
          </Button>
          <Button asChild variant="primary" size="sm">
            <Link href="/login">प्रवेश</Link>
          </Button>
        </nav>
      </SiteHeader>

      <main id="main-content" className="flex-1">
        {/* Hero. No background image dependency: the palette and typography
            carry the devotional tone on their own. */}
        <section className="border-b border-rule-gold bg-cream/40">
          <Container width="default" className="py-14 text-center sm:py-20">
            <p
              aria-hidden="true"
              className="mb-5 font-verse text-3xl leading-none text-gold-dark"
            >
              ॐ
            </p>

            <h1 className="font-devanagari text-3xl leading-tight text-ink sm:text-4xl">
              {siteConfig.name}
            </h1>

            <p className="mx-auto mt-4 max-w-reading text-lg text-ink-muted prose-marathi">
              {siteConfig.tagline}
            </p>

            {/* A real verse, shown as a sample of the reading experience. */}
            <blockquote className="mx-auto mt-10 max-w-reading rounded-lg border border-rule-gold bg-cream px-6 py-7 shadow-warm-sm">
              <p className="verse-text text-center text-ink" lang="sa">
                {"कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥"}
              </p>
              <footer className="mt-4 text-sm text-ink-subtle">
                <cite className="not-italic">भगवद्गीता २.४७</cite>
              </footer>
            </blockquote>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/register">नोंदणी करा</Link>
              </Button>
              <Button asChild variant="sacred" size="lg" className="w-full sm:w-auto">
                <Link href="/chapters">अध्याय पहा</Link>
              </Button>
            </div>
          </Container>
        </section>

        <section aria-labelledby="features-heading">
          <Container width="wide" className="py-14">
            <h2
              id="features-heading"
              className="text-center font-devanagari text-2xl text-ink"
            >
              या संकेतस्थळावर काय आहे?
            </h2>

            <ul className="mt-9 grid gap-4 sm:grid-cols-2">
              {features.map(({ icon: Icon, title, description }) => (
                <li
                  key={title}
                  className="rounded-lg border border-rule-gold bg-cream p-5"
                >
                  <Icon
                    className="size-6 text-gold-dark"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  <h3 className="mt-3 font-devanagari text-lg font-semibold text-ink">
                    {title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted prose-marathi">
                    {description}
                  </p>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
