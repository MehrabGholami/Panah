import { Autocomplete, Box, Chip, Stack, TextField, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { apiClient } from '@/shared/api/axios';
import { endpoints } from '@/shared/api/endpoints';
import type { PaginatedResponse, Skill } from '@/shared/types';
import { formatSkillCategory } from '@/shared/utils/formatSkillCategory';

interface SkillsMultiSelectProps {
  value?: Skill[];
  valueIds?: string[];
  onChange: (skills: Skill[]) => void;
  label: string;
  error?: boolean;
  helperText?: string;
  limitTags?: number;
  publicList?: boolean;
  enabled?: boolean;
}

export function SkillsMultiSelect({
  value,
  valueIds,
  onChange,
  label,
  error,
  helperText,
  limitTags = 3,
  publicList = false,
  enabled = true,
}: SkillsMultiSelectProps) {
  const { data: skillsData, isLoading } = useQuery({
    queryKey: ['skills', 'all', publicList ? 'public' : 'auth'],
    queryFn: async () => {
      const url = publicList
        ? `${endpoints.skills.public}?page_size=100`
        : `${endpoints.skills.list}?page_size=100`;
      const { data } = await apiClient.get<PaginatedResponse<Skill>>(url);
      return data;
    },
    enabled,
  });

  const skills = useMemo(
    () =>
      [...(skillsData?.results ?? [])].sort((a, b) => {
        const categoryCompare = (a.category ?? '').localeCompare(b.category ?? '', 'fa');
        if (categoryCompare !== 0) return categoryCompare;
        return a.name.localeCompare(b.name, 'fa');
      }),
    [skillsData?.results],
  );

  const selectedSkills = useMemo(() => {
    if (value?.length) return value;
    if (valueIds?.length) return skills.filter((skill) => valueIds.includes(skill.id));
    return [];
  }, [value, valueIds, skills]);

  return (
    <Autocomplete
      multiple
      disableCloseOnSelect
      limitTags={limitTags}
      size="small"
      loading={isLoading}
      options={skills}
      value={selectedSkills}
      onChange={(_, next) => onChange(next)}
      groupBy={(option) => formatSkillCategory(option.category)}
      getOptionLabel={(option) => option.name}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      renderOption={(props, option) => (
        <Box component="li" {...props} key={option.id}>
          <Stack>
            <Typography variant="body2" fontWeight={700}>
              {option.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatSkillCategory(option.category)}
            </Typography>
          </Stack>
        </Box>
      )}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => (
          <Chip
            {...getTagProps({ index })}
            key={option.id}
            label={option.name}
            size="small"
            color="primary"
            variant="outlined"
          />
        ))
      }
      renderInput={(params) => (
        <TextField {...params} label={label} error={error} helperText={helperText} />
      )}
    />
  );
}
