from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def home(request):
    return JsonResponse({"message": "RecipeHub API is running"})

urlpatterns = [
    path('', home),
    path('api/accounts/', include('accounts.urls')),
    path('api/admin/', include('accounts.admin_urls')),
    path('api/videos/', include('videos.urls')),
    path('api/jobs/', include('jobs.urls')),
    path('api/notifications/', include('notifications.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)