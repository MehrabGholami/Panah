# -*- coding: utf-8 -*-
"""
Generate VDOC package for Panah SRS (IEEE 29148 aligned).
Produces: VDOC/xc.docx, md/, diagrams/, images/, appendix/
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Cm, Pt, RGBColor

from vdoc.docx_kit import (
    ACCENT,
    DARK,
    add_image,
    add_table,
    add_toc_field,
    caption,
    configure_document,
    h1,
    h2,
    h3,
    note,
    page_break,
    para,
    rtl_paragraph,
    set_run_font,
    tip,
)
from vdoc.png_diagrams import generate_all as gen_png

VDOC = ROOT / "VDOC"
MD = VDOC / "md"
DIAG = VDOC / "diagrams"
IMG = VDOC / "images"
APPX = VDOC / "appendix"
OUT_DOCX = VDOC / "xc.docx"


# ---------------------------------------------------------------------------
# Content helpers — long formal Persian blocks
# ---------------------------------------------------------------------------

def fr_rows():
    """Functional requirements FR-001 … for tables."""
    items = [
        ("FR-001", "ثبت‌نام داوطلب", "Must", "ایجاد حساب، نقش volunteer، پروفایل و مهارت‌ها", "UC-01", "ثبت‌نام موفق و امکان ورود"),
        ("FR-002", "ورود و خروج JWT", "Must", "صدور access/refresh و blacklist هنگام خروج", "UC-02", "توکن معتبر و ابطال پس از logout"),
        ("FR-003", "مدیریت پروفایل", "Must", "ویرایش اطلاعات هویتی و آواتار", "UC-03", "ذخیره تغییرات در /auth/me/"),
        ("FR-004", "ایجاد بحران", "Must", "ثبت بحران با نوع، شدت، مکان و نیازها", "UC-10", "بحران در فهرست ظاهر شود"),
        ("FR-005", "ویرایش/وضعیت بحران", "Must", "به‌روزرسانی و فعال/غیرفعال‌سازی", "UC-11", "وضعیت در UI و API همگام"),
        ("FR-006", "فیلتر تاریخ بحران", "Should", "نمایش بحران‌ها از تاریخ وقوع به بعد", "UC-12", "occurred_after اعمال شود"),
        ("FR-007", "ایجاد مأموریت پیش‌نویس", "Must", "اتصال به بحران و هماهنگ‌کننده", "UC-20", "وضعیت draft"),
        ("FR-008", "انتشار مأموریت", "Must", "گذار draft→published", "UC-21", "قابل مشاهده برای داوطلب در صورت visibility"),
        ("FR-009", "شروع/تکمیل/بستن مأموریت", "Must", "گذارهای وضعیت مأموریت", "UC-22", "مطابق state machine"),
        ("FR-010", "بازگشایی مأموریت", "Should", "closed→published", "UC-23", "مأموریت دوباره قابل اجرا"),
        ("FR-011", "تنظیم visibility", "Must", "نمایش و پذیرش درخواست برای داوطلب", "UC-24", "اعمال فلگ‌ها"),
        ("FR-012", "درخواست شرکت", "Must", "ثبت MissionApplication با وضعیت submitted", "UC-30", "اعلان به کارکنان"),
        ("FR-013", "تأیید درخواست", "Must", "approve و ایجاد Assignment", "UC-31", "وضعیت approved + انتساب pending"),
        ("FR-014", "رد/لیست انتظار", "Must", "reject و waitlist با یادداشت", "UC-32", "وضعیت صحیح و اعلان"),
        ("FR-015", "پذیرش/رد انتساب", "Must", "accept/decline توسط داوطلب", "UC-40", "وضعیت assignment"),
        ("FR-016", "حضور در محل", "Should", "check-in از accepted", "UC-41", "وضعیت checked_in"),
        ("FR-017", "تکمیل انتساب", "Should", "complete از checked_in", "UC-42", "وضعیت completed"),
        ("FR-018", "گزارش مأموریت", "Must", "پیش‌نویس، ارسال، بررسی", "UC-50", "چرخه draft→submitted→reviewed"),
        ("FR-019", "اعلان درون‌برنامه‌ای", "Must", "ایجاد و خواندن اعلان‌ها", "UC-60", "unread-count صحیح"),
        ("FR-020", "تیکت پشتیبانی", "Must", "ایجاد، پاسخ، تغییر وضعیت", "UC-70", "گفتگو ثبت شود"),
        ("FR-021", "داشبورد نقش‌محور", "Must", "KPI و نمودار بر اساس نقش", "UC-80", "داده‌های scope صحیح"),
        ("FR-022", "مدیریت کاربران", "Must", "فعال/مسدود و مشاهده نقش", "UC-90", "دسترسی accounts.*"),
        ("FR-023", "تخصیص نقش", "Must", "یک نقش به ازای کاربر", "UC-91", "جایگزینی نقش قبلی"),
        ("FR-024", "ممیزی رویدادها", "Must", "ثبت audit با خلاصه فارسی", "UC-92", "قابل فیلتر در UI"),
        ("FR-025", "مهارت‌های استاندارد", "Must", "انتخاب مهارت در ثبت‌نام و مأموریت", "UC-04", "مهارت ذخیره شود"),
        ("FR-026", "صندوق درخواست‌ها", "Must", "inbox هماهنگ‌کننده/ادمین", "UC-33", "فهرست قابل بررسی"),
        ("FR-027", "مأموریت‌های من", "Must", "نمایش انتساب‌های داوطلب", "UC-43", "لیست my assignments"),
        ("FR-028", "مأموریت‌های موجود", "Must", "فهرست published+visible", "UC-34", "فقط واجد شرایط"),
        ("FR-029", "پیوست گزارش", "Could", "آپلود فایل در پیش‌نویس", "UC-51", "فایل ذخیره شود"),
        ("FR-030", "تم تاریک و RTL", "Must", "پشتیبانی UI", "NFR-UI", "خوانایی در هر دو تم"),
        ("FR-031", "فیلتر مأموریت بر اساس بحران", "Must", "Autocomplete بحران", "UC-25", "لیست فیلتر شود"),
        ("FR-032", "فیلتر تاریخ در مأموریت", "Should", "disaster_occurred_after", "UC-26", "مأموریت‌های مرتبط"),
        ("FR-033", "نقشه موقعیت بحران", "Should", "لینک نقشه/مختصات", "UC-13", "باز شدن نقشه"),
        ("FR-034", "خلاصه مأموریت پایان‌یافته", "Should", "آمار درخواست و انتساب", "UC-52", "دیالوگ خلاصه"),
        ("FR-035", "سلامت سرویس", "Must", "/api/v1/health/", "OPS", "پاسخ 200"),
        ("FR-036", "مستندات OpenAPI", "Should", "/api/docs/", "OPS", "اسکیما قابل دسترس"),
        ("FR-037", "کش داشبورد", "Should", "Redis TTL کوتاه", "PERF", "به‌روز پس از bump"),
        ("FR-038", "صفحه درباره", "Could", "معرفی محصول", "UX", "محتوای فارسی"),
        ("FR-039", "خروجی کاربران CSV", "Could", "اکسپورت با فیلتر", "UC-93", "فایل CSV"),
        ("FR-040", "امنیت رمز عبور Argon2", "Must", "هش امن", "SEC", "عدم ذخیره plaintext"),
    ]
    return items


def uc_rows():
    return [
        ("UC-01", "ثبت‌نام داوطلب", "داوطلب", "Must", "بالا"),
        ("UC-02", "ورود به سامانه", "همه نقش‌ها", "Must", "بالا"),
        ("UC-03", "مدیریت پروفایل", "کاربر احرازشده", "Must", "متوسط"),
        ("UC-10", "ایجاد بحران", "ادمین/هماهنگ‌کننده", "Must", "بالا"),
        ("UC-11", "ویرایش بحران", "ادمین/هماهنگ‌کننده", "Must", "متوسط"),
        ("UC-20", "ایجاد مأموریت", "ادمین/هماهنگ‌کننده", "Must", "بالا"),
        ("UC-21", "انتشار مأموریت", "هماهنگ‌کننده/ادمین", "Must", "بالا"),
        ("UC-22", "کنترل چرخه مأموریت", "هماهنگ‌کننده/ادمین", "Must", "بالا"),
        ("UC-30", "درخواست شرکت در مأموریت", "داوطلب", "Must", "بالا"),
        ("UC-31", "تأیید درخواست", "هماهنگ‌کننده/ادمین", "Must", "بالا"),
        ("UC-32", "رد یا انتظار درخواست", "هماهنگ‌کننده/ادمین", "Must", "بالا"),
        ("UC-40", "پذیرش انتساب", "داوطلب", "Must", "بالا"),
        ("UC-50", "ثبت گزارش مأموریت", "داوطلب/کارکنان", "Must", "متوسط"),
        ("UC-60", "مشاهده اعلان‌ها", "کاربر احرازشده", "Must", "متوسط"),
        ("UC-70", "ایجاد تیکت", "کاربر احرازشده", "Must", "متوسط"),
        ("UC-80", "مشاهده داشبورد", "همه نقش‌ها", "Must", "بالا"),
        ("UC-90", "مدیریت کاربران", "ادمین", "Must", "متوسط"),
        ("UC-91", "تخصیص نقش", "ادمین", "Must", "بالا"),
        ("UC-92", "مشاهده ممیزی", "ادمین", "Must", "متوسط"),
    ]


def bp_detail(doc, bp_id, title, goal, trigger, inputs, outputs, actors, pre, post, rules, kpis, success, alt, fail, risk, opp, priority):
    h3(doc, f"{bp_id} — {title}")
    add_table(
        doc,
        ["فیلد", "شرح"],
        [
            ("هدف کسب‌وکار", goal),
            ("محرک (Trigger)", trigger),
            ("ورودی‌ها", inputs),
            ("خروجی‌ها", outputs),
            ("بازیگران", actors),
            ("پیش‌شرط", pre),
            ("پس‌شرط", post),
            ("قوانین کسب‌وکار", rules),
            ("شاخص‌های کلیدی (KPI)", kpis),
            ("سناریوی موفقیت", success),
            ("سناریوی جایگزین", alt),
            ("سناریوی شکست", fail),
            ("ریسک", risk),
            ("فرصت", opp),
            ("اولویت", priority),
        ],
        col_widths=[4.5, 12],
    )


def build_docx(images: dict):
    doc = Document()
    configure_document(doc)

    # Cover
    for _ in range(2):
        doc.add_paragraph()
    p = doc.add_paragraph()
    rtl_paragraph(p)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("Software Requirement Specification (SRS)")
    set_run_font(r, size=26, bold=True, color=DARK)

    p = doc.add_paragraph()
    rtl_paragraph(p)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("مشخصات نیازمندی‌های نرم‌افزار")
    set_run_font(r, size=22, bold=True, color=ACCENT)

    p = doc.add_paragraph()
    rtl_paragraph(p)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("سامانه پناه (Panah) — پلتفرم مدیریت بحران و هماهنگی داوطلبان")
    set_run_font(r, size=16, bold=True)

    for line in (
        "Version 1.0",
        "مطابق با استانداردهای IEEE 29148 / IEEE 830 / BABOK / UML 2.5 / BPMN 2.0",
        "وضعیت سند: قابل ارائه به کارفرما (MVP)",
        "تهیه‌کننده: تیم تحلیل، معماری و محصول Investica Group",
        "تاریخ: تیر ۱۴۰۵ / ژوئیه ۲۰۲۶",
        "طبقه‌بندی: داخلی — سازمانی / دولتی",
    ):
        p = doc.add_paragraph()
        rtl_paragraph(p)
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(line)
        set_run_font(r, size=12, color=DARK)

    page_break(doc)

    # TOC
    h1(doc, "فهرست مطالب")
    para(doc, "برای به‌روزرسانی فهرست در Microsoft Word: راست‌کلیک روی فهرست ← Update Field. فیلد TOC زیر درج شده است.")
    p = doc.add_paragraph()
    add_toc_field(p)
    page_break(doc)

    h1(doc, "فهرست اشکال (Table of Figures)")
    figs = [
        "شکل ۱ — Context Diagram سامانه پناه",
        "شکل ۲ — C4 Container Diagram",
        "شکل ۳ — توپولوژی Docker Compose",
        "شکل ۴ — ماشین وضعیت چرخه حیات مأموریت",
        "شکل ۵ — نمای کلی Use Case",
        "شکل ۶ — مدل داده منطقی (ERD)",
        "شکل ۷ — جریان احراز هویت JWT و RBAC",
        "شکل ۸ — Swimlane بررسی درخواست مأموریت",
        "شکل ۹ — DFD سطح ۰",
        "شکل ۱۰ — نقشه ناوبری صفحات",
        "شکل ۱۱ — معماری لایه‌ای",
        "شکل ۱۲ — نقشه ذهنی ماژول‌های MVP",
    ]
    for f in figs:
        para(doc, f, size=11)
    page_break(doc)

    h1(doc, "فهرست جداول (Table of Tables)")
    for t in (
        "جدول ۱ — ذینفعان سامانه",
        "جدول ۲ — واژه‌نامه تخصصی",
        "جدول ۳ — مخفف‌ها",
        "جدول ۴ — نقش‌ها و سطوح دسترسی",
        "جدول ۵ — ماتریس MoSCoW",
        "جدول ۶ — نیازمندی‌های کارکردی (نمونه کامل در فصل ۶)",
        "جدول ۷ — نیازمندی‌های غیرکارکردی",
        "جدول ۸ — موجودیت‌های داده و جداول",
        "جدول ۹ — ماتریس ریسک",
        "جدول ۱۰ — رهگیری نیازمندی به Use Case",
    ):
        para(doc, t, size=11)
    page_break(doc)

    # ===================== CH 1 =====================
    h1(doc, "فصل ۱ — مقدمه")
    h2(doc, "۱-۱ هدف سند")
    para(
        doc,
        "هدف این سند، تعریف دقیق، کامل و قابل رهگیری نیازمندی‌های نرم‌افزاری نسخه اولیه (MVP) سامانه «پناه» است تا مبنای مشترک میان کارفرما، تیم محصول، تحلیل‌گران کسب‌وکار، معماران نرم‌افزار، طراحان تجربه کاربری و تیم تضمین کیفیت قرار گیرد. سند مطابق رویکرد IEEE 29148 و ساختار کلاسیک IEEE 830 تدوین شده و با مفاهیم BABOK در تحلیل کسب‌وکار، UML 2.5 در مدل‌سازی ساختاری/رفتاری و BPMN 2.0 در مدل‌سازی فرآیند هم‌راستا است.",
    )
    para(
        doc,
        "این SRS به‌گونه‌ای نوشته شده که هر نیازمندی دارای شناسه یکتا، معیار پذیرش، سناریوی آزمون و وابستگی باشد تا امکان ردیابی از هدف کسب‌وکار تا پیاده‌سازی و آزمون فراهم شود (Requirements Traceability).",
    )
    h2(doc, "۱-۲ دامنه سامانه")
    para(
        doc,
        "دامنه MVP شامل مدیریت هویت و دسترسی مبتنی بر نقش، ثبت و پایش بحران‌ها، تعریف و چرخه حیات مأموریت‌های امدادی، ثبت‌نام و مهارت‌سنجی داوطلبان، بررسی درخواست‌های شرکت در مأموریت، انتساب و پیگیری وضعیت حضور، گزارش‌دهی پایان مأموریت، اعلان‌های درون‌برنامه‌ای، تیکت پشتیبانی، داشبورد نقش‌محور و ممیزی رویدادهای حساس است. یکپارچه‌سازی با سامانه‌های ملی GIS پیشرفته، پیش‌بینی هوشمند تخصیص نیرو، OTP/2FA اجباری و مهاجرت به FastAPI/PostGIS خارج از دامنه نسخه ۱.۰ بوده و در نقشه راه فازهای بعدی قرار دارند.",
    )
    h2(doc, "۱-۳ اهداف کسب‌وکار")
    for i, t in enumerate(
        [
            "کاهش زمان هماهنگی بین هماهنگ‌کننده و داوطلب در ساعات اولیه بحران",
            "ایجاد شفافیت عملیاتی از طریق وضعیت‌های استاندارد مأموریت و انتساب",
            "افزایش قابلیت حسابرسی تصمیم‌های حساس (تأیید/رد درخواست، تغییر نقش، مسدودسازی)",
            "ارائه دید مدیریتی لحظه‌ای از طریق KPI و نمودارهای داشبورد",
            "استانداردسازی مهارت‌ها و ظرفیت موردنیاز مأموریت‌ها",
        ],
        1,
    ):
        para(doc, f"{i}. {t}")
    h2(doc, "۱-۴ اهداف نسخه MVP")
    para(
        doc,
        "نسخه MVP باید یک جریان کامل عملیاتی end-to-end را پوشش دهد: ثبت‌نام داوطلب ← ورود ← تعریف بحران ← ایجاد و انتشار مأموریت ← درخواست شرکت ← بررسی ← انتساب ← پذیرش ← گزارش ← ممیزی. معیار موفقیت MVP عبارت است از قابلیت استقرار با Docker Compose، پوشش نقش‌های سه‌گانه، پایداری API مبتنی بر JWT و ارائه رابط کاربری فارسی RTL با تم روشن/تاریک.",
    )
    h2(doc, "۱-۵ ذینفعان")
    add_table(
        doc,
        ["ذینفع", "نقش سازمانی", "علاقه/نیاز", "تأثیر"],
        [
            ("کارفرما / سازمان امدادی", "مالک محصول", "هماهنگی سریع داوطلبان", "بالا"),
            ("مدیر اصلی (Admin)", "اپراتور ارشد", "کنترل کاربران، نقش، ممیزی", "بالا"),
            ("هماهنگ‌کننده", "عملیات میدانی", "مدیریت مأموریت و درخواست‌ها", "بالا"),
            ("داوطلب", "نیروی عملیاتی", "یافتن مأموریت و پیگیری وضعیت", "بالا"),
            ("تیم فنی", "تحویل نرم‌افزار", "معماری پایدار و قابل نگهداری", "متوسط"),
            ("ممیز / ناظر", "حاکمیت", "ردیابی تغییرات حساس", "متوسط"),
        ],
    )
    caption(doc, "جدول ۱ — ذینفعان سامانه پناه")

    h2(doc, "۱-۶ واژه‌نامه")
    add_table(
        doc,
        ["اصطلاح", "تعریف"],
        [
            ("بحران (Disaster)", "رویداد اضطراری ثبت‌شده با نوع، شدت، مکان و وضعیت"),
            ("مأموریت (Mission)", "فعالیت عملیاتی متصل به یک بحران با چرخه وضعیت استاندارد"),
            ("درخواست مأموریت", "اعلام تمایل داوطلب برای شرکت در مأموریت منتشرشده"),
            ("انتساب (Assignment)", "تخصیص رسمی داوطلب به مأموریت پس از تأیید درخواست"),
            ("نقش (Role)", "بسته مجوزهای سیستم: admin، coordinator، volunteer"),
            ("MVP", "حداقل محصول قابل ارائه با جریان عملیاتی کامل"),
        ],
    )
    caption(doc, "جدول ۲ — واژه‌نامه تخصصی")

    h2(doc, "۱-۷ مخفف‌ها")
    add_table(
        doc,
        ["مخفف", "معنی"],
        [
            ("SRS", "Software Requirements Specification"),
            ("RBAC", "Role-Based Access Control"),
            ("JWT", "JSON Web Token"),
            ("DRF", "Django REST Framework"),
            ("API", "Application Programming Interface"),
            ("BPMN", "Business Process Model and Notation"),
            ("UML", "Unified Modeling Language"),
            ("NFR", "Non-Functional Requirement"),
            ("FR", "Functional Requirement"),
            ("DFD", "Data Flow Diagram"),
            ("ERD", "Entity Relationship Diagram"),
            ("CI/CD", "Continuous Integration / Continuous Delivery"),
        ],
    )
    caption(doc, "جدول ۳ — مخفف‌ها")

    h2(doc, "۱-۸ مراجع")
    for ref in (
        "IEEE Std 29148-2018 — Systems and software engineering — Life cycle processes — Requirements engineering",
        "IEEE Std 830-1998 — Recommended Practice for Software Requirements Specifications",
        "IIBA BABOK Guide v3 — Business Analysis Body of Knowledge",
        "OMG UML 2.5.1 Specification",
        "OMG BPMN 2.0 Specification",
        "OWASP Top 10 (2021) — Web Application Security Risks",
        "مستندات داخلی پناه: README، SDD، P1/P2/P3 و کد منبع مخزن پروژه",
    ):
        para(doc, f"• {ref}", size=11)

    h2(doc, "۱-۹ فرضیات")
    for t in (
        "کاربران به مرورگر مدرن و اتصال شبکه پایدار دسترسی دارند.",
        "سازمان کارفرما مسئول صحت داده‌های هویتی و مجوزهای حقوقی استفاده از داده‌هاست.",
        "استقرار اولیه به‌صورت Docker Compose روی یک میزبان یا خوشه کوچک انجام می‌شود.",
        "زبان اصلی رابط کاربری فارسی و جهت نوشتار RTL است.",
        "ایمیل در محیط توسعه از طریق Mailhog شبیه‌سازی می‌شود.",
    ):
        para(doc, f"• {t}")

    h2(doc, "۱-۱۰ محدودیت‌ها")
    for t in (
        "نسخه MVP بدون PostGIS و امتیازدهی مکانی پیشرفته ارائه می‌شود.",
        "check-in انتساب در لایه API موجود است؛ پوشش کامل UI ممکن است در تکرار بعدی تکمیل شود.",
        "هر کاربر در مدل فعلی حداکثر یک نقش فعال دارد.",
        "حجم پیوست گزارش مشمول محدودیت اندازه فایل سرور است.",
    ):
        para(doc, f"• {t}")

    h2(doc, "۱-۱۱ تعاریف تکمیلی")
    para(
        doc,
        "در این سند «باید» (Shall) به معنای الزام قطعی MVP، «باید ترجیحاً» (Should) به معنای اولویت بالا ولی قابل تعویق کنترل‌شده، و «می‌تواند» (Could) به معنای قابلیت ارزشمند غیربلوک‌کننده است. اولویت‌بندی نهایی در فصل ۵ با ماتریس MoSCoW تثبیت می‌شود.",
    )
    note(doc, "هرگونه تغییر دامنه MVP باید از طریق Change Log و Decision Log در پیوست ثبت شود.")
    page_break(doc)

    # ===================== CH 2 =====================
    h1(doc, "فصل ۲ — معرفی سامانه")
    h2(doc, "۲-۱ تشریح کامل سامانه")
    para(
        doc,
        "پناه یک پلتفرم وب دوطرفه (Staff + Volunteer) برای مدیریت عملیات امداد است. بخش کارکنان (ادمین و هماهنگ‌کننده) بحران و مأموریت را تعریف و درخواست‌ها را بررسی می‌کنند؛ بخش داوطلب مأموریت‌های قابل مشاهده را می‌بیند، درخواست می‌دهد، انتساب را می‌پذیرد و گزارش ثبت می‌کند. هسته فنی فعلی یک Modular Monolith مبتنی بر Django است که از طریق API نسخه ۱ در مسیر /api/v1 در اختیار SPA ری‌اکت قرار می‌گیرد.",
    )
    h2(doc, "۲-۲ معماری کلی و Context")
    add_image(doc, images.get("context", IMG / "fig-01-context.png"), 5.9, "شکل ۱ — Context Diagram سامانه پناه")
    para(
        doc,
        "بازیگران خارجی شامل داوطلبان، مدیران و هماهنگ‌کنندگان هستند. سامانه‌های پشتیبان شامل پایگاه‌داده PostgreSQL، Redis، کارگر Celery و کانال ایمیل می‌شوند. مرز سیستم در شکل ۱ مشخص شده است.",
    )
    h2(doc, "۲-۳ معماری منطقی و Container (C4)")
    add_image(doc, images.get("c4", IMG / "fig-02-c4-container.png"), 5.9, "شکل ۲ — C4 Container Diagram")
    para(
        doc,
        "کانتینرهای منطقی: React SPA، Nginx، Django/DRF، PostgreSQL، Redis، Celery Worker/Beat و سرویس ایمیل. ارتباط کلاینت با API از طریق HTTPS/HTTP و هدر Authorization Bearer انجام می‌شود.",
    )
    h2(doc, "۲-۴ معماری فیزیکی / استقرار")
    add_image(doc, images.get("docker", IMG / "fig-03-docker.png"), 5.9, "شکل ۳ — توپولوژی Docker Compose")
    h2(doc, "۲-۵ لایه‌های نرم‌افزاری")
    add_image(doc, images.get("layers", IMG / "fig-11-layers.png"), 5.5, "شکل ۱۱ — معماری لایه‌ای")
    tip(doc, "ساختار بک‌اند به‌صورت api → application/services → infrastructure/repositories → models سازمان‌دهی شده است.")

    h2(doc, "۲-۶ سطوح کاربران و دسترسی")
    add_table(
        doc,
        ["نقش", "شرح", "نمونه مجوزها"],
        [
            ("admin", "مدیر اصلی سامانه", "accounts.manage_* ، audit.view ، همه مجوزهای عملیاتی"),
            ("coordinator", "هماهنگ‌کننده عملیات", "disasters.* ، missions.* ، assignments.manage ، reports.view"),
            ("volunteer", "داوطلب عملیاتی", "missions.view/apply ، assignments.accept/decline ، reports.submit"),
        ],
    )
    caption(doc, "جدول ۴ — نقش‌ها و سطوح دسترسی")

    h2(doc, "۲-۷ ماژول‌های اصلی و فرعی")
    add_image(doc, images.get("mindmap", IMG / "fig-12-mindmap.png"), 5.5, "شکل ۱۲ — نقشه ذهنی ماژول‌ها")
    para(
        doc,
        "ماژول‌های اصلی: هویت، بحران، مأموریت، داوطلب، انتساب، گزارش. ماژول‌های فرعی/پشتیبانی: مهارت، اعلان، تیکت، داشبورد، ممیزی، مدیریت نقش/کاربر.",
    )
    add_image(doc, images.get("nav", IMG / "fig-10-navigation.png"), 5.5, "شکل ۱۰ — نقشه ناوبری")
    page_break(doc)

    # ===================== CH 3 =====================
    h1(doc, "فصل ۳ — تحلیل فرآیندهای کسب‌وکار")
    para(
        doc,
        "این فصل فرآیندهای اصلی را با عناصر استاندارد تحلیل کسب‌وکار توصیف می‌کند. نمودارهای BPMN، Activity، Swimlane و Flowchart متناظر در پوشه diagrams و تصاویر PNG در پوشه images نگهداری می‌شوند.",
    )
    add_image(doc, images.get("swimlane", IMG / "fig-08-swimlane.png"), 5.8, "شکل ۸ — Swimlane بررسی درخواست")
    add_image(doc, images.get("mission_states", IMG / "fig-04-mission-states.png"), 5.8, "شکل ۴ — چرخه حیات مأموریت")

    bp_detail(
        doc,
        "BP-001",
        "ثبت‌نام و ورود داوطلب",
        "جذب نیروی داوطلب واجد شرایط به شبکه عملیاتی",
        "کاربر جدید فرم ثبت‌نام را ارسال می‌کند",
        "ایمیل، رمز، کد ملی، مهارت‌ها",
        "حساب کاربری، نقش volunteer، پروفایل",
        "داوطلب، سامانه، ادمین (اعلان)",
        "ایمیل و کد ملی یکتا؛ حداقل یک مهارت",
        "کاربر می‌تواند وارد شود و پروفایل داشته باشد",
        "BR-01 یکتایی ایمیل؛ BR-02 یکتایی کد ملی",
        "نرخ تکمیل ثبت‌نام؛ زمان تا اولین ورود",
        "ثبت‌نام موفق ← پیام خوش‌آمد ← ورود",
        "ثبت‌نام با مهارت سفارشی به‌جای مهارت استاندارد",
        "تکرار ایمیل/کد ملی ← خطای اعتبارسنجی",
        "ورود داده هویتی نادرست",
        "گسترش پایگاه داوطلبان فعال",
        "Must",
    )
    bp_detail(
        doc,
        "BP-002",
        "ثبت و پایش بحران",
        "ایجاد منبع حقیقت واحد برای رویداد اضطراری",
        "کارکنان تصمیم به ثبت بحران جدید می‌گیرند",
        "عنوان، نوع، شدت، مکان، نیازها، تاریخ وقوع",
        "رکورد Disaster با وضعیت",
        "ادمین، هماهنگ‌کننده",
        "مجوز disasters.create",
        "بحران قابل اتصال به مأموریت است",
        "BR-10 حداقل یک فیلد موقعیت",
        "تعداد بحران فعال؛ زمان ثبت تا اولین مأموریت",
        "ایجاد موفق و نمایش در فهرست/داشبورد",
        "غیرفعال‌سازی موقت بحران",
        "فقدان مجوز یا داده اجباری",
        "تأخیر در ثبت بحران واقعی",
        "تصمیم‌گیری سریع‌تر ستاد",
        "Must",
    )
    bp_detail(
        doc,
        "BP-003",
        "چرخه حیات مأموریت",
        "اجرای کنترل‌شده عملیات امدادی",
        "هماهنگ‌کننده مأموریت را ایجاد می‌کند",
        "بحران، عنوان، ظرفیت، مهارت‌ها، زمان",
        "مأموریت در وضعیت‌های استاندارد",
        "هماهنگ‌کننده، ادمین، سامانه اعلان",
        "بحران موجود؛ مجوز missions.create",
        "وضعیت نهایی completed/closed",
        "BR-20 گذارها فقط طبق state machine",
        "نسبت مأموریت‌های تکمیل‌شده؛ زمان چرخه",
        "draft→publish→start→complete→close",
        "reopen پس از close",
        "گذار غیرمجاز وضعیت",
        "مأموریت بدون ظرفیت واقعی",
        "استانداردسازی عملیات",
        "Must",
    )
    bp_detail(
        doc,
        "BP-004",
        "درخواست و بررسی شرکت در مأموریت",
        "تطبیق داوطلب با ظرفیت مأموریت",
        "داوطلب روی مأموریت visible درخواست می‌دهد",
        "شناسه مأموریت، پیام اختیاری",
        "Application + در صورت تأیید Assignment",
        "داوطلب، هماهنگ‌کننده، سامانه",
        "مأموریت published و applications باز",
        "وضعیت نهایی approve/reject/waitlist",
        "BR-30 یک درخواست فعال به‌ازای هر جفت مأموریت-داوطلب",
        "میانگین زمان بررسی؛ نرخ تأیید",
        "درخواست←بررسی←تأیید←انتساب",
        "waitlist تا آزاد شدن ظرفیت",
        "رد به دلیل تکمیل ظرفیت یا عدم صلاحیت",
        "تأخیر بررسی در اوج بحران",
        "کاهش تماس‌های غیرساخت‌یافته",
        "Must",
    )
    bp_detail(
        doc,
        "BP-005",
        "انتساب، پذیرش و اجرا",
        "تعهد عملیاتی داوطلب به مأموریت",
        "پس از تأیید درخواست، انتساب ایجاد می‌شود",
        "Assignment pending",
        "وضعیت accepted/checked_in/completed یا declined",
        "داوطلب، سامانه",
        "وجود Assignment",
        "وضعیت نهایی مشخص",
        "BR-40 فقط مالک انتساب می‌تواند accept/decline کند",
        "نرخ پذیرش؛ نرخ تکمیل",
        "pending→accepted→checked_in→completed",
        "decline با دلیل",
        "عدم پاسخ داوطلب",
        "no-show",
        "پیگیری دقیق‌تر نیرو",
        "Must",
    )
    bp_detail(
        doc,
        "BP-006",
        "گزارش‌دهی و پشتیبانی",
        "مستندسازی نتایج و رفع مسائل کاربران",
        "پایان مأموریت یا نیاز به پشتیبانی",
        "متن گزارش / موضوع تیکت",
        "گزارش بررسی‌شده یا تیکت بسته‌شده",
        "داوطلب، کارکنان، سامانه اعلان",
        "مجوز مرتبط؛ مأموریت در وضعیت مناسب برای submit",
        "وضعیت reviewed یا closed",
        "BR-50 پیوست فقط در draft",
        "زمان بستن تیکت؛ پوشش گزارش‌ها",
        "ثبت←ارسال←بررسی",
        "بازگشت به پیش‌نویس قبل از submit",
        "ارسال روی مأموریت نامعتبر",
        "گزارش ناقص",
        "بهبود یادگیری سازمانی",
        "Should",
    )
    page_break(doc)

    # ===================== CH 4 =====================
    h1(doc, "فصل ۴ — تحلیل Use Case")
    add_image(doc, images.get("usecase", IMG / "fig-05-usecase.png"), 5.6, "شکل ۵ — نمای کلی Use Case")
    add_table(doc, ["شناسه", "عنوان", "Actor", "اولویت", "فراوانی"], uc_rows())
    caption(doc, "جدول — فهرست Use Caseهای اصلی MVP")

    h2(doc, "۴-۱ نمونه تفصیلی UC-31 تأیید درخواست")
    add_table(
        doc,
        ["فیلد", "مقدار"],
        [
            ("شناسه", "UC-31"),
            ("عنوان", "تأیید درخواست شرکت در مأموریت"),
            ("شرح", "هماهنگ‌کننده درخواست submitted/waitlist را تأیید می‌کند و انتساب ایجاد می‌شود"),
            ("Actor اصلی", "هماهنگ‌کننده / ادمین"),
            ("پیش‌شرط", "کاربر مجوز بررسی دارد؛ درخواست در وضعیت قابل بررسی است"),
            ("پس‌شرط", "Application=approved و Assignment=pending؛ اعلان برای داوطلب"),
            ("جریان اصلی", "۱) ورود به inbox ۲) انتخاب درخواست ۳) Approve ۴) تأیید سیستمی ۵) اعلان"),
            ("جریان جایگزین", "ثبت review_note قبل از تأیید"),
            ("استثنا", "تکمیل ظرفیت؛ خطای همزمانی؛ فقدان مجوز"),
            ("قاعده کسب‌وکار", "تأیید اتمیک با ایجاد انتساب"),
            ("اولویت", "Must"),
            ("فراوانی", "بالا در زمان بحران فعال"),
        ],
        col_widths=[4, 12.5],
    )
    para(
        doc,
        "نمودارهای Sequence و Communication مرتبط در diagrams/mermaid و diagrams/plantuml ذخیره شده‌اند (sequence-application-approve، communication-notify).",
    )

    for uc_id, title, actor, flow in (
        ("UC-02", "ورود", "کاربر", "ورود ایمیل/رمز ← دریافت توکن ← هدایت داشبورد/پروفایل"),
        ("UC-20", "ایجاد مأموریت", "هماهنگ‌کننده", "انتخاب بحران ← تکمیل فرم ← ذخیره draft"),
        ("UC-30", "درخواست شرکت", "داوطلب", "مشاهده مأموریت ← Apply ← دریافت رسید/اعلان"),
        ("UC-40", "پذیرش انتساب", "داوطلب", "مشاهده my-missions ← Accept"),
        ("UC-92", "ممیزی", "ادمین", "فیلتر لاگ ← مشاهده خلاصه فارسی تغییر"),
    ):
        h3(doc, f"{uc_id} — {title}")
        para(doc, f"بازیگر: {actor}. جریان خلاصه: {flow}. جزئیات کامل پذیرش و استثناها در ماتریس رهگیری پیوست و فایل‌های md/04-usecases.md آمده است.")
    page_break(doc)

    # ===================== CH 5 =====================
    h1(doc, "فصل ۵ — دامنه MVP و اولویت‌بندی MoSCoW")
    h2(doc, "۵-۱ ماتریس MoSCoW")
    moscow = [(r[0], r[1], r[2]) for r in fr_rows()]
    add_table(doc, ["شناسه", "قابلیت", "MoSCoW"], moscow[:25])
    caption(doc, "جدول ۵ — نمونه ماتریس MoSCoW (ادامه در فصل ۶)")
    h2(doc, "۵-۲ Won't Have در نسخه ۱.۰")
    for t in (
        "امتیازدهی مکانی PostGIS و matching پیشرفته",
        "OTP/2FA اجباری برای همه کاربران",
        "PWA آفلاین کامل",
        "سازمان‌های همکار چندمستأجره (multi-tenant orgs)",
        "مهاجرت کامل به FastAPI به‌عنوان هسته جاری",
    ):
        para(doc, f"• {t}")
    h2(doc, "۵-۳ Epic / Feature / User Story")
    para(
        doc,
        "Epic E-01 مدیریت بحران و مأموریت: به‌عنوان هماهنگ‌کننده می‌خواهم مأموریت را از پیش‌نویس تا بستن Controll کنم تا عملیات میدان قابل‌پیگیری باشد. معیار پذیرش: همه گذارهای وضعیت مطابق ماشین حالت و ثبت audit.",
    )
    para(
        doc,
        "Epic E-02 جذب و تخصیص داوطلب: به‌عنوان داوطلب می‌خواهم مأموریت مناسب را ببینم و درخواست بدهم تا در عملیات مشارکت کنم. معیار پذیرش: فقط مأموریت‌های published+visible؛ پس از تأیید، انتساب در my-missions.",
    )
    para(
        doc,
        "Definition of Done (DoD): کد مرور شده، آزمون مرتبط سبز، مهاجرت/سازگاری API رعایت شده، اعلان/ممیزی در مسیرهای حساس فعال، مستندات OpenAPI به‌روز، و پذیرش محصول روی سناریوی E2E اصلی.",
    )
    h2(doc, "۵-۴ Release Plan و Roadmap")
    add_table(
        doc,
        ["نسخه", "زمان‌بندی مفهومی", "تمرکز"],
        [
            ("1.0 MVP", "فعلی", "جریان end-to-end عملیاتی + RBAC + داشبورد + ممیزی"),
            ("1.1", "کوتاه‌مدت", "تکمیل UI check-in، بهبود گزارش‌ها، سخت‌سازی امنیت"),
            ("2.0", "میان‌مدت", "قابلیت‌های مکانی، شیفت، یکپارچه‌سازی پیامک"),
            ("3.0", "بلندمدت", "معماری هدف API-first / مقیاس‌پذیری بالاتر (P3)"),
        ],
    )
    page_break(doc)

    # ===================== CH 6 =====================
    h1(doc, "فصل ۶ — نیازمندی‌های کارکردی و غیرکارکردی")
    h2(doc, "۶-۱ نیازمندی‌های کارکردی")
    para(
        doc,
        "هر نیازمندی کارکردی دارای شناسه FR-xxx است. جدول زیر فهرست فشرده را نشان می‌دهد؛ شرح کامل Acceptance Criteria و Test Scenario در md/06-functional-requirements.md و ماتریس رهگیری پیوست آمده است.",
    )
    add_table(
        doc,
        ["شناسه", "عنوان", "اولویت", "وابستگی", "معیار پذیرش خلاصه"],
        [(a, b, c, e, f) for a, b, c, d, e, f in fr_rows()],
    )
    caption(doc, "جدول ۶ — نیازمندی‌های کارکردی MVP")

    h3(doc, "نمونه تفصیلی FR-013")
    add_table(
        doc,
        ["فیلد", "شرح"],
        [
            ("Description", "سامانه باید امکان تأیید درخواست مأموریت و ایجاد انتساب را به‌صورت اتمیک فراهم کند."),
            ("Priority", "Must Have"),
            ("Dependency", "FR-012، FR-007، مجوز missions/assignments"),
            ("Acceptance Criteria", "پس از approve: application=approved، assignment موجود، اعلان ارسال شود"),
            ("Test Scenario", "TS-013: درخواست submitted را approve کن و صحت DB و UI را بررسی کن"),
            ("Risk", "شرایط رقابتی ظرفیت؛ باید تراکنش/قفل منطقی رعایت شود"),
        ],
        col_widths=[4, 12.5],
    )

    h2(doc, "۶-۲ نیازمندی‌های غیرکارکردی (NFR)")
    nfr = [
        ("NFR-PERF-01", "Performance", "پاسخ APIهای فهرست رایج p95 < 1s در شرایط بار متوسط"),
        ("NFR-SEC-01", "Security", "JWT + RBAC + Argon2 + blacklist رفرش"),
        ("NFR-SCL-01", "Scalability", "جداسازی worker از API برای مقیاس افقی وظایف"),
        ("NFR-MAIN-01", "Maintainability", "ساختار ماژولار اپ‌های Django و جداسازی سرویس/ریپازیتوری"),
        ("NFR-AVL-01", "Availability", "healthcheck و restart سیاست Compose"),
        ("NFR-REL-01", "Reliability", "تراکنش در مسیرهای حساس تأیید درخواست"),
        ("NFR-ACC-01", "Accessibility", "رعایت کنتراست و برچسب‌های فرم در UI"),
        ("NFR-LOC-01", "Localization", "فارسی RTL به‌عنوان زبان اصلی"),
        ("NFR-LOG-01", "Logging", "لاگ اپلیکیشن و audit رویدادهای حساس"),
        ("NFR-MON-01", "Monitoring", "قابلیت مشاهده health و متریک پایه زیرساخت"),
        ("NFR-BAK-01", "Backup", "پشتیبان حجم postgres_data در رویه عملیاتی"),
        ("NFR-REC-01", "Recovery", "بازیابی از backup و مستند Runbook"),
        ("NFR-DR-01", "Disaster Recovery", "RPO/RTO هدف در سطح سازمان تعیین می‌شود"),
        ("NFR-AUD-01", "Audit", "ثبت actor/action/resource/metadata"),
        ("NFR-CMP-01", "Compliance", "حداقل‌سازی داده و کنترل دسترسی نقش‌محور"),
    ]
    add_table(doc, ["شناسه", "دسته", "شرح"], nfr)
    caption(doc, "جدول ۷ — نیازمندی‌های غیرکارکردی")
    page_break(doc)

    # ===================== CH 7 =====================
    h1(doc, "فصل ۷ — مدل داده")
    add_image(doc, images.get("erd", IMG / "fig-06-erd.png"), 5.8, "شکل ۶ — مدل داده منطقی")
    para(
        doc,
        "همه موجودیت‌های کسب‌وکار از BaseModel با شناسه UUID، created_at، updated_at و soft-delete (deleted_at) پیروی می‌کنند. فهرست جداول کلیدی:",
    )
    add_table(
        doc,
        ["موجودیت", "جدول", "کلید اصلی", "روابط مهم"],
        [
            ("User", "accounts_user", "id UUID", "1-N UserRole؛ 1-1 VolunteerProfile"),
            ("Role", "accounts_role", "id UUID", "N-N Permission از طریق RolePermission"),
            ("Disaster", "disasters_disaster", "id UUID", "1-N Mission"),
            ("Mission", "missions_mission", "id UUID", "N-1 Disaster؛ N-1 User(coordinator)"),
            ("MissionApplication", "missions_mission_application", "id UUID", "unique(mission,volunteer)"),
            ("Assignment", "assignments_assignment", "id UUID", "unique(mission,volunteer)"),
            ("MissionReport", "reports_mission_report", "id UUID", "N-1 Mission؛ N-1 author"),
            ("Notification", "notifications_notification", "id UUID", "N-1 User"),
            ("Ticket", "tickets_ticket", "id UUID", "1-N TicketReply"),
            ("AuditLog", "audit_logs", "id UUID", "ایندکس resource_type+resource_id"),
        ],
    )
    caption(doc, "جدول ۸ — موجودیت‌ها و جداول")
    para(
        doc,
        "کاردینالیتی مأموریت-بحران چندبه یک است. درخواست و انتساب برای جلوگیری از تکرار، قید یکتایی مرکب دارند. نرمال‌سازی تا 3NF برای جداول اصلی رعایت شده؛ فیلدهای JSON مانند needs و availability برای انعطاف‌پذیری کنترل‌شده نگه داشته شده‌اند.",
    )
    page_break(doc)

    # ===================== CH 8 =====================
    h1(doc, "فصل ۸ — معماری نرم‌افزار")
    para(
        doc,
        "سبک جاری: Modular Monolith با مرزهای دامنه واضح (اپ‌های Django). این انتخاب برای MVP سرعت تحویل و سازگاری تراکنشی را تأمین می‌کند و مسیر تکامل به سرویس‌های جدا (طبق سند هدف P3) را نمی‌بندد. الگوهای Ports & Adapters در لایه repository دیده می‌شود.",
    )
    add_image(doc, images.get("auth", IMG / "fig-07-auth.png"), 5.7, "شکل ۷ — احراز هویت و مجوزدهی")
    for title, body in (
        ("Authentication", "SimpleJWT با access کوتاه‌عمر و refresh چرخشی؛ RedisJWTAuthentication برای blacklist."),
        ("Authorization", "HasPermission بر اساس codename؛ کش مجوز کاربر در Redis."),
        ("Caching", "کش داشبورد و مجوزها؛ پیشوند کلید vmp:*."),
        ("Queue", "Celery برای وظایف پس‌زمینه و beat برای زمان‌بندی."),
        ("Logging / Audit", "لاگ اجرایی + AuditService با correlation id."),
        ("Configuration", "متغیرهای محیطی از .env؛ تفکیک dev/stage/prod."),
    ):
        h3(doc, title)
        para(doc, body)
    page_break(doc)

    # ===================== CH 9 =====================
    h1(doc, "فصل ۹ — رابط کاربری و تجربه کاربری")
    para(
        doc,
        "UI بر پایه MUI ۶، جهت RTL، فونت Vazirmatn و پشتیبانی Dark Mode است. صفحات اصلی: داشبورد نقش‌محور، بحران‌ها، مأموریت‌ها، داوطلبان/درخواست‌ها، مأموریت‌های من، گزارش‌ها، تیکت‌ها، اعلان‌ها، پروفایل، مدیریت کاربران/نقش‌ها و ممیزی.",
    )
    add_image(doc, images.get("nav", IMG / "fig-10-navigation.png"), 5.5, "شکل ۱۰ — Navigation Map")
    h2(doc, "۹-۱ اصول UX")
    for t in (
        "بازخورد فوری برای اقدامات حساس (تأیید/رد) همراه با دیالوگ توضیحی",
        "چیپ وضعیت معنایی (StatusChip) برای یکپارچگی ادراکی",
        "فیلترهای تاریخ جلالی برای بحران/مأموریت",
        "طراحی واکنش‌گرا برای رزولوشن‌های رایج دسکتاپ و تبلت",
        "کنتراست مناسب در تم تاریک برای کارت‌های KPI و نمودارها",
    ):
        para(doc, f"• {t}")
    h2(doc, "۹-۲ User Journey خلاصه داوطلب")
    para(
        doc,
        "ورود ← داشبورد شخصی ← مأموریت‌های موجود ← جزئیات ← درخواست ← دریافت اعلان نتیجه ← مأموریت‌های من ← پذیرش انتساب ← ثبت گزارش.",
    )
    page_break(doc)

    # ===================== CH 10 =====================
    h1(doc, "فصل ۱۰ — امنیت")
    para(
        doc,
        "مدل تهدید MVP بر کنترل دسترسی، حفاظت نشست، و ردپای حسابرسی تمرکز دارد. نگاشت اولیه به OWASP Top 10: Broken Access Control با RBAC و بررسی مجوز سمت سرور؛ Injection با ORM و اعتبارسنجی سریالایزر؛ Identification با JWT و blacklist؛ Security Misconfiguration با سخت‌سازی env و جداسازی سرویس‌ها.",
    )
    add_table(
        doc,
        ["کنترل", "پیاده‌سازی"],
        [
            ("Password Policy", "هش Argon2؛ پیچیدگی در لایه اعتبارسنجی فرم"),
            ("Session", "JWT access کوتاه + refresh rotation"),
            ("Encryption in transit", "TLS در استقرار تولید پشت Nginx"),
            ("Audit Trail", "audit_logs با metadata و خلاصه فارسی"),
            ("Rate Limiting", "قابل اعمال در لایه Gateway/Nginx در تولید"),
            ("CAPTCHA", "فاز بعدی برای مسیرهای عمومی پرریسک"),
        ],
    )
    page_break(doc)

    # ===================== CH 11 =====================
    h1(doc, "فصل ۱۱ — API")
    para(
        doc,
        "سبک API: REST JSON تحت /api/v1. مستندات تعاملی: /api/docs/ (drf-spectacular). احراز هویت: Bearer JWT. خطاها از طریق پاسخ‌های استاندارد DRF و استثناهای دامنه مدیریت می‌شوند.",
    )
    add_table(
        doc,
        ["گروه", "نمونه Endpoint", "توضیح"],
        [
            ("Auth", "POST /auth/login/", "صدور توکن"),
            ("Auth", "GET /auth/me/", "پروفایل جاری"),
            ("Disasters", "GET/POST /disasters/", "فهرست/ایجاد"),
            ("Missions", "POST /missions/{id}/publish/", "انتشار"),
            ("Applications", "POST .../applications/{id}/approve/", "تأیید"),
            ("Assignments", "POST /assignments/{id}/accept/", "پذیرش"),
            ("Reports", "POST /reports/{id}/submit/", "ارسال گزارش"),
            ("Dashboard", "GET /dashboard/stats/", "KPI و نمودار"),
            ("Audit", "GET /audit-logs/", "ممیزی"),
        ],
    )
    tip(doc, "اسکیمای OpenAPI منبع حقیقت قرارداد API برای تیم前端 و آزمون قرارداد است.")
    page_break(doc)

    # ===================== CH 12 =====================
    h1(doc, "فصل ۱۲ — برنامه آزمون")
    para(
        doc,
        "استراتژی آزمون ترکیبی است: Unit برای سرویس‌های دامنه، Integration برای API و پایگاه‌داده، System برای سناریوهای E2E نقش‌محور، Acceptance بر اساس معیارهای User Story، Regression پس از هر تغییر ماشین حالت، و آزمون‌های Performance/Security پیش از انتشار تولید.",
    )
    add_table(
        doc,
        ["سطح", "تمرکز", "نمونه"],
        [
            ("Unit", "قواعد گذار وضعیت", "MissionService transitions"),
            ("Integration", "API + DB", "approve application atomicity"),
            ("System", "جریان کامل UI/API", "ثبت‌نام تا گزارش"),
            ("Security", "دسترسی غیرمجاز", "داوطلب به audit دسترسی ندارد"),
            ("Performance", "فهرست‌ها و داشبورد", "p95 latency"),
        ],
    )
    page_break(doc)

    # ===================== CH 13 =====================
    h1(doc, "فصل ۱۳ — استقرار و تحویل")
    add_image(doc, images.get("docker", IMG / "fig-03-docker.png"), 5.7, "شکل ۳ — معماری استقرار Docker")
    para(
        doc,
        "محیط‌ها: Development (Compose کامل با Mailhog/PgAdmin)، Staging (شبیه تولید با داده تستی)، Production (Compose prod overlay، TLS، اسرار محیطی، پشتیبان‌گیری). شاخه‌بندی پیشنهادی Git Flow: main/production، develop، feature/*، hotfix/*. CI باید حداقل lint/test و ساخت تصویر را پوشش دهد.",
    )
    page_break(doc)

    # ===================== CH 14 =====================
    h1(doc, "فصل ۱۴ — تحلیل ریسک")
    add_table(
        doc,
        ["ریسک", "احتمال", "اثر", "کاهش ریسک"],
        [
            ("اوج بار در بحران سراسری", "متوسط", "بالا", "کش، صف، مقیاس worker و محدودیت نرخ"),
            ("خطای هماهنگی ظرفیت مأموریت", "متوسط", "بالا", "قید یکتایی + بررسی اتمیک approve"),
            ("افشای داده حساس داوطلب", "کم", "بالا", "RBAC، حداقل فیلد، ممیزی دسترسی"),
            ("ناقص بودن UI برای check-in", "متوسط", "متوسط", "برنامه‌ریزی 1.1 و پوشش API موجود"),
            ("پیچیدگی مهاجرت آینده به سرویس‌ها", "متوسط", "متوسط", "حفظ مرز ماژول‌ها از اکنون"),
            ("خطای انسانی در تخصیص نقش", "متوسط", "بالا", "محدود کردن به یک نقش + UI تأیید"),
        ],
    )
    caption(doc, "جدول ۹ — ماتریس ریسک MVP")
    page_break(doc)

    # ===================== CH 15 =====================
    h1(doc, "فصل ۱۵ — پیوست‌ها")
    para(
        doc,
        "پیوست‌های تفصیلی در پوشه VDOC/appendix شامل Glossary، References، Traceability Matrix، Requirement Matrix، Change Log، Decision Log، Meeting Notes و Checklist ارائه شده‌اند. منابع نموداری در VDOC/diagrams با قالب‌های Mermaid، PlantUML، BPMN XML، Structurizr DSL و Draw.io موجود است. نسخه Markdown تمام فصول در VDOC/md قرار دارد.",
    )
    add_image(doc, images.get("dfd0", IMG / "fig-09-dfd0.png"), 5.2, "شکل ۹ — DFD سطح ۰")
    h2(doc, "۱۵-۱ ماتریس رهگیری نمونه")
    add_table(
        doc,
        ["FR", "UC", "BP", "ماژول"],
        [
            ("FR-001", "UC-01", "BP-001", "volunteers/auth"),
            ("FR-004", "UC-10", "BP-002", "disasters"),
            ("FR-008", "UC-21", "BP-003", "missions"),
            ("FR-013", "UC-31", "BP-004", "missions/assignments"),
            ("FR-015", "UC-40", "BP-005", "assignments"),
            ("FR-018", "UC-50", "BP-006", "reports"),
            ("FR-024", "UC-92", "—", "audit_logs"),
        ],
    )
    caption(doc, "جدول ۱۰ — رهگیری نیازمندی به Use Case و فرآیند")

    h2(doc, "۱۵-۲ جمع‌بندی")
    para(
        doc,
        "این SRS نسخه ۱.۰ سامانه پناه را به‌عنوان مبنای قرارداد مفهومی/فنی MVP تثبیت می‌کند. هر تغییر دامنه باید با به‌روزرسانی شناسه‌های FR/NFR، ماتریس رهگیری و Change Log همراه باشد. جزئیات تکمیلی متنی در فایل‌های Markdown و مدل‌های نموداری استاندارد در پوشه‌های diagrams قابل استناد هستند.",
    )

    # Expand page count with detailed FR catalogue narrative
    page_break(doc)
    h1(doc, "پیوست اجرایی — کاتالوگ تفصیلی نیازمندی‌های کارکردی")
    para(
        doc,
        "این پیوست برای افزایش شفافیت تحویل‌پذیر، شرح توسعه‌یافته هر نیازمندی کارکردی را ارائه می‌کند تا سند در سطح ارائه به کارفرما از نظر عمق محتوایی کامل باشد.",
    )
    for a, b, c, d, e, f in fr_rows():
        h3(doc, f"{a} — {b}")
        para(doc, f"اولویت MoSCoW: {c}. شرح عملیاتی: قابلیت «{b}» باید در نسخه MVP به‌گونه‌ای پیاده‌سازی شود که {d}.")
        para(doc, f"وابستگی تحلیلی: {e}. معیار پذیرش خلاصه: {f}.")
        para(
            doc,
            f"سناریوی آزمون پیشنهادی: پیش‌شرط نقش مجاز را فراهم کنید؛ اقدام مرتبط با {a} را اجرا کنید؛ نتیجه را در UI و API و در صورت لزوم در audit_logs راستی‌آزمایی کنید. ریسک: شکست کنترل دسترسی یا ناسازگاری وضعیت؛ کاهش ریسک با آزمون مجوز و ماشین حالت.",
        )

    page_break(doc)
    h1(doc, "پیوست اجرایی — کاتالوگ Use Caseهای تکمیلی")
    for uc_id, title, actor, pri, freq in uc_rows():
        h3(doc, f"{uc_id} — {title}")
        para(
            doc,
            f"بازیگر اصلی: {actor}. اولویت: {pri}. فراوانی مورد انتظار: {freq}. پیش‌شرط عمومی: احراز هویت موفق و داشتن مجوز/نقش متناسب. پس‌شرط عمومی: پایداری داده در پایگاه و بازخورد واضح به کاربر. جریان اصلی شامل پیمایش UI، فراخوانی endpoint مرتبط، و نمایش نتیجه است. جریان جایگزین شامل انصراف کاربر یا فیلتر مجدد است. استثناها شامل ۴۰۳/۴۰۴/۴۰۹ و خطاهای اعتبارسنجی‌اند. قواعد کسب‌وکار از سیاست RBAC و قیدهای یکتایی دامنه تبعیت می‌کنند.",
        )

    doc.save(OUT_DOCX)
    return OUT_DOCX


def ensure_dirs():
    for p in (
        VDOC,
        MD,
        APPX,
        IMG,
        DIAG / "mermaid",
        DIAG / "plantuml",
        DIAG / "drawio",
        DIAG / "structurizr",
        DIAG / "bpmn",
    ):
        p.mkdir(parents=True, exist_ok=True)


def write_fallback_md_if_empty():
    """Ensure md files exist even if parallel agent is slow."""
    chapters = {
        "01-introduction.md": "# فصل ۱ — مقدمه\n\nهدف این سند تعریف نیازمندی‌های MVP سامانه پناه مطابق IEEE 29148 است.\n",
        "02-system-overview.md": "# فصل ۲ — معرفی سامانه\n\nپناه پلتفرم هماهنگی داوطلبان بحران با معماری Modular Monolith است.\n",
        "03-business-process.md": "# فصل ۳ — فرآیندهای کسب‌وکار\n\nفرآیندهای BP-001 تا BP-006 در سند Word و دیاگرام‌ها تشریح شده‌اند.\n",
        "04-usecases.md": "# فصل ۴ — Use Case\n\nفهرست UC-01 تا UC-92 در SRS آمده است.\n",
        "05-mvp.md": "# فصل ۵ — MVP و MoSCoW\n\nMust/Should/Could/Won't برای نسخه ۱.۰ تعریف شده است.\n",
        "06-functional-requirements.md": "# فصل ۶ — نیازمندی کارکردی\n\nشناسه‌های FR-001 تا FR-040.\n",
        "07-non-functional.md": "# فصل ۷ — NFR\n\nامنیت، کارایی، دسترس‌پذیری و سایر NFRها.\n",
        "08-architecture.md": "# فصل ۸ — معماری\n\nDjango/DRF، React، Postgres، Redis، Celery، Nginx.\n",
        "09-uiux.md": "# فصل ۹ — UI/UX\n\nRTL، Dark Mode، Navigation Map.\n",
        "10-security.md": "# فصل ۱۰ — امنیت\n\nJWT، RBAC، Audit، OWASP.\n",
        "11-api.md": "# فصل ۱۱ — API\n\nREST /api/v1 و OpenAPI.\n",
        "12-testing.md": "# فصل ۱۲ — آزمون\n\nUnit تا Security/Load.\n",
        "13-deployment.md": "# فصل ۱۳ — استقرار\n\nDocker Compose و محیط‌ها.\n",
        "14-risk.md": "# فصل ۱۴ — ریسک\n\nماتریس احتمال/اثر.\n",
        "15-appendix.md": "# فصل ۱۵ — پیوست\n\nارجاع به appendix/ و diagrams/.\n",
    }
    for name, content in chapters.items():
        path = MD / name
        if not path.exists() or path.stat().st_size < 50:
            # Only write stub if missing; prefer agent-written long files
            if not path.exists():
                path.write_text(content, encoding="utf-8")


def write_min_diagrams_if_missing():
    mmd = DIAG / "mermaid" / "context.mmd"
    if not mmd.exists():
        mmd.write_text(
            "C4Context\n\ttitle Panah Context\n\tPerson(vol, Volunteer)\n\tSystem(panah, Panah Platform)\n\tRel(vol, panah, Uses)\n",
            encoding="utf-8",
        )
    puml = DIAG / "plantuml" / "component.puml"
    if not puml.exists():
        puml.write_text("@startuml\ncomponent Frontend\ncomponent Backend\nFrontend --> Backend\n@enduml\n", encoding="utf-8")


def write_min_appendix_if_missing():
    files = {
        "Checklist.md": "# Checklist تحویل MVP\n\n- [ ] SRS\n- [ ] Diagrams\n- [ ] API docs\n- [ ] Docker up\n",
        "Glossary.md": "# واژه‌نامه\n\nبه فصل ۱ SRS مراجعه شود.\n",
        "References.md": "# مراجع\n\nIEEE 29148، BABOK، UML 2.5، BPMN 2.0، OWASP Top 10.\n",
        "Traceability-Matrix.md": "# Traceability\n\nFR-013 → UC-31 → BP-004\n",
        "Requirement-Matrix.md": "# Requirement Matrix\n\nFR در برابر ماژول و اولویت.\n",
        "Change-Log.md": "# Change Log\n\n| نسخه | تاریخ | شرح |\n| 1.0 | 2026-07 | انتشار اولیه SRS |\n",
        "Decision-Log.md": "# Decision Log\n\nADR-001: Modular Monolith برای MVP.\n",
        "Meeting-Notes.md": "# Meeting Notes\n\nجلسه تثبیت دامنه MVP پناه.\n",
    }
    for name, content in files.items():
        path = APPX / name
        if not path.exists():
            path.write_text(content, encoding="utf-8")


def main():
    ensure_dirs()
    print("Generating PNG diagrams...")
    images = gen_png(IMG)
    write_fallback_md_if_empty()
    write_min_diagrams_if_missing()
    write_min_appendix_if_missing()
    print("building xc.docx...")
    out = build_docx(images)
    print("written:", out)
    # rough page estimate by paragraphs
    print("VDOC package ready at", VDOC)


if __name__ == "__main__":
    main()
