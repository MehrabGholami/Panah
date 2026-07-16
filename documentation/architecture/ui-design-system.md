# UI Design System

## Theme

- **Default:** Dark mode (`#0B0F1A` background)
- **Direction:** RTL (`fa`)
- **Font:** Vazirmatn

## Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `background.default` | `#0B0F1A` | Page background |
| `background.paper` | `#12182A` | Cards, elevated surfaces |
| `primary.main` | `#22D3EE` | Accent, links |
| Primary gradient | cyan → indigo → purple | CTA buttons |
| `success.main` | `#34D399` | Completed, approved |
| `warning.main` | `#FBBF24` | Pending, draft |
| `error.main` | `#F87171` | Critical, declined |

## Components

Located in `frontend/src/shared/components/ui/`:

- `GlowBackground` — ambient cyan/purple blobs
- `GlassAppBar` — blurred sticky navbar
- `GradientButton` — primary CTA with hover glow
- `GhostButton` — secondary actions
- `PillBadge` — capsule labels
- `FeatureChecklist` — hero feature list
- `GlassCard` — content containers
- `StatusChip` — workflow status indicators
- `ThemeToggle` — dark/light mode

## Layouts

- `PublicLayout` — landing page
- `AuthLayout` — login/register (centered card)
- `DashboardLayout` — sidebar right, top bar

## i18n

All strings via `react-i18next` in `frontend/src/i18n/locales/fa/`.
