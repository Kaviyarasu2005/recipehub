from django.urls import path
from . import views

urlpatterns = [
    path('stats', views.stats, name='admin-stats'),
    path('jobs/<int:job_id>/status', views.update_job_status, name='update-job-status'),
    path('users', views.user_list, name='admin-users'),
]
