import { z } from "zod";

export const loginFormSchema = z.object({
  email: z
    .email("Please enter a valid email address.")
    .min(1, "Email is required.")
    .toLowerCase(),
  password: z
    .string()
    .min(1, "Password is required."),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;