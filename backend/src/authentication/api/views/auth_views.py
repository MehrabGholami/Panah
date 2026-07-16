from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView

from authentication.api.serializers.auth_serializers import (
    AuthTokenRefreshSerializer,
    LoginSerializer,
    LogoutSerializer,
    ProfileUpdateSerializer,
    UserMeSerializer,
)
from authentication.application.services.auth_service import AuthService
from authentication.application.services.profile_service import ProfileService


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = AuthService().login(**serializer.validated_data)
        return Response(
            {
                "access": result["access"],
                "refresh": result["refresh"],
                "user": UserMeSerializer(result["user"], context={"request": request}).data,
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        AuthService().logout(serializer.validated_data["refresh"], user=request.user)
        return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)


class MeView(APIView):
    def get(self, request):
        user = ProfileService().get_user_with_profile(request.user)
        return Response(UserMeSerializer(user, context={"request": request}).data)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        user = ProfileService().update_profile(request.user, **serializer.validated_data)
        return Response(UserMeSerializer(user, context={"request": request}).data)


class AvatarUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file = request.FILES.get("file")
        user = ProfileService().upload_avatar(request.user, file)
        return Response(
            UserMeSerializer(user, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )


class RefreshTokenView(TokenRefreshView):
    serializer_class = AuthTokenRefreshSerializer
