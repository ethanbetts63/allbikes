from django.conf import settings
from django.utils import timezone
from rest_framework import serializers
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from data_management.throttling import BikeInterestThrottle
from inventory.models import BikeInterestEnquiry, Motorcycle
from notifications.utils.email import send_bike_interest_reply

REPLY_SUBJECT = 'About the {title}'

GREETING = 'Hey there,'

INTRO = 'Thanks for enquiring about the {title}.'

BIKE_LINK = 'Here it is again if you want another look: {url}'

NEW_BIKE_COLOUR_QUESTION = (
    "Do you know which colour you'd are interested in? The options are {options}."
)

NEW_BIKE_BODY = (
    'I\'ve just shot off an email to our supplier for you, so I\'ll get an exact date '
    'on when we could get one in store by soon. But it\'s normally around 2 weeks. '
    'Hopefully there\'s one available. Sometimes there\'s only be 1 or 2 left in the country. '
    'Other than that, let me know if you have any questions and if you want to reserve the stock, ' 
    'you can put down a deposit on that page I linked above.'
)

USED_BIKE_BODY = (
    'I\'m getting a lot of clicks on it at the moment but it\'s is still available. '
    'I imagine you might want to come in and take a look at it in person, '
    'if so let me know and we can arrange a time that works best for you. '
    'Otherwise, you can put a deposit down to secure it. There\'s a button on that page I linked.'
)

SIGN_OFF = (
    'Cheers,\n'
    'Allbikes & Scooters\n'
    '(08) 9433 4613\n'
    '5/6 Cleveland Street, Dianella WA'
)

class InterestSerializer(serializers.Serializer):
    motorcycle = serializers.PrimaryKeyRelatedField(queryset=Motorcycle.objects.all())
    email = serializers.EmailField()


def _enquiry_data(enquiry):
    bike = enquiry.motorcycle
    return {
        'id': enquiry.id,
        'email': enquiry.email,
        'created_at': enquiry.created_at,
        'responded_at': enquiry.responded_at,
        'responded': enquiry.responded,
        'motorcycle_id': bike.id,
        'motorcycle_title': str(bike),
        'motorcycle_status': bike.status,
        'motorcycle_slug': bike.slug,
    }


def _colour_list(colours):
    named = [str(colour).strip() for colour in (colours or []) if str(colour).strip()]
    if not named:
        return ''
    if len(named) == 1:
        return named[0]
    return f"{', '.join(named[:-1])} and {named[-1]}"


def _new_bike_body(title, url, colours):
    options = _colour_list(colours)
    paragraphs = [GREETING, INTRO.format(title=title), BIKE_LINK.format(url=url)]
    if options:
        paragraphs.append(NEW_BIKE_COLOUR_QUESTION.format(options=options))
    paragraphs += [NEW_BIKE_BODY, SIGN_OFF]
    return '\n\n'.join(paragraphs)


def _used_bike_body(title, url):
    return '\n\n'.join([
        GREETING,
        INTRO.format(title=title),
        BIKE_LINK.format(url=url),
        USED_BIKE_BODY,
        SIGN_OFF,
    ])


def _reply_draft(enquiry):
    bike = enquiry.motorcycle
    title = f'{bike.make} {bike.model}'
    url = f'{settings.SITE_URL}/inventory/motorcycles/{bike.slug}'
    body = (
        _new_bike_body(title, url, bike.available_colours)
        if bike.condition == 'new'
        else _used_bike_body(title, url)
    )
    return {'to': enquiry.email, 'subject': REPLY_SUBJECT.format(title=title), 'body': body}


class BikeInterestCreateView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [BikeInterestThrottle]

    def post(self, request):
        serializer = InterestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email'].strip().casefold()
        motorcycle = serializer.validated_data['motorcycle']
        _, created = BikeInterestEnquiry.objects.get_or_create(motorcycle=motorcycle, email=email)
        return Response(
            {'detail': 'Thanks for your interest — we will be in touch.'},
            status=201 if created else 200,
        )


class AdminBikeInterestListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        enquiries = BikeInterestEnquiry.objects.select_related('motorcycle')
        return Response({'enquiries': [_enquiry_data(enquiry) for enquiry in enquiries]})


class AdminBikeInterestReplyView(APIView):
    permission_classes = [IsAdminUser]

    def get_enquiry(self, pk):
        return BikeInterestEnquiry.objects.select_related('motorcycle').filter(pk=pk).first()

    def get(self, request, pk):
        enquiry = self.get_enquiry(pk)
        if not enquiry:
            return Response({'detail': 'Enquiry not found.'}, status=404)
        return Response({**_reply_draft(enquiry), 'enquiry': _enquiry_data(enquiry)})

    def post(self, request, pk):
        enquiry = self.get_enquiry(pk)
        if not enquiry:
            return Response({'detail': 'Enquiry not found.'}, status=404)

        subject = (request.data.get('subject') or '').strip()
        body = (request.data.get('body') or '').strip()
        if not subject or not body:
            return Response({'detail': 'Subject and email body are required.'}, status=400)

        sent = send_bike_interest_reply(enquiry, subject=subject, text_body=body)
        if not sent:
            return Response({'detail': 'Email could not be sent. The failed attempt was recorded.'}, status=502)

        enquiry.responded_at = timezone.now()
        enquiry.save(update_fields=['responded_at'])
        return Response({'detail': 'Reply sent.', 'enquiry': _enquiry_data(enquiry)})
