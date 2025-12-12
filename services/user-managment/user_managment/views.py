from __future__ import annotations

import secrets
from datetime import timedelta

from django.db import connection
from django.utils import timezone
from rest_framework import generics, permissions, response, status, views

from .models import User, UserSession, ensure_profile_for_user
from .serializers import LoginSerializer, RegistrationSerializer, UserSerializer, UserInviteSerializer

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


class RegisterView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        session = create_session(user)
        return response.Response(
            {
                "token": session.refresh_token,
                "expires_at": session.expires_at,
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
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


class UserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only show employees managed by the current admin
        return User.objects.filter(role="employee", manager_id=self.request.user.id)


class InviteUserView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = UserInviteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data["email"]
        full_name = serializer.validated_data["full_name"]
        
        # Check if user exists
        existing_user = User.objects.filter(email=email).first()
        
        if existing_user:
            if existing_user.manager_id:
                return response.Response(
                    {"detail": "User is already part of another team."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Claim the user
            existing_user.manager_id = request.user.id
            existing_user.save()
            return response.Response(UserSerializer(existing_user).data, status=status.HTTP_200_OK)

        # Create user with default password "welcome123" and link to manager
        user = User.objects.create(
            email=email,
            full_name=full_name,
            password_hash="temp_hash",
            role="employee",
            status="active",
            manager_id=request.user.id
        )
        
        query = """
            UPDATE users 
            SET password_hash = crypt(%s, gen_salt('bf'))
            WHERE id = %s
        """
        with connection.cursor() as cursor:
            cursor.execute(query, ["welcome123", user.id])
            
        ensure_profile_for_user(user)
        return response.Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)