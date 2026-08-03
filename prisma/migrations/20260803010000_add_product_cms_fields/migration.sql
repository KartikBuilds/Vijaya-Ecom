ALTER TABLE "Product"
  ALTER COLUMN "preparationTime" TYPE TEXT USING "preparationTime"::TEXT,
  ALTER COLUMN "servings" TYPE TEXT USING "servings"::TEXT,
  ADD COLUMN "seoTitle" TEXT,
  ADD COLUMN "seoDescription" TEXT;
