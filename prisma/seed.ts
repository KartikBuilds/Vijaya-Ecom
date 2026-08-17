import { PrismaClient, ProductStatus, Role } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const seededProducts = [
  ["Brown Gravy Premix", "brown-gravy-premix", "veg"],
  ["All-Purpose Gravy Premix", "all-purpose-gravy-premix", "veg"],
  ["Butter Chicken Premix", "butter-chicken-premix", "non-veg"],
  ["Chicken Tikka Premix", "chicken-tikka-premix", "non-veg"],
  ["Fish Fry Premix", "fish-fry-premix", "non-veg"],
  ["Fish Gravy Premix", "fish-gravy-premix", "non-veg"],
  ["Kadhai Chicken Premix", "kadhai-chicken-premix", "non-veg"],
] as const;

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminUsername = process.env.ADMIN_USERNAME?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminUsername || !adminPassword) throw new Error("ADMIN_EMAIL, ADMIN_USERNAME and ADMIN_PASSWORD are required to seed the admin user.");
  if (!/^[A-Za-z0-9_.-]{3,40}$/.test(adminUsername)) throw new Error("ADMIN_USERNAME must be 3-40 characters and contain only letters, numbers, dots, underscores, or hyphens.");
  if (adminPassword.length < 12 || adminPassword.length > 128) throw new Error("ADMIN_PASSWORD must be between 12 and 128 characters.");

  const [veg, nonVeg] = await Promise.all([
    prisma.category.upsert({ where: { slug: "veg" }, update: { name: "Veg" }, create: { name: "Veg", slug: "veg" } }),
    prisma.category.upsert({ where: { slug: "non-veg" }, update: { name: "Non-Veg" }, create: { name: "Non-Veg", slug: "non-veg" } }),
  ]);

  for (const [name, slug, categorySlug] of seededProducts) {
    await prisma.product.upsert({
      where: { slug },
      update: { name, categoryId: categorySlug === "veg" ? veg.id : nonVeg.id, imagePath: `/assets/images/products/${slug}.jpeg`, price: null, compareAtPrice: null, preparationTime: null, servings: null, preorder: false, status: ProductStatus.PUBLISHED },
      create: { name, slug, categoryId: categorySlug === "veg" ? veg.id : nonVeg.id, imagePath: `/assets/images/products/${slug}.jpeg`, price: null, compareAtPrice: null, preparationTime: null, servings: null, featured: false, preorder: false, status: ProductStatus.PUBLISHED, sortOrder: seededProducts.findIndex((product) => product[1] === slug) },
    });
  }

  const passwordHash = await hash(adminPassword, 12);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { username: adminUsername, displayName: adminUsername, passwordHash, role: Role.SUPER_ADMIN, active: true },
    create: { email: adminEmail, username: adminUsername, displayName: adminUsername, passwordHash, role: Role.SUPER_ADMIN, active: true },
  });
  console.log("Seed completed: admin, 2 categories, and 7 products are ready.");
}

main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : "Seed failed."); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
