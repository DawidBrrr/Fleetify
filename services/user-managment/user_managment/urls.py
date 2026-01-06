"""
URL configuration for user_managment project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path

from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/register', views.RegisterView.as_view(), name='auth-register'),
    path('api/auth/login', views.LoginView.as_view(), name='auth-login'),
    path('api/auth/logout', views.LogoutView.as_view(), name='auth-logout'),
    path('api/subscription/renew', views.SubscriptionRenewalView.as_view(), name='subscription-renew'),
    path('api/users/me', views.MeView.as_view(), name='users-me'),
    path('api/users', views.UserListView.as_view(), name='users-list'),
    path('api/users/<uuid:user_id>', views.UserDetailView.as_view(), name='users-detail'),
    path('api/users/team', views.TeamView.as_view(), name='users-team'),
    path('api/users/invite', views.InviteUserView.as_view(), name='users-invite'),
    path('api/internal/admins', views.AdminListInternalView.as_view(), name='internal-admins'),
    path('api/internal/team/accept', views.TeamAcceptanceView.as_view(), name='internal-team-accept'),
]
