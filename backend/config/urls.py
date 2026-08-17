from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.urls import re_path
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi


schema_view = get_schema_view(
   openapi.Info(
      title="Snippets API",
      default_version='v1',
      description="Test description",
      terms_of_service="https://www.google.com/policies/terms/",
      contact=openapi.Contact(email="contact@snippets.local"),
      license=openapi.License(name="BSD License"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls.auth')),
    path('api/users/', include('apps.accounts.urls.users')),
    path('api/projects/', include('apps.projects.urls')),
    path('api/tickets/', include('apps.tickets.urls')),
    path('api/files/', include('apps.files.urls')),
    path('api/wallets/', include('apps.wallets.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/reviews/', include('apps.reviews.urls')),
    path('api/audit/', include('apps.audit.urls')),
   #  path('swagger.<format>/', schema_view.without_ui(cache_timeout=0), name='schema-json'),
   #  path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
   #  path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Admin customization
admin.site.site_header = 'MediaFlow Administration'
admin.site.site_title = 'MediaFlow Admin'
admin.site.index_title = 'MediaFlow Control Panel'
