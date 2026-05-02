import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { placesApi } from "../api/places";
import type { Place } from "../types";

export function PlacesListPage() {
  const [items, setItems] = useState<Place[] | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await placesApi.list();
        if (alive) setItems(data);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!items) return null;
    if (!q) return items;
    return items.filter((p) => {
      const hay = `${p.name} ${p.province} ${p.location} ${p.tags.join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <div style={{ fontSize: 18, fontWeight: 650 }}>รายการสถานที่ท่องเที่ยว</div>
          <div className="muted" style={{ marginTop: 4 }}>
            {items ? `${items.length} รายการ` : "กำลังโหลด..."}
          </div>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ค้นหา (ชื่อ/จังหวัด/แท็ก)"
          style={{ maxWidth: 340 }}
        />
      </div>
      <div className="panelBody">
        {error ? <div className="muted">{error}</div> : null}
        {!filtered ? <div className="muted">กำลังโหลด...</div> : null}
        {filtered && filtered.length === 0 ? <div className="muted">ไม่พบข้อมูล</div> : null}
        {filtered ? (
          <div className="cardList">
            {filtered.map((p) => (
              <Link key={p.id} to={`/places/${p.id}`} className="card">
                <div className="cardTitle">{p.name}</div>
                <div className="muted">
                  {p.province} • {p.location}
                </div>
                {p.tags.length ? <div className="muted">แท็ก: {p.tags.join(", ")}</div> : null}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

