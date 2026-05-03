-- Align existing DBs with simplified places + Google Maps link
ALTER TABLE tourist_places ADD COLUMN IF NOT EXISTS google_maps_url TEXT;
ALTER TABLE tourist_places DROP COLUMN IF EXISTS short_description;
ALTER TABLE tourist_places DROP COLUMN IF EXISTS province;
ALTER TABLE tourist_places DROP COLUMN IF EXISTS opening_hours;
ALTER TABLE tourist_places DROP COLUMN IF EXISTS ticket_price;
