-- Point catalog images at app-hosted assets instead of disruptinglabs.com CDN.
-- Files stay in public/assets/services/ (Vite / Vercel static). New uploads use Blob.
UPDATE services SET image_url = '/assets/services/02.jpg'
  WHERE id = 1 AND image_url LIKE '%disruptinglabs.com%';
UPDATE services SET image_url = '/assets/services/03.jpg'
  WHERE id = 2 AND image_url LIKE '%disruptinglabs.com%';
UPDATE services SET image_url = '/assets/services/04.jpg'
  WHERE id = 3 AND image_url LIKE '%disruptinglabs.com%';
UPDATE services SET image_url = '/assets/services/05.jpg'
  WHERE id = 4 AND image_url LIKE '%disruptinglabs.com%';
UPDATE services SET image_url = '/assets/services/06.jpg'
  WHERE id = 5 AND image_url LIKE '%disruptinglabs.com%';
UPDATE services SET image_url = '/assets/services/07.jpg'
  WHERE id = 6 AND image_url LIKE '%disruptinglabs.com%';
UPDATE services SET image_url = '/assets/services/08.jpg'
  WHERE id = 7 AND image_url LIKE '%disruptinglabs.com%';
UPDATE services SET image_url = '/assets/services/09.jpg'
  WHERE id = 8 AND image_url LIKE '%disruptinglabs.com%';
