import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { IconButton, InputAdornment, TextField, type TextFieldProps } from '@mui/material';
import { forwardRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

export const PasswordTextField = forwardRef<HTMLDivElement, TextFieldProps>(
  function PasswordTextField({ InputProps, type: _type, ...props }, ref) {
    const { t } = useTranslation('common');
    const [visible, setVisible] = useState(false);

    return (
      <TextField
        {...props}
        ref={ref}
        type={visible ? 'text' : 'password'}
        InputProps={{
          ...InputProps,
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label={visible ? t('actions.hidePassword') : t('actions.showPassword')}
                onClick={() => setVisible((prev) => !prev)}
                onMouseDown={(event) => event.preventDefault()}
                edge="end"
                size="small"
              >
                {visible ? (
                  <VisibilityOffOutlinedIcon fontSize="small" />
                ) : (
                  <VisibilityOutlinedIcon fontSize="small" />
                )}
              </IconButton>
              {InputProps?.endAdornment}
            </InputAdornment>
          ),
        }}
      />
    );
  },
);
