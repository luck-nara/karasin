/** Build query string for GET /api/places */
export function buildPlacesListQuery(categoryId?: string | null, search?: string | null): string {
  const params = new URLSearchParams();
  if (categoryId && categoryId !== "all") params.set("category_id", categoryId);
  const q = search?.trim();
  if (q) params.set("search", q);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
