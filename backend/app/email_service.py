import smtplib
from email.message import EmailMessage

SMTP_EMAIL = "greggarrido574@gmail.com"
SMTP_PASSWORD = "oxwy vyqo mmfq vera"

def send_email(to_email: str, subject: str, body: str):
    msg = EmailMessage()
    msg["From"] = SMTP_EMAIL
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
        smtp.login(SMTP_EMAIL, SMTP_PASSWORD)
        smtp.send_message(msg)
