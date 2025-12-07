import uuid

from django.db import connection
from django.utils import timezone
from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "full_name",
            "role",
            "status",
            "last_login_at",
            "created_at",
            "updated_at",
        ]


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_email(self, value: str) -> str:
        return value.lower()


class SessionSerializer(serializers.Serializer):
    token = serializers.CharField(read_only=True)
    expires_at = serializers.DateTimeField(read_only=True)
    issued_at = serializers.DateTimeField(read_only=True, default=timezone.now)


class RegistrationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    full_name = serializers.CharField(max_length=255)
    password = serializers.CharField(write_only=True, min_length=6, trim_whitespace=False)
    role = serializers.ChoiceField(choices=[("admin", "admin"), ("employee", "employee")], default="employee")

    def validate_email(self, value: str) -> str:
        normalized = value.lower()
        if User.objects.filter(email=normalized).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return normalized

    def create(self, validated_data):
        email = validated_data['email']
        full_name = validated_data['full_name']
        password = validated_data['password']
        role = validated_data['role']
        
        query = """
            INSERT INTO users (id, email, full_name, password_hash, role, status, created_at, updated_at)
            VALUES (gen_random_uuid(), %s, %s, crypt(%s, gen_salt('bf')), %s, 'active', NOW(), NOW())
            RETURNING id
        """
        
        with connection.cursor() as cursor:
            cursor.execute(query, [email, full_name, password, role])
            row = cursor.fetchone()
            user_id = row[0]
            
        return User.objects.get(id=user_id)

class UserInviteSerializer(serializers.Serializer):
    email = serializers.EmailField()
    full_name = serializers.CharField(max_length=255)
    
    def validate_email(self, value: str) -> str:
        return value.lower()

    def create(self, validated_data):
        password = validated_data.pop("password")
        now = timezone.now()
        user_id = uuid.uuid4()

        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO users (id, email, password_hash, full_name, role, status, created_at, updated_at)
                VALUES (%s, %s, crypt(%s, gen_salt('bf')), %s, %s, %s, %s, %s)
                RETURNING id
                """,
                [
                    str(user_id),
                    validated_data["email"],
                    password,
                    validated_data["full_name"],
                    validated_data["role"],
                    "active",
                    now,
                    now,
                ],
            )
            cursor.fetchone()

        return User.objects.get(id=user_id)