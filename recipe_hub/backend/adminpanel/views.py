from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from accounts.models import User
from videos.models import Video
from jobs.models import Job, JobApplication
from notifications.models import Notification


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stats(request):
    """Get admin statistics: GET /admin/stats"""
    if not request.user.is_admin_user:
        return Response(
            {'error': 'Permission denied. Admin access required.'},
            status=403
        )
    
    stats_data = {
        'users': {
            'total': User.objects.count(),
            'regular': User.objects.filter(role='user').count(),
            'companies': User.objects.filter(role='company').count(),
            'admins': User.objects.filter(role='admin').count(),
        },
        'videos': {
            'total': Video.objects.count(),
            'approved': Video.objects.filter(status='approved').count(),
            'pending': Video.objects.filter(status='pending').count(),
            'rejected': Video.objects.filter(status='rejected').count(),
        },
        'jobs': {
            'total': Job.objects.count(),
            'approved': Job.objects.filter(status='approved').count(),
            'pending': Job.objects.filter(status='pending').count(),
            'rejected': Job.objects.filter(status='rejected').count(),
        },
        'applications': {
            'total': JobApplication.objects.count(),
            'pending': JobApplication.objects.filter(status='pending').count(),
            'accepted': JobApplication.objects.filter(status='accepted').count(),
            'rejected': JobApplication.objects.filter(status='rejected').count(),
        },
        'notifications': {
            'total': Notification.objects.count(),
            'unread': Notification.objects.filter(is_read=False).count(),
        }
    }
    
    return Response(stats_data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_job_status(request, job_id):
    """Update job status: PATCH /admin/jobs/<id>/status (alternative admin endpoint)"""
    if not request.user.is_admin_user:
        return Response(
            {'error': 'Permission denied. Admin access required.'},
            status=403
        )
    
    job = get_object_or_404(Job, id=job_id)
    new_status = request.data.get('status')
    
    if new_status not in ['pending', 'approved', 'rejected']:
        return Response(
            {'error': 'Invalid status. Must be: pending, approved, or rejected'},
            status=400
        )
    
    job.status = new_status
    job.save()
    
    # Create notification for company
    Notification.objects.create(
        user=job.company,
        notification_type='job_approved' if new_status == 'approved' else 'job_rejected',
        title=f'Job "{job.title}" {new_status}',
        message=f'Your job posting "{job.title}" has been {new_status}.'
    )
    
    from jobs.serializers import JobSerializer
    return Response(JobSerializer(job).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_list(request):
    """Get all users: GET /admin/users"""
    if not request.user.is_admin_user:
        return Response(
            {'error': 'Permission denied. Admin access required.'},
            status=403
        )
    
    users = User.objects.all()
    from accounts.serializers import UserSerializer
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)
