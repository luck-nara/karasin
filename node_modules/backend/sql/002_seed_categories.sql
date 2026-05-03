-- Seed categories (idempotent)
INSERT INTO categories (name) VALUES
  ('ที่เที่ยว'),
  ('ร้านอาหาร'),
  ('ที่พัก')
ON CONFLICT (name) DO NOTHING;
