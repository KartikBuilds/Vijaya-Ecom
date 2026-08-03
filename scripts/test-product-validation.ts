import assert from "node:assert/strict";
import { normalizeSlug } from "../lib/products/slug";
import { validateProductForm } from "../lib/products/validation";

function form(overrides: Record<string, string> = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ name: "Test Premix", slug: "test-premix", categoryId: "category", imagePath: "/assets/images/products/test.jpeg", price: "199.00", compareAtPrice: "249.50", status: "DRAFT", sortOrder: "0", ...overrides })) data.set(key, value);
  return data;
}

assert.equal(normalizeSlug("  Butter Chicken Premix! "), "butter-chicken-premix");
assert.equal(validateProductForm(form()).success, true);
const negative = validateProductForm(form({ price: "-1" }));
assert.equal(negative.success, false);
if (!negative.success) assert.match(negative.state.errors?.price?.[0] ?? "", /negative/i);
const invalidCompare = validateProductForm(form({ price: "249.50", compareAtPrice: "199.00" }));
assert.equal(invalidCompare.success, false);
const dangerousImage = validateProductForm(form({ imagePath: "javascript:alert(1)" }));
assert.equal(dangerousImage.success, false);
console.log("Product validation checks passed.");
