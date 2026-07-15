// import { z } from "zod";

// export const loginFormSchema = z.object({
//   email: z
//     .email("Please enter a valid email address.")
//     .min(1, "Email is required.")
//     .toLowerCase(),
//   password: z
//     .string()
//     .min(1, "Password is required."),
// });

// export type LoginFormValues = z.infer<typeof loginFormSchema>;

// import { z } from "zod";

// const phoneRegex = /^\+?[1-9]\d{1,14}$/;

// export const loginMobileSchema = z.object({
//   mobile: z
//     .string()
//     .trim()
//     .regex(phoneRegex, "Must be a valid mobile number (e.g., +919876543210)"),
//   // Ready for when you enable passwords later
//   password: z.string().optional(), 
// });

// export const loginOtpSchema = z.object({
//   mobile_otp: z // MATCHES BACKEND
//     .string()
//     .length(6, "OTP must be exactly 6 digits")
//     .regex(/^\d+$/, "OTP must contain only numbers"),
// });

// export type LoginMobileValues = z.infer<typeof loginMobileSchema>;
// export type LoginOtpValues = z.infer<typeof loginOtpSchema>;


import { z } from "zod";

const phoneRegex = /^\+?[1-9]\d{1,14}$/;

export const loginMobileSchema = z.object({
  mobile: z
    .string()
    .trim()
    .regex(phoneRegex, "Must be a valid mobile number (e.g., +919876543210)"),
  password: z.string().min(1, "Password is required"),
});

export const loginOtpSchema = z.object({
  mobile_otp: z
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d+$/, "OTP must contain only numbers"),
});

export const combinedLoginSchema = loginMobileSchema.extend({
  mobile_otp: loginOtpSchema.shape.mobile_otp.optional(), 
});

export type LoginWizardValues = z.infer<typeof combinedLoginSchema>;