/*
 P22 — Volunteer Crisis Management Platform
 PostgreSQL 17 Reference Database Schema and Delivery Queries
 Version: 1.0 | Date: 2026-07-17

 IMPORTANT
 - This is a client-facing logical/physical reference and bootstrap script.
 - The operational source of truth for the current application schema is Django
   migrations under backend/src/*/migrations/.
 - Do not run this script against an existing Django-managed production database
   without a DBA-approved migration plan.
 - UUID values are generated with gen_random_uuid() from pgcrypto.
*/

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. Common base convention (included in every business table)
-- id UUID PK, created_at, updated_at, deleted_at.
-- Soft deleted records remain in the database and are hidden by application
-- managers unless all_objects is used.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 2. Identity and RBAC
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounts_user (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    password VARCHAR(128) NOT NULL,
    last_login TIMESTAMPTZ NULL,
    is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
    email VARCHAR(254) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL DEFAULT '',
    first_name VARCHAR(150) NOT NULL DEFAULT '',
    last_name VARCHAR(150) NOT NULL DEFAULT '',
    is_staff BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    avatar VARCHAR(100) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);
CREATE INDEX IF NOT EXISTS accounts_user_email_idx ON accounts_user (email);
CREATE INDEX IF NOT EXISTS accounts_user_created_at_idx ON accounts_user (created_at DESC);
CREATE INDEX IF NOT EXISTS accounts_user_deleted_at_idx ON accounts_user (deleted_at) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS accounts_user_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES accounts_user(id) ON DELETE CASCADE,
    education VARCHAR(255) NOT NULL DEFAULT '',
    occupation VARCHAR(150) NOT NULL DEFAULT '',
    interests TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    blood_type VARCHAR(10) NOT NULL DEFAULT '',
    languages VARCHAR(255) NOT NULL DEFAULT '',
    years_of_experience SMALLINT NULL CHECK (years_of_experience >= 0),
    date_of_birth DATE NULL,
    emergency_contact_name VARCHAR(150) NOT NULL DEFAULT '',
    emergency_contact_phone VARCHAR(20) NOT NULL DEFAULT '',
    medical_conditions TEXT NOT NULL DEFAULT '',
    disability TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS accounts_permission (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codename VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    app_label VARCHAR(50) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);
CREATE INDEX IF NOT EXISTS accounts_permission_codename_idx ON accounts_permission (codename);

CREATE TABLE IF NOT EXISTS accounts_role (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS accounts_user_role (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES accounts_user(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES accounts_role(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT accounts_user_role_uniq UNIQUE (user_id, role_id)
);
CREATE INDEX IF NOT EXISTS accounts_user_role_user_idx ON accounts_user_role (user_id);
CREATE INDEX IF NOT EXISTS accounts_user_role_role_idx ON accounts_user_role (role_id);

CREATE TABLE IF NOT EXISTS accounts_role_permission (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES accounts_role(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES accounts_permission(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT accounts_role_permission_uniq UNIQUE (role_id, permission_id)
);
CREATE INDEX IF NOT EXISTS accounts_role_permission_role_idx ON accounts_role_permission (role_id);

-- ---------------------------------------------------------------------------
-- 3. Volunteers and Skills
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS volunteers_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES accounts_user(id) ON DELETE CASCADE,
    national_id VARCHAR(20) NOT NULL UNIQUE,
    city VARCHAR(100) NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT '',
    status VARCHAR(30) NOT NULL DEFAULT 'active'
        CHECK (status IN ('registered','pending_approval','active','rejected')),
    availability JSONB NOT NULL DEFAULT '{}'::jsonb,
    custom_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);
CREATE INDEX IF NOT EXISTS volunteers_status_idx ON volunteers_profile (status);
CREATE INDEX IF NOT EXISTS volunteers_city_idx ON volunteers_profile (city);
CREATE INDEX IF NOT EXISTS volunteers_availability_gin_idx ON volunteers_profile USING GIN (availability);

CREATE TABLE IF NOT EXISTS skills_skill (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL DEFAULT 'general',
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);
CREATE INDEX IF NOT EXISTS skills_category_idx ON skills_skill (category);

CREATE TABLE IF NOT EXISTS skills_volunteer_skill (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    volunteer_id UUID NOT NULL REFERENCES volunteers_profile(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills_skill(id) ON DELETE CASCADE,
    proficiency SMALLINT NOT NULL DEFAULT 3 CHECK (proficiency BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT volunteer_skill_uniq UNIQUE (volunteer_id, skill_id)
);
CREATE INDEX IF NOT EXISTS volunteer_skill_skill_idx ON skills_volunteer_skill (skill_id);

-- ---------------------------------------------------------------------------
-- 4. Disaster and Mission Operations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS disasters_disaster (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    disaster_type VARCHAR(30) NOT NULL DEFAULT 'other',
    severity VARCHAR(20) NOT NULL DEFAULT 'medium',
    province VARCHAR(100) NOT NULL DEFAULT '',
    city VARCHAR(100) NOT NULL DEFAULT '',
    location VARCHAR(255) NOT NULL DEFAULT '',
    occurred_at TIMESTAMPTZ NULL,
    needs JSONB NOT NULL DEFAULT '[]'::jsonb,
    affected_population INTEGER NULL CHECK (affected_population >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);
CREATE INDEX IF NOT EXISTS disasters_title_idx ON disasters_disaster (title);
CREATE INDEX IF NOT EXISTS disasters_type_idx ON disasters_disaster (disaster_type);
CREATE INDEX IF NOT EXISTS disasters_severity_idx ON disasters_disaster (severity);
CREATE INDEX IF NOT EXISTS disasters_status_idx ON disasters_disaster (status);
CREATE INDEX IF NOT EXISTS disasters_occurred_idx ON disasters_disaster (occurred_at DESC);
CREATE INDEX IF NOT EXISTS disasters_needs_gin_idx ON disasters_disaster USING GIN (needs);

CREATE TABLE IF NOT EXISTS missions_mission (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    disaster_id UUID NOT NULL REFERENCES disasters_disaster(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    coordinator_id UUID NOT NULL REFERENCES accounts_user(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft','published','in_progress','completed','closed')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium'
        CHECK (priority IN ('low','medium','high','critical')),
    province VARCHAR(100) NOT NULL DEFAULT '',
    city VARCHAR(100) NOT NULL DEFAULT '',
    location VARCHAR(255) NOT NULL DEFAULT '',
    start_time TIMESTAMPTZ NULL,
    end_time TIMESTAMPTZ NULL,
    is_end_time_tba BOOLEAN NOT NULL DEFAULT FALSE,
    required_volunteers INTEGER NOT NULL DEFAULT 1 CHECK (required_volunteers > 0),
    special_considerations TEXT NOT NULL DEFAULT '',
    equipment_needed TEXT NOT NULL DEFAULT '',
    safety_notes TEXT NOT NULL DEFAULT '',
    is_visible_to_volunteers BOOLEAN NOT NULL DEFAULT FALSE,
    allow_volunteer_applications BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT mission_application_visibility_ck
        CHECK (NOT allow_volunteer_applications OR is_visible_to_volunteers)
);
CREATE INDEX IF NOT EXISTS missions_disaster_idx ON missions_mission (disaster_id);
CREATE INDEX IF NOT EXISTS missions_coordinator_idx ON missions_mission (coordinator_id);
CREATE INDEX IF NOT EXISTS missions_title_idx ON missions_mission (title);
CREATE INDEX IF NOT EXISTS missions_status_idx ON missions_mission (status);
CREATE INDEX IF NOT EXISTS missions_priority_idx ON missions_mission (priority);
CREATE INDEX IF NOT EXISTS missions_coordinator_status_idx ON missions_mission (coordinator_id, status)
    WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS missions_visible_published_idx ON missions_mission (status, is_visible_to_volunteers)
    WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS missions_mission_required_skill (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID NOT NULL REFERENCES missions_mission(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills_skill(id) ON DELETE CASCADE,
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT mission_required_skill_uniq UNIQUE (mission_id, skill_id)
);
CREATE INDEX IF NOT EXISTS mission_required_skill_skill_idx ON missions_mission_required_skill (skill_id);

CREATE TABLE IF NOT EXISTS missions_mission_application (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID NOT NULL REFERENCES missions_mission(id) ON DELETE CASCADE,
    volunteer_id UUID NOT NULL REFERENCES volunteers_profile(id) ON DELETE CASCADE,
    message TEXT NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'submitted'
        CHECK (status IN ('submitted','waitlist','approved','rejected','withdrawn')),
    reviewed_by_id UUID NULL REFERENCES accounts_user(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ NULL,
    review_note TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT mission_application_uniq UNIQUE (mission_id, volunteer_id)
);
CREATE INDEX IF NOT EXISTS mission_application_mission_idx ON missions_mission_application (mission_id);
CREATE INDEX IF NOT EXISTS mission_application_volunteer_idx ON missions_mission_application (volunteer_id);
CREATE INDEX IF NOT EXISTS mission_application_status_idx ON missions_mission_application (status);
CREATE INDEX IF NOT EXISTS mission_application_inbox_idx ON missions_mission_application (status, created_at DESC)
    WHERE deleted_at IS NULL AND status IN ('submitted','waitlist');

CREATE TABLE IF NOT EXISTS assignments_assignment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID NOT NULL REFERENCES missions_mission(id) ON DELETE CASCADE,
    volunteer_id UUID NOT NULL REFERENCES volunteers_profile(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','accepted','checked_in','completed','declined')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT assignment_uniq UNIQUE (mission_id, volunteer_id)
);
CREATE INDEX IF NOT EXISTS assignment_mission_idx ON assignments_assignment (mission_id);
CREATE INDEX IF NOT EXISTS assignment_volunteer_idx ON assignments_assignment (volunteer_id);
CREATE INDEX IF NOT EXISTS assignment_status_idx ON assignments_assignment (status);

-- ---------------------------------------------------------------------------
-- 5. Reports and Attachments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reports_mission_report (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID NOT NULL REFERENCES missions_mission(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES accounts_user(id) ON DELETE RESTRICT,
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft','submitted','reviewed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);
CREATE INDEX IF NOT EXISTS report_mission_idx ON reports_mission_report (mission_id);
CREATE INDEX IF NOT EXISTS report_author_idx ON reports_mission_report (author_id);
CREATE INDEX IF NOT EXISTS report_status_idx ON reports_mission_report (status);

CREATE TABLE IF NOT EXISTS reports_attachment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES reports_mission_report(id) ON DELETE CASCADE,
    file VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);
CREATE INDEX IF NOT EXISTS report_attachment_report_idx ON reports_attachment (report_id);

-- ---------------------------------------------------------------------------
-- 6. Tickets, Notifications and Audit
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tickets_ticket (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open','in_progress','answered','closed')),
    author_id UUID NOT NULL REFERENCES accounts_user(id) ON DELETE RESTRICT,
    opened_by_id UUID NULL REFERENCES accounts_user(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);
CREATE INDEX IF NOT EXISTS ticket_author_idx ON tickets_ticket (author_id);
CREATE INDEX IF NOT EXISTS ticket_opened_by_idx ON tickets_ticket (opened_by_id);
CREATE INDEX IF NOT EXISTS ticket_status_idx ON tickets_ticket (status);

CREATE TABLE IF NOT EXISTS tickets_reply (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets_ticket(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES accounts_user(id) ON DELETE RESTRICT,
    body TEXT NOT NULL,
    is_staff_reply BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);
CREATE INDEX IF NOT EXISTS ticket_reply_ticket_idx ON tickets_reply (ticket_id, created_at);

CREATE TABLE IF NOT EXISTS notifications_notification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES accounts_user(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    channel VARCHAR(20) NOT NULL DEFAULT 'in_app',
    read_at TIMESTAMPTZ NULL,
    resource_type VARCHAR(80) NOT NULL DEFAULT '',
    resource_id VARCHAR(80) NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);
CREATE INDEX IF NOT EXISTS notification_user_created_idx ON notifications_notification (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notification_user_unread_idx ON notifications_notification (user_id, created_at DESC)
    WHERE read_at IS NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS notification_resource_idx ON notifications_notification (resource_type, resource_id);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NULL,
    action VARCHAR(80) NOT NULL,
    resource_type VARCHAR(80) NOT NULL,
    resource_id VARCHAR(80) NOT NULL,
    ip_address INET NULL,
    user_agent TEXT NOT NULL DEFAULT '',
    correlation_id VARCHAR(64) NOT NULL DEFAULT '',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);
CREATE INDEX IF NOT EXISTS audit_resource_idx ON audit_logs (resource_type, resource_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_user_idx ON audit_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_action_idx ON audit_logs (action);
CREATE INDEX IF NOT EXISTS audit_correlation_idx ON audit_logs (correlation_id);
CREATE INDEX IF NOT EXISTS audit_metadata_gin_idx ON audit_logs USING GIN (metadata);

-- ---------------------------------------------------------------------------
-- 7. Reporting views (safe, read-only convenience views)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_mission_capacity AS
SELECT
    m.id AS mission_id,
    m.title AS mission_title,
    m.status,
    m.priority,
    m.required_volunteers,
    COUNT(a.id) FILTER (WHERE a.deleted_at IS NULL
      AND a.status IN ('pending','accepted','checked_in')) AS assigned_volunteers,
    GREATEST(
      m.required_volunteers - COUNT(a.id) FILTER (WHERE a.deleted_at IS NULL
        AND a.status IN ('pending','accepted','checked_in')), 0
    ) AS remaining_capacity
FROM missions_mission m
LEFT JOIN assignments_assignment a ON a.mission_id = m.id
WHERE m.deleted_at IS NULL
GROUP BY m.id;

CREATE OR REPLACE VIEW vw_coordinator_application_inbox AS
SELECT
    m.coordinator_id,
    ma.id AS application_id,
    ma.status AS application_status,
    ma.created_at AS applied_at,
    m.id AS mission_id,
    m.title AS mission_title,
    vp.id AS volunteer_id,
    u.email AS volunteer_email,
    u.first_name,
    u.last_name
FROM missions_mission_application ma
JOIN missions_mission m ON m.id = ma.mission_id
JOIN volunteers_profile vp ON vp.id = ma.volunteer_id
JOIN accounts_user u ON u.id = vp.user_id
WHERE ma.deleted_at IS NULL
  AND m.deleted_at IS NULL
  AND ma.status IN ('submitted','waitlist');

-- ---------------------------------------------------------------------------
-- 8. Delivery / acceptance queries
-- ---------------------------------------------------------------------------

-- Q1: Active volunteer count by city and skill
-- SELECT vp.city, s.name AS skill, COUNT(*) AS volunteer_count
-- FROM volunteers_profile vp
-- JOIN skills_volunteer_skill vs ON vs.volunteer_id = vp.id AND vs.deleted_at IS NULL
-- JOIN skills_skill s ON s.id = vs.skill_id AND s.deleted_at IS NULL
-- WHERE vp.deleted_at IS NULL AND vp.status = 'active'
-- GROUP BY vp.city, s.name ORDER BY volunteer_count DESC;

-- Q2: Coordinator work queue
-- SELECT * FROM vw_coordinator_application_inbox
-- WHERE coordinator_id = :coordinator_uuid
-- ORDER BY applied_at DESC;

-- Q3: Open mission capacity
-- SELECT * FROM vw_mission_capacity
-- WHERE status IN ('published','in_progress')
-- ORDER BY priority DESC, remaining_capacity DESC;

-- Q4: Missions with required skills that a volunteer matches
-- SELECT DISTINCT m.id, m.title, m.priority, m.city
-- FROM missions_mission m
-- JOIN missions_mission_required_skill mrs ON mrs.mission_id = m.id
-- JOIN skills_volunteer_skill vs ON vs.skill_id = mrs.skill_id
-- WHERE vs.volunteer_id = :volunteer_uuid
--   AND m.status = 'published'
--   AND m.is_visible_to_volunteers = TRUE
--   AND m.allow_volunteer_applications = TRUE
--   AND m.deleted_at IS NULL;

-- Q5: Audit trail for an operation
-- SELECT created_at, action, user_id, metadata
-- FROM audit_logs
-- WHERE resource_type = :resource_type AND resource_id = :resource_id
-- ORDER BY created_at ASC;

-- Q6: Unread notifications for a user
-- SELECT id, title, message, resource_type, resource_id, created_at
-- FROM notifications_notification
-- WHERE user_id = :user_uuid AND read_at IS NULL AND deleted_at IS NULL
-- ORDER BY created_at DESC;

-- Q7: Ticket service-level queue
-- SELECT t.status, t.title, t.created_at, u.email AS requester
-- FROM tickets_ticket t
-- JOIN accounts_user u ON u.id = t.author_id
-- WHERE t.deleted_at IS NULL AND t.status IN ('open','in_progress')
-- ORDER BY t.created_at ASC;

COMMIT;
