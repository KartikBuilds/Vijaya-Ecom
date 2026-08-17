-- Roles
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE TEXT USING CASE WHEN "role"::TEXT = 'ADMIN' THEN 'SUPER_ADMIN' ELSE "role"::TEXT END;
DROP TYPE "Role";
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'PRODUCT_MANAGER', 'CONTENT_MANAGER', 'ORDER_MANAGER');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role" USING "role"::"Role";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'PRODUCT_MANAGER';

-- Expanded publishing lifecycles
ALTER TYPE "ProductStatus" ADD VALUE IF NOT EXISTS 'SCHEDULED';
ALTER TYPE "ProductStatus" ADD VALUE IF NOT EXISTS 'HIDDEN';
ALTER TYPE "ReviewStatus" ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE "ReviewStatus" ADD VALUE IF NOT EXISTS 'APPROVED';
ALTER TYPE "ReviewStatus" ADD VALUE IF NOT EXISTS 'REJECTED';
ALTER TYPE "ReviewStatus" ADD VALUE IF NOT EXISTS 'SCHEDULED';
ALTER TYPE "ReviewStatus" ADD VALUE IF NOT EXISTS 'HIDDEN';
ALTER TYPE "RecipeStatus" ADD VALUE IF NOT EXISTS 'SCHEDULED';
ALTER TYPE "RecipeStatus" ADD VALUE IF NOT EXISTS 'HIDDEN';

CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'DISABLED', 'BLOCKED');
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'HIDDEN', 'ARCHIVED');
CREATE TYPE "UgcStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'HIDDEN', 'ARCHIVED');
CREATE TYPE "FeedbackCategory" AS ENUM ('GENERAL_INQUIRY', 'PRODUCT_QUESTION', 'RECIPE_QUESTION', 'WEBSITE_FEEDBACK', 'COMPLAINT', 'BUSINESS_INQUIRY');
CREATE TYPE "FeedbackStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'RESOLVED', 'ARCHIVED');
CREATE TYPE "BannerPlacement" AS ENUM ('HOME_HERO', 'HOME_PROMO', 'PRODUCTS_TOP', 'PREORDER', 'GLOBAL_NOTICE');
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT', 'BRAND_ASSET', 'EXTERNAL');
CREATE TYPE "AnalyticsEventType" AS ENUM ('PRODUCT_VIEW', 'RECIPE_VIEW', 'SEARCH', 'SEARCH_NO_RESULT', 'ADD_TO_CART', 'WISHLIST_ADD', 'WHATSAPP_CLICK', 'PREORDER_CLICK');
CREATE TYPE "NotificationType" AS ENUM ('NEW_CUSTOMER', 'NEW_REVIEW', 'REVIEW_AWAITING_MODERATION', 'NEW_PREORDER', 'PRODUCT_SCHEDULED', 'PRODUCT_PUBLISHED', 'NEW_CUSTOMER_COOKING_SUBMISSION', 'LOW_STOCK', 'NEW_ORDER', 'FAILED_PAYMENT', 'SECURITY_EVENT', 'ADMIN_ACCOUNT_CHANGE');

ALTER TABLE "User"
  ADD COLUMN "username" TEXT,
  ADD COLUMN "displayName" TEXT,
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "profilePhoto" TEXT,
  ADD COLUMN "bio" TEXT,
  ADD COLUMN "lastLoginAt" TIMESTAMP(3),
  ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "twoFactorPending" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "AdminSession"
  ADD COLUMN "userAgent" TEXT,
  ADD COLUMN "ipAddress" TEXT;

ALTER TABLE "Product"
  ADD COLUMN "pinned" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "preorderMessage" TEXT,
  ADD COLUMN "expectedDispatch" TEXT,
  ADD COLUMN "publishAt" TIMESTAMP(3),
  ADD COLUMN "unpublishAt" TIMESTAMP(3);

ALTER TABLE "Recipe"
  ADD COLUMN "pinned" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "publishAt" TIMESTAMP(3),
  ADD COLUMN "unpublishAt" TIMESTAMP(3);

ALTER TABLE "Review"
  ADD COLUMN "customerId" TEXT,
  ADD COLUMN "pinned" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "moderationNotes" TEXT,
  ADD COLUMN "publishAt" TIMESTAMP(3),
  ADD COLUMN "unpublishAt" TIMESTAMP(3);

CREATE TABLE "Customer" (
  "id" TEXT NOT NULL,
  "name" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "passwordHash" TEXT,
  "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
  "statusReason" TEXT,
  "lastLoginAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomerSession" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "userAgent" TEXT,
  "ipAddress" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomerSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuthThrottle" (
  "id" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "keyHash" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "blockedUntil" TIMESTAMP(3),
  "lastAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuthThrottle_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomerActivity" (
  "id" TEXT NOT NULL,
  "customerId" TEXT,
  "type" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "entityType" TEXT,
  "entityId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomerActivity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserGeneratedContent" (
  "id" TEXT NOT NULL,
  "customerId" TEXT,
  "imagePath" TEXT,
  "caption" TEXT,
  "productId" TEXT,
  "recipeId" TEXT,
  "status" "UgcStatus" NOT NULL DEFAULT 'PENDING',
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "pinned" BOOLEAN NOT NULL DEFAULT false,
  "moderationNotes" TEXT,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserGeneratedContent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MediaAsset" (
  "id" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "type" "MediaType" NOT NULL,
  "altText" TEXT,
  "width" INTEGER,
  "height" INTEGER,
  "sizeBytes" INTEGER,
  "provider" TEXT NOT NULL DEFAULT 'local-or-external',
  "usageNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Banner" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "imagePath" TEXT,
  "ctaLabel" TEXT,
  "ctaUrl" TEXT,
  "placement" "BannerPlacement" NOT NULL,
  "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "pinned" BOOLEAN NOT NULL DEFAULT false,
  "publishAt" TIMESTAMP(3),
  "unpublishAt" TIMESTAMP(3),
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Feedback" (
  "id" TEXT NOT NULL,
  "name" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "category" "FeedbackCategory" NOT NULL DEFAULT 'GENERAL_INQUIRY',
  "status" "FeedbackStatus" NOT NULL DEFAULT 'NEW',
  "subject" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "internalNotes" TEXT,
  "assignedToId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT,
  "entityType" TEXT,
  "entityId" TEXT,
  "href" TEXT,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AnalyticsEvent" (
  "id" TEXT NOT NULL,
  "type" "AnalyticsEventType" NOT NULL,
  "productId" TEXT,
  "recipeId" TEXT,
  "searchQuery" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "adminId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "summary" TEXT NOT NULL,
  "changes" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");
CREATE UNIQUE INDEX "CustomerSession_tokenHash_key" ON "CustomerSession"("tokenHash");
CREATE INDEX "CustomerSession_customerId_idx" ON "CustomerSession"("customerId");
CREATE INDEX "CustomerSession_expiresAt_idx" ON "CustomerSession"("expiresAt");
CREATE UNIQUE INDEX "AuthThrottle_scope_keyHash_key" ON "AuthThrottle"("scope", "keyHash");
CREATE INDEX "AuthThrottle_blockedUntil_idx" ON "AuthThrottle"("blockedUntil");
CREATE INDEX "Product_status_publishAt_unpublishAt_idx" ON "Product"("status", "publishAt", "unpublishAt");
CREATE INDEX "Product_pinned_featured_sortOrder_idx" ON "Product"("pinned", "featured", "sortOrder");
CREATE INDEX "Recipe_status_publishAt_unpublishAt_idx" ON "Recipe"("status", "publishAt", "unpublishAt");
CREATE INDEX "Recipe_pinned_featured_sortOrder_idx" ON "Recipe"("pinned", "featured", "sortOrder");
CREATE INDEX "Review_status_publishAt_unpublishAt_idx" ON "Review"("status", "publishAt", "unpublishAt");
CREATE INDEX "Review_pinned_featured_sortOrder_idx" ON "Review"("pinned", "featured", "sortOrder");
CREATE INDEX "Customer_status_createdAt_idx" ON "Customer"("status", "createdAt");
CREATE INDEX "CustomerActivity_customerId_createdAt_idx" ON "CustomerActivity"("customerId", "createdAt");
CREATE INDEX "CustomerActivity_type_createdAt_idx" ON "CustomerActivity"("type", "createdAt");
CREATE INDEX "UserGeneratedContent_status_featured_pinned_idx" ON "UserGeneratedContent"("status", "featured", "pinned");
CREATE INDEX "UserGeneratedContent_submittedAt_idx" ON "UserGeneratedContent"("submittedAt");
CREATE INDEX "MediaAsset_type_createdAt_idx" ON "MediaAsset"("type", "createdAt");
CREATE INDEX "Banner_placement_status_publishAt_unpublishAt_idx" ON "Banner"("placement", "status", "publishAt", "unpublishAt");
CREATE INDEX "Banner_pinned_featured_sortOrder_idx" ON "Banner"("pinned", "featured", "sortOrder");
CREATE INDEX "Feedback_status_category_createdAt_idx" ON "Feedback"("status", "category", "createdAt");
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");
CREATE INDEX "Notification_type_createdAt_idx" ON "Notification"("type", "createdAt");
CREATE INDEX "AnalyticsEvent_type_createdAt_idx" ON "AnalyticsEvent"("type", "createdAt");
CREATE INDEX "AnalyticsEvent_productId_createdAt_idx" ON "AnalyticsEvent"("productId", "createdAt");
CREATE INDEX "AnalyticsEvent_recipeId_createdAt_idx" ON "AnalyticsEvent"("recipeId", "createdAt");
CREATE INDEX "AuditLog_adminId_createdAt_idx" ON "AuditLog"("adminId", "createdAt");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

ALTER TABLE "Review" ADD CONSTRAINT "Review_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CustomerSession" ADD CONSTRAINT "CustomerSession_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerActivity" ADD CONSTRAINT "CustomerActivity_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UserGeneratedContent" ADD CONSTRAINT "UserGeneratedContent_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
