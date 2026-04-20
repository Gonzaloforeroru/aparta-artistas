-- Add website field to artists for portfolio/personal page links
ALTER TABLE artists ADD COLUMN IF NOT EXISTS website text;
