export type Category = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type PlaceListItem = {
  id: number;
  name: string;
  description: string;
  googleMapsUrl: string | null;
  facebookUrl: string | null;
  lineUrl: string | null;
  categoryId: number | null;
  categoryName: string | null;
  coverImageUrl: string | null;
};

export type PlaceImage = {
  id: number;
  url: string;
  isCover: boolean;
};

export type PlaceDetail = {
  id: number;
  name: string;
  description: string;
  googleMapsUrl: string | null;
  facebookUrl: string | null;
  lineUrl: string | null;
  categoryId: number | null;
  categoryName: string | null;
  createdAt: string;
  updatedAt: string;
  images: PlaceImage[];
};

export type PlaceCreateInput = {
  name: string;
  description: string;
  categoryId: number;
  googleMapsUrl?: string | null;
  facebookUrl?: string | null;
  lineUrl?: string | null;
  images: { url: string; isCover?: boolean }[];
};
