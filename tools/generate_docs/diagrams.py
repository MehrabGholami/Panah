"""Generate architecture and process diagrams as SVG + PNG for DOCS/Diagrams."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[2]
DIAG = ROOT / "DOCS" / "Diagrams"
IMG = ROOT / "DOCS" / "Images"


def _font(size=16, bold=False):
    candidates = [
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/calibri.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    ]
    for c in candidates:
        p = Path(c)
        if p.exists():
            try:
                return ImageFont.truetype(str(p), size)
            except Exception:
                pass
    return ImageFont.load_default()


def _save_pair(name: str, img: Image.Image, svg_content: str):
    DIAG.mkdir(parents=True, exist_ok=True)
    png = DIAG / f"{name}.png"
    svg = DIAG / f"{name}.svg"
    img.save(png, "PNG")
    svg.write_text(svg_content, encoding="utf-8")
    return png, svg


def _box(draw, xy, text, fill, font, outline="#0F172A"):
    x1, y1, x2, y2 = xy
    draw.rounded_rectangle(xy, radius=12, fill=fill, outline=outline, width=2)
    # center text
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = x1 + (x2 - x1 - tw) / 2
    ty = y1 + (y2 - y1 - th) / 2
    draw.text((tx, ty), text, fill="#0F172A", font=font)


def _arrow(draw, start, end, color="#334155"):
    draw.line([start, end], fill=color, width=3)
    # simple arrow head
    x2, y2 = end
    draw.polygon([(x2, y2), (x2 - 8, y2 - 6), (x2 - 8, y2 + 6)], fill=color)


def make_c4_context():
    w, h = 1100, 700
    img = Image.new("RGB", (w, h), "#F8FAFC")
    d = ImageDraw.Draw(img)
    title_f = _font(22)
    f = _font(15)
    d.text((40, 24), "C4 Level 1 — System Context: Panah Platform", fill="#0F172A", font=title_f)

    _box(d, (80, 280, 280, 380), "Volunteer\nUsers", "#A7F3D0", f)
    _box(d, (420, 250, 700, 410), "Panah\nCrisis Management\nPlatform", "#67E8F9", _font(16))
    _box(d, (840, 180, 1040, 280), "Admin /\nCoordinator", "#C7D2FE", f)
    _box(d, (840, 360, 1040, 460), "Email\n(SMTP/Mailhog)", "#FDE68A", f)
    _box(d, (420, 520, 700, 620), "PostgreSQL +\nRedis", "#FBCFE8", f)

    _arrow(d, (280, 330), (420, 330))
    _arrow(d, (840, 230), (700, 290))
    _arrow(d, (700, 360), (840, 400))
    _arrow(d, (560, 410), (560, 520))

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}">
  <rect width="100%" height="100%" fill="#F8FAFC"/>
  <text x="40" y="40" font-size="22" font-family="Arial" fill="#0F172A">C4 Level 1 — System Context: Panah Platform</text>
  <rect x="80" y="280" width="200" height="100" rx="12" fill="#A7F3D0" stroke="#0F172A"/>
  <text x="130" y="335" font-size="16">Volunteer Users</text>
  <rect x="420" y="250" width="280" height="160" rx="12" fill="#67E8F9" stroke="#0F172A"/>
  <text x="470" y="330" font-size="16">Panah Platform</text>
  <rect x="840" y="180" width="200" height="100" rx="12" fill="#C7D2FE" stroke="#0F172A"/>
  <text x="870" y="235" font-size="16">Admin/Coordinator</text>
  <rect x="840" y="360" width="200" height="100" rx="12" fill="#FDE68A" stroke="#0F172A"/>
  <text x="880" y="415" font-size="16">Email SMTP</text>
  <rect x="420" y="520" width="280" height="100" rx="12" fill="#FBCFE8" stroke="#0F172A"/>
  <text x="470" y="575" font-size="16">PostgreSQL + Redis</text>
</svg>'''
    return _save_pair("C4_Context_Panah", img, svg)


def make_c4_container():
    w, h = 1200, 760
    img = Image.new("RGB", (w, h), "#F8FAFC")
    d = ImageDraw.Draw(img)
    d.text((40, 20), "C4 Level 2 — Containers", fill="#0F172A", font=_font(22))
    f = _font(14)
    boxes = [
        ((40, 100, 260, 200), "React SPA\n(Vite + MUI)", "#67E8F9"),
        ((320, 100, 560, 200), "Nginx\nReverse Proxy", "#C7D2FE"),
        ((620, 80, 900, 220), "Django API\nDRF + JWT", "#A7F3D0"),
        ((940, 80, 1160, 180), "Celery\nWorker/Beat", "#FDE68A"),
        ((620, 280, 900, 380), "PostgreSQL 17", "#FBCFE8"),
        ((940, 240, 1160, 340), "Redis 7", "#FDBA74"),
        ((320, 280, 560, 380), "Static / Media", "#E2E8F0"),
        ((40, 280, 260, 380), "PgAdmin /\nMailhog (dev)", "#DDD6FE"),
    ]
    for xy, text, fill in boxes:
        _box(d, xy, text, fill, f)
    _arrow(d, (260, 150), (320, 150))
    _arrow(d, (560, 150), (620, 150))
    _arrow(d, (900, 150), (940, 150))
    _arrow(d, (760, 220), (760, 280))
    _arrow(d, (900, 300), (940, 300))
    svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760"><rect width="100%" height="100%" fill="#F8FAFC"/><text x="40" y="40" font-size="22">C4 Level 2 — Containers</text></svg>'
    return _save_pair("C4_Container_Panah", img, svg)


def make_deployment():
    w, h = 1100, 720
    img = Image.new("RGB", (w, h), "#0F172A")
    d = ImageDraw.Draw(img)
    d.text((40, 24), "Deployment Diagram — Docker Compose", fill="#F8FAFC", font=_font(20))
    f = _font(13)
    services = [
        (60, 100, "nginx:80/443"),
        (300, 100, "frontend"),
        (540, 100, "backend"),
        (780, 100, "celery"),
        (60, 280, "postgres"),
        (300, 280, "redis"),
        (540, 280, "celery-beat"),
        (780, 280, "mailhog"),
        (60, 460, "pgadmin:5050"),
        (300, 460, "volumes"),
        (540, 460, "network bridge"),
    ]
    for x, y, label in services:
        _box(d, (x, y, x + 200, y + 80), label, "#1E293B", f, outline="#22D3EE")
        # fix text color for dark bg - redraw text light
    # Re-draw labels light on dark boxes
    img2 = Image.new("RGB", (w, h), "#0F172A")
    d2 = ImageDraw.Draw(img2)
    d2.text((40, 24), "Deployment Diagram — Docker Compose", fill="#F8FAFC", font=_font(20))
    for x, y, label in services:
        d2.rounded_rectangle((x, y, x + 200, y + 80), radius=12, fill="#1E293B", outline="#22D3EE", width=2)
        bbox = d2.textbbox((0, 0), label, font=f)
        tw = bbox[2] - bbox[0]
        d2.text((x + (200 - tw) / 2, y + 30), label, fill="#E2E8F0", font=f)
    svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="720"><rect width="100%" height="100%" fill="#0F172A"/></svg>'
    return _save_pair("Deployment_Docker", img2, svg)


def make_erd():
    w, h = 1300, 900
    img = Image.new("RGB", (w, h), "#F8FAFC")
    d = ImageDraw.Draw(img)
    d.text((40, 20), "Logical ER Diagram — Core Domain", fill="#0F172A", font=_font(20))
    f = _font(12)
    entities = [
        (40, 80, "User"),
        (280, 80, "Role / Permission"),
        (520, 80, "VolunteerProfile"),
        (760, 80, "Skill"),
        (40, 280, "Disaster"),
        (280, 280, "Mission"),
        (520, 280, "MissionApplication"),
        (760, 280, "Assignment"),
        (40, 480, "MissionReport"),
        (280, 480, "Ticket"),
        (520, 480, "Notification"),
        (760, 480, "AuditLog"),
    ]
    for x, y, name in entities:
        _box(d, (x, y, x + 200, y + 90), name, "#E0F2FE", f)
    # relations
    _arrow(d, (240, 125), (280, 125))
    _arrow(d, (480, 125), (520, 125))
    _arrow(d, (720, 125), (760, 125))
    _arrow(d, (140, 170), (140, 280))
    _arrow(d, (240, 325), (280, 325))
    _arrow(d, (480, 325), (520, 325))
    _arrow(d, (720, 325), (760, 325))
    svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1300" height="900"><rect width="100%" height="100%" fill="#F8FAFC"/><text x="40" y="40" font-size="20">Logical ER Diagram</text></svg>'
    return _save_pair("ERD_Logical_Core", img, svg)


def make_sequence_apply():
    w, h = 1100, 700
    img = Image.new("RGB", (w, h), "#FFFFFF")
    d = ImageDraw.Draw(img)
    d.text((30, 20), "Sequence — Mission Application Approve", fill="#0F172A", font=_font(18))
    actors = ["Volunteer", "API", "MissionService", "AssignmentService", "Notify"]
    xs = [100, 300, 520, 760, 980]
    f = _font(12)
    for x, a in zip(xs, actors):
        d.rectangle((x - 50, 70, x + 50, 110), outline="#0F172A", fill="#E0F2FE")
        bbox = d.textbbox((0, 0), a, font=f)
        tw = bbox[2] - bbox[0]
        d.text((x - tw / 2, 82), a, fill="#0F172A", font=f)
        d.line((x, 110, x, 640), fill="#94A3B8", width=2)
    # messages
    msgs = [
        (120, 160, 300, "POST /apply"),
        (300, 210, 520, "apply()"),
        (520, 260, 300, "created submitted"),
        (520, 310, 980, "notify staff"),
        (300, 400, 520, "approve_application"),
        (520, 450, 760, "assign()"),
        (520, 520, 980, "notify volunteer"),
    ]
    for x1, y, x2, label in msgs:
        d.line((x1, y, x2, y), fill="#0891B2", width=2)
        d.text((min(x1, x2) + 10, y - 18), label, fill="#0F172A", font=f)
    svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="700"><rect width="100%" height="100%" fill="#FFFFFF"/></svg>'
    return _save_pair("Sequence_Mission_Apply_Approve", img, svg)


def make_activity_mission_lifecycle():
    w, h = 1000, 780
    img = Image.new("RGB", (w, h), "#F8FAFC")
    d = ImageDraw.Draw(img)
    d.text((30, 20), "Activity — Mission Lifecycle", fill="#0F172A", font=_font(18))
    f = _font(13)
    steps = ["Draft", "Publish", "Visible+Apply", "Applications", "Assign", "In Progress", "Complete", "Close"]
    y = 80
    for i, s in enumerate(steps):
        _box(d, (350, y, 650, y + 55), s, "#A5F3FC", f)
        if i < len(steps) - 1:
            _arrow(d, (500, y + 55), (500, y + 75))
        y += 80
    svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="780"><rect width="100%" height="100%" fill="#F8FAFC"/></svg>'
    return _save_pair("Activity_Mission_Lifecycle", img, svg)


def make_state_mission():
    w, h = 1000, 520
    img = Image.new("RGB", (w, h), "#FFFFFF")
    d = ImageDraw.Draw(img)
    d.text((30, 20), "State Machine — Mission Status", fill="#0F172A", font=_font(18))
    f = _font(12)
    states = [
        (60, 200, "draft"),
        (250, 200, "published"),
        (440, 200, "in_progress"),
        (630, 200, "completed"),
        (820, 200, "closed"),
    ]
    for x, y, name in states:
        _box(d, (x, y, x + 140, y + 70), name, "#C7D2FE", f)
    for i in range(len(states) - 1):
        x1 = states[i][0] + 140
        x2 = states[i + 1][0]
        y = 235
        _arrow(d, (x1, y), (x2, y))
    # reopen
    d.line((890, 200, 890, 120, 320, 120, 320, 200), fill="#F59E0B", width=2)
    d.text((500, 100), "reopen", fill="#B45309", font=f)
    svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="520"><rect width="100%" height="100%" fill="#FFFFFF"/></svg>'
    return _save_pair("State_Mission_Status", img, svg)


def make_rbac():
    w, h = 1000, 560
    img = Image.new("RGB", (w, h), "#F8FAFC")
    d = ImageDraw.Draw(img)
    d.text((30, 20), "RBAC Model — Roles & Permission Binding", fill="#0F172A", font=_font(18))
    f = _font(13)
    _box(d, (80, 120, 280, 220), "User", "#A7F3D0", f)
    _box(d, (380, 120, 580, 220), "UserRole", "#FDE68A", f)
    _box(d, (680, 120, 880, 220), "Role", "#C7D2FE", f)
    _box(d, (380, 320, 580, 420), "RolePermission", "#FDBA74", f)
    _box(d, (680, 320, 880, 420), "Permission", "#FBCFE8", f)
    _arrow(d, (280, 170), (380, 170))
    _arrow(d, (580, 170), (680, 170))
    _arrow(d, (780, 220), (780, 320))
    _arrow(d, (580, 370), (680, 370))
    _arrow(d, (480, 220), (480, 320))
    svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="560"><rect width="100%" height="100%" fill="#F8FAFC"/></svg>'
    return _save_pair("RBAC_Model", img, svg)


def make_jwt_flow():
    w, h = 1000, 600
    img = Image.new("RGB", (w, h), "#FFFFFF")
    d = ImageDraw.Draw(img)
    d.text((30, 20), "JWT Authentication Flow", fill="#0F172A", font=_font(18))
    f = _font(12)
    steps = [
        (80, 100, "1. Login\ncredentials"),
        (320, 100, "2. Issue\naccess+refresh"),
        (560, 100, "3. API call\nBearer token"),
        (800, 100, "4. Redis JWT\nvalidate"),
        (200, 320, "5. Refresh\nrotate+blacklist"),
        (520, 320, "6. Logout\nblacklist refresh"),
    ]
    for x, y, t in steps:
        _box(d, (x, y, x + 180, y + 90), t, "#E0F2FE", f)
    svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="600"><rect width="100%" height="100%" fill="#FFFFFF"/></svg>'
    return _save_pair("JWT_Auth_Flow", img, svg)


def make_nav_map():
    w, h = 1100, 700
    img = Image.new("RGB", (w, h), "#F8FAFC")
    d = ImageDraw.Draw(img)
    d.text((30, 20), "Navigation Map by Role", fill="#0F172A", font=_font(18))
    f = _font(12)
    _box(d, (40, 80, 340, 620), "Volunteer\n• Dashboard\n• Available Missions\n• My Missions\n• Tickets\n• Notifications\n• Profile", "#A7F3D0", f)
    _box(d, (380, 80, 700, 620), "Coordinator\n• Dashboard (scoped)\n• Disasters\n• Missions (mine)\n• Applications inbox\n• Users (view)\n• Reports\n• Tickets\n• Notifications", "#C7D2FE", f)
    _box(d, (740, 80, 1060, 620), "Admin\n• All Coordinator\n• Roles\n• Audit Logs\n• User manage\n• Org-wide KPIs", "#FDE68A", f)
    svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="700"><rect width="100%" height="100%" fill="#F8FAFC"/></svg>'
    return _save_pair("UI_Navigation_Map", img, svg)


def make_layered_arch():
    w, h = 900, 700
    img = Image.new("RGB", (w, h), "#FFFFFF")
    d = ImageDraw.Draw(img)
    d.text((30, 20), "Layered / Clean Architecture (Backend)", fill="#0F172A", font=_font(18))
    f = _font(14)
    layers = [
        (80, 80, "API Layer — views, serializers, urls"),
        (80, 180, "Application Services — use cases"),
        (80, 280, "Domain — enums, exceptions, rules"),
        (80, 380, "Infrastructure — repositories, models"),
        (80, 480, "Cross-cutting — auth, audit, notifications"),
    ]
    colors = ["#67E8F9", "#A7F3D0", "#C7D2FE", "#FDE68A", "#FBCFE8"]
    for (x, y, t), c in zip(layers, colors):
        _box(d, (x, y, 820, y + 70), t, c, f)
    svg = '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700"><rect width="100%" height="100%" fill="#FFFFFF"/></svg>'
    return _save_pair("Layered_Clean_Architecture", img, svg)


def make_dfd():
    w, h = 1100, 650
    img = Image.new("RGB", (w, h), "#F8FAFC")
    d = ImageDraw.Draw(img)
    d.text((30, 20), "Data Flow Diagram — Level 0", fill="#0F172A", font=_font(18))
    f = _font(13)
    _box(d, (40, 260, 220, 360), "External\nActors", "#A7F3D0", f)
    _box(d, (400, 220, 700, 400), "Panah System\nProcess", "#67E8F9", f)
    _box(d, (860, 180, 1060, 280), "Mission DB", "#FBCFE8", f)
    _box(d, (860, 340, 1060, 440), "Notify Store", "#FDE68A", f)
    _arrow(d, (220, 310), (400, 310))
    _arrow(d, (700, 260), (860, 230))
    _arrow(d, (700, 360), (860, 380))
    svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="650"><rect width="100%" height="100%" fill="#F8FAFC"/></svg>'
    return _save_pair("DFD_Level0", img, svg)


def make_bpmn_register():
    w, h = 1100, 420
    img = Image.new("RGB", (w, h), "#FFFFFF")
    d = ImageDraw.Draw(img)
    d.text((30, 20), "BPMN — Volunteer Registration", fill="#0F172A", font=_font(18))
    f = _font(12)
    nodes = ["Start", "Submit form", "Validate", "Create user+\nprofile+skills", "Notify", "End"]
    x = 40
    for i, n in enumerate(nodes):
        _box(d, (x, 160, x + 140, 250), n, "#E0F2FE", f)
        if i < len(nodes) - 1:
            _arrow(d, (x + 140, 205), (x + 170, 205))
        x += 170
    svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="420"><rect width="100%" height="100%" fill="#FFFFFF"/></svg>'
    return _save_pair("BPMN_Volunteer_Registration", img, svg)


def make_component():
    w, h = 1100, 700
    img = Image.new("RGB", (w, h), "#F8FAFC")
    d = ImageDraw.Draw(img)
    d.text((30, 20), "C4 Level 3 — Backend Components", fill="#0F172A", font=_font(18))
    f = _font(12)
    comps = [
        (40, 100, "Auth API"),
        (220, 100, "Accounts"),
        (400, 100, "Volunteers"),
        (580, 100, "Disasters"),
        (760, 100, "Missions"),
        (940, 100, "Assignments"),
        (40, 280, "Reports"),
        (220, 280, "Tickets"),
        (400, 280, "Notifications"),
        (580, 280, "Dashboard"),
        (760, 280, "Audit"),
        (940, 280, "Common"),
        (300, 460, "PermissionService"),
        (520, 460, "NotificationDispatcher"),
        (740, 460, "AuditService"),
    ]
    for x, y, n in comps:
        _box(d, (x, y, x + 150, y + 80), n, "#CFFAFE", f)
    svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="700"><rect width="100%" height="100%" fill="#F8FAFC"/></svg>'
    return _save_pair("C4_Component_Backend", img, svg)


def make_class_domain():
    w, h = 1100, 650
    img = Image.new("RGB", (w, h), "#FFFFFF")
    d = ImageDraw.Draw(img)
    d.text((30, 20), "Class Diagram — Mission Domain (simplified)", fill="#0F172A", font=_font(18))
    f = _font(11)
    classes = [
        (60, 100, "Mission\n+status\n+priority\n+coordinator"),
        (360, 100, "MissionApplication\n+status\n+message"),
        (660, 100, "Assignment\n+status"),
        (360, 360, "VolunteerProfile\n+national_id\n+status"),
        (60, 360, "Disaster\n+status\n+type"),
    ]
    for x, y, t in classes:
        _box(d, (x, y, x + 240, y + 120), t, "#EEF2FF", f)
    _arrow(d, (300, 160), (360, 160))
    _arrow(d, (600, 160), (660, 160))
    _arrow(d, (480, 220), (480, 360))
    _arrow(d, (180, 220), (180, 360))
    svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="650"><rect width="100%" height="100%" fill="#FFFFFF"/></svg>'
    return _save_pair("Class_Mission_Domain", img, svg)


def make_mindmap():
    w, h = 1100, 700
    img = Image.new("RGB", (w, h), "#F8FAFC")
    d = ImageDraw.Draw(img)
    d.text((30, 20), "Mind Map — Panah Capability Areas", fill="#0F172A", font=_font(18))
    f = _font(12)
    _box(d, (420, 300, 680, 400), "Panah Platform", "#67E8F9", _font(14))
    leaves = [
        (80, 80, "Crisis Mgmt"),
        (420, 60, "Missions"),
        (760, 80, "Volunteers"),
        (80, 520, "Reports"),
        (420, 560, "Comms"),
        (760, 520, "Governance"),
    ]
    for x, y, t in leaves:
        _box(d, (x, y, x + 180, y + 70), t, "#E0F2FE", f)
        _arrow(d, (550, 350), (x + 90, y + 70 if y < 300 else y))
    svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="700"><rect width="100%" height="100%" fill="#F8FAFC"/></svg>'
    return _save_pair("MindMap_Capabilities", img, svg)


def make_ui_mock_dashboard():
    """Simple UI mock illustration saved to Images/."""
    IMG.mkdir(parents=True, exist_ok=True)
    w, h = 1200, 720
    img = Image.new("RGB", (w, h), "#0B1220")
    d = ImageDraw.Draw(img)
    # sidebar
    d.rectangle((0, 0, 220, h), fill="#111827")
    d.text((24, 28), "پناه", fill="#22D3EE", font=_font(22))
    for i, label in enumerate(["Dashboard", "Missions", "Applications", "Reports", "Tickets"]):
        y = 100 + i * 48
        d.rounded_rectangle((16, y, 204, y + 36), radius=8, fill="#1F2937")
        d.text((32, y + 8), label, fill="#E5E7EB", font=_font(13))
    # cards
    d.text((260, 40), "Coordinator Dashboard", fill="#F9FAFB", font=_font(22))
    colors = ["#164E63", "#312E81", "#065F46", "#7C2D12"]
    labels = ["My Missions", "Pending Apps", "Assignments", "Unread"]
    for i, (c, lab) in enumerate(zip(colors, labels)):
        x = 260 + (i % 4) * 220
        y = 120
        d.rounded_rectangle((x, y, x + 200, y + 110), radius=14, fill=c)
        d.text((x + 16, y + 20), lab, fill="#E5E7EB", font=_font(13))
        d.text((x + 16, y + 55), "—", fill="#F9FAFB", font=_font(28))
    path = IMG / "UI_Mock_Coordinator_Dashboard.png"
    img.save(path, "PNG")
    return path


def make_gantt_png():
    w, h = 1100, 500
    img = Image.new("RGB", (w, h), "#FFFFFF")
    d = ImageDraw.Draw(img)
    d.text((30, 20), "Gantt — Delivery Phases (illustrative)", fill="#0F172A", font=_font(18))
    f = _font(12)
    phases = [
        ("Discovery & Requirements", 80, 200, "#67E8F9"),
        ("Architecture & DB", 180, 180, "#A7F3D0"),
        ("Backend Core", 280, 280, "#C7D2FE"),
        ("Frontend UI", 360, 280, "#FDE68A"),
        ("Integration & Security", 520, 200, "#FBCFE8"),
        ("UAT & Hardening", 680, 160, "#FDBA74"),
        ("Deployment", 800, 120, "#DDD6FE"),
    ]
    y = 80
    for name, x, width, color in phases:
        d.text((30, y + 8), name, fill="#0F172A", font=f)
        d.rounded_rectangle((280, y, 280 + width, y + 28), radius=6, fill=color, outline="#0F172A")
        y += 50
    svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="500"><rect width="100%" height="100%" fill="#FFFFFF"/></svg>'
    return _save_pair("Gantt_Delivery_Phases", img, svg)


def generate_all_diagrams():
    DIAG.mkdir(parents=True, exist_ok=True)
    IMG.mkdir(parents=True, exist_ok=True)
    makers = [
        make_c4_context,
        make_c4_container,
        make_c4_container,
        make_deployment,
        make_erd,
        make_sequence_apply,
        make_activity_mission_lifecycle,
        make_state_mission,
        make_rbac,
        make_jwt_flow,
        make_nav_map,
        make_layered_arch,
        make_dfd,
        make_bpmn_register,
        make_component,
        make_class_domain,
        make_mindmap,
        make_gantt_png,
    ]
    # unique makers (remove dup)
    seen = set()
    results = []
    for fn in [
        make_c4_context,
        make_c4_container,
        make_deployment,
        make_erd,
        make_sequence_apply,
        make_activity_mission_lifecycle,
        make_state_mission,
        make_rbac,
        make_jwt_flow,
        make_nav_map,
        make_layered_arch,
        make_dfd,
        make_bpmn_register,
        make_component,
        make_class_domain,
        make_mindmap,
        make_gantt_png,
    ]:
        if fn.__name__ in seen:
            continue
        seen.add(fn.__name__)
        results.append(fn())
    make_ui_mock_dashboard()
    # extra UI mocks
    for name, title in [
        ("UI_Mock_Login", "Login"),
        ("UI_Mock_Missions", "Missions List"),
        ("UI_Mock_Tickets", "Tickets"),
    ]:
        im = Image.new("RGB", (1000, 600), "#0B1220")
        dr = ImageDraw.Draw(im)
        dr.rounded_rectangle((200, 120, 800, 480), radius=16, fill="#111827", outline="#22D3EE", width=2)
        dr.text((420, 280), title, fill="#F8FAFC", font=_font(24))
        im.save(IMG / f"{name}.png", "PNG")
    return results


if __name__ == "__main__":
    out = generate_all_diagrams()
    print(f"Generated {len(out)} diagram pairs + UI mocks")
