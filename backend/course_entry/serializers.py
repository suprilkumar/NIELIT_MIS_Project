from rest_framework import serializers
from dashboard.models import CourseEntry, Centre, CourseDetail, CourseCategory
from account.models import User
from datetime import date

class CentreBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Centre
        fields = ['id', 'centre_name', 'centre_code']

class CourseBasicSerializer(serializers.ModelSerializer):
    course_category_name = serializers.CharField(source='course_category.course_category_name', read_only=True)
    centre_name = serializers.CharField(source='course_centre.centre_name', read_only=True)
    
    class Meta:
        model = CourseDetail
        fields = ['id', 'course_name', 'course_category', 'course_category_name', 
                  'course_centre', 'centre_name', 'course_mode', 'course_duration', 'course_status']

class UserBasicSerializer(serializers.ModelSerializer):
    """Serializer for User with full_name instead of username"""
    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'contact']

class CourseEntryCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new course entries"""
    class Meta:
        model = CourseEntry
        fields = [
            'centre', 'course', 'entry_status',
            'total_enrolled', 'total_trained', 'total_certified', 'total_placed',
            'male_enrolled', 'male_trained', 'male_certified', 'male_placed',
            'female_enrolled', 'female_trained', 'female_certified', 'female_placed',
            'sc_enrolled', 'sc_trained', 'sc_certified', 'sc_placed',
            'st_enrolled', 'st_trained', 'st_certified', 'st_placed',
            'obc_enrolled', 'obc_trained', 'obc_certified', 'obc_placed',
            'pwd_enrolled', 'pwd_trained', 'pwd_certified', 'pwd_placed',
            'remarks'
        ]
    
    def validate(self, data):
        """Validate the entry data"""
        # Check if entry already exists for current month
        today = date.today()
        
        # For new entries, month_year is not provided, we'll set it automatically
        # But we need to check if entry already exists for this centre+course+current month
        if not self.instance:  # Creating new entry
            existing_entry = CourseEntry.objects.filter(
                centre=data['centre'],
                course=data['course'],
                month_year__year=today.year,
                month_year__month=today.month
            ).exists()
            
            if existing_entry:
                raise serializers.ValidationError(
                    "An entry for this centre and course already exists for the current month"
                )
        
        # Validate totals against breakdowns
        total_enrolled = data.get('total_enrolled', 0)
        total_trained = data.get('total_trained', 0)
        total_certified = data.get('total_certified', 0)
        total_placed = data.get('total_placed', 0)
        
        if total_trained > total_enrolled:
            raise serializers.ValidationError({
                'total_trained': 'Trained candidates cannot exceed enrolled candidates'
            })
        if total_certified > total_trained:
            raise serializers.ValidationError({
                'total_certified': 'Certified candidates cannot exceed trained candidates'
            })
        if total_placed > total_certified:
            raise serializers.ValidationError({
                'total_placed': 'Placed candidates cannot exceed certified candidates'
            })
        # Validate gender breakdown
        male_enrolled = data.get('male_enrolled', 0)
        female_enrolled = data.get('female_enrolled', 0)
        
        if male_enrolled + female_enrolled > total_enrolled:
            raise serializers.ValidationError(
                'Sum of male and female enrolled cannot exceed total enrolled'
            )
        
        # Validate category breakdown
        sc_enrolled = data.get('sc_enrolled', 0)
        st_enrolled = data.get('st_enrolled', 0)
        obc_enrolled = data.get('obc_enrolled', 0)
        general_enrolled = total_enrolled - (sc_enrolled + st_enrolled + obc_enrolled)
        
        if general_enrolled < 0:
            raise serializers.ValidationError(
                'Sum of SC, ST, and OBC enrolled cannot exceed total enrolled'
            )
        
        # Validate PWD
        if data.get('pwd_enrolled', 0) > total_enrolled:
            raise serializers.ValidationError({
                'pwd_enrolled': 'PWD enrolled cannot exceed total enrolled'
            })
        
        return data

class CourseEntryUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating existing entries"""
    class Meta:
        model = CourseEntry
        fields = [
            'entry_status', 'total_enrolled', 'total_trained', 'total_certified', 'total_placed',
            'male_enrolled', 'male_trained', 'male_certified', 'male_placed',
            'female_enrolled', 'female_trained', 'female_certified', 'female_placed',
            'sc_enrolled', 'sc_trained', 'sc_certified', 'sc_placed',
            'st_enrolled', 'st_trained', 'st_certified', 'st_placed',
            'obc_enrolled', 'obc_trained', 'obc_certified', 'obc_placed',
            'pwd_enrolled', 'pwd_trained', 'pwd_certified', 'pwd_placed',
            'remarks'
        ]
    
    def validate(self, data):
        """Validate the entry data for updates"""
        # Check if entry is locked or verified
        if self.instance and self.instance.entry_status in ['LOCKED', 'VERIFIED']:
            raise serializers.ValidationError(
                f"Cannot update {self.instance.entry_status.lower()} entries"
            )
        
        # Same validations as create serializer
        total_enrolled = data.get('total_enrolled', self.instance.total_enrolled)
        total_trained = data.get('total_trained', self.instance.total_trained)
        total_certified = data.get('total_certified', self.instance.total_certified)
        total_placed = data.get('total_placed', self.instance.total_placed)
        
        if total_trained > total_enrolled:
            raise serializers.ValidationError({'total_trained': 'Trained candidates cannot exceed enrolled candidates'})
        if total_certified > total_trained:
            raise serializers.ValidationError({'total_certified': 'Certified candidates cannot exceed trained candidates'})
        if total_placed > total_certified:
            raise serializers.ValidationError({'total_placed': 'Placed candidates cannot exceed certified candidates'})
        male_enrolled = data.get('male_enrolled', self.instance.male_enrolled)
        female_enrolled = data.get('female_enrolled', self.instance.female_enrolled)
        
        if male_enrolled + female_enrolled > total_enrolled:
            raise serializers.ValidationError('Sum of male and female enrolled cannot exceed total enrolled')
        return data

class CourseEntryListSerializer(serializers.ModelSerializer):
    """Serializer for listing course entries"""
    centre_name = serializers.CharField(source='centre.centre_name', read_only=True)
    course_name = serializers.CharField(source='course.course_name', read_only=True)
    course_category = serializers.CharField(source='course.course_category.course_category_name', read_only=True)
    course_category_type = serializers.CharField(source = 'course.course_category.course_category_type', read_only = True)
    course_mode = serializers.CharField(source = 'course.course_mode', read_only = True)
    course_duration = serializers.CharField(source = 'course.course_duration', read_only = True)
    status_display = serializers.CharField(source='get_entry_status_display', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    updated_by_name = serializers.SerializerMethodField()
    verified_by_name = serializers.SerializerMethodField()
    month_display = serializers.SerializerMethodField()
    
    class Meta:
        model = CourseEntry
        fields = [
            'id', 'centre', 'centre_name', 'course', 'course_name', 'course_category', 'course_mode', 'course_duration',
            'month_year', 'month_display', 'status_display', 'entry_status',
            'total_enrolled', 'total_trained', 'total_certified', 'total_placed',
            'male_enrolled', 'male_trained', 'male_certified', 'male_placed',
            'female_enrolled', 'female_trained', 'female_certified', 'female_placed',
            'sc_enrolled', 'sc_trained', 'sc_certified', 'sc_placed',
            'st_enrolled', 'st_trained', 'st_certified', 'st_placed',
            'obc_enrolled', 'obc_trained', 'obc_certified', 'obc_placed',
            'pwd_enrolled', 'pwd_trained', 'pwd_certified', 'pwd_placed',
            'remarks', 'created_at', 'updated_at', 'verified_at',
            'created_by_name', 'updated_by_name', 'verified_by_name', 'course_category_type',
        ]
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.full_name
        return None
    
    def get_updated_by_name(self, obj):
        if obj.updated_by:
            return obj.updated_by.full_name
        return None
    
    def get_verified_by_name(self, obj):
        if obj.verified_by:
            return obj.verified_by.full_name
        return None
    
    def get_month_display(self, obj):
        if obj.month_year:
            return obj.month_year.strftime('%B %Y')
        return None

class CourseEntryDetailSerializer(serializers.ModelSerializer):
    """Serializer for retrieving course entry details"""
    centre = CentreBasicSerializer(read_only=True)
    course = CourseBasicSerializer(read_only=True)
    created_by = UserBasicSerializer(read_only=True)
    updated_by = UserBasicSerializer(read_only=True)
    verified_by = UserBasicSerializer(read_only=True)
    month_display = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_entry_status_display', read_only=True)
    
    class Meta:
        model = CourseEntry
        fields = '__all__'
    
    def get_month_display(self, obj):
        if obj.month_year:
            return obj.month_year.strftime('%B %Y')
        return None

class CurrentMonthStatusSerializer(serializers.Serializer):
    """Serializer for current month entry status"""
    exists = serializers.BooleanField()
    entry_id = serializers.UUIDField(allow_null=True)
    entry_status = serializers.CharField(allow_null=True)
    can_create = serializers.BooleanField()
    can_edit = serializers.BooleanField()
    message = serializers.CharField()
