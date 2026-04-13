from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'full_name', 'email', 'contact', 'role', 'date_joined')
        read_only_fields = ('id', 'date_joined')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True, min_length=6)
    
    class Meta:
        model = User
        fields = ('full_name', 'email', 'contact', 'password', 'confirm_password', 'role')
        extra_kwargs = {
            'email': {'required': False},
            'contact': {'required': False},
        }
    
    def validate(self, data):
        if not data.get('email') and not data.get('contact'):
            raise serializers.ValidationError("Either email or contact must be provided")
        
        if data['password'] != data.pop('confirm_password'):
            raise serializers.ValidationError("Passwords do not match")
        
        return data
    
    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data.get('email'),
            contact=validated_data.get('contact'),
            full_name=validated_data['full_name'],
            password=validated_data['password'],
            role=validated_data.get('role', User.Role.USER)
        )
        return user

class LoginSerializer(serializers.Serializer):
    email_or_contact = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        email_or_contact = data.get('email_or_contact')
        password = data.get('password')
        
        if email_or_contact and password:
            # Try to find user by email or contact
            user = None
            if '@' in email_or_contact:
                try:
                    user = User.objects.get(email=email_or_contact)
                except User.DoesNotExist:
                    pass
            else:
                try:
                    user = User.objects.get(contact=email_or_contact)
                except User.DoesNotExist:
                    pass
            
            if user:
                if user.check_password(password):
                    if not user.is_active:
                        raise serializers.ValidationError("User account is disabled.")
                    data['user'] = user
                    return data
                else:
                    raise serializers.ValidationError("Unable to log in with provided credentials.")
            else:
                raise serializers.ValidationError("User not found.")
        else:
            raise serializers.ValidationError("Must include 'email_or_contact' and 'password'.")

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=6)
    confirm_password = serializers.CharField(required=True, min_length=6)
    
    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("New passwords do not match")
        return data