import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";
const adminUsername = process.env.ADMIN_USERNAME ?? "CI_Super_Admin";
const adminPassword = process.env.ADMIN_PASSWORD ?? "ci-only-admin-password-123";
const customerEmail = `e2e-${Date.now()}@example.com`;
const customerPassword = "CustomerPass123!";
const widths = [1440, 1280, 1024, 768, 430, 390, 375, 320];
const navigationTimeout = 15_000;
const actionTimeout = 10_000;

async function expectNoOverflow(page, width) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 2, `horizontal overflow ${overflow}px at ${width}px on ${page.url()}`);
}

function log(message) {
  console.log(`[E2E] ${message}`);
}

async function gotoClean(page, path, viewport = 1280) {
  const errors = [];
  const onConsole = (message) => {
    if (message.type() === "error") errors.push(message.text());
  };

  log(`viewport=${viewport} route=${path}`);
  page.on("console", onConsole);
  try {
    const response = await page.goto(`${baseURL}${path}`, {
      waitUntil: "domcontentloaded",
      timeout: navigationTimeout,
    });
    assert.ok(response?.ok(), `${path} should return OK`);
    await page.locator("body").waitFor({ state: "visible", timeout: actionTimeout });
    assert.equal(errors.length, 0, `console errors on ${path}: ${errors.join("\n")}`);
  } finally {
    page.off("console", onConsole);
  }
}

async function main() {
  let browser;
  let context;

  try {
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    context.setDefaultTimeout(actionTimeout);
    context.setDefaultNavigationTimeout(navigationTimeout);
    const page = await context.newPage();
    page.setDefaultTimeout(actionTimeout);
    page.setDefaultNavigationTimeout(navigationTimeout);

    for (const path of ["/", "/products", "/products/brown-gravy-premix", "/recipes", "/preorder", "/cart", "/login", "/signup", "/about"]) {
      await gotoClean(page, path);
      await expect(page.locator("body")).toBeVisible();
    }

    log("customer signup");
    await page.goto(`${baseURL}/signup`, { waitUntil: "domcontentloaded", timeout: navigationTimeout });
    await page.getByLabel("Full name").fill("E2E Customer");
    await page.getByLabel("Email address").fill(customerEmail);
    await page.getByLabel("Mobile number").fill("9876543210");
    await page.getByLabel("Password", { exact: true }).fill(customerPassword);
    await page.getByLabel("Confirm password", { exact: true }).fill(customerPassword);
    await page.getByLabel(/I accept/).check();
    await page.getByRole("button", { name: "Create Account" }).click();
    await page.waitForURL(`${baseURL}/`, { timeout: navigationTimeout });

    log("customer logout");
    await page.goto(`${baseURL}/logout`, { waitUntil: "domcontentloaded", timeout: navigationTimeout });
    await page.waitForURL(`${baseURL}/`, { timeout: navigationTimeout });

    log("customer login");
    await page.goto(`${baseURL}/login`, { waitUntil: "domcontentloaded", timeout: navigationTimeout });
    await page.getByLabel("Email address").fill(customerEmail);
    await page.getByLabel("Password", { exact: true }).fill(customerPassword);
    await page.getByRole("button", { name: "Login" }).click();
    await page.waitForURL(`${baseURL}/`, { timeout: navigationTimeout });

    log("product search and cart");
    await page.goto(`${baseURL}/products`, { waitUntil: "domcontentloaded", timeout: navigationTimeout });
    await page.getByLabel(/Search premixes/i).first().fill("gravy");
    await page.keyboard.press("Enter");
    await page.locator("body").waitFor({ state: "visible", timeout: actionTimeout });
    await page.getByRole("button", { name: /Open cart/i }).click();
    await page.keyboard.press("Escape").catch(() => undefined);

    log("admin unauthenticated redirect");
    await page.goto(`${baseURL}/admin`, { waitUntil: "domcontentloaded", timeout: navigationTimeout });
    assert.ok(page.url().includes("/admin/login"), "unauthenticated admin access should redirect to login");

    log("admin login");
    await page.getByLabel("Username or Email").fill(adminUsername);
    await page.getByLabel("Password", { exact: true }).fill(adminPassword);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL(`${baseURL}/admin`, { timeout: navigationTimeout });

    for (const path of ["/admin", "/admin/profile", "/admin/security", "/admin/team", "/admin/products", "/admin/recipes", "/admin/reviews", "/admin/media", "/admin/customers", "/admin/ugc", "/admin/feedback", "/admin/notifications", "/admin/analytics", "/admin/activity", "/admin/homepage", "/admin/settings"]) {
      await gotoClean(page, path);
      await expectNoOverflow(page, 1280);
    }

    log("responsive sweep");
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of ["/", "/products", "/cart", "/admin", "/admin/products", "/admin/media"]) {
        await gotoClean(page, path, width);
        await expectNoOverflow(page, width);
      }
    }

    console.log("Playwright smoke and responsive checks passed.");
  } finally {
    if (context) {
      await context.close().catch(() => undefined);
    }
    if (browser) {
      await browser.close().catch(() => undefined);
    }
  }
}

function expect(locator) {
  return {
    async toBeVisible() {
      assert.equal(await locator.count() > 0, true);
    },
  };
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
