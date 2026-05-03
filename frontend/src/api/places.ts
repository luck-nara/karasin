import { env } from "../lib/env";
import { http } from "../lib/http";
import { buildPlacesListQuery } from "../lib/placesQuery";
import type { PlaceCreateInput, PlaceDetail, PlaceListItem } from "../types";

type ListResponse = { data: PlaceListItem[] };
type ItemResponse = { data: PlaceDetail };

const base = env.apiBaseUrl.replace(/\/$/, "");

export const placesApi = {
  async list(categoryId?: string | null, search?: string | null): Promise<PlaceListItem[]> {
    const qs = buildPlacesListQuery(categoryId ?? null, search ?? null);
    const res = await http<ListResponse>(`${base}/api/places${qs}`);
    return res.data;
  },
  async get(id: string): Promise<PlaceDetail> {
    const res = await http<ItemResponse>(`${base}/api/places/${id}`);
    return res.data;
  },
  async create(input: PlaceCreateInput): Promise<PlaceDetail> {
    const res = await http<ItemResponse>(`${base}/api/places`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    return res.data;
  },
  async update(id: string, input: PlaceCreateInput): Promise<PlaceDetail> {
    const res = await http<ItemResponse>(`${base}/api/places/${id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    return res.data;
  },
  async remove(id: string): Promise<void> {
    await http(`${base}/api/places/${id}`, { method: "DELETE" });
  },
};
