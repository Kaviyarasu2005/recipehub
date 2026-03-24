from django.urls import path
from .admin_views import (
    AdminMetricsView,
    AdminVideoApproveView,
    AdminVideoDeleteView,
    AdminUserListView,
    AdminUserBanView,
    AdminJobApproveView,
    AdminCompanyListView
)

urlpatterns = [
    path('metrics/', AdminMetricsView.as_view(), name='admin_metrics'),
    path('videos/<int:id>/approve/', AdminVideoApproveView.as_view(), name='admin_video_approve'),
    path('videos/<int:id>/', AdminVideoDeleteView.as_view(), name='admin_video_delete'),
    path('users/', AdminUserListView.as_view(), name='admin_user_list'),
    path('users/<int:id>/ban/', AdminUserBanView.as_view(), name='admin_user_ban'),
    path('jobs/<int:id>/approve/', AdminJobApproveView.as_view(), name='admin_job_approve'),
    path('companies/', AdminCompanyListView.as_view(), name='admin_company_list'),
]
