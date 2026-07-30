import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import PersonIcon from '@mui/icons-material/Person';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useAppSelector } from '@/app/store';
import { apiClient } from '@/shared/api/axios';
import { endpoints } from '@/shared/api/endpoints';
import { GlassCard, StatusChip } from '@/shared/components/ui';
import { usePermissions } from '@/shared/hooks/useAuth';
import type { CreateTicketReplyRequest, Ticket } from '@/shared/types';

function TicketMetaCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.25}
      sx={{
        flex: 1,
        minWidth: 220,
        p: 1.25,
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'rgba(148, 163, 184, 0.08)',
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: 1.5,
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'rgba(34, 211, 238, 0.14)',
          color: 'primary.main',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.2 }}>
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.35 }} noWrap>
          {value}
        </Typography>
      </Box>
    </Stack>
  );
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('tickets');
  const queryClient = useQueryClient();
  const { user } = useAppSelector((state) => state.auth);
  const { hasPermission, hasAnyRole } = usePermissions();
  const [replyBody, setReplyBody] = useState('');
  const [replyError, setReplyError] = useState<string | null>(null);

  const isStaff = hasAnyRole(['admin', 'coordinator']) || hasPermission('tickets.reply');

  const { data: ticket, isLoading, isError } = useQuery({
    queryKey: ['tickets', id],
    queryFn: async () => {
      const { data } = await apiClient.get<Ticket>(endpoints.tickets.detail(id!));
      return data;
    },
    enabled: Boolean(id),
  });

  const replyMutation = useMutation({
    mutationFn: async (payload: CreateTicketReplyRequest) => {
      const { data } = await apiClient.post<Ticket>(endpoints.tickets.replies(id!), payload);
      return data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['tickets', id], updated);
      void queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setReplyBody('');
      setReplyError(null);
    },
    onError: () => {
      setReplyError(t('actions.error', { ns: 'common' }));
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      const { data } = await apiClient.patch<Ticket>(endpoints.tickets.status(id!), { status });
      return data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['tickets', id], updated);
      void queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  const canReply =
    ticket &&
    ticket.status !== 'closed' &&
    (isStaff || ticket.author === user?.id);

  const createdAt = ticket ? new Date(ticket.created_at) : null;
  const createdDateLabel = createdAt ? createdAt.toLocaleDateString('fa-IR') : '—';
  const createdTimeLabel = createdAt
    ? createdAt.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    : '—';

  const handleReply = () => {
    if (!replyBody.trim()) {
      setReplyError(t('actions.error', { ns: 'common' }));
      return;
    }
    replyMutation.mutate({ body: replyBody.trim() });
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <IconButton component={RouterLink} to="/tickets" aria-label={t('actions.back', { ns: 'common' })}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" fontWeight={700}>
          {t('detail')}
        </Typography>
      </Stack>

      {isError && <Alert severity="error">{t('actions.error', { ns: 'common' })}</Alert>}

      {isLoading ? (
        <Typography>{t('actions.loading', { ns: 'common' })}</Typography>
      ) : ticket ? (
        <Stack spacing={3}>
          <GlassCard sx={{ p: { xs: 2, sm: 3 } }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', sm: 'flex-start' }}
              spacing={1.5}
              sx={{ mb: 2 }}
            >
              <Typography variant="h5" fontWeight={700} sx={{ wordBreak: 'break-word' }}>
                {ticket.title}
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                useFlexGap
                flexWrap="wrap"
                sx={{ flexShrink: 0 }}
              >
                {ticket.is_staff_message && (
                  <Chip
                    size="small"
                    color="primary"
                    variant="outlined"
                    label={t('badges.staffMessage')}
                    sx={{ fontWeight: 700 }}
                  />
                )}
                <StatusChip status={ticket.status} label={t(`status.${ticket.status}`)} />
              </Stack>
            </Stack>

            {!isStaff && ticket.is_staff_message && (
              <Alert severity="info" sx={{ mb: 2 }}>
                {t('messages.staffMessageHint')}
              </Alert>
            )}

            <Typography variant="body1" color="text.secondary" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
              {ticket.description}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25} useFlexGap flexWrap="wrap">
              {ticket.is_staff_message ? (
                <>
                  <TicketMetaCard
                    icon={<SupportAgentIcon fontSize="small" />}
                    label={t('fields.sender')}
                    value={ticket.opened_by_name ?? '—'}
                  />
                  <TicketMetaCard
                    icon={<BadgeOutlinedIcon fontSize="small" />}
                    label={t('fields.recipient')}
                    value={ticket.author_name ?? '—'}
                  />
                </>
              ) : (
                <TicketMetaCard
                  icon={<BadgeOutlinedIcon fontSize="small" />}
                  label={t('fields.author')}
                  value={ticket.author_name ?? '—'}
                />
              )}
              <TicketMetaCard
                icon={<EventOutlinedIcon fontSize="small" />}
                label={t('fields.createdAt')}
                value={createdDateLabel}
              />
              <TicketMetaCard
                icon={<AccessTimeOutlinedIcon fontSize="small" />}
                label={t('fields.createdTime')}
                value={createdTimeLabel}
              />
            </Stack>

            {isStaff && (
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                {ticket.status !== 'closed' ? (
                  <Button
                    variant="outlined"
                    color="warning"
                    size="small"
                    onClick={() => statusMutation.mutate('closed')}
                    disabled={statusMutation.isPending}
                  >
                    {t('actions.closeTicket')}
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={() => statusMutation.mutate('open')}
                    disabled={statusMutation.isPending}
                  >
                    {t('actions.reopenTicket')}
                  </Button>
                )}
              </Stack>
            )}
          </GlassCard>

          <GlassCard sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              {t('fields.reply')}
            </Typography>

            {ticket.replies && ticket.replies.length > 0 ? (
              <Stack spacing={2} sx={{ mb: 3 }}>
                {ticket.replies.map((reply) => (
                  <Box
                    key={reply.id}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: reply.is_staff_reply
                        ? 'rgba(34, 211, 238, 0.08)'
                        : 'rgba(100, 116, 139, 0.08)',
                      border: 1,
                      borderColor: 'divider',
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                      {reply.is_staff_reply ? (
                        <SupportAgentIcon fontSize="small" color="primary" />
                      ) : (
                        <PersonIcon fontSize="small" color="action" />
                      )}
                      <Typography variant="subtitle2" fontWeight={700}>
                        {reply.author_name ?? '—'}
                      </Typography>
                      {reply.is_staff_reply && (
                        <Chip
                          label={t('badges.support')}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      )}
                      <Typography variant="caption" color="text.secondary" sx={{ mr: 'auto' }}>
                        {new Date(reply.created_at).toLocaleString('fa-IR')}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {reply.body}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t('messages.noReplies')}
              </Typography>
            )}

            {ticket.status === 'closed' ? (
              <Alert severity="info">{t('messages.closedNotice')}</Alert>
            ) : canReply ? (
              <Stack spacing={2}>
                {replyError && <Alert severity="error">{replyError}</Alert>}
                <TextField
                  label={t('fields.reply')}
                  placeholder={t('fields.replyPlaceholder')}
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  fullWidth
                  multiline
                  minRows={3}
                />
                <Box>
                  <Button
                    variant="contained"
                    onClick={handleReply}
                    disabled={replyMutation.isPending}
                  >
                    {t('actions.sendReply')}
                  </Button>
                </Box>
              </Stack>
            ) : null}
          </GlassCard>
        </Stack>
      ) : null}
    </Box>
  );
}
