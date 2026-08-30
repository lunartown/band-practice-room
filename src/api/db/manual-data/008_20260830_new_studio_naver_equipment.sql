-- 전국 카탈로그 확장으로 추가된 스튜디오 중 네이버 예약 상품 본문에
-- 현재 장비 목록이 명시된 방을 반영한다. 모델을 별도 정규화하지 않은 항목도
-- 화면 note와 evidence raw_text에 원문 표기를 보존한다.

CREATE TEMP TABLE manual_20260830_new_studio_equipment (
  studio_slug TEXT NOT NULL,
  room_name TEXT NOT NULL,
  business_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  equipment JSONB NOT NULL
);

INSERT INTO manual_20260830_new_studio_equipment
  (studio_slug, room_name, business_id, item_id, equipment)
VALUES
  ('studio-naver-1101781822', '합주실', '1388490', '6670605', '[
    {"slug":"guitar-amp","note":"Marshall MG50DFX; Fender Champion 40","quantity":2},
    {"slug":"bass-amp","note":"Cort CM40B","quantity":1},
    {"slug":"drum-kit","note":"Roland TD-11 전자드럼","quantity":1},
    {"slug":"keyboard","note":"Kurzweil SP6; Roland XP-30","quantity":2}
  ]'::jsonb),
  ('studio-naver-1389815871', '합주실 예약', '1182246', '5984802', '[
    {"slug":"drum-kit","note":"5기통 드럼","quantity":1,"confidence":"MEDIUM"},
    {"slug":"guitar-amp","note":"Marshall DSL40CR","quantity":1},
    {"slug":"bass-amp","note":"Ampeg BA115","quantity":1},
    {"slug":"keyboard","note":"Kurzweil SP6","quantity":1},
    {"slug":"digital-piano","note":"Yamaha P-125","quantity":1}
  ]'::jsonb),
  ('studio-naver-1626428222', '대합주실', '1094313', '5700133', '[
    {"slug":"drum-kit","note":"Pearl Reference; Canopus Maple Snare","quantity":1},
    {"slug":"cymbal-set","note":"Zildjian K Custom Dark Full Set","quantity":1},
    {"slug":"guitar-amp","note":"Marshall JCM2000 TSL100 + M412A; Laney GH100L + 410A; Fender Twin Reverb","quantity":3},
    {"slug":"bass-amp","note":"Aguilar Tone Hammer 500 + SL210","quantity":1},
    {"slug":"keyboard","note":"Yamaha MODX8, 최대 4대","quantity":4},
    {"slug":"speaker","note":"Cooper 453 2채널; Alto MS15 2채널","quantity":4},
    {"slug":"mixer","note":"Behringer X32 Compact","quantity":1},
    {"slug":"microphone","note":"Shure SM58","quantity":1}
  ]'::jsonb),
  ('studio-naver-1626428222', '소합주실', '1094313', '5708007', '[
    {"slug":"drum-kit","note":"Revers9 T903","quantity":1},
    {"slug":"cymbal-set","note":"Bosphorus Cymbal Set","quantity":1},
    {"slug":"guitar-amp","note":"Marshall Valvestate VS65R; Marshall MG100DFX","quantity":2},
    {"slug":"bass-amp","note":"Behringer BX1200","quantity":1},
    {"slug":"mixer","note":"Behringer Europower PMP2000","quantity":1},
    {"slug":"microphone","note":"Shure SM58","quantity":1}
  ]'::jsonb),
  ('studio-naver-1923256736', '영사운드 합주실', '853155', '4894642', '[
    {"slug":"drum-kit","note":"DW PDP Concept Maple Shell Pack","quantity":1},
    {"slug":"keyboard","note":"Yamaha MX88; Yamaha MX61","quantity":2},
    {"slug":"guitar-amp","note":"Blackstar Series One 100 Head + Series One 212 Cabinet; Fender Blues Deluxe Reissue","quantity":2},
    {"slug":"bass-amp","note":"Ampeg BA115 V2","quantity":1},
    {"slug":"speaker","note":"Behringer B212D","quantity":2},
    {"slug":"mixer","note":"Behringer Europower PMX2000","quantity":1},
    {"slug":"microphone","note":"Shure SM58 Dynamic","quantity":2}
  ]'::jsonb),
  ('studio-naver-1839719342', '밴드대기실을 빌려봅시다 !', '1548830', '7938367', '[
    {"slug":"drum-kit","note":"Z 전자드럼","quantity":1},
    {"slug":"bass-amp","note":"SB-120A","quantity":1},
    {"slug":"keyboard","note":"Kurzweil SP2X","quantity":1},
    {"slug":"guitar-amp","note":"VHT 진공관 앰프 + Blackstar 100W 캐비닛","quantity":1},
    {"slug":"mixer","note":"Behringer XR18 Digital Mixer","quantity":1,"optional":true},
    {"slug":"speaker","note":"JBL EON 615","quantity":1,"optional":true},
    {"slug":"microphone","note":"Shure SM58; Shure SM57","quantity":2,"optional":true}
  ]'::jsonb),
  ('studio-naver-1076401688', '합주실', '1191685', '6016822', '[
    {"slug":"speaker","note":"JBL EON 615","quantity":2},
    {"slug":"mixer","note":"Behringer Xenyx 16CH","quantity":1},
    {"slug":"drum-kit","note":"Yamaha Stage Custom Birch 5기통","quantity":1},
    {"slug":"guitar-amp","note":"Fender Blues Junior III; Blackstar HT20 2대","quantity":3},
    {"slug":"bass-amp","note":"Ampeg Micro-CL","quantity":1},
    {"slug":"microphone","note":"Shure Beta 58; Shure SM58 2대","quantity":3}
  ]'::jsonb),
  ('studio-naver-1882207832', '대합주실', '1251418', '6237610', '[
    {"slug":"drum-kit","note":"Ludwig Classic Oak 5PCS","quantity":1},
    {"slug":"cymbal-set","note":"Zildjian K Country K0801C","quantity":1},
    {"slug":"guitar-amp","note":"Marshall DSL100HR + 1960A Cabinet; Fender Champion 100","quantity":2},
    {"slug":"bass-amp","note":"Hartke HA5500 + 4.5XL Cabinet","quantity":1},
    {"slug":"keyboard","note":"Yamaha Montage 8 BK; Yamaha MODX7","quantity":2}
  ]'::jsonb),
  ('studio-naver-1882207832', '소합주실', '1251418', '6237594', '[
    {"slug":"drum-kit","note":"Ludwig Element Evolution","quantity":1},
    {"slug":"cymbal-set","note":"Lobenswert Dark Custom","quantity":1},
    {"slug":"guitar-amp","note":"Marshall DSL100HR + 1960A Cabinet; Fender Champion 100","quantity":2},
    {"slug":"bass-amp","note":"Hartke HA5500 + 4.5XL Cabinet","quantity":1},
    {"slug":"keyboard","note":"Yamaha Montage 8 BK","quantity":1}
  ]'::jsonb),
  ('studio-naver-1431501659', '합주실예약', '649789', '4778111', '[
    {"slug":"speaker","note":"Behringer B112D 1조","quantity":2},
    {"slug":"drum-kit","note":"Sonor Force 505","quantity":1},
    {"slug":"keyboard","note":"Kurzweil PC2X","quantity":1},
    {"slug":"mixer","note":"Yamaha Mixer","quantity":1,"confidence":"MEDIUM"},
    {"slug":"microphone","note":"Shure QLXD 무선 마이크","quantity":3},
    {"slug":"guitar-amp","note":"Blackstar HT-5; Orange 35RT","quantity":2},
    {"slug":"bass-amp","note":"Ampeg BA115HP","quantity":1}
  ]'::jsonb),
  ('studio-naver-2071234431', '합주실', '1707829', '7914871', '[
    {"slug":"keyboard","note":"Yamaha MX88","quantity":1},
    {"slug":"guitar-amp","note":"Fender Frontman; Marshall AVT; Tornado TBX100","quantity":3},
    {"slug":"drum-kit","note":"Tama 드럼","quantity":1,"confidence":"MEDIUM"}
  ]'::jsonb),
  ('studio-naver-2034080850', 'A룸(12인실)학생할인가능!', '1630117', '7570821', '[
    {"slug":"guitar-amp","note":"Marshall JVM410H 2대","quantity":2},
    {"slug":"drum-kit","note":"Pearl Masters BCX; DW Design Series","quantity":2},
    {"slug":"bass-amp","note":"Markbass 앰프","quantity":1,"confidence":"MEDIUM"},
    {"slug":"keyboard","note":"Roland JUNO-DS 88; Korg Triton","quantity":2}
  ]'::jsonb),
  ('studio-naver-2034080850', 'B룸(7인실)', '1630117', '7570820', '[
    {"slug":"guitar-amp","note":"Marshall JVM410H; Fender Hot Rod DeVille IV","quantity":2},
    {"slug":"drum-kit","note":"DW Design Series","quantity":1},
    {"slug":"bass-amp","note":"Markbass CMD102P","quantity":1},
    {"slug":"keyboard","note":"Roland JUNO-DS","quantity":1}
  ]'::jsonb),
  ('studio-naver-2034080850', 'C룸(5인실)', '1630117', '7570817', '[
    {"slug":"guitar-amp","note":"Marshall JVM410H; Marshall JVM410C Combo","quantity":2},
    {"slug":"drum-kit","note":"Tama Starclassic","quantity":1},
    {"slug":"bass-amp","note":"Markbass CMD102P","quantity":1},
    {"slug":"keyboard","note":"Yamaha Motif ES8","quantity":1}
  ]'::jsonb),
  ('studio-naver-2026154803', '합주실 A룸', '1512926', '7154779', '[
    {"slug":"drum-kit","note":"Pearl Decade","quantity":1},
    {"slug":"bass-amp","note":"Markbass Little Mark 58R + 104HR Cabinet; Fender Rumble 500","quantity":2},
    {"slug":"guitar-amp","note":"Marshall DSL100HR + 1960A Cabinet; Fender Champion 100","quantity":2},
    {"slug":"keyboard","note":"Yamaha MODX8+; Yamaha MODX6+","quantity":2},
    {"slug":"mixer","note":"Kanals BKG-120","quantity":1},
    {"slug":"speaker","note":"Alto TX415","quantity":1},
    {"slug":"microphone","note":"Shure SM58 유선 마이크","quantity":1}
  ]'::jsonb),
  ('studio-naver-2026154803', '합주실 B룸', '1512926', '7170407', '[
    {"slug":"drum-kit","note":"DW PDP","quantity":1},
    {"slug":"bass-amp","note":"Markbass Little Mark 58R + 104HR Cabinet; Fender Rumble 500","quantity":2},
    {"slug":"guitar-amp","note":"Marshall DSL100HR + 1960A Cabinet; Fender Champion 100","quantity":2},
    {"slug":"keyboard","note":"Yamaha CK88; Yamaha MODX6+","quantity":2},
    {"slug":"mixer","note":"Kanals BKG-120","quantity":1},
    {"slug":"speaker","note":"Alto TX415","quantity":1},
    {"slug":"microphone","note":"Shure SM58 유선 마이크","quantity":1}
  ]'::jsonb),
  ('studio-naver-1477558058', '동네룸', '1237447', '6186506', '[
    {"slug":"guitar-amp","note":"Fender Champion 100; Orange Crush 60C","quantity":2},
    {"slug":"keyboard","note":"Roland RD700GX","quantity":1},
    {"slug":"bass-amp","note":"Fender Rumble 100","quantity":1},
    {"slug":"mixer","note":"Wave WMX1610F 16CH","quantity":1},
    {"slug":"speaker","note":"Studiomaster Direct 121K 1200W PA","quantity":1},
    {"slug":"microphone","note":"Shure Beta 58A; Shure SM58SK","quantity":2},
    {"slug":"drum-kit","note":"Tama Superstar Classic Maple","quantity":1},
    {"slug":"cymbal-set","note":"Zildjian K","quantity":1}
  ]'::jsonb),
  ('studio-naver-1477558058', '우리룸', '1237447', '6186425', '[
    {"slug":"guitar-amp","note":"Fender Champion 100; Orange Crush 60C","quantity":2},
    {"slug":"keyboard","note":"Yamaha MX88","quantity":1},
    {"slug":"bass-amp","note":"Markbass CMD 250W","quantity":1},
    {"slug":"mixer","note":"Wave WMX1610F 16CH","quantity":1},
    {"slug":"speaker","note":"Soundking Artos 1200W PA","quantity":1},
    {"slug":"microphone","note":"Shure Beta 58A; Shure SM58SK","quantity":2},
    {"slug":"drum-kit","note":"Tama Superstar Classic Maple","quantity":1},
    {"slug":"cymbal-set","note":"Zildjian K","quantity":1}
  ]'::jsonb),
  ('studio-naver-1772561741', 'Studio 00(합주실)', '901995', '5060047', '[
    {"slug":"digital-piano","note":"Roland FP-10","quantity":1},
    {"slug":"speaker","note":"Marshall Woburn III Bluetooth Speaker","quantity":1}
  ]'::jsonb),
  ('studio-naver-1667657449', '합주실A', '1247729', '6234308', '[
    {"slug":"digital-piano","note":"Yamaha Clavinova","quantity":1},
    {"slug":"guitar-amp","note":"Marshall Valvestate 8080","quantity":1},
    {"slug":"bass-amp","note":"Fender Rumble 100","quantity":1},
    {"slug":"drum-kit","note":"Ludwig Breakbeats Set","quantity":1},
    {"slug":"cymbal-set","note":"Woohan Handmade Cymbals","quantity":1},
    {"slug":"microphone","note":"Sennheiser E835S","quantity":1},
    {"slug":"speaker","note":"Behringer PK112 PA","quantity":1}
  ]'::jsonb),
  ('studio-naver-1667657449', '합주실B', '1247729', '6816049', '[
    {"slug":"digital-piano","note":"Yamaha Clavinova","quantity":1},
    {"slug":"guitar-amp","note":"Fender Sidekick Reverb 65","quantity":1},
    {"slug":"bass-amp","note":"Ampeg BA-108","quantity":1},
    {"slug":"drum-kit","note":"Sonor Safari Set","quantity":1},
    {"slug":"microphone","note":"Shure SM57","quantity":1}
  ]'::jsonb),
  ('studio-naver-35958484', '블랙룸 (BLACK ROOM)', '4444', '87034', '[
    {"slug":"guitar-amp","note":"Marshall JCM2000 DSL + 1960 Cabinet; Mesa Dual Rectifier Solo + 412 Cabinet","quantity":2},
    {"slug":"bass-amp","note":"SWR 750X + Ampeg 410 HLF","quantity":1},
    {"slug":"keyboard","note":"Yamaha S90XS; Yamaha Motif 7","quantity":2},
    {"slug":"drum-kit","note":"Pearl Masters Custom MCX; Gretsch Hammered Chrome Snare","quantity":1},
    {"slug":"mixer","note":"Yamaha MG16XU","quantity":1},
    {"slug":"speaker","note":"JBL PRX612M","quantity":1}
  ]'::jsonb),
  ('studio-naver-35958484', '레드룸 (RED ROOM)', '4444', '87036', '[
    {"slug":"guitar-amp","note":"Marshall JCM2000 TSL + 1960 Cabinet; Fender Twin Amp","quantity":2},
    {"slug":"bass-amp","note":"Ampeg SVT-3PRO + SVT410HLF","quantity":1},
    {"slug":"keyboard","note":"Yamaha S90ES; Yamaha Motif XS7","quantity":2},
    {"slug":"drum-kit","note":"Pearl Masters Custom MCX","quantity":1},
    {"slug":"cymbal-set","note":"Sabian AAX","quantity":1},
    {"slug":"mixer","note":"Yamaha MG12XU","quantity":1},
    {"slug":"speaker","note":"Mackie SRM350 V3","quantity":1}
  ]'::jsonb),
  ('studio-naver-2000516693', '합주실 B(연습실5) 4~5인, 건반 o', '1709172', '7921922', '[
    {"slug":"drum-kit","note":"Sonor AQ2","quantity":1},
    {"slug":"cymbal-set","note":"Turkish Classic","quantity":1},
    {"slug":"guitar-amp","note":"Roland Jazz Chorus JC-40","quantity":1},
    {"slug":"bass-amp","note":"Fender Rumble 500","quantity":1},
    {"slug":"keyboard","note":"Kurzweil PC4","quantity":1}
  ]'::jsonb),
  ('studio-naver-1413701393', 'Ensemble 합주실 (리뷰이벤트 진행중!!)', '1362575', '6585250', '[
    {"slug":"drum-kit","note":"Yamaha Live Custom 6기통","quantity":1},
    {"slug":"cymbal-set","note":"Zildjian A Custom Hi-hat 14; Crash 16/18; Ride 20; Splash 8","quantity":1},
    {"slug":"keyboard","note":"Yamaha MODX8; Yamaha Motif XF7 WH","quantity":2},
    {"slug":"guitar-amp","note":"Fender Tone Master Twin Reverb; Victory VX100 Super Kraken + V212-VG Cabinet","quantity":2},
    {"slug":"bass-amp","note":"Markbass Little Mark 250 Black Line + Traveler 102P Cabinet","quantity":1},
    {"slug":"microphone","note":"Telefunken M80 2대; Audix DP7; Shure SM57 3대","quantity":6},
    {"slug":"mixer","note":"Behringer X32 Compact","quantity":1},
    {"slug":"speaker","note":"JBL PRX915 Main; JBL EON712 Monitor","quantity":2}
  ]'::jsonb),
  ('studio-naver-2044485265', '[주말]미니합주실', '1490206', '7136076', '[
    {"slug":"microphone","note":"무선 마이크; Shure SM58; sE V7","quantity":3},
    {"slug":"digital-piano","note":"Roland FP-90X","quantity":1},
    {"slug":"keyboard","note":"Yamaha MX61","quantity":1},
    {"slug":"acoustic-piano","note":"Young Chang Upright Piano","quantity":1}
  ]'::jsonb),
  ('studio-naver-2061917896', 'LAB5 (합주실)', '1462338', '6927911', '[
    {"slug":"drum-kit","note":"EFNOTE 3 전자드럼","quantity":1},
    {"slug":"keyboard","note":"Yamaha MODX8","quantity":1},
    {"slug":"bass-amp","note":"Cort CM150B","quantity":1},
    {"slug":"guitar-amp","note":"Fender Hot Rod Deluxe","quantity":1},
    {"slug":"microphone","note":"Shure SM7B; Beta 58; SM58 2대; SM57 2대","quantity":6},
    {"slug":"monitor-speaker","note":"JBL EON15 G2; Mackie SRM450","quantity":2},
    {"slug":"mixer","note":"Behringer X32 Compact","quantity":1},
    {"slug":"speaker","note":"Studiomaster Vortex 12A","quantity":1}
  ]'::jsonb),
  ('studio-naver-1398196557', '공연장형 합주실 ', '1198223', '6041879', '[
    {"slug":"drum-kit","note":"Gretsch Jazz Drum Kit","quantity":1},
    {"slug":"cymbal-set","note":"심벌 세트","quantity":1,"confidence":"MEDIUM"},
    {"slug":"bass-amp","note":"Fender Rumble 100; Phil Jones Bass Amp","quantity":2},
    {"slug":"guitar-amp","note":"Roland Jazz Chorus 40; Boss Katana Artist","quantity":2},
    {"slug":"acoustic-piano","note":"Weber Upright Piano","quantity":1},
    {"slug":"keyboard","note":"Yamaha CK88","quantity":1},
    {"slug":"monitor-speaker","note":"모니터 앰프","quantity":4,"confidence":"MEDIUM"},
    {"slug":"speaker","note":"메인 스피커 2조","quantity":4,"confidence":"MEDIUM"}
  ]'::jsonb),
  ('studio-naver-1399123418', 'B홀 합주실(중형)', '697587', '4418968', '[
    {"slug":"keyboard","note":"Yamaha S90ES; Kurzweil PC2X; Nord Electro 3HP","quantity":3},
    {"slug":"guitar-amp","note":"Orange Crush Pro 60; Vox AC30VR","quantity":2},
    {"slug":"bass-amp","note":"Eden Nemesis N15S","quantity":1},
    {"slug":"drum-kit","note":"Yamaha Custom Drum Set","quantity":1},
    {"slug":"mixer","note":"Soundcraft Mixing Console; Behringer X32 Compact","quantity":2,"confidence":"MEDIUM"}
  ]'::jsonb),
  ('studio-naver-2048803497', 'Jazz합주실 대관', '1485856', '7036088', '[
    {"slug":"acoustic-piano","note":"Yamaha U3","quantity":1},
    {"slug":"bass-amp","note":"SWR LA-15","quantity":1},
    {"slug":"drum-kit","note":"Sonor Drum Set","quantity":1},
    {"slug":"cymbal-set","note":"Zildjian Planet Z Ride 20; Meinl Classics Crash 16; Istanbul Agop Alchemy Art Hi-hat 14","quantity":1},
    {"slug":"speaker","note":"Yamaha Stagepas 400","quantity":1}
  ]'::jsonb),
  ('studio-naver-2067757982', '합주실 or 드럼단독사용 룸 ROOM.1', '1621046', '7533457', '[
    {"slug":"drum-kit","note":"Sonor Essential Force 5기통","quantity":1},
    {"slug":"cymbal-set","note":"수제 심벌 풀세트","quantity":1},
    {"slug":"bass-amp","note":"Ashdown 307W","quantity":4},
    {"slug":"guitar-amp","note":"Marshall Guitar Amp; Fender Guitar Amp","quantity":2,"confidence":"MEDIUM"},
    {"slug":"keyboard","note":"Yamaha MX88; Yamaha MOXF6; Korg Triton LE","quantity":3},
    {"slug":"microphone","note":"Shure 2대; Votex 1대","quantity":3,"confidence":"MEDIUM"},
    {"slug":"mixer","note":"Kanals BKM-800 10채널","quantity":1},
    {"slug":"speaker","note":"HMH 12인치 Main Speaker 1조","quantity":2,"confidence":"MEDIUM"},
    {"slug":"monitor-speaker","note":"GNS GS10M 1조","quantity":2}
  ]'::jsonb),
  ('studio-naver-1135958192', '합주실 예약', '1225324', '6141761', '[
    {"slug":"microphone","note":"Shure QLXD/Beta58A Wireless 2대; SM58 3대","quantity":5},
    {"slug":"keyboard","note":"Kurzweil SP6","quantity":1},
    {"slug":"guitar-amp","note":"Marshall Code 100H; Fender Deluxe 112","quantity":2},
    {"slug":"bass-amp","note":"Ampeg BA115 V2","quantity":1},
    {"slug":"drum-kit","note":"Yamaha Live Custom; DW Collector; DW 500","quantity":1},
    {"slug":"cymbal-set","note":"Sabian HHX Evolution","quantity":1},
    {"slug":"mixer","note":"Yamaha MG16XU","quantity":1},
    {"slug":"speaker","note":"JBL 712M","quantity":1}
  ]'::jsonb),
  ('studio-naver-2007625357', '합주실', '1718909', '7970555', '[
    {"slug":"guitar-amp","note":"Marshall Valvestate VS100; Marshall Valvestate VS80","quantity":2},
    {"slug":"bass-amp","note":"Hartke Kickback KB15","quantity":1},
    {"slug":"keyboard","note":"Kurzweil SP6 88-key","quantity":1},
    {"slug":"drum-kit","note":"Ludwig Accent CS","quantity":1},
    {"slug":"mixer","note":"Behringer Xenyx X1222USB","quantity":1},
    {"slug":"speaker","note":"Behringer B115D 1조","quantity":2},
    {"slug":"microphone","note":"SA-929 Dynamic Microphone","quantity":3}
  ]'::jsonb),
  ('studio-naver-2022172535', '[8,9월 이벤트] A ROOM(합주실)', '1441434', '7836951', '[
    {"slug":"drum-kit","note":"Mapex Mars Rock Maple","quantity":1},
    {"slug":"guitar-amp","note":"Orange Super Crush 100 + PPC412; Marshall DSL100HR + 1960A","quantity":2},
    {"slug":"bass-amp","note":"Ampeg PF-800 + PF-410HLF","quantity":1},
    {"slug":"keyboard","note":"Yamaha MODX8+; Kurzweil Artis7; Yamaha MX88","quantity":3},
    {"slug":"speaker","note":"RCF ART 912A","quantity":1},
    {"slug":"monitor-speaker","note":"EV PXM-12MP","quantity":1},
    {"slug":"microphone","note":"Shure SM58S","quantity":3},
    {"slug":"mixer","note":"Yamaha MG16XU","quantity":1}
  ]'::jsonb),
  ('studio-naver-2022172535', '[8,9월 이벤트] B ROOM(합주실)', '1441434', '7836958', '[
    {"slug":"drum-kit","note":"Pearl Export EXX Maple","quantity":1},
    {"slug":"guitar-amp","note":"Orange Super Crush 100 + PPC412; Marshall DSL100HR + 1936V","quantity":2},
    {"slug":"bass-amp","note":"Markbass Little Mark 58R + Standard 104HR","quantity":1},
    {"slug":"keyboard","note":"Yamaha MODX8+; Kurzweil Artis7","quantity":2},
    {"slug":"speaker","note":"QSC CP8","quantity":1},
    {"slug":"monitor-speaker","note":"EV ZLX-12P-G2-EU","quantity":1},
    {"slug":"microphone","note":"Shure SM58S","quantity":3},
    {"slug":"mixer","note":"Yamaha MG16XU","quantity":1}
  ]'::jsonb),
  ('studio-naver-2022172535', 'C ROOM (합주실)', '1441434', '7402575', '[
    {"slug":"drum-kit","note":"Gretsch Catalina Maple Fusion","quantity":1},
    {"slug":"guitar-amp","note":"Orange Super Crush 100 + PPC412; Fender Hot Rod Deluxe IV","quantity":2},
    {"slug":"bass-amp","note":"Markbass Little Mark 58R + Standard 104HR","quantity":1},
    {"slug":"keyboard","note":"Yamaha MODX8+","quantity":1},
    {"slug":"speaker","note":"EV ZLX-12P-G2-EU","quantity":1},
    {"slug":"monitor-speaker","note":"QSC CP8","quantity":1},
    {"slug":"microphone","note":"Shure SM58S","quantity":3},
    {"slug":"mixer","note":"Yamaha MG12XU","quantity":1}
  ]'::jsonb),
  ('studio-naver-1394911007', '애드투 밴드 합주실', '1050426', '5580349', '[
    {"slug":"mixer","note":"Behringer XR18 Tablet Mixer","quantity":1},
    {"slug":"microphone","note":"Shure Microphones","quantity":3},
    {"slug":"speaker","note":"JBL Speaker","quantity":1,"confidence":"MEDIUM"},
    {"slug":"drum-kit","note":"Sonor Q2","quantity":1},
    {"slug":"bass-amp","note":"Ashdown Bass Amp","quantity":1,"confidence":"MEDIUM"},
    {"slug":"guitar-amp","note":"Fender Guitar Amp; Orange Guitar Amp","quantity":2,"confidence":"MEDIUM"},
    {"slug":"keyboard","note":"Kurzweil PC2X; Nord Stage 3 73; Nord Electro 6D","quantity":3}
  ]'::jsonb),
  ('studio-naver-1583269108', '합주용도 대관 (시간제)', '982490', '5320743', '[
    {"slug":"drum-kit","note":"Yamaha Stage Custom Nouveau","quantity":1},
    {"slug":"cymbal-set","note":"Istanbul / HCS Cymbals","quantity":1},
    {"slug":"keyboard","note":"Kurzweil SP4-8; Korg Triton Extreme","quantity":2},
    {"slug":"guitar-amp","note":"Blackstar HT-100 Stage; Laney LV300","quantity":2},
    {"slug":"bass-amp","note":"Ampeg Micro VR SVT","quantity":1},
    {"slug":"microphone","note":"AKG D5","quantity":3},
    {"slug":"mixer","note":"Zoom LiveTrak L-20","quantity":1},
    {"slug":"monitor-speaker","note":"JBL 8340A Monitor/PA Speaker","quantity":1}
  ]'::jsonb),
  ('studio-naver-2063757808', '단독 대형룸', '1692894', '7841855', '[
    {"slug":"guitar-amp","note":"Marshall DSL40CR; Orange Super Crush 100","quantity":2},
    {"slug":"bass-amp","note":"Fender Rumble 100","quantity":1},
    {"slug":"drum-kit","note":"Tama Superstar Classic Maple","quantity":1},
    {"slug":"cymbal-set","note":"Bosphorus Traditional 4-pack; Anatolian Diamond Impact O-Zone FX Crash","quantity":1},
    {"slug":"keyboard","note":"Yamaha S90ES","quantity":1},
    {"slug":"mixer","note":"Behringer Xenyx X2222USB","quantity":1},
    {"slug":"speaker","note":"JBL IRX112BT","quantity":1},
    {"slug":"microphone","note":"Behringer XM8500","quantity":1}
  ]'::jsonb),
  ('studio-naver-2071949432', '사운드랩 합주실', '1696200', '7853956', '[
    {"slug":"guitar-amp","note":"Custom Audio Amplifier PT-100 + Blackstar S-1 412B; Marshall DSL20R + 1960B","quantity":2},
    {"slug":"bass-amp","note":"Fender Rumble 100","quantity":1},
    {"slug":"keyboard","note":"Yamaha MX88","quantity":1},
    {"slug":"drum-kit","note":"Pearl Vision; Pearl Limited 6-ply Poplar + Birch Snare","quantity":1},
    {"slug":"cymbal-set","note":"Sabian HHX Groove Hi-hat 14; HHX X-Treme Crash 16; DC Comfort Crash 18; Zildjian A Custom Splash 8","quantity":1},
    {"slug":"speaker","note":"Behringer B115D","quantity":2},
    {"slug":"mixer","note":"Mackie ProFX16 V2","quantity":1}
  ]'::jsonb),
  ('studio-naver-1187934379', '대형 밴드연습실/소규모 라이브 공연장', '415748', '3602329', '[
    {"slug":"microphone","note":"무선 마이크 시스템","quantity":1,"confidence":"MEDIUM"},
    {"slug":"speaker","note":"JBL EON Speaker 1조","quantity":2},
    {"slug":"mixer","note":"Behringer XR18 Digital Mixer","quantity":1},
    {"slug":"drum-kit","note":"Tama Rockstar","quantity":1},
    {"slug":"cymbal-set","note":"Sabian AAX Hi-hat; Anatolian Crash","quantity":1},
    {"slug":"bass-amp","note":"Bass Amp","quantity":1,"confidence":"MEDIUM"},
    {"slug":"guitar-amp","note":"Electric Guitar Amp","quantity":2,"confidence":"MEDIUM"}
  ]'::jsonb),
  ('studio-naver-2035698494', 'Room 100db', '1700619', '7892060', '[
    {"slug":"speaker","note":"Studiomaster Direct 121K 4800W","quantity":1},
    {"slug":"mixer","note":"Mackie CFX16","quantity":1},
    {"slug":"keyboard","note":"Yamaha MX88; Yamaha MX61","quantity":2},
    {"slug":"guitar-amp","note":"Marshall Valvestate 8240; Fender Champion II 100","quantity":2},
    {"slug":"bass-amp","note":"Hughes & Kettner QC421 400W","quantity":1},
    {"slug":"drum-kit","note":"Pearl New Vision Shell Pack","quantity":1},
    {"slug":"cymbal-set","note":"Istanbul; Basileia; Zildjian Cymbals","quantity":1}
  ]'::jsonb),
  ('studio-naver-2035698494', 'Room 3db', '1700619', '7908430', '[
    {"slug":"guitar-amp","note":"Fender Champion II 100","quantity":1}
  ]'::jsonb),
  ('studio-naver-2035698494', 'Room 4db', '1700619', '7940200', '[
    {"slug":"guitar-amp","note":"Marshall JTM30","quantity":1}
  ]'::jsonb),
  ('studio-naver-2035698494', 'Room 50db', '1700619', '7899108', '[
    {"slug":"speaker","note":"AXL MX715","quantity":1},
    {"slug":"microphone","note":"Shure SM58S","quantity":1},
    {"slug":"mixer","note":"Behringer UB2442FX-Pro","quantity":1},
    {"slug":"guitar-amp","note":"Fender Champion II 100","quantity":2},
    {"slug":"bass-amp","note":"Fender Rumble 100","quantity":1},
    {"slug":"drum-kit","note":"Yamaha Stage Custom","quantity":1},
    {"slug":"keyboard","note":"Yamaha MX88","quantity":1}
  ]'::jsonb),
  ('studio-naver-1711670352', '꿈꾸는 음악스튜디오 / A 합주실', '359523', '4326204', '[
    {"slug":"speaker","note":"JBL EON 615; BANDO","quantity":2},
    {"slug":"mixer","note":"Behringer Xenyx X1832USB","quantity":1},
    {"slug":"keyboard","note":"Yamaha MX88","quantity":1},
    {"slug":"drum-kit","note":"Sonor AQ2 5기통","quantity":1},
    {"slug":"cymbal-set","note":"Sabian XSR 4-pack; Zildjian A Custom Splash 8","quantity":1},
    {"slug":"bass-amp","note":"Hartke HD75","quantity":1},
    {"slug":"guitar-amp","note":"Marshall Code 50","quantity":1}
  ]'::jsonb),
  ('studio-naver-1711670352', '꿈꾸는 음악스튜디오 / B 합주실', '359523', '4326261', '[
    {"slug":"speaker","note":"JBL EON 615; BANDO","quantity":2},
    {"slug":"mixer","note":"Behringer Xenyx X1832USB","quantity":1},
    {"slug":"digital-piano","note":"Yamaha P-125","quantity":1},
    {"slug":"drum-kit","note":"Roland TD-17KL 전자드럼","quantity":1},
    {"slug":"bass-amp","note":"Hartke HD75","quantity":1},
    {"slug":"guitar-amp","note":"Marshall Code 50","quantity":1}
  ]'::jsonb),
  ('studio-naver-1549420636', '합주실10번방(4.5*4.2m)', '1203515', '6085320', '[
    {"slug":"drum-kit","note":"Gretsch Catalina Shell Pack 5기통","quantity":1},
    {"slug":"cymbal-set","note":"Istanbul Mehmet IMC Hi-hat/Crash/Ride Set","quantity":1},
    {"slug":"guitar-amp","note":"Orange Crush Pro 60C; Fender Champion 100","quantity":2},
    {"slug":"bass-amp","note":"Orange Crush Bass 100","quantity":1},
    {"slug":"keyboard","note":"Kurzweil K2700; Kurzweil PC4SE","quantity":2},
    {"slug":"mixer","note":"16채널 파워드 믹서","quantity":1,"confidence":"MEDIUM"},
    {"slug":"speaker","note":"12인치 Bluetooth Speaker","quantity":2,"confidence":"MEDIUM"},
    {"slug":"microphone","note":"유무선 마이크","quantity":4,"confidence":"MEDIUM"}
  ]'::jsonb),
  ('studio-naver-1905868181', '합주실 07 (Pearl)', '698143', '5488188', '[
    {"slug":"drum-kit","note":"Pearl Rhythm Traveler 5기통","quantity":1},
    {"slug":"cymbal-set","note":"Istanbul Agop Xist Dry Dark 13/17/19","quantity":1},
    {"slug":"bass-amp","note":"Ampeg BA-112","quantity":1},
    {"slug":"guitar-amp","note":"Marshall Code 25","quantity":1},
    {"slug":"keyboard","note":"Kurzweil SP7 Grand","quantity":1},
    {"slug":"microphone","note":"Sennheiser E835S","quantity":1},
    {"slug":"mixer","note":"Behringer Mixer","quantity":1,"confidence":"MEDIUM"},
    {"slug":"speaker","note":"E&W 12인치 PA Active Speaker","quantity":1}
  ]'::jsonb),
  ('studio-naver-1164642903', '합주실 대여 (기본 5인)', '752786', '4587951', '[
    {"slug":"microphone","note":"Shure SM58","quantity":1},
    {"slug":"speaker","note":"Yamaha Main Speaker 500W","quantity":2},
    {"slug":"bass-amp","note":"Colt Bass Amp","quantity":1,"confidence":"MEDIUM"},
    {"slug":"guitar-amp","note":"Orange Electric Guitar Amp; Sound Drive Acoustic Multi Amp","quantity":2,"confidence":"MEDIUM"},
    {"slug":"digital-piano","note":"Casio Stage Piano","quantity":1,"confidence":"MEDIUM"},
    {"slug":"acoustic-piano","note":"Astor Upright Piano","quantity":1},
    {"slug":"drum-kit","note":"Pearl Drum","quantity":1,"confidence":"MEDIUM"}
  ]'::jsonb),
  ('studio-naver-2024646212', '메인 합주실 (직장인 밴드, 공연팀 추천)', '1672001', '7751469', '[
    {"slug":"drum-kit","note":"Drum Set","quantity":1,"confidence":"MEDIUM"},
    {"slug":"guitar-amp","note":"Guitar Amp","quantity":2,"confidence":"MEDIUM"},
    {"slug":"bass-amp","note":"Bass Amp","quantity":1,"confidence":"MEDIUM"},
    {"slug":"speaker","note":"Front Speaker","quantity":6,"confidence":"MEDIUM"},
    {"slug":"keyboard","note":"Yamaha 90 Keyboard","quantity":1,"confidence":"MEDIUM"}
  ]'::jsonb),
  ('studio-naver-2088771878', '합주실 예약', '1511927', '7114000', '[
    {"slug":"drum-kit","note":"Gretsch Catalina Maple","quantity":1},
    {"slug":"cymbal-set","note":"Zildjian I Series","quantity":1},
    {"slug":"guitar-amp","note":"Marshall MG102X; Fender Champion II 100","quantity":2},
    {"slug":"bass-amp","note":"Ampeg BA-115HP 250W","quantity":1},
    {"slug":"keyboard","note":"Yamaha MX88; Kurzweil PC2X","quantity":2},
    {"slug":"microphone","note":"Shure 48","quantity":1,"confidence":"MEDIUM"},
    {"slug":"mixer","note":"Behringer PMP550 5채널","quantity":1},
    {"slug":"speaker","note":"Behringer B212XL 500W","quantity":1}
  ]'::jsonb),
  ('studio-naver-1626065452', '드럼 있는 합주실', '395148', '4904621', '[
    {"slug":"microphone","note":"Microphone","quantity":1,"confidence":"MEDIUM"},
    {"slug":"bass-amp","note":"Fender Bass Amp","quantity":1,"confidence":"MEDIUM"},
    {"slug":"guitar-amp","note":"Fender Guitar Amp; Laney Guitar Amp","quantity":2,"confidence":"MEDIUM"},
    {"slug":"cymbal-set","note":"Drum Cymbals","quantity":3,"confidence":"MEDIUM"},
    {"slug":"acoustic-piano","note":"Piano","quantity":1,"confidence":"MEDIUM"},
    {"slug":"drum-kit","note":"Drum Set","quantity":1,"confidence":"MEDIUM"},
    {"slug":"mixer","note":"Mixer","quantity":1,"confidence":"MEDIUM"},
    {"slug":"music-stand","note":"Music Stand","quantity":1,"confidence":"MEDIUM"}
  ]'::jsonb),
  ('studio-naver-1247276706', '[ROOM Y] 합주실 2', '1123399', '5807814', '[
    {"slug":"keyboard","note":"Synthesizer","quantity":1,"confidence":"MEDIUM"},
    {"slug":"drum-kit","note":"Electronic Drum + Amp","quantity":1,"confidence":"MEDIUM"},
    {"slug":"guitar-amp","note":"Blackstar HT20","quantity":1},
    {"slug":"bass-amp","note":"Bass Amp","quantity":1,"confidence":"MEDIUM"},
    {"slug":"mixer","note":"Mixer","quantity":1,"confidence":"MEDIUM"},
    {"slug":"speaker","note":"Speaker","quantity":1,"confidence":"MEDIUM"},
    {"slug":"microphone","note":"Microphone","quantity":1,"confidence":"MEDIUM"},
    {"slug":"music-stand","note":"Music Stand","quantity":1,"confidence":"MEDIUM"}
  ]'::jsonb),
  ('studio-naver-1567790203', '합주실(당일예약불가)', '1220949', '6125210', '[
    {"slug":"mixer","note":"Midas DP48 Personal Monitor Mixer","quantity":1},
    {"slug":"speaker","note":"Yamaha Column Array 1조","quantity":2},
    {"slug":"drum-kit","note":"Gretsch Broadkaster 5기통","quantity":1},
    {"slug":"keyboard","note":"Nord Stage 4; Yamaha MODX7+","quantity":2},
    {"slug":"guitar-amp","note":"Fender 65 Twin Reverb","quantity":1},
    {"slug":"bass-amp","note":"Aguilar Tone Hammer 500 + SL410","quantity":1},
    {"slug":"microphone","note":"Shure SM58; Beta 58; Beta 87","quantity":3}
  ]'::jsonb),
  ('studio-naver-2006423009', '합주실', '1448021', '6886177', '[
    {"slug":"mixer","note":"16-channel Mixer","quantity":1,"confidence":"MEDIUM"},
    {"slug":"guitar-amp","note":"Guitar Amp","quantity":2,"confidence":"MEDIUM"},
    {"slug":"bass-amp","note":"Bass Amp","quantity":1,"confidence":"MEDIUM"},
    {"slug":"keyboard","note":"Yamaha Keyboard","quantity":1,"confidence":"MEDIUM"},
    {"slug":"microphone","note":"Wired/Wireless Vocal Microphones","quantity":4,"confidence":"MEDIUM"},
    {"slug":"drum-kit","note":"Tama Drum Set","quantity":1,"confidence":"MEDIUM"},
    {"slug":"monitor-speaker","note":"파트별 Monitor Speaker","quantity":1,"confidence":"MEDIUM"}
  ]'::jsonb),
  ('studio-naver-1463949418', 'MUFAC 합주실 A룸', '686246', '4387975', '[
    {"slug":"drum-kit","note":"Tama Starclassic 5기통","quantity":1},
    {"slug":"bass-amp","note":"Ampeg SVT-CL + SVT-810E Cabinet","quantity":1},
    {"slug":"guitar-amp","note":"Marshall DSL100H + 1960A Cabinet; Marshall Code 100H + Code 212 Cabinet","quantity":2},
    {"slug":"keyboard","note":"Yamaha S90ES; Yamaha MODX8","quantity":2},
    {"slug":"microphone","note":"Shure SM58; Beta 58, 최대 6대","quantity":6},
    {"slug":"speaker","note":"JBL EON 615","quantity":1},
    {"slug":"mixer","note":"Yamaha MG16XU","quantity":1}
  ]'::jsonb);

CREATE TEMP TABLE manual_20260830_new_studio_equipment_rows AS
SELECT seed.studio_slug, seed.room_name, seed.business_id, seed.item_id,
       item.slug AS equipment_slug,
       item.note,
       NULLIF(item.quantity, 0)::smallint AS quantity,
       COALESCE(item.optional, false) AS is_optional,
       COALESCE(item.confidence, 'HIGH') AS confidence
FROM manual_20260830_new_studio_equipment seed
CROSS JOIN LATERAL jsonb_to_recordset(seed.equipment) AS item(
  slug TEXT,
  note TEXT,
  quantity INTEGER,
  optional BOOLEAN,
  confidence TEXT
);

INSERT INTO room_equipment (
  room_id, equipment_id, equipment_model_id, quantity, note, source,
  position_label, is_optional, details
)
SELECT r.id, ei.id, NULL, row.quantity, row.note, 'MANUAL', NULL, row.is_optional,
       jsonb_build_object('raw_models', row.note)
FROM manual_20260830_new_studio_equipment_rows row
JOIN studios s ON s.slug = row.studio_slug
JOIN rooms r ON r.studio_id = s.id AND r.name = row.room_name
JOIN equipment_items ei ON ei.slug = row.equipment_slug
ON CONFLICT (room_id, equipment_id, COALESCE(equipment_model_id, 0), COALESCE(position_label, ''))
DO UPDATE SET
  quantity = EXCLUDED.quantity,
  note = EXCLUDED.note,
  source = EXCLUDED.source,
  is_optional = EXCLUDED.is_optional,
  details = EXCLUDED.details,
  updated_at = now();

INSERT INTO equipment_evidence (
  evidence_key, target_kind, studio_id, room_id, equipment_id, equipment_model_id,
  room_equipment_id, source_kind, source_url, source_title, raw_name, raw_text,
  parsed_name, position_label, is_optional, confidence, observed_at
)
SELECT 'naver-current:' || row.business_id || ':' || row.item_id || ':' || row.equipment_slug,
       'ROOM', NULL, r.id, ei.id, NULL, re.id, 'NAVER_BOOKING',
       'https://m.booking.naver.com/booking/10/bizes/' || row.business_id || '/items/' || row.item_id,
       s.name || ' ' || r.name || ' 네이버 예약 상세', ei.name, row.note, row.note,
       NULL, row.is_optional, row.confidence, '2026-08-30T17:30:00+09:00'::timestamptz
FROM manual_20260830_new_studio_equipment_rows row
JOIN studios s ON s.slug = row.studio_slug
JOIN rooms r ON r.studio_id = s.id AND r.name = row.room_name
JOIN equipment_items ei ON ei.slug = row.equipment_slug
JOIN room_equipment re ON re.room_id = r.id
  AND re.equipment_id = ei.id
  AND re.equipment_model_id IS NULL
  AND re.position_label IS NULL
ON CONFLICT (evidence_key) DO UPDATE SET
  room_id = EXCLUDED.room_id,
  equipment_id = EXCLUDED.equipment_id,
  room_equipment_id = EXCLUDED.room_equipment_id,
  source_kind = EXCLUDED.source_kind,
  source_url = EXCLUDED.source_url,
  source_title = EXCLUDED.source_title,
  raw_name = EXCLUDED.raw_name,
  raw_text = EXCLUDED.raw_text,
  parsed_name = EXCLUDED.parsed_name,
  is_optional = EXCLUDED.is_optional,
  confidence = EXCLUDED.confidence,
  observed_at = EXCLUDED.observed_at;

DROP TABLE manual_20260830_new_studio_equipment_rows;
DROP TABLE manual_20260830_new_studio_equipment;
