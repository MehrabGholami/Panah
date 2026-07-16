import { Button, type ButtonProps } from '@mui/material';

export function GradientButton({ children, ...props }: ButtonProps) {
  return (
    <Button variant="gradient" {...props}>
      {children}
    </Button>
  );
}
