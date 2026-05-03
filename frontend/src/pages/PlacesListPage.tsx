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
    let alive = true;
    setError(null);
    (async () => {
      try {
        const data = await placesApi.list(selectedId);
        if (alive) setItems(data);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
      }
    })();
    return () => {
      alive = false;
    };
  }, [selectedId]);

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
        <div className="panelHeader">
          <div>
            <div className="panelTitle">รายการสถานที่</div>
            <div className="muted panelSubtitle">
              {items ? `${items.length} รายการ` : "กำลังโหลด..."}
            </div>
          </div>
        </div>
        <div className="panelBody">
          {error ? <div className="muted">{error}</div> : null}
          {!items ? <div className="muted">กำลังโหลด...</div> : null}
          {items && items.length === 0 ? <div className="muted">ไม่พบข้อมูลในหมวดนี้</div> : null}
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
