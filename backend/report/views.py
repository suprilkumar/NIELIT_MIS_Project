from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q, Sum, Count, Avg
from django.db.models.functions import Coalesce
from django.utils import timezone
from datetime import datetime, timedelta
import calendar
import logging
from dashboard.models import *
from course_entry.serializers import CourseEntryListSerializer
from datetime import date
from dashboard.models import Centre, CourseDetail, CourseEntry
from course_entry.serializers import CourseEntryCreateSerializer
from rest_framework.parsers import FormParser, MultiPartParser
import pandas as pd

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_report_data(request):
    """
    Get report data for frontend display
    Query params:
        - report_type: monthly/quarterly/yearly/custom
        - centre_id: specific centre id or 'all'
        - year: YYYY
        - month: MM (1-12)
        - quarter: 1-4
        - start_date: YYYY-MM-DD (for custom)
        - end_date: YYYY-MM-DD (for custom)
        - category_id: filter by course category
        - course_id: filter by specific course
    """
    try:
        report_type = request.GET.get('report_type', 'monthly')
        centre_id = request.GET.get('centre_id')
        year = request.GET.get('year')
        month = request.GET.get('month')
        quarter = request.GET.get('quarter')
        category_id = request.GET.get('category_id')
        course_id = request.GET.get('course_id')
        
        # Convert to integers
        if year:
            year = int(year)
        if month:
            month = int(month)
        if quarter:
            quarter = int(quarter)
        
        # Get date range based on report type
        today = timezone.now().date()
        
        if report_type == 'monthly':
            if not year or not month:
                year = today.year
                month = today.month
            start_date = datetime(year, month, 1).date()
            # Get last day of month
            if month == 12:
                end_date = datetime(year + 1, 1, 1).date() - timedelta(days=1)
            else:
                end_date = datetime(year, month + 1, 1).date() - timedelta(days=1)
                
        elif report_type == 'quarterly':
            if not year or not quarter:
                year = today.year
                quarter = (today.month - 1) // 3 + 1
            start_month = (quarter - 1) * 3 + 1
            start_date = datetime(year, start_month, 1).date()
            if quarter == 4:
                end_date = datetime(year + 1, 1, 1).date() - timedelta(days=1)
            else:
                end_date = datetime(year, start_month + 3, 1).date() - timedelta(days=1)
                
        elif report_type == 'yearly':
            if not year:
                year = today.year
            start_date = datetime(year, 1, 1).date()
            end_date = datetime(year, 12, 31).date()
            
        elif report_type == 'custom':
            start_date = request.GET.get('start_date')
            end_date = request.GET.get('end_date')
            if start_date:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            else:
                start_date = today - timedelta(days=30)
            if end_date:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            else:
                end_date = today
        else:
            # Default to last 30 days
            end_date = today
            start_date = today - timedelta(days=30)
        
        # Build base queryset
        queryset = CourseEntry.objects.select_related('centre', 'course', 'course__course_category','created_by', 'updated_by').all()
        
        # Apply filters
        if centre_id and centre_id != 'all':
            queryset = queryset.filter(centre_id=centre_id)
        
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        if category_id:
            queryset = queryset.filter(course__course_category_id=category_id)
        
        # Apply date filter
        if start_date and end_date:
            queryset = queryset.filter(month_year__gte=start_date, month_year__lte=end_date)
        
        # Order by centre and date
        queryset = queryset.order_by('centre__centre_name', 'month_year')
        
        serializer = CourseEntryListSerializer(queryset, many=True)
        
        # Calculate summary statistics
        summary = queryset.aggregate(
            total_entries=Count('id'),
            total_enrolled=Coalesce(Sum('total_enrolled'), 0),
            total_trained=Coalesce(Sum('total_trained'), 0),
            total_certified=Coalesce(Sum('total_certified'), 0),
            total_placed=Coalesce(Sum('total_placed'), 0),
            total_male_enrolled=Coalesce(Sum('male_enrolled'), 0),
            total_female_enrolled=Coalesce(Sum('female_enrolled'), 0),
            total_sc_enrolled=Coalesce(Sum('sc_enrolled'), 0),
            total_st_enrolled=Coalesce(Sum('st_enrolled'), 0),
            total_obc_enrolled=Coalesce(Sum('obc_enrolled'), 0),
            total_pwd_enrolled=Coalesce(Sum('pwd_enrolled'), 0)
        )
        
        # Add derived statistics
        if summary['total_enrolled'] > 0:
            summary['certification_rate'] = round(
                (summary['total_certified'] / summary['total_enrolled']) * 100, 2
            )
            summary['placement_rate'] = round(
                (summary['total_placed'] / summary['total_enrolled']) * 100, 2
            )
        else:
            summary['certification_rate'] = 0
            summary['placement_rate'] = 0
        
        # Prepare response
        response_data = {
            'metadata': {
                'generated_at': timezone.now().isoformat(),
                'report_type': report_type,
                'date_range': {
                    'start': start_date.isoformat() if start_date else None,
                    'end': end_date.isoformat() if end_date else None
                },
                'filters': {
                    'centre_id': centre_id,
                    'category_id': category_id,
                    'course_id': course_id,
                    'year': year,
                    'month': month,
                    'quarter': quarter
                },
                'total_records': queryset.count()
            },
            'summary': summary,
            'data': serializer.data
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
            
    except Exception as e:
        logger.error(f"Error generating report data: {str(e)}")
        return Response({"error": f"Failed to generate report: {str(e)}"},  status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_report_filters(request):
    """Get available filter options for report"""
  
    
    centres = Centre.objects.all().values('id', 'centre_name', 'centre_code')
    categories = CourseCategory.objects.all().values('id', 'course_category_name')
    
    # Get available years from entries
    years = CourseEntry.objects.dates('month_year', 'year', order='DESC')
    available_years = [date.year for date in years]
    
    # Add current year if not present
    current_year = timezone.now().year
    if current_year not in available_years:
        available_years.append(current_year)
    
    options = {
        'report_types': [
            {'value': 'monthly', 'label': 'Monthly Report'},
            {'value': 'quarterly', 'label': 'Quarterly Report'},
            {'value': 'yearly', 'label': 'Yearly Report'},
            {'value': 'custom', 'label': 'Custom Date Range'}
        ],
        'centres': [
            {'id': 'all', 'name': 'All Centres'}
        ] + list(centres),
        'categories': list(categories),
        'years': sorted(available_years, reverse=True),
        'quarters': [
            {'value': 1, 'label': 'Q1 (Jan-Mar)'},
            {'value': 2, 'label': 'Q2 (Apr-Jun)'},
            {'value': 3, 'label': 'Q3 (Jul-Sep)'},
            {'value': 4, 'label': 'Q4 (Oct-Dec)'}
        ],
        'months': [
            {'value': i, 'label': calendar.month_name[i]} for i in range(1, 13)
        ]
    }
    return Response(options, status=status.HTTP_200_OK)

from django.db import transaction

@api_view(['POST'])
@parser_classes([FormParser, MultiPartParser])
def mis_csv_upload(request):
  
    try:
        file = request.FILES.get('file')
        
        if not file:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Read file
        if file.name.endswith('.csv'):
            # Read CSV as string to preserve date format
            df = pd.read_csv(file, encoding='utf-8', dtype=str)
        elif file.name.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(file, dtype=str)
        else:
            return Response(
                {"error": "Unsupported file format. Please upload CSV or Excel file"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Clean column names
        df.columns = df.columns.str.strip()
        
        # Required columns validation
        required_cols = ["Course Location", "Course Applied", "Category", "Payment Status", "Gender", "Application Date"]
        
        for col in required_cols:
            if col not in df.columns:
                return Response( {"error": f"Required column '{col}' missing in the file"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Normalize data
        df["Category"] = df["Category"].str.upper().str.strip()
        df["Payment Status"] = df["Payment Status"].str.upper().str.strip()
        df["Gender"] = df["Gender"].str.upper().str.strip()
        df["Course Applied"] = df["Course Applied"].str.strip()
        df["Course Location"] = df["Course Location"].str.strip()
        
        # Parse Application Date from DD/MM/YYYY format without removing any rows
        def extract_month_year(date_str):
        
            if pd.isna(date_str):
                return "2026-01"
            
            date_str = str(date_str).strip()
            
            # Try to parse DD/MM/YYYY format
            try:
                # Split by '/' or '-' or '.'
                import re
                parts = re.split(r'[/\-\.]', date_str)
                
                if len(parts) == 3:
                    day, month, year = parts[0], parts[1], parts[2]
                    
                    # Handle 2-digit year
                    if len(year) == 2:
                        year = '20' + year
                    
                    # Validate day, month, year are digits
                    if day.isdigit() and month.isdigit() and year.isdigit():
                        day_num = int(day)
                        month_num = int(month)
                        year_num = int(year)
                        
                        # Validate ranges
                        if 1 <= month_num <= 12 and 1 <= day_num <= 31:
                            return f"{year_num:04d}-{month_num:02d}"
            except:
                pass
            
            # Try alternative format MM/DD/YYYY
            try:
                parts = date_str.split('/')
                if len(parts) == 3:
                    month, day, year = parts
                    if len(year) == 2:
                        year = '20' + year
                    if month.isdigit() and day.isdigit() and year.isdigit():
                        month_num = int(month)
                        if 1 <= month_num <= 12:
                            return f"{int(year):04d}-{month_num:02d}"
            except:
                pass
            
            # If all parsing fails, use current month
            from datetime import datetime
            return datetime.now().strftime("%Y-%m")
        
        # Apply extraction to all rows (no data loss)
        df["Month-Year-Str"] = df["Application Date"].apply(extract_month_year)
        
        # Optional: Keep original date for reference
        df["Original Date"] = df["Application Date"]
        
        # Replace any invalid categories
        valid_categories = ['GEN', 'SC', 'ST', 'OBC']
        df["Category"] = df["Category"].apply(lambda x: x if x in valid_categories else 'GEN')
        
        valid_genders = ['M', 'F']
        df["Gender"] = df["Gender"].apply(lambda x: x if x in valid_genders else 'M')
        
        # Calculate summary statistics
        total_records = len(df)
        total_centres = df["Course Location"].nunique()
        total_courses = df["Course Applied"].nunique()
        
        # Payment status summary
        payment_summary = df["Payment Status"].value_counts().to_dict()
        pending_count = payment_summary.get('PENDING', 0)
        success_count = payment_summary.get('SUCCESS', 0)
        
        # Category summary
        category_summary = df["Category"].value_counts().to_dict()
        
        # Gender summary
        gender_summary = df["Gender"].value_counts().to_dict()
        
        # Month-Year summary (sorted chronologically)
        month_year_summary = df["Month-Year-Str"].value_counts().sort_index().to_dict()
        
        # Get sorted list of months present in data
        months_present = sorted(month_year_summary.keys())
        
        # Course wise summary
        course_summary = df.groupby("Course Applied").size().to_dict()
        
        # Centre wise summary
        centre_summary = df.groupby("Course Location").size().to_dict()
        
        # Process data for frontend display
        grouped = (
            df.groupby(["Course Location", "Course Applied", "Category", "Gender", "Payment Status", "Month-Year-Str"])
            .size()
            .reset_index(name="count")
        )
        
        result = {}
        
        for _, row in grouped.iterrows():
            centre = row["Course Location"]
            course = row["Course Applied"]
            category = row["Category"]
            gender = row["Gender"]
            payment = row["Payment Status"]
            month_year = row["Month-Year-Str"]
            count = int(row["count"])
            
            if centre not in result:
                result[centre] = { "centre_name": centre, "courses": {} }
            
            if course not in result[centre]["courses"]:
                result[centre]["courses"][course] = {
                    "course_name": course,
                    "monthly_data": {},
                    "counts": {
                        "category": {},
                        "gender": {}
                    }
                }
            
            # Store month-wise data
            if month_year not in result[centre]["courses"][course]["monthly_data"]:
                result[centre]["courses"][course]["monthly_data"][month_year] = {
                    "month_year": month_year,
                    "counts": {
                        "category": {},
                        "gender": {}
                    }
                }
            
            # Category-wise counts (overall)
            if category not in result[centre]["courses"][course]["counts"]["category"]:
                result[centre]["courses"][course]["counts"]["category"][category] = { "success": 0, "pending": 0, "total": 0 }
            
            # Gender-wise counts (overall)
            if gender not in result[centre]["courses"][course]["counts"]["gender"]:
                result[centre]["courses"][course]["counts"]["gender"][gender] = { "success": 0, "pending": 0, "total": 0 }
            
            # Month-wise category counts
            if category not in result[centre]["courses"][course]["monthly_data"][month_year]["counts"]["category"]:
                result[centre]["courses"][course]["monthly_data"][month_year]["counts"]["category"][category] = {
                    "success": 0,
                    "pending": 0,
                    "total": 0
                }
            
            # Month-wise gender counts
            if gender not in result[centre]["courses"][course]["monthly_data"][month_year]["counts"]["gender"]:
                result[centre]["courses"][course]["monthly_data"][month_year]["counts"]["gender"][gender] = {
                    "success": 0,
                    "pending": 0,
                    "total": 0
                }
            
            # Update counts based on payment status
            if payment == "SUCCESS":
                result[centre]["courses"][course]["counts"]["category"][category]["success"] += count
                result[centre]["courses"][course]["counts"]["gender"][gender]["success"] += count
                result[centre]["courses"][course]["monthly_data"][month_year]["counts"]["category"][category]["success"] += count
                result[centre]["courses"][course]["monthly_data"][month_year]["counts"]["gender"][gender]["success"] += count
            else:
                result[centre]["courses"][course]["counts"]["category"][category]["pending"] += count
                result[centre]["courses"][course]["counts"]["gender"][gender]["pending"] += count
                result[centre]["courses"][course]["monthly_data"][month_year]["counts"]["category"][category]["pending"] += count
                result[centre]["courses"][course]["monthly_data"][month_year]["counts"]["gender"][gender]["pending"] += count
            
            # Update total counts
            result[centre]["courses"][course]["counts"]["category"][category]["total"] += count
            result[centre]["courses"][course]["counts"]["gender"][gender]["total"] += count
            result[centre]["courses"][course]["monthly_data"][month_year]["counts"]["category"][category]["total"] += count
            result[centre]["courses"][course]["monthly_data"][month_year]["counts"]["gender"][gender]["total"] += count
        
        # Convert dict to list with proper structure
        final_data = []
        for centre_name, centre_data in result.items():
            courses_list = []
            for course_name, course_data in centre_data["courses"].items():
                # Convert monthly_data dict to sorted list (only months that exist)
                monthly_data_list = [
                    {
                        "month_year": month,
                        "counts": {
                            "category": counts["counts"]["category"],
                            "gender": counts["counts"]["gender"]
                        }
                    }
                    for month, counts in sorted(course_data["monthly_data"].items())
                ]
                
                courses_list.append({
                    "course_name": course_data["course_name"],
                    "counts": course_data["counts"],
                    "monthly_data": monthly_data_list
                })
            
            final_data.append({ "centre_name": centre_name, "courses": courses_list })
        
        # Prepare enhanced summary
        summary = {
            "total_records": total_records,
            "total_centres": total_centres,
            "total_courses": total_courses,
            "pending_payments": pending_count,
            "success_payments": success_count,
            "category_breakdown": category_summary,
            "gender_breakdown": gender_summary,
            "month_year_breakdown": month_year_summary,
            "course_breakdown": course_summary,
            "centre_breakdown": centre_summary,
            "centres_list": list(result.keys()),
            "months_range": months_present  # Only months that exist in data
        }
        
        response_data = { "summary": summary, "data": final_data }
        print(summary, '\n', final_data)
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Error in mis_csv_upload: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response( {"error": f"Error processing file: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR )


@api_view(['POST'])
def course_entry_bulk_create(request):
  
    try:
        data = request.data
        created_count = 0
        updated_count = 0
        errors = []
        
        with transaction.atomic():
            for centre_data in data:
                centre_name = centre_data.get('centre_name')
                
                # Get or create centre
                centre, _ = Centre.objects.get_or_create(
                    centre_name=centre_name,
                    defaults={
                        'centre_address': 'To be updated',
                        'centre_code': centre_name.upper().replace(' ', '_')
                    }
                )
                
                # Process each course
                for course_data in centre_data.get('courses', []):
                    course_name = course_data.get('course_name')
                    
                    # Get or create course
                    course_category, _ = CourseCategory.objects.get_or_create(
                        course_category_name='Default Category',
                        defaults={'course_category_type': 'A'}
                    )
                    
                    course_detail, _ = CourseDetail.objects.get_or_create(
                        course_name=course_name,
                        course_centre=centre,
                        defaults={
                            'course_category': course_category,
                            'course_status': 'ACTIVE'
                        }
                    )
                    
                    # Process monthly data
                    for month_entry in course_data.get('monthly_data', []):
                        month_year_str = month_entry.get('month_year')
                        
                        # Parse month_year
                        try:
                            month_year = datetime.strptime(month_year_str, '%Y-%m').date()
                        except:
                            errors.append(f"Invalid date format: {month_year_str}")
                            continue
                        
                        # Get counts (these are already from SUCCESS payments in the uploaded data)
                        category_counts = month_entry.get('counts', {}).get('category', {})
                        gender_counts = month_entry.get('counts', {}).get('gender', {})
                        
                        # Create or update entry
                        entry, created = CourseEntry.objects.update_or_create(
                            centre=centre,
                            course=course_detail,
                            month_year=month_year,
                            defaults={
                                'entry_status': 'PENDING',
                                'created_by': request.user if request.user.is_authenticated else None,
                                'updated_by': request.user if request.user.is_authenticated else None,
                                
                                # Only set enrolled counts (from SUCCESS payments)
                                'total_enrolled': calculate_total_enrolled(category_counts),
                                
                                # Category enrolled counts
                                'gen_enrolled': category_counts.get('GEN', {}).get('success', 0),
                                'sc_enrolled': category_counts.get('SC', {}).get('success', 0),
                                'st_enrolled': category_counts.get('ST', {}).get('success', 0),
                                'obc_enrolled': category_counts.get('OBC', {}).get('success', 0),
                                
                                # Gender enrolled counts
                                'male_enrolled': gender_counts.get('M', {}).get('success', 0),
                                'female_enrolled': gender_counts.get('F', {}).get('success', 0),
                                
                                # Set all other counts to 0 (not updated from this upload)
                                'total_trained': 0,
                                'total_certified': 0,
                                'total_placed': 0,
                                'male_trained': 0,
                                'male_certified': 0,
                                'male_placed': 0,
                                'female_trained': 0,
                                'female_certified': 0,
                                'female_placed': 0,
                                'gen_trained': 0,
                                'gen_certified': 0,
                                'gen_placed': 0,
                                'sc_trained': 0,
                                'sc_certified': 0,
                                'sc_placed': 0,
                                'st_trained': 0,
                                'st_certified': 0,
                                'st_placed': 0,
                                'obc_trained': 0,
                                'obc_certified': 0,
                                'obc_placed': 0,
                                'pwd_enrolled': 0,
                                'pwd_trained': 0,
                                'pwd_certified': 0,
                                'pwd_placed': 0
                            }
                        )
                        
                        if created:
                            created_count += 1
                        else:
                            updated_count += 1
        
        return Response({
            'message': f'Successfully processed {created_count + updated_count} entries',
            'created': created_count, 'updated': updated_count, 'errors': errors}, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def calculate_total_enrolled(category_counts):
    """Helper function to calculate total enrolled from category counts"""
    total = 0
    for category in ['GEN', 'SC', 'ST', 'OBC']:
        total += category_counts.get(category, {}).get('success', 0)
    return total

@api_view(['GET'])
def get_course_entries(request, centre_id=None):
  
    try:
        queryset = CourseEntry.objects.select_related('centre', 'course', 'course__course_category')
        
        # Apply filters
        if centre_id:
            queryset = queryset.filter(centre_id=centre_id)
        
        month_year = request.GET.get('month_year')
        if month_year:
            try:
                month_date = datetime.strptime(month_year, '%Y-%m').date()
                queryset = queryset.filter(month_year=month_date)
            except:
                pass
        
        # Aggregate data
        entries_data = []
        for entry in queryset:
            entries_data.append({
                'id': entry.id,
                'centre_name': entry.centre.centre_name,
                'course_name': entry.course.course_name,
                'month_year': entry.month_year.strftime('%Y-%m'),
                'total_enrolled': entry.total_enrolled,
                'total_trained': entry.total_trained,
                'total_certified': entry.total_certified,
                'gender_breakdown': {
                    'male': {
                        'enrolled': entry.male_enrolled,
                        'trained': entry.male_trained,
                        'certified': entry.male_certified
                    },
                    'female': {
                        'enrolled': entry.female_enrolled,
                        'trained': entry.female_trained,
                        'certified': entry.female_certified
                    }
                },
                'category_breakdown': {
                    'sc': {
                        'enrolled': entry.sc_enrolled,
                        'trained': entry.sc_trained,
                        'certified': entry.sc_certified
                    },
                    'st': {
                        'enrolled': entry.st_enrolled,
                        'trained': entry.st_trained,
                        'certified': entry.st_certified
                    },
                    'obc': {
                        'enrolled': entry.obc_enrolled,
                        'trained': entry.obc_trained,
                        'certified': entry.obc_certified
                    },
                    'gen': {
                        'enrolled': entry.gen_enrolled,
                        'trained': entry.gen_trained,
                        'certified': entry.gen_certified
                    }
                },
                'status': entry.entry_status,
                'created_at': entry.created_at,
                'updated_at': entry.updated_at
            })
        
        return Response({
            'count': len(entries_data),
            'entries': entries_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )