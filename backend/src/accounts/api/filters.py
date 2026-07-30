import django_filters
from django.db.models import Q

from accounts.models import User


class UserFilterSet(django_filters.FilterSet):
    is_active = django_filters.BooleanFilter(field_name="is_active")
    is_approved = django_filters.BooleanFilter(field_name="is_approved")
    role = django_filters.CharFilter(method="filter_role")
    search = django_filters.CharFilter(method="filter_search")
    city = django_filters.CharFilter(method="filter_city")
    skill = django_filters.UUIDFilter(method="filter_skill")

    class Meta:
        model = User
        fields = ("is_active", "is_approved", "role", "search", "city", "skill")

    def filter_role(self, queryset, name, value):
        if not value:
            return queryset
        return queryset.filter(user_roles__role__slug=value).distinct()

    def filter_search(self, queryset, name, value):
        if not value:
            return queryset
        value = value.strip()
        variants = {value}
        # Match both Persian and Arabic Yeh/Kaf forms from keyboards.
        variants.add(value.replace("ی", "ي").replace("ک", "ك"))
        variants.add(value.replace("ي", "ی").replace("ك", "ک"))

        query = Q()
        for term in variants:
            query |= (
                Q(email__icontains=term)
                | Q(first_name__icontains=term)
                | Q(last_name__icontains=term)
                | Q(phone__icontains=term)
                | Q(volunteer_profile__national_id__icontains=term)
                | Q(volunteer_profile__city__icontains=term)
            )
        return queryset.filter(query).distinct()

    def filter_city(self, queryset, name, value):
        if not value:
            return queryset
        return queryset.filter(volunteer_profile__city__icontains=value.strip()).distinct()

    def filter_skill(self, queryset, name, value):
        if not value:
            return queryset
        return queryset.filter(
            volunteer_profile__volunteer_skills__skill_id=value
        ).distinct()
