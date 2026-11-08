from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models import User
from app.schemas import LoginRequest, PasswordResetConfirm, PasswordResetRequest, TokenResponse, UserRead
from app.security import create_access_token, get_current_user
from app.services import auth_service, email_service

router = APIRouter(prefix="/api/auth")

RESET_REQUESTED = "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña."


def _raise(error: auth_service.AuthError):
    raise HTTPException(status_code=error.status_code, detail=error.detail, headers=error.headers)


@router.post("/login", response_model=TokenResponse)
def login(credentials: LoginRequest, db: Session = Depends(get_db)) -> dict:
    try:
        user = auth_service.authenticate(db, credentials.email, credentials.password)
    except auth_service.AuthError as error:
        _raise(error)
    return {
        "access_token": create_access_token(user),
        "token_type": "bearer",
        "expires_in": get_settings().access_token_minutes * 60,
        "user": user,
    }


@router.get("/me", response_model=UserRead)
def read_current_user(user: User = Depends(get_current_user)) -> User:
    return user


@router.post("/password-reset/request", status_code=202)
def request_password_reset(
    payload: PasswordResetRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)
) -> dict:
    email = auth_service.request_password_reset(db, payload.email)
    if email:
        # El envío va en segundo plano para que la respuesta tarde lo mismo exista o no el correo.
        background_tasks.add_task(email_service.send_email, *email)
    return {"message": RESET_REQUESTED}


@router.post("/password-reset/confirm")
def confirm_password_reset(payload: PasswordResetConfirm, db: Session = Depends(get_db)) -> dict:
    try:
        auth_service.confirm_password_reset(db, payload.token, payload.new_password)
    except auth_service.AuthError as error:
        _raise(error)
    return {"message": "Tu contraseña se actualizó. Ya puedes iniciar sesión."}
