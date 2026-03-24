from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.db.models import Count
from videos.models import Video
from jobs.models import Job
from .models import Profile
from .serializers import ProfileSerializer

User = get_user_model()

class IsAdminUser(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == 'admin'

class AdminMetricsView(views.APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        total_users = User.objects.filter(role='user').count()
        total_companies = User.objects.filter(role='company').count()
        total_videos = Video.objects.count()
        pending_jobs = Job.objects.filter(status='pending').count()
        return Response({
            "total_users": total_users,
            "total_companies": total_companies,
            "total_videos": total_videos,
            "pending_jobs": pending_jobs
        })

class AdminVideoApproveView(views.APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, id):
        try:
            video = Video.objects.get(id=id)
            video.status = 'approved'
            video.save()
            return Response({"status": "approved"})
        except Video.DoesNotExist:
            return Response({"error": "Video not found"}, status=status.HTTP_404_NOT_FOUND)

class AdminVideoDeleteView(views.APIView):
    permission_classes = [IsAdminUser]

    def delete(self, request, id):
        try:
            video = Video.objects.get(id=id)
            video.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Video.DoesNotExist:
            return Response({"error": "Video not found"}, status=status.HTTP_404_NOT_FOUND)

class AdminUserListView(views.APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        users = User.objects.filter(role='user')
        profiles = Profile.objects.filter(user__in=users).select_related('user')
        serializer = ProfileSerializer(profiles, many=True)
        return Response(serializer.data)

class AdminUserBanView(views.APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, id):
        try:
            user = User.objects.get(id=id)
            user.is_active = False # Ban by marking inactive
            user.save()
            return Response({"status": "banned"})
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

class AdminJobApproveView(views.APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, id):
        from jobs.serializers import JobSerializer
        try:
            job = Job.objects.get(id=id)
            job.status = 'approved'
            job.save()
            return Response(JobSerializer(job).data)
        except Job.DoesNotExist:
            return Response({"error": "Job not found"}, status=status.HTTP_404_NOT_FOUND)

class AdminCompanyListView(views.APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        companies = User.objects.filter(role='company')
        profiles = Profile.objects.filter(user__in=companies).select_related('user')
        serializer = ProfileSerializer(profiles, many=True)
        return Response(serializer.data)
