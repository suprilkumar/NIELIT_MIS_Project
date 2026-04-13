from django.urls import path
from .views import AdminDashboardView, OperatorDashboardView, UserDashboardView
from .views import *
from . import views

urlpatterns = [
    path('admin/', AdminDashboardView.as_view(), name='admin_dashboard'),
    path('operator/', OperatorDashboardView.as_view(), name='operator_dashboard'),
    path('user/', UserDashboardView.as_view(), name='user_dashboard'),
   
    #Centre URLS
    path('centre/add-centre/', add_centre),
    path('centres/', list_centres),
    path('manage-centre/<str:id>/', edit_delete_centre),

    path('centre-detail/<str:id>/', views.centre_detail, name='centre-detail'),
    path('centre-courses/<str:id>/', views.centre_courses_list, name='centre-courses-list'),
    path('centre/<str:centre_id>/course/<str:course_id>/', views.centre_course_detail, name='centre-course-detail'),

    #Course Category URLS
    path('course-category/add/', add_course_category),
    path('course-categories/', list_course_categories),
    path('course-category/manage/<str:id>/', edit_delete_course_categories),

    #Course Detail URLS
    path('course/add/', add_course),
    path('courses/', list_courses),
    path('course/manage/<str:id>/', edit_delete_course),

    path('course-detail/<str:id>/', views.course_detail, name='course-detail'),
    path('course-entry/<str:course_id>/<int:year>/<int:month>/', views.course_month_entry, name='course-month-entry'),
    path('course-entries-summary/<str:id>/', views.course_entries_summary, name='course-entries-summary'),

    #Courses by Status
    path('course-active/', active_courses),
    path('course-inactive/', inactive_courses),
    path('course-completed/', completed_courses),
    path('course-upcoming/', upcoming_courses),
    path('course-cancelled/', cancelled_courses),
    path('course-hold/', hold_courses),

    #Analytics Dashboard 
    path('dashboard/overview/', views.dashboard_overview, name='dashboard-overview'),
    path('dashboard/course-stats/', views.course_enrollment_stats, name='course-stats'),
    path('dashboard/monthly-trends/', views.monthly_trends, name='monthly-trends'),
    path('dashboard/category-breakdown/', views.category_breakdown, name='category-breakdown'),
    path('dashboard/gender-breakdown/', views.gender_breakdown, name='gender-breakdown'),
    path('dashboard/centre/<uuid:centre_id>/', views.centre_performance, name='centre-performance'),
    path('dashboard/years/', views.year_filter_options, name='year-filter'),
]