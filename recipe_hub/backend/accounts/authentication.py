import jwt
from django.conf import settings
from rest_framework import authentication
from rest_framework.exceptions import AuthenticationFailed
from supabase import create_client, Client

class SupabaseUser:
    """A minimal user object to satisfy DRF's request.user requirement."""
    def __init__(self, user_id, email, role='user', metadata=None):
        self.id = user_id
        self.user_id = user_id
        self.email = email
        self.role = role
        self.metadata = metadata or {}
        self.is_authenticated = True

    @property
    def is_company(self):
        return self.role == 'company'

    @property
    def is_admin_user(self):
        return self.role == 'admin'
    
    @property
    def is_staff(self):
        # Compatibility with some DRF/Django internals
        return self.role == 'admin'

    @property
    def is_active(self):
        return True

    def __str__(self):
        return self.email

class SupabaseAuthentication(authentication.BaseAuthentication):
    def __init__(self):
        self.supabase: Client = create_client(
            settings.SUPABASE_URL, 
            settings.SUPABASE_SERVICE_ROLE_KEY
        )

    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ')[1]

        try:
            # Verify the JWT using Supabase secret
            payload = jwt.decode(
                token, 
                settings.SUPABASE_JWT_SECRET, 
                algorithms=["HS256"], 
                audience="authenticated"
            )
            
            user_id = payload.get('sub')
            email = payload.get('email')
            
            # Use data from payload if available (app_metadata or user_metadata)
            # Standard Supabase JWT usually has these:
            # payload['app_metadata']['role'] if set via trigger
            # For now, we'll fetch from profiles to be sure, or check payload
            
            app_metadata = payload.get('app_metadata', {})
            role = app_metadata.get('role')
            is_premium = app_metadata.get('is_premium', False)

            if not role:
                # Fallback to fetching from profiles table if not in JWT
                profile_response = self.supabase.table('profiles').select('role, is_premium').eq('id', user_id).execute()
                if profile_response.data:
                    profile = profile_response.data[0]
                    role = profile.get('role', 'user')
                    is_premium = profile.get('is_premium', False)
                else:
                    role = 'user'
                    is_premium = False

            # Add is_premium to metadata for reuse
            payload['is_premium'] = is_premium

            user = SupabaseUser(user_id, email, role=role, metadata=payload)
            return (user, token)

        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token has expired')
        except jwt.InvalidTokenError as e:
            raise AuthenticationFailed(f'Invalid token: {str(e)}')
        except Exception as e:
            raise AuthenticationFailed(str(e))

    def authenticate_header(self, request):
        return 'Bearer'

