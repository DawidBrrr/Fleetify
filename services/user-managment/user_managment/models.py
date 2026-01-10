import uuid
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.db import models
from django.utils import timezone


class User(models.Model):
    SUBSCRIPTION_PLANS = [
        ("1_month", "1_month"),
        ("6_months", "6_months"),
        ("2_years", "2_years"),
    ]
    
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
    subscription_plan = models.CharField(max_length=20, choices=SUBSCRIPTION_PLANS, null=True, blank=True)
    subscription_active_until = models.DateTimeField(null=True, blank=True)
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

    def _local_now(self):
        tz_name = self.timezone_name or "UTC"
        try:
            tz = ZoneInfo(tz_name)
        except ZoneInfoNotFoundError:
            tz = timezone.utc
        return timezone.now().astimezone(tz)

    def is_within_scheduled_hours(self) -> bool:
        if not self.work_hours_start or not self.work_hours_end:
            return False
        now_local = self._local_now()
        current_time = now_local.time()
        start = self.work_hours_start
        end = self.work_hours_end

        if start == end:
            return True  # covers 24h availability
        if start < end:
            return start <= current_time < end
        # overnight shift (e.g., 22:00-06:00)
        return current_time >= start or current_time < end

    def has_active_session(self) -> bool:
        return self.user.sessions.filter(expires_at__gt=timezone.now()).exists()

    @property
    def current_presence_state(self) -> str:
        if self.has_active_session():
            return "zalogowany"
        if self.is_within_scheduled_hours():
            return "dostepny"
        return "niedostepny"


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


class LoginAttempt(models.Model):
    """Track login attempts for account lockout security"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    success = models.BooleanField(default=False)
    failure_reason = models.TextField(null=True, blank=True)
    attempted_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "login_attempts"
        managed = False
        ordering = ["-attempted_at"]

    @classmethod
    def get_recent_failed_attempts(cls, email: str, minutes: int = 15) -> int:
        """Count failed login attempts in the last N minutes"""
        cutoff = timezone.now() - timezone.timedelta(minutes=minutes)
        return cls.objects.filter(
            email__iexact=email,
            success=False,
            attempted_at__gte=cutoff
        ).count()

    @classmethod
    def is_account_locked(cls, email: str, max_attempts: int = 5, lockout_minutes: int = 15) -> bool:
        """Check if account is locked due to too many failed attempts"""
        return cls.get_recent_failed_attempts(email, lockout_minutes) >= max_attempts

    @classmethod
    def log_attempt(cls, email: str, success: bool, ip_address: str = None, 
                    user_agent: str = None, failure_reason: str = None):
        """Log a login attempt"""
        cls.objects.create(
            email=email,
            ip_address=ip_address,
            user_agent=user_agent,
            success=success,
            failure_reason=failure_reason
        )


class SecurityAuditLog(models.Model):
    """Security audit log for tracking important actions"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                             db_column="user_id", related_name="audit_logs")
    action = models.TextField()
    resource_type = models.TextField(null=True, blank=True)
    resource_id = models.TextField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    details = models.JSONField(default=dict)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "security_audit_log"
        managed = False
        ordering = ["-created_at"]

    @classmethod
    def log(cls, action: str, user=None, resource_type: str = None, resource_id: str = None,
            ip_address: str = None, user_agent: str = None, details: dict = None):
        """Create an audit log entry"""
        cls.objects.create(
            user=user,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=ip_address,
            user_agent=user_agent,
            details=details or {}
        )
