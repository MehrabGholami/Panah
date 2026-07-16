import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';

export function PublicLayout() {
  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Outlet />
    </Box>
  );
}
