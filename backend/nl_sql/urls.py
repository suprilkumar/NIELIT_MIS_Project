from django.urls import path
from .views import ConnectDatabaseView, SchemaView, ChatView

urlpatterns = [
    path("connect/", ConnectDatabaseView.as_view(), name="nl-sql-connect"),
    path("schema/",  SchemaView.as_view(),          name="nl-sql-schema"),
    path("chat/",    ChatView.as_view(),             name="nl-sql-chat"),
]