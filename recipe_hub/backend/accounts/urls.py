from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuthViewSet, UserDetailView, FollowViewSet

router = DefaultRouter()
router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'follow', FollowViewSet, basename='follow')

urlpatterns = [
    path('follow/<str:pk>/', FollowViewSet.as_view({'post': 'toggle_follow'}), name='follow-toggle'),
    path('follow/<str:pk>/check_follow/', FollowViewSet.as_view({'get': 'check_follow'}), name='follow-check'),
    path('follow/<str:pk>/followers/', FollowViewSet.as_view({'get': 'followers'}), name='follow-followers'),
    path('follow/<str:pk>/following/', FollowViewSet.as_view({'get': 'following'}), name='follow-following'),
    path('', include(router.urls)),
    path('profile/', UserDetailView.as_view(), name='profile-detail'),
    path('profile/<str:username>/', UserDetailView.as_view(), name='user-profile'),
]
