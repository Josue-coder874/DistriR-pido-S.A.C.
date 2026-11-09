import logging
import smtplib
from email.message import EmailMessage
from types import SimpleNamespace

import pytest

from app.services import email_service


def settings(**overrides):
    values = {
        "smtp_host": "smtp.example.test",
        "smtp_port": 2525,
        "smtp_user": None,
        "smtp_password": None,
        "smtp_from": "noreply@example.test",
    }
    values.update(overrides)
    return SimpleNamespace(**values)


def test_send_email_logs_message_when_smtp_is_not_configured(monkeypatch, caplog):
    monkeypatch.setattr(email_service, "get_settings", lambda: settings(smtp_host=None))

    with caplog.at_level(logging.WARNING, logger="uvicorn.error"):
        email_service.send_email("user@example.test", "Subject", "Body")

    assert "Correo no enviado (SMTP_HOST vacío)." in caplog.text
    assert "user@example.test" in caplog.text
    assert "Subject" in caplog.text
    assert "Body" in caplog.text


@pytest.mark.parametrize(
    ("smtp_user", "smtp_password", "expected_login"),
    [(None, "unused", None), ("mailer", "secret", ("mailer", "secret")), ("mailer", None, ("mailer", ""))],
)
def test_send_email_delivers_message_and_authenticates_when_configured(
    monkeypatch, smtp_user, smtp_password, expected_login
):
    sent = []
    clients = []

    class FakeSMTP:
        def __init__(self, host, port, timeout):
            assert (host, port, timeout) == ("smtp.example.test", 2525, 10)
            self.events = []
            clients.append(self)

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc_value, traceback):
            return False

        def starttls(self):
            self.events.append("starttls")

        def login(self, username, password):
            self.events.append(("login", username, password))

        def send_message(self, message):
            self.events.append("send_message")
            sent.append(message)

    monkeypatch.setattr(email_service, "get_settings", lambda: settings(smtp_user=smtp_user, smtp_password=smtp_password))
    monkeypatch.setattr(email_service.smtplib, "SMTP", FakeSMTP)

    email_service.send_email("user@example.test", "Subject", "Body")

    assert len(sent) == 1
    message = sent[0]
    assert isinstance(message, EmailMessage)
    assert message["From"] == "noreply@example.test"
    assert message["To"] == "user@example.test"
    assert message["Subject"] == "Subject"
    assert message.get_content().strip() == "Body"
    assert clients[0].events == (
        ["starttls", "send_message"]
        if expected_login is None
        else ["starttls", ("login", *expected_login), "send_message"]
    )


@pytest.mark.parametrize("error", [smtplib.SMTPException("SMTP error"), OSError("network error")])
def test_send_email_logs_smtp_and_network_failures(monkeypatch, caplog, error):
    monkeypatch.setattr(email_service, "get_settings", lambda: settings())

    def fail_smtp(*args, **kwargs):
        raise error

    monkeypatch.setattr(email_service.smtplib, "SMTP", fail_smtp)

    with caplog.at_level(logging.ERROR, logger="uvicorn.error"):
        email_service.send_email("user@example.test", "Subject", "Body")

    assert "No se pudo enviar el correo a user@example.test" in caplog.text
    assert str(error) in caplog.text
