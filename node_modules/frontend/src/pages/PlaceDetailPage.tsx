import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { placesApi } from "../api/places";
import type { Place } from "../types";

export function PlaceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [place, setPlace] = useState<Place | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    (async () => {
      try {
        const data = await placesApi.get(id);
        if (alive) setPlace(data);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  async function onDelete() {
    if (!id) return;
    const ok = window.confirm("ลบสถานที่นี้?");
    if (!ok) return;
    setBusy(true);
    try {
      await placesApi.remove(id);
      navigate("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <div className="panelHeader">
        <div style={{ display: "grid", gap: 4 }}>
          <div style={{ fontSize: 18, fontWeight: 650 }}>{place?.name ?? "รายละเอียดสถานที่"}</div>
          {place ? (
            <div className="muted">
              {place.province} • {place.location}
            </div>
          ) : null}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {id ? (
            <Link to={`/places/${id}/edit`} className="button buttonPrimary">
              แก้ไข
            </Link>
          ) : null}
          <button className="button buttonDanger" onClick={onDelete} disabled={!place || busy}>
            {busy ? "กำลังลบ..." : "ลบ"}
          </button>
        </div>
      </div>
      <div className="panelBody stack">
        {error ? <div className="muted">{error}</div> : null}
        {!place ? <div className="muted">กำลังโหลด...</div> : null}
        {place?.imageUrl ? <img className="thumb" src={place.imageUrl} alt={place.name} /> : null}
        {place ? (
          <>
            <div>
              <div className="muted" style={{ fontSize: 13, marginBottom: 6 }}>
                รายละเอียด
              </div>
              <div style={{ whiteSpace: "pre-wrap" }}>{place.description}</div>
            </div>
            {place.tags.length ? (
              <div className="muted">แท็ก: {place.tags.join(", ")}</div>
            ) : (
              <div className="muted">ไม่มีแท็ก</div>
            )}
          </>
        ) : null}
      </div>
    </section>
  );
}

