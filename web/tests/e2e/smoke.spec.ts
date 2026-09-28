import { expect, test } from "@playwright/test";

/**
 * Phase 1 smoke tests.
 *
 * These cover only what exists in the UI shell: public pages render, Devanagari
 * is not broken, navigation works, and private routes are actually protected.
 *
 * The full critical-flow suite (register, login, mark read, mark memorized,
 * take quiz, admin creates class) is added as each phase lands, so that a test
 * is never written against a page that does not work yet.
 */

test.describe("public pages", () => {
  test("home page renders the hero and sample verse", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "श्रीमद्भगवद्गीता",
    );

    // The sample verse must render as Devanagari, not as boxes or mojibake.
    await expect(page.getByText("कर्मण्येवाधिकारस्ते")).toBeVisible();
    await expect(page.getByRole("link", { name: "नोंदणी करा" })).toBeVisible();
  });

  test("chapters page is publicly reachable", async ({ page }) => {
    await page.goto("/chapters");
    await expect(page.getByRole("heading", { level: 1, name: "अध्याय" })).toBeVisible();
  });

  test("about page explains the content source", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "आमच्याविषयी",
    );
  });

  test("unknown URLs render the not-found page, not a crash", async ({ page }) => {
    const response = await page.goto("/this-route-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByText("हे पान सापडले नाही")).toBeVisible();
  });
});

test.describe("route protection", () => {
  // The authorization boundary is the data access layer and RLS; proxy adds an
  // early redirect. This asserts the redirect, which is the user-visible part.
  for (const path of ["/dashboard", "/progress", "/quizzes", "/classes", "/admin"]) {
    test(`${path} redirects a signed-out visitor to /login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    });
  }

  test("the intended destination is preserved for after sign-in", async ({ page }) => {
    await page.goto("/progress");
    await expect(page).toHaveURL(/[?&]next=%2Fprogress/);
  });
});

test.describe("accessibility basics", () => {
  test("the skip link is first in the document and can take focus", async ({
    page,
    browserName,
  }) => {
    await page.goto("/");

    const skipLink = page.getByRole("link", { name: "मुख्य मजकुराकडे जा" });

    // It must be the first focusable element in document order, which is what
    // makes it useful to a keyboard user.
    const firstFocusable = page
      .locator("a[href], button, input, select, textarea, [tabindex]")
      .first();
    await expect(firstFocusable).toHaveAttribute("href", "#main-content");

    // Reaching it with the first Tab is asserted on Chromium only, and must run
    // before any programmatic focus so the tab order starts at the document
    // top. WebKit does not move focus to links on Tab unless the user enables
    // "Press Tab to highlight each item" in Safari's settings, so asserting it
    // there would test a browser preference rather than our markup.
    if (browserName === "chromium") {
      await page.keyboard.press("Tab");
      await expect(skipLink).toBeFocused();
    }

    // Focusable and visible-when-focused in every browser.
    await skipLink.focus();
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();
  });

  test("every page has exactly one h1", async ({ page }) => {
    for (const path of ["/", "/about", "/chapters"]) {
      await page.goto(path);
      await expect(page.locator("h1")).toHaveCount(1);
    }
  });

  test("zoom is not disabled", async ({ page }) => {
    await page.goto("/");
    const viewport = await page
      .locator('meta[name="viewport"]')
      .getAttribute("content");

    // Clamping zoom fails WCAG 1.4.4 and hurts the readers most likely to
    // need it, so this is asserted rather than left to review.
    expect(viewport).not.toContain("user-scalable=no");
    expect(viewport).not.toContain("maximum-scale=1");
  });
});

test.describe("PWA", () => {
  test("serves a valid manifest", async ({ request }) => {
    const response = await request.get("/manifest.webmanifest");
    expect(response.ok()).toBe(true);

    const manifest = await response.json();
    expect(manifest.display).toBe("standalone");
    expect(manifest.lang).toBe("mr");
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test("robots.txt keeps private areas out of search results", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.ok()).toBe(true);

    const body = await response.text();
    expect(body).toContain("/admin");
    expect(body).toContain("Sitemap:");
  });
});
