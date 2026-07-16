import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { apiClient } from '@/shared/api/axios';
import { endpoints } from '@/shared/api/endpoints';
import type { CreateTicketRequest, Ticket } from '@/shared/types';

interface SendMessageDialogProps {
  open: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
}

export function SendMessageDialog({
  open,
  onClose,
  recipientId,
  recipientName,
}: SendMessageDialogProps) {
  const { t } = useTranslation(['users', 'tickets', 'common']);
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [createdTicketId, setCreatedTicketId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle('');
    setDescription('');
    setError(null);
    setCreatedTicketId(null);
  }, [open, recipientId]);

  const sendMutation = useMutation({
    mutationFn: async (payload: CreateTicketRequest) => {
      const { data } = await apiClient.post<Ticket>(endpoints.tickets.list, payload);
      return data;
    },
    onSuccess: (ticket) => {
      void queryClient.invalidateQueries({ queryKey: ['tickets'] });
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setCreatedTicketId(ticket.id);
    },
    onError: () => {
      setError(t('actions.error', { ns: 'common' }));
    },
  });

  const handleClose = () => {
    if (!sendMutation.isPending) {
      onClose();
    }
  };

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) {
      setError(t('message.required', { ns: 'users' }));
      return;
    }
    sendMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      recipient_id: recipientId,
    });
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('message.title', { ns: 'users' })}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {createdTicketId ? (
            <Alert
              severity="success"
              action={
                <Button
                  component={RouterLink}
                  to={`/tickets/${createdTicketId}`}
                  color="inherit"
                  size="small"
                  onClick={onClose}
                >
                  {t('message.openConversation', { ns: 'users' })}
                </Button>
              }
            >
              {t('message.success', { ns: 'users', name: recipientName })}
            </Alert>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary">
                {t('message.to', { ns: 'users', name: recipientName })}
              </Typography>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                label={t('fields.title', { ns: 'tickets' })}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
                required
                autoFocus
              />
              <TextField
                label={t('message.body', { ns: 'users' })}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                required
                multiline
                minRows={4}
                placeholder={t('message.bodyPlaceholder', { ns: 'users' })}
              />
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={sendMutation.isPending}>
          {createdTicketId
            ? t('actions.back', { ns: 'common' })
            : t('actions.cancel', { ns: 'common' })}
        </Button>
        {!createdTicketId && (
          <Button
            variant="contained"
            startIcon={<SendOutlinedIcon />}
            onClick={handleSubmit}
            disabled={sendMutation.isPending}
          >
            {t('actions.sendMessage', { ns: 'users' })}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
