from __future__ import annotations

import logging
import secrets
from datetime import timedelta

import httpx
from django.conf import settings
from django.db import connection
from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, permissions, response, status, views

from .models import User, UserSession, WorkerProfile, LoginAttempt, SecurityAuditLog, ensure_profile_for_user
from .serializers import LoginSerializer, RegistrationSerializer, UserSerializer, UserInviteSerializer, SubscriptionRenewalSerializer

# Security logger for audit events
security_logger = logging.getLogger('user_managment.security')

SESSION_TTL = timedelta(days=7)
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_MINUTES = 15

# IP Whitelist for sensitive admin operations (configurable via settings)
ADMIN_IP_WHITELIST = getattr(settings, 'ADMIN_IP_WHITELIST', [
    '127.0.0.1',
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
])


def get_client_ip(request):
    """Extract client IP from request, considering proxy headers."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def ip_in_whitelist(ip_address: str, whitelist: list) -> bool:
    """Check if IP address is in the whitelist (supports CIDR notation)."""
    import ipaddress
    
    try:
        client_ip = ipaddress.ip_address(ip_address)
    except ValueError:
        return False
    
    for allowed in whitelist:
        try:
            if '/' in allowed:
                # CIDR notation
                network = ipaddress.ip_network(allowed, strict=False)
                if client_ip in network:
                    return True
            else:
                # Single IP
                if client_ip == ipaddress.ip_address(allowed):
                    return True
        except ValueError:
            continue
    
    return False


class AdminIPWhitelistPermission(permissions.BasePermission):
    """
    Permission class that restricts sensitive admin operations to whitelisted IPs.
    """
    message = "Access denied. Your IP address is not authorized for this operation."
    
    def has_permission(self, request, view):
        # Allow if whitelist is empty (disabled)
        if not ADMIN_IP_WHITELIST:
            return True
        
        client_ip = get_client_ip(request)
        is_allowed = ip_in_whitelist(client_ip, ADMIN_IP_WHITELIST)
        
        if not is_allowed:
            security_logger.warning(
                f"Admin action blocked - unauthorized IP: {client_ip}, "
                f"path: {request.path}, user: {getattr(request.user, 'email', 'anonymous')}"
            )
        
        return is_allowed


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
        httpx.post(
            f"{url}/notifications",
            json=payload,
            headers=headers,
            timeout=5.0,
            follow_redirects=True,
        )
    except httpx.RequestError:
        pass


def assign_manager(user: User, manager: User | None, *, status: str | None = None):
    ensure_profile_for_user(user)
    fields = ["manager", "updated_at"]
    user.manager = manager
    user.updated_at = timezone.now()
    if status:
        user.status = status
        fields.append("status")
    user.save(update_fields=fields)
    if user.role == "employee":
        WorkerProfile.objects.filter(user=user).update(manager=manager, updated_at=timezone.now())


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
        email = data["email"]
        
        ip_address = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]
        
        # Check if account is locked
        if LoginAttempt.is_account_locked(email, MAX_LOGIN_ATTEMPTS, LOCKOUT_MINUTES):
            LoginAttempt.log_attempt(
                email=email,
                ip_address=ip_address,
                user_agent=user_agent,
                success=False,
                failure_reason='Account locked due to too many failed attempts'
            )
            return response.Response(
                {"detail": f"Account temporarily locked. Please try again in {LOCKOUT_MINUTES} minutes."},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        user = authenticate_user(email, data["password"])
        
        if user is None:
            # Log failed attempt
            LoginAttempt.log_attempt(
                email=email,
                ip_address=ip_address,
                user_agent=user_agent,
                success=False,
                failure_reason='Invalid credentials'
            )
            
            # Check remaining attempts
            recent_failures = LoginAttempt.get_recent_failed_attempts(email, LOCKOUT_MINUTES)
            remaining = MAX_LOGIN_ATTEMPTS - recent_failures
            
            if remaining <= 0:
                return response.Response(
                    {"detail": f"Account temporarily locked. Please try again in {LOCKOUT_MINUTES} minutes."},
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
            elif remaining <= 3:
                return response.Response(
                    {"detail": f"Invalid credentials. {remaining} attempts remaining before lockout."},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            return response.Response({"detail": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Log successful attempt
        LoginAttempt.log_attempt(
            email=email,
            ip_address=ip_address,
            user_agent=user_agent,
            success=True
        )
        
        # Create audit log for successful login
        SecurityAuditLog.log(
            user=user,
            action='LOGIN',
            resource_type='session',
            ip_address=ip_address,
            user_agent=user_agent,
            details={'method': 'password'}
        )
        
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
            User.objects.filter(role="employee")
            .filter(Q(manager_id=self.request.user.id) | Q(worker_profile__manager_id=self.request.user.id))
            .select_related("worker_profile", "worker_profile__manager", "admin_profile")
            .prefetch_related("sessions")
            .distinct()
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
            # If worker has no manager, they have no team
            if not user.manager_id:
                manager = None
                teammates_qs = User.objects.none()
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

        assign_manager(target_user, request.user, status="pending")

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


class UserDetailView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, user_id):
        try:
            user = User.objects.get(id=user_id, role="employee")
        except User.DoesNotExist:
            return response.Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        if user.manager_id != request.user.id:
            return response.Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        assign_manager(user, None, status="pending")
        return response.Response(status=status.HTTP_204_NO_CONTENT)


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
        action = (request.data.get("action") or "accept").lower()
        if action not in {"accept", "decline"}:
            return response.Response({"detail": "Unsupported action"}, status=status.HTTP_400_BAD_REQUEST)
        if not user_id:
            return response.Response({"detail": "Missing user identifier"}, status=status.HTTP_400_BAD_REQUEST)
        if action == "accept" and not manager_id:
            return response.Response({"detail": "Missing manager identifier"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return response.Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        manager = None
        if manager_id:
            try:
                manager = User.objects.get(id=manager_id)
            except User.DoesNotExist:
                return response.Response({"detail": "Manager not found"}, status=status.HTTP_404_NOT_FOUND)

        if action == "accept":
            assign_manager(user, manager, status="active")
        else:
            assign_manager(user, None, status="pending")

        return response.Response(UserSerializer(user).data, status=status.HTTP_200_OK)


class SubscriptionRenewalView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        
        # Only admins can have subscriptions
        if user.role != 'admin':
            return response.Response(
                {"detail": "Only admin users can renew subscriptions."}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = SubscriptionRenewalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated_user = serializer.update(user, serializer.validated_data)
        
        return response.Response(
            {
                "detail": "Subscription renewed successfully.",
                "user": UserSerializer(updated_user).data,
            },
            status=status.HTTP_200_OK,
        )
