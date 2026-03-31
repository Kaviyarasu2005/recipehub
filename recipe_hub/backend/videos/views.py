from datetime import timedelta
import logging

from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Count
from django.core.paginator import Paginator
from .models import Video, VideoView, VideoLike, VideoComment
from .serializers import VideoFeedSerializer, VideoDetailSerializer, VideoCommentSerializer
from utils.supabase import upload_file_to_supabase, delete_file_from_supabase

logger = logging.getLogger(__name__)

class VideoViewSet(viewsets.ModelViewSet):
    """
    Handles listing, creating and interacting with recipe videos.
    """
    serializer_class = VideoDetailSerializer

    def get_queryset(self):
        queryset = Video.objects.annotate(
            view_count=Count('views', distinct=True),
            like_count=Count('likes', distinct=True)
        ).select_related('user').prefetch_related('user__profile').order_by("-created_at")
        
        user_id = self.request.query_params.get('user')
        if user_id:
            queryset = queryset.filter(user_id=user_id)

        if self.action in ['retrieve', 'comment']:
            queryset = queryset.prefetch_related('comments', 'comments__user')
        return queryset

    def get_serializer_class(self):
        """
        Use a lighter serializer for feed/list endpoints and the detailed
        serializer for retrieve/create/update.
        """
        if self.action in ['feed']:
            return VideoFeedSerializer
        return VideoDetailSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'like', 'comment']:
            return [IsAuthenticated()]
        return [AllowAny()]

    @action(detail=False, methods=['get'])
    def feed(self, request):
        """
        Paginated video feed with optional limit/sort parameters.
        Supports:
        - /api/videos/feed/?limit=5&sort=recent
        """
        videos = self.get_queryset()

        sort = request.GET.get("sort", "recent")
        if sort == "recent":
            videos = videos.order_by("-created_at")

        try:
            limit = int(request.GET.get("limit", 20))
        except ValueError:
            limit = 20
        limit = max(1, min(limit, 50))

        paginator = Paginator(videos, limit)
        page = request.GET.get("page", 1)
        
        try:
            page_videos = paginator.get_page(page)
        except Exception as e:
            logger.error(f"Pagination error in video feed: {str(e)}")
            return Response({'error': 'Invalid page or query failed'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = self.get_serializer(page_videos, many=True)
        return Response({
            'count': paginator.count,
            'num_pages': paginator.num_pages,
            'current_page': page_videos.number,
            'results': serializer.data
        })

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        video = self.get_object()
        user = request.user
        
        like, created = VideoLike.objects.get_or_create(user=user, video=video)
        
        if not created:
            like.delete()
            return Response({'status': 'unliked', 'like_count': video.likes.count()})
            
        return Response({'status': 'liked', 'like_count': video.likes.count()}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get', 'post'])
    def comment(self, request, pk=None):
        video = self.get_object()
        if request.method == 'POST':
            text = request.data.get('text')
            if not text:
                return Response({'error': 'Comment text required'}, status=status.HTTP_400_BAD_REQUEST)
            comment = VideoComment.objects.create(user=request.user, video=video, text=text)
            serializer = VideoCommentSerializer(comment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        comments = video.comments.all().order_by('-created_at')
        serializer = VideoCommentSerializer(comments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def record_view(self, request, pk=None):
        video = self.get_object()
        user = request.user
        
        if user.is_authenticated:
            # Persistent unique view for logged-in users
            view, created = VideoView.objects.get_or_create(user=user, video=video)
            status_msg = 'view recorded' if created else 'view already recorded'
        else:
            # Anonymous users: every call counts as a view (as per requirement: "counts views per refresh")
            # In a real app we might use session_id to prevent spam, but following instructions literally:
            VideoView.objects.create(user=None, video=video)
            status_msg = 'anonymous view recorded'
        
        return Response({
            'status': status_msg,
            'view_count': video.views.count()
        })

    def create(self, request, *args, **kwargs):
        from utils.supabase_storage import upload_video, upload_thumbnail
        import json
        
        video_file = request.FILES.get("video_file")
        thumbnail_file = request.FILES.get("thumbnail_file")

        if not video_file or not thumbnail_file:
            return Response(
                {"error": "Both video and thumbnail files are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 1. Prepare data for validation
        data = request.data
        
        # Remove backend-controlled fields if present in request
        for field in ["user", "video_url", "thumbnail_url", "status"]:
            data.pop(field, None)

       

        serializer = self.get_serializer(data=data)
        if not serializer.is_valid():
            logger.warning(f"Video creation validation failed: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # 2. Upload to Supabase
        video_url = None
        thumbnail_url = None
        try:
            video_url = upload_video(video_file)
            thumbnail_url = upload_thumbnail(thumbnail_file)
        except Exception as exc:
            logger.exception("Supabase upload failed during video creation")
            return Response(
                {"error": "Upload failed", "detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 3. Final Save
        try:
            video_instance = serializer.save(
                user=self.request.user,
                video_url=video_url,
                thumbnail_url=thumbnail_url
            )
            
            # Re-fetch with annotations for uniform response (view_count, etc)
            video_instance = self.get_queryset().get(pk=video_instance.pk)
            output_serializer = self.get_serializer(video_instance)
            return Response(output_serializer.data, status=status.HTTP_201_CREATED)
        except Exception as exc:
            logger.exception("Database save failed for Video")
            # Cleanup
            if video_url:
                try:
                    from utils.supabase import delete_file_from_supabase
                    delete_file_from_supabase(video_url, bucket_name="videos")
                except: pass
            if thumbnail_url:
                try:
                    from utils.supabase import delete_file_from_supabase
                    delete_file_from_supabase(thumbnail_url, bucket_name="thumbnails")
                except: pass
                
            return Response(
                {"error": "Failed to save record", "detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def perform_create(self, serializer):
        # Creation is fully handled in create() for fine-grained error handling.
        return serializer.save(user=self.request.user)


    @action(detail=False, methods=['get'])
    def top_chefs_week(self, request):
        """
        Return top 3 creators for the current week based on VideoView counts.
        """
        start_of_week = timezone.now() - timedelta(days=timezone.now().weekday())
        weekly_views = (
            VideoView.objects.filter(created_at__gte=start_of_week)
            .values('video__user')
            .annotate(view_count=Count('id'))
            .order_by('-view_count')[:3]
        )

        results = []
        user_ids = [row['video__user'] for row in weekly_views]
        user_map = {v.user_id: v.user for v in Video.objects.filter(user_id__in=user_ids).select_related('user')}

        for row in weekly_views:
            user = user_map.get(row['video__user'])
            if not user:
                continue
            profile = getattr(user, 'profile', None)
            results.append({
                'id': user.id,
                'username': user.username,
                'avatar': getattr(profile, 'profile_picture', None) if profile else None,
                'views_this_week': row['view_count'],
            })

        return Response(results)
