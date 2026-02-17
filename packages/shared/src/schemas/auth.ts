import { z } from "zod";

export const loginRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const loginResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string(),
    username: z.string(),
  }),
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;
