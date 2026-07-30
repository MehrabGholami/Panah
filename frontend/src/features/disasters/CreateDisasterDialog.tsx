import CrisisAlertOutlinedIcon from '@mui/icons-material/CrisisAlertOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import MyLocationOutlinedIcon from '@mui/icons-material/MyLocationOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import {
  Autocomplete,
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid2 as Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CircleMarker, MapContainer, TileLayer, useMapEvents, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { apiClient } from '@/shared/api/axios';
import { endpoints } from '@/shared/api/endpoints';
import { GhostButton, GradientButton, JalaliDateField } from '@/shared/components/ui';
import type { CreateDisasterRequest, Disaster, DisasterNeed } from '@/shared/types';
import { DISASTER_NEEDS, DISASTER_SEVERITIES, DISASTER_TYPES } from '@/shared/types/disasters';

interface CreateDisasterDialogProps {
  open: boolean;
  onClose: () => void;
  disaster?: Disaster | null;
}

type GeoProvince = { id: number; name: string; slug: string };
type GeoCity = { id: number; name: string; slug: string; province_id: number };
type Coordinates = { lat: number; lng: number };

const DEFAULT_CENTER: Coordinates = { lat: 32.4279, lng: 53.688 }; // Iran center
const IRAN_BOUNDS = {
  north: 39.8,
  south: 24.8,
  east: 63.5,
  west: 44.0,
};

const initialForm: CreateDisasterRequest = {
  title: '',
  description: '',
  disaster_type: 'earthquake',
  severity: 'medium',
  province: '',
  city: '',
  location: '',
  occurred_at: null,
  needs: [],
  affected_population: null,
  status: 'active',
};

function FormSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2.5,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'action.hover',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.75 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 1.5,
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'rgba(34, 211, 238, 0.12)',
            color: 'primary.main',
          }}
        >
          {icon}
        </Box>
        <Typography variant="subtitle2" fontWeight={800}>
          {title}
        </Typography>
      </Stack>
      {children}
    </Box>
  );
}

function toDateOnly(value?: string | null) {
  if (!value) return null;
  return value.slice(0, 10);
}

function buildGoogleMapsLink(lat: number | string, lng: number | string) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

function normalizeGoogleMapsUrl(raw: string) {
  const value = raw.trim();
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.startsWith('www.')) return `https://${value}`;
  return `https://${value}`;
}

function ClickableMap({
  position,
  showMarker,
  onSelect,
}: {
  position: Coordinates;
  showMarker: boolean;
  onSelect: (coords: Coordinates) => void;
}) {
  useMapEvents({
    click(event) {
      onSelect({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });

  if (!showMarker) return null;

  return (
    <CircleMarker
      center={[position.lat, position.lng]}
      radius={9}
      pathOptions={{ color: '#06b6d4', fillColor: '#22d3ee', fillOpacity: 0.45 }}
    />
  );
}

function MapRecenter({ position }: { position: Coordinates }) {
  const map = useMapEvents({});
  useEffect(() => {
    map.setView([position.lat, position.lng], map.getZoom());
  }, [map, position.lat, position.lng]);
  return null;
}

function resolveDetailedLocation(province?: string | null, city?: string | null, location?: string | null) {
  const raw = (location ?? '').trim();
  if (!raw) return '';

  const segments = raw.split(' — ').map((segment) => segment.trim()).filter(Boolean);
  if (segments.length === 0) return '';

  const provinceName = province?.trim();
  const cityName = city?.trim();
  const isGeoLabel = (segment: string) =>
    Boolean((provinceName && segment === provinceName) || (cityName && segment === cityName));

  const detailSegments = segments.filter((segment) => !isGeoLabel(segment));
  return detailSegments.join(' — ');
}

export function CreateDisasterDialog({ open, onClose, disaster }: CreateDisasterDialogProps) {
  const { t } = useTranslation('disasters');
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateDisasterRequest>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [provinces, setProvinces] = useState<GeoProvince[]>([]);
  const [cities, setCities] = useState<GeoCity[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [customNeeds, setCustomNeeds] = useState<string[]>([]);
  const [customNeedInput, setCustomNeedInput] = useState('');
  const isEditMode = Boolean(disaster?.id);

  useEffect(() => {
    if (!open) return;
    if (provinces.length > 0 && cities.length > 0) return;

    const loadGeo = async () => {
      setGeoLoading(true);
      try {
        const [provRes, citiesRes] = await Promise.all([
          fetch('https://cdn.jsdelivr.net/npm/iran-city@1.2.2/dist/list-of-cities-in-Iran/json/provinces.json'),
          fetch('https://cdn.jsdelivr.net/npm/iran-city@1.2.2/dist/list-of-cities-in-Iran/json/cities.json'),
        ]);

        const provJson = (await provRes.json()) as GeoProvince[];
        const cityJson = (await citiesRes.json()) as GeoCity[];

        setProvinces(provJson);
        setCities(cityJson);
      } finally {
        setGeoLoading(false);
      }
    };

    void loadGeo();
  }, [open, provinces.length, cities.length]);

  const citiesForSelectedProvince = useMemo(() => {
    if (!selectedProvinceId) return [];
    return cities.filter((c) => c.province_id === selectedProvinceId);
  }, [cities, selectedProvinceId]);

  useEffect(() => {
    if (!open) return;

    if (!disaster) {
      setForm(initialForm);
      setGoogleMapsUrl('');
      setLat('');
      setLng('');
      setSelectedProvinceId(null);
      setSelectedCityId(null);
      setCustomNeeds([]);
      setCustomNeedInput('');
      return;
    }

    const coordinates = disaster.metadata?.coordinates;
    const otherNeeds = (disaster.metadata?.other_needs ?? []).filter(
      (item): item is string => typeof item === 'string' && item.trim().length > 0,
    );
    const baseNeeds = disaster.needs ?? [];
    setForm({
      title: disaster.title ?? '',
      description: disaster.description ?? '',
      disaster_type: disaster.disaster_type,
      severity: disaster.severity,
      province: disaster.province ?? '',
      city: disaster.city ?? '',
      location: resolveDetailedLocation(disaster.province, disaster.city, disaster.location),
      occurred_at: toDateOnly(disaster.occurred_at),
      needs:
        otherNeeds.length > 0 && !baseNeeds.includes('other')
          ? [...baseNeeds, 'other']
          : baseNeeds,
      affected_population: disaster.affected_population ?? null,
      status: disaster.status,
      metadata: disaster.metadata,
    });
    setCustomNeeds(otherNeeds);
    setCustomNeedInput('');
    setGoogleMapsUrl(disaster.metadata?.google_maps_url ?? '');
    setLat(coordinates?.lat != null ? String(coordinates.lat) : '');
    setLng(coordinates?.lng != null ? String(coordinates.lng) : '');
    setSelectedProvinceId(null);
    setSelectedCityId(null);
  }, [open, disaster]);

  useEffect(() => {
    if (!open || !disaster || provinces.length === 0) return;
    const province = provinces.find((item) => item.name === (disaster.province ?? ''));
    setSelectedProvinceId(province?.id ?? null);
  }, [open, disaster, provinces]);

  useEffect(() => {
    if (!open || !disaster || cities.length === 0 || !selectedProvinceId) return;
    const city = cities.find(
      (item) => item.province_id === selectedProvinceId && item.name === (disaster.city ?? ''),
    );
    setSelectedCityId(city?.id ?? null);
  }, [open, disaster, cities, selectedProvinceId]);

  const upsertMutation = useMutation({
    mutationFn: async (payload: CreateDisasterRequest) => {
      const { data } = isEditMode
        ? await apiClient.patch<Disaster>(endpoints.disasters.detail(disaster!.id), payload)
        : await apiClient.post<Disaster>(endpoints.disasters.list, payload);
      return data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['disasters'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] }),
      ]);
      setForm(initialForm);
      setError(null);
      onClose();
    },
    onError: () => {
      setError(isEditMode ? t('messages.updateError') : t('messages.createError'));
    },
  });

  const handleChange = <K extends keyof CreateDisasterRequest>(
    field: K,
    value: CreateDisasterRequest[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleNeed = (need: DisasterNeed) => {
    setForm((prev) => {
      const current = prev.needs ?? [];
      const exists = current.includes(need);
      if (need === 'other' && exists) {
        setCustomNeeds([]);
        setCustomNeedInput('');
      }
      return {
        ...prev,
        needs: exists ? current.filter((item) => item !== need) : [...current, need],
      };
    });
  };

  const addCustomNeed = () => {
    const value = customNeedInput.trim();
    if (!value) return;
    setCustomNeeds((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setCustomNeedInput('');
    setForm((prev) => {
      const current = prev.needs ?? [];
      if (current.includes('other')) return prev;
      return { ...prev, needs: [...current, 'other'] };
    });
  };

  const removeCustomNeed = (value: string) => {
    setCustomNeeds((prev) => prev.filter((item) => item !== value));
  };

  const handleClose = () => {
    if (!upsertMutation.isPending) {
      setForm(initialForm);
      setError(null);
      setGoogleMapsUrl('');
      setLat('');
      setLng('');
      setSelectedProvinceId(null);
      setSelectedCityId(null);
      setCustomNeeds([]);
      setCustomNeedInput('');
      onClose();
    }
  };

  const mapPosition = useMemo<Coordinates>(() => {
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);
    const valid =
      lat.trim() !== '' &&
      lng.trim() !== '' &&
      Number.isFinite(parsedLat) &&
      Number.isFinite(parsedLng) &&
      parsedLat >= -90 &&
      parsedLat <= 90 &&
      parsedLng >= -180 &&
      parsedLng <= 180;
    return valid ? { lat: parsedLat, lng: parsedLng } : DEFAULT_CENTER;
  }, [lat, lng]);

  const hasMapMarker = useMemo(() => {
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);
    return (
      lat.trim() !== '' &&
      lng.trim() !== '' &&
      Number.isFinite(parsedLat) &&
      Number.isFinite(parsedLng)
    );
  }, [lat, lng]);

  const handleMapSelect = (coords: Coordinates) => {
    const clampedLat = Math.min(IRAN_BOUNDS.north, Math.max(IRAN_BOUNDS.south, coords.lat));
    const clampedLng = Math.min(IRAN_BOUNDS.east, Math.max(IRAN_BOUNDS.west, coords.lng));
    setLat(clampedLat.toFixed(6));
    setLng(clampedLng.toFixed(6));
    if (!googleMapsUrl.trim()) {
      setGoogleMapsUrl(buildGoogleMapsLink(clampedLat.toFixed(6), clampedLng.toFixed(6)));
    }
  };

  const handleClearMap = () => {
    setLat('');
    setLng('');
    setGoogleMapsUrl('');
  };

  const handleSubmit = () => {
    setError(null);
    if (!form.title.trim()) return;
    const hasLocation = [form.province, form.city, form.location].some((value) => value?.trim());
    if (!hasLocation) {
      setError(t('messages.locationRequired'));
      return;
    }
    const parsedLat = lat.trim() ? Number(lat) : null;
    const parsedLng = lng.trim() ? Number(lng) : null;
    const hasCoordinates = parsedLat !== null && parsedLng !== null;
    const invalidCoordinates =
      (parsedLat !== null && Number.isNaN(parsedLat)) ||
      (parsedLng !== null && Number.isNaN(parsedLng)) ||
      (parsedLat !== null && (parsedLat < -90 || parsedLat > 90)) ||
      (parsedLng !== null && (parsedLng < -180 || parsedLng > 180));

    if (invalidCoordinates) {
      setError(t('messages.invalidCoordinates'));
      return;
    }

    const hasOtherNeed = (form.needs ?? []).includes('other');
    if (hasOtherNeed && customNeeds.length === 0) {
      setError(t('messages.otherNeedsRequired'));
      return;
    }

    const metadata: CreateDisasterRequest['metadata'] = {
      ...(form.metadata ?? {}),
    };

    if (googleMapsUrl.trim()) {
      metadata.google_maps_url = normalizeGoogleMapsUrl(googleMapsUrl);
    } else {
      delete metadata.google_maps_url;
    }

    if (
      hasCoordinates &&
      parsedLat !== null &&
      parsedLng !== null &&
      !Number.isNaN(parsedLat) &&
      !Number.isNaN(parsedLng)
    ) {
      metadata.coordinates = { lat: parsedLat, lng: parsedLng };
    } else {
      delete metadata.coordinates;
    }

    if (hasOtherNeed) {
      metadata.other_needs = customNeeds;
    } else {
      delete metadata.other_needs;
    }

    const hasMetadata = Object.keys(metadata).length > 0;

    upsertMutation.mutate({
      ...form,
      title: form.title.trim(),
      description: form.description?.trim() ?? '',
      province: form.province?.trim() ?? '',
      city: form.city?.trim() ?? '',
      location: form.location?.trim() ?? '',
      occurred_at: form.occurred_at ? `${form.occurred_at}T12:00:00` : null,
      metadata: hasMetadata ? metadata : undefined,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 3,
          m: { xs: fullScreen ? 0 : 1.5, sm: 2 },
          width: { xs: fullScreen ? '100%' : 'calc(100% - 24px)', sm: undefined },
          backgroundImage: (theme) =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(180deg, rgba(15,23,42,0.98) 0%, rgba(8,18,38,0.98) 100%)'
              : 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
          <Box>
            <Typography variant="h6" fontWeight={800}>
              {isEditMode ? t('actions.edit') : t('actions.create')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {t('subtitle')}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small" aria-label={t('actions.cancel')}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ borderColor: 'divider' }}>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}

          <FormSection title={t('form.sections.basic')} icon={<CrisisAlertOutlinedIcon fontSize="small" />}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label={t('form.fields.title')}
                  value={form.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  fullWidth
                  size="small"
                  required
                  placeholder={t('form.hints.title')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label={t('form.fields.disasterType')}
                  value={form.disaster_type}
                  onChange={(e) => handleChange('disaster_type', e.target.value as CreateDisasterRequest['disaster_type'])}
                  fullWidth
                  size="small"
                  select
                >
                  {DISASTER_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {t(`types.${type}`)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label={t('form.fields.severity')}
                  value={form.severity}
                  onChange={(e) => handleChange('severity', e.target.value as CreateDisasterRequest['severity'])}
                  fullWidth
                  size="small"
                  select
                >
                  {DISASTER_SEVERITIES.map((severity) => (
                    <MenuItem key={severity} value={severity}>
                      {t(`severity.${severity}`)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <JalaliDateField
                  label={t('form.fields.occurredAt')}
                  value={form.occurred_at ?? null}
                  onChange={(value) => handleChange('occurred_at', value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label={t('form.fields.affectedPopulation')}
                  type="number"
                  value={form.affected_population ?? ''}
                  onChange={(e) =>
                    handleChange(
                      'affected_population',
                      e.target.value === '' ? null : Number(e.target.value),
                    )
                  }
                  fullWidth
                  size="small"
                  inputProps={{ min: 0 }}
                />
              </Grid>
            </Grid>
          </FormSection>

          <FormSection title={t('form.sections.location')} icon={<LocationOnOutlinedIcon fontSize="small" />}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Autocomplete
                  options={provinces}
                  loading={geoLoading}
                  value={selectedProvinceId ? provinces.find((p) => p.id === selectedProvinceId) ?? null : null}
                  onChange={(_, value) => {
                    const nextProvinceId = value?.id ?? null;
                    setSelectedProvinceId(nextProvinceId);
                    setSelectedCityId(null);
                    handleChange('province', value?.name ?? '');
                    handleChange('city', '');
                  }}
                  getOptionLabel={(option) => option.name}
                  renderInput={(params) => (
                    <TextField {...params} label={t('form.fields.province')} size="small" />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Autocomplete
                  disabled={!selectedProvinceId}
                  options={citiesForSelectedProvince}
                  loading={geoLoading}
                  value={selectedCityId ? citiesForSelectedProvince.find((c) => c.id === selectedCityId) ?? null : null}
                  onChange={(_, value) => {
                    const nextCityId = value?.id ?? null;
                    setSelectedCityId(nextCityId);
                    handleChange('city', value?.name ?? '');
                  }}
                  getOptionLabel={(option) => option.name}
                  renderInput={(params) => (
                    <TextField {...params} label={t('form.fields.city')} size="small" />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label={t('form.fields.location')}
                  value={form.location ?? ''}
                  onChange={(e) => handleChange('location', e.target.value)}
                  fullWidth
                  size="small"
                  placeholder={t('form.hints.location')}
                />
              </Grid>
            </Grid>
          </FormSection>

          <FormSection title={t('form.sections.map')} icon={<MapOutlinedIcon fontSize="small" />}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                  {t('form.hints.mapPicker')}
                </Typography>
                <Box
                  sx={{
                    position: 'relative',
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: 1,
                    borderColor: 'divider',
                    height: { xs: 220, md: 280 },
                    '& .leaflet-container': { height: '100%', width: '100%' },
                  }}
                >
                  {hasMapMarker && (
                    <Tooltip title={t('actions.clearMap')} placement="right">
                      <IconButton
                        onClick={handleClearMap}
                        size="small"
                        aria-label={t('actions.clearMap')}
                        sx={{
                          position: 'absolute',
                          top: 10,
                          left: 10,
                          zIndex: 1000,
                          width: 34,
                          height: 34,
                          borderRadius: 1,
                          bgcolor: 'background.paper',
                          border: 1,
                          borderColor: 'divider',
                          boxShadow: 1,
                          color: 'error.main',
                          '&:hover': {
                            bgcolor: 'error.main',
                            color: 'error.contrastText',
                            borderColor: 'error.main',
                          },
                        }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <MapContainer
                    center={[mapPosition.lat, mapPosition.lng]}
                    zoom={6}
                    minZoom={5}
                    maxZoom={13}
                    maxBounds={[
                      [IRAN_BOUNDS.south, IRAN_BOUNDS.west],
                      [IRAN_BOUNDS.north, IRAN_BOUNDS.east],
                    ]}
                    maxBoundsViscosity={1}
                    scrollWheelZoom
                    zoomControl={false}
                  >
                    <ZoomControl position="topright" />
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapRecenter position={mapPosition} />
                    <ClickableMap
                      position={mapPosition}
                      showMarker={hasMapMarker}
                      onSelect={handleMapSelect}
                    />
                  </MapContainer>
                </Box>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label={t('form.fields.googleMapsUrl')}
                  value={googleMapsUrl}
                  onChange={(e) => setGoogleMapsUrl(e.target.value)}
                  fullWidth
                  size="small"
                  placeholder={t('form.hints.googleMapsUrl')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  InputProps={{ startAdornment: <MyLocationOutlinedIcon fontSize="small" color="action" /> }}
                  label={t('form.fields.latitude')}
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="35.6892"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  InputProps={{ startAdornment: <MyLocationOutlinedIcon fontSize="small" color="action" /> }}
                  label={t('form.fields.longitude')}
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="51.3890"
                />
              </Grid>
            </Grid>
          </FormSection>

          <FormSection title={t('form.sections.needs')} icon={<MedicalServicesOutlinedIcon fontSize="small" />}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              {t('form.hints.needs')}
            </Typography>
            <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.75} sx={{ mb: 2 }}>
              {DISASTER_NEEDS.map((need) => {
                const selected = (form.needs ?? []).includes(need);
                return (
                  <Chip
                    key={need}
                    label={t(`needs.${need}`)}
                    clickable
                    onClick={() => toggleNeed(need)}
                    color={selected ? 'primary' : 'default'}
                    variant={selected ? 'filled' : 'outlined'}
                    sx={{ fontWeight: 600 }}
                  />
                );
              })}
            </Stack>
            {(form.needs ?? []).includes('other') && (
              <Box sx={{ mb: 2 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 1 }}>
                  <TextField
                    size="small"
                    fullWidth
                    label={t('form.fields.otherNeeds')}
                    placeholder={t('form.hints.otherNeeds')}
                    value={customNeedInput}
                    onChange={(e) => setCustomNeedInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomNeed();
                      }
                    }}
                  />
                  <Button
                    variant="outlined"
                    onClick={addCustomNeed}
                    sx={{ minWidth: { sm: 96 }, alignSelf: { xs: 'stretch', sm: 'center' } }}
                  >
                    افزودن
                  </Button>
                </Stack>
                {customNeeds.length > 0 && (
                  <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.5}>
                    {customNeeds.map((item) => (
                      <Chip
                        key={item}
                        label={item}
                        onDelete={() => removeCustomNeed(item)}
                        color="primary"
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                    ))}
                  </Stack>
                )}
              </Box>
            )}
            <TextField
              label={t('form.fields.description')}
              value={form.description ?? ''}
              onChange={(e) => handleChange('description', e.target.value)}
              fullWidth
              size="small"
              multiline
              minRows={3}
              placeholder={t('form.hints.description')}
            />
          </FormSection>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Stack direction="row" spacing={1.5} sx={{ width: '100%' }}>
          <GradientButton
            fullWidth
            onClick={handleSubmit}
            disabled={upsertMutation.isPending || !form.title.trim()}
          >
            {upsertMutation.isPending ? '...' : isEditMode ? t('actions.update') : t('actions.submit')}
          </GradientButton>
          <GhostButton onClick={handleClose} disabled={upsertMutation.isPending} sx={{ minWidth: 100 }}>
            {t('actions.cancel')}
          </GhostButton>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
