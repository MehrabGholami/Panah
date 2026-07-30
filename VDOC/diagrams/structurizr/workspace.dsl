/*
 * فضای کاری Structurizr برای سامانه مدیریت بحران و داوطلبان پناه
 * سطح یک زمینه و سطح دو کانتینر از مدل C4 همراه با نمای استقرار و نمای مؤلفه سرویس API
 * اجرا با ابزار Structurizr Lite یا Structurizr CLI
 */
workspace "پناه" "سامانه مدیریت بحران و داوطلبان" {

    !identifiers hierarchical

    model {

        # بازیگران انسانی
        volunteer = person "داوطلب" "شهروند ثبت‌نام‌شده با نقش volunteer که پروفایل و مهارت خود را نگه می‌دارد، مأموریت‌های منتشرشده را می‌بیند، درخواست همکاری می‌دهد و حضور خود را ثبت می‌کند" "Volunteer"
        coordinator = person "هماهنگ‌کننده" "کارشناس ستاد بحران با نقش coordinator که رویداد و مأموریت می‌سازد، درخواست‌ها را بررسی و داوطلبان را تخصیص می‌دهد و گزارش ثبت می‌کند" "Coordinator"
        administrator = person "مدیر سامانه" "مدیر ارشد با نقش admin و دسترسی کامل به کاربران، نقش‌ها، مجوزها، داشبورد و گزارش حسابرسی" "Administrator"

        # سامانه‌های بیرونی
        mailService = softwareSystem "سرویس ایمیل SMTP" "ارسال ایمیل اعلان، تأیید حساب و بازیابی گذرواژه. در محیط توسعه با MailHog جایگزین می‌شود" "External"
        smsGateway = softwareSystem "درگاه پیامک" "ارسال پیام کوتاه فوری به داوطلبان در شرایط بحرانی. برنامه‌ریزی‌شده برای نسخه‌های آینده" "External,Planned"
        identityProvider = softwareSystem "سرویس هویت سازمانی" "احراز هویت یکپارچه سازمانی بر پایه OpenID Connect. برنامه‌ریزی‌شده برای نسخه‌های آینده" "External,Planned"

        # سامانه هدف
        panah = softwareSystem "سامانه پناه" "سامانه وب یکپارچه برای ثبت رویداد بحران، مدیریت داوطلبان و مهارت‌ها، چرخه عمر مأموریت، تخصیص نیرو، گزارش‌دهی و حسابرسی" "Internal" {

            spa = container "کلاینت وب" "رابط کاربری تک‌صفحه‌ای فارسی و راست‌چین شامل داشبورد، مدیریت رویداد و مأموریت، کارتابل درخواست‌ها، پروفایل داوطلب و پیشخان مدیریت" "React 18، TypeScript، Vite، Material UI" "WebApp"

            webGateway = container "دروازه وب" "پایان‌دهی TLS، پروکسی معکوس مسیر api/v1، سرو فایل‌های ایستا و رسانه، محدودسازی نرخ درخواست و اعمال هدرهای امنیتی" "Nginx Alpine" "Gateway"

            apiService = container "سرویس API" "پیاده‌سازی قواعد کاری در لایه سرویس، اعتبارسنجی ورودی، کنترل دسترسی مبتنی بر نقش و مجوز، صدور و اعتبارسنجی توکن و انتشار وظایف نامتقارن" "Python، Django، Django REST Framework" "Backend" {

                presentationLayer = component "لایه ارائه" "نماها و مسیرهای REST، سریالایزرها، کلاس‌های مجوز، میان‌افزار حسابرسی و مولد مستندات OpenAPI" "Django REST Framework"
                authService = component "سرویس احراز هویت" "بررسی اعتبارنامه، صدور و تازه‌سازی توکن، ابطال نشست و مدیریت گذرواژه" "لایه کاربرد"
                iamService = component "سرویس کاربران و دسترسی" "مدیریت کاربران، نقش‌ها، مجوزها، انتساب نقش و تأیید حساب" "لایه کاربرد"
                volunteerService = component "سرویس داوطلب و مهارت" "مدیریت پروفایل داوطلبی، مهارت‌ها با سطح تخصص، دسترس‌پذیری و جست‌وجوی داوطلبان" "لایه کاربرد"
                disasterService = component "سرویس رویداد بحران" "ثبت و ویرایش رویداد، تعیین نوع و شدت و موقعیت و گذار وضعیت رویداد" "لایه کاربرد"
                missionService = component "سرویس مأموریت" "ایجاد و ویرایش مأموریت، تعیین مهارت‌های مورد نیاز، انتشار و گذار وضعیت و پایش ظرفیت" "لایه کاربرد"
                applicationService = component "سرویس درخواست همکاری" "ثبت درخواست داوطلب، بررسی و تأیید و رد و فهرست انتظار و انصراف" "لایه کاربرد"
                assignmentService = component "سرویس تخصیص" "ایجاد تخصیص، پذیرش و رد، ثبت حضور و اعلام پایان کار و آزادسازی ظرفیت" "لایه کاربرد"
                reportService = component "سرویس گزارش" "ثبت گزارش مأموریت، بارگذاری پیوست و چرخه بازبینی" "لایه کاربرد"
                notificationService = component "سرویس اعلان" "تولید اعلان درون‌برنامه‌ای، تعیین گیرندگان، رندر قالب فارسی و انتشار وظیفه ارسال ایمیل" "لایه کاربرد"
                ticketService = component "سرویس تیکت پشتیبانی" "ثبت تیکت، رشته پاسخ‌ها و گذار وضعیت تیکت" "لایه کاربرد"
                dashboardService = component "سرویس داشبورد" "محاسبه و ذخیره نهانی شاخص‌های عملیاتی برای هر نقش" "لایه کاربرد"
                auditService = component "سرویس حسابرسی" "ثبت کنش‌های حساس همراه با شناسه همبستگی، نشانی IP و عامل کاربر" "لایه کاربرد"
                domainLayer = component "لایه دامنه" "موجودیت‌ها، شمارش‌های وضعیت، قواعد گذار و استثناهای دامنه" "Python"
                infrastructureLayer = component "لایه زیرساخت" "مخازن داده بر پایه Django ORM، آداپتور حافظه نهان و صف، آداپتور فایل و ایمیل و تعریف وظایف Celery" "Python"
            }

            worker = container "کارگر پردازش نامتقارن" "ارسال ایمیل اعلان، تولید اعلان انبوه، رد خودکار تخصیص‌های بی‌پاسخ و محاسبه شاخص‌های داشبورد" "Celery Worker" "Worker"

            scheduler = container "زمان‌بند کارها" "زمان‌بندی وظایف دوره‌ای مانند یادآوری تخصیص، بستن مأموریت‌های سرآمد و پاک‌سازی داده موقت" "Celery Beat" "Worker"

            database = container "پایگاه داده اصلی" "ذخیره کاربران، نقش‌ها، مجوزها، پروفایل و مهارت داوطلبان، رویدادها، مأموریت‌ها، درخواست‌ها، تخصیص‌ها، گزارش‌ها، اعلان‌ها، تیکت‌ها و رکوردهای حسابرسی" "PostgreSQL 17" "Database"

            cache = container "حافظه نهان و صف پیام" "صف وظایف Celery، ذخیره نهانی پاسخ‌های پرتکرار، وضعیت محدودسازی نرخ و فهرست سیاه توکن" "Redis 7" "Database"

            fileStore = container "انبار فایل" "نگه‌داری تصویر نمایه کاربران و پیوست گزارش‌های مأموریت" "حجم اشتراکی Docker" "FileSystem"
        }

        # روابط سطح زمینه
        volunteer -> panah "ثبت‌نام، تکمیل پروفایل و مهارت، مشاهده مأموریت‌های موجود، ارسال درخواست همکاری و ثبت حضور" "HTTPS"
        coordinator -> panah "ثبت رویداد بحران، ساخت و انتشار مأموریت، بررسی درخواست‌ها، تخصیص داوطلب و ثبت گزارش" "HTTPS"
        administrator -> panah "مدیریت کاربران، نقش‌ها و مجوزها، مشاهده داشبورد و گزارش حسابرسی" "HTTPS"
        panah -> mailService "ارسال ایمیل اعلان رویدادهای مأموریت و حساب کاربری" "SMTP"
        panah -> smsGateway "ارسال اعلان فوری بحران" "HTTPS"
        panah -> identityProvider "درخواست احراز هویت و دریافت توکن هویت" "OpenID Connect"

        # روابط سطح کانتینر
        volunteer -> panah.webGateway "درخواست HTTPS" "TLS 1.2 و بالاتر"
        coordinator -> panah.webGateway "درخواست HTTPS" "TLS 1.2 و بالاتر"
        administrator -> panah.webGateway "درخواست HTTPS" "TLS 1.2 و بالاتر"

        panah.webGateway -> panah.spa "سرو دارایی‌های ساخته‌شده کلاینت" "HTTP"
        panah.webGateway -> panah.apiService "پروکسی معکوس مسیر api/v1 و admin و api/docs" "HTTP"
        panah.webGateway -> panah.fileStore "سرو مستقیم فایل‌های ایستا و رسانه" "خواندن از حجم"

        panah.spa -> panah.webGateway "فراخوانی REST با هدر Authorization Bearer" "JSON over HTTPS"
        panah.apiService -> panah.database "خواندن و نوشتن با Django ORM" "TCP 5432"
        panah.apiService -> panah.cache "خواندن و نوشتن حافظه نهان و انتشار وظیفه" "TCP 6379"
        panah.apiService -> panah.fileStore "بارگذاری و بازیابی فایل" "سیستم فایل"

        panah.worker -> panah.cache "دریافت وظیفه از صف" "TCP 6379"
        panah.worker -> panah.database "خواندن و نوشتن نتیجه پردازش" "TCP 5432"
        panah.worker -> mailService "ارسال ایمیل اعلان" "SMTP"
        panah.scheduler -> panah.cache "انتشار وظایف زمان‌بندی‌شده" "TCP 6379"

        # روابط سطح مؤلفه
        panah.webGateway -> panah.apiService.presentationLayer "هدایت درخواست REST" "HTTP"
        panah.apiService.presentationLayer -> panah.apiService.authService "فراخوانی سرویس احراز هویت"
        panah.apiService.presentationLayer -> panah.apiService.iamService "فراخوانی سرویس کاربران و دسترسی"
        panah.apiService.presentationLayer -> panah.apiService.volunteerService "فراخوانی سرویس داوطلب"
        panah.apiService.presentationLayer -> panah.apiService.disasterService "فراخوانی سرویس رویداد"
        panah.apiService.presentationLayer -> panah.apiService.missionService "فراخوانی سرویس مأموریت"
        panah.apiService.presentationLayer -> panah.apiService.applicationService "فراخوانی سرویس درخواست همکاری"
        panah.apiService.presentationLayer -> panah.apiService.assignmentService "فراخوانی سرویس تخصیص"
        panah.apiService.presentationLayer -> panah.apiService.reportService "فراخوانی سرویس گزارش"
        panah.apiService.presentationLayer -> panah.apiService.ticketService "فراخوانی سرویس تیکت"
        panah.apiService.presentationLayer -> panah.apiService.dashboardService "فراخوانی سرویس داشبورد"
        panah.apiService.presentationLayer -> panah.apiService.auditService "ثبت رکورد حسابرسی درخواست"

        panah.apiService.applicationService -> panah.apiService.assignmentService "ایجاد تخصیص پس از تأیید درخواست"
        panah.apiService.assignmentService -> panah.apiService.missionService "به‌روزرسانی ظرفیت و وضعیت مأموریت"
        panah.apiService.missionService -> panah.apiService.notificationService "درخواست اعلان انتشار مأموریت"
        panah.apiService.applicationService -> panah.apiService.notificationService "درخواست اعلان نتیجه بررسی"
        panah.apiService.assignmentService -> panah.apiService.notificationService "درخواست اعلان تخصیص"
        panah.apiService.iamService -> panah.apiService.auditService "ثبت تغییر دسترسی"
        panah.apiService.missionService -> panah.apiService.auditService "ثبت گذار وضعیت مأموریت"
        panah.apiService.assignmentService -> panah.apiService.auditService "ثبت گذار وضعیت تخصیص"
        panah.apiService.reportService -> panah.apiService.auditService "ثبت چرخه بازبینی گزارش"

        panah.apiService.missionService -> panah.apiService.domainLayer "استفاده از قواعد گذار وضعیت"
        panah.apiService.applicationService -> panah.apiService.domainLayer "استفاده از قواعد گذار وضعیت"
        panah.apiService.assignmentService -> panah.apiService.domainLayer "استفاده از قواعد گذار وضعیت"

        panah.apiService.authService -> panah.apiService.infrastructureLayer "دسترسی به مخزن و حافظه نهان"
        panah.apiService.iamService -> panah.apiService.infrastructureLayer "دسترسی به مخزن"
        panah.apiService.volunteerService -> panah.apiService.infrastructureLayer "دسترسی به مخزن و انبار فایل"
        panah.apiService.disasterService -> panah.apiService.infrastructureLayer "دسترسی به مخزن"
        panah.apiService.missionService -> panah.apiService.infrastructureLayer "دسترسی به مخزن"
        panah.apiService.applicationService -> panah.apiService.infrastructureLayer "دسترسی به مخزن"
        panah.apiService.assignmentService -> panah.apiService.infrastructureLayer "دسترسی به مخزن"
        panah.apiService.reportService -> panah.apiService.infrastructureLayer "دسترسی به مخزن و انبار فایل"
        panah.apiService.notificationService -> panah.apiService.infrastructureLayer "دسترسی به مخزن و صف وظیفه"
        panah.apiService.ticketService -> panah.apiService.infrastructureLayer "دسترسی به مخزن"
        panah.apiService.dashboardService -> panah.apiService.infrastructureLayer "دسترسی به مخزن و حافظه نهان"
        panah.apiService.auditService -> panah.apiService.infrastructureLayer "دسترسی به مخزن"

        panah.apiService.infrastructureLayer -> panah.database "پرسمان و تراکنش" "TCP 5432"
        panah.apiService.infrastructureLayer -> panah.cache "حافظه نهان و انتشار وظیفه" "TCP 6379"
        panah.apiService.infrastructureLayer -> panah.fileStore "خواندن و نوشتن فایل" "سیستم فایل"

        # نمای استقرار محیط بهره‌برداری
        deploymentEnvironment "بهره‌برداری" {
            deploymentNode "شبکه سازمانی" "مرز شبکه با دیوار آتش و اجازه ورود روی درگاه ۴۴۳" "Firewall" {
                deploymentNode "کارساز میزبان لینوکس" "میزبان با Docker Engine و Docker Compose" "Ubuntu Server LTS" {

                    deploymentNode "کانتینر Nginx" "volunteer-management-nginx" "nginx:alpine" {
                        gatewayInstance = containerInstance panah.webGateway
                    }

                    deploymentNode "کانتینر کلاینت" "volunteer-management-frontend" "ساخت Vite" {
                        spaInstance = containerInstance panah.spa
                    }

                    deploymentNode "کانتینر سرویس API" "volunteer-management-backend" "Python و Django با Gunicorn" {
                        instances 2
                        apiInstance = containerInstance panah.apiService
                    }

                    deploymentNode "کانتینر کارگر" "volunteer-management-celery" "Celery Worker" {
                        instances 2
                        workerInstance = containerInstance panah.worker
                    }

                    deploymentNode "کانتینر زمان‌بند" "volunteer-management-celery-beat" "Celery Beat" {
                        schedulerInstance = containerInstance panah.scheduler
                    }

                    deploymentNode "کانتینر PostgreSQL" "volunteer-management-postgres" "postgres:17-alpine" {
                        databaseInstance = containerInstance panah.database
                        deploymentNode "حجم داده" "volunteer-management-postgres-data" "حجم نام‌دار Docker" {
                            description "پشتیبان کامل شبانه با نگه‌داری سی روزه"
                        }
                    }

                    deploymentNode "کانتینر Redis" "volunteer-management-redis" "redis:7-alpine با حالت appendonly" {
                        cacheInstance = containerInstance panah.cache
                    }

                    deploymentNode "حجم رسانه و ایستا" "اتصال میزبان media و static" "سیستم فایل میزبان" {
                        fileInstance = containerInstance panah.fileStore
                    }
                }
            }

            deploymentNode "زیرساخت ایمیل سازمانی" "کارساز SMTP سازمان" "SMTP با STARTTLS" {
                mailInstance = softwareSystemInstance mailService
            }
        }

        # نمای استقرار محیط توسعه
        deploymentEnvironment "توسعه" {
            deploymentNode "رایانه توسعه‌دهنده" "ایستگاه کاری با Docker Desktop" "Windows یا Linux" {
                deploymentNode "کانتینر Nginx" "volunteer-management-nginx" "nginx:alpine" {
                    containerInstance panah.webGateway
                }
                deploymentNode "کانتینر کلاینت" "volunteer-management-frontend" "کارساز توسعه Vite" {
                    containerInstance panah.spa
                }
                deploymentNode "کانتینر سرویس API" "volunteer-management-backend" "کارساز توسعه Django" {
                    containerInstance panah.apiService
                }
                deploymentNode "کانتینر کارگر" "volunteer-management-celery" "Celery Worker" {
                    containerInstance panah.worker
                }
                deploymentNode "کانتینر PostgreSQL" "volunteer-management-postgres" "postgres:17-alpine" {
                    containerInstance panah.database
                }
                deploymentNode "کانتینر Redis" "volunteer-management-redis" "redis:7-alpine" {
                    containerInstance panah.cache
                }
                deploymentNode "کانتینر MailHog" "volunteer-management-mailhog" "گیرنده ایمیل محلی" {
                    softwareSystemInstance mailService
                }
            }
        }
    }

    views {

        systemContext panah "Context" "دیاگرام زمینه سامانه پناه در سطح یک مدل C4" {
            include *
            autolayout lr
            description "بازیگران انسانی، سامانه پناه و سامانه‌های بیرونی مرتبط"
        }

        container panah "Containers" "دیاگرام کانتینر سامانه پناه در سطح دو مدل C4" {
            include *
            autolayout tb
            description "واحدهای اجرایی قابل استقرار و پروتکل ارتباطی میان آن‌ها"
        }

        component panah.apiService "ApiComponents" "دیاگرام مؤلفه سرویس API در سطح سه مدل C4" {
            include *
            autolayout tb
            description "لایه‌بندی معماری تمیز و سرویس‌های کاربردی درون سرویس API"
        }

        deployment panah "بهره‌برداری" "ProductionDeployment" "نمای استقرار محیط بهره‌برداری" {
            include *
            autolayout tb
        }

        deployment panah "توسعه" "DevelopmentDeployment" "نمای استقرار محیط توسعه" {
            include *
            autolayout tb
        }

        dynamic panah "ApplicationApprovalFlow" "جریان بررسی و تأیید درخواست همکاری داوطلب" {
            volunteer -> panah.spa "ارسال درخواست همکاری برای مأموریت منتشرشده"
            panah.spa -> panah.webGateway "فراخوانی نقطه پایانی ثبت درخواست"
            panah.webGateway -> panah.apiService "هدایت درخواست به سرویس API"
            panah.apiService -> panah.database "درج رکورد درخواست با وضعیت ارسال‌شده"
            panah.apiService -> panah.cache "انتشار وظیفه اعلان درخواست جدید"
            coordinator -> panah.spa "باز کردن کارتابل و ثبت تصمیم تأیید"
            panah.spa -> panah.webGateway "فراخوانی نقطه پایانی بررسی درخواست"
            panah.webGateway -> panah.apiService "هدایت درخواست بررسی"
            panah.apiService -> panah.database "به‌روزرسانی وضعیت درخواست و درج تخصیص در انتظار"
            panah.apiService -> panah.cache "انتشار وظیفه ارسال ایمیل نتیجه بررسی"
            panah.cache -> panah.worker "تحویل وظیفه به کارگر"
            panah.worker -> mailService "ارسال ایمیل نتیجه بررسی به داوطلب"
            autolayout lr
        }

        styles {
            element "Element" {
                fontSize 22
                color #0A2B20
            }
            element "Person" {
                shape person
                background #2A5DA8
                color #FFFFFF
            }
            element "Volunteer" {
                background #B26A00
            }
            element "Coordinator" {
                background #0B6E4F
            }
            element "Administrator" {
                background #6B2FA8
            }
            element "Software System" {
                background #1F6FB2
                color #FFFFFF
            }
            element "Internal" {
                background #0B6E4F
                color #FFFFFF
            }
            element "External" {
                background #7A8794
                color #FFFFFF
            }
            element "Planned" {
                border dashed
                opacity 70
            }
            element "Container" {
                background #2E8B71
                color #FFFFFF
            }
            element "WebApp" {
                shape WebBrowser
                background #2A5DA8
            }
            element "Gateway" {
                shape Hexagon
                background #6B2FA8
            }
            element "Backend" {
                background #0B6E4F
            }
            element "Worker" {
                shape Pipe
                background #0E7C66
            }
            element "Database" {
                shape Cylinder
                background #B26A00
                color #FFFFFF
            }
            element "FileSystem" {
                shape Folder
                background #8A6D3B
                color #FFFFFF
            }
            element "Component" {
                background #4CA98C
                color #FFFFFF
            }
            element "Deployment Node" {
                background #FFFFFF
                color #1F2933
                stroke #5F6B7A
            }
            relationship "Relationship" {
                thickness 2
                color #5F6B7A
                fontSize 20
            }
        }

        themes default
    }

    configuration {
        scope softwaresystem
    }
}
