import { env } from "../lib/env";
import { http } from "../lib/http";
import type { Category } from "../types";

type ListResponse = { data: Category[] };
type ItemResponse = { data: Category };

const base = env.apiBaseUrl.replace(/\/$/, "");

export const categoriesApi = {
  async list(): Promise<Category[]> {
    const res = await http<ListResponse>(`${base}/api/categories`);
    return res.data;
  },
  async create(input: { name: string }): Promise<Category> {
    const res = await http<ItemResponse>(`${base}/api/categories`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    return res.data;
  },
  async update(id: string, input: { name: string }): Promise<Category> {
    const res = await http<ItemResponse>(`${base}/api/categories/${id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    return res.data;
  },
  async remove(id: string): Promise<void> {
    await http(`${base}/api/categories/${id}`, { method: "DELETE" });
  },
};
