import { Avatar, type AvatarProps } from '@mui/material';
import { resolveMediaUrl } from '@/shared/utils/media';

interface UserAvatarProps extends AvatarProps {
  name?: string;
  src?: string | null;
  cacheKey?: string | number;
}

export function UserAvatar({ name, src, cacheKey, sx, ...props }: UserAvatarProps) {
  const initial = name?.trim()?.[0]?.toUpperCase() ?? 'U';
  const resolvedSrc = resolveMediaUrl(src, cacheKey);

  return (
    <Avatar src={resolvedSrc} sx={sx} {...props}>
      {initial}
    </Avatar>
  );
}
