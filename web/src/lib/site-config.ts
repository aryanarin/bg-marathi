/**
 * Site-wide constants.
 *
 * Single source of truth for names and navigation, so the header, footer,
 * mobile tab bar and metadata never drift apart.
 */

export const siteConfig = {
  name: "श्रीमद्भगवद्गीता",
  nameEnglish: "Bhagavad Gita Learning Platform",
  tagline: "श्लोक वाचा, समजून घ्या, आणि मनन करा",
  description:
    "श्रीमद्भगवद्गीतेचे सर्व अध्याय आणि श्लोक मराठीत — शब्दार्थ, भावार्थ, सोपे स्पष्टीकरण आणि संस्कृत उच्चारासह. आपली प्रगती नोंदवा आणि नियमित अभ्यास करा.",
} as const;

/**
 * Source attribution. The entire scripture content is based on the Bhagavad
 * Gita As It Is by His Divine Grace A.C. Bhaktivedanta Swami Prabhupāda,
 * Founder-Ācārya of ISKCON. His full name is always used wherever referenced.
 */
export const attribution = {
  /** Full honorific name, Marathi. */
  authorMarathi:
    "हिज डिव्हाईन ग्रेस ए. सी. भक्तिवेदान्त स्वामी प्रभुपाद",
  /** Full honorific name, English. */
  authorEnglish:
    "His Divine Grace A.C. Bhaktivedanta Swami Prabhupāda",
  /** The source work, Marathi. */
  workMarathi: "भगवद्गीता जशी आहे तशी",
  /** The source work, English. */
  workEnglish: "Bhagavad-gītā As It Is",
} as const;

/** Primary navigation for a signed-in learner. */
export const learnerNav = [
  { href: "/dashboard", labelMarathi: "मुख्यपृष्ठ", labelEnglish: "Dashboard" },
  { href: "/chapters", labelMarathi: "अध्याय", labelEnglish: "Chapters" },
  { href: "/progress", labelMarathi: "प्रगती", labelEnglish: "Progress" },
  { href: "/quizzes", labelMarathi: "प्रश्नमंजुषा", labelEnglish: "Quizzes" },
  { href: "/classes", labelMarathi: "वर्ग", labelEnglish: "Classes" },
] as const;

/** Admin navigation. */
export const adminNav = [
  { href: "/admin", labelMarathi: "प्रशासन", labelEnglish: "Dashboard" },
  { href: "/admin/users", labelMarathi: "वापरकर्ते", labelEnglish: "Users" },
  { href: "/admin/chapters", labelMarathi: "अध्याय", labelEnglish: "Chapters" },
  { href: "/admin/verses", labelMarathi: "श्लोक", labelEnglish: "Verses" },
  { href: "/admin/classes", labelMarathi: "वर्ग", labelEnglish: "Classes" },
  { href: "/admin/quizzes", labelMarathi: "प्रश्नमंजुषा", labelEnglish: "Quizzes" },
] as const;

/** Public navigation, shown when signed out. */
export const publicNav = [
  { href: "/chapters", labelMarathi: "अध्याय", labelEnglish: "Chapters" },
  { href: "/about", labelMarathi: "आमच्याविषयी", labelEnglish: "About" },
] as const;
