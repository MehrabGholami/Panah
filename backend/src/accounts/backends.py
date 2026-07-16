from django.contrib.auth.backends import ModelBackend

from accounts.infrastructure.repositories.user_repository import UserRepository


class EmailBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, email=None, **kwargs):
        login = email or username
        if not login or not password:
            return None
        user = UserRepository().get_by_email(login)
        if user and user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None

    def get_user(self, user_id):
        return UserRepository().get_by_id(user_id)
