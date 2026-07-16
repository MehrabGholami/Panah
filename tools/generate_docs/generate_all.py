"""Generate the full Panah enterprise DOCX documentation package."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parent))

from diagrams import generate_all_diagrams  # noqa: E402
from framework import DocBuilder, DOC_VERSION, PROJECT_NAME, VENDOR  # noqa: E402

DOCS = ROOT / "DOCS"
DIAG = DOCS / "Diagrams"
IMG = DOCS / "Images"


def D(name: str) -> Path:
    return DIAG / name


def start(title: str, doc_id: str, folder: str, filename: str, subtitle: str = "", standard: str = "IEEE / ISO aligned") -> tuple[DocBuilder, Path]:
    b = DocBuilder(title, doc_id, subtitle=subtitle, standard=standard)
    b.add_cover()
    b.add_revision_history()
    b.add_toc()
    out = DOCS / folder / filename
    return b, out


def finish(b: DocBuilder, out: Path, refs: list[str] | None = None):
    b.add_references(refs)
    b.save(out)
    print("Wrote", out.relative_to(ROOT))


# ---------------------------------------------------------------------------
# 01 Project
# ---------------------------------------------------------------------------

def gen_01():
    # Charter
    b, out = start("Project Charter", "PANAH-PC-001", "01_Project", "Project_Charter.docx",
                   "Formal authorization to execute the Panah platform delivery")
    b.h1("Purpose")
    b.p(
        "This Project Charter authorizes delivery of the Volunteer Crisis Management Platform "
        "(Panah / پناه), an enterprise web system for coordinating volunteers during disasters "
        "through missions, applications, assignments, reports, tickets, and notifications."
    )
    b.h1("Business Need")
    b.p(
        "Emergency response organizations require a single source of truth to register volunteers, "
        "publish field missions, review applications, assign people, track progress, and audit actions. "
        "Manual spreadsheets and ad-hoc messaging do not scale under crisis load."
    )
    b.h1("Project Description")
    b.bullets([
        "Web application with React SPA and Django REST API",
        "Role-based access: Admin, Coordinator, Volunteer",
        "Disaster → Mission → Application → Assignment → Report lifecycle",
        "In-app notifications, tickets/messaging, audit logging",
        "Dockerized deployment with PostgreSQL, Redis, Nginx, Celery",
    ])
    b.h1("Objectives")
    b.numbered([
        "Enable volunteer self-registration with skills and active status",
        "Enable staff to create, publish, and operate missions",
        "Enable volunteers to apply and complete assignments",
        "Provide coordinator-scoped operational dashboards",
        "Ensure security via JWT, RBAC, Argon2, and audit trails",
    ])
    b.h1("High-Level Scope")
    b.table(["In Scope", "Out of Scope (v1)"], [
        ("Mission & volunteer operations", "Native mobile apps"),
        ("Tickets & notifications", "GIS routing / fleet logistics"),
        ("Reports & finished mission summaries", "Multi-tenant SaaS billing"),
        ("Admin RBAC & audit", "Offline-first field sync"),
    ])
    b.h1("Key Stakeholders")
    b.table(["Stakeholder", "Interest", "Influence"], [
        ("Investica Group / Sponsor", "Delivery & brand", "High"),
        ("Platform Admin", "Governance & security", "High"),
        ("Coordinators", "Field operations", "High"),
        ("Volunteers", "Participation & clarity", "Medium"),
        ("DevOps / Engineering", "Stability & maintainability", "High"),
    ])
    b.h1("Milestones")
    b.table(["Milestone", "Outcome"], [
        ("M1 Architecture baseline", "Stack, RBAC, Docker compose"),
        ("M2 Core domain", "Disasters, missions, applications"),
        ("M3 Collaboration", "Tickets, notifications, reports"),
        ("M4 Role UX", "Coordinator dashboard & mine filters"),
        ("M5 Hardening", "Docs, seeds, ops runbooks"),
    ])
    b.h1("Budget & Authority")
    b.p(
        f"Delivery is owned by {VENDOR}. The Project Sponsor approves scope changes. "
        "Technical authority resides with the Solution Architect and Engineering Lead."
    )
    b.h1("Constraints & Assumptions")
    b.bullets([
        "Persian RTL UI is a primary UX requirement",
        "PostgreSQL and Redis are mandatory infrastructure dependencies",
        "Public volunteer registration is allowed without prior admin approval (auto-active)",
        "Coordinator dashboards are scoped to assigned missions",
    ])
    b.figure(D("MindMap_Capabilities.png"), "Figure 1 — Capability mind map for Panah")
    finish(b, out)

    # Scope
    b, out = start("Project Scope Statement", "PANAH-PS-001", "01_Project", "Project_Scope.docx")
    b.h1("Product Scope")
    b.p("Panah covers crisis registration, mission operations, volunteer participation, staff review, reporting, and communications.")
    b.h2("Functional Scope")
    b.bullets([
        "Authentication (JWT login/refresh/logout/me)",
        "Accounts & RBAC (users, roles, permissions)",
        "Volunteer registration and profiles",
        "Skills catalog and volunteer skills",
        "Disasters CRUD",
        "Missions lifecycle + visibility + applications inbox",
        "Assignments accept/decline/check-in/complete",
        "Mission reports and finished-mission summaries",
        "Tickets and staff-initiated messages",
        "Notifications and dashboard KPIs",
        "Audit logs (admin)",
    ])
    b.h2("Technical Scope")
    b.bullets([
        "Frontend: React 19, MUI v6, Redux Toolkit, TanStack Query, Vite",
        "Backend: Django 5.2, DRF, SimpleJWT, Celery",
        "Data: PostgreSQL 17, Redis 7",
        "Edge: Nginx reverse proxy",
        "Ops: Docker Compose (dev/prod), PgAdmin, Mailhog (dev)",
    ])
    b.h1("Exclusions")
    b.bullets(["Hardware provisioning of physical radios", "National ID verification with government APIs", "Realtime map dispatching"])
    b.h1("Acceptance of Scope")
    b.p("Scope is accepted when seeded roles operate end-to-end workflows without critical defects and documentation package is delivered under /DOCS.")
    finish(b, out)

    # Vision
    b, out = start("Vision Document", "PANAH-VIS-001", "01_Project", "Vision_Document.docx",
                   standard="ISO/IEC/IEEE 42010 aligned")
    b.h1("Vision Statement")
    b.p(
        "Panah is the trusted digital command surface for volunteer-powered crisis response— "
        "connecting people, missions, and accountability in one secure Persian-first platform."
    )
    b.h1("Problem Statement")
    b.p("Crisis responders struggle to match skilled volunteers to missions quickly while maintaining auditability and clear role boundaries.")
    b.h1("Target Users")
    b.table(["Persona", "Primary Goals"], [
        ("Volunteer", "Register, discover missions, apply, complete assignments"),
        ("Coordinator", "Operate own missions, review applications, coordinate people"),
        ("Admin", "Govern users/roles, oversee org-wide operations and audit"),
    ])
    b.h1("Product Features (MVP+)")
    b.numbered([
        "Self-service volunteer onboarding with skills",
        "Mission publication and volunteer applications",
        "Coordinator assignment notifications",
        "Role-aware dashboards",
        "Tickets/messages between staff and users",
    ])
    b.figure(D("C4_Context_Panah.png"), "Figure 1 — System context vision")
    finish(b, out)

    # Executive Summary
    b, out = start("Executive Summary", "PANAH-ES-001", "01_Project", "Executive_Summary.docx")
    b.h1("Overview")
    b.p(
        f"{PROJECT_NAME} (Panah) is a production-oriented web platform delivered by {VENDOR} "
        "to digitize volunteer coordination during emergencies. The system combines a React "
        "front office with a Django REST backend, PostgreSQL persistence, Redis-backed JWT "
        "security, and Dockerized operations."
    )
    b.h1("Strategic Value")
    b.bullets([
        "Faster volunteer-to-mission matching",
        "Clear separation of Admin / Coordinator / Volunteer duties",
        "Traceable decisions via audit and notifications",
        "Deployable on a single VPS via Docker Compose",
    ])
    b.h1("Current Capability Snapshot")
    b.table(["Area", "Status"], [
        ("Auth & RBAC", "Implemented"),
        ("Mission lifecycle", "Implemented"),
        ("Coordinator scoped UX", "Implemented"),
        ("Reports & tickets", "Implemented"),
        ("Documentation package", "This deliverable"),
    ])
    b.h1("Recommendations")
    b.numbered([
        "Keep coordinator scope (mine missions + own applications) as the default operational model",
        "Continue treating volunteer registration as auto-active; use mission approval as the control gate",
        "Maintain seed_data as the single source for role-permission alignment",
    ])
    finish(b, out)

    for title, fid, fname, body in [
        ("Project Objectives", "PANAH-OBJ-001", "Project_Objectives.docx",
         ["Reduce time-to-assign skilled volunteers", "Increase transparency of mission status", "Enforce least-privilege RBAC", "Provide bilingual-ready Persian UX", "Enable auditable crisis operations"]),
        ("Business Goals", "PANAH-BG-001", "Business_Goals.docx",
         ["Improve emergency operational readiness", "Standardize volunteer engagement", "Support Investica delivery credibility", "Create reusable platform assets", "Enable measurable KPIs on dashboards"]),
        ("Assumptions", "PANAH-ASM-001", "Assumptions.docx",
         ["Operators have modern browsers", "SMTP or Mailhog available for email channel", "Docker Engine available on target hosts", "National ID uniqueness is enforced at application level", "Coordinators are trusted staff identities"]),
        ("Constraints", "PANAH-CON-001", "Constraints.docx",
         ["Must run on Docker Compose topology", "Must use PostgreSQL as system of record", "JWT access tokens are short-lived (~15m)", "Persian RTL is mandatory for primary UI", "No multi-tenant isolation in v1"]),
        ("Success Criteria", "PANAH-SC-001", "Success_Criteria.docx",
         ["Volunteer can register and apply to a published mission", "Coordinator receives assignment notification and reviews applications", "Admin can manage roles and view audit logs", "Dashboard KPIs refresh for each role scope", "System boots via Start scripts with healthy containers"]),
    ]:
        b, out = start(title, fid, "01_Project", fname)
        b.h1("Statement")
        b.numbered(body)
        b.h1("Measurement")
        b.p("Each item is verified through seeded end-to-end scenarios and API/UI checks against the running Docker stack.")
        finish(b, out)

    b, out = start("Stakeholders Register", "PANAH-SH-001", "01_Project", "Stakeholders.docx")
    b.h1("Stakeholder Register")
    b.table(["ID", "Stakeholder", "Role", "Communication"], [
        ("SH-01", "Investica Sponsor", "Funding & acceptance", "Steering reviews"),
        ("SH-02", "System Admin", "Governance", "Admin manual / training"),
        ("SH-03", "Field Coordinator", "Operations", "Coordinator panel training"),
        ("SH-04", "Volunteer Community", "Field capacity", "User manual / onboarding"),
        ("SH-05", "Engineering Team", "Build & maintain", "Developer guide"),
        ("SH-06", "Security/Compliance", "Assurance", "Security pack"),
    ])
    finish(b, out)

    b, out = start("Risk Register", "PANAH-RR-001", "01_Project", "Risk_Register.docx")
    b.h1("Risk Register")
    b.table(["ID", "Risk", "Probability", "Impact", "Mitigation"], [
        ("R-01", "Privilege creep across roles", "M", "H", "Seed sync removes extra perms; review RBAC"),
        ("R-02", "Coordinator sees org-wide noise", "M", "M", "Scoped dashboard + mine filter"),
        ("R-03", "Token theft", "L", "H", "Short JWT, refresh rotation, Redis blacklist"),
        ("R-04", "Data loss", "L", "H", "Postgres volumes + backup strategy"),
        ("R-05", "Email delivery failure", "M", "L", "Mailhog in dev; SMTP config in prod"),
        ("R-06", "Incomplete documentation", "M", "M", "This DOCS package"),
    ])
    b.figure(D("Gantt_Delivery_Phases.png"), "Figure 1 — Delivery phases (risk context)")
    finish(b, out)


# ---------------------------------------------------------------------------
# 02 Requirements
# ---------------------------------------------------------------------------

def gen_02():
    b, out = start("Software Requirements Specification (SRS)", "PANAH-SRS-001", "02_Requirements",
                   "Software_Requirement_Specification.docx",
                   standard="IEEE 29148:2018")
    b.h1("Introduction")
    b.h2("Purpose")
    b.p("This SRS specifies functional and non-functional requirements for Panah derived from implemented behavior.")
    b.h2("Scope")
    b.p("Applies to web clients, REST APIs, background workers, and supporting infrastructure described in docker-compose.")
    b.h2("Definitions")
    b.table(["Term", "Definition"], [
        ("Mission", "Operational task linked to a disaster"),
        ("Application", "Volunteer request to join a mission"),
        ("Assignment", "Approved binding of volunteer to mission"),
        ("Coordinator", "Staff user owning mission operations"),
    ])
    b.h1("Overall Description")
    b.h2("Product Perspective")
    b.figure(D("C4_Context_Panah.png"), "Figure 1 — Product context")
    b.h2("User Characteristics")
    b.bullets(["Admins are technical operators", "Coordinators are operational staff", "Volunteers are field participants"])
    b.h1("Functional Requirements Summary")
    b.table(["ID", "Requirement", "Priority"], [
        ("FR-AUTH-01", "System shall authenticate users via email/password JWT", "Must"),
        ("FR-VOL-01", "System shall allow public volunteer registration", "Must"),
        ("FR-DIS-01", "Staff shall create and update disasters", "Must"),
        ("FR-MIS-01", "Staff shall manage mission lifecycle states", "Must"),
        ("FR-MIS-02", "Volunteers shall apply to eligible missions", "Must"),
        ("FR-MIS-03", "Staff shall approve/reject/waitlist applications", "Must"),
        ("FR-ASG-01", "Volunteers shall accept/decline/check-in/complete assignments", "Must"),
        ("FR-TKT-01", "Users shall create tickets; staff may message users", "Must"),
        ("FR-NOT-01", "System shall create in-app notifications for key events", "Must"),
        ("FR-AUD-01", "System shall record audit events for sensitive actions", "Must"),
        ("FR-DAS-01", "Dashboards shall reflect role scope (admin/coordinator/volunteer)", "Must"),
    ])
    b.h1("Non-Functional Requirements Summary")
    b.table(["ID", "Category", "Requirement"], [
        ("NFR-SEC-01", "Security", "Passwords hashed with Argon2; JWT blacklisting in Redis"),
        ("NFR-PERF-01", "Performance", "Dashboard stats cache TTL ~30s"),
        ("NFR-AVL-01", "Availability", "Compose healthchecks on postgres/redis/backend/nginx"),
        ("NFR-USE-01", "Usability", "Persian RTL primary interface"),
        ("NFR-MAI-01", "Maintainability", "Layered Django apps + typed React frontend"),
    ])
    finish(b, out)

    b, out = start("Functional Requirements", "PANAH-FR-001", "02_Requirements", "Functional_Requirements.docx")
    b.h1("Authentication & Session")
    b.numbered(["Login issues access+refresh tokens", "Refresh rotates and blacklists prior refresh", "Logout blacklists refresh token", "Me endpoint returns roles and permissions"])
    b.h1("Volunteer Domain")
    b.numbered(["Register creates user, volunteer role, active profile, skills", "Legacy approve/reject endpoints remain for non-active statuses"])
    b.h1("Mission Domain")
    b.numbered(["Create draft mission with coordinator", "Publish/start/complete/close/reopen transitions", "Visibility gates applications", "Inbox lists pending applications (coordinator scoped)"])
    b.h1("Assignments & Reports")
    b.numbered(["Approve application creates assignment", "Assignment status machine", "Reports submit/review with mission completion constraint"])
    finish(b, out)

    b, out = start("Non-Functional Requirements", "PANAH-NFR-001", "02_Requirements", "Non_Functional_Requirements.docx")
    b.h1("Quality Attributes")
    b.table(["Attribute", "Target", "Evidence in Code"], [
        ("Security", "RBAC + JWT", "HasPermission, SimpleJWT, Argon2"),
        ("Reliability", "Health probes", "docker-compose healthcheck"),
        ("Performance", "Cached dashboards", "DashboardService cache"),
        ("Portability", "Containers", "Dockerfile + compose"),
        ("Localization", "fa-IR RTL", "i18next locales"),
    ])
    finish(b, out)

    b, out = start("Business Rules", "PANAH-BR-001", "02_Requirements", "Business_Rules.docx")
    b.h1("Rules Catalog")
    b.table(["ID", "Rule"], [
        ("BR-01", "Only published + visible missions with allow_applications accept applications"),
        ("BR-02", "Applications require a volunteer profile"),
        ("BR-03", "Only admins may assign a different coordinator"),
        ("BR-04", "Coordinator application inbox is limited to own missions"),
        ("BR-05", "Closed missions cannot be updated"),
        ("BR-06", "Reports submit only when mission is completed or closed"),
        ("BR-07", "Volunteer registration defaults to ACTIVE status"),
        ("BR-08", "Staff messaging creates ticket with opened_by staff and author recipient"),
    ])
    finish(b, out)

    b, out = start("User Stories", "PANAH-US-001", "02_Requirements", "User_Stories.docx")
    b.h1("Backlog Stories")
    stories = [
        ("US-01", "Volunteer", "register with skills so I can join missions"),
        ("US-02", "Volunteer", "browse available missions and apply"),
        ("US-03", "Volunteer", "track my assignments and check in"),
        ("US-04", "Coordinator", "see KPIs for my missions only"),
        ("US-05", "Coordinator", "review applications for my missions"),
        ("US-06", "Admin", "assign a coordinator and notify them"),
        ("US-07", "Admin", "manage roles and audit logs"),
        ("US-08", "Staff", "message a user and receive replies via tickets"),
    ]
    b.table(["ID", "As a", "I want to..."], stories)
    finish(b, out)

    b, out = start("Acceptance Criteria", "PANAH-AC-001", "02_Requirements", "Acceptance_Criteria.docx")
    b.h1("Story Acceptance")
    b.table(["Story", "Given / When / Then"], [
        ("US-02", "Given published visible mission; When volunteer applies; Then status=submitted and notifications created"),
        ("US-05", "Given pending application on coordinator mission; When approve; Then assignment created and volunteer notified"),
        ("US-04", "Given coordinator login; When open dashboard; Then scope=coordinator and KPIs filtered"),
        ("US-06", "Given admin selects coordinator; When create mission; Then coordinator receives mission notification"),
    ])
    finish(b, out)

    b, out = start("Use Cases", "PANAH-UC-001", "02_Requirements", "Use_Cases.docx")
    b.h1("UC-01 Register Volunteer")
    b.p("Actor: Guest. Precondition: unique email/national ID. Main flow: submit form → validate → create user/profile/skills → notify.")
    b.h1("UC-02 Apply to Mission")
    b.p("Actor: Volunteer. Preconditions: published/visible/allow. Flow: open mission → apply → submitted.")
    b.h1("UC-03 Review Application")
    b.p("Actor: Coordinator/Admin. Flow: inbox → approve/waitlist/reject → notify volunteer.")
    b.figure(D("BPMN_Volunteer_Registration.png"), "Figure 1 — Registration process")
    b.figure(D("Sequence_Mission_Apply_Approve.png"), "Figure 2 — Apply/approve sequence")
    finish(b, out)

    b, out = start("Use Case Diagrams", "PANAH-UCD-001", "02_Requirements", "Use_Case_Diagrams.docx")
    b.h1("Actors and Use Cases")
    b.figure(D("UI_Navigation_Map.png"), "Figure 1 — Role navigation as use-case proxy map")
    b.p("Primary actors: Volunteer, Coordinator, Admin. Supporting: Email system, Database.")
    b.bullets(["Register", "Login", "Manage disasters", "Manage missions", "Apply", "Review applications", "Manage tickets", "View audit"])
    finish(b, out)

    b, out = start("Requirements Traceability Matrix", "PANAH-RTM-001", "02_Requirements", "Requirement_Traceability_Matrix.docx")
    b.h1("RTM")
    b.table(["Req ID", "Design Artifact", "Implementation", "Test"], [
        ("FR-AUTH-01", "JWT Flow diagram", "authentication app", "Login API tests / UAT"),
        ("FR-MIS-02", "Sequence apply", "MissionService.apply", "Apply UAT"),
        ("FR-DAS-01", "Dashboard architecture", "DashboardService scopes", "Role dashboard UAT"),
        ("NFR-SEC-01", "Security architecture", "Argon2 + Redis JWT", "Security checklist"),
    ])
    finish(b, out)


# ---------------------------------------------------------------------------
# 03 Analysis
# ---------------------------------------------------------------------------

def gen_03():
    b, out = start("System Analysis Document", "PANAH-SAD-001", "03_Analysis", "System_Analysis_Document.docx")
    b.h1("Current System Analysis")
    b.p("Panah is a greenfield digital platform replacing fragmented crisis volunteer coordination practices.")
    b.h1("Domain Overview")
    b.figure(D("ERD_Logical_Core.png"), "Figure 1 — Core domain entities")
    b.h1("External Interfaces")
    b.bullets(["Browser clients", "SMTP email", "Optional PgAdmin for DB operations"])
    finish(b, out)

    b, out = start("Domain Model", "PANAH-DM-001", "03_Analysis", "Domain_Model.docx")
    b.h1("Bounded Contexts")
    b.table(["Context", "Core Entities"], [
        ("Identity & Access", "User, Role, Permission, UserProfile"),
        ("Volunteer Mgmt", "VolunteerProfile, Skill, VolunteerSkill"),
        ("Crisis Ops", "Disaster, Mission, MissionRequiredSkill"),
        ("Participation", "MissionApplication, Assignment"),
        ("Collaboration", "Ticket, TicketReply, Notification"),
        ("Assurance", "AuditLog, MissionReport"),
    ])
    b.figure(D("Class_Mission_Domain.png"), "Figure 1 — Mission domain class view")
    finish(b, out)

    b, out = start("Entity Analysis", "PANAH-EA-001", "03_Analysis", "Entity_Analysis.docx")
    b.h1("Entity Dictionary (selected)")
    b.table(["Entity", "Key Attributes", "Relationships"], [
        ("User", "email, is_active, is_approved", "roles, profile, missions coordinated"),
        ("Mission", "status, priority, visibility flags", "disaster, coordinator, applications"),
        ("MissionApplication", "status, message, review fields", "mission, volunteer"),
        ("Assignment", "status", "mission, volunteer"),
        ("Ticket", "status, opened_by", "author, replies"),
    ])
    finish(b, out)

    b, out = start("Workflow Analysis", "PANAH-WA-001", "03_Analysis", "Workflow_Analysis.docx")
    b.h1("Mission Operating Workflow")
    b.figure(D("Activity_Mission_Lifecycle.png"), "Figure 1 — Mission lifecycle activity")
    b.h1("Application Review Workflow")
    b.figure(D("Sequence_Mission_Apply_Approve.png"), "Figure 2 — Application approval sequence")
    finish(b, out)

    b, out = start("Activity Diagrams", "PANAH-ACT-001", "03_Analysis", "Activity_Diagrams.docx")
    b.h1("Mission Lifecycle Activity")
    b.figure(D("Activity_Mission_Lifecycle.png"), "Figure 1 — Activity diagram")
    b.h1("Registration Activity")
    b.figure(D("BPMN_Volunteer_Registration.png"), "Figure 2 — Registration BPMN/activity style")
    finish(b, out)

    b, out = start("Sequence Diagrams", "PANAH-SEQ-001", "03_Analysis", "Sequence_Diagrams.docx")
    b.h1("Apply and Approve")
    b.figure(D("Sequence_Mission_Apply_Approve.png"), "Figure 1 — Sequence diagram")
    b.h1("JWT Login")
    b.figure(D("JWT_Auth_Flow.png"), "Figure 2 — Authentication interactions")
    finish(b, out)

    b, out = start("State Diagrams", "PANAH-STD-001", "03_Analysis", "State_Diagrams.docx")
    b.h1("Mission Status States")
    b.figure(D("State_Mission_Status.png"), "Figure 1 — Mission state machine")
    b.h1("Other State Machines")
    b.table(["Entity", "States"], [
        ("MissionApplication", "submitted, waitlist, approved, rejected, withdrawn"),
        ("Assignment", "pending, accepted, checked_in, completed, declined"),
        ("Ticket", "open, in_progress, answered, closed"),
        ("MissionReport", "draft, submitted, reviewed"),
    ])
    finish(b, out)


# ---------------------------------------------------------------------------
# 04 Architecture
# ---------------------------------------------------------------------------

def gen_04():
    b, out = start("Software Architecture Document", "PANAH-SAD-ARCH-001", "04_Architecture",
                   "Software_Architecture_Document.docx",
                   standard="ISO/IEC/IEEE 42010 + C4 Model")
    b.h1("Architecture Overview")
    b.p(
        "Panah follows a modular monolith backend (Django apps) with a decoupled SPA frontend, "
        "accessed through Nginx, persisted in PostgreSQL, and coordinated with Redis and Celery."
    )
    b.h1("C4 Context")
    b.figure(D("C4_Context_Panah.png"), "Figure 1 — C4 Context")
    b.h1("C4 Containers")
    b.figure(D("C4_Container_Panah.png"), "Figure 2 — C4 Containers")
    b.h1("C4 Components")
    b.figure(D("C4_Component_Backend.png"), "Figure 3 — Backend components")
    b.h1("Deployment View")
    b.figure(D("Deployment_Docker.png"), "Figure 4 — Deployment diagram")
    b.h1("Layered / Clean Architecture")
    b.figure(D("Layered_Clean_Architecture.png"), "Figure 5 — Backend layering")
    b.h1("Data Flow")
    b.figure(D("DFD_Level0.png"), "Figure 6 — Level-0 DFD")
    b.h1("Technology Stack")
    b.table(["Layer", "Technology"], [
        ("UI", "React 19, MUI 6, Redux Toolkit, TanStack Query, Vite 6"),
        ("API", "Django 5.2, DRF, SimpleJWT, drf-spectacular"),
        ("Data", "PostgreSQL 17, Redis 7"),
        ("Async", "Celery, django-celery-beat"),
        ("Edge", "Nginx"),
        ("Ops", "Docker Compose, Gunicorn (prod)"),
    ])
    b.h1("Design Decisions (ADR style)")
    b.table(["Decision", "Choice", "Rationale"], [
        ("Auth", "JWT + Redis blacklist", "Stateless API with revocation"),
        ("Authorization", "DB-backed RBAC codenames", "Flexible role seeding"),
        ("Architecture style", "Modular monolith", "Speed + clear app boundaries"),
        ("Coordinator scope", "Mission.coordinator ownership", "Operational clarity"),
        ("Volunteer gate", "Mission application review", "Avoid blocking registration"),
    ])
    b.h1("Quality Attribute Design")
    b.h2("Scalability")
    b.p("Stateless API containers can scale horizontally behind Nginx; Postgres remains primary bottleneck—index hot paths and cache dashboards.")
    b.h2("Performance")
    b.p("Dashboard caching, select_related/prefetch in repositories, pagination defaults.")
    b.h2("High Availability")
    b.p("Compose healthchecks + restart policies; production should add managed Postgres HA and Redis persistence.")
    b.h1("Component Communication")
    b.bullets([
        "SPA → Nginx → Django REST JSON",
        "Django → PostgreSQL (system of record)",
        "Django → Redis (cache, broker, JWT blacklist)",
        "Celery worker → email notifications",
    ])
    b.h1("Package Structure")
    b.bullets([
        "backend/src/<app>/{api,application,domain,infrastructure,models}",
        "frontend/src/{app,features,shared,layouts}",
        "infrastructure/{nginx,docker,pgadmin}",
    ])
    finish(b, out)


# ---------------------------------------------------------------------------
# 05 Database
# ---------------------------------------------------------------------------

def gen_05():
    b, out = start("Database Design Document", "PANAH-DB-001", "05_Database", "Database_Design_Document.docx")
    b.h1("Overview")
    b.p("PostgreSQL 17 stores all domain data. Soft-delete is implemented via deleted_at on BaseModel.")
    b.h1("ER Diagram")
    b.figure(D("ERD_Logical_Core.png"), "Figure 1 — Logical ERD")
    b.h1("Logical Model")
    b.p("Entities mirror Django models: accounts, volunteers, skills, disasters, missions, assignments, reports, tickets, notifications, audit_logs.")
    b.h1("Physical Model Notes")
    b.bullets([
        "UUID primary keys",
        "Timestamps created_at/updated_at",
        "Indexed status/priority/email fields",
        "Unique constraints: UserRole(user,role), Assignment(mission,volunteer), etc.",
    ])
    b.h1("Data Dictionary (core)")
    b.table(["Table", "Column", "Type", "Notes"], [
        ("accounts_user", "email", "varchar", "unique login"),
        ("missions_mission", "status", "varchar(20)", "lifecycle"),
        ("missions_missionapplication", "status", "varchar", "review pipeline"),
        ("assignments_assignment", "status", "varchar", "field progress"),
        ("tickets_ticket", "opened_by_id", "uuid nullable", "staff DM"),
    ])
    b.h1("Relationships")
    b.bullets(["Disaster 1—N Mission", "Mission 1—N Application/Assignment/Report", "User 1—1 VolunteerProfile", "Role N—N Permission"])
    b.h1("Constraints & Indexes")
    b.p("Referential integrity via FK; business uniqueness via UniqueConstraint; soft-delete queries filter deleted_at IS NULL through custom managers.")
    b.h1("PostgreSQL Design")
    b.p("Database name volunteer_management; user volunteer_user; init scripts under infrastructure/docker/postgres/init.")
    b.h1("Migration Strategy")
    b.numbered(["Developers create Django migrations per app", "Containers run migrate on startup/scripts", "Avoid destructive squash without backup"])
    b.h1("Backup Strategy")
    b.numbered(["pg_dump logical backups daily in production", "Retain volume snapshots", "Test restore quarterly", "Document restore in Maintenance manual"])
    finish(b, out)

    for title, fid, fname, paras in [
        ("Logical Data Model", "PANAH-DB-LDM-001", "Logical_Model.docx", ["See ERD and domain model; normalized 3NF for transactional ops."]),
        ("Physical Data Model", "PANAH-DB-PDM-001", "Physical_Model.docx", ["Django ORM maps models to tables with UUID PKs and soft delete columns."]),
        ("Database Dictionary", "PANAH-DB-DD-001", "Database_Dictionary.docx", ["Full dictionary is derived from models under backend/src/*/models."]),
        ("Relationships Catalog", "PANAH-DB-REL-001", "Relationships.docx", ["FK graph centered on Mission and User."]),
        ("Constraints Catalog", "PANAH-DB-CON-001", "Constraints.docx", ["NOT NULL, UNIQUE, FK ON DELETE policies (CASCADE/PROTECT) as coded."]),
        ("Indexes Strategy", "PANAH-DB-IDX-001", "Indexes.docx", ["db_index on status/priority/email; add composite indexes if inbox queries slow."]),
        ("PostgreSQL Design Notes", "PANAH-DB-PG-001", "PostgreSQL_Design.docx", ["UTF8, Docker volume persistence, healthcheck via pg_isready."]),
        ("Migration Strategy", "PANAH-DB-MIG-001", "Migration_Strategy.docx", ["Forward-only migrations; expand-contract for breaking changes."]),
        ("Backup Strategy", "PANAH-DB-BKP-001", "Backup_Strategy.docx", ["Daily dump + WAL archiving recommended for production HA."]),
    ]:
        b, out = start(title, fid, "05_Database", fname)
        b.h1("Content")
        for p in paras:
            b.p(p)
        b.figure(D("ERD_Logical_Core.png"), "Figure 1 — Reference ERD")
        finish(b, out)


# ---------------------------------------------------------------------------
# 06 API
# ---------------------------------------------------------------------------

def gen_06():
    b, out = start("REST API Design & Reference", "PANAH-API-001", "06_API", "REST_API_Design.docx",
                   standard="OpenAPI 3 / REST best practices")
    b.h1("API Overview")
    b.p("Base path: /api/v1/. Interactive schema: /api/schema/ and /api/docs/ (drf-spectacular).")
    b.h1("Authentication")
    b.figure(D("JWT_Auth_Flow.png"), "Figure 1 — JWT flow")
    b.p("Header: Authorization: Bearer <access>.")
    b.h1("Authorization (RBAC)")
    b.figure(D("RBAC_Model.png"), "Figure 2 — RBAC")
    b.p("Views declare required_permission codenames enforced by HasPermission.")
    b.h1("Endpoint Map")
    b.table(["Prefix", "Examples"], [
        ("/auth/", "login, logout, refresh, me"),
        ("/accounts/", "users, roles, permissions"),
        ("/volunteers/", "register, list, approve/reject"),
        ("/disasters/", "CRUD"),
        ("/missions/", "CRUD, publish, apply, applications inbox"),
        ("/assignments/", "my, accept, decline, check-in, complete"),
        ("/reports/", "CRUD, submit, review, finished-missions"),
        ("/tickets/", "CRUD, replies, status"),
        ("/notifications/", "list, mark read"),
        ("/dashboard/", "stats"),
        ("/audit-logs/", "list"),
    ])
    b.h1("Error Model")
    b.p("Custom exception handler returns {success:false, error:{code,message,details}}.")
    b.table(["HTTP", "Meaning"], [
        ("400", "Validation / business rule"),
        ("401", "Unauthenticated / invalid token"),
        ("403", "Permission denied"),
        ("404", "Not found"),
        ("409", "Conflict (duplicate application/assignment)"),
    ])
    b.h1("Samples")
    b.h2("Login Request")
    b.p('POST /api/v1/auth/login/  {"email":"user@example.com","password":"..."}')
    b.h2("Apply Request")
    b.p('POST /api/v1/missions/{id}/apply/  {"message":"آماده همکاری هستم"}')
    b.h2("Dashboard Response (coordinator)")
    b.p('{"scope":"coordinator","kpis":{"my_missions_total":N,"pending_applications":N,...},"charts":{...}}')
    finish(b, out)

    for title, fid, fname in [
        ("Endpoint Documentation", "PANAH-API-EP-001", "Endpoint_Documentation.docx"),
        ("Authentication Guide", "PANAH-API-AUTH-001", "Authentication.docx"),
        ("Authorization & RBAC", "PANAH-API-RBAC-001", "Authorization_RBAC.docx"),
        ("JWT Flow Specification", "PANAH-API-JWT-001", "JWT_Flow.docx"),
        ("API Error Codes", "PANAH-API-ERR-001", "Error_Codes.docx"),
        ("Request Samples", "PANAH-API-REQ-001", "Request_Samples.docx"),
        ("Response Samples", "PANAH-API-RES-001", "Response_Samples.docx"),
        ("Swagger Notes", "PANAH-API-SWG-001", "Swagger_OpenAPI.docx"),
    ]:
        b, out = start(title, fid, "06_API", fname)
        b.h1("Summary")
        b.p(f"This document details {title.lower()} for Panah REST APIs under /api/v1/.")
        if "JWT" in title or "Auth" in title:
            b.figure(D("JWT_Auth_Flow.png"), "Figure 1 — JWT")
        if "RBAC" in title:
            b.figure(D("RBAC_Model.png"), "Figure 1 — RBAC")
        b.h1("Details")
        b.bullets([
            "Contracts are published via drf-spectacular",
            "Permission codenames seeded in SeedService",
            "Pagination and filtering via DRF defaults / django-filter",
        ])
        finish(b, out)


def gen_07_to_12():
    # UI/UX
    b, out = start("UI/UX Design Document", "PANAH-UI-001", "07_UI_UX", "UI_Design_Document.docx")
    b.h1("Design Principles")
    b.bullets(["Persian RTL first", "Role-aware navigation", "Operational clarity over decoration", "Glass/gradient visual language consistent with MUI theme"])
    b.h1("Navigation Map")
    b.figure(D("UI_Navigation_Map.png"), "Figure 1 — Navigation by role")
    b.h1("Key Screens")
    b.figure(IMG / "UI_Mock_Coordinator_Dashboard.png", "Figure 2 — Coordinator dashboard mock")
    b.figure(IMG / "UI_Mock_Login.png", "Figure 3 — Login mock")
    b.h1("Design System")
    b.table(["Token", "Value/Notes"], [
        ("Primary accent", "Cyan/teal (#22D3EE family)"),
        ("Typography", "Calibri/system with MUI typography scale"),
        ("Components", "GlassCard, GradientButton, StatusChip, JalaliDateField"),
        ("Charts", "Recharts"),
    ])
    b.h1("Responsive Strategy")
    b.p("Stack layouts collapse via MUI Grid2 breakpoints; drawers become temporary on mobile.")
    finish(b, out)

    for title, fid, fname in [
        ("Navigation Map", "PANAH-UI-NAV-001", "Navigation_Map.docx"),
        ("User Flows", "PANAH-UI-UF-001", "User_Flows.docx"),
        ("Wireframes", "PANAH-UI-WF-001", "Wireframes.docx"),
        ("Dashboard Design", "PANAH-UI-DB-001", "Dashboard_Design.docx"),
        ("Responsive Strategy", "PANAH-UI-RS-001", "Responsive_Strategy.docx"),
        ("Design System", "PANAH-UI-DS-001", "Design_System.docx"),
        ("Color Palette", "PANAH-UI-CP-001", "Color_Palette.docx"),
        ("Typography", "PANAH-UI-TY-001", "Typography.docx"),
        ("Icons", "PANAH-UI-IC-001", "Icons.docx"),
    ]:
        b, out = start(title, fid, "07_UI_UX", fname)
        b.h1(title)
        b.p(f"Specification for {title} based on frontend/src implementation (MUI + feature pages).")
        b.figure(D("UI_Navigation_Map.png"), "Figure 1 — Related navigation map")
        if "Dashboard" in title:
            b.figure(IMG / "UI_Mock_Coordinator_Dashboard.png", "Figure 2 — Dashboard mock")
        finish(b, out)

    # Backend
    b, out = start("Backend Architecture", "PANAH-BE-001", "08_Backend", "Backend_Architecture.docx")
    b.h1("Structure")
    b.figure(D("Layered_Clean_Architecture.png"), "Figure 1 — Layers")
    b.h1("Apps")
    b.bullets(["accounts", "authentication", "volunteers", "skills", "disasters", "missions", "assignments", "reports", "notifications", "dashboard", "audit_logs", "tickets", "common", "config"])
    b.h1("Patterns")
    b.bullets(["Service layer use-cases", "Repository wrappers", "Domain enums/exceptions", "Permission gates on API views", "AuditService logging", "NotificationDispatcher fan-out"])
    b.h1("Background Tasks")
    b.p("Celery task notifications.send_email_notification for EMAIL channel.")
    b.h1("Logging & Exceptions")
    b.p("Structured logging with correlation middleware; custom_exception_handler standardizes API errors.")
    finish(b, out)

    for title, fid, fname in [
        ("Folder Structure", "PANAH-BE-FS-001", "Folder_Structure.docx"),
        ("Services Catalog", "PANAH-BE-SVC-001", "Services.docx"),
        ("Repository Pattern", "PANAH-BE-REPO-001", "Repository_Pattern.docx"),
        ("Dependency Injection Notes", "PANAH-BE-DI-001", "Dependency_Injection.docx"),
        ("Background Tasks", "PANAH-BE-BG-001", "Background_Tasks.docx"),
        ("Logging", "PANAH-BE-LOG-001", "Logging.docx"),
        ("Validation", "PANAH-BE-VAL-001", "Validation.docx"),
        ("Exception Handling", "PANAH-BE-EX-001", "Exception_Handling.docx"),
    ]:
        b, out = start(title, fid, "08_Backend", fname)
        b.h1("Overview")
        b.p(f"{title} for Django backend under backend/src.")
        b.figure(D("C4_Component_Backend.png"), "Figure 1 — Components")
        finish(b, out)

    # Frontend
    b, out = start("Frontend Architecture", "PANAH-FE-001", "09_Frontend", "Frontend_Architecture.docx")
    b.h1("Stack")
    b.p("React 19 + Vite + TypeScript + MUI + Redux Toolkit + TanStack Query + React Router 7 + i18next.")
    b.h1("Structure")
    b.bullets(["app/ (store, router, providers)", "features/* pages", "shared/{api,components,hooks,types,utils}", "layouts/DashboardLayout"])
    b.h1("State")
    b.p("Auth/UI preferences in Redux; server state in React Query; forms via RHF+Zod where used.")
    b.h1("API Integration")
    b.p("Axios client with JWT attach + refresh queue interceptor.")
    finish(b, out)
    for title, fid, fname in [
        ("Component Tree", "PANAH-FE-CT-001", "Component_Tree.docx"),
        ("Routing", "PANAH-FE-RT-001", "Routing.docx"),
        ("State Management", "PANAH-FE-SM-001", "State_Management.docx"),
        ("API Integration", "PANAH-FE-API-001", "API_Integration.docx"),
        ("Forms", "PANAH-FE-FM-001", "Forms.docx"),
        ("Performance Optimization", "PANAH-FE-PO-001", "Performance_Optimization.docx"),
    ]:
        b, out = start(title, fid, "09_Frontend", fname)
        b.h1(title)
        b.p(f"Frontend guidance for {title.lower()} aligned with frontend/src.")
        finish(b, out)

    # Security
    b, out = start("Security Architecture", "PANAH-SEC-001", "10_Security", "Security_Architecture.docx",
                   standard="OWASP ASVS 4.0 aligned")
    b.h1("Threat Model (summary)")
    b.table(["Threat", "Mitigation"], [
        ("Credential stuffing", "Argon2 hashing, account is_active"),
        ("Token replay after logout", "Redis blacklist + rotation"),
        ("Privilege escalation", "RBAC codenames; admin-only routes"),
        ("IDOR on missions", "get_for_user / staff checks"),
        ("XSS", "React escaping; CSP via Nginx recommended"),
    ])
    b.figure(D("JWT_Auth_Flow.png"), "Figure 1 — Auth security flow")
    b.figure(D("RBAC_Model.png"), "Figure 2 — Authorization model")
    b.h1("ASVS Mapping (selected)")
    b.table(["ASVS", "Control"], [
        ("V2 Auth", "JWT + password hashing"),
        ("V4 Access Control", "HasPermission + role seeds"),
        ("V7 Error Handling", "Uniform API errors without stack traces"),
        ("V9 Communications", "TLS termination at Nginx in prod"),
    ])
    b.h1("Checklist")
    b.bullets(["Rotate secrets in .env for prod", "Disable Mailhog exposure", "Enable HTTPS certificates", "Restrict PgAdmin", "Review audit logs periodically"])
    finish(b, out)
    for title, fid, fname in [
        ("Threat Model", "PANAH-SEC-TM-001", "Threat_Model.docx"),
        ("OWASP ASVS Mapping", "PANAH-SEC-ASVS-001", "OWASP_ASVS.docx"),
        ("Authentication Flow", "PANAH-SEC-AF-001", "Authentication_Flow.docx"),
        ("JWT Lifecycle", "PANAH-SEC-JWT-001", "JWT_Lifecycle.docx"),
        ("Password Policy", "PANAH-SEC-PP-001", "Password_Policy.docx"),
        ("Encryption", "PANAH-SEC-ENC-001", "Encryption.docx"),
        ("Audit Logging", "PANAH-SEC-AUD-001", "Audit_Logging.docx"),
        ("Rate Limiting", "PANAH-SEC-RL-001", "Rate_Limiting.docx"),
        ("Security Checklist", "PANAH-SEC-CL-001", "Security_Checklist.docx"),
    ]:
        b, out = start(title, fid, "10_Security", fname, standard="OWASP ASVS")
        b.h1(title)
        b.p(f"Security control documentation: {title}.")
        finish(b, out)

    # Testing
    b, out = start("Test Plan", "PANAH-QA-TP-001", "11_Testing", "Test_Plan.docx")
    b.h1("Objectives")
    b.p("Verify functional workflows, RBAC boundaries, and deployment health.")
    b.h1("Levels")
    b.bullets(["Unit (services/serializers)", "API integration", "UI UAT by role", "Security smoke", "Performance spot checks"])
    b.h1("Entry/Exit")
    b.p("Entry: stack healthy. Exit: critical path UAT passed; no Sev-1 open.")
    finish(b, out)
    for title, fid, fname in [
        ("Unit Test Plan", "PANAH-QA-UT-001", "Unit_Test_Plan.docx"),
        ("Integration Test Plan", "PANAH-QA-IT-001", "Integration_Test_Plan.docx"),
        ("UAT Plan", "PANAH-QA-UAT-001", "UAT.docx"),
        ("Test Cases", "PANAH-QA-TC-001", "Test_Cases.docx"),
        ("Test Matrix", "PANAH-QA-TM-001", "Test_Matrix.docx"),
        ("Performance Testing", "PANAH-QA-PT-001", "Performance_Testing.docx"),
        ("Security Testing", "PANAH-QA-ST-001", "Security_Testing.docx"),
    ]:
        b, out = start(title, fid, "11_Testing", fname)
        b.h1(title)
        b.table(["Case", "Steps", "Expected"], [
            ("Login", "POST /auth/login", "200 + tokens"),
            ("Volunteer apply", "POST /missions/{id}/apply", "201 submitted"),
            ("Coordinator inbox", "GET applications/inbox", "Only own missions"),
            ("Approve", "POST approve", "Assignment created"),
        ])
        finish(b, out)

    # Deployment
    b, out = start("Deployment Guide", "PANAH-DEP-001", "12_Deployment", "Deployment_Guide.docx")
    b.h1("Docker Architecture")
    b.figure(D("Deployment_Docker.png"), "Figure 1 — Compose deployment")
    b.h1("Services")
    b.table(["Service", "Port/Role"], [
        ("nginx", "80/443 edge"),
        ("frontend", "SPA"),
        ("backend", "Django API"),
        ("celery / beat", "async"),
        ("postgres", "5432 internal"),
        ("redis", "6379 internal"),
        ("pgadmin", "5050 dev"),
        ("mailhog", "8025/1025 dev"),
    ])
    b.h1("VPS Steps")
    b.numbered(["Clone repo", "Configure .env", "docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build", "seed_data", "Issue TLS certs", "Verify /health and /api/docs"])
    b.h1("Nginx / SSL / Backup / Monitoring")
    b.bullets(["Configs in infrastructure/nginx", "Terminate TLS at Nginx", "Backup postgres volume/dumps", "Monitor container health + logs"])
    b.h1("CI/CD")
    b.p("GitHub Actions workflow under .github/workflows/ci.yml runs checks with Postgres service.")
    finish(b, out)
    for title, fid, fname in [
        ("Docker Architecture", "PANAH-DEP-DK-001", "Docker_Architecture.docx"),
        ("Docker Compose Explanation", "PANAH-DEP-DC-001", "Docker_Compose_Explanation.docx"),
        ("VPS Deployment Guide", "PANAH-DEP-VPS-001", "VPS_Deployment_Guide.docx"),
        ("Nginx Configuration", "PANAH-DEP-NGX-001", "Nginx_Configuration.docx"),
        ("SSL Guide", "PANAH-DEP-SSL-001", "SSL.docx"),
        ("Backup Procedures", "PANAH-DEP-BKP-001", "Backup.docx"),
        ("Restore Procedures", "PANAH-DEP-RST-001", "Restore.docx"),
        ("Monitoring", "PANAH-DEP-MON-001", "Monitoring.docx"),
        ("CI_CD Pipeline", "PANAH-DEP-CI-001", "CI_CD_Pipeline.docx"),
    ]:
        b, out = start(title, fid, "12_Deployment", fname)
        b.h1(title)
        b.p(f"Operations document: {title}.")
        b.figure(D("Deployment_Docker.png"), "Figure 1 — Deployment reference")
        finish(b, out)


def gen_13_17():
    b, out = start("User Manual — Volunteers", "PANAH-UM-001", "13_UserManual", "User_Manual.docx")
    b.h1("Introduction")
    b.p("This manual helps volunteers use Panah: register, find missions, apply, and manage assignments.")
    b.h1("Getting Started")
    b.numbered(["Open the site", "Register as volunteer with skills", "Login", "Open Dashboard"])
    b.figure(IMG / "UI_Mock_Login.png", "Figure 1 — Login")
    b.h1("Available Missions")
    b.p("Use مأموریت‌های موجود to browse published missions and submit applications with an optional message.")
    b.h1("My Missions")
    b.p("Track assignment status: accept, decline, check-in, complete.")
    b.h1("Tickets & Notifications")
    b.p("Read notifications and respond to tickets/messages from staff.")
    b.h1("Troubleshooting")
    b.bullets(["Cannot apply: mission may be hidden or applications disabled", "Already applied: wait for review", "Token expired: re-login"])
    finish(b, out)

    b, out = start("Administrator Manual", "PANAH-AM-001", "14_AdminManual", "Admin_Manual.docx")
    b.h1("Admin Responsibilities")
    b.bullets(["Manage users/roles", "Oversee disasters and missions", "Review audit logs", "Assign coordinators"])
    b.h1("Coordinator Panel")
    b.p("Coordinators see scoped dashboards and default mission filter mine=true; applications inbox shows their missions.")
    b.figure(IMG / "UI_Mock_Coordinator_Dashboard.png", "Figure 1 — Coordinator dashboard")
    b.h1("Common Operations")
    b.numbered(["Create disaster", "Create mission and assign coordinator", "Publish & enable applications", "Review applications", "Review reports", "Message users"])
    b.h1("PgAdmin Access")
    b.table(["Field", "Value"], [
        ("URL", "http://localhost:5050"),
        ("DB user", "volunteer_user"),
        ("DB password", "volunteer_pass"),
        ("DB name", "volunteer_management"),
    ])
    finish(b, out)

    b, out = start("Developer Handbook", "PANAH-DEV-001", "15_DeveloperGuide", "Developer_Guide.docx")
    b.h1("Repository Layout")
    b.bullets(["backend/", "frontend/", "infrastructure/", "DOCS/", "tools/generate_docs/"])
    b.h1("Local Run")
    b.numbered(["Configure .env", "Run SETUP/Start scripts or docker compose up", "seed_data", "Open http://localhost"])
    b.h1("Backend Conventions")
    b.figure(D("Layered_Clean_Architecture.png"), "Figure 1 — Backend layers")
    b.h1("Frontend Conventions")
    b.p("Feature folders, shared API endpoints module, permission-aware routes.")
    b.h1("Useful Commands")
    b.bullets([
        "docker compose exec volunteer-management-backend python manage.py seed_data",
        "docker compose logs -f volunteer-management-backend",
        "OpenAPI at /api/docs/",
    ])
    finish(b, out)

    b, out = start("Maintenance Manual", "PANAH-MNT-001", "16_Maintenance", "Maintenance_Manual.docx")
    b.h1("Routine Tasks")
    b.bullets(["Monitor container health", "Rotate secrets", "Apply migrations", "Backup database", "Review error logs"])
    b.h1("Troubleshooting")
    b.table(["Symptom", "Check"], [
        ("502 Bad Gateway", "backend container healthy? nginx upstream"),
        ("Login fails", "Redis up? user is_active"),
        ("Empty coordinator KPIs", "missions.coordinator assignment"),
        ("PgAdmin auth error", "password volunteer_pass"),
    ])
    b.h1("Disaster Recovery")
    b.numbered(["Restore Postgres dump", "Recreate containers", "Verify seed roles", "Smoke test login+mission apply"])
    finish(b, out)
    for title, fid, fname in [
        ("Troubleshooting Guide", "PANAH-MNT-TS-001", "Troubleshooting.docx"),
        ("Monitoring Guide", "PANAH-MNT-MON-001", "Monitoring.docx"),
        ("Logging Guide", "PANAH-MNT-LOG-001", "Logging.docx"),
        ("Disaster Recovery", "PANAH-MNT-DR-001", "Disaster_Recovery.docx"),
    ]:
        b, out = start(title, fid, "16_Maintenance", fname)
        b.h1(title)
        b.p(f"Operational guidance: {title}.")
        finish(b, out)

    b, out = start("Project Management Pack", "PANAH-PM-001", "17_ProjectManagement", "Project_Management_Pack.docx")
    b.h1("WBS")
    b.numbered(["1 Project Mgmt", "2 Requirements", "3 Architecture", "4 Backend", "5 Frontend", "6 Security", "7 Test", "8 Deploy", "9 Documentation"])
    b.h1("Milestones")
    b.table(["ID", "Milestone"], [("M1", "Foundation"), ("M2", "Core ops"), ("M3", "Collab"), ("M4", "Role UX"), ("M5", "Release docs")])
    b.h1("Sprint Model")
    b.p("Two-week sprints recommended; backlog prioritized by mission-critical path.")
    b.figure(D("Gantt_Delivery_Phases.png"), "Figure 1 — Gantt phases")
    b.h1("RACI")
    b.table(["Activity", "Sponsor", "Architect", "Dev", "QA"], [
        ("Scope", "A", "C", "I", "I"),
        ("Architecture", "I", "A", "R", "C"),
        ("Implementation", "I", "C", "R", "C"),
        ("UAT", "C", "I", "C", "A/R"),
    ])
    b.h1("Risk Matrix")
    b.p("See Risk Register; high-impact items mitigated via RBAC sync and backups.")
    b.h1("Cost Breakdown (illustrative)")
    b.table(["Category", "Notes"], [
        ("Engineering", "Primary delivery cost"),
        ("Infrastructure", "VPS + managed DB optional"),
        ("Security review", "Periodic"),
        ("Training", "Admin/coordinator workshops"),
    ])
    b.h1("Change Management")
    b.numbered(["Submit change request", "Impact analysis", "Sponsor approval", "Implement + document", "Notify users"])
    finish(b, out)

    for title, fid, fname in [
        ("WBS", "PANAH-PM-WBS-001", "WBS.docx"),
        ("Milestones", "PANAH-PM-MS-001", "Milestones.docx"),
        ("Sprint Plan", "PANAH-PM-SP-001", "Sprint_Plan.docx"),
        ("Gantt Chart", "PANAH-PM-GC-001", "Gantt_Chart.docx"),
        ("RACI Matrix", "PANAH-PM-RACI-001", "RACI_Matrix.docx"),
        ("Risk Matrix", "PANAH-PM-RM-001", "Risk_Matrix.docx"),
        ("Cost Breakdown", "PANAH-PM-CB-001", "Cost_Breakdown.docx"),
        ("Change Management", "PANAH-PM-CM-001", "Change_Management.docx"),
    ]:
        b, out = start(title, fid, "17_ProjectManagement", fname)
        b.h1(title)
        b.p(f"Project management artifact: {title}.")
        if "Gantt" in title:
            b.figure(D("Gantt_Delivery_Phases.png"), "Figure 1 — Gantt")
        finish(b, out)

    # Template
    b, out = start("Document Template", "PANAH-TPL-001", "Templates", "Document_Template.docx")
    b.h1("How to Use")
    b.p("Duplicate this structure for future controlled documents. Keep Document ID, version, and RTM links updated.")
    finish(b, out)


def main():
    print("Generating diagrams...")
    generate_all_diagrams()
    print("Generating 01_Project...")
    gen_01()
    print("Generating 02_Requirements...")
    gen_02()
    print("Generating 03_Analysis...")
    gen_03()
    print("Generating 04_Architecture...")
    gen_04()
    print("Generating 05_Database...")
    gen_05()
    print("Generating 06_API...")
    gen_06()
    print("Generating 07-12...")
    gen_07_to_12()
    print("Generating 13-17...")
    gen_13_17()
    # inventory
    docx_files = list(DOCS.rglob("*.docx"))
    png_files = list(DIAG.glob("*.png")) + list(IMG.glob("*.png"))
    print(f"DONE: {len(docx_files)} DOCX, {len(png_files)} PNG assets")


if __name__ == "__main__":
    main()
