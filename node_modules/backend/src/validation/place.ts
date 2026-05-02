import { z } from "zod";

export const placeBaseSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  location: z.string().min(1).max(500),
  province: z.string().min(1).max(100),
  tags: z.array(z.string().min(1).max(50)).default([]),
  imageUrl: z.string().url().optional().nullable(),
});

export const placeCreateSchema = placeBaseSchema;

export const placeUpdateSchema = placeBaseSchema.partial();

