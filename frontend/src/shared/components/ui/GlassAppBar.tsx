import { AppBar, Toolbar, type AppBarProps } from '@mui/material';

export function GlassAppBar({ children, ...props }: AppBarProps) {
  return (
    <AppBar position="sticky" color="transparent" elevation={0} {...props}>
      <Toolbar sx={{ gap: 2, minHeight: { xs: 64, md: 72 } }}>{children}</Toolbar>
    </AppBar>
  );
}
