from __future__ import annotations

import secrets
from datetime import timedelta

import httpx
from django.conf import settings
from django.db import connection
from django.utils import timezone
from rest_framework import generics, permissions, response, status, views

from .models import User, UserSession, ensure_profile_for_user
from .serializers import LoginSerializer, RegistrationSerializer, UserSerializer, UserInviteSerializer

SESSION_TTL = timedelta(days=7)


class ServiceTokenPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        expected = settings.INTERNAL_SERVICE_TOKEN
        return bool(expected) and request.headers.get("X-Service-Token") == expected


def send_notification(payload: dict):
    token = settings.NOTIFICATIONS_SERVICE_TOKEN
    url = settings.NOTIFICATIONS_SERVICE_URL
    if not token or not url:
        return
    headers = {
        "X-Service-Token": token,
        "Content-Type": "application/json",
    }
    try:
        httpx.post(f"{url}/notifications", json=payload, headers=headers, timeout=5.0)
    except httpx.RequestError:
        pass


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
        # Only show employees managed by the current admin, including profile/presence data
        return (
            User.objects.filter(role="employee", manager_id=self.request.user.id)
            .select_related("worker_profile", "worker_profile__manager", "admin_profile")
            .prefetch_related("sessions")
        )


class TeamView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = (
            User.objects.select_related("worker_profile", "admin_profile", "manager")
            .prefetch_related("sessions")
            .get(id=request.user.id)
        )

        if user.role == "admin":
            manager = None
            teammates_qs = (
                User.objects.filter(manager_id=user.id)
                .select_related("worker_profile", "admin_profile", "manager")
                .prefetch_related("sessions")
            )
        else:
            manager = (
                User.objects.select_related("worker_profile", "admin_profile", "manager")
                .prefetch_related("sessions")
                .filter(id=user.manager_id)
                .first()
            )
            teammates_qs = (
                User.objects.filter(manager_id=user.manager_id)
                .exclude(id=user.id)
                .select_related("worker_profile", "admin_profile", "manager")
                .prefetch_related("sessions")
            )

        return response.Response(
            {
                "me": UserSerializer(user).data,
                "manager": UserSerializer(manager).data if manager else None,
                "teammates": UserSerializer(teammates_qs, many=True).data,
            }
        )


class InviteUserView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = UserInviteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data["email"]
        full_name = serializer.validated_data["full_name"]
        
        existing_user = User.objects.filter(email=email).first()
        
        if existing_user and existing_user.manager_id:
            return response.Response(
                {"detail": "User is already part of another team."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        if existing_user:
            target_user = existing_user
        else:
            user = User.objects.create(
                email=email,
                full_name=full_name,
                password_hash="temp_hash",
                role="employee",
                status="pending",
                manager_id=None
            )
            query = """
                UPDATE users 
                SET password_hash = crypt(%s, gen_salt('bf'))
                WHERE id = %s
            """
            with connection.cursor() as cursor:
                cursor.execute(query, ["welcome123", user.id])
            target_user = user

        ensure_profile_for_user(target_user)

        notification_payload = {
            "recipient_id": str(target_user.id),
            "sender_id": str(request.user.id),
            "type": "team_invite",
            "title": "Zaproszenie do zespołu",
            "body": f"{request.user.full_name} zaprasza Cię do swojego zespołu.",
            "metadata": {
                "manager_id": str(request.user.id),
                "manager_name": request.user.full_name,
                "manager_email": request.user.email,
                "invitee_email": target_user.email,
            },
            "action_required": True,
            "status": "pending",
        }
        send_notification(notification_payload)

        return response.Response(
            {
                "detail": "Zaproszenie wysłane i oczekuje na akceptację.",
                "user": UserSerializer(target_user).data,
            },
            status=status.HTTP_202_ACCEPTED,
        )


class AdminListInternalView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [ServiceTokenPermission]

    def get_queryset(self):
        return User.objects.filter(role="admin")


class TeamAcceptanceView(views.APIView):
    permission_classes = [ServiceTokenPermission]

    def post(self, request):
        user_id = request.data.get("user_id")
        manager_id = request.data.get("manager_id")
        if not user_id or not manager_id:
            return response.Response({"detail": "Missing identifiers"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return response.Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        user.manager_id = manager_id
        user.status = "active"
        user.updated_at = timezone.now()
        user.save(update_fields=["manager_id", "status", "updated_at"])
        ensure_profile_for_user(user)

        return response.Response(UserSerializer(user).data, status=status.HTTP_200_OK)