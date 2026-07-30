import { Box, Stack, Typography, alpha, useTheme } from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { GlassCard } from '@/shared/components/ui';
import type { DashboardChartSlice, DashboardCharts } from '@/shared/types';
import { toPersianDigits } from '@/shared/utils/persianDigits';

const CHART_COLORS = ['#22D3EE', '#818CF8', '#34D399', '#FBBF24', '#F87171', '#FB923C', '#A78BFA'];

/** Stable semantic colors by backend status key (not by sort order). */
const STATUS_COLORS: Record<string, string> = {
  pending: '#FBBF24',
  accepted: '#34D399',
  checked_in: '#22D3EE',
  completed: '#818CF8',
  declined: '#F87171',
  submitted: '#38BDF8',
  waitlist: '#FB923C',
  approved: '#34D399',
  rejected: '#F87171',
  withdrawn: '#94A3B8',
  draft: '#FBBF24',
  published: '#38BDF8',
  in_progress: '#22D3EE',
  closed: '#94A3B8',
  cancelled: '#F87171',
  active: '#F87171',
  contained: '#FBBF24',
  resolved: '#34D399',
  reported: '#38BDF8',
  registered: '#38BDF8',
  pending_approval: '#FBBF24',
  inactive: '#94A3B8',
  female: '#EC4899',
  male: '#3B82F6',
  other: '#A78BFA',
  unspecified: '#94A3B8',
};

function colorForSlice(entry: DashboardChartSlice, index: number) {
  return STATUS_COLORS[entry.key] ?? CHART_COLORS[index % CHART_COLORS.length];
}

function ChartCard({
  title,
  children,
  height = 300,
  sx,
}: {
  title: string;
  children: React.ReactNode;
  height?: number;
  sx?: object;
}) {
  return (
    <GlassCard sx={{ p: 2.5, height: '100%', ...sx }}>
      <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2 }}>
        {title}
      </Typography>
      <Box sx={{ width: '100%', height }}>{children}</Box>
    </GlassCard>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <Box
      sx={{
        height: '100%',
        display: 'grid',
        placeItems: 'center',
        color: 'text.secondary',
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'action.hover',
      }}
    >
      <Typography variant="body2">{label}</Typography>
    </Box>
  );
}

function formatChartNumber(value: number | string) {
  return toPersianDigits(String(value));
}

function formatTrendDate(value: string) {
  return toPersianDigits(new Date(value).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' }));
}

type ChartTooltipPayloadItem = {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
  payload?: DashboardChartSlice;
};

function ChartTooltipContent({
  active,
  payload,
  label,
  labelFormatter,
}: {
  active?: boolean;
  payload?: ChartTooltipPayloadItem[];
  label?: string | number;
  labelFormatter?: (label: string | number) => string;
}) {
  if (!active || !payload?.length) return null;

  const title =
    label == null || label === ''
      ? null
      : labelFormatter
        ? labelFormatter(label)
        : String(label);

  const entries = payload.filter((item) => item.value != null);

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1.5,
        px: 1.5,
        py: 1,
        minWidth: 80,
        textAlign: 'center',
        boxShadow: (theme) =>
          theme.palette.mode === 'dark'
            ? `0 8px 24px ${alpha('#000', 0.45)}`
            : `0 8px 24px ${alpha('#0F172A', 0.1)}`,
      }}
    >
      {title ? (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.25 }}>
          {title}
        </Typography>
      ) : null}
      {entries.map((entry) => {
        const seriesName = entry.name && entry.name !== 'value' ? entry.name : null;
        return (
          <Box key={String(entry.dataKey ?? entry.name)} sx={{ color: entry.color }}>
            {seriesName ? (
              <Typography variant="caption" color="text.secondary" display="block">
                {seriesName}
              </Typography>
            ) : null}
            <Typography variant="body2" fontWeight={700} display="block">
              {formatChartNumber(entry.value as number | string)}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

type LegendPayloadItem = {
  value?: string;
  color?: string;
  payload?: DashboardChartSlice & { fill?: string };
};

function ChartLegendContent({ payload }: { payload?: LegendPayloadItem[] }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  if (!payload?.length) return null;

  return (
    <Stack
      direction="row"
      useFlexGap
      flexWrap="wrap"
      justifyContent="center"
      sx={{ gap: 1, pt: 1.5, px: 0.5 }}
    >
      {payload.map((entry, index) => {
        const slice = entry.payload;
        const color =
          (slice?.key ? STATUS_COLORS[slice.key] : undefined) ??
          entry.color ??
          slice?.fill ??
          CHART_COLORS[index % CHART_COLORS.length];
        const label = entry.value ?? slice?.label ?? '';

        return (
          <Box
            key={`${label}-${index}`}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              px: 1.1,
              py: 0.45,
              borderRadius: 999,
              border: '1px solid',
              borderColor: alpha(color, isDark ? 0.35 : 0.22),
              bgcolor: alpha(color, isDark ? 0.14 : 0.08),
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: color,
                boxShadow: isDark ? `0 0 8px ${alpha(color, 0.55)}` : 'none',
                flexShrink: 0,
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: 'text.primary',
                fontWeight: 600,
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </Typography>
          </Box>
        );
      })}
    </Stack>
  );
}

function buildYAxisProps(textColor: string) {
  return {
    allowDecimals: false,
    width: 48,
    tickMargin: 12,
    tickLine: false,
    axisLine: false,
    tick: { fill: textColor, fontSize: 12 },
    tickFormatter: (value: number) => formatChartNumber(value),
  } as const;
}

function buildXAxisProps(textColor: string) {
  return {
    tickMargin: 10,
    tickLine: false,
    tick: { fill: textColor, fontSize: 12 },
  } as const;
}

function pieCellStroke(isDark: boolean) {
  return isDark ? alpha('#0B0F1A', 0.65) : '#FFFFFF';
}

export function VolunteerDashboardChartsSection({ charts }: { charts: DashboardCharts }) {
  const { t } = useTranslation('dashboard');
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const textColor = theme.palette.text.secondary;
  const applicationData = charts.my_application_status ?? [];
  const assignmentData = charts.my_assignment_status ?? [];

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2.5,
        gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' },
      }}
    >
      <ChartCard title={t('charts.myApplicationStatus')}>
        {applicationData.length === 0 ? (
          <EmptyChart label={t('charts.noData')} />
        ) : (
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={applicationData}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={92}
                paddingAngle={3}
                stroke={pieCellStroke(isDark)}
                strokeWidth={2}
              >
                {applicationData.map((entry, index) => (
                  <Cell key={entry.key} fill={colorForSlice(entry, index)} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltipContent />} />
              <Legend content={<ChartLegendContent />} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title={t('charts.myAssignmentStatus')}>
        {assignmentData.length === 0 ? (
          <EmptyChart label={t('charts.noData')} />
        ) : (
          <ResponsiveContainer>
            <BarChart data={assignmentData} margin={{ top: 8, right: 8, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(148,163,184,0.15)' : 'rgba(148,163,184,0.25)'} vertical={false} />
              <XAxis dataKey="label" {...buildXAxisProps(textColor)} />
              <YAxis {...buildYAxisProps(textColor)} />
              <Tooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {assignmentData.map((entry, index) => (
                  <Cell key={entry.key} fill={colorForSlice(entry, index)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </Box>
  );
}

export function CoordinatorDashboardChartsSection({ charts }: { charts: DashboardCharts }) {
  const { t } = useTranslation('dashboard');
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const gridColor = isDark ? 'rgba(148,163,184,0.15)' : 'rgba(148,163,184,0.25)';
  const textColor = theme.palette.text.secondary;

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2.5,
        gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' },
      }}
    >
      <ChartCard title={t('charts.missionStatusMine')}>
        {charts.mission_status.length === 0 ? (
          <EmptyChart label={t('charts.noData')} />
        ) : (
          <ResponsiveContainer>
            <BarChart data={charts.mission_status} margin={{ top: 8, right: 8, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="label" {...buildXAxisProps(textColor)} />
              <YAxis {...buildYAxisProps(textColor)} />
              <Tooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {charts.mission_status.map((entry, index) => (
                  <Cell key={entry.key} fill={colorForSlice(entry, index)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title={t('charts.missionApplicationStatusMine')}>
        {(charts.mission_application_status ?? []).length === 0 ? (
          <EmptyChart label={t('charts.noData')} />
        ) : (
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={charts.mission_application_status}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={92}
                paddingAngle={3}
                stroke={pieCellStroke(isDark)}
                strokeWidth={2}
              >
                {(charts.mission_application_status ?? []).map((entry, index) => (
                  <Cell key={entry.key} fill={colorForSlice(entry, index)} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltipContent />} />
              <Legend content={<ChartLegendContent />} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title={t('charts.assignmentStatusMine')}>
        {charts.assignment_status.length === 0 ? (
          <EmptyChart label={t('charts.noData')} />
        ) : (
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={charts.assignment_status}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={92}
                paddingAngle={2}
                stroke={pieCellStroke(isDark)}
                strokeWidth={2}
              >
                {charts.assignment_status.map((entry, index) => (
                  <Cell key={entry.key} fill={colorForSlice(entry, index)} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltipContent />} />
              <Legend content={<ChartLegendContent />} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard
        title={t('charts.activityTrendMine')}
        height={320}
        sx={{ gridColumn: { xs: '1', lg: '1 / -1' } }}
      >
        {charts.activity_trend.length === 0 ? (
          <EmptyChart label={t('charts.noData')} />
        ) : (
          <ResponsiveContainer>
            <LineChart data={charts.activity_trend} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey="date"
                tickFormatter={formatTrendDate}
                {...buildXAxisProps(textColor)}
                tick={{ fill: textColor, fontSize: 11 }}
              />
              <YAxis {...buildYAxisProps(textColor)} />
              <Tooltip
                content={(props) => (
                  <ChartTooltipContent
                    {...props}
                    labelFormatter={(value) => formatTrendDate(String(value))}
                  />
                )}
              />
              <Legend content={<ChartLegendContent />} />
              <Line
                type="monotone"
                dataKey="missions"
                name={t('legend.missions')}
                stroke="#818CF8"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </Box>
  );
}

export function DashboardChartsSection({ charts }: { charts: DashboardCharts }) {
  const { t } = useTranslation('dashboard');
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const gridColor = isDark ? 'rgba(148,163,184,0.15)' : 'rgba(148,163,184,0.25)';
  const textColor = theme.palette.text.secondary;

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2.5,
        gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' },
      }}
    >
      <ChartCard title={t('charts.disasterStatus')}>
        {charts.disaster_status.length === 0 ? (
          <EmptyChart label={t('charts.noData')} />
        ) : (
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={charts.disaster_status}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={92}
                paddingAngle={3}
                stroke={pieCellStroke(isDark)}
                strokeWidth={2}
              >
                {charts.disaster_status.map((entry, index) => (
                  <Cell key={entry.key} fill={colorForSlice(entry, index)} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltipContent />} />
              <Legend content={<ChartLegendContent />} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title={t('charts.missionStatus')}>
        {charts.mission_status.length === 0 ? (
          <EmptyChart label={t('charts.noData')} />
        ) : (
          <ResponsiveContainer>
            <BarChart data={charts.mission_status} margin={{ top: 8, right: 8, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="label" {...buildXAxisProps(textColor)} />
              <YAxis {...buildYAxisProps(textColor)} />
              <Tooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {charts.mission_status.map((entry, index) => (
                  <Cell key={entry.key} fill={colorForSlice(entry, index)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title={t('charts.missionApplicationStatus')}>
        {(charts.mission_application_status ?? []).length === 0 ? (
          <EmptyChart label={t('charts.noData')} />
        ) : (
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={charts.mission_application_status}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={92}
                paddingAngle={3}
                stroke={pieCellStroke(isDark)}
                strokeWidth={2}
              >
                {(charts.mission_application_status ?? []).map((entry, index) => (
                  <Cell key={entry.key} fill={colorForSlice(entry, index)} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltipContent />} />
              <Legend content={<ChartLegendContent />} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title={t('charts.assignmentStatus')}>
        {charts.assignment_status.length === 0 ? (
          <EmptyChart label={t('charts.noData')} />
        ) : (
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={charts.assignment_status}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={92}
                paddingAngle={2}
                stroke={pieCellStroke(isDark)}
                strokeWidth={2}
              >
                {charts.assignment_status.map((entry, index) => (
                  <Cell key={entry.key} fill={colorForSlice(entry, index)} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltipContent />} />
              <Legend content={<ChartLegendContent />} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title={t('charts.skillDistribution')} height={360}>
        {(charts.skill_distribution ?? []).length === 0 ? (
          <EmptyChart label={t('charts.noData')} />
        ) : (
          (() => {
            const topSkills = (charts.skill_distribution ?? [])
              .filter((s) => s.key !== 'other')
              .sort((a, b) => b.value - a.value)
              .slice(0, 7);
            const maxValue = Math.max(...topSkills.map((s) => s.value), 1);
            return (
              <Stack spacing={1.25} sx={{ height: '100%', justifyContent: 'center' }}>
                {topSkills.map((entry, index) => {
                  const color = CHART_COLORS[index % CHART_COLORS.length];
                  const widthPct = Math.max(8, Math.round((entry.value / maxValue) * 100));
                  return (
                    <Box key={entry.key}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="baseline"
                        spacing={1}
                        sx={{ mb: 0.45 }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          noWrap
                          title={entry.label}
                          sx={{ flex: 1, minWidth: 0 }}
                        >
                          {entry.label}
                        </Typography>
                        <Typography
                          variant="caption"
                          fontWeight={800}
                          color="text.secondary"
                          sx={{ flexShrink: 0 }}
                        >
                          {formatChartNumber(entry.value)}
                        </Typography>
                      </Stack>
                      <Box
                        sx={{
                          height: 10,
                          borderRadius: 99,
                          bgcolor: isDark ? 'rgba(148,163,184,0.16)' : 'rgba(226,232,240,0.95)',
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            width: `${widthPct}%`,
                            height: '100%',
                            borderRadius: 99,
                            background: `linear-gradient(90deg, ${color} 0%, ${color}cc 100%)`,
                            transition: 'width 0.35s ease',
                          }}
                        />
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            );
          })()
        )}
      </ChartCard>

      <ChartCard title={t('charts.genderDistribution')}>
        {(charts.gender_distribution ?? []).filter((s) => s.key !== 'other').length === 0 ? (
          <EmptyChart label={t('charts.noData')} />
        ) : (
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={(charts.gender_distribution ?? []).filter((s) => s.key !== 'other')}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={54}
                outerRadius={92}
                paddingAngle={3}
                stroke={pieCellStroke(isDark)}
                strokeWidth={2}
              >
                {(charts.gender_distribution ?? [])
                  .filter((s) => s.key !== 'other')
                  .map((entry, index) => (
                  <Cell key={entry.key} fill={colorForSlice(entry, index)} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltipContent />} />
              <Legend content={<ChartLegendContent />} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard
        title={t('charts.activityTrend')}
        height={320}
        sx={{ gridColumn: { xs: '1', lg: '1 / -1' } }}
      >
        {charts.activity_trend.length === 0 ? (
          <EmptyChart label={t('charts.noData')} />
        ) : (
          <ResponsiveContainer>
            <LineChart data={charts.activity_trend} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey="date"
                tickFormatter={formatTrendDate}
                {...buildXAxisProps(textColor)}
                tick={{ fill: textColor, fontSize: 11 }}
              />
              <YAxis {...buildYAxisProps(textColor)} />
              <Tooltip
                content={(props) => (
                  <ChartTooltipContent
                    {...props}
                    labelFormatter={(value) => formatTrendDate(String(value))}
                  />
                )}
              />
              <Legend content={<ChartLegendContent />} />
              <Line
                type="monotone"
                dataKey="missions"
                name={t('legend.missions')}
                stroke="#818CF8"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="disasters"
                name={t('legend.disasters')}
                stroke="#22D3EE"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </Box>
  );
}
