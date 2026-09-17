import AddIcon from '@mui/icons-material/Add';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import MailOutlineOutlinedIcon from '@mui/icons-material/MailOutlineOutlined';
import {
  Alert,
  Box,
  Button,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { apiClient } from '@/shared/api/axios';
import { endpoints } from '@/shared/api/endpoints';
import { GlassCard, StatusChip } from '@/shared/components/ui';
import { usePermissions } from '@/shared/hooks/useAuth';
import { tableHeadSx } from '@/shared/styles/tableHeader';
import type { PaginatedResponse, Ticket } from '@/shared/types';
import { toPersianDigits } from '@/shared/utils/persianDigits';
import { CreateTicketDialog } from './CreateTicketDialog';

type TicketsTab = 'messages' | 'tickets';

function SectionStat({
  icon,
  label,
  count,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  accent: string;
}) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="center">
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2,
          display: 'grid',
          placeItems: 'center',
          bgcolor: accent,
          color: 'primary.main',
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary" fontWeight={700}>
          {label}
        </Typography>
        <Typography variant="h6" fontWeight={800} lineHeight={1.2}>
          {toPersianDigits(count)}
        </Typography>
      </Box>
    </Stack>
  );
}

export default function TicketsPage() {
  const { t } = useTranslation('tickets');
  const { hasAnyRole } = usePermissions();
  const isStaff = hasAnyRole(['admin', 'coordinator']);
  const [createOpen, setCreateOpen] = useState(false);
  const [tab, setTab] = useState<TicketsTab>(isStaff ? 'messages' : 'tickets');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tickets'],
    queryFn: async () => {
      const { data: response } = await apiClient.get<PaginatedResponse<Ticket>>(
        endpoints.tickets.list,
      );
      return response;
    },
  });

  const allItems = data?.results ?? [];

  const { messages, tickets } = useMemo(() => {
    const messageItems: Ticket[] = [];
    const ticketItems: Ticket[] = [];
    for (const item of allItems) {
      if (item.is_staff_message) messageItems.push(item);
      else ticketItems.push(item);
    }
    return { messages: messageItems, tickets: ticketItems };
  }, [allItems]);

  const activeItems = tab === 'messages' ? messages : tickets;
  const isMessagesTab = tab === 'messages';

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={1.5}
        sx={{ mb: 2.5 }}
        data-tour="page-tickets-header"
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'rgba(34, 211, 238, 0.12)',
              color: 'primary.main',
            }}
          >
            <ForumOutlinedIcon />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={800}>
              {t('title')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('subtitle')}
            </Typography>
          </Box>
        </Stack>
        {!isStaff && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
            sx={{ alignSelf: { xs: 'stretch', sm: 'center' }, borderRadius: 2, fontWeight: 700 }}
          >
            {t('create')}
          </Button>
        )}
      </Stack>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t('actions.error', { ns: 'common' })}
        </Alert>
      )}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2.5 }}>
        <GlassCard sx={{ p: 2, flex: 1 }}>
          <SectionStat
            icon={<MailOutlineOutlinedIcon fontSize="small" />}
            label={t('tabs.messages')}
            count={messages.length}
            accent="rgba(13, 148, 136, 0.12)"
          />
        </GlassCard>
        <GlassCard sx={{ p: 2, flex: 1 }}>
          <SectionStat
            icon={<ConfirmationNumberOutlinedIcon fontSize="small" />}
            label={t('tabs.tickets')}
            count={tickets.length}
            accent="rgba(79, 70, 229, 0.12)"
          />
        </GlassCard>
      </Stack>

      <GlassCard sx={{ p: 0, overflow: 'hidden' }}>
        <Box
          sx={{
            px: { xs: 1.5, md: 2 },
            pt: 1.25,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(15, 23, 42, 0.28)'
                : 'rgba(248, 250, 252, 0.9)',
          }}
        >
          <Tabs
            value={tab}
            onChange={(_, value: TicketsTab) => setTab(value)}
            sx={{
              minHeight: 48,
              '& .MuiTab-root': {
                minHeight: 48,
                fontWeight: 800,
                textTransform: 'none',
                fontSize: '0.95rem',
              },
            }}
          >
            <Tab
              value="messages"
              icon={<MailOutlineOutlinedIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              label={`${t('tabs.messages')} (${toPersianDigits(messages.length)})`}
            />
            <Tab
              value="tickets"
              icon={<ConfirmationNumberOutlinedIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              label={`${t('tabs.tickets')} (${toPersianDigits(tickets.length)})`}
            />
          </Tabs>
        </Box>

        <Box sx={{ px: { xs: 2, md: 2.5 }, pt: 2, pb: 1 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={600}>
            {isMessagesTab ? t('sections.messagesHint') : t('sections.ticketsHint')}
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead sx={tableHeadSx}>
              <TableRow>
                <TableCell>{t('fields.title')}</TableCell>
                <TableCell>
                  {isMessagesTab
                    ? isStaff
                      ? t('fields.recipient')
                      : t('fields.sender')
                    : t('fields.author')}
                </TableCell>
                <TableCell>{t('fields.status')}</TableCell>
                <TableCell>{t('fields.createdAt')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                    {t('actions.loading', { ns: 'common' })}
                  </TableCell>
                </TableRow>
              ) : activeItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                    <Stack alignItems="center" spacing={1.25}>
                      <Box
                        sx={{
                          width: 52,
                          height: 52,
                          borderRadius: '50%',
                          display: 'grid',
                          placeItems: 'center',
                          bgcolor: isMessagesTab
                            ? 'rgba(13, 148, 136, 0.1)'
                            : 'rgba(79, 70, 229, 0.1)',
                          color: isMessagesTab ? '#0d9488' : '#4f46e5',
                        }}
                      >
                        {isMessagesTab ? (
                          <MailOutlineOutlinedIcon />
                        ) : (
                          <ConfirmationNumberOutlinedIcon />
                        )}
                      </Box>
                      <Typography fontWeight={800}>
                        {isMessagesTab ? t('empty.messages') : t('empty.tickets')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {isMessagesTab ? t('empty.messagesHint') : t('empty.ticketsHint')}
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : (
                activeItems.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    hover
                    component={RouterLink}
                    to={`/tickets/${ticket.id}`}
                    sx={{ textDecoration: 'none', cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>
                        {ticket.title}
                      </Typography>
                      {ticket.reply_count != null && ticket.reply_count > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          {t('fields.replyCount', {
                            count: toPersianDigits(ticket.reply_count),
                          })}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {isMessagesTab ? (
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {isStaff
                              ? (ticket.author_name ?? '—')
                              : (ticket.opened_by_name ?? t('badges.support'))}
                          </Typography>
                          {isStaff && ticket.opened_by_name && (
                            <Typography variant="caption" color="text.secondary">
                              {t('fields.sender')}: {ticket.opened_by_name}
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <Typography variant="body2">
                          {ticket.author_name ?? '—'}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusChip
                        status={ticket.status}
                        label={t(`status.${ticket.status}`)}
                      />
                    </TableCell>
                    <TableCell>
                      {toPersianDigits(
                        new Date(ticket.created_at).toLocaleDateString('fa-IR'),
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </GlassCard>

      <CreateTicketDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </Box>
  );
}
