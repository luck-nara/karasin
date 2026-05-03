import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { GoogleMapsIcon } from "../components/GoogleMapsIcon";
import { placesApi } from "../api/places";
import type { PlaceDetail } from "../types";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80";

export function PlaceDetailPage() {
  const { id } = useParams();
  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    (async () => {
      try {
        const data = await placesApi.get(id);
        if (alive) {
          setPlace(data);
          const first = data.images[0]?.url ?? FALLBACK_IMG;
          setActiveImage(first);
        }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const thumbs = place?.images?.length
    ? place.images.map((i) => i.url)
    : [FALLBACK_IMG];

  return (
    <section className="detailPage panel">
      <div className="panelHeader detailHeader">
        <div>
          <div className="panelTitle">{place?.name ?? "รายละเอียดสถานที่"}</div>
          {place ? (
            <div className="muted detailMeta">{place.categoryName ?? "ไม่ระบุหมวด"}</div>
          ) : null}
        </div>
        <div className="detailHeaderActions">
          {place?.googleMapsUrl ? (
            <a
              className="button buttonPrimary detailMapsBtn"
              href={place.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <GoogleMapsIcon />
              <span>เปิดใน Google Maps</span>
            </a>
          ) : null}
          <Link to="/places" className="button">
            กลับไปรายการ
          </Link>
        </div>
      </div>
      <div className="panelBody detailBody">
        {error ? <div className="muted">{error}</div> : null}
        {!place ? <div className="muted">กำลังโหลด...</div> : null}
        {place ? (
          <>
            <div className="detailGallery">
              <div className="detailHero">
                <img
                  className="detailHeroImg"
                  src={activeImage ?? FALLBACK_IMG}
                  alt={place.name}
                />
              </div>
              {thumbs.length > 1 ? (
                <div className="detailThumbs" role="list">
                  {thumbs.map((url, idx) => (
                    <button
                      key={`${idx}-${url}`}
                      type="button"
                      className={`detailThumbBtn${activeImage === url ? " isActive" : ""}`}
                      onClick={() => setActiveImage(url)}
                    >
                      <img src={url} alt="" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div>
              <div className="detailLabel">รายละเอียด</div>
              <p className="detailText">{place.description}</p>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
