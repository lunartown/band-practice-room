-- "신촌 그라운드"는 그라운드합주실 계열이 아니므로 그라운드 수동 썸네일을 쓰지 않는다.
-- 운영자가 이후 다른 수동 이미지를 넣은 경우에는 건드리지 않는다.

UPDATE studios
SET image_url_manual = NULL
WHERE slug = 'studio-신촌-신촌-그라운드'
  AND image_url_manual = '/studios/ground.webp';
