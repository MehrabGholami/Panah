from __future__ import annotations

from pathlib import Path

from docx import Document
from docx.enum.table import WD_ALIGN_VERTICAL, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(r"c:\Users\Mehrab\Desktop\مدیریت بحران")
OUT = ROOT / "P2.docx"
ASSETS = ROOT / "P2_assets"
ASSETS.mkdir(exist_ok=True)
FONT_FILE = next(
    (Path(x) for x in (
        r"C:\Windows\Fonts\arialbd.ttf", r"C:\Windows\Fonts\arial.ttf"
    ) if Path(x).exists()),
    None,
)


def font(size: int):
    return ImageFont.truetype(str(FONT_FILE), size) if FONT_FILE else ImageFont.load_default()


def box(d, rect, label, color="#E0F2FE", size=20):
    d.rounded_rectangle(rect, radius=18, fill=color, outline="#334155", width=2)
    lines = label.split("\n")
    heights = [d.textbbox((0, 0), line, font=font(size))[3] for line in lines]
    y = rect[1] + (rect[3] - rect[1] - sum(heights) - 5 * (len(lines)-1)) / 2
    for line, height in zip(lines, heights):
        width = d.textbbox((0, 0), line, font=font(size))[2]
        d.text((rect[0] + (rect[2]-rect[0]-width)/2, y), line, font=font(size), fill="#0F172A")
        y += height + 5


def arrow(d, start, end):
    d.line([start, end], fill="#475569", width=4)
    x, y = end
    if abs(end[0] - start[0]) >= abs(end[1] - start[1]):
        dx = -12 if end[0] > start[0] else 12
        d.polygon([(x, y), (x + dx, y-7), (x + dx, y+7)], fill="#475569")
    else:
        dy = -12 if end[1] > start[1] else 12
        d.polygon([(x, y), (x-7, y+dy), (x+7, y+dy)], fill="#475569")


def image(name, w=1600, h=940):
    return Image.new("RGB", (w, h), "#F8FAFC"), name


def diagrams():
    # Component architecture
    im, name = image("system_architecture.png")
    d = ImageDraw.Draw(im)
    d.text((50, 32), "High-Level System Architecture — Volunteer Crisis Management Platform",
           fill="#0F172A", font=font(30))
    box(d, (65, 260, 300, 390), "Web Browser\nVolunteer / Coordinator / Admin", "#DCFCE7")
    box(d, (410, 260, 645, 390), "Nginx\nTLS • Routing • Static Files", "#FEF3C7")
    box(d, (760, 190, 1050, 425), "React SPA\nMUI • Redux • React Query\nRole-based UI", "#DBEAFE")
    box(d, (760, 515, 1050, 750), "Django REST API\nJWT • RBAC • Validation\nDomain Services", "#CFFAFE")
    box(d, (1170, 90, 1470, 225), "PostgreSQL 17\nTransactional System of Record", "#FCE7F3")
    box(d, (1170, 295, 1470, 430), "Redis 7\nCache • Task Broker", "#FEE2E2")
    box(d, (1170, 500, 1470, 635), "Celery / Beat\nAsync Notifications • Jobs", "#EDE9FE")
    box(d, (1170, 705, 1470, 840), "Mail Service\nSMTP / Mailhog (Development)", "#FFEDD5")
    arrow(d, (300, 325), (410, 325)); arrow(d, (645, 325), (760, 300))
    arrow(d, (905, 425), (905, 515))
    arrow(d, (1050, 590), (1170, 160)); arrow(d, (1050, 620), (1170, 360))
    arrow(d, (1320, 430), (1320, 500)); arrow(d, (1320, 635), (1320, 705))
    d.text((55, 885), "English labels are intentionally used inside all diagrams.", fill="#475569", font=font(16))
    im.save(ASSETS / name)

    # ERD overview
    im, name = image("erd_overview.png", 1700, 980)
    d = ImageDraw.Draw(im)
    d.text((45, 30), "Logical ERD — Core Operational Entities", fill="#0F172A", font=font(30))
    nodes = [
        ((70, 160, 330, 315), "User\nPK id (UUID)\nemail • active • approved", "#DBEAFE"),
        ((70, 430, 330, 565), "Role / Permission\nUserRole • RolePermission", "#EDE9FE"),
        ((70, 700, 330, 850), "VolunteerProfile\nPK id • FK user_id\nstatus • availability", "#DCFCE7"),
        ((470, 130, 730, 280), "Disaster\nPK id\ntype • severity • status", "#FEE2E2"),
        ((470, 400, 730, 570), "Mission\nFK disaster_id • coordinator_id\nstatus • priority • capacity", "#CFFAFE"),
        ((470, 720, 730, 860), "Skill\nVolunteerSkill\nMissionRequiredSkill", "#FEF3C7"),
        ((890, 210, 1170, 380), "MissionApplication\nFK mission_id • volunteer_id\nUNIQUE(mission, volunteer)", "#FCE7F3"),
        ((890, 550, 1170, 700), "Assignment\nFK mission_id • volunteer_id\nUNIQUE(mission, volunteer)", "#FFEDD5"),
        ((1340, 130, 1620, 270), "MissionReport\nFK mission_id • author_id", "#E0E7FF"),
        ((1340, 390, 1620, 530), "Notification\nFK user_id\nunread / resource ref.", "#D1FAE5"),
        ((1340, 650, 1620, 800), "Ticket / Reply\nSupport conversation", "#F3E8FF"),
    ]
    for rect, text, color in nodes: box(d, rect, text, color, 17)
    for s, e in [
        ((200,315),(200,430)), ((200,565),(200,700)), ((330,238),(470,485)),
        ((330,775),(470,790)), ((600,280),(600,400)), ((730,485),(890,295)),
        ((730,485),(890,625)), ((730,485),(1340,200)), ((330,238),(1340,460)),
        ((330,238),(1340,725)), ((730,790),(890,295))
    ]: arrow(d, s, e)
    d.text((55, 920), "PK = Primary Key | FK = Foreign Key | all business entities include audit timestamps and soft-delete marker.",
           fill="#475569", font=font(16))
    im.save(ASSETS / name)

    # flow
    im, name = image("mission_flow.png", 1600, 800)
    d = ImageDraw.Draw(im)
    d.text((50, 32), "Mission Application and Assignment Flow", fill="#0F172A", font=font(30))
    labels = [
        "Mission Published", "Volunteer Applies", "Application Submitted",
        "Coordinator Reviews", "Approved / Rejected", "Assignment Created",
        "Volunteer Notified", "Mission Execution", "Report & Audit"
    ]
    colors = ["#DBEAFE", "#DCFCE7", "#FCE7F3", "#FEF3C7", "#EDE9FE", "#FFEDD5", "#D1FAE5", "#CFFAFE", "#E2E8F0"]
    x, y = 45, 245
    for i, label in enumerate(labels):
        box(d, (x, y, x+145, y+125), label, colors[i], 15)
        if i < len(labels)-1: arrow(d, (x+145, y+62), (x+170, y+62))
        x += 175
    d.text((50, 500), "Business rule: only one application and one assignment are permitted per (mission, volunteer) pair.",
           fill="#334155", font=font(19))
    d.text((50, 590), "Approval is a controlled state transition that creates an Assignment and notification in one domain workflow.",
           fill="#334155", font=font(19))
    im.save(ASSETS / name)

    # data + security
    im, name = image("data_governance.png", 1600, 900)
    d = ImageDraw.Draw(im)
    d.text((50, 32), "Data Governance, Security and Resilience Controls", fill="#0F172A", font=font(30))
    groups = [
        ((90, 150, 510, 350), "Access Control\nJWT authentication\nRole / permission checks\nLeast privilege", "#DBEAFE"),
        ((590, 150, 1010, 350), "Data Integrity\nUUID keys • Foreign keys\nUnique constraints\nTransaction boundaries", "#DCFCE7"),
        ((1090, 150, 1510, 350), "Privacy\nPII minimization\nTLS in transit\nEncrypted backups", "#FCE7F3"),
        ((90, 500, 510, 700), "Auditability\nAudit events\nCorrelation identifiers\nOperational traceability", "#FEF3C7"),
        ((590, 500, 1010, 700), "Availability\nHealth checks\nBackup / restore drills\nMonitoring and alerts", "#EDE9FE"),
        ((1090, 500, 1510, 700), "Lifecycle\nSoft delete\nRetention policy\nControlled purge", "#FFEDD5"),
    ]
    for rect, label, color in groups: box(d, rect, label, color, 19)
    im.save(ASSETS / name)


def shade(cell, fill):
    pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd"); shd.set(qn("w:fill"), fill); pr.append(shd)


def rtl(p, align=WD_ALIGN_PARAGRAPH.RIGHT):
    p.alignment = align
    props = p._p.get_or_add_pPr()
    bidi = OxmlElement("w:bidi"); bidi.set(qn("w:val"), "1"); props.append(bidi)
    return p


def page_field(p):
    run = p.add_run()
    b = OxmlElement("w:fldChar"); b.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText"); instr.set(qn("xml:space"), "preserve"); instr.text = " PAGE "
    e = OxmlElement("w:fldChar"); e.set(qn("w:fldCharType"), "end")
    run._r.extend([b, instr, e])


class P2:
    def __init__(self):
        self.doc = Document()
        sec = self.doc.sections[0]
        sec.top_margin = Cm(2.0); sec.bottom_margin = Cm(1.8)
        sec.left_margin = Cm(2.0); sec.right_margin = Cm(2.0)
        normal = self.doc.styles["Normal"]
        normal.font.name = "B Nazanin"; normal._element.rPr.rFonts.set(qn("w:eastAsia"), "B Nazanin")
        normal.font.size = Pt(12)
        for h, size, color in [("Title", 25, "0F172A"), ("Heading 1", 18, "0B5E8E"), ("Heading 2", 15, "1D4ED8")]:
            s = self.doc.styles[h]; s.font.name = "B Nazanin"; s._element.rPr.rFonts.set(qn("w:eastAsia"), "B Nazanin")
            s.font.size = Pt(size); s.font.color.rgb = RGBColor.from_string(color)
        header = sec.header.paragraphs[0]
        header.text = "سامانه مدیریت داوطلبان بحران | سند فاز دوم — طراحی داده و معماری"
        rtl(header); header.runs[0].font.size = Pt(9)
        footer = sec.footer.paragraphs[0]; rtl(footer, WD_ALIGN_PARAGRAPH.CENTER)
        footer.add_run("P2 | نسخه 1.0 | صفحه "); page_field(footer)
        self.n = 0

    def p(self, text, bold=False):
        p = rtl(self.doc.add_paragraph())
        r = p.add_run(text); r.bold = bold
        p.paragraph_format.space_after = Pt(7)

    def h1(self, text):
        self.n += 1
        p = self.doc.add_heading(f"{self.n}. {text}", 1); rtl(p)

    def h2(self, text):
        p = self.doc.add_heading(text, 2); rtl(p)

    def bullets(self, items):
        for item in items:
            p = rtl(self.doc.add_paragraph(style="List Bullet"))
            p.add_run(item)

    def table(self, headers, rows, widths=None):
        t = self.doc.add_table(rows=1, cols=len(headers))
        t.style = "Light Shading Accent 1"; t.alignment = WD_TABLE_ALIGNMENT.CENTER
        for cell, value in zip(t.rows[0].cells, headers):
            cell.text = value; shade(cell, "0B5E8E"); cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            for p in cell.paragraphs:
                rtl(p, WD_ALIGN_PARAGRAPH.CENTER)
                for r in p.runs: r.font.color.rgb = RGBColor(255,255,255); r.bold = True
        for row in rows:
            cells = t.add_row().cells
            for cell, value in zip(cells, row):
                cell.text = str(value); cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
                for p in cell.paragraphs: rtl(p)
        if widths:
            for row in t.rows:
                for c, w in zip(row.cells, widths): c.width = Cm(w)
        self.doc.add_paragraph()

    def figure(self, path, caption):
        p = self.doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.add_run().add_picture(str(path), width=Cm(16.5))
        cap = rtl(self.doc.add_paragraph("شکل — " + caption), WD_ALIGN_PARAGRAPH.CENTER)
        cap.runs[0].italic = True; cap.runs[0].font.size = Pt(10)

    def break_(self): self.doc.add_page_break()

    def toc(self):
        p = self.doc.add_paragraph()
        rtl(p, WD_ALIGN_PARAGRAPH.RIGHT)
        run = p.add_run()
        begin = OxmlElement("w:fldChar"); begin.set(qn("w:fldCharType"), "begin")
        code = OxmlElement("w:instrText"); code.set(qn("xml:space"), "preserve")
        code.text = ' TOC \\o "1-3" \\h \\z \\u '
        separate = OxmlElement("w:fldChar"); separate.set(qn("w:fldCharType"), "separate")
        text = OxmlElement("w:t"); text.text = "برای نمایش فهرست، در Word روی این بخش کلیک راست و Update Field را انتخاب کنید."
        separate.append(text)
        end = OxmlElement("w:fldChar"); end.set(qn("w:fldCharType"), "end")
        run._r.extend([begin, code, separate, end])


def build():
    diagrams()
    d = P2()
    # Cover
    for _ in range(5): d.doc.add_paragraph()
    title = d.doc.add_heading("سند طراحی پایگاه داده و معماری کلان سامانه", 0); rtl(title, WD_ALIGN_PARAGRAPH.CENTER)
    sub = rtl(d.doc.add_paragraph("سامانه مدیریت داوطلبان بحران (پناه)"), WD_ALIGN_PARAGRAPH.CENTER)
    sub.runs[0].font.size = Pt(18); sub.runs[0].font.color.rgb = RGBColor(29,78,216)
    d.doc.add_paragraph()
    d.table(["مقدار", "مشخصه"], [
        ["P2", "شناسه سند"], ["1.0", "نسخه"], ["1405/04/26", "تاریخ"], ["طراحی داده، معماری و مشخصات فنی اولیه", "دامنه"],
        ["تیم توسعه سامانه مدیریت داوطلبان بحران", "تهیه‌کننده"], ["کارفرما / ذی‌نفعان سامانه", "مخاطب"],
    ])
    d.p("این سند، مبنای مشترک کارفرما، تحلیل‌گر، معمار، توسعه‌دهنده، مدیر پایگاه داده و تیم آزمون برای ورود کنترل‌شده به فاز توسعه است.")
    d.break_()
    toc_heading = d.doc.add_heading("فهرست مطالب", 1); rtl(toc_heading)
    d.toc()
    d.break_()
    d.h1("کنترل سند و راهنمای مطالعه")
    d.table(["شرح تغییر", "تهیه‌کننده", "تاریخ", "نسخه"], [["ایجاد نخستین نسخه طراحی فاز دوم", "تیم فنی", "1405/04/26", "1.0"]])
    d.h2("هدف و دامنه")
    d.p("هدف، تبدیل نیازهای عملیاتی سامانه مدیریت داوطلبان بحران به مدل مفهومی، منطقی و فیزیکی داده و نیز تعیین معماری مرجع سامانه است. این طراحی چرخه ثبت‌نام، پروفایل داوطلب، مهارت، رخداد، مأموریت، درخواست مشارکت، تخصیص، گزارش، اعلان، تیکت و ثبت ممیزی را پوشش می‌دهد.")
    d.h2("ساختار سند")
    d.bullets(["بخش‌های ۲ تا ۴ مدل داده و قواعد یکپارچگی را شرح می‌دهند.", "بخش‌های ۵ تا ۷ معماری نرم‌افزار، استقرار و امنیت را مشخص می‌کنند.", "بخش‌های ۸ و ۹ نقشه ورود به توسعه، آزمون پذیرش و اقلام تحویلی را ارائه می‌دهند."])
    d.p("فهرست مطالب در Microsoft Word با انتخاب Update Field به‌روزرسانی می‌شود.")
    d.break_()

    d.h1("مفروضات، اصول و روش طراحی")
    d.h2("مفروضات کلیدی")
    d.bullets(["پایگاه داده عملیاتی PostgreSQL 17 است و شناسه همه موجودیت‌های کسب‌وکاری UUID است.", "سامانه از Django REST Framework، React و صف پردازش Celery استفاده می‌کند.", "هر کاربر ثبت‌نام‌شده قابلیت ایجاد پروفایل داوطلب را دارد؛ کنترل دسترسی عملیات مدیریتی بر پایه نقش و مجوز است.", "در حذف نرم (Soft Delete)، داده برای ممیزی حفظ و از فهرست‌های عادی پنهان می‌شود."])
    d.h2("اصول معماری داده")
    d.table(["کاربرد", "اصل"], [
        ["ردیابی و همگام‌سازی", "کلید اصلی UUID و زمان‌های ایجاد/به‌روزرسانی"], ["یکپارچگی", "کلید خارجی، قیود یکتا و محدودیت دامنه وضعیت‌ها"],
        ["کارایی", "ایندکس‌های مالکیت، وضعیت، زمان و ایندکس جزئی برای صف‌های فعال"], ["انعطاف کنترل‌شده", "JSONB صرفاً برای فراداده، نیاز و تقویم آمادگی"],
        ["حریم خصوصی", "حداقل‌سازی PII، محدودسازی نقش‌ها، ثبت ممیزی و سیاست نگهداری"]
    ])

    d.h1("مدل مفهومی و شناسایی موجودیت‌ها")
    d.p("مدل مفهومی سه جریان اصلی را متصل می‌کند: مدیریت هویت و صلاحیت، مدیریت عملیات بحران و مدیریت ارتباطات/حاکمیت. «کاربر» هویت پایه است؛ «داوطلب» نمای عملیاتی کاربر؛ «رخداد» ظرف بحران؛ و «مأموریت» واحد قابل تخصیص کار است.")
    d.table(["تعریف کسب‌وکاری", "موجودیت"], [
        ["هویت فرد یا عامل انسانی که وارد سامانه می‌شود.", "User"], ["نمایه مهارت، شهر، آمادگی و وضعیت مشارکت.", "VolunteerProfile"],
        ["کاتالوگ مهارت و سطح تسلط داوطلب.", "Skill / VolunteerSkill"], ["رخداد بحران دارای شدت، زمان، مکان و نیازها.", "Disaster"],
        ["کار عملیاتی با ظرفیت، زمان، اولویت و هماهنگ‌کننده مشخص.", "Mission"], ["درخواست داوطلب برای یک مأموریت؛ حداکثر یک بار برای هر زوج.", "MissionApplication"],
        ["تخصیص رسمی پس از تصمیم مسئول مأموریت.", "Assignment"], ["گزارش میدانی، پیام پشتیبانی، اعلان و رویداد ممیزی.", "Report / Ticket / Notification / AuditLog"]
    ])
    d.figure(ASSETS / "erd_overview.png", "نمودار ERD منطقی موجودیت‌های عملیاتی (برچسب‌های تصویر به زبان انگلیسی است).")

    d.h1("طراحی منطقی و فیزیکی پایگاه داده")
    d.h2("موجودیت‌های هویت و کنترل دسترسی")
    d.p("جدول accounts_user از ایمیل به‌عنوان شناسه ورود استفاده می‌کند. UserProfile برای اطلاعات تکمیلی یک‌به‌یک است. نقش‌ها و مجوزها به‌صورت مدل‌های مستقل و جداول واسط UserRole و RolePermission پیاده‌سازی می‌شوند تا افزودن یا تغییر نقش نیازی به تغییر ساختار User نداشته باشد.")
    d.h2("موجودیت‌های عملیات بحران")
    d.p("Disaster دارای چند Mission است. Mission با coordinator_id به کاربر مسئول متصل می‌شود و از حذف کاربر هماهنگ‌کننده با سیاست PROTECT/RESTRICT حفاظت می‌شود. MissionApplication و Assignment هر دو قید یکتای (mission_id, volunteer_id) دارند؛ نخستین قید از درخواست تکراری و دومین قید از تخصیص تکراری جلوگیری می‌کند.")
    d.table(["قید یا تصمیم", "دلیل فنی"], [
        ["UNIQUE(mission_id, volunteer_id)", "جلوگیری از درخواست یا تخصیص تکراری در شرایط هم‌زمانی"], ["FK Mission→Disaster با CASCADE", "حذف رخداد تنها با حذف مأموریت‌های وابسته و بر اساس سیاست مصوب"],
        ["FK Mission→Coordinator با RESTRICT", "حفظ مسئولیت‌پذیری و جلوگیری از یتیم شدن مأموریت"], ["Check required_volunteers > 0", "حفظ اعتبار ظرفیت مأموریت"],
        ["JSONB برای metadata/needs/availability", "ثبت داده نیمه‌ساخت‌یافته بدون تکرار ستون‌های ناپایدار"]
    ])
    d.h2("واژگان وضعیت و انتقال‌ها")
    d.p("وضعیت‌ها باید در لایه دامنه اعتبارسنجی شوند؛ پایگاه داده نیز برای پیشگیری از ثبت مقدار خارج از دامنه از CHECK یا نوع enum کنترل‌شده استفاده می‌کند. تغییر وضعیت درخواست، تخصیص و اعلان باید در یک تراکنش یا الگوی قابل جبران مدیریت شود.")
    d.table(["وضعیت‌های اصلی", "موجودیت"], [
        ["registered، pending_approval، active، rejected", "VolunteerProfile"], ["draft، published، in_progress، completed، closed", "Mission"],
        ["submitted، waitlist، approved، rejected، withdrawn", "MissionApplication"], ["pending، accepted، checked_in، completed، declined", "Assignment"],
        ["draft، submitted، reviewed", "MissionReport"]
    ])
    d.figure(ASSETS / "mission_flow.png", "جریان درخواست داوطلب، بررسی هماهنگ‌کننده، تخصیص و ثبت گزارش.")

    d.h1("کلیدها، روابط و راهبرد ایندکس")
    d.p("کلید اصلی UUID امکان ایجاد امن شناسه در محیط‌های توزیع‌شده، کاهش خطر افشای توالی رکوردها و همگام‌سازی بهتر را فراهم می‌کند. کلیدهای خارجی روی مسیرهای اتصال و ایندکس‌های کاربردی روی فیلترهای پرتکرار ایجاد می‌شوند. صرف داشتن FK جایگزین ایندکس‌های موردنیاز برای گزارش و صف‌ها نیست.")
    d.table(["کاربرد", "ایندکس پیشنهادی"], [
        ["داشبورد هماهنگ‌کننده", "missions(coordinator_id, status) WHERE deleted_at IS NULL"], ["صندوق درخواست‌های در انتظار", "mission_application(status, created_at DESC) با فیلتر submitted/waitlist"],
        ["ماموریت‌های قابل مشاهده داوطلب", "missions(status, is_visible_to_volunteers)"], ["نشان اعلان خوانده‌نشده", "notifications(user_id, created_at DESC) WHERE read_at IS NULL"],
        ["ردیابی رخداد", "audit_log(resource_type, resource_id, created_at DESC)"], ["جست‌وجوی نیازها/آمادگی منعطف", "GIN روی JSONB پس از اندازه‌گیری واقعی بار"]
    ])
    d.h2("قاعده استفاده از ایندکس")
    d.p("ایندکس اضافی سرعت نوشتن را کاهش و حجم ذخیره‌سازی را افزایش می‌دهد. پیش از افزودن هر ایندکس جدید باید با EXPLAIN (ANALYZE, BUFFERS) روی داده‌ای نزدیک به واقعیت، نرخ انتخاب‌پذیری و مسیر اجرای پرس‌وجو اندازه‌گیری شود.")

    d.h1("معماری کلان سامانه و تعامل اجزا")
    d.p("معماری پیشنهادی از تفکیک لایه ارائه، درگاه وب، API، سرویس‌های دامنه، ذخیره‌سازی تراکنشی و پردازش غیرهم‌زمان استفاده می‌کند. React SPA تجربه کاربر را ارائه می‌کند؛ Nginx پایان TLS و مسیریابی را انجام می‌دهد؛ Django REST API مرز امنیتی و تجاری است؛ PostgreSQL منبع حقیقت تراکنشی و Redis کش/واسط صف است.")
    d.figure(ASSETS / "system_architecture.png", "معماری سطح‌بالا و وابستگی‌های اصلی استقرار.")
    d.h2("قراردادهای تعامل")
    d.table(["تعامل", "قرارداد"], [
        ["Frontend ↔ API", "REST/JSON نسخه‌دار (/api/v1)، JWT، پاسخ خطای یکنواخت و اعتبارسنجی ورودی"], ["API ↔ PostgreSQL", "Django ORM و تراکنش اتمیک برای تغییرهای چندجدولی"],
        ["API/Domain ↔ Celery", "وظیفه غیرهم‌زمان برای اعلان و کارهای زمان‌بر؛ عدم اتکا به تحویل دقیقاً یک‌بار"], ["Celery ↔ SMTP", "ارسال ایمیل با ثبت خطا، امکان retry و مشاهده‌پذیری"], ["Admin ↔ DB", "PgAdmin فقط از شبکه/حساب کنترل‌شده؛ منع استفاده از حساب برنامه برای عملیات DBA"]
    ])

    d.h1("امنیت، حریم خصوصی، پایداری و عملیات")
    d.figure(ASSETS / "data_governance.png", "کنترل‌های مرجع حاکمیت داده و پایداری.")
    d.h2("کنترل‌های حداقلی پیش از تولید")
    d.bullets(["TLS برای تمام مسیرهای بیرونی، اسرار تنها در متغیرهای محیطی یا مدیر اسرار و منع ثبت رمز/توکن در مخزن.", "سیاست RBAC با آزمون مجوز برای تمام endpointهای حساس؛ دسترسی هماهنگ‌کننده فقط به مأموریت‌های خود.", "نسخه پشتیبان رمزگذاری‌شده، آزمایش بازیابی دوره‌ای، RPO/RTO مصوب و پایش ظرفیت دیسک.", "ثبت رویدادهای امنیتی و عملیاتی بدون ذخیره رمز، JWT خام یا اطلاعات پزشکی غیرضروری.", "سیاست نگهداری برای PII، پیوست‌ها، گزارش‌ها و logها؛ فرآیند حذف نهایی پس از دوره قانونی."])
    d.h2("ملاحظات تراکنش و هم‌زمانی")
    d.p("تأیید درخواست باید MissionApplication را قفل/بازخوانی کند، ظرفیت باقیمانده را بررسی نماید، Assignment ایجاد کند و رویداد اعلان را ثبت کند. قید یکتا حفاظت پایه است، ولی کنترل ظرفیت نیز باید در تراکنش با isolation مناسب یا قفل سطری انجام شود تا دو تأیید هم‌زمان بیش‌ازظرفیت ایجاد نکند.")

    d.h1("مشخصات فنی اولیه برای ورود به توسعه")
    d.table(["مشخصات", "تصمیم اولیه"], [
        ["Backend", "Python، Django، Django REST Framework، JWT، Celery"], ["Frontend", "React، TypeScript، MUI، Redux Toolkit، TanStack Query"],
        ["Database", "PostgreSQL 17، UUID، JSONB کنترل‌شده، migration-managed schema"], ["Cache / broker", "Redis 7 با persistence متناسب محیط"], ["Container", "Docker Compose برای توسعه؛ image immutable برای تولید"],
        ["Observability", "Structured logs، health checks، metrics، audit trail و correlation id"], ["API", "REST نسخه‌دار، OpenAPI، pagination، filtering و contract tests"]
    ])
    d.h2("دروازه‌های کیفیت")
    d.bullets(["مهاجرت پایگاه داده باید قابل rollback یا جبران باشد و روی نسخه پشتیبان تست شود.", "برای endpointهای چرخه مأموریت، آزمون نقش، آزمون وضعیت، آزمون هم‌زمانی و آزمون یکپارچگی داده الزامی است.", "برای تغییرهای داده حساس، بازبینی DBA/معمار، سناریوی پشتیبان‌گیری و طرح بازگشت مستند شود.", "اسکریپت تحویلی P22.sql مرجع خواندنی است؛ در محیط برنامه از Django migrations استفاده می‌شود."])

    d.h1("برنامه ورود به فاز توسعه و معیار پذیرش")
    d.table(["خروجی قابل پذیرش", "گام"], [
        ["تأیید ERD، فرهنگ داده و مسئول هر داده حساس", "۱. تثبیت طراحی"], ["بازبینی migrationها و اجرای محیط آزمایشی با داده ساختگی", "۲. پیاده‌سازی داده"],
        ["پیاده‌سازی APIهای هویت، مأموریت، درخواست، تأیید و اعلان", "۳. پیاده‌سازی دامنه"], ["آزمون یکپارچگی، امنیت، بار و سناریوی ظرفیت", "۴. تضمین کیفیت"],
        ["بازیابی موفق پشتیبان، چک‌لیست امنیت و راهنمای استقرار", "۵. آمادگی بهره‌برداری"]
    ])
    d.p("معیار پذیرش حیاتی: کاربر مجاز بتواند برای مأموریت منتشرشده درخواست یکتا ثبت کند؛ هماهنگ‌کننده مسئول بتواند آن را تصمیم‌گیری کند؛ تصمیم تأیید منجر به تخصیص و اعلان قابل رهگیری شود؛ و تمام این رخدادها در مسیر ممیزی قابل مشاهده باشند.")

    d.h1("مراجع و اقلام تحویلی")
    d.bullets(["Django model و migrationهای پروژه در backend/src", "P21.md — شمای داده و دیاگرام‌های Mermaid قابل نسخه‌بندی", "P22.sql — DDL PostgreSQL، ایندکس‌ها، Viewها و پرس‌وجوهای پذیرش", "P23.txt — نسخه متنی P22.sql برای مشاهده سریع", "ISO/IEC 25010، ISO 27001، OWASP ASVS، PostgreSQL Documentation، REST API Design Guidelines"])
    d.p("پایان سند.", True)
    d.doc.save(OUT)
    (ROOT / "P23.txt").write_text(
        (ROOT / "P22.sql").read_text(encoding="utf-8"),
        encoding="utf-8",
    )
    print("P2.docx created")


if __name__ == "__main__":
    build()
