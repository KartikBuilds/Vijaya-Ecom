import { ContentStatus, ProductStatus, RecipeStatus, ReviewStatus } from "@prisma/client";

export function publicScheduleWhere(now = new Date()) {
  return {
    AND: [
      { OR: [{ publishAt: null }, { publishAt: { lte: now } }] },
      { OR: [{ unpublishAt: null }, { unpublishAt: { gt: now } }] },
    ],
  };
}

export function publicProductWhere(now = new Date()) {
  return { status: { in: [ProductStatus.PUBLISHED, ProductStatus.SCHEDULED] }, ...publicScheduleWhere(now) };
}

export function publicRecipeWhere(now = new Date()) {
  return { status: { in: [RecipeStatus.PUBLISHED, RecipeStatus.SCHEDULED] }, ...publicScheduleWhere(now) };
}

export function publicReviewWhere(now = new Date()) {
  return { status: { in: [ReviewStatus.PUBLISHED, ReviewStatus.SCHEDULED] }, ...publicScheduleWhere(now) };
}

export function publicContentWhere(now = new Date()) {
  return { status: { in: [ContentStatus.PUBLISHED, ContentStatus.SCHEDULED] }, ...publicScheduleWhere(now) };
}

export function validateScheduleWindow(value: { status: string; publishAt: Date | null; unpublishAt: Date | null }) {
  const issues: { path: string; message: string }[] = [];
  if (value.status === "SCHEDULED" && !value.publishAt) issues.push({ path: "publishAt", message: "Scheduled content requires a publish time." });
  if (value.publishAt && value.unpublishAt && value.unpublishAt <= value.publishAt) issues.push({ path: "unpublishAt", message: "Unpublish time must be after publish time." });
  return issues;
}
