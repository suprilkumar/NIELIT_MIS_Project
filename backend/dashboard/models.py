from django.db import models
import uuid
from django.core.validators import MinValueValidator, MaxValueValidator
from account.models import User
from django.core.exceptions import ValidationError

# Create your models here.
class Centre(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    centre_name = models.CharField(max_length = 100, null = True, blank = True)
    centre_address = models.TextField( null = True, blank = True)
    centre_code = models.CharField(max_length = 500, null = True, blank = True)
    centre_state = models.CharField(max_length = 100, null = True, blank = True, default = "Delhi")

class CourseCategory(models.Model):
    COURSE_CATEGORY_TYPE = [
        ('A', 'A'),
        ('B', 'B'),
        ('C', 'C'),
        ('D', 'D'),
        ('E', 'E'),
        ('F', 'F'),
        ('G', 'G'),
        ('H', 'H'),
        ('I', 'I'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course_category_type = models.CharField(max_length = 10, choices = COURSE_CATEGORY_TYPE, null = True, blank = True)
    course_category_name = models.CharField(max_length = 200, null = True, blank = True)
    course_category_desc = models.TextField(null = True, blank = True)
    created_datetime = models.DateTimeField(auto_now_add = True, null = True, blank = True)

class CourseDetail(models.Model):
    COURSE_MODE_CHOICES = [
        ('OnCampus', 'OnCampus'),
        ('OffCampus', 'OffCampus'),
        ('Online', 'Online'),
        ('Offline', 'Offline'),
        ('Hybrid', 'Hybrid'),
        ('Other', 'Other'),
    ]
    COURSE_STATUS = [
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
        ('COMPLETED', 'Completed'),
        ('UPCOMING', 'Upcoming'),
        ('CANCELLED', 'Cancelled'),
        ('HOLD', 'Hold'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course_name = models.CharField(max_length = 200, null = True, blank = True)
    course_category = models.ForeignKey(CourseCategory, on_delete = models.CASCADE)
    course_centre = models.ForeignKey(Centre, on_delete = models.CASCADE)
    course_desc = models.TextField(null = True, blank = True)
    course_mode = models.CharField(choices = COURSE_MODE_CHOICES, null = True, blank = True)
    course_duration = models.CharField(max_length = 40 ,null = True, blank = True)
    course_scheme = models.CharField(null = True, blank = True)
    course_status = models.CharField(choices = COURSE_STATUS, null = True, blank = True)
    course_created_at = models.DateTimeField(auto_now_add = True, null = True, blank = True)
    course_updated_at = models.DateTimeField(auto_now = True, null = True, blank = True)
    course_start_date = models.DateField(null = True, blank = True)
    course_end_date = models.DateField(null = True, blank = True)

class CourseEntry(models.Model):
    ENTRY_STATUS = [
        ('PENDING', 'Pending'),
        ('PARTIAL', 'Partial'),
        ('COMPLETED', 'Completed'),
        ('LOCKED', 'Locked'),
        ('VERIFIED', 'Verified'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    centre = models.ForeignKey(Centre, on_delete = models.CASCADE)
    course = models.ForeignKey(CourseDetail, on_delete = models.CASCADE)
    month_year = models.DateField(null = True, blank = True)
    entry_status = models.CharField(max_length = 40, choices = ENTRY_STATUS, null = True, blank = True)

    total_enrolled = models.IntegerField(default = 0, validators = [MinValueValidator(0)], null = True, blank = True)
    total_trained = models.IntegerField(default = 0, validators = [MinValueValidator(0)], null = True, blank = True)
    total_certified = models.IntegerField(default = 0, validators = [MinValueValidator(0)], null = True, blank = True)
    total_placed = models.IntegerField(default = 0, validators = [MinValueValidator(0)], null = True, blank = True)
    
    male_enrolled = models.IntegerField(default = 0, validators = [MinValueValidator(0)], null = True, blank = True)
    male_trained = models.IntegerField(default = 0, validators = [MinValueValidator(0)], null = True, blank = True)
    male_certified = models.IntegerField(default = 0, validators = [MinValueValidator(0)], null = True, blank = True)
    male_placed = models.IntegerField(default = 0, validators = [MinValueValidator(0)], null = True, blank = True)
    
    female_enrolled = models.IntegerField(default = 0, validators = [MinValueValidator(0)], null = True, blank = True)
    female_trained = models.IntegerField(default = 0, validators = [MinValueValidator(0)], null = True, blank = True)
    female_certified = models.IntegerField(default = 0, validators = [MinValueValidator(0)], null = True, blank = True)
    female_placed = models.IntegerField(default = 0, validators = [MinValueValidator(0)], null = True, blank = True)

    gen_enrolled = models.IntegerField(default = 0, validators = [MinValueValidator(0)], null = True, blank = True)
    gen_trained = models.IntegerField(default = 0, validators = [MinValueValidator(0)], null = True, blank = True)
    gen_certified = models.IntegerField(default = 0, validators = [MinValueValidator(0)], null = True, blank = True)
    gen_placed = models.IntegerField(default = 0, validators = [MinValueValidator(0)], null = True, blank = True)
    
    sc_enrolled = models.IntegerField(default = 0, validators = [MinValueValidator(0)], null = True, blank = True)
    sc_trained = models.IntegerField(default = 0, validators = [MinValueValidator(0)], null = True, blank = True)
    sc_certified = models.IntegerField(default = 0, validators = [MinValueValidator(0)], null = True, blank = True)
    sc_placed = models.IntegerField(default = 0, validators = [MinValueValidator(0)], null = True, blank = True)
    
    st_enrolled = models.IntegerField(default = 0, validators = [MinValueValidator(0)], null = True, blank = True)
    st_trained = models.IntegerField(default = 0, validators = [MinValueValidator(0)], null = True, blank = True)
    st_certified = models.IntegerField(default = 0, validators = [MinValueValidator(0)], null = True, blank = True)
    st_placed = models.IntegerField(default = 0, validators = [MinValueValidator(0)], null = True, blank = True)
    
    obc_enrolled = models.IntegerField(default = 0, validators = [MinValueValidator(0)], null = True, blank = True)
    obc_trained = models.IntegerField(default = 0, validators = [MinValueValidator(0)], null = True, blank = True)
    obc_certified = models.IntegerField(default = 0, validators = [MinValueValidator(0)], null = True, blank = True)
    obc_placed = models.IntegerField(default = 0, validators = [MinValueValidator(0)], null = True, blank = True)

    pwd_enrolled = models.IntegerField(default = 0, validators = [MinValueValidator(0)], null = True, blank = True)
    pwd_trained = models.IntegerField(default = 0, validators = [MinValueValidator(0)], null = True, blank = True)
    pwd_certified = models.IntegerField(default = 0, validators = [MinValueValidator(0)], null = True, blank = True)
    pwd_placed = models.IntegerField(default = 0, validators = [MinValueValidator(0)], null = True, blank = True)

    remarks = models.TextField(null = True, blank = True)
    created_at = models.DateTimeField(auto_now_add = True, null = True, blank = True)
    updated_at = models.DateTimeField(auto_now = True, null = True, blank = True)
    verified_at = models.DateTimeField(null = True, blank = True)

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_monthly_data')
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='updated_monthly_data')
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_records')

    class Meta:
        unique_together = ['centre', 'course', 'month_year']
        verbose_name = "Course Monthly Data"
        verbose_name_plural = "Course Monthly Data"
        ordering = ['-month_year', 'centre', 'course']
        indexes = [
            models.Index(fields=['month_year']),
            models.Index(fields=['centre', 'month_year']),
            models.Index(fields=['course', 'month_year']),
            models.Index(fields=['centre', 'course', 'month_year']),
        ]

    def __str__(self):
        return f"{self.centre.centre_name} - {self.course.course_category.course_category_name} - {self.course.course_name} - {self.month_year.strftime('%Y-%m')}"
    
    # def clean(self):
    #     """Comprehensive validation for all demographic counts"""
    
    # # 1. GENDER VALIDATIONS
    #     if self.male_enrolled + self.female_enrolled > self.total_enrolled:
    #         raise ValidationError({
    #             'enrolled_total': f'Male ({self.male_enrolled}) + Female ({self.female_enrolled}) = {self.male_enrolled + self.female_enrolled} exceeds total enrolled ({self.total_enrolled})'
    #         })
        
    #     if self.male_trained + self.female_trained > self.total_trained:
    #         raise ValidationError({
    #             'trained_total': f'Male + Female exceeds total trained'
    #         })
    
    #     if self.male_certified + self.female_certified > self.total_certified:
    #         raise ValidationError({
    #             'certified_total': f'Male + Female exceeds total certified'
    #         })
    
    #     if self.male_placed + self.female_placed > self.total_placed:
    #         raise ValidationError({
    #             'placed_total': f'Male + Female exceeds total placed'
    #         })
        


    











