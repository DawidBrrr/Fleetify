from __future__ import annotations

import secrets
from datetime import timedelta

from django.db import connection
from django.utils import timezone
from rest_framework import generics, permissions, response, status, views

from .models import User, UserSession
from .serializers import LoginSerializer, UserSerializer

SESSION_TTL = timedelta(days=7)


def authenticate_user(email: str, password: str) -> User | None:
    query = """
        SELECT id
        FROM users
        WHERE email = %s AND password_hash = crypt(%s, password_hash)
        LIMIT 1
    """
    with connection.cursor() as cursor:
        cursor.execute(query, [email, password])
        row = cursor.fetchone()
    if not row:
        return None
    try:
        return User.objects.get(id=row[0])
    except User.DoesNotExist:
        return None


def create_session(user: User) -> UserSession:
    token = secrets.token_urlsafe(48)
    expires_at = timezone.now() + SESSION_TTL
    session = UserSession.objects.create(user=user, refresh_token=token, expires_at=expires_at)
    User.objects.filter(id=user.id).update(last_login_at=timezone.now(), updated_at=timezone.now())
    return session


class LoginView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        user = authenticate_user(data["email"], data["password"])
        if user is None:
            return response.Response({"detail": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)
        session = create_session(user)
        return response.Response(
            {
                "token": session.refresh_token,
                "expires_at": session.expires_at,
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        session: UserSession = request.auth
        if session:
            session.delete()
        return response.Response(status=status.HTTP_204_NO_CONTENT)


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user