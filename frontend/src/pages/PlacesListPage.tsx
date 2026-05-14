import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { categoriesApi } from "../api/categories";
import { placesApi } from "../api/places";
import { CategorySidebar } from "../components/CategorySidebar";
import { PlaceCard } from "../components/PlaceCard";
import type { Category, PlaceListItem } from "../types";

export function PlacesListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryIdFromUrl = searchParams.get("category_id");

  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<PlaceListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(() => (searchParams.get("search") ?? "").trim());

  const selectedId = categoryIdFromUrl;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await categoriesApi.list();
        if (alive) setCategories(data);
      } catch {
        if (alive) setCategories([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 280);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let alive = true;
    setError(null);
    (async () => {
      try {
        const data = await placesApi.list(selectedId, debouncedSearch || null);
        if (alive) setItems(data);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
      }
    })();
    return () => {
      alive = false;
    };
  }, [selectedId, debouncedSearch]);

  function onSelectCategory(id: string | null) {
    setError(null);
    if (id === null) {
      setSearchParams({});
    } else {
      setSearchParams({ category_id: id });
    }
  }

  return (
    <div className="listLayout">
      <CategorySidebar categories={categories} selectedId={selectedId} onSelect={onSelectCategory} />
      <section className="listMain panel">
        <div className="panelHeader listPanelHeader">
          <div>
            <div className="panelTitle">รายการสถานที่</div>
            <div className="muted panelSubtitle">
              {items ? `${items.length} รายการ` : "กำลังโหลด..."}
            </div>
          </div>
          <label className="field listPanelSearch">
            <span>ค้นหาสถานที่</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ชื่อสถานที่"
              autoComplete="off"
              aria-label="ค้นหาสถานที่"
            />
          </label>
        </div>
        <div className="panelBody">
          {error ? <div className="muted">{error}</div> : null}
          {!items ? <div className="muted">กำลังโหลด...</div> : null}
          {items && items.length === 0 ? (
            <div className="muted">
              {debouncedSearch ? "ไม่พบข้อมูลที่ตรงกับคำค้น" : "ไม่พบข้อมูลในหมวดนี้"}
            </div>
          ) : null}
          {items && items.length > 0 ? (
            <div className="placeGrid">
              {items.map((p) => (
                <PlaceCard key={p.id} place={p} />
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
