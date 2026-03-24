from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Job, JobApplication
from .serializers import JobSerializer, JobApplicationSerializer

class JobViewSet(viewsets.ModelViewSet):
    """ViewSet for interactions with Jobs using Django ORM"""
    queryset = Job.objects.all().order_by('-created_at')
    serializer_class = JobSerializer
    pagination_class = None  # Return flat array for frontend compatibility
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'apply', 'applicants']:
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_queryset(self):
        queryset = super().get_queryset()
        # Admin can see everything; others see only approved jobs
        if self.request.user.is_authenticated and self.request.user.role == 'admin':
            return queryset
            
        if self.action in ["list", "retrieve"]:
            return queryset.filter(status="approved")
        return queryset

    def perform_create(self, serializer):
        # In a real app we might check if user.profile.role == 'company'
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def apply(self, request, pk=None):
        job = self.get_object()
        user = request.user
        
        # Check if already applied
        if JobApplication.objects.filter(job=job, user=user).exists():
            return Response({'error': 'Already applied'}, status=status.HTTP_400_BAD_REQUEST)
            
        serializer = JobApplicationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(job=job, user=user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def applicants(self, request, pk=None):
        job = self.get_object()
        
        # Only company that posted or admin
        if job.user != request.user and not request.user.is_staff:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
            
        applications = job.applications.all()
        serializer = JobApplicationSerializer(applications, many=True)
        return Response(serializer.data)
