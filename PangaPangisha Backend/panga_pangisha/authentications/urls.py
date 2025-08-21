from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
      path('api/token/', views.CustomLoginPairView.as_view(), name='Login'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('getUsers/',views.get_all_users.as_view())
]
