from __future__ import annotations

from django.utils import timezone
from rest_framework import authentication, exceptions

from .models import UserSession


class SessionTokenAuthentication(authentication.BaseAuthentication):
    """Simple bearer-token auth backed by the user_sessions table."""

    keyword = "Bearer"

    def authenticate(self, request):
        auth_header = authentication.get_authorization_header(request).split()
        if not auth_header:
            return None
        if auth_header[0].decode().lower() != self.keyword.lower():
            return None
        if len(auth_header) == 1:
            raise exceptions.AuthenticationFailed("Invalid authorization header format.")
        token = auth_header[1].decode()
        try:
            session = (
                UserSession.objects.select_related("user")
                .filter(refresh_token=token, expires_at__gt=timezone.now())
                .get()
            )
        except UserSession.DoesNotExist as exc:
            raise exceptions.AuthenticationFailed("Invalid or expired session token.") from exc
        return session.user, session
