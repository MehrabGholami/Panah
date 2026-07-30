import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/shared/api/axios';
import { endpoints } from '@/shared/api/endpoints';
import { GhostButton, GradientButton, StatusChip } from '@/shared/components/ui';
import { tableHeadSx } from '@/shared/styles/tableHeader';
import type { AssignmentTask, AssignmentTaskStatus } from '@/shared/types';
import { getApiErrorMessage } from '@/shared/utils/getApiErrorMessage';
import { toPersianDigits } from '@/shared/utils/persianDigits';

type Mode = 'manage' | 'report';

interface AssignmentTasksDialogProps {
  open: boolean;
  onClose: () => void;
  assignmentId: string | null;
  volunteerLabel?: string;
  mode: Mode;
}

const TASK_STATUS_CHIP: Record<AssignmentTaskStatus, string> = {
  not_done: 'rejected',
  in_progress: 'pending',
  done: 'approved',
};

const STATUS_ORDER: AssignmentTaskStatus[] = ['not_done', 'in_progress', 'done'];

export function AssignmentTasksDialog({
  open,
  onClose,
  assignmentId,
  volunteerLabel,
  mode,
}: AssignmentTasksDialogProps) {
  const { t } = useTranslation('missions');
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );
  const [draftStatuses, setDraftStatuses] = useState<Record<string, AssignmentTaskStatus>>({});

  useEffect(() => {
    if (!open) {
      setTitle('');
      setDescription('');
      setEditingId(null);
      setFeedback(null);
      setDraftStatuses({});
    }
  }, [open]);

  const { data: tasks = [], isLoading, isError } = useQuery({
    queryKey: ['assignments', assignmentId, 'tasks'],
    queryFn: async () => {
      const { data } = await apiClient.get<AssignmentTask[]>(
        endpoints.assignments.tasks(assignmentId!),
      );
      return data;
    },
    enabled: open && Boolean(assignmentId),
  });

  useEffect(() => {
    if (!open || isLoading) return;
    const next: Record<string, AssignmentTaskStatus> = {};
    for (const task of tasks) {
      next[task.id] = task.status;
    }
    setDraftStatuses(next);
  }, [open, isLoading, tasks]);

  const counts = useMemo(() => {
    const result = { total: tasks.length, done: 0, in_progress: 0, not_done: 0 };
    for (const task of tasks) {
      const status = draftStatuses[task.id] ?? task.status;
      if (status === 'done') result.done += 1;
      else if (status === 'in_progress') result.in_progress += 1;
      else result.not_done += 1;
    }
    return result;
  }, [tasks, draftStatuses]);

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['assignments', assignmentId, 'tasks'] }),
      queryClient.invalidateQueries({ queryKey: ['assignments'] }),
      queryClient.invalidateQueries({ queryKey: ['missions'] }),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post(endpoints.assignments.tasks(assignmentId!), {
        title: title.trim(),
        description: description.trim(),
      });
    },
    onSuccess: async () => {
      setTitle('');
      setDescription('');
      setFeedback({ type: 'success', text: t('tasks.createSuccess') });
      await invalidate();
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        text: getApiErrorMessage(error, t('tasks.error')),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) return;
      await apiClient.patch(endpoints.assignments.taskDetail(editingId), {
        title: title.trim(),
        description: description.trim(),
      });
    },
    onSuccess: async () => {
      setEditingId(null);
      setTitle('');
      setDescription('');
      setFeedback({ type: 'success', text: t('tasks.updateSuccess') });
      await invalidate();
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        text: getApiErrorMessage(error, t('tasks.error')),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (taskId: string) => {
      await apiClient.delete(endpoints.assignments.taskDetail(taskId));
    },
    onSuccess: async () => {
      setFeedback({ type: 'success', text: t('tasks.deleteSuccess') });
      await invalidate();
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        text: getApiErrorMessage(error, t('tasks.error')),
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (updates: Array<{ taskId: string; status: AssignmentTaskStatus }>) => {
      await Promise.all(
        updates.map(({ taskId, status }) =>
          apiClient.patch(endpoints.assignments.taskStatus(taskId), { status }),
        ),
      );
    },
    onSuccess: async () => {
      setFeedback({ type: 'success', text: t('tasks.statusSuccess') });
      await invalidate();
      onClose();
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        text: getApiErrorMessage(error, t('tasks.error')),
      });
    },
  });

  const handleSaveStatuses = () => {
    const updates = tasks
      .map((task) => ({
        taskId: task.id,
        status: draftStatuses[task.id] ?? task.status,
      }))
      .filter((item) => {
        const original = tasks.find((task) => task.id === item.taskId)?.status;
        return original !== item.status;
      });

    if (updates.length === 0) {
      onClose();
      return;
    }
    statusMutation.mutate(updates);
  };

  const startEdit = (task: AssignmentTask) => {
    setEditingId(task.id);
    setTitle(task.title);
    setDescription(task.description || '');
    setFeedback(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
  };

  const submitForm = () => {
    if (!title.trim()) return;
    if (editingId) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const busy =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    statusMutation.isPending;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          m: { xs: 1.5, sm: 2 },
          width: { xs: 'calc(100% - 24px)', sm: undefined },
          backgroundImage: (theme) =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(165deg, rgba(34,211,238,0.08) 0%, rgba(15,23,42,0.98) 42%)'
              : 'linear-gradient(165deg, rgba(224,242,254,0.95) 0%, #FFFFFF 38%)',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 28px 80px rgba(0,0,0,0.5)'
              : '0 28px 80px rgba(15,23,42,0.16)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 1.5,
          pb: 1.5,
          pt: 2.25,
          px: { xs: 2, sm: 2.75 },
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              bgcolor: (theme) =>
                theme.palette.mode === 'dark' ? 'rgba(34,211,238,0.14)' : 'rgba(8,145,178,0.1)',
              border: '1px solid',
              borderColor: (theme) =>
                theme.palette.mode === 'dark' ? 'rgba(34,211,238,0.35)' : 'rgba(8,145,178,0.22)',
              color: 'primary.main',
            }}
          >
            <TaskAltOutlinedIcon fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.3 }}>
              {mode === 'manage' ? t('tasks.manageTitle') : t('tasks.viewTitle')}
            </Typography>
            {volunteerLabel ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }} noWrap>
                {volunteerLabel}
              </Typography>
            ) : null}
          </Box>
        </Stack>
        <IconButton
          aria-label={t('tasks.cancel')}
          onClick={onClose}
          size="small"
          sx={{
            mt: -0.25,
            border: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          px: { xs: 2, sm: 2.75 },
          py: 2,
          borderColor: 'divider',
          bgcolor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(2,6,23,0.2)' : 'rgba(248,250,252,0.65)',
        }}
      >
        <Stack spacing={2}>
          {feedback && (
            <Alert severity={feedback.type} onClose={() => setFeedback(null)}>
              {feedback.text}
            </Alert>
          )}
          {(isError || isLoading) && (
            <Alert severity={isError ? 'error' : 'info'}>
              {isError ? t('tasks.error') : t('actions.loading', { ns: 'common' })}
            </Alert>
          )}

          {!isLoading && !isError && counts.total > 0 && (
            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
              <Chip
                size="small"
                label={`${t('tasks.status')}: ${toPersianDigits(counts.total)}`}
                sx={{ fontWeight: 700 }}
              />
              <Chip
                size="small"
                color="success"
                label={`${t('tasks.statuses.done')}: ${toPersianDigits(counts.done)}`}
                sx={{ fontWeight: 700 }}
              />
              <Chip
                size="small"
                color="info"
                label={`${t('tasks.statuses.in_progress')}: ${toPersianDigits(counts.in_progress)}`}
                sx={{ fontWeight: 700 }}
              />
              <Chip
                size="small"
                label={`${t('tasks.statuses.not_done')}: ${toPersianDigits(counts.not_done)}`}
                sx={{ fontWeight: 700 }}
              />
            </Stack>
          )}

          {mode === 'manage' && (
            <Box
              sx={{
                p: 2,
                borderRadius: 2.5,
                border: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper',
                boxShadow: (theme) =>
                  theme.palette.mode === 'dark' ? 'none' : '0 8px 24px rgba(15,23,42,0.04)',
              }}
            >
              <Stack spacing={1.5}>
                <TextField
                  size="small"
                  label={t('tasks.title')}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  fullWidth
                />
                <TextField
                  size="small"
                  label={t('tasks.description')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  fullWidth
                  multiline
                  minRows={2}
                />
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  {editingId && (
                    <GhostButton size="small" onClick={cancelEdit} disabled={busy}>
                      {t('tasks.cancel')}
                    </GhostButton>
                  )}
                  <GradientButton
                    size="small"
                    onClick={submitForm}
                    disabled={busy || !title.trim()}
                  >
                    {editingId ? t('tasks.save') : t('tasks.add')}
                  </GradientButton>
                </Stack>
              </Stack>
            </Box>
          )}

          {mode === 'report' ? (
            !isLoading && tasks.length === 0 ? (
              <Box
                sx={{
                  py: 5,
                  px: 2,
                  textAlign: 'center',
                  borderRadius: 2.5,
                  border: '1px dashed',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {t('tasks.empty')}
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.25}>
                {tasks.map((task) => (
                  <Box
                    key={task.id}
                    sx={{
                      p: { xs: 1.5, sm: 1.75 },
                      borderRadius: 2.5,
                      border: 1,
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                      boxShadow: (theme) =>
                        theme.palette.mode === 'dark'
                          ? 'inset 0 1px 0 rgba(255,255,255,0.04)'
                          : '0 6px 18px rgba(15,23,42,0.04)',
                    }}
                  >
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1.5}
                      alignItems={{ xs: 'stretch', sm: 'center' }}
                      justifyContent="space-between"
                    >
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="subtitle2" fontWeight={800} sx={{ lineHeight: 1.4 }}>
                          {task.title}
                        </Typography>
                        {task.description ? (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.4, lineHeight: 1.6 }}
                          >
                            {task.description}
                          </Typography>
                        ) : null}
                      </Box>
                      <TextField
                        select
                        size="small"
                        label={t('tasks.status')}
                        value={draftStatuses[task.id] ?? task.status}
                        disabled={busy}
                        onChange={(e) =>
                          setDraftStatuses((prev) => ({
                            ...prev,
                            [task.id]: e.target.value as AssignmentTaskStatus,
                          }))
                        }
                        sx={{
                          minWidth: { xs: '100%', sm: 168 },
                          flexShrink: 0,
                          bgcolor: 'action.hover',
                          borderRadius: 1.5,
                        }}
                      >
                        {STATUS_ORDER.map((status) => (
                          <MenuItem key={status} value={status}>
                            {t(`tasks.statuses.${status}`)}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )
          ) : (
            <TableContainer
              sx={{
                borderRadius: 2.5,
                border: 1,
                borderColor: 'divider',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                bgcolor: 'background.paper',
              }}
            >
              <Table size="small" sx={{ minWidth: 520 }}>
                <TableHead sx={tableHeadSx}>
                  <TableRow>
                    <TableCell>{t('tasks.title')}</TableCell>
                    <TableCell>{t('tasks.description')}</TableCell>
                    <TableCell>{t('tasks.status')}</TableCell>
                    <TableCell align="left">{t('table.actions', { ns: 'common' })}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {!isLoading && tasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                        {t('tasks.empty')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    tasks.map((task) => (
                      <TableRow key={task.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700}>
                            {task.title}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 240 }}>
                          <Typography variant="body2" color="text.secondary">
                            {task.description || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <StatusChip
                            status={TASK_STATUS_CHIP[task.status]}
                            label={t(`tasks.statuses.${task.status}`)}
                          />
                        </TableCell>
                        <TableCell align="left">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <IconButton
                              size="small"
                              aria-label={t('tasks.edit')}
                              disabled={busy}
                              onClick={() => startEdit(task)}
                            >
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              aria-label={t('tasks.delete')}
                              disabled={busy}
                              onClick={() => deleteMutation.mutate(task.id)}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2, sm: 2.75 },
          py: 1.75,
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
          gap: 1,
        }}
      >
        <GhostButton onClick={onClose} disabled={busy}>
          {t('tasks.cancel')}
        </GhostButton>
        {mode === 'report' && (
          <GradientButton
            onClick={handleSaveStatuses}
            disabled={busy || isLoading || isError || tasks.length === 0}
          >
            {statusMutation.isPending ? t('actions.loading', { ns: 'common' }) : t('tasks.save')}
          </GradientButton>
        )}
      </DialogActions>
    </Dialog>
  );
}
