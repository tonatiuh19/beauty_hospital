-- Migration: Add image column to services table and update with new services
-- Date: 2026-01-05

-- Add image_url column to services table (skip if already exists)
-- Note: If column already exists, you can skip this ALTER TABLE or run it manually first time only
-- ALTER TABLE services ADD COLUMN image_url VARCHAR(500) AFTER description;

-- Update existing services with new data and images
UPDATE services SET 
  name = 'Reducción de Grasa Localizada',
  description = 'Elimina grasa localizada de manera efectiva y no invasiva con tecnología de última generación.',
  category = 'body_treatment',
  price = 2000.00,
  duration_minutes = 60,
  image_url = 'https://disruptinglabs.com/data/beauty/assets/images/ASSETS%20WEB%20ALL%20BEAUTY-02.jpg'
WHERE id = 1;

UPDATE services SET 
  name = 'Tonificación Muscular',
  description = 'Fortalece y define tu figura con electroestimulación muscular avanzada. Equivalente a miles de abdominales en una sola sesión.',
  category = 'body_treatment',
  price = 1800.00,
  duration_minutes = 60,
  image_url = 'https://disruptinglabs.com/data/beauty/assets/images/ASSETS%20WEB%20ALL%20BEAUTY-03.jpg'
WHERE id = 2;

UPDATE services SET 
  name = 'Rejuvenecimiento Facial',
  description = 'Tratamiento facial anti-edad con tecnología Venus. Reduce arrugas y mejora la textura de la piel.',
  category = 'facial_treatment',
  price = 1500.00,
  duration_minutes = 60,
  image_url = 'https://disruptinglabs.com/data/beauty/assets/images/ASSETS%20WEB%20ALL%20BEAUTY-04.jpg'
WHERE id = 3;

UPDATE services SET 
  name = 'Eliminación de Celulitis',
  description = 'Tratamiento avanzado para reducir la celulitis y mejorar la textura de la piel visiblemente.',
  category = 'body_treatment',
  price = 1600.00,
  duration_minutes = 60,
  image_url = 'https://disruptinglabs.com/data/beauty/assets/images/ASSETS%20WEB%20ALL%20BEAUTY-05.jpg'
WHERE id = 4;

UPDATE services SET 
  name = 'Estiramiento Cutáneo y Reafirmación',
  description = 'Reafirma y estira la piel de manera natural con tecnología no invasiva para resultados duraderos.',
  category = 'body_treatment',
  price = 1700.00,
  duration_minutes = 60,
  image_url = 'https://disruptinglabs.com/data/beauty/assets/images/ASSETS%20WEB%20ALL%20BEAUTY-06.jpg'
WHERE id = 5;

UPDATE services SET 
  name = 'Drenaje Linfático y Masajes Postoperatorios',
  description = 'Tratamiento terapéutico especializado para recuperación postoperatoria y drenaje linfático.',
  category = 'other',
  price = 1400.00,
  duration_minutes = 60,
  image_url = 'https://disruptinglabs.com/data/beauty/assets/images/ASSETS%20WEB%20ALL%20BEAUTY-07.jpg'
WHERE id = 6;

-- Insert new services that don't exist yet
INSERT INTO services (name, description, category, price, duration_minutes, is_active, image_url) VALUES
(
  'Hidrodermoabrasión Facial Premium (Venus Glow)',
  'Limpieza facial profunda con tecnología Venus Glow para una piel radiante y renovada.',
  'facial_treatment',
  1300.00,
  45,
  TRUE,
  'https://disruptinglabs.com/data/beauty/assets/images/ASSETS%20WEB%20ALL%20BEAUTY-08.jpg'
),
(
  'Eliminación de Verrugas y Lesiones Benignas',
  'Eliminación segura y efectiva de verrugas y lesiones benignas con tecnología avanzada.',
  'other',
  900.00,
  30,
  TRUE,
  'https://disruptinglabs.com/data/beauty/assets/images/ASSETS%20WEB%20ALL%20BEAUTY-09.jpg'
);
