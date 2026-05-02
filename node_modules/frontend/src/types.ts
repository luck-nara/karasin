export type Place = {
  id: string;
  name: string;
  description: string;
  location: string;
  province: string;
  tags: string[];
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PlaceCreateInput = {
  name: string;
  description: string;
  location: string;
  province: string;
  tags: string[];
  imageUrl?: string | null;
};

export type PlaceUpdateInput = Partial<PlaceCreateInput>;

