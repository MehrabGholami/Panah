const SKILL_CATEGORY_LABELS: Record<string, string> = {
  general: 'عمومی',
};

export function formatSkillCategory(category?: string | null): string {
  if (!category?.trim()) return 'سایر';
  return SKILL_CATEGORY_LABELS[category] ?? category;
}
