from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, parser_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from django.db.models import Q, Sum, Count
from django.utils import timezone
from datetime import date, datetime, timedelta
from dashboard.models import CourseEntry, Centre, CourseDetail
from dashboard.serializers import CourseDetailSerializer, CentreSerializer
from .serializers import *
import logging


# PERMISSION CLASSES
# ============================================

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'ADMIN'

class IsAuthenticatedUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

# USER/OPERATOR 
# ============================================

class CourseEntryViewSet(viewsets.ModelViewSet):

    queryset = CourseEntry.objects.select_related(
        'centre', 'course', 'course__course_category',
        'created_by', 'updated_by', 'verified_by'
    ).all()
    permission_classes = [IsAuthenticatedUser]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CourseEntryCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return CourseEntryUpdateSerializer
        elif self.action == 'list':
            return CourseEntryListSerializer
        elif self.action == 'retrieve':
            return CourseEntryDetailSerializer
        elif self.action == 'current_month_status':
            return CurrentMonthStatusSerializer
        return CourseEntryDetailSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        centre_id = self.request.query_params.get('centre')
        course_id = self.request.query_params.get('course')
        status = self.request.query_params.get('status')
        month = self.request.query_params.get('month')
        year = self.request.query_params.get('year')
        
        if centre_id:
            queryset = queryset.filter(centre_id=centre_id)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        if status:
            queryset = queryset.filter(entry_status=status)
        if year:
            if month:
                queryset = queryset.filter(
                    month_year__year=year,
                    month_year__month=month
                )
            else:
                queryset = queryset.filter(month_year__year=year)
        
        return queryset
    
    def perform_create(self, serializer):
        today = date.today()
        current_month = today.replace(day=1)
        
        serializer.save(created_by=self.request.user, updated_by=self.request.user, month_year=current_month)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    @action(detail=False, methods=['get'], url_path='current-month-status')
    def current_month_status(self, request):
        #Check if entry exists for current month for given centre and course
        centre_id = request.query_params.get('centre')
        course_id = request.query_params.get('course')
        
        if not centre_id or not course_id:
            return Response({'error': 'Both centre and course parameters are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        today = date.today()
        
        existing_entry = CourseEntry.objects.filter(
            centre_id=centre_id, course_id=course_id, month_year__year=today.year, month_year__month=today.month
            ).first()
        
        if existing_entry:
            return Response({
                'exists': True,
                'entry_id': existing_entry.id,
                'entry_status': existing_entry.entry_status,
                'can_create': False,
                'can_edit': existing_entry.entry_status not in ['LOCKED', 'VERIFIED'],
                'message': f'Entry exists for {today.strftime("%B %Y")}'
            })
        else:
            return Response({
                'exists': False,
                'entry_id': None,
                'entry_status': None,
                'can_create': True,
                'can_edit': False,
                'message': f'No entry exists for {today.strftime("%B %Y")}. You can create a new entry.'
            })
        
    def get(self, request, pk):
        try:
            # Get the course entry with all related data
            entry = CourseEntry.objects.select_related('centre', 'course', 'course__course_category',
                                                       'created_by', 'updated_by', 'verified_by').get(pk=pk)
            
            # Use the detail serializer
            serializer = CourseEntryDetailSerializer(entry)
            
            # Add additional data that might be useful
            response_data = {
                'success': True,
                'data': serializer.data,
                'meta': {
                    'can_edit': entry.entry_status not in ['LOCKED', 'VERIFIED'],
                    'can_delete': request.user.role == 'ADMIN',
                    'is_locked': entry.entry_status == 'LOCKED',
                    'is_verified': entry.entry_status == 'VERIFIED',
                }
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except CourseEntry.DoesNotExist:
            return Response({'success': False, 'error': 'Course entry not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'success': False,'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# DROPDOWN VIEWSETS 
# ============================================

class CentreDropdownViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Centre.objects.all()
    serializer_class = CentreSerializer
    permission_classes = [IsAuthenticatedUser]
    pagination_class = None

class CourseDropdownViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CourseDetailSerializer
    permission_classes = [IsAuthenticatedUser]
    pagination_class = None
    
    def get_queryset(self):
        queryset = CourseDetail.objects.select_related('course_category').all()
        
        # Filter by centre if provided
        centre_id = self.request.query_params.get('centre')
        if centre_id:
            queryset = queryset.filter(course_centre_id=centre_id)
        
        # Only show active courses
        queryset = queryset.filter(course_status='ACTIVE')
        
        return queryset


#______________________________ ADMIN CREATE / UPDATE / DELETE Course Entry Logic ________________________________
    
@api_view(['POST'])
@parser_classes([FormParser, MultiPartParser])
def create_custom_course_entry(request):
    serialized_data = CourseEntryListSerializer(data = request.data)

    if serialized_data.is_valid():
        serialized_data.save()
        return Response({"message" : "Course entry has been added successfully"}, status=status.HTTP_201_CREATED)
    return Response({"message": "Error from server side"}, status= status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_existing_entry(request):
    """
    Check if a course entry already exists for a given centre, course, and month/year.
    
    Query params:
        centre   - centre ID (required)
        course   - course ID (required)  
        month_year - YYYY-MM or YYYY-MM-DD format (optional, defaults to current month)
    """
    centre_id = request.query_params.get('centre')
    course_id = request.query_params.get('course')
    month_year = request.query_params.get('month_year')

    # Validate required params
    if not centre_id or not course_id:
        return Response(
            {'error': 'Both centre and course parameters are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Parse month_year
    if month_year:
        try:
            parts = month_year[:7].split('-')
            check_year = int(parts[0])
            check_month = int(parts[1])
        except (ValueError, IndexError):
            return Response(
                {'error': 'Invalid month_year format. Expected YYYY-MM or YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )
    else:
        today = date.today()
        check_year = today.year
        check_month = today.month

    # Query
    existing_entry = CourseEntry.objects.filter(
        centre_id=centre_id,
        course_id=course_id,
        month_year__year=check_year,
        month_year__month=check_month
    ).first()

    from calendar import month_name
    period_label = f"{month_name[check_month]} {check_year}"

    if existing_entry:
        return Response({
            'exists': True,
            'entry_id': existing_entry.id,
            'entry_status': existing_entry.entry_status,
            'can_create': False,
            'can_edit': existing_entry.entry_status not in ['LOCKED', 'VERIFIED'],
            'message': f'Entry already exists for {period_label}'
        })

    return Response({
        'exists': False,
        'entry_id': None,
        'entry_status': None,
        'can_create': True,
        'can_edit': False,
        'message': f'No entry found for {period_label}. You can create a new entry.'
    })

@api_view(['GET'])
def course_entry_detail(request, id):
    course_entry = get_object_or_404(CourseEntry, id = id)
    serialized_data = CourseEntryListSerializer(course_entry)
    return Response(serialized_data.data)

@api_view(['GET'])
def list_course_entries(request):
    course_entry = CourseEntry.objects.all()
    serialized_data = CourseEntryListSerializer(course_entry, many = True)
    return Response(serialized_data.data)

@api_view(['GET', 'PUT', 'DELETE'])
def edit_delete_course_entry(request, id):
    try:
        course_entry = CourseEntry.objects.get(id = id)
    except CourseEntry.DoesNotExist:
        return Response({"error": "Course Entry Not Found"}, status= status.HTTP_404_NOT_FOUND)
    
    if request.method == "GET":
        serializer = CourseEntryListSerializer(course_entry)
        return Response(serializer.data)
    
    elif request.method == "PUT":
        serializer = CourseEntryListSerializer(course_entry, data = request.data, partial = True)

        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Entry updated successfully", "data": serializer.data}, status = status.HTTP_200_OK)
        else:
            print("Backend Error / Serializers Error", serializer.errors)
            return Response({"error": "Invalid data", "details": serializer.errors}, status = status.HTTP_400_BAD_REQUEST)
    
    elif request.method == "DELETE":
        course_entry.delete()
        return Response({"message": f"Entry with course {course_entry.course} for the date {course_entry.month_year} deleted successfully"},
                        status = status.HTTP_200_OK)
    
logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_courses_with_entries_by_centre_month(request):
    """
    Get all courses that have entries for a specific centre and month/year
    Query params: centre_id, month_year (format: YYYY-MM)
    """
    try:
        centre_id = request.query_params.get('centre_id')
        month_year = request.query_params.get('month_year')
        
        if not centre_id:
            return Response({"error": "centre_id is required"}, status=status.HTTP_400_BAD_REQUEST)        
        if not month_year:
            return Response({"error": "month_year is required"}, status=status.HTTP_400_BAD_REQUEST)        
        if len(month_year) != 7 or month_year[4] != '-':
            return Response({"error": "Invalid month_year format. Use YYYY-MM"}, status=status.HTTP_400_BAD_REQUEST)
        
        year = int(month_year[:4])
        month = int(month_year[5:7])
        
        logger.info(f"Fetching courses with entries for centre: {centre_id}, month: {month_year}")
        
        # Get all course entries for this centre and month
        course_entries = CourseEntry.objects.filter(
            centre_id=centre_id, month_year__year=year, month_year__month=month
        ).select_related('course')  
        
        course_ids = course_entries.values_list('course_id', flat=True).distinct()
        courses = CourseDetail.objects.filter(id__in=course_ids)
        courses_serializer = CourseDetailSerializer(courses, many=True)
        
        # Serialize the entries
        entries_serializer = CourseEntryDetailSerializer(course_entries, many=True)
        
        return Response({
            "centre_id": centre_id,
            "month_year": month_year,
            "total_courses": courses.count(),
            "total_entries": course_entries.count(),
            "courses": courses_serializer.data,
            "entries": entries_serializer.data  # Add the entries data
        }, status=status.HTTP_200_OK)
        
    except ValueError as e:
        logger.error(f"Value error: {str(e)}")
        return Response({"error": "Invalid month_year format"}, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Error fetching courses with entries: {str(e)}")
        return Response({"error": "Failed to retrieve courses"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


#__________________________- ADMIN VERIFY ENTRIES __________________________________


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_pending_entries(request):
    """
    Get all pending entries, optionally filtered by centre
    Query params:
        - centre_id: filter by specific centre (optional)
    """
    try:        
        centre_id = request.GET.get('centre_id')
        
        # Base queryset for pending entries
        queryset = CourseEntry.objects.filter(entry_status='PENDING').select_related(
            'centre', 'course', 'course__course_category', 'created_by', 'updated_by'
            ).order_by('centre__centre_name', 'month_year')
        
        # Apply centre filter if provided
        if centre_id and centre_id != 'all':
            queryset = queryset.filter(centre_id=centre_id)
        
        # Get status counts
        status_counts = CourseEntry.objects.aggregate(
            total_pending=Count('id', filter=Q(entry_status='PENDING')),
            total_partial=Count('id', filter=Q(entry_status='PARTIAL')),
            total_completed=Count('id', filter=Q(entry_status='COMPLETED')),
            total_verified=Count('id', filter=Q(entry_status='VERIFIED')),
            total_locked=Count('id', filter=Q(entry_status='LOCKED'))
        )
        
        # Get centre-wise pending counts
        centre_wise_counts = CourseEntry.objects.filter(
            entry_status='PENDING').values('centre__id', 'centre__centre_name'
                                           ).annotate(pending_count=Count('id'), 
                                            total_enrolled=Sum('total_enrolled')).order_by('-pending_count')
        
        serializer = CourseEntryListSerializer(queryset, many=True)
        
        return Response({
            'status_counts': status_counts,
            'centre_wise_counts': centre_wise_counts,
            'pending_entries': serializer.data,
            'total_pending': queryset.count()
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error fetching pending entries: {str(e)}")
        return Response({"error": "Failed to fetch pending entries"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_entry_details(request, entry_id):
    """
    Get detailed information for a specific course entry
    """
    try:    
        try:
            entry = CourseEntry.objects.select_related(
                'centre', 'course', 'course__course_category',
                'created_by', 'updated_by', 'verified_by'
            ).get(id=entry_id)
        except CourseEntry.DoesNotExist:
            return Response(
                {"error": "Entry not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = CourseEntryDetailSerializer(entry)
        
        # Check if entry can be verified
        can_verify = entry.entry_status in ['PENDING', 'PARTIAL', 'COMPLETED']
        
        return Response({'entry': serializer.data, 'can_verify': can_verify, 'current_status': entry.entry_status}, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error fetching entry details: {str(e)}")
        return Response( {"error": "Failed to fetch entry details"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_entry(request, entry_id):
    """
    Verify a course entry (change status to VERIFIED)
    """
    try:
        try:
            entry = CourseEntry.objects.get(id=entry_id)
        except CourseEntry.DoesNotExist:
            return Response(
                {"error": "Entry not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if entry can be verified
        if entry.entry_status == 'VERIFIED':
            return Response({"error": "Entry is already verified"}, status=status.HTTP_400_BAD_REQUEST)
        
        if entry.entry_status == 'LOCKED':
            return Response({"error": "Locked entries cannot be verified"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Update entry status
        entry.entry_status = 'VERIFIED'
        entry.verified_by = request.user
        entry.verified_at = timezone.now()
        entry.save()
        
        serializer = CourseEntryDetailSerializer(entry)
        
        return Response({'message': 'Entry verified successfully', 'entry': serializer.data}, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error verifying entry: {str(e)}")
        return Response( {"error": "Failed to verify entry"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_verification_stats(request):
    """
    Get verification statistics
    Query params:
        - centre_id: filter by centre (optional)
        - days: number of days to look back (optional)
    """
    try:
  
        
        centre_id = request.GET.get('centre_id')
        days = int(request.GET.get('days', 30))
        
        # Calculate date range
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        # Base queryset
        queryset = CourseEntry.objects.all()
        
        if centre_id and centre_id != 'all':
            queryset = queryset.filter(centre_id=centre_id)
        
        # Overall stats
        overall_stats = queryset.aggregate(
            total_entries=Count('id'),
            pending=Count('id', filter=Q(entry_status='PENDING')),
            partial=Count('id', filter=Q(entry_status='PARTIAL')),
            completed=Count('id', filter=Q(entry_status='COMPLETED')),
            verified=Count('id', filter=Q(entry_status='VERIFIED')),
            locked=Count('id', filter=Q(entry_status='LOCKED')),
            total_enrolled=Sum('total_enrolled'),
            total_certified=Sum('total_certified')
        )
        
        # Recent activity (last 'days' days)
        recent_entries = queryset.filter(
            created_at__gte=start_date
        ).aggregate(
            new_entries=Count('id'),
            verified_entries=Count('id', filter=Q(entry_status='VERIFIED'))
        )
        
        # Verification trend (last 7 days)
        seven_days_ago = end_date - timedelta(days=7)
        daily_trend = CourseEntry.objects.filter(
            verified_at__gte=seven_days_ago
        ).extra(
            {'date': "date(verified_at)"}
        ).values('date').annotate(
            verified_count=Count('id')
        ).order_by('date')
        
        return Response({
            'overall': overall_stats,
            'recent': recent_entries,
            'daily_trend': list(daily_trend),
            'period': {
                'start': start_date.date(),
                'end': end_date.date(),
                'days': days
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error fetching verification stats: {str(e)}")
        return Response({"error": "Failed to fetch statistics"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
