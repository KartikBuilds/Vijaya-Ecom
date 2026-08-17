import { z } from "zod";

const phonePattern = /^[0-9+\-()\s]{0,30}$/;
const normalizeCustomerEmail = (email: string) => email.trim().toLowerCase();

export const customerSignupSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(120, "Name is too long."),
  email: z.string().trim().max(254, "Email is too long.").email("Enter a valid email.").transform(normalizeCustomerEmail),
  mobile: z.string().trim().max(30, "Phone number is too long.").refine((value) => phonePattern.test(value), "Enter a valid phone number.").transform((value) => value || null),
  password: z.string().min(8, "Password must be at least 8 characters.").max(128, "Password is too long."),
  confirm: z.string(),
  terms: z.literal("on", { error: "Accept the account terms." }),
}).superRefine((value, context) => {
  if (value.password !== value.confirm) {
    context.addIssue({ code: "custom", path: ["confirm"], message: "Passwords must match." });
  }
});

export type CustomerSignupInput = z.infer<typeof customerSignupSchema>;
