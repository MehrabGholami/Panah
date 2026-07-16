export function formatLocationDisplay(
  province?: string | null,
  city?: string | null,
  location?: string | null,
): string {
  const provinceName = province?.trim() ?? '';
  const cityName = city?.trim() ?? '';
  const rawLocation = location?.trim() ?? '';

  const geoLabels = new Set([provinceName, cityName].filter(Boolean));

  const detailSegments: string[] = [];
  if (rawLocation) {
    const normalized = rawLocation.replace(/،/g, ' — ');
    for (const segment of normalized.split(' — ')) {
      const cleaned = segment.trim();
      if (cleaned && !geoLabels.has(cleaned) && !detailSegments.includes(cleaned)) {
        detailSegments.push(cleaned);
      }
    }
  }

  const parts: string[] = [];
  if (provinceName) parts.push(provinceName);
  if (cityName && cityName !== provinceName) parts.push(cityName);
  parts.push(...detailSegments);

  return parts.join(' — ');
}

export function getDisasterLocationDisplay(disaster: {
  location_display?: string;
  province?: string;
  city?: string;
  location?: string;
}): string {
  if (disaster.location_display?.trim()) return disaster.location_display;
  return formatLocationDisplay(disaster.province, disaster.city, disaster.location) || '—';
}

export function getMissionLocationDisplay(mission: {
  location_display?: string;
  province?: string;
  city?: string;
  location?: string;
}): string {
  if (mission.location_display?.trim()) return mission.location_display;
  return formatLocationDisplay(mission.province, mission.city, mission.location) || '—';
}
