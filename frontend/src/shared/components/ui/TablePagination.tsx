import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FormatListBulletedOutlinedIcon from '@mui/icons-material/FormatListBulletedOutlined';
import { Box, Pagination, PaginationItem, Stack, Typography } from '@mui/material';
import { DEFAULT_PAGE_SIZE } from '@/shared/constants/pagination';
import { toPersianDigits } from '@/shared/utils/persianDigits';

interface TablePaginationProps {
  page: number;
  totalCount: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export function TablePagination({
  page,
  totalCount,
  pageSize = DEFAULT_PAGE_SIZE,
  onPageChange,
  disabled = false,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  if (totalCount === 0) {
    return null;
  }

  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);
  const progress = Math.min(100, Math.round((endItem / totalCount) * 100));

  return (
    <Box
      sx={{
        mt: 3,
        borderRadius: 4,
        border: 1,
        borderColor: (theme) =>
          theme.palette.mode === 'dark' ? 'rgba(148, 163, 184, 0.18)' : 'rgba(226, 232, 240, 0.95)',
        bgcolor: (theme) =>
          theme.palette.mode === 'dark' ? 'rgba(18, 24, 42, 0.55)' : '#fff',
        boxShadow: (theme) =>
          theme.palette.mode === 'dark'
            ? '0 8px 24px rgba(0, 0, 0, 0.22)'
            : '0 8px 24px rgba(15, 23, 42, 0.04)',
        px: { xs: 2, sm: 2.75 },
        pt: { xs: 2, sm: 2.25 },
        pb: { xs: 2, sm: 2.25 },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          height: 3,
          borderRadius: 99,
          bgcolor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(148, 163, 184, 0.16)' : 'rgba(226, 232, 240, 0.95)',
          overflow: 'hidden',
          mb: 2.25,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            insetBlock: 0,
            insetInlineStart: 0,
            width: `${progress}%`,
            borderRadius: 99,
            background: (theme) =>
              `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            transition: 'width 0.35s ease',
          }}
        />
      </Box>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        spacing={2.5}
      >
        <Stack direction="row" spacing={1.75} alignItems="center">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'rgba(34, 211, 238, 0.1)',
              color: 'primary.main',
              flexShrink: 0,
            }}
          >
            <FormatListBulletedOutlinedIcon fontSize="small" />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={0.85} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                نمایش
              </Typography>
              <Box
                sx={{
                  px: 1.15,
                  py: 0.35,
                  borderRadius: 99,
                  bgcolor: 'rgba(34, 211, 238, 0.12)',
                }}
              >
                <Typography
                  component="span"
                  variant="body2"
                  sx={{ fontWeight: 800, color: 'primary.main', lineHeight: 1.2 }}
                >
                  {toPersianDigits(startItem)}–{toPersianDigits(endItem)}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                از {toPersianDigits(totalCount)}
              </Typography>
            </Stack>

            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ display: 'block', mt: 0.6, fontWeight: 600 }}
            >
              صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)}
            </Typography>
          </Box>
        </Stack>

        {totalPages > 1 && (
          <Box
            sx={{
              px: { xs: 0.75, sm: 1.25 },
              py: 0.75,
              borderRadius: 99,
              border: 1,
              borderColor: 'rgba(34, 211, 238, 0.16)',
              bgcolor: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(11, 15, 26, 0.45)'
                  : 'rgba(248, 250, 252, 0.9)',
              alignSelf: { xs: 'center', sm: 'auto' },
            }}
          >
            <Pagination
              count={totalPages}
              page={page}
              disabled={disabled}
              onChange={(_, value) => onPageChange(value)}
              shape="rounded"
              siblingCount={1}
              boundaryCount={1}
              renderItem={(item) => (
                <PaginationItem
                  slots={{ previous: ChevronRightIcon, next: ChevronLeftIcon }}
                  {...item}
                />
              )}
              sx={{
                '& .MuiPagination-ul': {
                  flexWrap: 'nowrap',
                  gap: 0.35,
                },
                '& .MuiPaginationItem-root': {
                  fontWeight: 700,
                  minWidth: 36,
                  height: 36,
                  borderRadius: 2,
                  color: 'text.secondary',
                  transition: 'all 0.2s ease',
                },
                '& .MuiPaginationItem-root:hover': {
                  bgcolor: 'rgba(34, 211, 238, 0.12)',
                  color: 'primary.main',
                },
                '& .Mui-selected': {
                  color: 'primary.contrastText !important',
                  background: (theme) =>
                    `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%) !important`,
                  boxShadow: '0 6px 14px rgba(34, 211, 238, 0.22)',
                },
                '& .Mui-selected:hover': {
                  filter: 'brightness(1.05)',
                },
                '& .MuiPaginationItem-ellipsis': {
                  color: 'text.disabled',
                },
              }}
            />
          </Box>
        )}
      </Stack>
    </Box>
  );
}
