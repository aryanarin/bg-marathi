import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: "आमच्याविषयी",
  description:
    "श्रीमद्भगवद्गीता अभ्यास मंचाविषयी माहिती — उद्देश, मजकुराचा स्रोत आणि वापर कसा करावा.",
};

export default function AboutPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        <Container width="reading" className="py-12">
          <h1 className="font-devanagari text-3xl text-ink">आमच्याविषयी</h1>

          <div className="mt-6 space-y-5 text-ink-muted prose-marathi">
            <p>
              हे संकेतस्थळ श्रीमद्भगवद्गीतेचा नियमित आणि सखोल अभ्यास करण्यासाठी
              तयार केले आहे. प्रत्येक श्लोक स्वतंत्र पानावर संस्कृत पाठ, शब्दार्थ,
              भाषांतर आणि भावार्थासह दिला जातो.
            </p>
            <p>
              साप्ताहिक वर्गांनंतर त्या श्लोकांवर आधारित प्रश्नमंजुषा उपलब्ध करून
              दिली जाते, जेणेकरून अभ्यास केवळ वाचनापुरता मर्यादित राहू नये.
            </p>

            <h2 className="pt-3 font-devanagari text-xl font-semibold text-ink">
              मजकुराचा स्रोत
            </h2>
            <p>
              श्लोक, भाषांतर आणि भावार्थ हे हिज डिव्हाईन ग्रेस ए. सी.
              भक्तिवेदान्त स्वामी प्रभुपाद (His Divine Grace A.C. Bhaktivedanta
              Swami Prabhupāda), इंटरनॅशनल सोसायटी फॉर कृष्णा कॉन्शसनेस
              (ISKCON) चे संस्थापक-आचार्य, यांच्या{" "}
              <span className="italic">भगवद्गीता जशी आहे तशी</span> या
              ग्रंथाच्या मराठी आवृत्तीवर आधारित आहेत.
            </p>
          </div>
        </Container>
      </main>

      <SiteFooter />
    </div>
  );
}
