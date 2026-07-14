# backend/app/services/email_srv.py
"""
Async email service using aiosmtplib.

Compatible with:
  - Gmail SMTP           (SMTP_HOST=smtp.gmail.com, port=587, start_tls=True)
  - SendGrid SMTP relay  (SMTP_HOST=smtp.sendgrid.net, SMTP_USER=apikey, SMTP_PASSWORD=<API_KEY>)
  - Resend SMTP relay    (SMTP_HOST=smtp.resend.com,   SMTP_USER=resend,  SMTP_PASSWORD=<API_KEY>)

All config comes from app.core.config.settings — no credentials here.
"""
import logging
import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# HTML email template
# ---------------------------------------------------------------------------

def _build_verification_email(to_email: str, code: str) -> MIMEMultipart:
    """Constructs the MIME message with an HTML body."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Verifica il tuo account — Scuola Guida"
    msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
    msg["To"] = to_email

    html_body = f"""
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:12px;overflow:hidden;
                      box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);
                        padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;
                          letter-spacing:-0.5px;">🚗 Scuola Guida</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">
                Piattaforma di formazione alla guida
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 12px;color:#1e1b4b;font-size:20px;font-weight:600;">
                Verifica il tuo indirizzo email
              </h2>
              <p style="margin:0 0 28px;color:#52525b;font-size:15px;line-height:1.6;">
                Benvenuto! Usa il codice seguente per completare la registrazione.
                Il codice è valido per <strong>10 minuti</strong>.
              </p>

              <!-- OTP Code Box -->
              <div style="background:#f0f0ff;border:2px solid #4f46e5;border-radius:12px;
                           text-align:center;padding:24px 0;margin-bottom:28px;">
                <span style="font-size:40px;font-weight:800;letter-spacing:12px;
                              color:#4f46e5;font-family:'Courier New',monospace;">
                  {code}
                </span>
              </div>

              <p style="margin:0 0 8px;color:#71717a;font-size:13px;line-height:1.6;">
                Se non hai richiesto questo codice, ignora questa email.
                Il tuo account non sarà attivato.
              </p>
              <p style="margin:0;color:#a1a1aa;font-size:12px;">
                Per motivi di sicurezza, non condividere questo codice con nessuno.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#fafafa;border-top:1px solid #e4e4e7;
                        padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#a1a1aa;font-size:12px;">
                © 2026 Scuola Guida. Tutti i diritti riservati.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

    msg.attach(MIMEText(html_body, "html", "utf-8"))
    return msg


# ---------------------------------------------------------------------------
# Public send function
# ---------------------------------------------------------------------------

async def send_verification_email(to_email: str, code: str) -> None:
    print(f"--- HEARTBEAT: Background task triggered for {to_email} ---")
    """
    Sends the 6-digit OTP verification email.

    Called as a FastAPI BackgroundTask from the signup and resend-code endpoints,
    so the HTTP response is not blocked by the SMTP round-trip.

    Failures are caught and logged — the client already received a 201/200 response
    and BackgroundTask exceptions would otherwise be silently discarded.
    """
    if not settings.SMTP_HOST:
        # Local dev guard: skip sending if SMTP is not configured.
        # Log the code to the console so dev can still test the verify endpoint.
        logger.warning("[email_srv] SMTP not configured. OTP for %s: %s", to_email, code)
        return

    logger.info("[email_srv] Sending verification email to %s via %s:%s",
                to_email, settings.SMTP_HOST, settings.SMTP_PORT)

    msg = _build_verification_email(to_email, code)

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=True,
        )
        logger.info("[email_srv] Verification email delivered to %s", to_email)
    except aiosmtplib.SMTPException as exc:
        logger.error(
            "[email_srv] SMTP error sending to %s: %s",
            to_email, exc, exc_info=True,
        )
        raise  # Re-raise so FastAPI logs the full background task traceback
    except Exception as exc:
        logger.error(
            "[email_srv] Unexpected error sending to %s: %s",
            to_email, exc, exc_info=True,
        )
        raise
