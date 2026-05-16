import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { placesApi } from "../api/places";
import { PlaceCard } from "../components/PlaceCard";
import type { PlaceListItem } from "../types";

export function HomePage() {
  const [places, setPlaces] = useState<PlaceListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await placesApi.list();
        if (alive) setPlaces(data.slice(0, 6));
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="homePage">
      <section className="hero">
        <div className="heroBg" aria-hidden />
        <div className="heroOverlay" />
        <div className="heroContent">
          <p className="heroKicker">ค้นพบกาฬสินธุ์</p>
          <h1 className="heroTitle">แหล่งท่องเที่ยวและประสบการณ์ที่จดจำได้</h1>
          <p className="heroLead">
            เลือกดูสถานที่ ร้านอาหาร และที่พัก
          </p>
          <div className="heroActions">
            <Link className="button buttonPrimary heroCta" to="/places">
              ดูสถานที่ทั้งหมด
            </Link>
            <Link className="button heroGhost" to="/contact">
              ติดต่อเรา
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="sectionHead">
          <h2 className="sectionTitle">แนะนำสถานที่</h2>
          <Link className="sectionMore" to="/places">
            ดูทั้งหมด
          </Link>
        </div>
        {error ? <div className="muted">{error}</div> : null}
        {!places ? <div className="muted">กำลังโหลด...</div> : null}
        {places && places.length === 0 ? <div className="muted">ยังไม่มีข้อมูลสถานที่</div> : null}
        {places && places.length > 0 ? (
          <div className="placeGrid">
            {places.map((p) => (
              <PlaceCard key={p.id} place={p} />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
