import { z } from "zod";

const imageInputSchema = z.object({
  url: z.string().url(),
  isCover: z.boolean().optional(),
});

const optionalUrlField = (message: string) =>
  z.preprocess((val: unknown) => {
    if (val === undefined || val === null || val === "") return null;
    if (typeof val !== "string") return val;
    const t = val.trim();
    return t === "" ? null : t;
  }, z.union([z.null(), z.string().url({ message }).max(2000)]));

const googleMapsUrlField = optionalUrlField("INVALID_MAPS_URL");
const facebookUrlField = optionalUrlField("INVALID_FACEBOOK_URL");
const lineUrlField = optionalUrlField("INVALID_LINE_URL");

export const placeCreateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1),
  categoryId: z.number().int().positive(),
  googleMapsUrl: googleMapsUrlField.nullish(),
  facebookUrl: facebookUrlField.nullish(),
  lineUrl: lineUrlField.nullish(),
  images: z.array(imageInputSchema).min(1),
});

/** Full replacement payload for PUT /api/places/:id (same shape as create). */
export const placeReplaceSchema = placeCreateSchema;

export type PlaceCreateBody = z.infer<typeof placeCreateSchema>;
