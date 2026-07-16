import type { PaletteOptions } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface TypeBackground {
    elevated?: string;
  }

  interface Palette {
    background: TypeBackground;
  }

  interface PaletteOptions {
    background?: Partial<TypeBackground>;
  }
}

export type CustomPalette = PaletteOptions;
