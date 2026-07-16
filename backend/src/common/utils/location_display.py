from __future__ import annotations


def format_location_display(
    province: str | None = None,
    city: str | None = None,
    location: str | None = None,
) -> str:
    province_name = (province or "").strip()
    city_name = (city or "").strip()
    raw_location = (location or "").strip()

    geo_labels = {name for name in (province_name, city_name) if name}

    detail_segments: list[str] = []
    if raw_location:
        normalized = raw_location.replace("،", " — ")
        for segment in normalized.split(" — "):
            cleaned = segment.strip()
            if cleaned and cleaned not in geo_labels and cleaned not in detail_segments:
                detail_segments.append(cleaned)

    parts: list[str] = []
    if province_name:
        parts.append(province_name)
    if city_name and city_name != province_name:
        parts.append(city_name)
    parts.extend(detail_segments)

    return " — ".join(parts)
