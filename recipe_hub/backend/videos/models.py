from django.db import models
from django.conf import settings

class Video(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    video_url = models.URLField()
    thumbnail_url = models.URLField()
    ingredients = models.TextField(blank=True, help_text="Stored as JSON string or plain text")
    instructions = models.TextField(blank=True, help_text="Stored as JSON string or plain text")
    category = models.CharField(max_length=100, blank=True, default="Veg")
    status = models.CharField(max_length=20, default="approved", choices=[("pending", "Pending"), ("approved", "Approved"), ("rejected", "Rejected")])
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='videos')
    duration = models.CharField(max_length=10, default="00:00", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    # Renamed properties to avoid conflict with queryset annotations in views
    @property
    def get_view_count(self):
        return self.views.count()

    @property
    def get_like_count(self):
        return self.likes.count()

class VideoView(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name='views')
    session_id = models.CharField(max_length=255, null=True, blank=True) # To help identify unique guest views if needed
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'video'], name='unique_user_video_view', condition=models.Q(user__isnull=False))
        ]

class VideoLike(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'video'], name='unique_like')
        ]

class VideoComment(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name='comments')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
