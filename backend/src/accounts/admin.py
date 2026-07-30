from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from accounts.models import Permission, Role, RolePermission, User, UserProfile, UserRole


class UserRoleInline(admin.TabularInline):
    model = UserRole
    extra = 0


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    extra = 0
    can_delete = False


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    ordering = ("email",)
    list_display = (
        "email",
        "first_name",
        "last_name",
        "is_approved",
        "is_staff",
        "is_superuser",
        "is_active",
    )
    list_filter = ("is_approved", "is_staff", "is_superuser", "is_active")
    search_fields = ("email", "phone", "first_name", "last_name")
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("اطلاعات شخصی", {"fields": ("first_name", "last_name", "phone")}),
        (
            "وضعیت",
            {"fields": ("is_approved", "is_active", "is_staff", "is_superuser")},
        ),
        ("مجوزهای جنگو", {"fields": ("groups", "user_permissions")}),
        ("زمان‌ها", {"fields": ("last_login", "created_at", "updated_at")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "password1",
                    "password2",
                    "is_staff",
                    "is_superuser",
                    "is_approved",
                ),
            },
        ),
    )
    readonly_fields = ("created_at", "updated_at", "last_login")
    inlines = [UserProfileInline, UserRoleInline]


class RolePermissionInline(admin.TabularInline):
    model = RolePermission
    extra = 0
    autocomplete_fields = ("permission",)


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_system", "created_at")
    search_fields = ("name", "slug")
    list_filter = ("is_system",)
    inlines = [RolePermissionInline]


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ("codename", "name", "app_label")
    search_fields = ("codename", "name")
    list_filter = ("app_label",)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "occupation", "blood_type", "years_of_experience", "updated_at")
    search_fields = ("user__email", "occupation", "address", "emergency_contact_name")
    readonly_fields = ("created_at", "updated_at")
    raw_id_fields = ("user",)


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "created_at")
    list_filter = ("role",)
    search_fields = ("user__email", "role__slug", "role__name")
    raw_id_fields = ("user",)
    autocomplete_fields = ("role",)
