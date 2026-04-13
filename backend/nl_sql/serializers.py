from rest_framework import serializers

class ConnectDBSerializer(serializers.Serializer):
    db_type  = serializers.ChoiceField(choices=["postgresql", "mysql", "sqlite"])
    username = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(required=False, allow_blank=True)
    host     = serializers.CharField(required=False, allow_blank=True)
    port     = serializers.CharField(required=False, allow_blank=True)
    database = serializers.CharField(required=False, allow_blank=True)


class ChatSerializer(serializers.Serializer):
    question     = serializers.CharField()
    chat_history = serializers.ListField(
        child=serializers.DictField(), default=list
    )
    # session_key ties the request to a cached DB connection
    session_key  = serializers.CharField()