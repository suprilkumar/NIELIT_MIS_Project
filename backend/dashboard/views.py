from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, parser_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import FormParser, MultiPartParser
from account.permissions import IsAdmin, IsOperatorOrAdmin
from django.shortcuts import get_object_or_404
from .models import *
from .serializers import *
from django.db.models import Q, Count, Sum, Avg, Max, Min
from datetime import datetime
import calendar
import logging
from django.utils import timezone
from dateutil.relativedelta import relativedelta
from django.db.models.functions import TruncMonth
            

#_____________________CENTRE CRUD__________________________________________

@api_view(['POST'])
@parser_classes([FormParser, MultiPartParser])
def add_centre(request):
    serialized_data = CentreSerializer(data = request.data)

    if serialized_data.is_valid():
        serialized_data.save()
        return Response({
            "message" : "Centre Info has been added successfully",
            "data": serialized_data.data
        }, status=status.HTTP_201_CREATED)
    return Response({
        "message": "Something went wrong",
        "details": serialized_data.errors
    }, status= status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def list_centres(request):
    centres = Centre.objects.all()
    serialized_data = CentreSerializer(centres, many = True)
    return Response(serialized_data.data)


@api_view(['GET', 'PUT', 'DELETE'])
def edit_delete_centre(request, id):
    try:
        centre = Centre.objects.get(id=id)
    except Centre.DoesNotExist:
        return Response({"error": "Centre detail not found"}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == "GET":
        serializer = CentreSerializer(centre)
        return Response(serializer.data)
    
    elif request.method == "PUT":
        # For FormData, use request.data directly (Django REST framework handles multipart forms)
        serializer = CentreSerializer(centre, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Centre detail updated successfully","data": serializer.data}, status=status.HTTP_200_OK)
        else:
            print("Serializer errors:", serializer.errors)  # Debug print
            return Response({"error": "Invalid data", "details": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == "DELETE":
        centre_name = centre.centre_name
        centre.delete()
        return Response({"message": f"Category '{centre_name}' deleted successfully"}, status=status.HTTP_200_OK)


#_____________________ COURSE CATEGORY CRUD__________________________________________
    
@api_view(['POST'])
@parser_classes([FormParser, MultiPartParser])
def add_course_category(request):
    serialized_data = CourseCategorySerializer(data = request.data)

    if serialized_data.is_valid():
        serialized_data.save()
        return Response({"message" : "Course category has been added successfully"}, status=status.HTTP_201_CREATED)
    return Response({"message": "Something went wrong"}, status= status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def list_course_categories(request):
    course_categories = CourseCategory.objects.all()
    serialized_data = CourseCategorySerializer(course_categories, many = True)
    return Response(serialized_data.data)

@api_view(['GET', 'PUT', 'DELETE'])
def edit_delete_course_categories(request, id):
    try:
        course_categories = CourseCategory.objects.get(id=id)
    except CourseCategory.DoesNotExist:
        return Response({"error": "Course category detail not found"}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == "GET":
        serializer = CourseCategorySerializer(course_categories)
        return Response(serializer.data)
    
    elif request.method == "PUT":
        # For FormData, use request.data directly (Django REST framework handles multipart forms)
        serializer = CourseCategorySerializer(course_categories, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Course category detail updated successfully","data": serializer.data}, status=status.HTTP_200_OK)
        else:
            print("Serializer errors:", serializer.errors)  # Debug print
            return Response({"error": "Invalid data", "details": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == "DELETE":
        course_category_name = course_categories.course_category_name
        course_categories.delete()
        return Response({"message": f"Category '{course_category_name}' deleted successfully"}, status=status.HTTP_200_OK)

#_____________________ COURSE DETAIL CRUD __________________________________________

   
@api_view(['POST'])
@parser_classes([FormParser, MultiPartParser])
def add_course(request):
    serialized_data = CourseDetailSerializer(data = request.data)

    if serialized_data.is_valid():
        serialized_data.save()
        return Response({"message" : "Course has been added successfully"}, status=status.HTTP_201_CREATED)
    return Response({"message": "Something went wrong"}, status= status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def list_courses(request):
    courses = CourseDetail.objects.all()
    serialized_data = CourseDetailSerializer(courses, many = True)
    return Response(serialized_data.data)

@api_view(['GET', 'PUT', 'DELETE'])
def edit_delete_course(request, id):
    try:
        courses = CourseDetail.objects.get(id=id)
    except CourseDetail.DoesNotExist:
        return Response({"error": "Course detail not found"}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == "GET":
        serializer = CourseDetailSerializer(courses)
        return Response(serializer.data)
    
    elif request.method == "PUT":
        # For FormData, use request.data directly (Django REST framework handles multipart forms)
        serializer = CourseDetailSerializer(courses, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Course detail updated successfully","data": serializer.data}, status=status.HTTP_200_OK)
        else:
            print("Serializer errors:", serializer.errors)  # Debug print
            return Response({"error": "Invalid data", "details": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == "DELETE":
        course_name = courses.course_name
        courses.delete()
        return Response({"message": f"Category '{course_name}' deleted successfully"}, status=status.HTTP_200_OK)
    

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def centre_detail(request, id):
    try:
        # Get the centre details
        try:
            centre = Centre.objects.get(id=id)
        except Centre.DoesNotExist:
            return Response({"error": "Centre not found"},  status=status.HTTP_404_NOT_FOUND)
        
        # Serialize centre details
        centre_serializer = CentreSerializer(centre)
        
        # Get all courses for this centre
        courses = CourseDetail.objects.filter(course_centre=centre).select_related('course_category').order_by('course_name')
        
        # Prepare courses data with additional stats
        courses_data = []
        for course in courses:
            # Get entry statistics for this course
            entries = CourseEntry.objects.filter(course=course)
            
            # Get total entries and latest entry
            total_entries = entries.count()
            latest_entry = entries.order_by('-month_year').first()
            
            # Get summary statistics
            entry_summary = entries.aggregate(
                total_enrolled=Sum('total_enrolled'),
                total_trained=Sum('total_trained'),
                total_certified=Sum('total_certified'),
                total_placed=Sum('total_placed')
            )
       
            twelve_months_ago = timezone.now().date() - relativedelta(months=12)
            recent_entries = entries.filter(month_year__gte=twelve_months_ago).order_by('-month_year')[:12]
            
            monthly_data = []
            for entry in recent_entries:
                monthly_data.append({
                    'month': entry.month_year.strftime('%Y-%m'),
                    'month_display': entry.month_year.strftime('%B %Y'),
                    'total_enrolled': entry.total_enrolled,
                    'total_trained': entry.total_trained,
                    'total_certified': entry.total_certified,
                    'total_placed': entry.total_placed,
                    'entry_status': entry.entry_status,
                    'entry_id': entry.id
                })
            
            # Get status breakdown
            status_counts = entries.values('entry_status').annotate(count=Count('id')).order_by('entry_status')
            
            courses_data.append({
                'id': course.id,
                'course_name': course.course_name,
                'course_category': {
                    'id': course.course_category.id,
                    'name': course.course_category.course_category_name
                },
                'course_mode': course.course_mode,
                'course_duration': course.course_duration,
                'course_status': course.course_status,
                'course_desc': course.course_desc,
                'course_start_date': course.course_start_date,
                'course_end_date': course.course_end_date,
                'created_at': course.course_created_at,
                'updated_at': course.course_updated_at,
                'statistics': {
                    'total_entries': total_entries,
                    'total_enrolled': entry_summary['total_enrolled'] or 0,
                    'total_trained': entry_summary['total_trained'] or 0,
                    'total_certified': entry_summary['total_certified'] or 0,
                    'total_placed': entry_summary['total_placed'] or 0,
                    'latest_entry_month': latest_entry.month_year.strftime('%B %Y') if latest_entry else None,
                    'latest_entry_status': latest_entry.entry_status if latest_entry else None,
                },
                'status_breakdown': list(status_counts),
                'recent_monthly_data': monthly_data
            })
        
        # Get overall centre statistics
        all_entries = CourseEntry.objects.filter(centre=centre)
        
        overall_stats = all_entries.aggregate(
            total_courses=Count('course', distinct=True),
            total_entries=Count('id'),
            total_enrolled=Sum('total_enrolled'),
            total_trained=Sum('total_trained'),
            total_certified=Sum('total_certified'),
            total_placed=Sum('total_placed')
        )
        
        # Get monthly trend for the centre
        monthly_trend = all_entries.annotate(
            month=TruncMonth('month_year')
        ).values('month').annotate(
            entries_count=Count('id'),
            enrolled=Sum('total_enrolled'),
            trained=Sum('total_trained'),
            certified=Sum('total_certified'),
            placed=Sum('total_placed')
        ).order_by('-month')[:12]
        
        trend_data = []
        for item in monthly_trend:
            if item['month']:
                trend_data.append({
                    'month': item['month'].strftime('%Y-%m'),
                    'month_display': item['month'].strftime('%B %Y'),
                    'entries_count': item['entries_count'],
                    'enrolled': item['enrolled'] or 0,
                    'trained': item['trained'] or 0,
                    'certified': item['certified'] or 0,
                    'placed': item['placed'] or 0
                })
        
        # Get course category distribution
        category_distribution = CourseDetail.objects.filter(
            course_centre=centre).values(
            'course_category__id',
            'course_category__course_category_name'
        ).annotate(course_count=Count('id')).order_by('-course_count')
        
        category_data = []
        for cat in category_distribution:
            category_data.append({
                'category_id': cat['course_category__id'],
                'category_name': cat['course_category__course_category_name'],
                'course_count': cat['course_count']
            })
        
        # Get entries by status for the centre
        entries_by_status = all_entries.values('entry_status').annotate(
            count=Count('id'), enrolled=Sum('total_enrolled'), certified=Sum('total_certified')).order_by('entry_status')
        
        status_data = []
        for status_item in entries_by_status:
            status_data.append({
                'status': status_item['entry_status'],
                'status_display': dict(CourseEntry.ENTRY_STATUS).get(status_item['entry_status'], status_item['entry_status']),
                'count': status_item['count'],
                'total_enrolled': status_item['enrolled'] or 0,
                'total_certified': status_item['certified'] or 0
            })
        
        # Prepare response
        response_data = {
            'centre': centre_serializer.data,
            'overall_statistics': {
                'total_courses': overall_stats['total_courses'] or 0,
                'total_entries': overall_stats['total_entries'] or 0,
                'total_enrolled': overall_stats['total_enrolled'] or 0,
                'total_trained': overall_stats['total_trained'] or 0,
                'total_certified': overall_stats['total_certified'] or 0,
                'total_placed': overall_stats['total_placed'] or 0,
            },
            'courses': courses_data,
            'total_courses': len(courses_data),
            'active_courses': courses.filter(course_status='ACTIVE').count(),
            'course_categories': category_data,
            'monthly_trend': trend_data,
            'entries_by_status': status_data,
            'summary': {
                'total_courses': len(courses_data),
                'total_courses_with_entries': all_entries.values('course').distinct().count(),
                'date_range': {
                    'first_entry': all_entries.aggregate(first=Min('month_year'))['first'],
                    'last_entry': all_entries.aggregate(last=Max('month_year'))['last']
                }
            }
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error fetching centre details: {str(e)}")
        return Response(
            {"error": "Failed to retrieve centre details"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def centre_courses_list(request, id):
    """
    Get only the list of courses for a centre (lighter endpoint)
    URL: /centre-courses/<str:id>/
    """
    try:
        try:
            centre = Centre.objects.get(id=id)
        except Centre.DoesNotExist:
            return Response({"error": "Centre not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Get all courses for this centre
        courses = CourseDetail.objects.filter(course_centre=centre).select_related('course_category').order_by('course_name')
        
        # Simple course list without detailed statistics
        courses_list = []
        for course in courses:
            courses_list.append({
                'id': course.id,
                'course_name': course.course_name,
                'course_category': course.course_category.course_category_name,
                'course_mode': course.course_mode,
                'course_status': course.course_status,
                'course_duration': course.course_duration,
            })
        
        return Response({
            'centre_id': id,
            'centre_name': centre.centre_name,
            'total_courses': len(courses_list),
            'courses': courses_list
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error fetching centre courses: {str(e)}")
        return Response(
            {"error": "Failed to retrieve centre courses"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def centre_course_detail(request, centre_id, course_id):
    """
    Get detailed information for a specific course within a centre
    URL: /centre/<str:centre_id>/course/<str:course_id>/
    """
    try:
        # Check if centre exists
        try:
            centre = Centre.objects.get(id=centre_id)
        except Centre.DoesNotExist:
            return Response({"error": "Centre not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if course exists and belongs to the centre
        try:
            course = CourseDetail.objects.get(id=course_id, course_centre=centre)
        except CourseDetail.DoesNotExist:
            return Response({"error": "Course not found in this centre"}, status=status.HTTP_404_NOT_FOUND)
        
        # Get all entries for this course
        entries = CourseEntry.objects.filter(course=course).order_by('-month_year')
        
        # Serialize course details
        course_serializer = CourseDetailSerializer(course)
        
        # Get entries grouped by year
        years_data = {}
        for entry in entries:
            if entry.month_year:
                year = entry.month_year.year
                if year not in years_data:
                    years_data[year] = {
                        'year': year,
                        'months': [],
                        'total_entries': 0
                    }
                
                years_data[year]['months'].append({
                    'month': entry.month_year.month,
                    'month_name': entry.month_year.strftime('%B'),
                    'entry_id': entry.id,
                    'total_enrolled': entry.total_enrolled,
                    'total_trained': entry.total_trained,
                    'total_certified': entry.total_certified,
                    'total_placed': entry.total_placed,
                    'entry_status': entry.entry_status
                })
                years_data[year]['total_entries'] += 1
        
        # Sort months within each year
        for year in years_data:
            years_data[year]['months'].sort(key=lambda x: x['month'])
        
        # Get summary statistics
        summary = entries.aggregate(
            total_enrolled=Sum('total_enrolled'),
            total_trained=Sum('total_trained'),
            total_certified=Sum('total_certified'),
            total_placed=Sum('total_placed')
        )
        
        response_data = {
            'centre': {
                'id': centre.id,
                'name': centre.centre_name,
                'code': centre.centre_code
            },
            'course': course_serializer.data,
            'statistics': {
                'total_entries': entries.count(),
                'total_enrolled': summary['total_enrolled'] or 0,
                'total_trained': summary['total_trained'] or 0,
                'total_certified': summary['total_certified'] or 0,
                'total_placed': summary['total_placed'] or 0,
            },
            'entries_by_year': years_data,
            'latest_entry': entries.first().month_year.strftime('%B %Y') if entries.exists() else None
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error fetching centre course detail: {str(e)}")
        return Response({"error": "Failed to retrieve course details"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#___________________________ Courses Data by Status ________________________________

@api_view(['GET'])
def active_courses(request):
    courses = CourseDetail.objects.filter(course_status = "ACTIVE")
    serialized_data = CourseDetailSerializer(courses, many = True)
    return Response(serialized_data.data)

@api_view(['GET'])
def inactive_courses(request):
    courses = CourseDetail.objects.filter(course_status = "INACTIVE")
    serialized_data = CourseDetailSerializer(courses, many = True)
    return Response(serialized_data.data)

@api_view(['GET'])
def completed_courses(request):
    courses = CourseDetail.objects.filter(course_status = "COMPLETED")
    serialized_data = CourseDetailSerializer(courses, many = True)
    return Response(serialized_data.data)

@api_view(['GET'])
def upcoming_courses(request):
    courses = CourseDetail.objects.filter(course_status = "UPCOMING")
    serialized_data = CourseDetailSerializer(courses, many = True)
    return Response(serialized_data.data)

@api_view(['GET'])
def cancelled_courses(request):
    courses = CourseDetail.objects.filter(course_status = "CANCELLED")
    serialized_data = CourseDetailSerializer(courses, many = True)
    return Response(serialized_data.data)

@api_view(['GET'])
def hold_courses(request):
    courses = CourseDetail.objects.filter(course_status = "HOLD")
    serialized_data = CourseDetailSerializer(courses, many = True)
    return Response(serialized_data.data)

#_____________________________ Course Detail with Entries ___________________________________


logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def course_detail(request, id):
    """
    Get course details and its entries grouped by year and month
    URL: /course-detail/<str:id>/
    """
    try:
        # Get the course details
        try:
            course = CourseDetail.objects.get(id=id)
        except CourseDetail.DoesNotExist:
            return Response(
                {"error": "Course not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Serialize course details
        from dashboard.serializers import CourseDetailSerializer
        course_serializer = CourseDetailSerializer(course)
        
        # Get all entries for this course, ordered by month_year descending
        entries = CourseEntry.objects.filter(course=course).select_related('centre', 'created_by', 'updated_by', 'verified_by').order_by('-month_year')
        
        # Group entries by year
        years_data = {}
        current_year = datetime.now().year
        
        # Get all available years from entries
        available_years = set()
        for entry in entries:
            if entry.month_year:
                year = entry.month_year.year
                available_years.add(year)
        
        # If no entries, still show current year with empty months
        if not available_years:
            available_years = {current_year}
        
        # For each year, create a structure with all months
        for year in sorted(available_years, reverse=True):
            year_entries = entries.filter(month_year__year=year)
            
            # Initialize months array (Jan to Dec)
            months_data = []
            
            for month in range(1, 13):
                month_entry = year_entries.filter(month_year__month=month).first()
                
                if month_entry:
                    # Use CourseEntryDetailSerializer for detailed entry info
                    from course_entry.serializers import CourseEntryDetailSerializer
                    entry_serializer = CourseEntryDetailSerializer(month_entry)
                    month_data = {
                        'month': month,
                        'month_name': calendar.month_name[month],
                        'has_entry': True,
                        'entry': entry_serializer.data
                    }
                else:
                    month_data = {
                        'month': month,
                        'month_name': calendar.month_name[month],
                        'has_entry': False,
                        'entry': None
                    }
                
                months_data.append(month_data)
            
            years_data[year] = {
                'year': year,
                'months': months_data,
                'total_entries': year_entries.count()
            }
        
        # Get summary statistics for this course
        summary = {
            'total_entries': entries.count(),
            'total_enrolled': entries.aggregate(total=models.Sum('total_enrolled'))['total'] or 0,
            'total_trained': entries.aggregate(total=models.Sum('total_trained'))['total'] or 0,
            'total_certified': entries.aggregate(total=models.Sum('total_certified'))['total'] or 0,
            'total_placed': entries.aggregate(total=models.Sum('total_placed'))['total'] or 0,
            'years_available': sorted(list(available_years), reverse=True)
        }
        
        # Get the latest entry for status
        latest_entry = entries.first()
        
        response_data = {
            'course': course_serializer.data,
            'summary': summary,
            'years': years_data,
            'latest_entry_status': latest_entry.entry_status if latest_entry else None,
            'current_year': current_year
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error fetching course details: {str(e)}")
        return Response({"error": "Failed to retrieve course details"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def course_month_entry(request, course_id, year, month):
    """
    Get specific month entry for a course
    URL: /course-entry/<str:course_id>/<int:year>/<int:month>/
    """
    try:
        # Validate month and year
        if month < 1 or month > 12:
            return Response(
                {"error": "Invalid month. Month must be between 1 and 12"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create date for the first day of the month
        try:
            month_date = datetime(year, month, 1).date()
        except ValueError:
            return Response(
                {"error": "Invalid date"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the course entry for this specific month
        try:
            entry = CourseEntry.objects.filter(
                course_id=course_id,
                month_year__year=year,
                month_year__month=month
            ).select_related(
                'centre', 'course', 'created_by', 'updated_by', 'verified_by'
            ).first()
            
            if not entry:
                # Check if course exists
                course_exists = CourseDetail.objects.filter(id=course_id).exists()
                if not course_exists:
                    return Response(
                        {"error": "Course not found"}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                return Response({
                    'exists': False,
                    'message': f'No entry found for {calendar.month_name[month]} {year}',
                    'month': month,
                    'month_name': calendar.month_name[month],
                    'year': year
                }, status=status.HTTP_200_OK)
            
            # Use CourseEntryDetailSerializer for detailed entry info
            from course_entry.serializers import CourseEntryDetailSerializer
            serializer = CourseEntryDetailSerializer(entry)
            
            return Response({
                'exists': True,
                'entry': serializer.data,
                'month': month,
                'month_name': calendar.month_name[month],
                'year': year
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error fetching month entry: {str(e)}")
            return Response({"error": "Failed to retrieve month entry"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        logger.error(f"Error in course_month_entry: {str(e)}")
        return Response({"error": "Failed to process request"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def course_entries_summary(request, id):
    """
    Get summary of all entries for a course
    URL: /course-entries-summary/<str:id>/
    """
    try:
        # Check if course exists
        if not CourseDetail.objects.filter(id=id).exists():
            return Response({"error": "Course not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Get all entries for this course
        entries = CourseEntry.objects.filter(course_id=id)
        
        # Get entries by status
        status_counts = entries.values('entry_status').annotate(count=models.Count('id')).order_by('entry_status')
        
        # Get yearly summary
        yearly_summary = entries.values(
            year=models.functions.ExtractYear('month_year')
        ).annotate(
            entries_count=models.Count('id'),
            total_enrolled=models.Sum('total_enrolled'),
            total_trained=models.Sum('total_trained'),
            total_certified=models.Sum('total_certified'),
            total_placed=models.Sum('total_placed')
        ).order_by('-year')
        
        # Get overall totals
        overall_totals = {
            'total_entries': entries.count(),
            'total_enrolled': entries.aggregate(total=models.Sum('total_enrolled'))['total'] or 0,
            'total_trained': entries.aggregate(total=models.Sum('total_trained'))['total'] or 0,
            'total_certified': entries.aggregate(total=models.Sum('total_certified'))['total'] or 0,
            'total_placed': entries.aggregate(total=models.Sum('total_placed'))['total'] or 0,
        }
        
        # Get first and last entry dates
        date_range = entries.aggregate(
            first_entry=models.Min('month_year'),
            last_entry=models.Max('month_year')
        )
        
        response_data = {
            'course_id': id,
            'overall_totals': overall_totals,
            'status_breakdown': list(status_counts),
            'yearly_summary': list(yearly_summary),
            'date_range': {
                'first_entry': date_range['first_entry'],
                'last_entry': date_range['last_entry'],
                'years_covered': date_range['last_entry'].year - date_range['first_entry'].year + 1 
                if date_range['first_entry'] and date_range['last_entry'] else 0
            }
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error fetching course entries summary: {str(e)}")
        return Response({"error": "Failed to retrieve course entries summary"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




#______________________ DUMMY DATA - ADMIN Dashboard ______________________________
    
class AdminDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    
    def get(self, request):
        data = {
            'message': 'Welcome to Admin Dashboard',
            'stats': {
                'total_users': 150,
                'active_users': 120,
                'revenue': '$15,000',
            }
        }
        return Response(data)

class OperatorDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsOperatorOrAdmin]
    
    def get(self, request):
        data = {
            'message': 'Welcome to Operator Dashboard',
            'tasks': [
                {'id': 1, 'title': 'Process orders', 'status': 'pending'},
                {'id': 2, 'title': 'Handle support tickets', 'status': 'in_progress'},
            ]
        }
        return Response(data)

class UserDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        data = {
            'message': 'Welcome to User Dashboard',
            'user_data': {
                'name': request.user.full_name,
                'email': request.user.email,
                'contact': request.user.contact,
                'role': request.user.role,
            }
        }
        return Response(data)
    

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Count, Q, Avg
from django.db.models.functions import ExtractYear, ExtractMonth
from datetime import datetime, timedelta
from .models import Centre, CourseDetail, CourseEntry
from .serializers import (
    CentreDashboardSerializer, CourseEnrollmentStatsSerializer,
    MonthlyTrendSerializer, CategoryBreakdownSerializer,
    GenderBreakdownSerializer, DashboardOverviewSerializer
)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_overview(request):
    """Get overall dashboard statistics"""
    try:
        # Get filter parameters
        year = request.GET.get('year')
        centre_id = request.GET.get('centre_id')
        
        # Base queryset for entries
        entries = CourseEntry.objects.all()
        
        if year:
            entries = entries.filter(month_year__year=year)
        if centre_id:
            entries = entries.filter(centre_id=centre_id)
        
        # Calculate totals
        total_enrolled = entries.aggregate(total=Sum('total_enrolled'))['total'] or 0
        total_certified = entries.aggregate(total=Sum('total_certified'))['total'] or 0
        total_placed = entries.aggregate(total=Sum('total_placed'))['total'] or 0
        
        # Get centres data
        centres = Centre.objects.all()
        if centre_id:
            centres = centres.filter(id=centre_id)
        
        centres_data = CentreDashboardSerializer(centres, many=True).data
        
        response_data = {
            'total_centres': centres.count(),
            'total_courses': CourseDetail.objects.count(),
            'total_enrolled': total_enrolled,
            'total_certified': total_certified,
            'total_placed': total_placed,
            'overall_completion_rate': round((total_certified / total_enrolled * 100) if total_enrolled > 0 else 0, 2),
            'overall_placement_rate': round((total_placed / total_certified * 100) if total_certified > 0 else 0, 2),
            'centres_data': centres_data
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def course_enrollment_stats(request):
    """Get enrollment statistics per course"""
    try:
        centre_id = request.GET.get('centre_id')
        year = request.GET.get('year')
        
        # Base queryset
        courses = CourseDetail.objects.all()
        
        if centre_id:
            courses = courses.filter(course_centre_id=centre_id)
        
        stats = []
        for course in courses:
            entries = CourseEntry.objects.filter(course=course)
            
            if year:
                entries = entries.filter(month_year__year=year)
            
            total_enrolled = entries.aggregate(total=Sum('total_enrolled'))['total'] or 0
            total_certified = entries.aggregate(total=Sum('total_certified'))['total'] or 0
            total_placed = entries.aggregate(total=Sum('total_placed'))['total'] or 0
            
            stats.append({
                'course_id': str(course.id),
                'course_name': course.course_name,
                'total_enrolled': total_enrolled,
                'total_certified': total_certified,
                'total_placed': total_placed,
                'completion_rate': round((total_certified / total_enrolled * 100) if total_enrolled > 0 else 0, 2),
                'placement_rate': round((total_placed / total_certified * 100) if total_certified > 0 else 0, 2)
            })
        
        # Sort by total enrolled
        stats.sort(key=lambda x: x['total_enrolled'], reverse=True)
        
        return Response(stats, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def monthly_trends(request):
    """Get monthly trends for enrollment, certification, placement"""
    try:
        centre_id = request.GET.get('centre_id')
        year = request.GET.get('year')
        months_back = int(request.GET.get('months_back', 12))
        
        # Calculate date range
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=months_back * 30)
        
        entries = CourseEntry.objects.filter(
            month_year__gte=start_date,
            month_year__lte=end_date
        )
        
        if centre_id:
            entries = entries.filter(centre_id=centre_id)
        if year:
            entries = entries.filter(month_year__year=year)
        
        # Group by month
        monthly_data = {}
        
        for entry in entries:
            month_key = entry.month_year.strftime('%Y-%m')
            
            if month_key not in monthly_data:
                monthly_data[month_key] = {
                    'month': entry.month_year,
                    'enrolled': 0,
                    'certified': 0,
                    'placed': 0
                }
            
            monthly_data[month_key]['enrolled'] += entry.total_enrolled
            monthly_data[month_key]['certified'] += entry.total_certified
            monthly_data[month_key]['placed'] += entry.total_placed
        
        # Convert to list and sort by month
        result = sorted(monthly_data.values(), key=lambda x: x['month'])
        
        return Response(result, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def category_breakdown(request):
    """Get enrollment breakdown by category (GEN, SC, ST, OBC)"""
    try:
        centre_id = request.GET.get('centre_id')
        year = request.GET.get('year')
        
        entries = CourseEntry.objects.all()
        
        if centre_id:
            entries = entries.filter(centre_id=centre_id)
        if year:
            entries = entries.filter(month_year__year=year)
        
        # Aggregate by category
        categories = ['gen', 'sc', 'st', 'obc']
        result = []
        
        for cat in categories:
            enrolled = entries.aggregate(total=Sum(f'{cat}_enrolled'))['total'] or 0
            certified = entries.aggregate(total=Sum(f'{cat}_certified'))['total'] or 0
            placed = entries.aggregate(total=Sum(f'{cat}_placed'))['total'] or 0
            
            result.append({
                'category': cat.upper(),
                'enrolled': enrolled,
                'certified': certified,
                'placed': placed
            })
        
        return Response(result, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def gender_breakdown(request):
    """Get enrollment breakdown by gender"""
    try:
        centre_id = request.GET.get('centre_id')
        year = request.GET.get('year')
        
        entries = CourseEntry.objects.all()
        
        if centre_id:
            entries = entries.filter(centre_id=centre_id)
        if year:
            entries = entries.filter(month_year__year=year)
        
        genders = ['male', 'female']
        result = []
        
        for gender in genders:
            enrolled = entries.aggregate(total=Sum(f'{gender}_enrolled'))['total'] or 0
            certified = entries.aggregate(total=Sum(f'{gender}_certified'))['total'] or 0
            placed = entries.aggregate(total=Sum(f'{gender}_placed'))['total'] or 0
            
            result.append({
                'gender': gender.capitalize(),
                'enrolled': enrolled,
                'certified': certified,
                'placed': placed
            })
        
        return Response(result, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def centre_performance(request, centre_id):
    """Get detailed performance metrics for a specific centre"""
    try:
        centre = Centre.objects.get(id=centre_id)
        year = request.GET.get('year')
        
        entries = CourseEntry.objects.filter(centre=centre)
        
        if year:
            entries = entries.filter(month_year__year=year)
        
        # Course-wise breakdown
        courses_data = []
        courses = CourseDetail.objects.filter(course_centre=centre)
        
        for course in courses:
            course_entries = entries.filter(course=course)
            enrolled = course_entries.aggregate(total=Sum('total_enrolled'))['total'] or 0
            certified = course_entries.aggregate(total=Sum('total_certified'))['total'] or 0
            placed = course_entries.aggregate(total=Sum('total_placed'))['total'] or 0
            
            courses_data.append({
                'course_name': course.course_name,
                'enrolled': enrolled,
                'certified': certified,
                'placed': placed,
                'completion_rate': round((certified / enrolled * 100) if enrolled > 0 else 0, 2)
            })
        
        # Overall stats
        total_enrolled = entries.aggregate(total=Sum('total_enrolled'))['total'] or 0
        total_certified = entries.aggregate(total=Sum('total_certified'))['total'] or 0
        total_placed = entries.aggregate(total=Sum('total_placed'))['total'] or 0
        
        response_data = {
            'centre': {
                'id': str(centre.id),
                'name': centre.centre_name,
                'code': centre.centre_code,
                'address': centre.centre_address
            },
            'summary': {
                'total_enrolled': total_enrolled,
                'total_certified': total_certified,
                'total_placed': total_placed,
                'completion_rate': round((total_certified / total_enrolled * 100) if total_enrolled > 0 else 0, 2),
                'placement_rate': round((total_placed / total_certified * 100) if total_certified > 0 else 0, 2),
                'total_courses': courses.count()
            },
            'courses_breakdown': courses_data
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
    
    except Centre.DoesNotExist:
        return Response({'error': 'Centre not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def year_filter_options(request):
    """Get available years for filtering"""
    try:
        years = CourseEntry.objects.dates('month_year', 'year').values_list('month_year__year', flat=True).distinct()
        years = sorted(list(set(years)), reverse=True)
        
        return Response({'years': years}, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)