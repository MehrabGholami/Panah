export type DisasterSeverity = 'low' | 'medium' | 'high' | 'critical';
export type DisasterStatus = 'active' | 'inactive' | 'resolved' | 'archived';
export type DisasterType =
  | 'earthquake'
  | 'flood'
  | 'fire'
  | 'storm'
  | 'landslide'
  | 'epidemic'
  | 'drought'
  | 'industrial'
  | 'other';

export type DisasterNeed =
  | 'rescue'
  | 'medical'
  | 'food'
  | 'water'
  | 'shelter'
  | 'clothing'
  | 'transport'
  | 'volunteers'
  | 'equipment'
  | 'psychosocial'
  | 'other';

export interface Disaster {
  id: string;
  title: string;
  description: string;
  disaster_type: DisasterType;
  severity: DisasterSeverity;
  status: DisasterStatus;
  province?: string;
  city?: string;
  location: string;
  location_display?: string;
  occurred_at?: string | null;
  needs: DisasterNeed[];
  affected_population?: number | null;
  metadata?: {
    google_maps_url?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    other_needs?: string[];
    [key: string]: unknown;
  };
  created_at: string;
  updated_at: string;
}

export interface CreateDisasterRequest {
  title: string;
  description?: string;
  disaster_type: DisasterType;
  severity: DisasterSeverity;
  province?: string;
  city?: string;
  location?: string;
  occurred_at?: string | null;
  needs?: DisasterNeed[];
  affected_population?: number | null;
  status?: DisasterStatus;
  metadata?: {
    google_maps_url?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    other_needs?: string[];
    [key: string]: unknown;
  };
}

export const DISASTER_TYPES: DisasterType[] = [
  'earthquake',
  'flood',
  'fire',
  'storm',
  'landslide',
  'epidemic',
  'drought',
  'industrial',
  'other',
];

export const DISASTER_SEVERITIES: DisasterSeverity[] = ['low', 'medium', 'high', 'critical'];

export const DISASTER_NEEDS: DisasterNeed[] = [
  'rescue',
  'medical',
  'food',
  'water',
  'shelter',
  'clothing',
  'transport',
  'volunteers',
  'equipment',
  'psychosocial',
  'other',
];
