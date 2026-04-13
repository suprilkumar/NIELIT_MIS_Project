from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('account.urls')),
    path('api/dashboard/', include('dashboard.urls')),
    path('api/course-entry/', include('course_entry.urls')),
    path('api/report/', include('report.urls')),
    path("api/nl-sql/", include("nl_sql.urls")),
]