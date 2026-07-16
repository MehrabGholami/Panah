import {
  Alert,
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/shared/api/axios';
import { endpoints } from '@/shared/api/endpoints';
import { GhostButton, GlassCard, GradientButton, StatusChip } from '@/shared/components/ui';
import type { Assignment, PaginatedResponse } from '@/shared/types';

export default function MyMissionsPage() {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['assignments', 'my'],
    queryFn: async () => {
      const { data: response } = await apiClient.get<PaginatedResponse<Assignment>>(
        endpoints.assignments.my,
      );
      return response;
    },
    refetchInterval: 30_000,
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient.post(endpoints.assignments.accept(id), null, {
        headers: { 'Idempotency-Key': `accept-${id}` },
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['assignments'] }),
  });

  const declineMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient.post(endpoints.assignments.decline(id), null, {
        headers: { 'Idempotency-Key': `decline-${id}` },
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['assignments'] }),
  });

  const assignments = data?.results ?? [];

  const statusLabels: Record<string, string> = {
    pending: 'در انتظار پاسخ',
    accepted: 'پذیرفته‌شده',
    declined: 'رد‌شده',
    completed: 'تکمیل‌شده',
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        {t('nav.myMissions')}
      </Typography>

      {isError && <Alert severity="error">{t('actions.error')}</Alert>}

      <GlassCard>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>مأموریت</TableCell>
                <TableCell>{t('table.status')}</TableCell>
                <TableCell>تاریخ انتساب</TableCell>
                <TableCell align="left">{t('table.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    {t('actions.loading')}
                  </TableCell>
                </TableRow>
              ) : assignments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    {t('actions.noData')}
                  </TableCell>
                </TableRow>
              ) : (
                assignments.map((assignment) => (
                  <TableRow key={assignment.id} hover>
                    <TableCell>{assignment.mission_title ?? assignment.mission}</TableCell>
                    <TableCell>
                      <StatusChip
                        status={assignment.status}
                        label={statusLabels[assignment.status] ?? assignment.status}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(assignment.created_at).toLocaleDateString('fa-IR')}
                    </TableCell>
                    <TableCell align="left">
                      {assignment.status === 'pending' && (
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <GradientButton
                            size="small"
                            onClick={() => acceptMutation.mutate(assignment.id)}
                            disabled={acceptMutation.isPending}
                          >
                            {t('actions.accept')}
                          </GradientButton>
                          <GhostButton
                            size="small"
                            onClick={() => declineMutation.mutate(assignment.id)}
                            disabled={declineMutation.isPending}
                          >
                            {t('actions.decline')}
                          </GhostButton>
                        </Stack>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </GlassCard>
    </Box>
  );
}
