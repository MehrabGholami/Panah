# Domain Model

## Core Entities

- **User** — accounts (email, phone, is_approved)
- **Role / Permission** — dynamic RBAC
- **VolunteerProfile** — 1:1 with User, approval workflow
- **Skill / VolunteerSkill** — capabilities with proficiency
- **Disaster** — incident with severity and location
- **Mission** — linked to disaster, lifecycle states
- **Assignment** — volunteer-mission link with status
- **MissionReport** — post-mission documentation
- **Notification** — in-app and email notifications
- **AuditLog** — immutable change history

## Mission Status Flow

`draft` → `published` → `in_progress` → `completed` → `closed`

## Assignment Status Flow

`pending` → `accepted` | `declined` → `checked_in` → `completed`

## Volunteer Status Flow

`registered` → `pending_approval` → `active` | `rejected`
