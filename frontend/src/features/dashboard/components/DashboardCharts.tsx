import { Box, Typography, useTheme } from '@mui/material';
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
import type { DashboardCharts } from '@/shared/types';
import { toPersianDigits } from '@/shared/utils/persianDigits';

const CHART_COLORS = ['#22D3EE', '#818CF8', '#34D399', '#FBBF24', '#F87171', '#FB923C', '#A78BFA'];

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

export function VolunteerDashboardChartsSection({ charts }: { charts: DashboardCharts }) {
  const { t } = useTranslation('dashboard');
  const theme = useTheme();
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
              >
                {applicationData.map((entry, index) => (
                  <Cell key={entry.key} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatChartNumber(value)} />
              <Legend />
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
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.15)' : 'rgba(148,163,184,0.25)'} vertical={false} />
              <XAxis dataKey="label" {...buildXAxisProps(textColor)} />
              <YAxis {...buildYAxisProps(textColor)} />
              <Tooltip formatter={(value: number) => formatChartNumber(value)} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {assignmentData.map((entry, index) => (
                  <Cell key={entry.key} fill={CHART_COLORS[index % CHART_COLORS.length]} />
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
  const gridColor = theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.15)' : 'rgba(148,163,184,0.25)';
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
              <Tooltip formatter={(value: number) => formatChartNumber(value)} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {charts.mission_status.map((entry, index) => (
                  <Cell key={entry.key} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
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
              >
                {charts.assignment_status.map((entry, index) => (
                  <Cell key={entry.key} fill={CHART_COLORS[(index + 2) % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatChartNumber(value)} />
              <Legend />
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
                labelFormatter={(value: string | number) => formatTrendDate(String(value))}
                formatter={(value: number) => formatChartNumber(value)}
              />
              <Legend />
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
  const gridColor = theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.15)' : 'rgba(148,163,184,0.25)';
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
              >
                {charts.disaster_status.map((entry, index) => (
                  <Cell key={entry.key} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatChartNumber(value)} />
              <Legend />
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
              <Tooltip formatter={(value: number) => formatChartNumber(value)} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {charts.mission_status.map((entry, index) => (
                  <Cell key={entry.key} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title={t('charts.volunteerPipeline')}>
        {charts.volunteer_pipeline.length === 0 ? (
          <EmptyChart label={t('charts.noData')} />
        ) : (
          <ResponsiveContainer>
            <BarChart data={charts.volunteer_pipeline} margin={{ top: 8, right: 8, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="label" {...buildXAxisProps(textColor)} />
              <YAxis {...buildYAxisProps(textColor)} />
              <Tooltip formatter={(value: number) => formatChartNumber(value)} />
              <Bar dataKey="value" fill="#34D399" radius={[8, 8, 0, 0]} />
            </BarChart>
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
              >
                {charts.assignment_status.map((entry, index) => (
                  <Cell key={entry.key} fill={CHART_COLORS[(index + 2) % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatChartNumber(value)} />
              <Legend />
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
                labelFormatter={(value: string | number) => formatTrendDate(String(value))}
                formatter={(value: number) => formatChartNumber(value)}
              />
              <Legend />
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
