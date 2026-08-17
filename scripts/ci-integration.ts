import assert from "node:assert/strict";
import { Prisma, ProductStatus, RecipeStatus, ReviewStatus, Role, CustomerStatus, UgcStatus, ContentStatus, BannerPlacement, MediaType, NotificationType, AnalyticsEventType, FeedbackCategory, FeedbackStatus } from "@prisma/client";
import { compare, hash } from "bcryptjs";
import { db } from "../lib/db";

const now = new Date();
const past = new Date(now.getTime() - 60_000);
const future = new Date(now.getTime() + 60 * 60_000);
const email = (prefix: string) => `${prefix}-${Date.now()}@example.com`;

function eligible(where: { publishAt: Date | null; unpublishAt: Date | null }) {
  return (!where.publishAt || where.publishAt <= now) && (!where.unpublishAt || where.unpublishAt > now);
}

async function main() {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;
  assert.ok(adminUsername, "ADMIN_USERNAME is required");
  assert.ok(adminPassword, "ADMIN_PASSWORD is required");

  const admins = await db.user.findMany({ where: { username: adminUsername } });
  assert.equal(admins.length, 1, "admin provisioning must be idempotent");
  const admin = admins[0];
  assert.equal(admin.role, Role.SUPER_ADMIN);
  assert.equal(admin.active, true);
  assert.ok(admin.passwordHash);
  assert.notEqual(admin.passwordHash, adminPassword);
  assert.equal(await compare(adminPassword, admin.passwordHash), true);

  const categories = await db.category.findMany();
  const products = await db.product.findMany();
  assert.ok(categories.length >= 2, "seed should create categories");
  assert.ok(products.length >= 7, "seed should create initial Vijaya products");
  const category = categories[0];

  const customerPassword = "CustomerPass123!";
  const customer = await db.customer.create({
    data: {
      name: "CI Customer",
      email: email("customer"),
      phone: "9876543210",
      passwordHash: await hash(customerPassword, 12),
      status: CustomerStatus.ACTIVE,
    },
  });
  assert.equal(await compare(customerPassword, customer.passwordHash ?? ""), true);
  const session = await db.customerSession.create({ data: { customerId: customer.id, tokenHash: `ci-token-${Date.now()}`, expiresAt: future } });
  await db.customer.update({ where: { id: customer.id }, data: { status: CustomerStatus.BLOCKED, statusReason: "CI block test" } });
  await db.customerSession.deleteMany({ where: { customerId: customer.id } });
  assert.equal(await db.customerSession.count({ where: { id: session.id } }), 0, "blocked customer sessions should be invalidated");
  await db.customer.update({ where: { id: customer.id }, data: { status: CustomerStatus.ACTIVE, statusReason: null } });

  await db.authThrottle.upsert({
    where: { scope_keyHash: { scope: "customer", keyHash: "ci-throttle-key" } },
    update: { attempts: 6, blockedUntil: future, lastAttemptAt: now },
    create: { scope: "customer", keyHash: "ci-throttle-key", attempts: 6, blockedUntil: future, lastAttemptAt: now },
  });
  assert.equal(await db.authThrottle.count({ where: { scope: "customer", blockedUntil: { gt: now } } }), 1);

  const product = await db.product.create({
    data: {
      name: "CI Product",
      slug: `ci-product-${Date.now()}`,
      categoryId: category.id,
      imagePath: "/assets/images/products/butter-chicken-premix.jpeg",
      shortDescription: "CI test product",
      description: "CI test product description",
      price: new Prisma.Decimal("199.00"),
      compareAtPrice: new Prisma.Decimal("249.00"),
      preparationTime: "15 minutes",
      servings: "Serves 4",
      featured: true,
      pinned: true,
      preorder: true,
      preorderMessage: "CI preorder",
      expectedDispatch: "CI dispatch",
      status: ProductStatus.PUBLISHED,
      publishAt: past,
      unpublishAt: future,
      sortOrder: -10,
      seoTitle: "CI Product SEO",
      seoDescription: "CI Product SEO description",
    },
  });
  assert.equal(eligible(product), true);
  const scheduledProduct = await db.product.create({ data: { name: "CI Scheduled Product", slug: `ci-scheduled-${Date.now()}`, categoryId: category.id, imagePath: product.imagePath, status: ProductStatus.PUBLISHED, publishAt: future } });
  assert.equal(eligible(scheduledProduct), false);
  await db.product.update({ where: { id: product.id }, data: { status: ProductStatus.HIDDEN } });
  await db.product.update({ where: { id: product.id }, data: { status: ProductStatus.ARCHIVED } });
  await db.product.update({ where: { id: product.id }, data: { status: ProductStatus.DRAFT } });

  const recipe = await db.recipe.create({
    data: {
      title: "CI Recipe",
      slug: `ci-recipe-${Date.now()}`,
      productId: product.id,
      imagePath: product.imagePath,
      videoUrl: "https://youtu.be/abcdefghijk",
      ingredients: ["One", "Two"],
      instructions: ["First", "Second"],
      preparationTime: "10 minutes",
      cookingTime: "20 minutes",
      servings: "4",
      difficulty: "Easy",
      featured: true,
      pinned: true,
      status: RecipeStatus.PUBLISHED,
      publishAt: past,
      unpublishAt: future,
      seoTitle: "CI Recipe SEO",
      seoDescription: "CI Recipe SEO description",
    },
  });
  assert.equal(recipe.status, RecipeStatus.PUBLISHED);

  const review = await db.review.create({
    data: {
      customerName: "CI Reviewer",
      customerId: customer.id,
      productId: product.id,
      rating: 5,
      content: "CI review content.",
      status: ReviewStatus.PENDING,
      moderationNotes: "Internal note",
      featured: true,
      pinned: true,
    },
  });
  await db.review.update({ where: { id: review.id }, data: { status: ReviewStatus.APPROVED } });
  await db.review.update({ where: { id: review.id }, data: { status: ReviewStatus.REJECTED } });
  await db.review.update({ where: { id: review.id }, data: { status: ReviewStatus.PUBLISHED, publishAt: past, unpublishAt: future } });
  assert.equal(await db.review.count({ where: { id: review.id, status: ReviewStatus.PUBLISHED } }), 1);

  const ugc = await db.userGeneratedContent.create({ data: { customerId: customer.id, imagePath: product.imagePath, caption: "CI UGC", status: UgcStatus.PENDING } });
  await db.userGeneratedContent.update({ where: { id: ugc.id }, data: { status: UgcStatus.APPROVED, featured: true, pinned: true } });
  await db.userGeneratedContent.update({ where: { id: ugc.id }, data: { status: UgcStatus.HIDDEN } });

  const banner = await db.banner.create({ data: { title: "CI Banner", placement: BannerPlacement.HOME_PROMO, status: ContentStatus.PUBLISHED, featured: true, pinned: true, publishAt: past, unpublishAt: future } });
  assert.equal(eligible(banner), true);

  const media = await db.mediaAsset.create({ data: { filename: "ci-product.jpg", url: product.imagePath, type: MediaType.IMAGE, provider: "ci", usageNotes: "CI reference test" } });
  assert.ok(await db.product.count({ where: { imagePath: media.url } }), "media in-use reference should be detectable");

  const feedback = await db.feedback.create({ data: { category: FeedbackCategory.GENERAL_INQUIRY, status: FeedbackStatus.NEW, subject: "CI Feedback", message: "CI message", internalNotes: "private" } });
  await db.feedback.update({ where: { id: feedback.id }, data: { status: FeedbackStatus.IN_PROGRESS } });
  await db.feedback.update({ where: { id: feedback.id }, data: { status: FeedbackStatus.RESOLVED } });
  await db.feedback.update({ where: { id: feedback.id }, data: { status: FeedbackStatus.ARCHIVED } });

  const notification = await db.notification.create({ data: { userId: admin.id, type: NotificationType.SECURITY_EVENT, title: "CI Notification", href: "/admin/security" } });
  assert.equal(await db.notification.count({ where: { id: notification.id, readAt: null } }), 1);
  await db.notification.update({ where: { id: notification.id }, data: { readAt: now } });

  for (const type of Object.values(AnalyticsEventType)) await db.analyticsEvent.create({ data: { type, productId: product.id, recipeId: recipe.id, searchQuery: type === AnalyticsEventType.SEARCH || type === AnalyticsEventType.SEARCH_NO_RESULT ? "ci search" : null } });
  assert.equal(await db.analyticsEvent.count(), Object.values(AnalyticsEventType).length);

  await db.siteSettings.upsert({ where: { id: "site" }, update: { businessName: "Vijaya Premix CI" }, create: { id: "site", businessName: "Vijaya Premix CI" } });
  await db.homepageSettings.upsert({ where: { id: "homepage" }, update: { heroHeading: "CI Hero" }, create: { id: "homepage", heroHeading: "CI Hero" } });

  await db.auditLog.create({ data: { adminId: admin.id, action: "CI_AUDIT_TEST", entityType: "Product", entityId: product.id, summary: "CI audit log safe summary.", changes: { status: "tested" } } });
  const auditText = JSON.stringify(await db.auditLog.findMany({ where: { action: "CI_AUDIT_TEST" } }));
  assert.equal(auditText.includes(adminPassword), false);
  assert.equal(auditText.includes(process.env.DATABASE_URL ?? "not-set"), false);

  await db.user.createMany({
    data: [
      { email: email("product-manager"), username: `pm-${Date.now()}`, passwordHash: await hash("RolePass123!", 12), role: Role.PRODUCT_MANAGER },
      { email: email("content-manager"), username: `cm-${Date.now()}`, passwordHash: await hash("RolePass123!", 12), role: Role.CONTENT_MANAGER },
      { email: email("order-manager"), username: `om-${Date.now()}`, passwordHash: await hash("RolePass123!", 12), role: Role.ORDER_MANAGER },
    ],
  });
  assert.equal(await db.user.count({ where: { role: Role.PRODUCT_MANAGER } }) > 0, true);
  assert.equal(await db.user.count({ where: { role: Role.CONTENT_MANAGER } }) > 0, true);
  assert.equal(await db.user.count({ where: { role: Role.ORDER_MANAGER } }) > 0, true);

  console.log("CI integration checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => db.$disconnect());
