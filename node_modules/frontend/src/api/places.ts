import { env } from "../lib/env";
import { http } from "../lib/http";
import type { Place, PlaceCreateInput, PlaceUpdateInput } from "../types";

type ListResponse = { data: Place[] };
type ItemResponse = { data: Place };

const base = env.apiBaseUrl.replace(/\/$/, "");

export const placesApi = {
  async list(): Promise<Place[]> {
    const res = await http<ListResponse>(`${base}/api/places`);
    return res.data;
  },
  async get(id: string): Promise<Place> {
    const res = await http<ItemResponse>(`${base}/api/places/${id}`);
    return res.data;
  },
  async create(input: PlaceCreateInput): Promise<Place> {
    const res = await http<ItemResponse>(`${base}/api/places`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    return res.data;
  },
  async update(id: string, input: PlaceUpdateInput): Promise<Place> {
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

