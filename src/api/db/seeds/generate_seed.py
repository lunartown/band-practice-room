#!/usr/bin/env python3
"""JSON 데이터를 DB seed SQL로 변환"""
import json
import os
import re

# 경로는 스크립트 위치 기준으로 해석한다 (src/api/db/seeds/ → 레포 루트는 4단계 위).
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
_REPO_ROOT = os.path.abspath(os.path.join(_SCRIPT_DIR, "..", "..", "..", ".."))

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

def parse_capacity_bounds(room):
    def to_int(value):
        if value is None:
            return None
        try:
            return int(value)
        except (TypeError, ValueError):
            return None

    capacity_min = room.get("capacityMin")
    capacity_max = room.get("capacityMax")
    if capacity_min is not None or capacity_max is not None:
        return to_int(capacity_min), to_int(capacity_max)

    capacity = room.get("capacity")
    if isinstance(capacity, str):
        nums = [int(n) for n in re.findall(r'\d+', capacity)]
        if len(nums) >= 2:
            return nums[0], nums[-1]
        if len(nums) == 1:
            return nums[0], nums[0]
        return None, None
    capacity = to_int(capacity)
    return capacity, capacity

data = json.load(open(os.path.join(_REPO_ROOT, "_local", "studio-catalog.json")))

lines = []
lines.append("-- Auto-generated seed from _local/studio-catalog.json")
lines.append("-- idempotent UPSERT: TRUNCATE 하지 않는다.")
lines.append("--   · studios 의 enrich(image_url_scraped/rating/review_count/review_keywords)와")
lines.append("--     slots/scrape_jobs/scrape_runs 는 건드리지 않아 보존된다.")
lines.append("--   · is_active 는 INSERT 시에만 true, 충돌(UPDATE) 시 갱신하지 않아 수동 비활성화가 유지된다.\n")

# ── areas (upsert by id) ─────────────────────────────────────────────────────
lines.append("-- Areas")
for region, (slug, name, area_id) in REGION_MAP.items():
    lines.append(
        f"INSERT INTO areas (id, slug, name, \"order\", is_active) "
        f"VALUES ({area_id}, {esc(slug)}, {esc(name)}, {area_id}, true) "
        f"ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, \"order\"=EXCLUDED.\"order\", is_active=EXCLUDED.is_active;"
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
        f"VALUES ({esc(slug)}, {esc(name)}, {esc(description)}, {area_id}, {esc(address)}, true) "
        f"ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, "
        f"primary_area_id=EXCLUDED.primary_area_id, address=EXCLUDED.address;"
    )
    lines.append(
        f"INSERT INTO studio_areas (studio_id, area_id) "
        f"SELECT id, {area_id} FROM studios WHERE slug={esc(slug)} "
        f"ON CONFLICT (studio_id, area_id) DO NOTHING;"
    )
    if naver_url and biz_id:
        lines.append(
            f"INSERT INTO studio_sources (studio_id, source_id, external_key, url) "
            f"SELECT id, 1, {esc(biz_id)}, {esc(naver_url)} FROM studios WHERE slug={esc(slug)} "
            f"ON CONFLICT (studio_id, source_id) DO UPDATE SET external_key=EXCLUDED.external_key, url=EXCLUDED.url;"
        )

    for room in studio.get("roomDetails", []):
        # room_sources.external_key 는 네이버 실제 bizItemId(naverBizItemId)를 쓴다.
        # 미매칭(1:N/공백) 방은 네이버 식별자가 없으므로 room_sources 자체를 생략해
        # 스크래퍼가 틀린 키로 BizItemNotFound 를 내지 않도록 한다.
        naver_biz_item_id = room.get("naverBizItemId")
        room_name = room.get("name")
        hourly = room.get("hourlyPrice") or parse_price(room.get("price"))
        capacity_min, capacity_max = parse_capacity_bounds(room)
        price_source = "SCRAPED" if hourly else "UNKNOWN"

        lines.append(
            f"INSERT INTO rooms (studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active) "
            f"SELECT id, {esc(room_name)}, "
            f"{'NULL' if not hourly else hourly}, '{price_source}', "
            f"{'NULL' if capacity_min is None else capacity_min}, "
            f"{'NULL' if capacity_max is None else capacity_max}, true "
            f"FROM studios WHERE slug={esc(slug)} "
            f"ON CONFLICT (studio_id, name) DO UPDATE SET price_per_hour=EXCLUDED.price_per_hour, "
            f"price_source=EXCLUDED.price_source, capacity_min=EXCLUDED.capacity_min, capacity_max=EXCLUDED.capacity_max;"
        )
        if naver_biz_item_id:
            lines.append(
                f"INSERT INTO room_sources (room_id, source_id, external_key) "
                f"SELECT r.id, 1, {esc(str(naver_biz_item_id))} "
                f"FROM rooms r JOIN studios s ON r.studio_id=s.id "
                f"WHERE s.slug={esc(slug)} AND r.name={esc(room_name)} "
                f"ON CONFLICT (room_id, source_id) DO UPDATE SET external_key=EXCLUDED.external_key;"
            )

    lines.append("")

# ── sequence 업데이트 ──────────────────────────────────────────────────────
lines.append("-- Sequence 업데이트")
for tbl in ("areas", "studios", "rooms"):
    lines.append(
        f"SELECT setval(pg_get_serial_sequence('{tbl}', 'id'), COALESCE((SELECT MAX(id) FROM {tbl}), 1));"
    )

out_path = os.path.join(_SCRIPT_DIR, "002_studios.sql")
with open(out_path, "w") as f:
    f.write("\n".join(lines))

print(f"생성 완료: {out_path}")
