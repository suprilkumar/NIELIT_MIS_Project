from django.contrib import admin

# Register your models here.
from .models import *

admin.site.register(Centre)
admin.site.register(CourseCategory)
admin.site.register(CourseDetail)