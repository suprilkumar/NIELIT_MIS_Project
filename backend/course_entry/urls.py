from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import *

# ============================================
# USER/OPERATOR ROUTER URLS (Existing)
# ============================================

router = DefaultRouter()
router.register(r'entries', views.CourseEntryViewSet, basename='course-entry')
router.register(r'dropdown/centres', views.CentreDropdownViewSet, basename='centre-dropdown')
router.register(r'dropdown/courses', views.CourseDropdownViewSet, basename='course-dropdown')

# ============================================
# ADMIN FUNCTION-BASED URLS (New Separate URLs)
# ===========================================

urlpatterns = [
    # User/Operator URLs (via router)
    path('', include(router.urls)),
    path('view/<str:id>/', course_entry_detail),
    path('admin/create-entry/', create_custom_course_entry),
    path('list/', list_course_entries),
    path('manage/<str:id>/', edit_delete_course_entry),
    path('by-centre-month-year/', get_courses_with_entries_by_centre_month),
    path('check-existing-entry/', check_existing_entry, name='check_existing_entry'),

    path('verification/pending/', views.get_pending_entries, name='pending-entries'),
    path('verification/entry/<str:entry_id>/', views.get_entry_details, name='entry-details'),
    path('verification/entry/<str:entry_id>/verify/', views.verify_entry, name='verify-entry'),
    #path('verification/entry/<str:entry_id>/reject/', views.reject_entry, name='reject-entry'),
    #path('verification/bulk-verify/', views.bulk_verify_entries, name='bulk-verify'),
    path('verification/stats/', views.get_verification_stats, name='verification-stats'),
    #path('verification/centres/', views.get_centres_with_pending, name='centres-with-pending'),
]
