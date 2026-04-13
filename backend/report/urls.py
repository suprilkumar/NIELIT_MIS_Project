from django.urls import path

from .views import *
from . import views

urlpatterns = [
    path('reports/data/', views.get_report_data, name='report-data'),
    path('reports/filters/', views.get_report_filters, name='report-filters'),
    path('mis-file-upload/', views.mis_csv_upload, name='mis-file-upload'),
    path('course-entry-bulk-create/', views.course_entry_bulk_create, name='course-entry-bulk-create'),
    path('course-entries/', views.get_course_entries, name='get-course-entries'),
    path('course-entries/<uuid:centre_id>/', views.get_course_entries, name='get-course-entries-by-centre'),
]