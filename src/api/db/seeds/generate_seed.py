#!/usr/bin/env python3
"""JSON 데이터를 DB seed SQL로 변환"""
import json
import re

REGION_MAP = {
    "합정/홍대":        ("hapjeong-hongdae",        "합정/홍대",        1),
    "신촌":             ("sinchon",                  "신촌",             2),
    "사당/이수":        ("sadang-isu",               "사당/이수",        3),
    "신도림/영등포구청": ("sindorim-yeongdeungpo",   "신도림/영등포구청", 4),
    "망원":             ("mangwon",                  "망원",             5),
    "상도,중앙대":      ("sangdo-chungang",          "상도/중앙대",      6),
    "서울대입구":       ("seoul-nat-univ",            "서울대입구",       7),
    "방배":             ("bangbae",                  "방배",             8),
    "혜화/성신여대":    ("hyehwa-ssuniv",            "혜화/성신여대",    9),
    "강남":             ("gangnam",                  "강남",             10),
    "강동/송파":        ("gangdong-songpa",          "강동/송파",        11),
    "기타 서울":        ("other-seoul",              "기타 서울",        12),
}

def esc(s):
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"

def parse_price(price_str):
    if not price_str:
        return None
    nums = re.findall(r'\d+', price_str.replace(",", ""))
    return int(nums[0]) if nums else None

def naver_biz_id(url):
    if not url:
        return None
    m = re.search(r'/bizes/(\d+)', url)
    return m.group(1) if m else None

data = json.load(open("/Users/lunartown/development/projects/band-practice-room/_local/data"))

lines = []
lines.append("-- Auto-generated seed from _local/data")
lines.append("-- 기존 스튜디오/룸 데이터를 완전히 교체\n")

# ── 기존 데이터 초기화 (의존성 역순) ─────────────────────────────────────────
lines.append("-- 기존 데이터 초기화")
lines.append("TRUNCATE TABLE slots, room_sources, rooms, studio_sources, studio_areas, studios, scrape_jobs, scrape_runs RESTART IDENTITY CASCADE;")
lines.append("TRUNCATE TABLE areas RESTART IDENTITY CASCADE;")
lines.append("-- sources는 유지 (naver source id=1)")
lines.append("")

# ── areas ──────────────────────────────────────────────────────────────────
lines.append("-- Areas")
for region, (slug, name, area_id) in REGION_MAP.items():
    lines.append(
        f"INSERT INTO areas (id, slug, name, \"order\", is_active) "
        f"VALUES ({area_id}, {esc(slug)}, {esc(name)}, {area_id}, true);"
    )
lines.append("")

# ── studios & rooms ─────────────────────────────────────────────────────────
lines.append("-- Studios, rooms, studio_sources, room_sources")

for studio in data["studios"]:
    region = studio.get("region", "")
    area_info = REGION_MAP.get(region)
    area_id = area_info[2] if area_info else "NULL"

    slug = studio["id"]
    name = studio["name"]
    address = studio.get("address") or None
    description = studio.get("description") or None
    naver_url = studio.get("naverUrl")
    biz_id = naver_biz_id(naver_url)

    lines.append(
        f"INSERT INTO studios (slug, name, description, primary_area_id, address, is_active) "
        f"VALUES ({esc(slug)}, {esc(name)}, {esc(description)}, {area_id}, {esc(address)}, true);"
    )
    lines.append(
        f"INSERT INTO studio_areas (studio_id, area_id) "
        f"SELECT id, {area_id} FROM studios WHERE slug={esc(slug)};"
    )
    if naver_url and biz_id:
        lines.append(
            f"INSERT INTO studio_sources (studio_id, source_id, external_key, url) "
            f"SELECT id, 1, {esc(biz_id)}, {esc(naver_url)} FROM studios WHERE slug={esc(slug)};"
        )

    for room in studio.get("roomDetails", []):
        room_ext_id = room.get("id")
        room_name = room.get("name")
        hourly = room.get("hourlyPrice") or parse_price(room.get("price"))
        capacity = room.get("capacity")
        if isinstance(capacity, str):
            nums = re.findall(r'\d+', capacity)
            capacity = int(nums[0]) if nums else None
        price_source = "SCRAPED" if hourly else "UNKNOWN"

        lines.append(
            f"INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) "
            f"SELECT id, {esc(room_name)}, "
            f"{'NULL' if not hourly else hourly}, '{price_source}', "
            f"{'NULL' if capacity is None else capacity}, "
            f"{'NULL' if capacity is None else capacity}, true "
            f"FROM studios WHERE slug={esc(slug)};"
        )
        if room_ext_id:
            lines.append(
                f"INSERT INTO room_sources (room_id, source_id, external_key) "
                f"SELECT r.id, 1, {esc(str(room_ext_id))} "
                f"FROM rooms r JOIN studios s ON r.studio_id=s.id "
                f"WHERE s.slug={esc(slug)} AND r.name={esc(room_name)};"
            )

    lines.append("")

# ── sequence 업데이트 ──────────────────────────────────────────────────────
lines.append("-- Sequence 업데이트")
for tbl in ("areas", "studios", "rooms"):
    lines.append(
        f"SELECT setval(pg_get_serial_sequence('{tbl}', 'id'), COALESCE((SELECT MAX(id) FROM {tbl}), 1));"
    )

out_path = "/Users/lunartown/development/projects/band-practice-room/apps/api/db/seeds/002_studios.sql"
with open(out_path, "w") as f:
    f.write("\n".join(lines))

print(f"생성 완료: {out_path}")
