import { Link } from "react-router-dom";
import { GoogleMapsIcon } from "./GoogleMapsIcon";
import type { PlaceListItem } from "../types";

type Props = {
  place: PlaceListItem;
};

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80";

function excerpt(text: string, max: number) {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

const EXCERPT_LEN = 160;

export function PlaceCard({ place }: Props) {
  const img = place.coverImageUrl ?? FALLBACK_IMG;
  return (
    <div className="placeCard">
      <Link to={`/places/${place.id}`} className="placeCardMain">
        <div className="placeCardImageWrap">
          <img className="placeCardImage" src={img} alt="" loading="lazy" />
          {place.categoryName ? <span className="placeCardBadge">{place.categoryName}</span> : null}
        </div>
        <div className="placeCardBody">
          <h3 className="placeCardTitle">{place.name}</h3>
          <p className="placeCardShort">{excerpt(place.description, EXCERPT_LEN)}</p>
        </div>
      </Link>
      {place.googleMapsUrl ? (
        <a
          className="placeCardMaps"
          href={place.googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`เปิด ${place.name} ใน Google Maps`}
        >
          <GoogleMapsIcon />
          <span>Google Maps</span>
        </a>
      ) : null}
    </div>
  );
}
