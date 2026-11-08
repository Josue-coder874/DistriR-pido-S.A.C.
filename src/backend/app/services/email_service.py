import logging
import smtplib
from email.message import EmailMessage

from app.config import get_settings

logger = logging.getLogger("uvicorn.error")


def send_email(to: str, subject: str, body: str) -> None:
    settings = get_settings()

    if not settings.smtp_host:
        # Modo desarrollo: sin SMTP configurado, el correo se muestra en el log del backend.
        logger.warning("Correo no enviado (SMTP_HOST vacío).\nPara: %s\nAsunto: %s\n\n%s", to, subject, body)
        return

    message = EmailMessage()
    message["From"] = settings.smtp_from
    message["To"] = to
    message["Subject"] = subject
    message.set_content(body)

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as smtp:
            smtp.starttls()
            if settings.smtp_user:
                smtp.login(settings.smtp_user, settings.smtp_password or "")
            smtp.send_message(message)
    except (smtplib.SMTPException, OSError):
        logger.exception("No se pudo enviar el correo a %s", to)
