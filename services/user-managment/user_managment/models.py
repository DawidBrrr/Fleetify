import uuid

from django.db import models
from django.utils import timezone


class User(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    password_hash = models.TextField()
    full_name = models.TextField()
    role = models.CharField(max_length=20, choices=[("admin", "admin"), ("employee", "employee")])
    status = models.CharField(
        max_length=20,
        default="active",
        choices=[("active", "active"), ("disabled", "disabled"), ("pending", "pending")],
    )
    last_login_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "users"
        managed = False
        ordering = ["created_at"]

    @property
    def is_authenticated(self) -> bool:  # pragma: no cover - simple property
        """Mimic Django's auth user API so DRF permissions work."""
        return True

    @property
    def is_active(self) -> bool:
        return self.status == "active"


class UserSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column="user_id", related_name="sessions")
    refresh_token = models.TextField(unique=True)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "user_sessions"
        managed = False
        indexes = [models.Index(fields=["user"], name="idx_user_sessions_user_id")]
