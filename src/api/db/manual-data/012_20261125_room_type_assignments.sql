-- 2026-11-25 방 이름·스튜디오 이름으로 판별한 방 종류. 이름만으로 판별이 안 되는 방은 넣지 않는다(미확인).
WITH assignment(studio_slug, room_name, type_slug, is_primary, note) AS (
  VALUES
    -- 미리내스튜디오 음악연습실: 입시·실내악 위주 클래식 연습실
    ('studio-강남-미리내스튜디오-음악연습실', '남려(南呂)- 대합주실/실내악실 /모의 입시/모의 대회/영상심사촬영', 'ensemble', true, '방 이름: 대합주실/실내악실/모의 입시'),
    ('studio-강남-미리내스튜디오-음악연습실', '이칙(夷則) - 피아노실(일단위, 시간단위)', 'piano-classical', true, '방 이름: 피아노실'),
    ('studio-강남-미리내스튜디오-음악연습실', '협종(夾鍾) - 개인연습실(월단위, 시간단위)', 'personal', true, '방 이름: 개인연습실'),
    ('studio-강남-미리내스튜디오-음악연습실', '무역(無射) - 개인연습실 (월단위, 시간단위)', 'personal', true, '방 이름: 개인연습실'),
    -- [음악연습실]순스튜디오
    ('studio-신도림/영등포구청-음악연습실순스튜디오', '피아노방', 'piano-classical', true, '방 이름: 피아노방'),
    ('studio-신도림/영등포구청-음악연습실순스튜디오', '[ROOM B] 야마하 업라이트 U1', 'piano-classical', true, '방 이름: 업라이트 피아노'),
    ('studio-신도림/영등포구청-음악연습실순스튜디오', '[ROOM C] 야마하 업라이트 U3', 'piano-classical', true, '방 이름: 업라이트 피아노'),
    ('studio-신도림/영등포구청-음악연습실순스튜디오', '[Premium A] 그랜드피아노 & 합주/촬영', 'piano-classical', true, '방 이름: 그랜드피아노 & 합주/촬영. 합주가 밴드인지 미확인'),
    ('studio-신도림/영등포구청-음악연습실순스튜디오', '합주실[보컬,드럼,관악기,피아노,베이스,기타]', 'band', true, '방 이름: 합주실, 드럼 포함'),
    -- 피아노·클래식
    ('studio-합정/홍대-에이엠뮤직스튜디오', '마림바 연습실', 'piano-classical', true, '방 이름: 마림바 연습실'),
    ('studio-기타-서울-유스뮤직-합주실', '[A홀] 그랜드 피아노 사용 ( Yamaha C5 )', 'piano-classical', true, '방 이름: A홀 그랜드 피아노 사용 상품'),
    -- 개인 연습실
    ('studio-강동/송파-샌드투더락-합주실', '개인연습(최대2인 1시간-당일공실시간대한정)', 'personal', true, '방 이름: 개인연습(최대2인)'),
    ('studio-서울대입구-자신-스튜디오-드럼-보컬-음악연습실', '[2번 방] 보컬&피아노&기타 등 (가와이 업라이트)', 'personal', true, '방 이름: 보컬&피아노&기타, 업라이트 피아노'),
    ('studio-서울대입구-자신-스튜디오-드럼-보컬-음악연습실', '[3번 방] 보컬&건반&베이스 등 (야마하 P125)', 'personal', true, '방 이름: 보컬&건반&베이스'),
    -- 드럼 연습실
    ('studio-서울대입구-자신-스튜디오-드럼-보컬-음악연습실', '[12번 방] 드럼ㅣ펄 엘리미네이터 페달 교체 완', 'drum', true, '방 이름: 드럼 방'),
    ('studio-서울대입구-자신-스튜디오-드럼-보컬-음악연습실', '[13번 방] 프리미엄 드럼ㅣ스피드코브라 페달 교체 완', 'drum', true, '방 이름: 드럼 방'),
    ('studio-기타-서울-뮤직원스튜디오', '드럼 ROOM 1', 'drum', true, '방 이름: 드럼 ROOM'),
    ('studio-기타-서울-뮤직원스튜디오', '드럼 ROOM 2', 'drum', true, '방 이름: 드럼 ROOM'),
    ('studio-상도,중앙대-아이-러브-드럼연습실', '드럼연습실', 'drum', true, '방 이름: 드럼연습실'),
    -- 브이스튜디오 음악연습실 셀프녹음실
    ('studio-강동/송파-브이스튜디오-음악연습실-셀프녹음실', '5번룸 2시간 기본예약 [1~2인용 사이즈]', 'personal', true, '방 이름: 1~2인용'),
    ('studio-강동/송파-브이스튜디오-음악연습실-셀프녹음실', '5번룸 2시간 기본예약 [1~2인용 사이즈]', 'recording', false, '스튜디오 이름: 셀프녹음실'),
    ('studio-강동/송파-브이스튜디오-음악연습실-셀프녹음실', '7번룸 2시간(1~2인룸)', 'personal', true, '방 이름: 1~2인룸'),
    ('studio-강동/송파-브이스튜디오-음악연습실-셀프녹음실', '7번룸 2시간(1~2인룸)', 'recording', false, '스튜디오 이름: 셀프녹음실'),
    ('studio-강동/송파-브이스튜디오-음악연습실-셀프녹음실', '1번룸 2시간 기본예약 [ 녹음추천 ]', 'recording', true, '방 이름: 녹음추천'),
    ('studio-강동/송파-브이스튜디오-음악연습실-셀프녹음실', '1+2번룸 동시사용 [ 단체녹음 ]', 'recording', true, '방 이름: 단체녹음'),
    ('studio-강동/송파-브이스튜디오-음악연습실-셀프녹음실', '2번룸 2시간 기본예약  [ TJ노래반주기 사용가능 ]', 'recording', true, '스튜디오 이름: 셀프녹음실, 노래반주기'),
    ('studio-강동/송파-브이스튜디오-음악연습실-셀프녹음실', '3번룸 2시간 기본예약 KRK G4모니터스피커 사용가능', 'recording', true, '스튜디오 이름: 셀프녹음실, 모니터 스피커'),
    -- 앙상블 겸용
    ('studio-naver-1845196611', '중형합주실 앙상블실(15명 연습공간)', 'ensemble', true, '방 이름: 앙상블실'),
    ('studio-naver-1845196611', '중형합주실 앙상블실(15명 연습공간)', 'band', false, '방 이름: 중형합주실, 기타·베이스 앰프 보유'),
    ('studio-naver-1945784473', '8. 합주실 (밴드 & 보컬 & 클래식 앙상블)', 'band', true, '방 이름: 밴드 & 보컬 & 클래식 앙상블'),
    ('studio-naver-1945784473', '8. 합주실 (밴드 & 보컬 & 클래식 앙상블)', 'ensemble', false, '방 이름: 클래식 앙상블'),
    -- 홀·공연장 대관
    ('studio-naver-1252122778', '워십룸/홀 대관', 'hall', true, '방 이름: 워십룸/홀 대관'),
    ('studio-naver-1187934379', '대형 밴드연습실/소규모 라이브 공연장', 'band', true, '방 이름: 대형 밴드연습실'),
    ('studio-naver-1187934379', '대형 밴드연습실/소규모 라이브 공연장', 'hall', false, '방 이름: 소규모 라이브 공연장'),
    ('studio-naver-1398196557', '공연장형 합주실 ', 'band', true, '방 이름: 합주실'),
    ('studio-naver-1398196557', '공연장형 합주실 ', 'hall', false, '방 이름: 공연장형'),
    ('studio-naver-2041432657', '아트센터 합주실, 파티룸 공간 대여', 'band', true, '방 이름: 합주실'),
    ('studio-naver-2041432657', '아트센터 합주실, 파티룸 공간 대여', 'hall', false, '방 이름: 파티룸 공간 대여')
)
INSERT INTO room_type_assignments (room_id, room_type_id, is_primary, source, note)
SELECT r.id, rt.id, assignment.is_primary, 'MANUAL', assignment.note
FROM assignment
JOIN studios s ON s.slug = assignment.studio_slug
JOIN rooms r ON r.studio_id = s.id AND r.name = assignment.room_name
JOIN room_types rt ON rt.slug = assignment.type_slug
ON CONFLICT (room_id, room_type_id) DO UPDATE
SET is_primary = EXCLUDED.is_primary,
    source = EXCLUDED.source,
    note = EXCLUDED.note,
    updated_at = now();
