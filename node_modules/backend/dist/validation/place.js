import { z } from "zod";
const imageInputSchema = z.object({
    url: z.string().url(),
    isCover: z.boolean().optional(),
});
const googleMapsUrlField = z.preprocess((val) => {
    if (val === undefined || val === null || val === "")
        return null;
    if (typeof val !== "string")
        return val;
    const t = val.trim();
    return t === "" ? null : t;
}, z.union([z.null(), z.string().url({ message: "INVALID_MAPS_URL" }).max(2000)]));
export const placeCreateSchema = z.object({
    name: z.string().min(1).max(255),
    description: z.string().min(1),
    categoryId: z.number().int().positive(),
    googleMapsUrl: googleMapsUrlField.optional(),
    images: z.array(imageInputSchema).min(1),
});
/** Full replacement payload for PUT /api/places/:id (same shape as create). */
export const placeReplaceSchema = placeCreateSchema;
