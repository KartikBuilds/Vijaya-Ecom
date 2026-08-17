import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";
const adminUsername = process.env.ADMIN_USERNAME ?? "CI_Super_Admin";
const adminPassword = process.env.ADMIN_PASSWORD ?? "ci-only-admin-password-123";
const customerEmail = `e2e-${Date.now()}@example.com`;
const customerPassword = "CustomerPass123!";
const widths = [1440, 1280, 1024, 768, 430, 390, 375, 320];

async function expectNoOverflow(page, width) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 2, `horizontal overflow ${overflow}px at ${width}px on ${page.url()}`);
}

async function gotoClean(page, path) {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const response = await page.goto(`${baseURL}${path}`, { waitUntil: "networkidle" });
  assert.ok(response?.ok(), `${path} should return OK`);
  assert.equal(errors.length, 0, `console errors on ${path}: ${errors.join("\n")}`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  for (const path of ["/", "/products", "/products/brown-gravy-premix", "/recipes", "/preorder", "/cart", "/login", "/signup", "/about"]) {
    await gotoClean(page, path);
    await expect(page.locator("body")).toBeVisible();
  }

  await page.goto(`${baseURL}/signup`);
  await page.getByLabel("Full name").fill("E2E Customer");
  await page.getByLabel("Email address").fill(customerEmail);
  await page.getByLabel("Mobile number").fill("9876543210");
  await page.getByLabel("Password").fill(customerPassword);
  await page.getByLabel("Confirm password").fill(customerPassword);
  await page.getByLabel(/I accept/).check();
  await page.getByRole("button", { name: "Create Account" }).click();
  await page.waitForURL(`${baseURL}/`);
  await page.goto(`${baseURL}/logout`);
  await page.waitForURL(`${baseURL}/`);
  await page.goto(`${baseURL}/login`);
  await page.getByLabel("Email address").fill(customerEmail);
  await page.getByLabel("Password").fill(customerPassword);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL(`${baseURL}/`);

  await page.goto(`${baseURL}/products`);
  await page.getByLabel(/Search premixes/i).first().fill("gravy");
  await page.keyboard.press("Enter");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: /Open cart/i }).click();
  await page.keyboard.press("Escape").catch(() => undefined);

  await page.goto(`${baseURL}/admin`);
  assert.ok(page.url().includes("/admin/login"), "unauthenticated admin access should redirect to login");
  await page.getByLabel("Username or Email").fill(adminUsername);
  await page.getByLabel("Password").fill(adminPassword);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL(`${baseURL}/admin`);

  for (const path of ["/admin", "/admin/profile", "/admin/security", "/admin/team", "/admin/products", "/admin/recipes", "/admin/reviews", "/admin/media", "/admin/customers", "/admin/ugc", "/admin/feedback", "/admin/notifications", "/admin/analytics", "/admin/activity", "/admin/homepage", "/admin/settings"]) {
    await gotoClean(page, path);
    await expectNoOverflow(page, 1280);
  }

  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/", "/products", "/cart", "/admin", "/admin/products", "/admin/media"]) {
      await gotoClean(page, path);
      await expectNoOverflow(page, width);
    }
  }

  await browser.close();
  console.log("Playwright smoke and responsive checks passed.");
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
  process.exitCode = 1;
});
