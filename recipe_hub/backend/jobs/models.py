from django.db import models
from django.conf import settings

class Job(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='jobs')
    created_at = models.DateTimeField(auto_now_add=True)

    salary = models.CharField(max_length=100, blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    skills = models.TextField(blank=True, null=True) # Stored as comma-separated or JSON string
    status = models.CharField(max_length=20, default='pending') # pending, approved, rejected
    last_date = models.DateField(blank=True, null=True)
    job_type = models.CharField(max_length=50, blank=True, null=True) # Full-time, Part-time
    working_hours = models.CharField(max_length=100, blank=True, null=True)
    weekly_off = models.CharField(max_length=100, blank=True, null=True)
    experience = models.CharField(max_length=100, blank=True, null=True)
    contact_method = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return self.title

class JobApplication(models.Model):
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    resume_url = models.URLField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'job'], name='unique_application')
        ]
