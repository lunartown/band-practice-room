-- 합주실 비주얼 매뉴얼 입력 (이미지 / 평점 / 리뷰수)
--
-- 002_studios.sql 은 자동 생성이라 매번 TRUNCATE 로 덮어쓰여진다.
-- 매뉴얼 값은 이 파일에서 slug 기준 UPDATE 로 따로 관리하므로 재생성과 충돌하지 않는다.
-- 002 이후에 실행할 것.
--
-- 새 합주실을 추가할 때 아래 블록을 복사해 slug / 값만 바꾸면 된다.
-- 썸네일은 image_url_manual(수동) 에만 넣는다. image_url_scraped 는 스크래퍼가 채운다.
-- 둘 다 비어 있으면(NULL) 프론트가 이름 이니셜 아바타로 폴백한다. (응답은 manual 우선)
--
-- image_url_manual 에 넣을 수 있는 값 두 가지:
--   1) 외부 URL          : 'https://.../foo.jpg' (네이버 CDN 등)
--   2) 직접 커밋한 이미지 : '/studios/foo.webp'
--      → 파일을 src/web/public/studios/ 에 두고 루트 경로로 참조.
--
-- 직접 커밋 이미지는 손으로 넣지 말고 도구를 쓰는 게 편하다(리사이즈+이 파일 갱신 자동):
--   cd src/scraper && npm run thumbnail -- --slug '<slug>' --image <파일|URL> [--name <영문>]
-- 도구가 아래 "managed thumbnails" 블록을 자동 관리한다. 규칙: src/web/public/studios/README.md

UPDATE studios SET
  image_url_manual = NULL,        -- 예: 'https://.../st-music.jpg'
  rating           = 4.6,
  review_count     = 128
WHERE slug = 'studio-합정/홍대-st-music';

-- UPDATE studios SET
--   image_url_manual = 'https://.../example.jpg',
--   rating           = 4.3,
--   review_count     = 57
-- WHERE slug = 'studio-...';

-- 직접 커밋한 이미지를 쓰는 예 (src/web/public/studios/brother-gangdong.jpg):
-- UPDATE studios SET image_url_manual = '/studios/brother-gangdong.jpg'
-- WHERE slug = 'studio-강동/송파-브라더-강동';

-- === BEGIN managed thumbnails (set-thumbnail) ===
-- 이 블록은 `npm run thumbnail` 가 자동 관리한다. 직접 편집하지 말 것.
UPDATE studios SET image_url_manual = '/studios/hosenae-azito.webp' WHERE slug = 'studio-gangdong_songpa-호세네아지트';
UPDATE studios SET image_url_manual = '/studios/3yl-rehearsal.webp' WHERE slug = 'studio-mangwon-3YL리허설';
UPDATE studios SET image_url_manual = '/studios/rm-studio.webp' WHERE slug = 'studio-mangwon-알엠스튜디오';
UPDATE studios SET image_url_manual = '/studios/naver-1011494028.webp' WHERE slug = 'studio-naver-1011494028';
UPDATE studios SET image_url_manual = '/studios/naver-1016362988.webp' WHERE slug = 'studio-naver-1016362988';
UPDATE studios SET image_url_manual = '/studios/naver-1076401688.webp' WHERE slug = 'studio-naver-1076401688';
UPDATE studios SET image_url_manual = '/studios/naver-1101781822.webp' WHERE slug = 'studio-naver-1101781822';
UPDATE studios SET image_url_manual = '/studios/naver-1135958192.webp' WHERE slug = 'studio-naver-1135958192';
UPDATE studios SET image_url_manual = '/studios/naver-1162396534.webp' WHERE slug = 'studio-naver-1162396534';
UPDATE studios SET image_url_manual = '/studios/naver-1164642903.webp' WHERE slug = 'studio-naver-1164642903';
UPDATE studios SET image_url_manual = '/studios/naver-1171625350.webp' WHERE slug = 'studio-naver-1171625350';
UPDATE studios SET image_url_manual = '/studios/naver-1175196607.webp' WHERE slug = 'studio-naver-1175196607';
UPDATE studios SET image_url_manual = '/studios/naver-1187934379.webp' WHERE slug = 'studio-naver-1187934379';
UPDATE studios SET image_url_manual = '/studios/naver-1205198414.webp' WHERE slug = 'studio-naver-1205198414';
UPDATE studios SET image_url_manual = '/studios/naver-1209237404.webp' WHERE slug = 'studio-naver-1209237404';
UPDATE studios SET image_url_manual = '/studios/naver-1247276706.webp' WHERE slug = 'studio-naver-1247276706';
UPDATE studios SET image_url_manual = '/studios/naver-1248890199.webp' WHERE slug = 'studio-naver-1248890199';
UPDATE studios SET image_url_manual = '/studios/naver-1252122778.webp' WHERE slug = 'studio-naver-1252122778';
UPDATE studios SET image_url_manual = '/studios/naver-1295411295.webp' WHERE slug = 'studio-naver-1295411295';
UPDATE studios SET image_url_manual = '/studios/naver-1308369398.webp' WHERE slug = 'studio-naver-1308369398';
UPDATE studios SET image_url_manual = '/studios/naver-1374451845.webp' WHERE slug = 'studio-naver-1374451845';
UPDATE studios SET image_url_manual = '/studios/naver-1389815871.webp' WHERE slug = 'studio-naver-1389815871';
UPDATE studios SET image_url_manual = '/studios/naver-1394911007.webp' WHERE slug = 'studio-naver-1394911007';
UPDATE studios SET image_url_manual = '/studios/naver-1396191626.webp' WHERE slug = 'studio-naver-1396191626';
UPDATE studios SET image_url_manual = '/studios/naver-1398196557.webp' WHERE slug = 'studio-naver-1398196557';
UPDATE studios SET image_url_manual = '/studios/naver-1399123418.webp' WHERE slug = 'studio-naver-1399123418';
UPDATE studios SET image_url_manual = '/studios/naver-1413701393.webp' WHERE slug = 'studio-naver-1413701393';
UPDATE studios SET image_url_manual = '/studios/naver-1431501659.webp' WHERE slug = 'studio-naver-1431501659';
UPDATE studios SET image_url_manual = '/studios/naver-1441528596.webp' WHERE slug = 'studio-naver-1441528596';
UPDATE studios SET image_url_manual = '/studios/naver-1454253859.webp' WHERE slug = 'studio-naver-1454253859';
UPDATE studios SET image_url_manual = '/studios/naver-1458963585.webp' WHERE slug = 'studio-naver-1458963585';
UPDATE studios SET image_url_manual = '/studios/naver-1463949418.webp' WHERE slug = 'studio-naver-1463949418';
UPDATE studios SET image_url_manual = '/studios/naver-1477558058.webp' WHERE slug = 'studio-naver-1477558058';
UPDATE studios SET image_url_manual = '/studios/naver-1510661945.webp' WHERE slug = 'studio-naver-1510661945';
UPDATE studios SET image_url_manual = '/studios/naver-1544433117.webp' WHERE slug = 'studio-naver-1544433117';
UPDATE studios SET image_url_manual = '/studios/naver-1549420636.webp' WHERE slug = 'studio-naver-1549420636';
UPDATE studios SET image_url_manual = '/studios/naver-1564915611.webp' WHERE slug = 'studio-naver-1564915611';
UPDATE studios SET image_url_manual = '/studios/naver-1566466933.webp' WHERE slug = 'studio-naver-1566466933';
UPDATE studios SET image_url_manual = '/studios/naver-1567790203.webp' WHERE slug = 'studio-naver-1567790203';
UPDATE studios SET image_url_manual = '/studios/naver-1574591189.webp' WHERE slug = 'studio-naver-1574591189';
UPDATE studios SET image_url_manual = '/studios/naver-1583269108.webp' WHERE slug = 'studio-naver-1583269108';
UPDATE studios SET image_url_manual = '/studios/naver-1600050536.webp' WHERE slug = 'studio-naver-1600050536';
UPDATE studios SET image_url_manual = '/studios/naver-1611871682.webp' WHERE slug = 'studio-naver-1611871682';
UPDATE studios SET image_url_manual = '/studios/naver-1626065452.webp' WHERE slug = 'studio-naver-1626065452';
UPDATE studios SET image_url_manual = '/studios/naver-1626428222.webp' WHERE slug = 'studio-naver-1626428222';
UPDATE studios SET image_url_manual = '/studios/naver-1646463548.webp' WHERE slug = 'studio-naver-1646463548';
UPDATE studios SET image_url_manual = '/studios/naver-1659921965.webp' WHERE slug = 'studio-naver-1659921965';
UPDATE studios SET image_url_manual = '/studios/naver-1661209508.webp' WHERE slug = 'studio-naver-1661209508';
UPDATE studios SET image_url_manual = '/studios/naver-1667657449.webp' WHERE slug = 'studio-naver-1667657449';
UPDATE studios SET image_url_manual = '/studios/naver-1706551089.webp' WHERE slug = 'studio-naver-1706551089';
UPDATE studios SET image_url_manual = '/studios/naver-1710978660.webp' WHERE slug = 'studio-naver-1710978660';
UPDATE studios SET image_url_manual = '/studios/naver-1711670352.webp' WHERE slug = 'studio-naver-1711670352';
UPDATE studios SET image_url_manual = '/studios/naver-1715608580.webp' WHERE slug = 'studio-naver-1715608580';
UPDATE studios SET image_url_manual = '/studios/naver-1716270435.webp' WHERE slug = 'studio-naver-1716270435';
UPDATE studios SET image_url_manual = '/studios/naver-1726093950.webp' WHERE slug = 'studio-naver-1726093950';
UPDATE studios SET image_url_manual = '/studios/naver-1727420146.webp' WHERE slug = 'studio-naver-1727420146';
UPDATE studios SET image_url_manual = '/studios/naver-1772561741.webp' WHERE slug = 'studio-naver-1772561741';
UPDATE studios SET image_url_manual = '/studios/naver-1839719342.webp' WHERE slug = 'studio-naver-1839719342';
UPDATE studios SET image_url_manual = '/studios/naver-1843009753.webp' WHERE slug = 'studio-naver-1843009753';
UPDATE studios SET image_url_manual = '/studios/naver-1845196611.webp' WHERE slug = 'studio-naver-1845196611';
UPDATE studios SET image_url_manual = '/studios/naver-1882207832.webp' WHERE slug = 'studio-naver-1882207832';
UPDATE studios SET image_url_manual = '/studios/naver-1905868181.webp' WHERE slug = 'studio-naver-1905868181';
UPDATE studios SET image_url_manual = '/studios/naver-1923256736.webp' WHERE slug = 'studio-naver-1923256736';
UPDATE studios SET image_url_manual = '/studios/naver-1945784473.webp' WHERE slug = 'studio-naver-1945784473';
UPDATE studios SET image_url_manual = '/studios/naver-1949311432.webp' WHERE slug = 'studio-naver-1949311432';
UPDATE studios SET image_url_manual = '/studios/naver-2000516693.webp' WHERE slug = 'studio-naver-2000516693';
UPDATE studios SET image_url_manual = '/studios/naver-2006423009.webp' WHERE slug = 'studio-naver-2006423009';
UPDATE studios SET image_url_manual = '/studios/naver-2006460524.webp' WHERE slug = 'studio-naver-2006460524';
UPDATE studios SET image_url_manual = '/studios/naver-2007625357.webp' WHERE slug = 'studio-naver-2007625357';
UPDATE studios SET image_url_manual = '/studios/naver-2011868968.webp' WHERE slug = 'studio-naver-2011868968';
UPDATE studios SET image_url_manual = '/studios/naver-2017118519.webp' WHERE slug = 'studio-naver-2017118519';
UPDATE studios SET image_url_manual = '/studios/naver-2019256015.webp' WHERE slug = 'studio-naver-2019256015';
UPDATE studios SET image_url_manual = '/studios/naver-2022172535.webp' WHERE slug = 'studio-naver-2022172535';
UPDATE studios SET image_url_manual = '/studios/naver-2024646212.webp' WHERE slug = 'studio-naver-2024646212';
UPDATE studios SET image_url_manual = '/studios/naver-2024692317.webp' WHERE slug = 'studio-naver-2024692317';
UPDATE studios SET image_url_manual = '/studios/naver-2024983455.webp' WHERE slug = 'studio-naver-2024983455';
UPDATE studios SET image_url_manual = '/studios/naver-2026154803.webp' WHERE slug = 'studio-naver-2026154803';
UPDATE studios SET image_url_manual = '/studios/naver-2033382004.webp' WHERE slug = 'studio-naver-2033382004';
UPDATE studios SET image_url_manual = '/studios/naver-2034080850.webp' WHERE slug = 'studio-naver-2034080850';
UPDATE studios SET image_url_manual = '/studios/naver-2035698494.webp' WHERE slug = 'studio-naver-2035698494';
UPDATE studios SET image_url_manual = '/studios/naver-2039748344.webp' WHERE slug = 'studio-naver-2039748344';
UPDATE studios SET image_url_manual = '/studios/naver-2041388352.webp' WHERE slug = 'studio-naver-2041388352';
UPDATE studios SET image_url_manual = '/studios/naver-2041432657.webp' WHERE slug = 'studio-naver-2041432657';
UPDATE studios SET image_url_manual = '/studios/naver-2044485265.webp' WHERE slug = 'studio-naver-2044485265';
UPDATE studios SET image_url_manual = '/studios/naver-2048803497.webp' WHERE slug = 'studio-naver-2048803497';
UPDATE studios SET image_url_manual = '/studios/naver-2056223523.webp' WHERE slug = 'studio-naver-2056223523';
UPDATE studios SET image_url_manual = '/studios/naver-2061039687.webp' WHERE slug = 'studio-naver-2061039687';
UPDATE studios SET image_url_manual = '/studios/naver-2061917896.webp' WHERE slug = 'studio-naver-2061917896';
UPDATE studios SET image_url_manual = '/studios/naver-2063757808.webp' WHERE slug = 'studio-naver-2063757808';
UPDATE studios SET image_url_manual = '/studios/naver-2064603173.webp' WHERE slug = 'studio-naver-2064603173';
UPDATE studios SET image_url_manual = '/studios/naver-2064616859.webp' WHERE slug = 'studio-naver-2064616859';
UPDATE studios SET image_url_manual = '/studios/naver-2067757982.webp' WHERE slug = 'studio-naver-2067757982';
UPDATE studios SET image_url_manual = '/studios/naver-2068483762.webp' WHERE slug = 'studio-naver-2068483762';
UPDATE studios SET image_url_manual = '/studios/naver-2070351623.webp' WHERE slug = 'studio-naver-2070351623';
UPDATE studios SET image_url_manual = '/studios/naver-2071234431.webp' WHERE slug = 'studio-naver-2071234431';
UPDATE studios SET image_url_manual = '/studios/naver-2071949432.webp' WHERE slug = 'studio-naver-2071949432';
UPDATE studios SET image_url_manual = '/studios/naver-2072223325.webp' WHERE slug = 'studio-naver-2072223325';
UPDATE studios SET image_url_manual = '/studios/naver-2077712012.webp' WHERE slug = 'studio-naver-2077712012';
UPDATE studios SET image_url_manual = '/studios/naver-2079096226.webp' WHERE slug = 'studio-naver-2079096226';
UPDATE studios SET image_url_manual = '/studios/naver-2083646416.webp' WHERE slug = 'studio-naver-2083646416';
UPDATE studios SET image_url_manual = '/studios/naver-2088771878.webp' WHERE slug = 'studio-naver-2088771878';
UPDATE studios SET image_url_manual = '/studios/naver-2091202309.webp' WHERE slug = 'studio-naver-2091202309';
UPDATE studios SET image_url_manual = '/studios/naver-2095488188.webp' WHERE slug = 'studio-naver-2095488188';
UPDATE studios SET image_url_manual = '/studios/naver-2098186164.webp' WHERE slug = 'studio-naver-2098186164';
UPDATE studios SET image_url_manual = '/studios/naver-34521725.webp' WHERE slug = 'studio-naver-34521725';
UPDATE studios SET image_url_manual = '/studios/naver-35958484.webp' WHERE slug = 'studio-naver-35958484';
UPDATE studios SET image_url_manual = '/studios/naver-38314980.webp' WHERE slug = 'studio-naver-38314980';
UPDATE studios SET image_url_manual = '/studios/naver-38407689.webp' WHERE slug = 'studio-naver-38407689';
UPDATE studios SET image_url_manual = '/studios/liem-music.webp' WHERE slug = 'studio-강남-리엠뮤직-강남';
UPDATE studios SET image_url_manual = '/studios/mirinae.webp' WHERE slug = 'studio-강남-미리내스튜디오-음악연습실';
UPDATE studios SET image_url_manual = '/studios/mple-sound.webp' WHERE slug = 'studio-강남-엠플사운드';
UPDATE studios SET image_url_manual = '/studios/tobcom.webp' WHERE slug = 'studio-강남-토브콤음악연습실';
UPDATE studios SET image_url_manual = '/studios/powerhouse.webp' WHERE slug = 'studio-강남-파워하우스';
UPDATE studios SET image_url_manual = '/studios/las-studio.webp' WHERE slug = 'studio-강동/송파-라스합주실';
UPDATE studios SET image_url_manual = '/studios/resound-cheonho.webp' WHERE slug = 'studio-강동/송파-리사운드-드럼연습실-천호점';
UPDATE studios SET image_url_manual = '/studios/liem-music.webp' WHERE slug = 'studio-강동/송파-리엠뮤직-잠실';
UPDATE studios SET image_url_manual = '/studios/muzica-seoul.webp' WHERE slug = 'studio-강동/송파-무지카서울-음악연습실';
UPDATE studios SET image_url_manual = '/studios/paikon-studio.webp' WHERE slug = 'studio-강동/송파-백온스튜디오-합주실';
UPDATE studios SET image_url_manual = '/studios/v-studio.webp' WHERE slug = 'studio-강동/송파-브이스튜디오-음악연습실-셀프녹음실';
UPDATE studios SET image_url_manual = '/studios/bk-music-studio.webp' WHERE slug = 'studio-강동/송파-비케이합주실';
UPDATE studios SET image_url_manual = '/studios/sand-to-the-rock.webp' WHERE slug = 'studio-강동/송파-샌드투더락-합주실';
UPDATE studios SET image_url_manual = '/studios/spaceblue.webp' WHERE slug = 'studio-강동/송파-스페이스블루';
UPDATE studios SET image_url_manual = '/studios/jam-in-seoul.webp' WHERE slug = 'studio-강동/송파-잼인서울-스튜디오-합주실-녹음실';
UPDATE studios SET image_url_manual = '/studios/hive-music.webp' WHERE slug = 'studio-강동/송파-하이브-뮤직-스튜디오';
UPDATE studios SET image_url_manual = '/studios/gravity.webp' WHERE slug = 'studio-기타-서울-그래비티';
UPDATE studios SET image_url_manual = '/studios/groove.webp' WHERE slug = 'studio-기타-서울-그루브-노원점';
UPDATE studios SET image_url_manual = '/studios/groove.webp' WHERE slug = 'studio-기타-서울-그루브합주실';
UPDATE studios SET image_url_manual = '/studios/groove.webp' WHERE slug = 'studio-기타-서울-그루브합주실-건대점';
UPDATE studios SET image_url_manual = '/studios/doodream.webp' WHERE slug = 'studio-기타-서울-두드림음악연습실';
UPDATE studios SET image_url_manual = '/studios/lemon-studio.webp' WHERE slug = 'studio-기타-서울-레몬합주실-레몬드럼연습실';
UPDATE studios SET image_url_manual = '/studios/liem-music.webp' WHERE slug = 'studio-기타-서울-리엠뮤직-건대';
UPDATE studios SET image_url_manual = '/studios/liem-music.webp' WHERE slug = 'studio-기타-서울-리엠뮤직-금호';
UPDATE studios SET image_url_manual = '/studios/liem-music.webp' WHERE slug = 'studio-기타-서울-리엠뮤직-숙대입구';
UPDATE studios SET image_url_manual = '/studios/music-one.webp' WHERE slug = 'studio-기타-서울-뮤직원스튜디오';
UPDATE studios SET image_url_manual = '/studios/sorimoa.webp' WHERE slug = 'studio-기타-서울-소리모아';
UPDATE studios SET image_url_manual = '/studios/space-garage.webp' WHERE slug = 'studio-기타-서울-스페이스-개러지-광운대점';
UPDATE studios SET image_url_manual = '/studios/atempo-room.webp' WHERE slug = 'studio-기타-서울-아템포룸-합주실';
UPDATE studios SET image_url_manual = '/studios/m1-studio.webp' WHERE slug = 'studio-기타-서울-엠원스튜디오-합주실';
UPDATE studios SET image_url_manual = '/studios/orakgarak.webp' WHERE slug = 'studio-기타-서울-오락가락-합주실';
UPDATE studios SET image_url_manual = '/studios/youth-music.webp' WHERE slug = 'studio-기타-서울-유스뮤직-합주실';
UPDATE studios SET image_url_manual = '/studios/johnny-livingroom.webp' WHERE slug = 'studio-기타-서울-죠니의-리빙룸';
UPDATE studios SET image_url_manual = '/studios/tenet-ent.webp' WHERE slug = 'studio-기타-서울-테넷ent-합주실-녹음실';
UPDATE studios SET image_url_manual = '/studios/playm-studio.webp' WHERE slug = 'studio-기타-서울-플레이엠합주실';
UPDATE studios SET image_url_manual = '/studios/beathub.webp' WHERE slug = 'studio-방배-net-ent.-비트허브-합주실';
UPDATE studios SET image_url_manual = '/studios/groove.webp' WHERE slug = 'studio-방배-그루브-방배점';
UPDATE studios SET image_url_manual = '/studios/bogo.webp' WHERE slug = 'studio-방배-보고스튜디오';
UPDATE studios SET image_url_manual = '/studios/bijoux.webp' WHERE slug = 'studio-방배-비쥬-방배점';
UPDATE studios SET image_url_manual = '/studios/groove.webp' WHERE slug = 'studio-사당/이수-그루브-사당점';
UPDATE studios SET image_url_manual = '/studios/dream-studio.webp' WHERE slug = 'studio-사당/이수-드림-사당1호점';
UPDATE studios SET image_url_manual = '/studios/dream-studio.webp' WHERE slug = 'studio-사당/이수-드림-사당2호점';
UPDATE studios SET image_url_manual = '/studios/bijoux.webp' WHERE slug = 'studio-사당/이수-비쥬1호점';
UPDATE studios SET image_url_manual = '/studios/bijoux.webp' WHERE slug = 'studio-사당/이수-비쥬2호점';
UPDATE studios SET image_url_manual = '/studios/bijoux.webp' WHERE slug = 'studio-사당/이수-비쥬3호점';
UPDATE studios SET image_url_manual = '/studios/soundcity.webp' WHERE slug = 'studio-사당/이수-사운드시티합주실-방배점';
UPDATE studios SET image_url_manual = '/studios/a-type-sound.webp' WHERE slug = 'studio-사당/이수-에이타입사운드';
UPDATE studios SET image_url_manual = '/studios/with-music.webp' WHERE slug = 'studio-사당/이수-위드뮤직';
UPDATE studios SET image_url_manual = '/studios/ton-studio.webp' WHERE slug = 'studio-사당/이수-이수-톤합주실';
UPDATE studios SET image_url_manual = '/studios/em-studio.webp' WHERE slug = 'studio-사당/이수-이엠합주실';
UPDATE studios SET image_url_manual = '/studios/ton-studio.webp' WHERE slug = 'studio-사당/이수-톤';
UPDATE studios SET image_url_manual = '/studios/vision-good-sound.webp' WHERE slug = 'studio-상도,중앙대-비전합주실-좋은소리';
UPDATE studios SET image_url_manual = '/studios/space-garage.webp' WHERE slug = 'studio-상도,중앙대-스페이스개러지-중앙대점';
UPDATE studios SET image_url_manual = '/studios/ilove-drum.webp' WHERE slug = 'studio-상도,중앙대-아이-러브-드럼연습실';
UPDATE studios SET image_url_manual = '/studios/tasu-music.webp' WHERE slug = 'studio-상도,중앙대-타수-음악연습실';
UPDATE studios SET image_url_manual = '/studios/tasu-music-2.webp' WHERE slug = 'studio-상도,중앙대-타수음악연습실-2호점';
UPDATE studios SET image_url_manual = '/studios/guild.webp' WHERE slug = 'studio-서울대입구-길드합주실';
UPDATE studios SET image_url_manual = '/studios/jasin-studio.webp' WHERE slug = 'studio-서울대입구-자신-스튜디오-드럼-보컬-음악연습실';
UPDATE studios SET image_url_manual = '/studios/getband-azito.webp' WHERE slug = 'studio-신도림/영등포구청-겟밴드-아지트';
UPDATE studios SET image_url_manual = '/studios/barking-sound.webp' WHERE slug = 'studio-신도림/영등포구청-바킹사운드-합주실';
UPDATE studios SET image_url_manual = '/studios/shelter-studio.webp' WHERE slug = 'studio-신도림/영등포구청-안식처합주실';
UPDATE studios SET image_url_manual = '/studios/soon-studio.webp' WHERE slug = 'studio-신도림/영등포구청-음악연습실순스튜디오';
UPDATE studios SET image_url_manual = '/studios/ilsang.webp' WHERE slug = 'studio-신도림/영등포구청-일상';
UPDATE studios SET image_url_manual = '/studios/pang-studio.webp' WHERE slug = 'studio-신도림/영등포구청-팽이합주실';
UPDATE studios SET image_url_manual = '/studios/hwiparan-music.webp' WHERE slug = 'studio-신도림/영등포구청-휘파란-뮤직-스튜디오';
UPDATE studios SET image_url_manual = '/studios/ground.webp' WHERE slug = 'studio-신촌-그라운드-신촌';
UPDATE studios SET image_url_manual = '/studios/dream-studio.webp' WHERE slug = 'studio-신촌-드림';
UPDATE studios SET image_url_manual = '/studios/jahab-studio.webp' WHERE slug = 'studio-신촌-자하브-합주실';
UPDATE studios SET image_url_manual = '/studios/st-music.webp' WHERE slug = 'studio-합정/홍대-st-music';
UPDATE studios SET image_url_manual = '/studios/ground.webp' WHERE slug = 'studio-합정/홍대-그라운드-본점';
UPDATE studios SET image_url_manual = '/studios/ground.webp' WHERE slug = 'studio-합정/홍대-그라운드-합정1호점';
UPDATE studios SET image_url_manual = '/studios/ground.webp' WHERE slug = 'studio-합정/홍대-그라운드합주실-홍대1호점';
UPDATE studios SET image_url_manual = '/studios/startree.webp' WHERE slug = 'studio-합정/홍대-별나무';
UPDATE studios SET image_url_manual = '/studios/buli-studio.webp' WHERE slug = 'studio-합정/홍대-불리스튜디오';
UPDATE studios SET image_url_manual = '/studios/brown-studio.webp' WHERE slug = 'studio-합정/홍대-브라운';
UPDATE studios SET image_url_manual = '/studios/soundcity.webp' WHERE slug = 'studio-합정/홍대-사운드시티';
UPDATE studios SET image_url_manual = '/studios/soundcity.webp' WHERE slug = 'studio-합정/홍대-사운드시티-홍대점';
UPDATE studios SET image_url_manual = '/studios/spot-sound.webp' WHERE slug = 'studio-합정/홍대-스팟사운드';
UPDATE studios SET image_url_manual = '/studios/abbey-road.webp' WHERE slug = 'studio-합정/홍대-에비로드';
UPDATE studios SET image_url_manual = '/studios/am-music.webp' WHERE slug = 'studio-합정/홍대-에이엠뮤직스튜디오';
UPDATE studios SET image_url_manual = '/studios/orange.webp' WHERE slug = 'studio-합정/홍대-오렌지';
UPDATE studios SET image_url_manual = '/studios/wavelab.webp' WHERE slug = 'studio-합정/홍대-웨이브랩';
UPDATE studios SET image_url_manual = '/studios/wavelab.webp' WHERE slug = 'studio-합정/홍대-웨이브랩2호점';
UPDATE studios SET image_url_manual = '/studios/imak.webp' WHERE slug = 'studio-합정/홍대-이막';
UPDATE studios SET image_url_manual = '/studios/jam.webp' WHERE slug = 'studio-합정/홍대-잼-합주실';
UPDATE studios SET image_url_manual = '/studios/jesse-music.webp' WHERE slug = 'studio-합정/홍대-제시뮤직';
UPDATE studios SET image_url_manual = '/studios/jesse-music.webp' WHERE slug = 'studio-합정/홍대-제시뮤직합정점';
UPDATE studios SET image_url_manual = '/studios/chama-studio.webp' WHERE slug = 'studio-합정/홍대-차마스튜디오';
UPDATE studios SET image_url_manual = '/studios/harmonics.webp' WHERE slug = 'studio-합정/홍대-하모닉스1호점';
UPDATE studios SET image_url_manual = '/studios/harmonics.webp' WHERE slug = 'studio-합정/홍대-하모닉스2호점';
UPDATE studios SET image_url_manual = '/studios/hail-music.webp' WHERE slug = 'studio-합정/홍대-헤일-뮤직-스튜디오';
UPDATE studios SET image_url_manual = '/studios/tiger.webp' WHERE slug = 'studio-합정/홍대-호랑이';
UPDATE studios SET image_url_manual = '/studios/liem-music.webp' WHERE slug = 'studio-합정/홍대-홍대리엠뮤직';
UPDATE studios SET image_url_manual = '/studios/dream-studio.webp' WHERE slug = 'studio-혜화/성신여대-드림-대학로점';
UPDATE studios SET image_url_manual = '/studios/dream-studio.webp' WHERE slug = 'studio-혜화/성신여대-드림-마로니에점';
UPDATE studios SET image_url_manual = '/studios/laundry-underground.webp' WHERE slug = 'studio-혜화/성신여대-세탁소아랫집';
UPDATE studios SET image_url_manual = '/studios/space-garage.webp' WHERE slug = 'studio-혜화/성신여대-스페이스-개러지-고려대점';
UPDATE studios SET image_url_manual = '/studios/space-garage.webp' WHERE slug = 'studio-혜화/성신여대-스페이스개러지-성신여대점';
UPDATE studios SET image_url_manual = '/studios/apple-studio-2.webp' WHERE slug = 'studio-혜화/성신여대-애플스튜디오2호점';
UPDATE studios SET image_url_manual = '/studios/apple-hapjusil.webp' WHERE slug = 'studio-혜화/성신여대-애플합주실';
UPDATE studios SET image_url_manual = '/studios/epic-studio.webp' WHERE slug = 'studio-혜화/성신여대-에픽합주실';
UPDATE studios SET image_url_manual = '/studios/way-music.webp' WHERE slug = 'studio-혜화/성신여대-웨이뮤직';
-- === END managed thumbnails ===
