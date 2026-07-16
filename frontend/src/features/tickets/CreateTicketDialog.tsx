import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/shared/api/axios';
import { endpoints } from '@/shared/api/endpoints';
import type { CreateTicketRequest, Ticket } from '@/shared/types';

interface CreateTicketDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreateTicketDialog({ open, onClose }: CreateTicketDialogProps) {
  const { t } = useTranslation('tickets');
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setError(null);
  };

  const createMutation = useMutation({
    mutationFn: async (payload: CreateTicketRequest) => {
      const { data } = await apiClient.post<Ticket>(endpoints.tickets.list, payload);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tickets'] });
      resetForm();
      onClose();
    },
    onError: () => {
      setError(t('actions.error', { ns: 'common' }));
    },
  });

  const handleClose = () => {
    if (!createMutation.isPending) {
      resetForm();
      onClose();
    }
  };

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) {
      setError(t('actions.error', { ns: 'common' }));
      return;
    }
    createMutation.mutate({ title: title.trim(), description: description.trim() });
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('create')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label={t('fields.title')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            autoFocus
          />
          <TextField
            label={t('fields.description')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            required
            multiline
            minRows={4}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={createMutation.isPending}>
          {t('actions.cancel', { ns: 'common' })}
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={createMutation.isPending}
        >
          {t('actions.create', { ns: 'common' })}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
