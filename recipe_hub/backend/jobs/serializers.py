from rest_framework import serializers
from .models import Job, JobApplication

class JobSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='user.username', read_only=True)
    company_logo = serializers.SerializerMethodField()
    company_industry = serializers.CharField(source='user.profile.company_details.industry', read_only=True, default='Other')
    applicant_ids = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = (
            'id', 'title', 'description', 'user', 'company_name', 'company_logo', 
            'company_industry', 'created_at', 'salary', 'location', 'skills', 
            'status', 'last_date', 'job_type', 'working_hours', 'weekly_off', 
            'experience', 'contact_method', 'applicant_ids'
        )
        read_only_fields = ('id', 'user', 'created_at', 'applicant_ids')

    def get_company_logo(self, obj):
        profile = getattr(obj.user, 'profile', None)
        if profile and profile.profile_picture:
            return profile.profile_picture
        return None

    def get_applicant_ids(self, obj):
        return list(obj.applications.values_list('user_id', flat=True))

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Convert skills string to list for frontend
        if ret.get('skills'):
            ret['skills'] = [s.strip() for s in ret['skills'].split(',')]
        else:
            ret['skills'] = []
        return ret

    def to_internal_value(self, data):
        # Convert skills list to string for storage
        if 'skills' in data and isinstance(data['skills'], list):
            data['skills'] = ','.join(data['skills'])
        return super().to_internal_value(data)

class JobApplicationSerializer(serializers.ModelSerializer):
    applicant_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = JobApplication
        fields = ('id', 'job', 'user', 'applicant_username', 'resume_url', 'created_at')
        read_only_fields = ('id', 'user', 'created_at')
