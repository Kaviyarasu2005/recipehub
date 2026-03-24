from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Profile, Follow
from .utils import determine_user_role

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'role')
        extra_kwargs = {
            'password': {'write_only': True},
            'username': {'required': False}
        }

    def create(self, validated_data):
        if 'username' not in validated_data or not validated_data['username']:
            email = validated_data.get('email')
            if email:
                username = email.split('@')[0]
                # Handle potential duplicate usernames
                base_username = username
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}{counter}"
                    counter += 1
                validated_data['username'] = username

        # Always derive role from email on the server side.
        validated_data['role'] = determine_user_role(validated_data.get('email') or '')

        user = User.objects.create_user(**validated_data)
        # Create a default profile
        Profile.objects.get_or_create(user=user)
        return user

class ProfileSerializer(serializers.ModelSerializer):
    id = serializers.ReadOnlyField(source='user.id')
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    role = serializers.CharField(source='user.role', read_only=True)
    avatar = serializers.SerializerMethodField()
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    videos_count = serializers.SerializerMethodField()

    first_name = serializers.CharField(source='user.first_name', required=False)
    last_name = serializers.CharField(source='user.last_name', required=False)

    class Meta:
        model = Profile
        fields = (
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'bio',
            'profile_picture',
            'avatar',
            'role',
            'created_at',
            'followers_count',
            'following_count',
            'videos_count',
            'industry',
            'location',
            'contact_number',
            'hr_name',
        )
        read_only_fields = ('id', 'role', 'created_at')

    def get_avatar(self, obj):
        """
        Return a safe avatar URL.
        If profile_picture is empty or None, explicitly return None so the frontend
        can handle the absence of an avatar without errors.
        """
        url = getattr(obj, 'profile_picture', None)
        return url or None

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", None)

        if user_data:
            user = instance.user
            user.first_name = user_data.get("first_name", user.first_name)
            user.last_name = user_data.get("last_name", user.last_name)
            user.save()

        return super().update(instance, validated_data)

    def get_followers_count(self, obj):
        # Prefer annotated value when present to avoid extra queries
        if hasattr(obj, 'followers_count_annotated') and obj.followers_count_annotated is not None:
            return int(obj.followers_count_annotated)

        user = getattr(obj, 'user', None)
        if not user or not hasattr(user, 'followers'):
            return 0

        return user.followers.count()

    def get_following_count(self, obj):
        if hasattr(obj, 'following_count_annotated') and obj.following_count_annotated is not None:
            return int(obj.following_count_annotated)

        user = getattr(obj, 'user', None)
        if not user or not hasattr(user, 'following'):
            return 0

        return user.following.count()

    def get_videos_count(self, obj):
        if hasattr(obj, 'videos_count_annotated') and obj.videos_count_annotated is not None:
            return int(obj.videos_count_annotated)

        user = getattr(obj, 'user', None)
        # Guard against missing reverse relation (e.g. if videos are not defined or
        # use a different related_name) to prevent AttributeError / NoneType errors.
        videos_manager = getattr(user, 'videos', None) if user else None
        if videos_manager is None:
            return 0

        return videos_manager.count()

class FollowSerializer(serializers.ModelSerializer):
    follower_name = serializers.CharField(source='follower.username', read_only=True)
    following_name = serializers.CharField(source='following.username', read_only=True)

    class Meta:
        model = Follow
        fields = ('id', 'follower', 'following', 'follower_name', 'following_name', 'created_at')
        read_only_fields = ('id', 'created_at')
