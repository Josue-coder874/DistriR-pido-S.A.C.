"""Crea un usuario o restablece su contraseña.

Uso (desde src/backend):
    python -m scripts.create_user --email admin@distrirapido.pe --name "Administrador" --role ADMINISTRADOR

La contraseña se pide por teclado y no queda en el historial de la terminal.
"""

import argparse
import getpass
import sys

from pydantic import EmailStr, TypeAdapter, ValidationError

from app.database import SessionLocal, init_db
from app.models import User, utcnow
from app.schemas import check_password_policy
from app.security import ROLES, hash_password


def read_password() -> str:
    password = getpass.getpass("Contraseña: ")
    if password != getpass.getpass("Repite la contraseña: "):
        sys.exit("Las contraseñas no coinciden.")
    try:
        return check_password_policy(password)
    except ValueError as error:
        sys.exit(str(error))


def main() -> None:
    parser = argparse.ArgumentParser(description="Crea un usuario de EcoLogística Lima.")
    parser.add_argument("--email", required=True)
    parser.add_argument("--name", required=True)
    parser.add_argument("--role", required=True, choices=ROLES)
    parser.add_argument(
        "--reset-password",
        action="store_true",
        help="Si el usuario ya existe, cambia su contraseña y lo desbloquea.",
    )
    args = parser.parse_args()

    try:
        email = TypeAdapter(EmailStr).validate_python(args.email).lower()
    except ValidationError:
        sys.exit(f"Correo no válido: {args.email}")

    init_db()
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user and not args.reset_password:
            sys.exit(f"Ya existe un usuario con el correo {email}. Usa --reset-password para cambiar su contraseña.")

        password = read_password()
        if user:
            user.password_hash = hash_password(password)
            user.password_changed_at = utcnow()
            user.failed_login_attempts = 0
            user.locked_until = None
            print(f"Contraseña actualizada para {email}.")
        else:
            db.add(User(name=args.name, email=email, password_hash=hash_password(password), role=args.role))
            print(f"Usuario {email} creado con rol {args.role}.")
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    main()
