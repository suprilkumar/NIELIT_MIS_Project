from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.cache import cache
from rest_framework.permissions import AllowAny

from .serializers import ConnectDBSerializer, ChatSerializer
from .services.db_connection import get_db_connection
from .services.llm import get_full_chain
from .utils.stream import stream_llm_response
import uuid


class ConnectDatabaseView(APIView):
    permission_classes = [AllowAny]   
    """
    POST /api/nl-sql/connect/
    Connects to the DB, caches the connection, returns session_key + schema
    """
    def post(self, request):
        serializer = ConnectDBSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        try:
            db = get_db_connection(
                db_type=data["db_type"],
                username=data.get("username"),
                password=data.get("password"),
                host=data.get("host"),
                port=data.get("port"),
                database=data.get("database"),
            )

            # Cache the DB object for 1 hour, tied to a session key
            session_key = str(uuid.uuid4())
            cache.set(f"nl_sql_db_{session_key}", db, timeout=3600)

            return Response({
                "session_key": session_key,
                "tables": db.get_usable_table_names(),
                "schema": db.get_table_info(),
            })

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SchemaView(APIView):
    permission_classes = [AllowAny]  
    """
    GET /api/nl-sql/schema/?session_key=xxx
    Returns schema for already connected DB
    """
    def get(self, request):
        session_key = request.query_params.get("session_key")
        db = cache.get(f"nl_sql_db_{session_key}")

        if not db:
            return Response(
                {"error": "Session expired or not found. Please reconnect."},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response({
            "tables": db.get_usable_table_names(),
            "schema": db.get_table_info(),
        })


class ChatView(APIView):
    permission_classes = [AllowAny] 
    """
    POST /api/nl-sql/chat/
    Streams LLM response as SSE
    """
    def post(self, request):
        serializer = ChatSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        db = cache.get(f"nl_sql_db_{data['session_key']}")

        if not db:
            return Response(
                {"error": "Session expired. Please reconnect to the database."},
                status=status.HTTP_404_NOT_FOUND
            )

        chain = get_full_chain(db)

        return stream_llm_response(chain, {
            "question": data["question"],
            "chat_history": data["chat_history"],
        })