from google.auth.exceptions import GoogleAuthError
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from app.core.config import settings


def verify_google_credential(credential: str) -> dict:
    """Verify a Google Identity Services ID token and return the verified profile.

    Raises ValueError when the token is invalid, issued for another client, or the email is unverified.
    """
    if not settings.GOOGLE_CLIENT_ID:
        raise ValueError("GOOGLE_CLIENT_ID is not configured")
    try:
        claims = id_token.verify_oauth2_token(credential, google_requests.Request(), settings.GOOGLE_CLIENT_ID)
    except GoogleAuthError as exc:  # includes network failures fetching Google's signing keys
        raise ValueError(str(exc)) from exc
    if not claims.get("email") or not claims.get("email_verified"):
        raise ValueError("Google email is not verified")
    return {
        "email": claims["email"].lower(),
        "name": claims.get("name") or claims["email"].split("@")[0],
        "sub": claims["sub"],
    }
