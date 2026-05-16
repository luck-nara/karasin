function optionalUrl(v: string | undefined): string | null {
  const t = v?.trim();
  return t ? t : null;
}

export const env = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:4000",

  contact: {
    facebookUrl: optionalUrl(import.meta.env.VITE_CONTACT_FACEBOOK_URL as string | undefined),
    lineUrl: optionalUrl(import.meta.env.VITE_CONTACT_LINE_URL as string | undefined),
  },

  cloudinary: {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined,
    uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined,
    folder: (import.meta.env.VITE_CLOUDINARY_FOLDER as string | undefined) ?? "karasin/places",
  },
};

