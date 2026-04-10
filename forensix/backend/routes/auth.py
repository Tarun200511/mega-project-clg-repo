from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class LoginRequest(BaseModel):
    badge_number: str
    access_key: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    agent_name: str


@router.post("/login", response_model=TokenResponse, summary="Authenticate Agent")
def login(req: LoginRequest):
    """
    Accepts badge_number + access_key.
    For the prototype a static token is returned — replace with
    Firebase Admin SDK JWT verification or OAuth2 in production.
    """
    # TODO: verify against Firebase / actual user store
    return {
        "access_token": f"fx-demo-token-{req.badge_number}",
        "token_type": "Bearer",
        "agent_name": f"Agent {req.badge_number}"
    }
