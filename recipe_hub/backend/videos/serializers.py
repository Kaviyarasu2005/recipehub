import json
from rest_framework import serializers
from .models import Video, VideoView, VideoLike, VideoComment


class VideoCommentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = VideoComment
        fields = ('id', 'username', 'avatar', 'text', 'created_at')
        read_only_fields = ('id', 'username', 'avatar', 'created_at')

    def get_avatar(self, obj):
        try:
            return obj.user.profile.profile_picture if obj.user and hasattr(obj.user, 'profile') else None
        except Exception:
            return None


class VideoFeedSerializer(serializers.ModelSerializer):
    creator_id = serializers.IntegerField(source="user.id", read_only=True)
    creator_username = serializers.CharField(source="user.username", read_only=True)
    creator_avatar = serializers.SerializerMethodField()
    view_count = serializers.IntegerField(read_only=True)
    like_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Video
        fields = [
            "id",
            "title",
            "thumbnail_url",
            "user",  # Added to match Frontend's mapApiVideoToVideo
            "creator_id",
            "creator_username",
            "creator_avatar",
            "view_count",
            "like_count",
            "category"
        ]

    def get_creator_avatar(self, obj):
        try:
            return obj.user.profile.profile_picture if obj.user and hasattr(obj.user, 'profile') else None
        except Exception:
            return None


class VideoDetailSerializer(serializers.ModelSerializer):

    creator_username = serializers.CharField(source='user.username', read_only=True)
    creator_id = serializers.IntegerField(source="user.id", read_only=True)
    creator_avatar = serializers.SerializerMethodField()

    view_count = serializers.IntegerField(read_only=True)
    like_count = serializers.IntegerField(read_only=True)

    comments = VideoCommentSerializer(many=True, read_only=True)

    class Meta:
        model = Video
        fields = [
            'id',
            'title',
            'description',
            'video_url',
            'thumbnail_url',
            'ingredients',
            'instructions',
            'category',
            'status',
            'user',
            'creator_id',
            'creator_username',
            'creator_avatar',
            'view_count',
            'like_count',
            'comments',
            'created_at',
        ]
        read_only_fields = ('id','created_at','user','video_url','thumbnail_url')


    def get_creator_avatar(self, obj):
        try:
            return obj.user.profile.profile_picture if obj.user and hasattr(obj.user, 'profile') else None
        except Exception:
            return None


    def create(self, validated_data):

        request = self.context["request"]

        ingredients = request.data.getlist("ingredients")
        instructions = request.data.getlist("instructions")

        ingredients = [i.strip() for i in ingredients if i.strip()]
        instructions = [i.strip() for i in instructions if i.strip()]

        validated_data["ingredients"] = json.dumps(ingredients)
        validated_data["instructions"] = json.dumps(instructions)

        return super().create(validated_data)


    def to_representation(self, instance):

        ret = super().to_representation(instance)

        for field in ["ingredients", "instructions"]:
            val = ret.get(field)

            if isinstance(val, str):
                try:
                    ret[field] = json.loads(val)
                except:
                    ret[field] = []

        return ret