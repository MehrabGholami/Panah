# -*- coding: utf-8 -*-
"""PNG diagrams for VDOC/images and embedding in xc.docx."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
IMG = ROOT / "VDOC" / "images"


def _font(size=18):
    for p in (
        r"C:\Windows\Fonts\tahoma.ttf",
        r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\BNAZANIN.TTF",
    ):
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def _box(d, r, text, fill, size=16):
    d.rounded_rectangle(r, radius=14, fill=fill, outline="#334155", width=2)
    f = _font(size)
    lines = text.split("\n")
    y = r[1] + 14
    for line in lines:
        bb = d.textbbox((0, 0), line, font=f)
        x = r[0] + (r[2] - r[0] - (bb[2] - bb[0])) / 2
        d.text((x, y), line, font=f, fill="#0F172A")
        y += bb[3] - bb[1] + 4


def _arrow(d, a, b):
    d.line([a, b], fill="#475569", width=3)
    x, y = b
    d.polygon([(x, y), (x - 10, y - 6), (x - 10, y + 6)], fill="#475569")


def generate_all(out: Path | None = None) -> dict[str, Path]:
    out = out or IMG
    out.mkdir(parents=True, exist_ok=True)
    paths: dict[str, Path] = {}

    # Context
    im = Image.new("RGB", (1400, 800), "#F8FAFC")
    d = ImageDraw.Draw(im)
    d.text((40, 24), "Context Diagram — Panah Platform", font=_font(28), fill="#0F172A")
    _box(d, (70, 300, 280, 450), "Volunteers\nCitizens", "#D1FAE5")
    _box(d, (70, 520, 280, 670), "Admin &\nCoordinators", "#DDD6FE")
    _box(d, (480, 280, 900, 520), "Panah System\nCrisis · Mission · Application\nAssignment · Report · Ticket", "#BAE6FD", 18)
    _box(d, (1080, 180, 1320, 300), "Email\nMailhog/SMTP", "#FEF3C7")
    _box(d, (1080, 360, 1320, 480), "PostgreSQL\n+ Redis", "#FCE7F3")
    _box(d, (1080, 540, 1320, 660), "Audit &\nNotifications", "#FFEDD5")
    _arrow(d, (280, 375), (480, 380))
    _arrow(d, (280, 595), (480, 450))
    _arrow(d, (900, 350), (1080, 240))
    _arrow(d, (900, 400), (1080, 420))
    _arrow(d, (900, 450), (1080, 600))
    p = out / "fig-01-context.png"
    im.save(p)
    paths["context"] = p

    # C4 Container
    im = Image.new("RGB", (1500, 900), "#FFFFFF")
    d = ImageDraw.Draw(im)
    d.text((40, 24), "C4 Container Diagram — Panah MVP", font=_font(28), fill="#0F172A")
    items = [
        ((60, 120, 300, 250), "React SPA\nMUI · RTL · Query", "#DBEAFE"),
        ((360, 120, 600, 250), "Nginx\nTLS · Reverse Proxy", "#FEF3C7"),
        ((680, 80, 1000, 300), "Django + DRF\nJWT · RBAC · Services", "#CFFAFE"),
        ((1080, 60, 1420, 180), "PostgreSQL 17", "#FCE7F3"),
        ((1080, 220, 1420, 340), "Redis 7\nCache · Broker", "#FEE2E2"),
        ((1080, 400, 1420, 520), "Celery Worker\n+ Beat", "#EDE9FE"),
        ((680, 360, 1000, 500), "OpenAPI\n/api/docs/", "#DCFCE7"),
        ((360, 360, 600, 500), "Mailhog\nDev Email", "#FFEDD5"),
    ]
    for r, t, c in items:
        _box(d, r, t, c)
    _arrow(d, (300, 185), (360, 185))
    _arrow(d, (600, 185), (680, 185))
    _arrow(d, (1000, 140), (1080, 120))
    _arrow(d, (1000, 200), (1080, 280))
    _arrow(d, (840, 300), (840, 360))
    _arrow(d, (1000, 430), (1080, 460))
    p = out / "fig-02-c4-container.png"
    im.save(p)
    paths["c4"] = p

    # Deployment / Docker
    im = Image.new("RGB", (1500, 820), "#F8FAFC")
    d = ImageDraw.Draw(im)
    d.text((40, 24), "Docker Compose Deployment Topology", font=_font(28), fill="#0F172A")
    services = [
        ("nginx", 80),
        ("frontend", 300),
        ("backend", 520),
        ("celery", 740),
        ("postgres", 960),
        ("redis", 1180),
    ]
    for name, x in services:
        _box(d, (x, 280, x + 180, 420), name, "#E0F2FE", 17)
    d.rounded_rectangle((50, 200, 1400, 520), radius=20, outline="#0E7490", width=3)
    d.text((60, 210), "docker-compose network: volunteer-management", font=_font(16), fill="#0E7490")
    _box(d, (200, 600, 480, 740), "Host OS\nWindows / Linux", "#FEF3C7")
    _box(d, (560, 600, 900, 740), "Volumes\npostgres_data · media", "#FCE7F3")
    _box(d, (980, 600, 1320, 740), "Env\n.env secrets", "#FEE2E2")
    p = out / "fig-03-docker.png"
    im.save(p)
    paths["docker"] = p

    # Mission lifecycle
    im = Image.new("RGB", (1500, 520), "#FFFFFF")
    d = ImageDraw.Draw(im)
    d.text((40, 20), "Mission Lifecycle State Machine", font=_font(26), fill="#0F172A")
    states = ["draft", "published", "in_progress", "completed", "closed"]
    colors = ["#FEF3C7", "#BAE6FD", "#A5F3FC", "#BBF7D0", "#E2E8F0"]
    x = 40
    for i, s in enumerate(states):
        _box(d, (x, 180, x + 200, 300), s, colors[i], 18)
        if i < len(states) - 1:
            _arrow(d, (x + 200, 240), (x + 240, 240))
        x += 280
    d.text((40, 380), "reopen: closed → published", font=_font(16), fill="#334155")
    p = out / "fig-04-mission-states.png"
    im.save(p)
    paths["mission_states"] = p

    # Use case overview
    im = Image.new("RGB", (1400, 900), "#F8FAFC")
    d = ImageDraw.Draw(im)
    d.text((40, 20), "Use Case Overview — Core Actors", font=_font(26), fill="#0F172A")
    _box(d, (40, 200, 220, 340), "Volunteer", "#D1FAE5")
    _box(d, (40, 420, 220, 560), "Coordinator", "#DDD6FE")
    _box(d, (40, 640, 220, 780), "Admin", "#FECACA")
    cases = [
        (400, 120, "Register / Login"),
        (400, 220, "Apply to Mission"),
        (400, 320, "Accept Assignment"),
        (400, 420, "Create Disaster"),
        (400, 520, "Manage Mission"),
        (400, 620, "Review Application"),
        (400, 720, "Audit / Roles"),
        (900, 220, "Submit Report"),
        (900, 420, "Tickets"),
        (900, 620, "Dashboard KPIs"),
    ]
    for x, y, t in cases:
        _box(d, (x, y, x + 320, y + 70), t, "#E0F2FE", 15)
    p = out / "fig-05-usecase.png"
    im.save(p)
    paths["usecase"] = p

    # ER overview
    im = Image.new("RGB", (1500, 900), "#FFFFFF")
    d = ImageDraw.Draw(im)
    d.text((40, 20), "Logical Data Model — Core Entities", font=_font(26), fill="#0F172A")
    ents = [
        ((80, 100, 320, 220), "User\naccounts_user"),
        ((400, 100, 640, 220), "Role / Permission"),
        ((80, 300, 320, 420), "VolunteerProfile"),
        ((400, 300, 640, 420), "Skill"),
        ((800, 100, 1100, 220), "Disaster"),
        ((800, 300, 1100, 420), "Mission"),
        ((800, 520, 1100, 640), "MissionApplication"),
        ((1160, 300, 1440, 420), "Assignment"),
        ((400, 520, 640, 640), "MissionReport"),
        ((80, 520, 320, 640), "Notification"),
        ((1160, 520, 1440, 640), "Ticket"),
        ((800, 720, 1100, 840), "AuditLog"),
    ]
    for r, t in ents:
        _box(d, r, t, "#DBEAFE", 15)
    p = out / "fig-06-erd.png"
    im.save(p)
    paths["erd"] = p

    # Security / Auth
    im = Image.new("RGB", (1400, 700), "#F8FAFC")
    d = ImageDraw.Draw(im)
    d.text((40, 20), "JWT Authentication & RBAC Flow", font=_font(26), fill="#0F172A")
    steps = ["Login", "Access+Refresh", "API Bearer", "Permission\nCheck", "Service", "Audit"]
    cols = ["#DBEAFE", "#DCFCE7", "#EDE9FE", "#FEF3C7", "#CFFAFE", "#FFEDD5"]
    x = 40
    for i, s in enumerate(steps):
        _box(d, (x, 250, x + 180, 400), s, cols[i], 15)
        if i < 5:
            _arrow(d, (x + 180, 325), (x + 210, 325))
        x += 220
    p = out / "fig-07-auth.png"
    im.save(p)
    paths["auth"] = p

    # BPMN-like swimlane simplified
    im = Image.new("RGB", (1500, 850), "#FFFFFF")
    d = ImageDraw.Draw(im)
    d.text((40, 16), "Swimlane — Application Review", font=_font(26), fill="#0F172A")
    for i, (label, y) in enumerate((("Volunteer", 80), ("System", 280), ("Coordinator", 480), ("Assignment", 680))):
        d.rectangle((40, y, 1460, y + 170), outline="#94A3B8", width=2)
        d.text((50, y + 10), label, font=_font(16), fill="#0E7490")
    _box(d, (200, 120, 420, 200), "Apply", "#D1FAE5")
    _box(d, (500, 320, 760, 400), "Notify + Inbox", "#BAE6FD")
    _box(d, (860, 520, 1100, 600), "Approve/Reject\n/Waitlist", "#DDD6FE")
    _box(d, (1160, 720, 1400, 800), "Create\nAssignment", "#FEF3C7")
    _arrow(d, (420, 160), (500, 360))
    _arrow(d, (760, 360), (860, 560))
    _arrow(d, (1100, 560), (1160, 760))
    p = out / "fig-08-swimlane.png"
    im.save(p)
    paths["swimlane"] = p

    # DFD L0
    im = Image.new("RGB", (1200, 700), "#F8FAFC")
    d = ImageDraw.Draw(im)
    d.text((40, 20), "DFD Level 0 — Panah", font=_font(26), fill="#0F172A")
    _box(d, (80, 280, 260, 400), "External\nActors", "#D1FAE5")
    d.ellipse((420, 220, 780, 480), fill="#BAE6FD", outline="#334155", width=2)
    d.text((520, 330), "Panah\nSystem", font=_font(22), fill="#0F172A")
    _box(d, (900, 280, 1120, 400), "Data Stores\nDB + Redis", "#FCE7F3")
    _arrow(d, (260, 340), (420, 340))
    _arrow(d, (780, 340), (900, 340))
    p = out / "fig-09-dfd0.png"
    im.save(p)
    paths["dfd0"] = p

    # Navigation map
    im = Image.new("RGB", (1400, 800), "#FFFFFF")
    d = ImageDraw.Draw(im)
    d.text((40, 20), "Navigation Map — Main Screens", font=_font(26), fill="#0F172A")
    screens = [
        (100, 120, "Landing"),
        (100, 240, "Login/Register"),
        (100, 360, "Dashboard"),
        (450, 120, "Disasters"),
        (450, 240, "Missions"),
        (450, 360, "Volunteers"),
        (450, 480, "My Missions"),
        (800, 120, "Reports"),
        (800, 240, "Tickets"),
        (800, 360, "Notifications"),
        (800, 480, "Profile"),
        (1150, 200, "Admin Users"),
        (1150, 320, "Admin Roles"),
        (1150, 440, "Audit Logs"),
    ]
    for x, y, t in screens:
        _box(d, (x, y, x + 220, y + 70), t, "#E0F2FE", 14)
    p = out / "fig-10-navigation.png"
    im.save(p)
    paths["nav"] = p

    # Architecture layers
    im = Image.new("RGB", (1200, 800), "#F8FAFC")
    d = ImageDraw.Draw(im)
    d.text((40, 20), "Clean / Layered Architecture", font=_font(26), fill="#0F172A")
    layers = [
        (80, 100, "Presentation — React SPA / DRF Serializers & Views", "#DBEAFE"),
        (80, 220, "Application — Domain Services (Mission, Disaster, ...)", "#CFFAFE"),
        (80, 340, "Domain — Enums, Rules, Entities", "#EDE9FE"),
        (80, 460, "Infrastructure — Repositories, ORM, Redis, Celery", "#FEF3C7"),
        (80, 580, "Cross-cutting — AuthZ, Audit, Notifications, Cache", "#FCE7F3"),
    ]
    for y, text, c in ((100, layers[0][2], layers[0][3]),):
        pass
    for x, y, text, c in ((l[0], l[1], l[2], l[3]) for l in layers):
        _box(d, (x, y, 1120, y + 90), text, c, 17)
    p = out / "fig-11-layers.png"
    im.save(p)
    paths["layers"] = p

    # Mind map style modules
    im = Image.new("RGB", (1400, 900), "#FFFFFF")
    d = ImageDraw.Draw(im)
    d.text((40, 20), "Module Mind Map — Panah MVP", font=_font(26), fill="#0F172A")
    d.ellipse((560, 360, 840, 540), fill="#22D3EE", outline="#0F172A", width=2)
    d.text((620, 430), "Panah\nMVP", font=_font(22), fill="#0F172A")
    mods = [
        (100, 80, "Auth"),
        (350, 60, "Disaster"),
        (600, 40, "Mission"),
        (900, 60, "Volunteer"),
        (1150, 100, "Assign"),
        (80, 400, "Report"),
        (80, 650, "Ticket"),
        (350, 720, "Notify"),
        (650, 740, "Dashboard"),
        (950, 700, "Audit"),
        (1200, 450, "Admin"),
        (1150, 650, "Skills"),
    ]
    for x, y, t in mods:
        _box(d, (x, y, x + 160, y + 70), t, "#E0F2FE", 15)
        d.line([(700, 450), (x + 80, y + 35)], fill="#94A3B8", width=2)
    p = out / "fig-12-mindmap.png"
    im.save(p)
    paths["mindmap"] = p

    return paths


if __name__ == "__main__":
    generate_all()
    print("PNG diagrams written to", IMG)
