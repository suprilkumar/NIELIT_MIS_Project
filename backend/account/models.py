from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils.translation import gettext_lazy as _

class UserManager(BaseUserManager):
    def create_user(self, email, contact, password=None, **extra_fields):
        if not email and not contact:
            raise ValueError('Either email or contact must be set')
        
        email = self.normalize_email(email) if email else None
        user = self.model(email=email, contact=contact, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, contact, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        
        return self.create_user(email, contact, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        ADMIN = 'admin', _('Admin')
        OPERATOR = 'operator', _('Operator')
        USER = 'user', _('User')
    
    email = models.EmailField(_('email address'), unique=True, null=True, blank=True)
    contact = models.CharField(_('contact number'), max_length=15, unique=True, null=True, blank=True)
    full_name = models.CharField(_('full name'), max_length=255)
    role = models.CharField(_('role'), max_length=20, choices=Role.choices, default=Role.USER)
    
    is_active = models.BooleanField(_('active'), default=True)
    is_staff = models.BooleanField(_('staff status'), default=False)
    is_superuser = models.BooleanField(_('superuser status'), default=False)
    
    date_joined = models.DateTimeField(_('date joined'), auto_now_add=True)
    last_login = models.DateTimeField(_('last login'), auto_now=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['contact', 'full_name']
    
    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
    
    def __str__(self):
        return self.full_name
    
    def get_username(self):
        return self.email or self.contact
    
    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN
    
    @property
    def is_operator(self):
        return self.role == self.Role.OPERATOR