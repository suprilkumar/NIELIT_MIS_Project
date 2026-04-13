from rest_framework import serializers
from .models import *
from django.db.models import Sum, Count, Q
from datetime import datetime, timedelta

class CentreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Centre
        fields = "__all__"
        
class CourseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseCategory
        fields = "__all__"
        

class CourseDetailSerializer(serializers.ModelSerializer):
    # For write operations - accept IDs
    course_category = serializers.PrimaryKeyRelatedField(queryset=CourseCategory.objects.all())
    course_centre = serializers.PrimaryKeyRelatedField(queryset=Centre.objects.all())
    
    # For read operations - show the names
    course_category_display = serializers.CharField(source='course_category.course_category_name', read_only=True)
    course_centre_display = serializers.CharField(source='course_centre.centre_name', read_only=True)
    
    class Meta:
        model = CourseDetail
        fields = "__all__"

class CourseEntrySerializer(serializers.ModelSerializer):
    centre_name = serializers.CharField(source = "centre.centre_name", read_only = True)
    course_category = serializers.CharField(source = "course.course_category.course_category_name", read_only = True)
    course_name = serializers.CharField(source = "course.course_name", read_only = True)
    class Meta:
        model = CourseEntry
        fields = "__all__"

class CourseEntryDetailSerializer(serializers.ModelSerializer):
    centre_details = CentreSerializer(source='centre', read_only=True)
    course_details = CourseDetailSerializer(source='course', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    updated_by_name = serializers.CharField(source='updated_by.full_name', read_only=True)
    
    class Meta:
        model = CourseEntry
        fields = "__all__"
        depth = 1  # This will automatically include nested relationships


#Dashboards Serializers

class CentreDashboardSerializer(serializers.ModelSerializer):
    total_courses = serializers.SerializerMethodField()
    total_enrolled = serializers.SerializerMethodField()
    total_certified = serializers.SerializerMethodField()
    total_placed = serializers.SerializerMethodField()
    active_courses = serializers.SerializerMethodField()
    
    class Meta:
        model = Centre
        fields = ['id', 'centre_name', 'centre_code', 'total_courses', 
                 'total_enrolled', 'total_certified', 'total_placed', 'active_courses']
    
    def get_total_courses(self, obj):
        return CourseDetail.objects.filter(course_centre=obj).count()
    
    def get_total_enrolled(self, obj):
        return CourseEntry.objects.filter(centre=obj).aggregate(
            total=Sum('total_enrolled')
        )['total'] or 0
    
    def get_total_certified(self, obj):
        return CourseEntry.objects.filter(centre=obj).aggregate(
            total=Sum('total_certified')
        )['total'] or 0
    
    def get_total_placed(self, obj):
        return CourseEntry.objects.filter(centre=obj).aggregate(
            total=Sum('total_placed')
        )['total'] or 0
    
    def get_active_courses(self, obj):
        return CourseDetail.objects.filter(
            course_centre=obj, 
            course_status='ACTIVE'
        ).count()


class CourseEnrollmentStatsSerializer(serializers.Serializer):
    course_name = serializers.CharField()
    total_enrolled = serializers.IntegerField()
    total_certified = serializers.IntegerField()
    total_placed = serializers.IntegerField()
    completion_rate = serializers.FloatField()
    placement_rate = serializers.FloatField()


class MonthlyTrendSerializer(serializers.Serializer):
    month = serializers.DateField()
    enrolled = serializers.IntegerField()
    certified = serializers.IntegerField()
    placed = serializers.IntegerField()


class CategoryBreakdownSerializer(serializers.Serializer):
    category = serializers.CharField()
    enrolled = serializers.IntegerField()
    certified = serializers.IntegerField()
    placed = serializers.IntegerField()


class GenderBreakdownSerializer(serializers.Serializer):
    gender = serializers.CharField()
    enrolled = serializers.IntegerField()
    certified = serializers.IntegerField()
    placed = serializers.IntegerField()


class DashboardOverviewSerializer(serializers.Serializer):
    total_centres = serializers.IntegerField()
    total_courses = serializers.IntegerField()
    total_enrolled = serializers.IntegerField()
    total_certified = serializers.IntegerField()
    total_placed = serializers.IntegerField()
    overall_completion_rate = serializers.FloatField()
    overall_placement_rate = serializers.FloatField()
    centres_data = CentreDashboardSerializer(many=True)