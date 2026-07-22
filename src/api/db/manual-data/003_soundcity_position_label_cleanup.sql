DELETE FROM room_equipment re
USING rooms r
JOIN studios s ON s.id = r.studio_id
WHERE re.room_id = r.id
  AND s.slug = 'studio-합정/홍대-사운드시티'
  AND re.position_label IS NOT NULL;
