import { z } from "zod";

export const createUserSchema = z.object({
  email:  z.email({ message: "E-mail inválido" }),
  password:  z
  .string()
//   .min(8, { message: "Mínimo de 8 caracteres" })
//   .regex(/[A-Z]/, { message: "Deve conter ao menos 1 letra maiúscula" })
//   .regex(/[a-z]/, { message: "Deve conter ao menos 1 letra minúscula" })
//   .regex(/[0-9]/, { message: "Deve conter ao menos 1 número" })
//   .regex(/[^A-Za-z0-9]/, { message: "Deve conter ao menos 1 símbolo" }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
