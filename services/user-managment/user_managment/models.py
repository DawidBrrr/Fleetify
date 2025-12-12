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
    manager = models.ForeignKey("self", null=True, blank=True, on_delete=models.SET_NULL, db_column="manager_id")
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


class AdminProfile(models.Model):
    user = models.OneToOneField(
        User,
        primary_key=True,
        db_column="user_id",
        related_name="admin_profile",
        on_delete=models.CASCADE,
    )
    department = models.TextField(null=True, blank=True)
    permissions = models.JSONField(default=dict)
    timezone_name = models.CharField(max_length=64, default="UTC", db_column="timezone")
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "admin_profiles"
        managed = False


class WorkerProfile(models.Model):
    EMPLOYMENT_TYPES = [
        ("full_time", "full_time"),
        ("part_time", "part_time"),
        ("contract", "contract"),
    ]

    AVAILABILITY_STATES = [
        ("unknown", "unknown"),
        ("logged_in", "logged_in"),
        ("on_shift", "on_shift"),
        ("off_shift", "off_shift"),
    ]

    user = models.OneToOneField(
        User,
        primary_key=True,
        db_column="user_id",
        related_name="worker_profile",
        on_delete=models.CASCADE,
    )
    position_title = models.TextField(null=True, blank=True)
    department = models.TextField(null=True, blank=True)
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPES, default="full_time")
    manager = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="team_members",
        db_column="manager_id",
    )
    work_hours_start = models.TimeField(null=True, blank=True)
    work_hours_end = models.TimeField(null=True, blank=True)
    timezone_name = models.CharField(max_length=64, default="UTC", db_column="timezone")
    availability_status = models.CharField(max_length=20, choices=AVAILABILITY_STATES, default="unknown")
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "worker_profiles"
        managed = False


def ensure_profile_for_user(user: User):
    if user.role == "admin":
        AdminProfile.objects.get_or_create(user=user)
    else:
        WorkerProfile.objects.get_or_create(user=user, defaults={"manager": user.manager})


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
