export const env = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:4000",

  cloudinary: {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined,
    uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined,
    folder: (import.meta.env.VITE_CLOUDINARY_FOLDER as string | undefined) ?? "karasin/places",
  },
};

