import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import ViewColumnOutlinedIcon from '@mui/icons-material/ViewColumnOutlined';
import {
  Alert,
  Box,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { GhostButton, GradientButton } from '@/shared/components/ui';
import {
  buildCsvContent,
  downloadCsv,
  type CsvColumn,
} from '@/shared/utils/csvExport';

interface ExportCsvDialogProps<T> {
  open: boolean;
  onClose: () => void;
  title: string;
  filename: string;
  columns: CsvColumn<T>[];
  fetchAllRows: () => Promise<T[]>;
  description?: string;
}

export function ExportCsvDialog<T>({
  open,
  onClose,
  title,
  filename,
  columns,
  fetchAllRows,
  description = 'ستون‌های موردنظر را انتخاب کنید. خروجی بر اساس فیلترهای فعلی ساخته می‌شود.',
}: ExportCsvDialogProps<T>) {
  const defaultKeys = useMemo(
    () => columns.filter((column) => column.defaultSelected !== false).map((column) => column.key),
    [columns],
  );
  const [selectedKeys, setSelectedKeys] = useState<string[]>(defaultKeys);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedKeys(defaultKeys);
      setError(null);
      setExporting(false);
    }
  }, [open, defaultKeys]);

  const toggleKey = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  };

  const handleExport = async () => {
    const selectedColumns = columns.filter((column) => selectedKeys.includes(column.key));
    if (selectedColumns.length === 0) {
      setError('حداقل یک ستون را انتخاب کنید.');
      return;
    }

    setExporting(true);
    setError(null);
    try {
      const rows = await fetchAllRows();
      const content = buildCsvContent(rows, selectedColumns);
      downloadCsv(filename, content);
      onClose();
    } catch {
      setError('خروجی CSV ایجاد نشد. دوباره تلاش کنید.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={exporting ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3.5 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'rgba(34, 211, 238, 0.12)',
              color: 'primary.main',
            }}
          >
            <ViewColumnOutlinedIcon />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {description}
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ pt: 1.5 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 1.25,
          }}
        >
          {columns.map((column) => {
            const selected = selectedKeys.includes(column.key);
            return (
              <Box
                key={column.key}
                onClick={() => !exporting && toggleKey(column.key)}
                sx={{
                  cursor: exporting ? 'default' : 'pointer',
                  p: 1.5,
                  borderRadius: 2.5,
                  border: 1,
                  borderColor: selected ? 'rgba(34, 211, 238, 0.45)' : 'divider',
                  bgcolor: selected ? 'rgba(34, 211, 238, 0.08)' : 'transparent',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: 'rgba(34, 211, 238, 0.4)',
                    bgcolor: 'rgba(34, 211, 238, 0.05)',
                  },
                }}
              >
                <FormControlLabel
                  sx={{ m: 0, width: '100%', pointerEvents: 'none' }}
                  control={<Checkbox checked={selected} size="small" sx={{ p: 0.5, ml: 0.5 }} />}
                  label={
                    <Typography variant="body2" fontWeight={700} sx={{ mr: 1 }}>
                      {column.label}
                    </Typography>
                  }
                />
              </Box>
            );
          })}
        </Box>
        {error && (
          <Alert severity="error" sx={{ mt: 2, borderRadius: 2.5 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <GhostButton onClick={onClose} disabled={exporting}>
          انصراف
        </GhostButton>
        <GradientButton
          startIcon={<FileDownloadOutlinedIcon />}
          onClick={() => void handleExport()}
          disabled={exporting || selectedKeys.length === 0}
        >
          {exporting ? 'در حال آماده‌سازی...' : 'دانلود CSV'}
        </GradientButton>
      </DialogActions>
    </Dialog>
  );
}
