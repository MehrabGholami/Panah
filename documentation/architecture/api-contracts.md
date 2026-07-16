# API Contracts

Base URL: `/api/v1/`

## Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/login/` | No | Login, returns JWT |
| POST | `/auth/logout/` | Yes | Blacklist refresh token |
| POST | `/auth/refresh/` | No | Refresh access token |
| GET | `/auth/me/` | Yes | Current user profile |

## Volunteers

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/volunteers/register/` | Public | Register volunteer |
| GET | `/volunteers/` | volunteers.view | List volunteers |
| POST | `/volunteers/{id}/approve/` | volunteers.approve | Approve volunteer |
| POST | `/volunteers/{id}/reject/` | volunteers.approve | Reject volunteer |

## Missions

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET/POST | `/missions/` | missions.view/create | List/create missions |
| POST | `/missions/{id}/publish/` | missions.create | Publish mission |
| POST | `/missions/{id}/start/` | missions.create | Start mission |
| POST | `/missions/{id}/complete/` | missions.create | Complete mission |
| POST | `/missions/{id}/close/` | missions.create | Close mission |

## Assignments

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/assignments/my/` | assignments.view | My assignments |
| PATCH/POST | `/assignments/{id}/accept/` | assignments.accept | Accept assignment |
| PATCH/POST | `/assignments/{id}/decline/` | assignments.decline | Decline assignment |

## Error Envelope

```json
{
  "code": "validation_error",
  "message": "Human readable message",
  "details": {},
  "correlation_id": "uuid"
}
```
