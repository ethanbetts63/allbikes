import factory
from django.contrib.auth.models import User

class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User
        django_get_or_create = ('username',)
        skip_postgeneration_save = True

    username = factory.Sequence(lambda n: f"user{n}")
    email = factory.LazyAttribute(lambda obj: f"{obj.username}@example.com")
    
    @factory.post_generation
    def password(self, create, extracted, **kwargs):
        if not create:
            return
        # A default password for the user
        self.set_password(extracted or 'defaultpassword')
        self.save()
    
    is_staff = False
    is_superuser = False
    is_active = True
