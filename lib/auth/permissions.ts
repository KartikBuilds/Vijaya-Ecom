import "server-only";
import { notFound } from "next/navigation";
import { Role, type User } from "@prisma/client";
import { requireAdmin } from "@/lib/auth/session";

export type Permission =
  | "profile:write"
  | "security:write"
  | "products:write"
  | "recipes:write"
  | "reviews:moderate"
  | "content:write"
  | "media:write"
  | "customers:write"
  | "feedback:write"
  | "notifications:write"
  | "analytics:read"
  | "team:write"
  | "roles:read"
  | "settings:write"
  | "activity:read";

const permissionsByRole: Record<Role, Permission[]> = {
  SUPER_ADMIN: ["profile:write", "security:write", "products:write", "recipes:write", "reviews:moderate", "content:write", "media:write", "customers:write", "feedback:write", "notifications:write", "analytics:read", "team:write", "roles:read", "settings:write", "activity:read"],
  PRODUCT_MANAGER: ["profile:write", "security:write", "products:write", "media:write", "analytics:read"],
  CONTENT_MANAGER: ["profile:write", "security:write", "recipes:write", "reviews:moderate", "content:write", "media:write", "notifications:write", "analytics:read"],
  ORDER_MANAGER: ["profile:write", "security:write", "customers:write", "feedback:write", "notifications:write", "analytics:read"],
};

export function can(user: Pick<User, "role">, permission: Permission) {
  if (user.role === Role.SUPER_ADMIN) return true;
  return permissionsByRole[user.role]?.includes(permission) ?? false;
}

export async function requirePermission(permission: Permission) {
  const session = await requireAdmin();
  if (!can(session.user, permission)) notFound();
  return session;
}

export async function requireRole(...roles: Role[]) {
  const session = await requireAdmin();
  if (!roles.includes(session.user.role)) notFound();
  return session;
}

export const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  PRODUCT_MANAGER: "Product Manager",
  CONTENT_MANAGER: "Content Manager",
  ORDER_MANAGER: "Order Manager",
};

export { permissionsByRole };
