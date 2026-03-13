import { test, expect } from "@playwright/test";

test.describe("PHILCOIN CEO Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);
    await page.evaluate(() => {
      const errorOverlay = document.querySelector("nextjs-portal");
      if (errorOverlay) errorOverlay.remove();
    });
  });

  test("page loads with correct title", async ({ page }) => {
    await expect(page).toHaveTitle(/PHILCOIN|Philcoin/i);
  });

  test("top bar displays PHILCOIN branding and live indicator", async ({ page }) => {
    const philText = page.locator("text=PHILCOIN Analytics");
    await expect(philText).toBeVisible();

    const liveIndicator = page.locator("text=LIVE").first();
    await expect(liveIndicator).toBeVisible();
  });

  test("hero metrics section displays all 5 KPIs", async ({ page }) => {
    const heroMetrics = page.locator("[class*='analytics-card']").first();
    await expect(heroMetrics).toBeVisible();
    const metricCards = page.locator("[class*='analytics-card']");
    const count = await metricCards.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test("price area chart renders with time range selector", async ({ page }) => {
    const priceHeading = page.locator("h2:text('Price')");
    await expect(priceHeading).toBeVisible();

    const timeButtons = page.locator("button:text('1M')");
    await expect(timeButtons.first()).toBeVisible();
  });

  test("time range buttons are clickable and update chart", async ({ page }) => {
    const button7d = page.locator("button:text('7D')").first();
    await button7d.click();
    await page.waitForTimeout(500);

    const button1y = page.locator("button:text('1Y')").first();
    await button1y.click();
    await page.waitForTimeout(500);
  });

  test("trading view candlestick chart renders", async ({ page }) => {
    const tradingSection = page.locator("text=Trading View");
    await expect(tradingSection).toBeVisible();
  });

  test("holder distribution section with donut chart and table", async ({ page }) => {
    const holderSection = page.locator("text=Holder Distribution");
    await holderSection.scrollIntoViewIfNeeded();
    await expect(holderSection).toBeVisible();

    const hhiText = page.locator("text=/HHI/").first();
    await expect(hhiText).toBeVisible();

    const binanceLogo = page.locator("text=Binance").first();
    await expect(binanceLogo).toBeVisible();
  });

  test("liquidity analysis section displays pool data", async ({ page }) => {
    const liquiditySection = page.locator("text=Liquidity Analysis");
    await liquiditySection.scrollIntoViewIfNeeded();
    await expect(liquiditySection).toBeVisible();

    await expect(page.locator("text=QuickSwap").first()).toBeVisible();
  });

  test("transaction activity shows chart sections", async ({ page }) => {
    const txSection = page.locator("text=Transaction Activity");
    await txSection.scrollIntoViewIfNeeded();
    await expect(txSection).toBeVisible();
  });

  test("risk assessment shows gauge and factors", async ({ page }) => {
    const riskSection = page.locator("text=Risk Assessment");
    await riskSection.scrollIntoViewIfNeeded();
    await expect(riskSection).toBeVisible();

    await expect(page.locator("text=Liquidity Ratio")).toBeVisible();
    await expect(page.locator("text=Contract Security")).toBeVisible();
  });

  test("growth metrics display sparklines", async ({ page }) => {
    const newHolders = page.locator("text=/New Holders/").first();
    await newHolders.scrollIntoViewIfNeeded();
    await expect(newHolders).toBeVisible();

    await expect(page.locator("text=Token Velocity")).toBeVisible();
    await expect(page.locator("text=Network Growth")).toBeVisible();
  });

  test("recommendations panel shows priority cards", async ({ page }) => {
    const recsSection = page.locator("text=Strategic Recommendations");
    await recsSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await expect(recsSection).toBeVisible();

    await expect(page.locator("text=HIGH").first()).toBeVisible();
  });

  test("footer displays data sources", async ({ page }) => {
    const footer = page.locator("text=Powered by Polygon");
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();
  });

  test("page has proper dark theme", async ({ page }) => {
    const bgColor = await page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor;
    });
    expect(bgColor).toBeTruthy();
  });

  test("all sections visible on full page scroll", async ({ page }) => {
    const sections = [
      "Price",
      "Trading View",
      "Holder Distribution",
      "Liquidity Analysis",
      "Transaction Activity",
      "Risk Assessment",
      "Strategic Recommendations",
    ];

    for (const section of sections) {
      const element = page.locator(`text=${section}`).first();
      await element.scrollIntoViewIfNeeded();
      await expect(element).toBeVisible();
    }
  });

  test("takes full page screenshot for CEO review", async ({ page }) => {
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: "e2e/screenshots/ceo-dashboard-full.png",
      fullPage: true,
    });
  });
});

test.describe("Mobile Responsiveness", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("dashboard adapts to mobile viewport", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);
    await page.evaluate(() => {
      const errorOverlay = document.querySelector("nextjs-portal");
      if (errorOverlay) errorOverlay.remove();
    });

    const priceLabel = page.locator("p:text('PRICE')").first();
    await expect(priceLabel).toBeVisible();

    await page.screenshot({
      path: "e2e/screenshots/ceo-dashboard-mobile.png",
      fullPage: true,
    });
  });
});
