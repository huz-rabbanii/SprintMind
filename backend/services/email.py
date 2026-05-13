import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from config import settings


async def send_email(to: str, subject: str, html: str):
    if not settings.SMTP_USER:
        return  # email not configured

    msg = MIMEMultipart("alternative")
    msg["From"]    = settings.FROM_EMAIL or settings.SMTP_USER
    msg["To"]      = to
    msg["Subject"] = subject
    msg.attach(MIMEText(html, "html"))

    await aiosmtplib.send(
        msg,
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USER,
        password=settings.SMTP_PASSWORD,
        start_tls=True,
    )


async def send_verification_email(to: str, token: str):
    link = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    await send_email(
        to, "Verify your TaskFlow AI account",
        f'<p>Click <a href="{link}">here</a> to verify your email address.</p>'
        f'<p>Or copy this link: {link}</p>',
    )


async def send_password_reset_email(to: str, token: str):
    link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    await send_email(
        to, "Reset your TaskFlow AI password",
        f'<p>Click <a href="{link}">here</a> to reset your password. This link expires in 1 hour.</p>',
    )


async def send_invite_email(to: str, workspace_name: str, inviter_name: str):
    link = f"{settings.FRONTEND_URL}/accept-invite?email={to}"
    await send_email(
        to, f"You've been invited to {workspace_name} on TaskFlow AI",
        f'<p>{inviter_name} has invited you to join <strong>{workspace_name}</strong>.</p>'
        f'<p><a href="{link}">Accept invitation</a></p>',
    )
