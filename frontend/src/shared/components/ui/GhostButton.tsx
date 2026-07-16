import { Button, type ButtonProps } from '@mui/material';

export function GhostButton({ children, ...props }: ButtonProps) {
  return (
    <Button variant="ghost" {...props}>
      {children}
    </Button>
  );
}
