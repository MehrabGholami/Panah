import django_filters
from django.db.models import Q

from audit_logs.models import AuditLog


class AuditLogFilterSet(django_filters.FilterSet):
    action = django_filters.CharFilter(field_name="action", lookup_expr="iexact")
    resource_type = django_filters.CharFilter(field_name="resource_type", lookup_expr="iexact")
    user_id = django_filters.UUIDFilter(field_name="user_id")
    user = django_filters.CharFilter(method="filter_user")
    correlation_id = django_filters.CharFilter(field_name="correlation_id", lookup_expr="icontains")
    ip_address = django_filters.CharFilter(field_name="ip_address", lookup_expr="icontains")
    created_at_after = django_filters.DateTimeFilter(field_name="created_at", lookup_expr="gte")
    created_at_before = django_filters.DateTimeFilter(field_name="created_at", lookup_expr="lte")
    search = django_filters.CharFilter(method="filter_search")

    class Meta:
        model = AuditLog
        fields = (
            "action",
            "resource_type",
            "user_id",
            "user",
            "correlation_id",
            "ip_address",
            "created_at_after",
            "created_at_before",
            "search",
        )

    def filter_search(self, queryset, name, value):
        if not value:
            return queryset
        return queryset.filter(
            Q(action__icontains=value)
            | Q(resource_type__icontains=value)
            | Q(resource_id__icontains=value)
            | Q(correlation_id__icontains=value)
            | Q(ip_address__icontains=value)
        )

    def filter_user(self, queryset, name, value):
        if not value:
            return queryset
        from accounts.models import User

        user_ids = User.objects.filter(
            Q(email__icontains=value)
            | Q(first_name__icontains=value)
            | Q(last_name__icontains=value)
        ).values_list("id", flat=True)
        return queryset.filter(user_id__in=user_ids)
