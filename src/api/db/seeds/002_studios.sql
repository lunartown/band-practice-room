-- Auto-generated seed from _local/data
-- 기존 스튜디오/룸 데이터를 완전히 교체

-- 기존 데이터 초기화
TRUNCATE TABLE slots, room_sources, rooms, studio_sources, studio_areas, studios, scrape_jobs, scrape_runs RESTART IDENTITY CASCADE;
TRUNCATE TABLE areas RESTART IDENTITY CASCADE;
-- sources는 유지 (naver source id=1)

-- Areas
INSERT INTO areas (id, slug, name, "order", is_active) VALUES (1, 'hapjeong-hongdae', '합정/홍대', 1, true);
INSERT INTO areas (id, slug, name, "order", is_active) VALUES (2, 'sinchon', '신촌', 2, true);
INSERT INTO areas (id, slug, name, "order", is_active) VALUES (3, 'sadang-isu', '사당/이수', 3, true);
INSERT INTO areas (id, slug, name, "order", is_active) VALUES (4, 'sindorim-yeongdeungpo', '신도림/영등포구청', 4, true);
INSERT INTO areas (id, slug, name, "order", is_active) VALUES (5, 'mangwon', '망원', 5, true);
INSERT INTO areas (id, slug, name, "order", is_active) VALUES (6, 'sangdo-chungang', '상도/중앙대', 6, true);
INSERT INTO areas (id, slug, name, "order", is_active) VALUES (7, 'seoul-nat-univ', '서울대입구', 7, true);
INSERT INTO areas (id, slug, name, "order", is_active) VALUES (8, 'bangbae', '방배', 8, true);
INSERT INTO areas (id, slug, name, "order", is_active) VALUES (9, 'hyehwa-ssuniv', '혜화/성신여대', 9, true);
INSERT INTO areas (id, slug, name, "order", is_active) VALUES (10, 'gangnam', '강남', 10, true);
INSERT INTO areas (id, slug, name, "order", is_active) VALUES (11, 'gangdong-songpa', '강동/송파', 11, true);
INSERT INTO areas (id, slug, name, "order", is_active) VALUES (12, 'other-seoul', '기타 서울', 12, true);

-- Studios, rooms, studio_sources, room_sources
INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-합정/홍대-st-music', 'ST music', 'ST music 합주실 정보', 1, '서울특별시 마포구 와우산로29길 54', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 1 FROM studios WHERE slug='studio-합정/홍대-st-music';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '491097', 'https://m.booking.naver.com/booking/10/bizes/491097/items/3949065?area=bmp&lang=ko&map-search=1&service-target=map-pc&theme=place' FROM studios WHERE slug='studio-합정/홍대-st-music';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'B Room', 13000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-st-music';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '3952398' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-st-music' AND r.name='B Room';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'A Room', 15000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-st-music';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '3949065' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-st-music' AND r.name='A Room';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-합정/홍대-그라운드-본점', '그라운드 본점', '120평 국내 최대 규모에 합주실 9개,최대 20명 전후로 수용 가능한 대형룸들과 다양한 룸사이즈와 가격, 장비 구성으로 선택의 폭을 넓혔습니다', 1, '서울 마포구 양화로 147 지하2층', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 1 FROM studios WHERE slug='studio-합정/홍대-그라운드-본점';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '1061592', 'https://m.booking.naver.com/booking/10/bizes/1061592' FROM studios WHERE slug='studio-합정/홍대-그라운드-본점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'A1룸', 18000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-그라운드-본점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '5588402' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-그라운드-본점' AND r.name='A1룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'A2룸', 17000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-그라운드-본점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '5588476' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-그라운드-본점' AND r.name='A2룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'A3룸', 17000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-그라운드-본점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '5588707' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-그라운드-본점' AND r.name='A3룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'B1룸', 16000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-그라운드-본점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '5588783' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-그라운드-본점' AND r.name='B1룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'B2룸', 15000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-그라운드-본점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '5588817' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-그라운드-본점' AND r.name='B2룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'C룸', 14000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-그라운드-본점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '5588835' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-그라운드-본점' AND r.name='C룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'D룸', 13000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-그라운드-본점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '5588869' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-그라운드-본점' AND r.name='D룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'E룸', 12000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-그라운드-본점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '5588887' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-그라운드-본점' AND r.name='E룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'S룸', 22000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-그라운드-본점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '5587861' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-그라운드-본점' AND r.name='S룸';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-합정/홍대-그라운드-합정1호점', '그라운드 합정1호점', '전체90평 규모로 넓은 대기실과 초대형룸을 포함한 4개의 일반 합주실,', 1, '서울 마포구 양화로10길 49 BK빌딩 B2', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 1 FROM studios WHERE slug='studio-합정/홍대-그라운드-합정1호점';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '331813', 'https://m.booking.naver.com/booking/10/bizes/331813' FROM studios WHERE slug='studio-합정/홍대-그라운드-합정1호점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'A룸', 16000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-그라운드-합정1호점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '3361594' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-그라운드-합정1호점' AND r.name='A룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'B룸', 14000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-그라운드-합정1호점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '3361595' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-그라운드-합정1호점' AND r.name='B룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'C룸', 14000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-그라운드-합정1호점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '3361597' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-그라운드-합정1호점' AND r.name='C룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'Jazz룸', 1440018000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-그라운드-합정1호점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '3361598' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-그라운드-합정1호점' AND r.name='Jazz룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'S룸', 22000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-그라운드-합정1호점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '3361583' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-그라운드-합정1호점' AND r.name='S룸';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-합정/홍대-디엠', '디엠', '디엠 합주실 정보', 1, '서울특별시 마포구 양화로6길 79, 지1층', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 1 FROM studios WHERE slug='studio-합정/홍대-디엠';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '1240775', 'https://m.booking.naver.com/booking/10/bizes/1240775/items/7149587?area=bmp&lang=ko&map-search=1&service-target=map-pc&theme=place' FROM studios WHERE slug='studio-합정/홍대-디엠';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '2번방', 12000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-디엠';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '6198896' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-디엠' AND r.name='2번방';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '1번방', 16000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-디엠';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-합정/홍대-라라', '라라', '라라 합주실 정보', 1, '서울특별시 마포구 잔다리로 99, 지하1층', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 1 FROM studios WHERE slug='studio-합정/홍대-라라';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '1314022', 'https://m.booking.naver.com/booking/10/bizes/1314022/items/6438431?area=bmp&lang=ko&map-search=1&service-target=map-pc&theme=place' FROM studios WHERE slug='studio-합정/홍대-라라';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'V룸', 19000, 'SCRAPED', 8, 8, true FROM studios WHERE slug='studio-합정/홍대-라라';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '6438577' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-라라' AND r.name='V룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'R룸', 18000, 'SCRAPED', 6, 6, true FROM studios WHERE slug='studio-합정/홍대-라라';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '6438431' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-라라' AND r.name='R룸';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-합정/홍대-별나무', '별나무', '5개의 방음룸. 6평에서~13평까지 다양한 합주실이 준비되어 있습니다.', 1, '서울 마포구 양화로12길 23 지층', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 1 FROM studios WHERE slug='studio-합정/홍대-별나무';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'R룸', 19000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-별나무';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'Y룸', 18000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-별나무';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'T룸', 14000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-별나무';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'J룸', 14000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-별나무';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'V룸', 21000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-별나무';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-합정/홍대-불리스튜디오', '불리스튜디오', '불리스튜디오 합주실 정보', 1, '합정/홍대 지역', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 1 FROM studios WHERE slug='studio-합정/홍대-불리스튜디오';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'NIGHTMARE', 15000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-불리스튜디오';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'HELL', 18000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-불리스튜디오';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-합정/홍대-브라운', '브라운', '브라운사운드는 음악 선진국의 리허설 스튜디오에 채택하는 사양으로 설계되었으며, 기존 합주실에는 없는 중요한 특성을 가지고 있습니다.', 1, '서울 마포구 어울마당로5길 17 지하1층', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 1 FROM studios WHERE slug='studio-합정/홍대-브라운';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '1574159', 'https://m.booking.naver.com/booking/13/bizes/1574159' FROM studios WHERE slug='studio-합정/홍대-브라운';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '그린룸', 15000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-브라운';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '옐로우룸', 14000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-브라운';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '그레이룸', 13000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-브라운';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '브라운룸', 16000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-브라운';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-합정/홍대-사운드시티', '사운드시티', '사운드시티는 밴드 넬에서 활동했던 정재원이 OPEN 한 합주실입니다. 최상의 사운드와 모니터 시스템 그리고 악기를 보유하여 많은 뮤지션들에게 사랑을 받고 있습니다.', 1, '서울 마포구 잔다리로 35 서원빌딩 B1', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 1 FROM studios WHERE slug='studio-합정/홍대-사운드시티';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '1033058', 'https://m.booking.naver.com/booking/10/bizes/1033058' FROM studios WHERE slug='studio-합정/홍대-사운드시티';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'Room A', 20000, 'SCRAPED', 10, 10, true FROM studios WHERE slug='studio-합정/홍대-사운드시티';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '5486389' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-사운드시티' AND r.name='Room A';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'Room B', 20000, 'SCRAPED', 10, 10, true FROM studios WHERE slug='studio-합정/홍대-사운드시티';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '5486506' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-사운드시티' AND r.name='Room B';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'Room C', 18000, 'SCRAPED', 8, 8, true FROM studios WHERE slug='studio-합정/홍대-사운드시티';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '5486549' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-사운드시티' AND r.name='Room C';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'Room D', 14000, 'SCRAPED', 5, 5, true FROM studios WHERE slug='studio-합정/홍대-사운드시티';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '5486609' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-사운드시티' AND r.name='Room D';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'Room E', 14000, 'SCRAPED', 5, 5, true FROM studios WHERE slug='studio-합정/홍대-사운드시티';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '5486623' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-사운드시티' AND r.name='Room E';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'Live Room', 24000, 'SCRAPED', 10, 10, true FROM studios WHERE slug='studio-합정/홍대-사운드시티';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '5933800' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-사운드시티' AND r.name='Live Room';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-합정/홍대-사운드시티-홍대점', '사운드시티 홍대점', '사운드시티는 밴드 넬에서 활동했던 정재원이 OPEN 한 합주실입니다. 최상의 사운드와 모니터 시스템 그리고 악기를 보유하여 많은 뮤지션들에게 사랑을 받고 있습니다.', 1, '서울 마포구 양화로 156 2층 212호', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 1 FROM studios WHERE slug='studio-합정/홍대-사운드시티-홍대점';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '1410283', 'https://m.booking.naver.com/booking/10/bizes/1410283/items/6747150?area=bmp&lang=ko&map-search=1&service-target=map-pc&theme=place' FROM studios WHERE slug='studio-합정/홍대-사운드시티-홍대점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'Room 2', 18000, 'SCRAPED', 10, 10, true FROM studios WHERE slug='studio-합정/홍대-사운드시티-홍대점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '6747154' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-사운드시티-홍대점' AND r.name='Room 2';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'Room 3', 18000, 'SCRAPED', 10, 10, true FROM studios WHERE slug='studio-합정/홍대-사운드시티-홍대점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '6747157' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-사운드시티-홍대점' AND r.name='Room 3';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'Room 4', 18000, 'SCRAPED', 8, 8, true FROM studios WHERE slug='studio-합정/홍대-사운드시티-홍대점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '6747158' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-사운드시티-홍대점' AND r.name='Room 4';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'Room 5', 18000, 'SCRAPED', 5, 5, true FROM studios WHERE slug='studio-합정/홍대-사운드시티-홍대점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '6747167' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-사운드시티-홍대점' AND r.name='Room 5';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'Room 1', 18000, 'SCRAPED', 10, 10, true FROM studios WHERE slug='studio-합정/홍대-사운드시티-홍대점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '6747150' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-사운드시티-홍대점' AND r.name='Room 1';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-합정/홍대-스팟사운드', '스팟사운드', '스팟사운드 합주실 정보', 1, '합정/홍대 지역', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 1 FROM studios WHERE slug='studio-합정/홍대-스팟사운드';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '호랑이1', 13000, 'SCRAPED', 6, 6, true FROM studios WHERE slug='studio-합정/홍대-스팟사운드';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-합정/홍대-앨리', '앨리', '앨리 합주실 정보', 1, '합정/홍대 지역', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 1 FROM studios WHERE slug='studio-합정/홍대-앨리';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '부스2', 13000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-앨리';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '부스3', 13000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-앨리';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '부스4', 13000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-앨리';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '부스1', 16000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-앨리';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-합정/홍대-에비로드', '에비로드', '합정역 2분거리, 현재 홍대의 많은 프로 뮤지션들이 애용하고 있는 합주실', 1, '서울 마포구 독막로 17-1 지하1층', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 1 FROM studios WHERE slug='studio-합정/홍대-에비로드';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '844479', 'https://m.booking.naver.com/booking/10/bizes/844479' FROM studios WHERE slug='studio-합정/홍대-에비로드';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'B룸', 15000, 'SCRAPED', 7, 7, true FROM studios WHERE slug='studio-합정/홍대-에비로드';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '4865360' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-에비로드' AND r.name='B룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'C룸', 13000, 'SCRAPED', 5, 5, true FROM studios WHERE slug='studio-합정/홍대-에비로드';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '4865367' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-에비로드' AND r.name='C룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'A룸', 20000, 'SCRAPED', 12, 12, true FROM studios WHERE slug='studio-합정/홍대-에비로드';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '4865352' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-에비로드' AND r.name='A룸';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-합정/홍대-오렌지', '오렌지', '근 20년이 되어가는 올드한 소규모 합주실로 작은 룸들만 있으며 악기 구성은 심플합니다. 홍대 7번 출구에서 1분 이내 거리로 지하 2층입니다.', 1, '서울 마포구 와우산로35길 55 B2', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 1 FROM studios WHERE slug='studio-합정/홍대-오렌지';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '95732', 'https://m.booking.naver.com/booking/10/bizes/95732' FROM studios WHERE slug='studio-합정/홍대-오렌지';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '2번룸', 15000, 'SCRAPED', 7, 7, true FROM studios WHERE slug='studio-합정/홍대-오렌지';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '2601742' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-오렌지' AND r.name='2번룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '3번룸', 13000, 'SCRAPED', 6, 6, true FROM studios WHERE slug='studio-합정/홍대-오렌지';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '2601743' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-오렌지' AND r.name='3번룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '4번룸', 12000, 'SCRAPED', 5, 5, true FROM studios WHERE slug='studio-합정/홍대-오렌지';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '2601744' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-오렌지' AND r.name='4번룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '개러지룸', 17000, 'SCRAPED', 10, 10, true FROM studios WHERE slug='studio-합정/홍대-오렌지';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '2826240' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-오렌지' AND r.name='개러지룸';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-합정/홍대-웨이브랩', '웨이브랩', '합정역에서 1분거리 최고의 합주시설을 보유한 합주실. 하우스 엔지니어가 상주하고 있기에 사운드 체크에 유리.', 1, '서울 마포구 양화로 73-1 이스턴빌딩 B1', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 1 FROM studios WHERE slug='studio-합정/홍대-웨이브랩';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '70462', 'https://m.booking.naver.com/booking/10/bizes/70462' FROM studios WHERE slug='studio-합정/홍대-웨이브랩';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'R2룸', 20000, 'SCRAPED', 13, 13, true FROM studios WHERE slug='studio-합정/홍대-웨이브랩';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '5521162' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-웨이브랩' AND r.name='R2룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'A룸', 18000, 'SCRAPED', 8, 8, true FROM studios WHERE slug='studio-합정/홍대-웨이브랩';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '5521202' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-웨이브랩' AND r.name='A룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'R1룸', 22000, 'SCRAPED', 14, 14, true FROM studios WHERE slug='studio-합정/홍대-웨이브랩';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '5521127' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-웨이브랩' AND r.name='R1룸';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-합정/홍대-웨이브랩2호점', '웨이브랩2호점', '웨이브랩2호점 합주실 정보', 1, '서울특별시 마포구 월드컵로 37, B층 101호,102호', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 1 FROM studios WHERE slug='studio-합정/홍대-웨이브랩2호점';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '1415457', 'https://m.booking.naver.com/booking/10/bizes/1415457/items/6761289?area=bmp&lang=ko&map-search=1&service-target=map-pc&theme=place' FROM studios WHERE slug='studio-합정/홍대-웨이브랩2호점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'Back In Black', 22000, 'SCRAPED', 13, 13, true FROM studios WHERE slug='studio-합정/홍대-웨이브랩2호점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '6761302' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-웨이브랩2호점' AND r.name='Back In Black';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'Kind Of Blue', 22000, 'SCRAPED', 13, 13, true FROM studios WHERE slug='studio-합정/홍대-웨이브랩2호점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '6761435' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-웨이브랩2호점' AND r.name='Kind Of Blue';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'After School Tea Time', 22000, 'SCRAPED', 13, 13, true FROM studios WHERE slug='studio-합정/홍대-웨이브랩2호점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '6761441' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-웨이브랩2호점' AND r.name='After School Tea Time';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'White Room', 22000, 'SCRAPED', 13, 13, true FROM studios WHERE slug='studio-합정/홍대-웨이브랩2호점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '6761289' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-웨이브랩2호점' AND r.name='White Room';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-합정/홍대-이막', '이막', '이막 합주실 정보', 1, '서울특별시 마포구 잔다리로7길 38, 지하1층', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 1 FROM studios WHERE slug='studio-합정/홍대-이막';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '1385421', 'https://m.booking.naver.com/booking/10/bizes/1385421/items/6686059?area=bmp&lang=ko&map-search=1&service-target=map-pc&theme=place' FROM studios WHERE slug='studio-합정/홍대-이막';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'B룸', 15500, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-이막';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '6686062' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-이막' AND r.name='B룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'A룸', 18000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-이막';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '6686059' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-이막' AND r.name='A룸';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-합정/홍대-제시뮤직', '제시뮤직', '제시뮤직 홍대 합주실은 공연 리허설과 영상 제작을 위한 소리 간섭이 적은 독립된 합주실을 제공하는 스튜디오 입니다. 50평대의 시설로 넓고 쾌적한 환경을 제공하고 잘 관리되어진 장비들로 스트레스를 최소화 할 수 있는 장점이 있습니다.', 1, '서울 마포구 월드컵북로1길 18 지하 1층', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 1 FROM studios WHERE slug='studio-합정/홍대-제시뮤직';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '446860', 'https://m.booking.naver.com/booking/10/bizes/446860' FROM studios WHERE slug='studio-합정/홍대-제시뮤직';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '합주실 A', 16000, 'SCRAPED', 8, 8, true FROM studios WHERE slug='studio-합정/홍대-제시뮤직';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '3702602' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-제시뮤직' AND r.name='합주실 A';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '합주실 B', 14000, 'SCRAPED', 6, 6, true FROM studios WHERE slug='studio-합정/홍대-제시뮤직';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '3702645' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-제시뮤직' AND r.name='합주실 B';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '합주실 R', 18000, 'SCRAPED', 10, 10, true FROM studios WHERE slug='studio-합정/홍대-제시뮤직';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '4013506' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-제시뮤직' AND r.name='합주실 R';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-합정/홍대-제시뮤직합정점', '제시뮤직합정점', '제시뮤직합정점 합주실 정보', 1, '서울특별시 마포구 양화로 64, 지하 2층 202호', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 1 FROM studios WHERE slug='studio-합정/홍대-제시뮤직합정점';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '1582546', 'https://m.booking.naver.com/booking/10/bizes/1582546/items/7386250?area=bmp&lang=ko&map-search=1&service-target=map-pc&theme=place' FROM studios WHERE slug='studio-합정/홍대-제시뮤직합정점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '합주실 달', NULL, 'UNKNOWN', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-제시뮤직합정점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '7386295' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-제시뮤직합정점' AND r.name='합주실 달';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '합주실 별', NULL, 'UNKNOWN', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-제시뮤직합정점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '7386302' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-제시뮤직합정점' AND r.name='합주실 별';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '합주실 해', NULL, 'UNKNOWN', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-제시뮤직합정점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '7386250' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-제시뮤직합정점' AND r.name='합주실 해';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-합정/홍대-차마스튜디오', '차마스튜디오', '차마스튜디오 합주실 정보', 1, '서울특별시 마포구 동교로12길 13, 지하 1층', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 1 FROM studios WHERE slug='studio-합정/홍대-차마스튜디오';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '114414', 'https://m.booking.naver.com/booking/10/bizes/114414/items/2663395?area=bmp&lang=ko&map-search=1&service-target=map-pc&theme=place' FROM studios WHERE slug='studio-합정/홍대-차마스튜디오';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'BURGUNDY', 15000, 'SCRAPED', 7, 7, true FROM studios WHERE slug='studio-합정/홍대-차마스튜디오';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '2664242' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-차마스튜디오' AND r.name='BURGUNDY';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'Black', 20000, 'SCRAPED', 10, 10, true FROM studios WHERE slug='studio-합정/홍대-차마스튜디오';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '2663395' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-차마스튜디오' AND r.name='Black';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-합정/홍대-하모닉스1호점', '하모닉스1호점', '홍대 입구역과 4분거리, 15명 이상 이용 할 수 있으며 라이브 레코딩이 가능한 대형 합주실 A룸, 풀밴드 7명으로 쾌적한 연주를 즐길 수 있는 B, C 룸을 보유', 1, '서울 마포구 동교로25길 7 지층', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 1 FROM studios WHERE slug='studio-합정/홍대-하모닉스1호점';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '1064404', 'https://m.booking.naver.com/booking/10/bizes/1064404' FROM studios WHERE slug='studio-합정/홍대-하모닉스1호점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'B룸', 14000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-하모닉스1호점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '5596983' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-하모닉스1호점' AND r.name='B룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'C룸', 14000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-하모닉스1호점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '5596988' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-하모닉스1호점' AND r.name='C룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'A룸', 20000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-하모닉스1호점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '5596982' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-하모닉스1호점' AND r.name='A룸';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-합정/홍대-하모닉스2호점', '하모닉스2호점', '홍대 입구역과 4분거리.15명 이상 이용 할 수 있으며 라이브 레코딩이 가능한 대형 합주실 RED룸 풀밴드 7명으로 쾌적한 연주를 즐길 수 있는 BLUE 룸을 보유. 드럼, 베이스, 기타 트리오 연주가 가능한 MINE 룸, 업라이트 피아노 배치가 되어있는 JAZZ 룸 보유', 1, '서울 마포구 동교로 190 지층', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 1 FROM studios WHERE slug='studio-합정/홍대-하모닉스2호점';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '1278292', 'https://m.booking.naver.com/booking/10/bizes/1278292' FROM studios WHERE slug='studio-합정/홍대-하모닉스2호점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'BLUE ROOM', 17000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-하모닉스2호점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '6338505' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-하모닉스2호점' AND r.name='BLUE ROOM';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'J ROOM', 9000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-하모닉스2호점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '6338507' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-하모닉스2호점' AND r.name='J ROOM';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'MINI ROOM', 8000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-하모닉스2호점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '6338511' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-하모닉스2호점' AND r.name='MINI ROOM';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'RED ROOM', 20000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-합정/홍대-하모닉스2호점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '6338498' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-하모닉스2호점' AND r.name='RED ROOM';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-합정/홍대-호랑이', '호랑이', '극동아시아타이거즈가 운영하는 홍대의 합주실. 호랑이합주실은 모든 악기 무료로 대여해드립니다', 1, '서울 마포구 월드컵북로6길 57 지하1층', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 1 FROM studios WHERE slug='studio-합정/홍대-호랑이';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '1062791', 'https://m.booking.naver.com/booking/10/bizes/1062791' FROM studios WHERE slug='studio-합정/홍대-호랑이';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '호랑이2', 17000, 'SCRAPED', 6, 6, true FROM studios WHERE slug='studio-합정/홍대-호랑이';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '5606830' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-호랑이' AND r.name='호랑이2';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '호랑이3', 17000, 'SCRAPED', 6, 6, true FROM studios WHERE slug='studio-합정/홍대-호랑이';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '5606836' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-호랑이' AND r.name='호랑이3';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '호랑이1', 20000, 'SCRAPED', 8, 8, true FROM studios WHERE slug='studio-합정/홍대-호랑이';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '5592935' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-합정/홍대-호랑이' AND r.name='호랑이1';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-합정/홍대-홍대리엠뮤직', '홍대리엠뮤직', '홍대리엠뮤직 합주실 정보', 1, '합정/홍대 지역', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 1 FROM studios WHERE slug='studio-합정/홍대-홍대리엠뮤직';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '합주실', 14000, 'SCRAPED', 10, 10, true FROM studios WHERE slug='studio-합정/홍대-홍대리엠뮤직';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-신촌-그라운드-신촌', '그라운드 신촌', '그라운드 신촌 합주실 정보', 2, '서울특별시 마포구 백범로1길 83, 지1층 비101호, 비102호', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 2 FROM studios WHERE slug='studio-신촌-그라운드-신촌';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '1182602', 'https://m.booking.naver.com/booking/10/bizes/1182602' FROM studios WHERE slug='studio-신촌-그라운드-신촌';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'A룸', 15000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-신촌-그라운드-신촌';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '5979448' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-신촌-그라운드-신촌' AND r.name='A룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'B룸', 13000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-신촌-그라운드-신촌';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '5979471' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-신촌-그라운드-신촌' AND r.name='B룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'C룸', 12000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-신촌-그라운드-신촌';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '5979479' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-신촌-그라운드-신촌' AND r.name='C룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'S룸', 22000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-신촌-그라운드-신촌';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '5979437' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-신촌-그라운드-신촌' AND r.name='S룸';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-신촌-드림', '드림', '드림 합주실 신촌/연대점 정보', 2, '신촌 지역', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 2 FROM studios WHERE slug='studio-신촌-드림';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '본점 A', 18000, 'SCRAPED', 8, 8, true FROM studios WHERE slug='studio-신촌-드림';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '본점 B', 17000, 'SCRAPED', 7, 7, true FROM studios WHERE slug='studio-신촌-드림';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '본점 C', 14000, 'SCRAPED', 5, 5, true FROM studios WHERE slug='studio-신촌-드림';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '연대점 R', 24000, 'SCRAPED', 12, 12, true FROM studios WHERE slug='studio-신촌-드림';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '연대점 Q', 22000, 'SCRAPED', 10, 10, true FROM studios WHERE slug='studio-신촌-드림';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '연대점 F', 15000, 'SCRAPED', 6, 6, true FROM studios WHERE slug='studio-신촌-드림';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '본점 V', 24000, 'SCRAPED', 12, 12, true FROM studios WHERE slug='studio-신촌-드림';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-신촌-라디오가가', '라디오가가', '라디오가가 합주실 정보', 2, '서울특별시 마포구 신촌로16길 10', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 2 FROM studios WHERE slug='studio-신촌-라디오가가';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '1482133', 'https://m.booking.naver.com/booking/10/bizes/1482133/items/6999756?area=bmp&lang=ko&map-search=1&service-target=map-pc&theme=place' FROM studios WHERE slug='studio-신촌-라디오가가';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'A룸', 18000, 'SCRAPED', 15, 15, true FROM studios WHERE slug='studio-신촌-라디오가가';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '6999824' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-신촌-라디오가가' AND r.name='A룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'B룸', 16000, 'SCRAPED', 11, 11, true FROM studios WHERE slug='studio-신촌-라디오가가';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '6999897' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-신촌-라디오가가' AND r.name='B룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'C룸', 14000, 'SCRAPED', 8, 8, true FROM studios WHERE slug='studio-신촌-라디오가가';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '6999954' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-신촌-라디오가가' AND r.name='C룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'D룸', 14000, 'SCRAPED', 9, 9, true FROM studios WHERE slug='studio-신촌-라디오가가';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '6999972' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-신촌-라디오가가' AND r.name='D룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'S룸', 20000, 'SCRAPED', 20, 20, true FROM studios WHERE slug='studio-신촌-라디오가가';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '6999756' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-신촌-라디오가가' AND r.name='S룸';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-신촌-신촌-그라운드', '신촌 그라운드', '신촌 그라운드 합주실 정보', 2, '서울특별시 마포구 신촌로12나길 29', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 2 FROM studios WHERE slug='studio-신촌-신촌-그라운드';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '1062814', 'https://m.booking.naver.com/booking/10/bizes/1062814/items/5591709?area=bmp&lang=ko&map-search=1&service-target=map-pc&theme=place' FROM studios WHERE slug='studio-신촌-신촌-그라운드';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'B룸', 12000, 'SCRAPED', 5, 5, true FROM studios WHERE slug='studio-신촌-신촌-그라운드';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '5591729' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-신촌-신촌-그라운드' AND r.name='B룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'A룸', 17000, 'SCRAPED', 8, 8, true FROM studios WHERE slug='studio-신촌-신촌-그라운드';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '5591709' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-신촌-신촌-그라운드' AND r.name='A룸';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-신촌-신촌fms', '신촌FMS', '신촌FMS 합주실 정보', 2, '신촌 지역', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 2 FROM studios WHERE slug='studio-신촌-신촌fms';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-사당/이수-그루브-사당점', '그루브 사당점', '그루브 사당점 합주실 정보', 3, '사당/이수 지역', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 3 FROM studios WHERE slug='studio-사당/이수-그루브-사당점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'B룸', 20000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-사당/이수-그루브-사당점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'C룸', 17000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-사당/이수-그루브-사당점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'D룸', 15000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-사당/이수-그루브-사당점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'A룸', 22000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-사당/이수-그루브-사당점';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-사당/이수-드림-사당1호점', '드림 사당1호점', '드림 합주실 사당점 정보', 3, '사당/이수 지역', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 3 FROM studios WHERE slug='studio-사당/이수-드림-사당1호점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '사당1호점 S', 23000, 'SCRAPED', 12, 12, true FROM studios WHERE slug='studio-사당/이수-드림-사당1호점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '사당1호점 Q', 21000, 'SCRAPED', 10, 10, true FROM studios WHERE slug='studio-사당/이수-드림-사당1호점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '사당1호점 C', 17000, 'SCRAPED', 7, 7, true FROM studios WHERE slug='studio-사당/이수-드림-사당1호점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '사당1호점 D', 12000, 'SCRAPED', 5, 5, true FROM studios WHERE slug='studio-사당/이수-드림-사당1호점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '사당1호점 V', 25000, 'SCRAPED', 13, 13, true FROM studios WHERE slug='studio-사당/이수-드림-사당1호점';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-사당/이수-드림-사당2호점', '드림 사당2호점', '드림 합주실 사당점 정보', 3, '사당/이수 지역', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 3 FROM studios WHERE slug='studio-사당/이수-드림-사당2호점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '사당2호점 2번방', 26000, 'SCRAPED', 13, 13, true FROM studios WHERE slug='studio-사당/이수-드림-사당2호점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '사당2호점 3번방', 25000, 'SCRAPED', 12, 12, true FROM studios WHERE slug='studio-사당/이수-드림-사당2호점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '사당2호점 4번방', 22000, 'SCRAPED', 9, 9, true FROM studios WHERE slug='studio-사당/이수-드림-사당2호점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '사당2호점 1번방', 28000, 'SCRAPED', 14, 14, true FROM studios WHERE slug='studio-사당/이수-드림-사당2호점';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-sadang_isu-드림-사당점', '드림 사당점', '룸 구성 | - 사당점 V · 25,000원/시간 | - 사당점 S · 23,000원/시간 | - 사당점 Q · 21,000원/시간 | - 사당점 C · 17,000원/시간 | - 사당점 D · 12,000원/시간', 3, '사당/이수 지역', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 3 FROM studios WHERE slug='studio-sadang_isu-드림-사당점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '사당점 C', NULL, 'UNKNOWN', 8, 8, true FROM studios WHERE slug='studio-sadang_isu-드림-사당점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '사당점 D', NULL, 'UNKNOWN', 5, 5, true FROM studios WHERE slug='studio-sadang_isu-드림-사당점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '사당점 Q', NULL, 'UNKNOWN', 10, 10, true FROM studios WHERE slug='studio-sadang_isu-드림-사당점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '사당점 S', NULL, 'UNKNOWN', 12, 12, true FROM studios WHERE slug='studio-sadang_isu-드림-사당점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '사당점 V', NULL, 'UNKNOWN', 13, 13, true FROM studios WHERE slug='studio-sadang_isu-드림-사당점';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-사당/이수-비쥬1호점', '비쥬1호점', '비쥬1호점 합주실 정보', 3, '서울특별시 서초구 동작대로 54-1, 지하 1층', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 3 FROM studios WHERE slug='studio-사당/이수-비쥬1호점';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '522011', 'https://m.booking.naver.com/booking/10/bizes/522011' FROM studios WHERE slug='studio-사당/이수-비쥬1호점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '화이트룸', 17000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-사당/이수-비쥬1호점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '블랙룸', 22000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-사당/이수-비쥬1호점';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-사당/이수-비쥬2호점', '비쥬2호점', '비쥬2호점 합주실 정보', 3, '서울특별시 서초구 동작대로 52, 지하1층', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 3 FROM studios WHERE slug='studio-사당/이수-비쥬2호점';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '706924', 'https://m.booking.naver.com/booking/10/bizes/706924' FROM studios WHERE slug='studio-사당/이수-비쥬2호점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'B룸', 23000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-사당/이수-비쥬2호점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'A룸', 23000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-사당/이수-비쥬2호점';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-사당/이수-비쥬3호점', '비쥬3호점', '비쥬3호점 합주실 정보', 3, '서울특별시 서초구 동작대로 48, 지하1층', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 3 FROM studios WHERE slug='studio-사당/이수-비쥬3호점';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '917236', 'https://m.booking.naver.com/booking/10/bizes/917236' FROM studios WHERE slug='studio-사당/이수-비쥬3호점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'M룸', 25000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-사당/이수-비쥬3호점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'J룸', 25000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-사당/이수-비쥬3호점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'C룸', 25000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-사당/이수-비쥬3호점';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-사당/이수-사운딕트', '사운딕트', '사운딕트 합주실 정보', 3, '서울특별시 동작구 사당로30길 43, 지층', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 3 FROM studios WHERE slug='studio-사당/이수-사운딕트';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '1132767', 'https://m.booking.naver.com/booking/10/bizes/1132767' FROM studios WHERE slug='studio-사당/이수-사운딕트';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'B룸', 19000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-사당/이수-사운딕트';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '5850284' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-사당/이수-사운딕트' AND r.name='B룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'C룸', 18000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-사당/이수-사운딕트';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '5836988' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-사당/이수-사운딕트' AND r.name='C룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'A룸', 20000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-사당/이수-사운딕트';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '5836982' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-사당/이수-사운딕트' AND r.name='A룸';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-사당/이수-사운딕트2호점', '사운딕트2호점', '사운딕트2호점 합주실 정보', 3, '서울특별시 동작구 사당로30길 25, 지하2층 B201호', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 3 FROM studios WHERE slug='studio-사당/이수-사운딕트2호점';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '1603022', 'https://m.booking.naver.com/booking/10/bizes/1603022/items/7476895?area=bmp&lang=ko&map-search=1&service-target=map-pc&theme=place' FROM studios WHERE slug='studio-사당/이수-사운딕트2호점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'A ROOM', NULL, 'UNKNOWN', NULL, NULL, true FROM studios WHERE slug='studio-사당/이수-사운딕트2호점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '7476906' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-사당/이수-사운딕트2호점' AND r.name='A ROOM';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'B ROOM', NULL, 'UNKNOWN', NULL, NULL, true FROM studios WHERE slug='studio-사당/이수-사운딕트2호점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '7476916' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-사당/이수-사운딕트2호점' AND r.name='B ROOM';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'S ROOM', NULL, 'UNKNOWN', NULL, NULL, true FROM studios WHERE slug='studio-사당/이수-사운딕트2호점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '7476895' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-사당/이수-사운딕트2호점' AND r.name='S ROOM';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-사당/이수-에이타입사운드', '에이타입사운드', '에이타입사운드 합주실 정보', 3, '서울특별시 동작구 사당로 281', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 3 FROM studios WHERE slug='studio-사당/이수-에이타입사운드';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '838294', 'https://m.booking.naver.com/booking/10/bizes/838294' FROM studios WHERE slug='studio-사당/이수-에이타입사운드';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '라운지', 18000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-사당/이수-에이타입사운드';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '스테이지', 18000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-사당/이수-에이타입사운드';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '4844237' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-사당/이수-에이타입사운드' AND r.name='스테이지';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-사당/이수-위드뮤직', '위드뮤직', '위드뮤직 합주실 정보', 3, '서울특별시 서초구 서초대로 31, 지하층', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 3 FROM studios WHERE slug='studio-사당/이수-위드뮤직';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '773046', 'https://m.booking.naver.com/booking/10/bizes/773046' FROM studios WHERE slug='studio-사당/이수-위드뮤직';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'B룸', 22000, 'SCRAPED', 5, 5, true FROM studios WHERE slug='studio-사당/이수-위드뮤직';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '5059435' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-사당/이수-위드뮤직' AND r.name='B룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'A룸', 26000, 'SCRAPED', 8, 8, true FROM studios WHERE slug='studio-사당/이수-위드뮤직';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '5059426' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-사당/이수-위드뮤직' AND r.name='A룸';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-사당/이수-톤', '톤', '톤 합주실 정보', 3, '서울특별시 서초구 동작대로 108, 지하 4층', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 3 FROM studios WHERE slug='studio-사당/이수-톤';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '1374245', 'https://m.booking.naver.com/booking/10/bizes/1374245/items/6614091?area=bmp&lang=ko&map-search=1&service-target=map-pc&theme=place' FROM studios WHERE slug='studio-사당/이수-톤';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'A룸', 24000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-사당/이수-톤';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-신도림/영등포구청-겟밴드-아지트', '겟밴드 아지트', '겟밴드 아지트 합주실 정보', 4, '신도림/영등포구청 지역', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 4 FROM studios WHERE slug='studio-신도림/영등포구청-겟밴드-아지트';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '겟밴드아지트', 14000, 'SCRAPED', 15, 15, true FROM studios WHERE slug='studio-신도림/영등포구청-겟밴드-아지트';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '기본룸', NULL, 'UNKNOWN', NULL, NULL, true FROM studios WHERE slug='studio-신도림/영등포구청-겟밴드-아지트';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-신도림/영등포구청-뮤지트', '뮤지트', '뮤지트 합주실 정보', 4, '서울특별시 구로구 새말로16길 21, 지하1층', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 4 FROM studios WHERE slug='studio-신도림/영등포구청-뮤지트';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '1504370', 'https://m.booking.naver.com/booking/10/bizes/1504370/items/7128673?area=bmp&lang=ko&map-search=1&service-target=map-pc&theme=place' FROM studios WHERE slug='studio-신도림/영등포구청-뮤지트';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '합주실', 25000, 'SCRAPED', 8, 8, true FROM studios WHERE slug='studio-신도림/영등포구청-뮤지트';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-신도림/영등포구청-일상', '일상', '일상 합주실 정보', 4, '서울특별시 구로구 공원로6나길 6, 지하1층', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 4 FROM studios WHERE slug='studio-신도림/영등포구청-일상';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '1400367', 'https://m.booking.naver.com/booking/10/bizes/1400367/items/6702060?area=bmp&lang=ko&map-search=1&service-target=map-pc&theme=place' FROM studios WHERE slug='studio-신도림/영등포구청-일상';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'B룸', 19000, 'SCRAPED', 6, 6, true FROM studios WHERE slug='studio-신도림/영등포구청-일상';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '6702098' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-신도림/영등포구청-일상' AND r.name='B룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'C룸', 15000, 'SCRAPED', 6, 6, true FROM studios WHERE slug='studio-신도림/영등포구청-일상';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '6854551' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-신도림/영등포구청-일상' AND r.name='C룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'D룸', 15000, 'SCRAPED', 6, 6, true FROM studios WHERE slug='studio-신도림/영등포구청-일상';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '6990290' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-신도림/영등포구청-일상' AND r.name='D룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'A룸', 19000, 'SCRAPED', 6, 6, true FROM studios WHERE slug='studio-신도림/영등포구청-일상';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '6702060' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-신도림/영등포구청-일상' AND r.name='A룸';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-mangwon-3YL리허설', '3YL리허설', NULL, 5, '서울특별시 마포구 월드컵로25길 52, 지1층', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 5 FROM studios WHERE slug='studio-mangwon-3YL리허설';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '759837', 'https://m.booking.naver.com/booking/10/bizes/759837/items/4601781?area=bmp&lang=ko&map-search=1&service-target=map-pc&theme=place' FROM studios WHERE slug='studio-mangwon-3YL리허설';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'ROOM 1', NULL, 'UNKNOWN', NULL, NULL, true FROM studios WHERE slug='studio-mangwon-3YL리허설';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'ROOM 2', NULL, 'UNKNOWN', NULL, NULL, true FROM studios WHERE slug='studio-mangwon-3YL리허설';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-mangwon-알엠스튜디오', '알엠스튜디오', NULL, 5, '서울특별시 마포구 방울내로11길 26, 지1층', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 5 FROM studios WHERE slug='studio-mangwon-알엠스튜디오';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '1500479', 'https://m.booking.naver.com/booking/10/bizes/1500479/items/7071364?area=bmp&lang=ko&map-search=1&service-target=map-pc&theme=place' FROM studios WHERE slug='studio-mangwon-알엠스튜디오';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'A룸', NULL, 'UNKNOWN', NULL, NULL, true FROM studios WHERE slug='studio-mangwon-알엠스튜디오';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-상도,중앙대-스페이스개러지-중앙대점', '스페이스개러지 중앙대점', '스페이스개러지 중앙대점 합주실 정보', 6, '서울특별시 동작구 현충로 92, 지하1층', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 6 FROM studios WHERE slug='studio-상도,중앙대-스페이스개러지-중앙대점';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '1042278', 'https://m.booking.naver.com/booking/10/bizes/1042278/items/5865609?area=bmp&lang=ko&map-search=1&service-target=map-pc&theme=place' FROM studios WHERE slug='studio-상도,중앙대-스페이스개러지-중앙대점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'Room R', 15000, 'SCRAPED', 6, 6, true FROM studios WHERE slug='studio-상도,중앙대-스페이스개러지-중앙대점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '5667365' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-상도,중앙대-스페이스개러지-중앙대점' AND r.name='Room R';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'Room X', 13000, 'SCRAPED', 8, 8, true FROM studios WHERE slug='studio-상도,중앙대-스페이스개러지-중앙대점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '6925753' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-상도,중앙대-스페이스개러지-중앙대점' AND r.name='Room X';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'Room L', 20000, 'SCRAPED', 15, 15, true FROM studios WHERE slug='studio-상도,중앙대-스페이스개러지-중앙대점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '5865609' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-상도,중앙대-스페이스개러지-중앙대점' AND r.name='Room L';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-상도,중앙대-위드제이', '위드제이', '위드제이 합주실 정보', 6, '서울특별시 동작구 장승배기로 8-1, 지층', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 6 FROM studios WHERE slug='studio-상도,중앙대-위드제이';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '1120335', 'https://m.booking.naver.com/booking/10/bizes/1120335/items/5851692?area=bmp&lang=ko&map-search=1&service-target=map-pc&theme=place' FROM studios WHERE slug='studio-상도,중앙대-위드제이';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '합주실', 10000, 'SCRAPED', 6, 6, true FROM studios WHERE slug='studio-상도,중앙대-위드제이';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '5851692' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-상도,중앙대-위드제이' AND r.name='합주실';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-상도,중앙대-준사운드', '준사운드', '준사운드 합주실 정보', 6, '서울특별시 동작구 양녕로 271, 지하1층', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 6 FROM studios WHERE slug='studio-상도,중앙대-준사운드';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '1384809', 'https://m.booking.naver.com/booking/10/bizes/1384809/items/6649859?area=bmp&lang=ko&map-search=1&service-target=map-pc&theme=place' FROM studios WHERE slug='studio-상도,중앙대-준사운드';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'B룸', 20000, 'SCRAPED', 6, 6, true FROM studios WHERE slug='studio-상도,중앙대-준사운드';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '6677665' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-상도,중앙대-준사운드' AND r.name='B룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'S룸', 21000, 'SCRAPED', 6, 6, true FROM studios WHERE slug='studio-상도,중앙대-준사운드';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '6649835' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-상도,중앙대-준사운드' AND r.name='S룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'A룸', 22000, 'SCRAPED', 6, 6, true FROM studios WHERE slug='studio-상도,중앙대-준사운드';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '6649859' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-상도,중앙대-준사운드' AND r.name='A룸';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-서울대입구-DOH음악스튜디오', 'DOH음악스튜디오', 'DOH음악스튜디오 합주실 정보', 7, '서울특별시 관악구 양녕로 19-1, 3층', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 7 FROM studios WHERE slug='studio-서울대입구-DOH음악스튜디오';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '1202079', 'https://m.booking.naver.com/booking/10/bizes/1202079/items/6054832?area=bmp&lang=ko&map-search=1&service-target=map-pc&theme=place' FROM studios WHERE slug='studio-서울대입구-DOH음악스튜디오';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '라운지합주실', 16000, 'SCRAPED', 8, 8, true FROM studios WHERE slug='studio-서울대입구-DOH음악스튜디오';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '6054832' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-서울대입구-DOH음악스튜디오' AND r.name='라운지합주실';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-서울대입구-길드합주실', '길드합주실', '길드합주실 합주실 정보', 7, '서울특별시 관악구 낙성대로 12, 지하1층', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 7 FROM studios WHERE slug='studio-서울대입구-길드합주실';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '1567821', 'https://m.booking.naver.com/booking/10/bizes/1567821/items/7318663?area=bmp&lang=ko&map-search=1&service-target=map-pc&theme=place' FROM studios WHERE slug='studio-서울대입구-길드합주실';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '유니크룸', 19000, 'SCRAPED', 7, 7, true FROM studios WHERE slug='studio-서울대입구-길드합주실';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '7318717' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-서울대입구-길드합주실' AND r.name='유니크룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '레어룸', 17000, 'SCRAPED', 6, 6, true FROM studios WHERE slug='studio-서울대입구-길드합주실';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '7318732' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-서울대입구-길드합주실' AND r.name='레어룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '에픽룸', 22000, 'SCRAPED', 10, 10, true FROM studios WHERE slug='studio-서울대입구-길드합주실';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '7318663' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-서울대입구-길드합주실' AND r.name='에픽룸';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-서울대입구-모노합주실', '모노합주실', '모노합주실 합주실 정보', 7, '서울특별시 관악구 봉천로 518-4, 4층', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 7 FROM studios WHERE slug='studio-서울대입구-모노합주실';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '1563307', 'https://m.booking.naver.com/booking/10/bizes/1563307/items/7300112?area=bmp&lang=ko&map-search=1&service-target=map-pc&theme=place' FROM studios WHERE slug='studio-서울대입구-모노합주실';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'A룸', 22000, 'SCRAPED', 15, 15, true FROM studios WHERE slug='studio-서울대입구-모노합주실';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '7300112' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-서울대입구-모노합주실' AND r.name='A룸';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-서울대입구-브이엔앰스토리', '브이엔앰스토리', '브이엔앰스토리 합주실 정보', 7, '서울특별시 관악구 중앙길 27, 지하1층', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 7 FROM studios WHERE slug='studio-서울대입구-브이엔앰스토리';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '879630', 'https://m.booking.naver.com/booking/10/bizes/879630/items/5179359?area=bmp&lang=ko&map-search=1&service-target=map-pc&theme=place' FROM studios WHERE slug='studio-서울대입구-브이엔앰스토리';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'Garage Music Studio 1', 25000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-서울대입구-브이엔앰스토리';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-방배-그루브-방배점', '그루브 방배점', '그루브 방배점 합주실 정보', 8, '방배 지역', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 8 FROM studios WHERE slug='studio-방배-그루브-방배점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '2번방', 17000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-방배-그루브-방배점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '3번방', 15000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-방배-그루브-방배점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '4번방', 14000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-방배-그루브-방배점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '5번방', 14000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-방배-그루브-방배점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '1번방', 17000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-방배-그루브-방배점';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-방배-보고스튜디오', '보고스튜디오', '보고스튜디오 합주실 정보', 8, '서울특별시 서초구 방배로10길 18, 지하 101호', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 8 FROM studios WHERE slug='studio-방배-보고스튜디오';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '1173895', 'https://m.booking.naver.com/booking/10/bizes/1173895/items/5946156?area=bmp&lang=ko&map-search=1&service-target=map-pc&theme=place' FROM studios WHERE slug='studio-방배-보고스튜디오';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '보고합주실', 20000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-방배-보고스튜디오';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '5946156' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-방배-보고스튜디오' AND r.name='보고합주실';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-방배-비쥬-방배점', '비쥬 방배점', '비쥬 방배점 합주실 정보', 8, '서울특별시 서초구 방배로 60, 지층 1호', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 8 FROM studios WHERE slug='studio-방배-비쥬-방배점';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '1227688', 'https://m.booking.naver.com/booking/10/bizes/1227688/items/6150469?area=bmp&lang=ko&map-search=1&service-target=map-pc&theme=place' FROM studios WHERE slug='studio-방배-비쥬-방배점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '2번룸', 20000, 'SCRAPED', 13, 13, true FROM studios WHERE slug='studio-방배-비쥬-방배점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '6150491' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-방배-비쥬-방배점' AND r.name='2번룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '3번룸', 20000, 'SCRAPED', 13, 13, true FROM studios WHERE slug='studio-방배-비쥬-방배점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '4번룸', 20000, 'SCRAPED', 13, 13, true FROM studios WHERE slug='studio-방배-비쥬-방배점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '6150566' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-방배-비쥬-방배점' AND r.name='4번룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '5번룸', 20000, 'SCRAPED', 10, 10, true FROM studios WHERE slug='studio-방배-비쥬-방배점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '6번룸', 20000, 'SCRAPED', 13, 13, true FROM studios WHERE slug='studio-방배-비쥬-방배점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '7041191' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-방배-비쥬-방배점' AND r.name='6번룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '7번룸', 20000, 'SCRAPED', 10, 10, true FROM studios WHERE slug='studio-방배-비쥬-방배점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '7041192' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-방배-비쥬-방배점' AND r.name='7번룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '1번룸', 20000, 'SCRAPED', 13, 13, true FROM studios WHERE slug='studio-방배-비쥬-방배점';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-혜화/성신여대-드림-대학로점', '드림 대학로점', '드림 대학로점 합주실 정보', 9, '혜화/성신여대 지역', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 9 FROM studios WHERE slug='studio-혜화/성신여대-드림-대학로점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '대학로 1호점 B', 17000, 'SCRAPED', 6, 6, true FROM studios WHERE slug='studio-혜화/성신여대-드림-대학로점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '대학로 1호점 C', 17000, 'SCRAPED', 5, 5, true FROM studios WHERE slug='studio-혜화/성신여대-드림-대학로점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '대학로 2호점 S', 17000, 'SCRAPED', 9, 9, true FROM studios WHERE slug='studio-혜화/성신여대-드림-대학로점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '대학로 2호점 R', 17000, 'SCRAPED', 12, 12, true FROM studios WHERE slug='studio-혜화/성신여대-드림-대학로점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '대학로 1호점 A', 17000, 'SCRAPED', 7, 7, true FROM studios WHERE slug='studio-혜화/성신여대-드림-대학로점';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-혜화/성신여대-드림-마로니에점', '드림 마로니에점', '드림 마로니에점 합주실 정보', 9, '혜화/성신여대 지역', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 9 FROM studios WHERE slug='studio-혜화/성신여대-드림-마로니에점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '마로니에 3호점 G', 27000, 'SCRAPED', 13, 13, true FROM studios WHERE slug='studio-혜화/성신여대-드림-마로니에점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '마로니에 3호점 O', 25000, 'SCRAPED', 12, 12, true FROM studios WHERE slug='studio-혜화/성신여대-드림-마로니에점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '마로니에 3호점 D', 21000, 'SCRAPED', 9, 9, true FROM studios WHERE slug='studio-혜화/성신여대-드림-마로니에점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '마로니에 3호점 J', 29000, 'SCRAPED', 15, 15, true FROM studios WHERE slug='studio-혜화/성신여대-드림-마로니에점';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-hyehwa_sungshin-룸디', '룸디', NULL, 9, '서울특별시 성북구 동소문로20가길 51, 5층', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 9 FROM studios WHERE slug='studio-hyehwa_sungshin-룸디';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '1555966', 'https://m.booking.naver.com/booking/10/bizes/1555966/items/7274727?area=bmp&lang=ko&map-search=1&service-target=map-pc&theme=place' FROM studios WHERE slug='studio-hyehwa_sungshin-룸디';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'Rehearsal Room A (심야)', NULL, 'UNKNOWN', NULL, NULL, true FROM studios WHERE slug='studio-hyehwa_sungshin-룸디';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '7274727' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-hyehwa_sungshin-룸디' AND r.name='Rehearsal Room A (심야)';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'Rehearsal Room A (주/야간)', NULL, 'UNKNOWN', NULL, NULL, true FROM studios WHERE slug='studio-hyehwa_sungshin-룸디';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '7274727' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-hyehwa_sungshin-룸디' AND r.name='Rehearsal Room A (주/야간)';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'Rehearsal Room B (심야)', NULL, 'UNKNOWN', NULL, NULL, true FROM studios WHERE slug='studio-hyehwa_sungshin-룸디';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '7274795' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-hyehwa_sungshin-룸디' AND r.name='Rehearsal Room B (심야)';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'Rehearsal Room B (주/야간)', NULL, 'UNKNOWN', NULL, NULL, true FROM studios WHERE slug='studio-hyehwa_sungshin-룸디';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '7274795' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-hyehwa_sungshin-룸디' AND r.name='Rehearsal Room B (주/야간)';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-혜화/성신여대-성북천-음악소', '성북천 음악소', '성북천 음악소 합주실 정보', 9, '혜화/성신여대 지역', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 9 FROM studios WHERE slug='studio-혜화/성신여대-성북천-음악소';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '1번방', 12000, 'SCRAPED', 10, 10, true FROM studios WHERE slug='studio-혜화/성신여대-성북천-음악소';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-혜화/성신여대-세탁소아랫집', '세탁소아랫집', '세탁소아랫집 합주실 정보', 9, '서울특별시 성북구 삼선교로14길 30, 지하 1층', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 9 FROM studios WHERE slug='studio-혜화/성신여대-세탁소아랫집';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '784413', 'https://m.booking.naver.com/booking/10/bizes/784413/items/4678539?area=bmp&lang=ko&map-search=1&service-target=map-pc&theme=place' FROM studios WHERE slug='studio-혜화/성신여대-세탁소아랫집';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '스튜디오', 20000, 'SCRAPED', 10, 10, true FROM studios WHERE slug='studio-혜화/성신여대-세탁소아랫집';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '4678539' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-혜화/성신여대-세탁소아랫집' AND r.name='스튜디오';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-혜화/성신여대-스페이스개러지-성신여대점', '스페이스개러지 성신여대점', '스페이스개러지 성신여대점 합주실 정보', 9, '서울특별시 성북구 동소문로22길 57-12, 지하1층', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 9 FROM studios WHERE slug='studio-혜화/성신여대-스페이스개러지-성신여대점';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '1577612', 'https://m.booking.naver.com/booking/10/bizes/1577612/items/7357126?area=bmp&lang=ko&map-search=1&service-target=map-pc&theme=place' FROM studios WHERE slug='studio-혜화/성신여대-스페이스개러지-성신여대점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'Room R', 15000, 'SCRAPED', 6, 6, true FROM studios WHERE slug='studio-혜화/성신여대-스페이스개러지-성신여대점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '7363271' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-혜화/성신여대-스페이스개러지-성신여대점' AND r.name='Room R';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'Room X', 13000, 'SCRAPED', 4, 4, true FROM studios WHERE slug='studio-혜화/성신여대-스페이스개러지-성신여대점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '7363282' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-혜화/성신여대-스페이스개러지-성신여대점' AND r.name='Room X';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'Room L', 18000, 'SCRAPED', 8, 8, true FROM studios WHERE slug='studio-혜화/성신여대-스페이스개러지-성신여대점';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '7357126' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-혜화/성신여대-스페이스개러지-성신여대점' AND r.name='Room L';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-혜화/성신여대-영사운드', '영사운드', '영사운드 합주실 정보', 9, '서울특별시 성북구 동소문로15길 8, 지층', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 9 FROM studios WHERE slug='studio-혜화/성신여대-영사운드';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '1362561', 'https://m.booking.naver.com/booking/10/bizes/1362561/items/6654617?area=bmp&lang=ko&map-search=1&service-target=map-pc&theme=place' FROM studios WHERE slug='studio-혜화/성신여대-영사운드';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '영사운드합주실', 15000, 'SCRAPED', 8, 8, true FROM studios WHERE slug='studio-혜화/성신여대-영사운드';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '6654617' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-혜화/성신여대-영사운드' AND r.name='영사운드합주실';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-강남-레드스튜디오', '레드스튜디오', '레드스튜디오 합주실 정보', 10, '강남 지역', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 10 FROM studios WHERE slug='studio-강남-레드스튜디오';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '합주실', 20000, 'SCRAPED', 5, 5, true FROM studios WHERE slug='studio-강남-레드스튜디오';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-강남-리엠뮤직-강남', '리엠뮤직 강남', '리엠뮤직 강남 합주실 정보', 10, '강남 지역', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 10 FROM studios WHERE slug='studio-강남-리엠뮤직-강남';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '리엠뮤직합주실', 22000, 'SCRAPED', 15, 15, true FROM studios WHERE slug='studio-강남-리엠뮤직-강남';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-강남-엠플사운드', '엠플사운드', '엠플사운드 합주실 정보', 10, '강남 지역', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 10 FROM studios WHERE slug='studio-강남-엠플사운드';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'A2룸', 25000, 'SCRAPED', 10, 10, true FROM studios WHERE slug='studio-강남-엠플사운드';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'B1룸', 23000, 'SCRAPED', 7, 7, true FROM studios WHERE slug='studio-강남-엠플사운드';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'B2룸', 23000, 'SCRAPED', 7, 7, true FROM studios WHERE slug='studio-강남-엠플사운드';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'C룸', 18000, 'SCRAPED', 5, 5, true FROM studios WHERE slug='studio-강남-엠플사운드';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'A1룸', 25000, 'SCRAPED', 10, 10, true FROM studios WHERE slug='studio-강남-엠플사운드';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-강남-파워하우스', '파워하우스', '파워하우스 합주실 정보', 10, '강남 지역', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 10 FROM studios WHERE slug='studio-강남-파워하우스';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'Studio B', 33000, 'SCRAPED', 7, 7, true FROM studios WHERE slug='studio-강남-파워하우스';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'Studio C', 22000, 'SCRAPED', 5, 5, true FROM studios WHERE slug='studio-강남-파워하우스';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'Studio A', 44000, 'SCRAPED', 10, 10, true FROM studios WHERE slug='studio-강남-파워하우스';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-강동/송파-리엠뮤직-잠실', '리엠뮤직 잠실', '리엠뮤직 잠실 합주실 정보', 11, '강동/송파 지역', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 11 FROM studios WHERE slug='studio-강동/송파-리엠뮤직-잠실';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '리엠뮤직합주실', 22000, 'SCRAPED', 30, 30, true FROM studios WHERE slug='studio-강동/송파-리엠뮤직-잠실';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-강동/송파-리튬', '리튬', '리튬 합주실 정보', 11, '서울특별시 송파구 양재대로71길 28-22, 지하 1층', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 11 FROM studios WHERE slug='studio-강동/송파-리튬';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '1255568', 'https://m.booking.naver.com/booking/10/bizes/1255568/items/6252193?area=bmp&lang=ko&map-search=1&service-target=map-pc&theme=place' FROM studios WHERE slug='studio-강동/송파-리튬';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'Main Room', NULL, 'UNKNOWN', NULL, NULL, true FROM studios WHERE slug='studio-강동/송파-리튬';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '6252193' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-강동/송파-리튬' AND r.name='Main Room';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '메인룸', 22000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-강동/송파-리튬';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-강동/송파-브라더-강동', '브라더 강동', '브라더 강동 합주실 정보', 11, '서울특별시 강동구 성내로6길 32, 장성글로벌 지하1층', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 11 FROM studios WHERE slug='studio-강동/송파-브라더-강동';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '1216066', 'https://m.booking.naver.com/booking/10/bizes/1216066/items/6107148?area=bmp&lang=ko&map-search=1&service-target=map-pc&theme=place' FROM studios WHERE slug='studio-강동/송파-브라더-강동';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '2번방', 25000, 'SCRAPED', 10, 10, true FROM studios WHERE slug='studio-강동/송파-브라더-강동';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '6107376' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-강동/송파-브라더-강동' AND r.name='2번방';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '5번방', 25000, 'SCRAPED', 10, 10, true FROM studios WHERE slug='studio-강동/송파-브라더-강동';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '6107448' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-강동/송파-브라더-강동' AND r.name='5번방';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '3번방', 19500, 'SCRAPED', 10, 10, true FROM studios WHERE slug='studio-강동/송파-브라더-강동';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '6115321' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-강동/송파-브라더-강동' AND r.name='3번방';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '4번방', 19500, 'SCRAPED', 10, 10, true FROM studios WHERE slug='studio-강동/송파-브라더-강동';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '6128721' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-강동/송파-브라더-강동' AND r.name='4번방';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '1번방', 25000, 'SCRAPED', 10, 10, true FROM studios WHERE slug='studio-강동/송파-브라더-강동';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '6107148' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-강동/송파-브라더-강동' AND r.name='1번방';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-강동/송파-브라더-송파', '브라더 송파', '브라더 송파 합주실 정보', 11, '서울특별시 송파구 위례성대로 52, 쌈지빌딩 지하1층', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 11 FROM studios WHERE slug='studio-강동/송파-브라더-송파';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '1555383', 'https://m.booking.naver.com/booking/10/bizes/1555383/items/7267309?area=bmp&lang=ko&map-search=1&service-target=map-pc&theme=place' FROM studios WHERE slug='studio-강동/송파-브라더-송파';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '2번방', 25000, 'SCRAPED', 10, 10, true FROM studios WHERE slug='studio-강동/송파-브라더-송파';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '7311413' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-강동/송파-브라더-송파' AND r.name='2번방';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '3번방', 25000, 'SCRAPED', 10, 10, true FROM studios WHERE slug='studio-강동/송파-브라더-송파';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '7319381' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-강동/송파-브라더-송파' AND r.name='3번방';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '4번방', 15000, 'SCRAPED', 5, 5, true FROM studios WHERE slug='studio-강동/송파-브라더-송파';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '7459490' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-강동/송파-브라더-송파' AND r.name='4번방';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '라이브홀', 49000, 'SCRAPED', 30, 30, true FROM studios WHERE slug='studio-강동/송파-브라더-송파';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '7319399' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-강동/송파-브라더-송파' AND r.name='라이브홀';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '1번방', 25000, 'SCRAPED', 10, 10, true FROM studios WHERE slug='studio-강동/송파-브라더-송파';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '7267309' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-강동/송파-브라더-송파' AND r.name='1번방';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-강동/송파-스페이스블루', '스페이스블루', '스페이스블루 합주실 정보', 11, '강동/송파 지역', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 11 FROM studios WHERE slug='studio-강동/송파-스페이스블루';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '대양홀', 30000, 'SCRAPED', 10, 10, true FROM studios WHERE slug='studio-강동/송파-스페이스블루';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-강동/송파-아지트', '아지트', '아지트 합주실 정보', 11, '서울특별시 송파구 백제고분로9길 34, 아지트합주실', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 11 FROM studios WHERE slug='studio-강동/송파-아지트';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '574124', 'https://m.booking.naver.com/booking/10/bizes/574124/items/4064351?area=bmp&lang=ko&map-search=1&service-target=map-pc&theme=place' FROM studios WHERE slug='studio-강동/송파-아지트';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'S room', 21000, 'SCRAPED', 12, 12, true FROM studios WHERE slug='studio-강동/송파-아지트';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '4064371' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-강동/송파-아지트' AND r.name='S room';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'A room', 18000, 'SCRAPED', 6, 6, true FROM studios WHERE slug='studio-강동/송파-아지트';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '4064391' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-강동/송파-아지트' AND r.name='A room';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'B room', 16000, 'SCRAPED', 5, 5, true FROM studios WHERE slug='studio-강동/송파-아지트';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '4064397' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-강동/송파-아지트' AND r.name='B room';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'R room', 24000, 'SCRAPED', 15, 15, true FROM studios WHERE slug='studio-강동/송파-아지트';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '4064351' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-강동/송파-아지트' AND r.name='R room';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-gangdong_songpa-호세네아지트', '호세네아지트', '룸 구성 | - 호세네 합주실 · 19,9000원/시간', 11, '강동/송파 지역', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 11 FROM studios WHERE slug='studio-gangdong_songpa-호세네아지트';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '기본룸', NULL, 'UNKNOWN', NULL, NULL, true FROM studios WHERE slug='studio-gangdong_songpa-호세네아지트';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-기타-서울-그래비티', '그래비티', '그래비티 합주실 정보', 12, '서울특별시 중구 다산로14길 23, 지하1층', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 12 FROM studios WHERE slug='studio-기타-서울-그래비티';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '1639811', 'https://m.booking.naver.com/booking/10/bizes/1639811' FROM studios WHERE slug='studio-기타-서울-그래비티';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'B룸', 19000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-기타-서울-그래비티';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '7610692' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-기타-서울-그래비티' AND r.name='B룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'C룸', 17000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-기타-서울-그래비티';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '7708970' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-기타-서울-그래비티' AND r.name='C룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'A룸', 21000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-기타-서울-그래비티';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '7708965' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-기타-서울-그래비티' AND r.name='A룸';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-기타-서울-그루브-노원점', '그루브 노원점', '그루브 노원점 합주실 정보', 12, '기타 서울 지역', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 12 FROM studios WHERE slug='studio-기타-서울-그루브-노원점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '2번방', 20000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-기타-서울-그루브-노원점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '3번방', 17000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-기타-서울-그루브-노원점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '4번방', 14000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-기타-서울-그루브-노원점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '5번방', 14000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-기타-서울-그루브-노원점';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '1번방', 22000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-기타-서울-그루브-노원점';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-기타-서울-그루브합주실', '그루브합주실', '그루브합주실 합주실 정보', 12, '기타 서울 지역', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 12 FROM studios WHERE slug='studio-기타-서울-그루브합주실';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'B룸', 30000, 'SCRAPED', 15, 15, true FROM studios WHERE slug='studio-기타-서울-그루브합주실';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-기타-서울-나인아트', '나인아트', '나인아트 합주실 정보', 12, '기타 서울 지역', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 12 FROM studios WHERE slug='studio-기타-서울-나인아트';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-기타-서울-리엠뮤직-건대', '리엠뮤직 건대', '리엠뮤직 건대 합주실 정보', 12, '기타 서울 지역', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 12 FROM studios WHERE slug='studio-기타-서울-리엠뮤직-건대';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '2번방', 17000, 'SCRAPED', 15, 15, true FROM studios WHERE slug='studio-기타-서울-리엠뮤직-건대';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '1번방', 22, 'SCRAPED', 20, 20, true FROM studios WHERE slug='studio-기타-서울-리엠뮤직-건대';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-기타-서울-리엠뮤직-금호', '리엠뮤직 금호', '리엠뮤직 금호 합주실 정보', 12, '기타 서울 지역', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 12 FROM studios WHERE slug='studio-기타-서울-리엠뮤직-금호';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '리엠뮤직합주실', 17000, 'SCRAPED', 40, 40, true FROM studios WHERE slug='studio-기타-서울-리엠뮤직-금호';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-기타-서울-리엠뮤직-숙대입구', '리엠뮤직 숙대입구', '리엠뮤직 숙대입구 합주실 정보', 12, '기타 서울 지역', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 12 FROM studios WHERE slug='studio-기타-서울-리엠뮤직-숙대입구';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '리엠뮤직합주실', 22000, 'SCRAPED', 40, 40, true FROM studios WHERE slug='studio-기타-서울-리엠뮤직-숙대입구';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-기타-서울-몰디브', '몰디브', '몰디브 합주실 정보', 12, '기타 서울 지역', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 12 FROM studios WHERE slug='studio-기타-서울-몰디브';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-기타-서울-백스테이지', '백스테이지', '백스테이지 합주실 정보', 12, '기타 서울 지역', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 12 FROM studios WHERE slug='studio-기타-서울-백스테이지';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-기타-서울-브이앤엠', '브이앤엠', '브이앤엠 합주실 정보', 12, '기타 서울 지역', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 12 FROM studios WHERE slug='studio-기타-서울-브이앤엠';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-기타-서울-소리모아', '소리모아', '소리모아 합주실 정보', 12, '기타 서울 지역', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 12 FROM studios WHERE slug='studio-기타-서울-소리모아';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '합주실', 15000, 'SCRAPED', 5, 5, true FROM studios WHERE slug='studio-기타-서울-소리모아';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-기타-서울-스튜디오넘버원', '스튜디오넘버원', '스튜디오넘버원 합주실 정보', 12, '기타 서울 지역', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 12 FROM studios WHERE slug='studio-기타-서울-스튜디오넘버원';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-기타-서울-죠니의-리빙룸', '죠니의 리빙룸', '죠니의 리빙룸 합주실 정보', 12, '서울특별시 광진구 광나루로36길 71, B1층', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 12 FROM studios WHERE slug='studio-기타-서울-죠니의-리빙룸';
INSERT INTO studio_sources (studio_id, source_id, external_key, url) SELECT id, 1, '1398524', 'https://m.booking.naver.com/booking/10/bizes/1398524/items/6695118?area=bmp&lang=ko&map-search=1&service-target=map-pc&theme=place' FROM studios WHERE slug='studio-기타-서울-죠니의-리빙룸';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, '죠니의 리빙룸', 25000, 'SCRAPED', NULL, NULL, true FROM studios WHERE slug='studio-기타-서울-죠니의-리빙룸';
INSERT INTO room_sources (room_id, source_id, external_key) SELECT r.id, 1, '6695118' FROM rooms r JOIN studios s ON r.studio_id=s.id WHERE s.slug='studio-기타-서울-죠니의-리빙룸' AND r.name='죠니의 리빙룸';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-기타-서울-한스', '한스', '한스 합주실 정보', 12, '기타 서울 지역', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 12 FROM studios WHERE slug='studio-기타-서울-한스';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'B룸', 17000, 'SCRAPED', 10, 10, true FROM studios WHERE slug='studio-기타-서울-한스';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'C룸', 14000, 'SCRAPED', 8, 8, true FROM studios WHERE slug='studio-기타-서울-한스';
INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) SELECT id, 'A룸', 25000, 'SCRAPED', 30, 30, true FROM studios WHERE slug='studio-기타-서울-한스';

INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) VALUES ('studio-기타-서울-헤르츠', '헤르츠', '헤르츠 합주실 정보', 12, '기타 서울 지역', true);
INSERT INTO studio_areas (studio_id, area_id) SELECT id, 12 FROM studios WHERE slug='studio-기타-서울-헤르츠';

-- Sequence 업데이트
SELECT setval(pg_get_serial_sequence('areas', 'id'), COALESCE((SELECT MAX(id) FROM areas), 1));
SELECT setval(pg_get_serial_sequence('studios', 'id'), COALESCE((SELECT MAX(id) FROM studios), 1));
SELECT setval(pg_get_serial_sequence('rooms', 'id'), COALESCE((SELECT MAX(id) FROM rooms), 1));