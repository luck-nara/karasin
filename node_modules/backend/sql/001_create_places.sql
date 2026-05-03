-- =========================
-- 1. categories
-- =========================
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL
);

-- =========================
-- 2. tourist_places
-- =========================
CREATE TABLE IF NOT EXISTS tourist_places (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,

  category_id INT REFERENCES categories(id),

  district VARCHAR(100),

  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),

  google_maps_url TEXT,

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- 3. place_images
-- =========================
CREATE TABLE IF NOT EXISTS place_images (
  id SERIAL PRIMARY KEY,
  place_id INT REFERENCES tourist_places(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_cover BOOLEAN DEFAULT false
);

-- =========================
-- INDEX (เพิ่มความเร็ว)
-- =========================
CREATE INDEX IF NOT EXISTS idx_places_category ON tourist_places(category_id);
CREATE INDEX IF NOT EXISTS idx_places_name ON tourist_places(name);