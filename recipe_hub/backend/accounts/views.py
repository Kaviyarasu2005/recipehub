from django.db.models import Count
from rest_framework import status, views, viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from django.contrib.auth import get_user_model, authenticate
from rest_framework.authtoken.models import Token
from .models import Profile, Follow
from .serializers import UserSerializer, ProfileSerializer, FollowSerializer
from utils.supabase import upload_file_to_supabase

User = get_user_model()

class UserDetailView(views.APIView):
    """Get or update user profile using Django ORM"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, username=None):
        """
        Return the authenticated user's profile (or the profile for the given username)
        in a safe way, avoiding uncaught exceptions that would result in a 500 error.
        """
        try:
            if username:
                try:
                    user = User.objects.get(username=username)
                except User.DoesNotExist:
                    return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
            else:
                user = request.user

            if not user or not user.is_authenticated:
                return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

            profile = getattr(user, 'profile', None)
            if profile is None:
                profile, _ = Profile.objects.get_or_create(user=user)

            serializer = ProfileSerializer(profile)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Profile.DoesNotExist:
            # Profile unexpectedly missing – treat as 404 instead of propagating 500
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as exc:
            # Catch-all to prevent 500s from reaching the client
            return Response(
                {'error': 'Unable to fetch profile', 'detail': str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )    
    def patch(self, request):
        from utils.supabase_storage import upload_avatar
        profile = getattr(request.user, 'profile', None)
        if not profile:
            profile, _ = Profile.objects.get_or_create(user=request.user)
            
        data = request.data.copy()
        
        # 1. Update User model fields explicitly
        user_updated = False
        if 'first_name' in data:
            val = data.pop('first_name')
            request.user.first_name = val[0] if isinstance(val, list) else val
            user_updated = True
        if 'last_name' in data:
            val = data.pop('last_name')
            request.user.last_name = val[0] if isinstance(val, list) else val
            user_updated = True
        if user_updated:
            request.user.save()

        # 2. Handle Avatar Upload
        avatar_file = request.FILES.get('avatar') or request.FILES.get('profile_picture')
        
        # Explicitly remove these keys from data to prevent Serializer validation errors
        # if they are files (which URLField would reject)
        data.pop('avatar', None)
        data.pop('profile_picture', None)
        
        if avatar_file:
            try:
                url = upload_avatar(avatar_file)
                data['profile_picture'] = url
            except Exception as e:
                logger.error(f"Avatar upload failed: {e}")
                return Response({'error': f"Failed to upload avatar: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
        
        # 3. Handle data-uris or existing URLs passed as strings
        # (Though we expect URLs to be in 'profile_picture' in the model)
        
        # 4. Serialize and Save Profile
        serializer = ProfileSerializer(profile, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        logger.warning(f"Profile update validation failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AuthViewSet(viewsets.ViewSet):
    """ViewSet for login/signup using standard Django Auth"""
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'])
    def signup(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'role': user.role
                },
                'role': user.role
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def login(self, request):
        email = request.data.get("identifier")
        password = request.data.get("password")

        if not email or not password:
            return Response({"error": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email=email).first()

        if not user:
            return Response({"error": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(password):
            return Response({"error": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)

        token, _ = Token.objects.get_or_create(user=user)
        Profile.objects.get_or_create(user=user)

        return Response({
            "token": token.key,
            "role": user.role,
            "email": user.email
        })

    @action(detail=False, methods=['get'])
    def search_users(self, request):
        query = request.GET.get('q', '')
        if not query:
            return Response([])
        
        users = User.objects.filter(username__istartswith=query, role='user').exclude(id=request.user.id)[:10]
        profiles = Profile.objects.filter(user__in=users).select_related('user').annotate(
            followers_count_annotated=Count('user__followers', distinct=True),
            following_count_annotated=Count('user__following', distinct=True),
            videos_count_annotated=Count('user__videos', distinct=True)
        )
        serializer = ProfileSerializer(profiles, many=True)
        return Response(serializer.data)

class FollowViewSet(viewsets.ViewSet):
    """ViewSet for following/unfollowing users"""
    permission_classes = [IsAuthenticated]

    def _get_user(self, pk):
        """Lookup user by ID or username"""
        try:
            if str(pk).isdigit():
                return User.objects.get(pk=pk)
            return User.objects.get(username=pk)
        except User.DoesNotExist:
            return None

    @action(detail=True, methods=['post'], url_path='')
    def toggle_follow(self, request, pk=None):
        following = self._get_user(pk)
        if not following:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if following == request.user:
            return Response({'error': 'Cannot follow yourself'}, status=status.HTTP_400_BAD_REQUEST)
        
        follow_obj = Follow.objects.filter(follower=request.user, following=following).first()
        
        if follow_obj:
            follow_obj.delete()
            is_following = False
            message = 'Unfollowed successfully'
        else:
            Follow.objects.create(follower=request.user, following=following)
            is_following = True
            message = 'Followed successfully'
        
        return Response({
            'message': message,
            'followers_count': following.followers.count(),
            'following_count': following.following.count(),
            'is_following': is_following,
            'current_user_following_count': request.user.following.count()
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def check_follow(self, request, pk=None):
        following = self._get_user(pk)
        if not following:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        is_following = Follow.objects.filter(follower=request.user, following=following).exists()
        return Response({'is_following': is_following})

    @action(detail=True, methods=['get'])
    def followers(self, request, pk=None):
        user = self._get_user(pk)
        if not user:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        followers = user.followers.all().select_related('follower')
        follower_ids = [f.follower_id for f in followers]
        profiles = Profile.objects.filter(user_id__in=follower_ids).select_related('user').annotate(
            followers_count_annotated=Count('user__followers', distinct=True),
            following_count_annotated=Count('user__following', distinct=True),
            videos_count_annotated=Count('user__videos', distinct=True)
        )
        serializer = ProfileSerializer(profiles, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def following(self, request, pk=None):
        user = self._get_user(pk)
        if not user:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        following = user.following.all().select_related('following')
        following_ids = [f.following_id for f in following]
        profiles = Profile.objects.filter(user_id__in=following_ids).select_related('user').annotate(
            followers_count_annotated=Count('user__followers', distinct=True),
            following_count_annotated=Count('user__following', distinct=True),
            videos_count_annotated=Count('user__videos', distinct=True)
        )
        serializer = ProfileSerializer(profiles, many=True)
        return Response(serializer.data)
