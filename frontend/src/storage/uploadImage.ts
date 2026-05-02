import { env } from "../lib/env";

export async function uploadPlaceImage(file: File, placeName: string): Promise<string> {
  const cloudName = env.cloudinary.cloudName;
  const uploadPreset = env.cloudinary.uploadPreset;
  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary env is missing. Fill in frontend/.env (see .env.example).");
  }

  const safe = placeName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9ก-๙]+/gi, "-")
    .replace(/^-+|-+$/g, "");

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", uploadPreset);
  form.append("folder", env.cloudinary.folder);
  form.append("public_id", `${Date.now()}-${safe || "place"}`);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });
  const body = (await res.json().catch(() => null)) as { secure_url?: string; url?: string; error?: unknown } | null;
  if (!res.ok || !body) {
    throw new Error("Upload failed (Cloudinary).");
  }
  const url = body.secure_url ?? body.url;
  if (!url) throw new Error("Upload failed (no URL returned).");
  return url;
}

