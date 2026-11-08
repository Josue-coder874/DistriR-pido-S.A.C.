from sqlalchemy.orm import Session

from app.models import AuditLog, User


def record_audit(
    db: Session,
    action: str,
    module: str,
    result: str,
    user: User | None = None,
    email: str | None = None,
) -> None:
    db.add(
        AuditLog(
            user_id=user.id if user else None,
            email=email or (user.email if user else None),
            action=action,
            module=module,
            result=result,
        )
    )
    db.commit()
