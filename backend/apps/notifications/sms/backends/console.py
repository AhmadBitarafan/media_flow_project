"""
SMS Backend Adapter System.
Swap SMS_BACKEND in settings to use a different provider.
"""


class BaseSMSBackend:
    def send(self, phone_number: str, message: str) -> bool:
        raise NotImplementedError


class ConsoleSMSBackend(BaseSMSBackend):
    """Development backend — prints to console."""
    def send(self, phone_number: str, message: str) -> bool:
        print(f'[SMS] To: {phone_number} | Message: {message}')
        return True


class TwilioSMSBackend(BaseSMSBackend):
    """Twilio provider. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, SMS_FROM_NUMBER in env."""
    def send(self, phone_number: str, message: str) -> bool:
        try:
            from django.conf import settings
            from twilio.rest import Client
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            client.messages.create(to=phone_number, from_=settings.SMS_FROM_NUMBER, body=message)
            return True
        except Exception as e:
            print(f'[Twilio SMS Error] {e}')
            return False
