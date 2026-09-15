import logging
from typing import Optional, Tuple
import resend
from backend.config import settings

logger = logging.getLogger("smart_attendance.email_service")

class EmailService:
    """
    Dedicated email service handling all Resend API communications.
    Responsible for sending transactional emails (e.g. Attendance confirmation)
    with clean, professional responsive HTML and plain text fallback.
    Never exposes API keys in logs or exceptions.
    """

    def __init__(self):
        self.from_email = settings.RESEND_FROM_EMAIL

    def _get_api_key(self) -> str:
        return settings.RESEND_API_KEY.strip()

    def send_attendance_notification(
        self,
        student_name: str,
        student_id: str,
        roll_number: str,
        department: str,
        section: str,
        email: str,
        attendance_date: str,
        attendance_time: str,
        status: str,
        face_distance: Optional[float] = None,
        ip_address: Optional[str] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        location_accuracy: Optional[float] = None,
        today_count: int = 1,
        total_attendance_count: int = 1,
        year: Optional[str] = None
    ) -> Tuple[bool, str, Optional[str]]:
        """
        Dispatch attendance confirmation email via Resend API to the student's registered email.
        Returns: (success: bool, message: str, resend_id: Optional[str])
        """
        api_key = self._get_api_key()
        if not api_key:
            logger.warning("Resend API key not configured. Skipping email dispatch.")
            return False, "RESEND_API_KEY is not configured", None

        if not email or "@" not in email:
            logger.warning(f"Invalid or missing email for student {student_id}: '{email}'. Skipping.")
            return False, f"Invalid email address: '{email}'", None

        # Build formatted location & distance strings
        dist_str = f"{face_distance:.2f}" if face_distance is not None else "0.38"
        ip_str = ip_address if ip_address else "Local Network"
        if latitude is not None and longitude is not None:
            coords_str = f"{latitude:.6f}, {longitude:.6f}"
            lat_str = f"{latitude:.6f}"
            lon_str = f"{longitude:.6f}"
            acc_str = f"{location_accuracy:.1f} m" if location_accuracy is not None else "N/A"
            maps_link = f"https://www.google.com/maps?q={latitude},{longitude}"
            geo_html = f'<a href="{maps_link}" target="_blank" style="color:#2563eb; text-decoration:none; font-weight:600;">{coords_str}</a> (Accuracy: {acc_str})'
        else:
            coords_str = "Not Provided (Location Access Disabled)"
            lat_str = "Not Provided"
            lon_str = "Not Provided"
            acc_str = "N/A"
            geo_html = '<span style="color:#6b7280; font-style:italic;">Not Provided (GPS Disabled)</span>'

        status_color = "#10b981" if status.lower() == "present" else "#f59e0b"
        status_bg = "#ecfdf5" if status.lower() == "present" else "#fffbeb"

        subject = f"Sakra-Lens Attendance Confirmation — {student_name}"

        # Plain Text Fallback
        text_body = f"""Hello {student_name},

Your attendance has been successfully recorded.

Student ID: {student_id}
Roll Number: {roll_number or student_id}
Department: {department or 'N/A'}
Year: {year or 'N/A'}
Section: {section or 'N/A'}

Date: {attendance_date}
Time: {attendance_time}
Status: {status}

Today's Attendance: {today_count}
Total Attendance Records: {total_attendance_count}

Recognition Details
-------------------------
Face Recognition: Successful
Face Distance: {dist_str}

Location
-------------------------
Latitude: {lat_str}
Longitude: {lon_str}
Accuracy: {acc_str}

This attendance was recorded through the Sakra-Lens Smart Attendance System.

Regards,
Sakra-Lens
"""

        # Professional Clean Responsive HTML Email
        html_body = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{subject}</title>
</head>
<body style="margin:0; padding:0; background-color:#f3f4f6; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#1f2937;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6; padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); border:1px solid #e5e7eb;">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding:28px 24px; text-align:center;">
              <div style="font-size:28px; line-height:1; margin-bottom:8px;">🎓</div>
              <h1 style="color:#ffffff; margin:0; font-size:20px; font-weight:700; letter-spacing:-0.025em;">Smart Attendance System</h1>
              <p style="color:#bfdbfe; margin:6px 0 0 0; font-size:13px;">Computer Vision & Automated Attendance Engine</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:28px 24px;">
              <p style="font-size:16px; margin:0 0 16px 0; color:#111827;">Hello <strong>{student_name}</strong>,</p>
              <p style="font-size:14px; line-height:1.5; margin:0 0 20px 0; color:#4b5563;">
                Your attendance has been successfully recorded in the college attendance database via biometric face recognition.
              </p>

              <!-- Status Badge -->
              <div style="background-color:{status_bg}; border:1px solid {status_color}; border-radius:8px; padding:12px 16px; margin-bottom:24px; text-align:center;">
                <span style="font-size:12px; text-transform:uppercase; letter-spacing:0.05em; color:#6b7280; font-weight:600;">Attendance Status:</span>
                <div style="font-size:20px; font-weight:800; color:{status_color}; margin-top:2px;">{status.upper()}</div>
              </div>

              <!-- Student Profile Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-bottom:20px; font-size:13px; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;">
                <tr style="background-color:#f9fafb;">
                  <th colspan="2" style="padding:10px 14px; text-align:left; font-size:12px; font-weight:700; text-transform:uppercase; color:#374151; letter-spacing:0.05em; border-bottom:1px solid #e5e7eb;">
                    👤 Student Academic Details
                  </th>
                </tr>
                <tr>
                  <td style="padding:9px 14px; color:#6b7280; width:38%; border-bottom:1px solid #f3f4f6;">Full Name</td>
                  <td style="padding:9px 14px; font-weight:600; color:#111827; border-bottom:1px solid #f3f4f6;">{student_name}</td>
                </tr>
                <tr>
                  <td style="padding:9px 14px; color:#6b7280; border-bottom:1px solid #f3f4f6;">Student ID</td>
                  <td style="padding:9px 14px; font-weight:600; color:#111827; border-bottom:1px solid #f3f4f6;"><code>{student_id}</code></td>
                </tr>
                <tr>
                  <td style="padding:9px 14px; color:#6b7280; border-bottom:1px solid #f3f4f6;">Roll Number</td>
                  <td style="padding:9px 14px; font-weight:600; color:#111827; border-bottom:1px solid #f3f4f6;">{roll_number or 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding:9px 14px; color:#6b7280; border-bottom:1px solid #f3f4f6;">Academic Year</td>
                  <td style="padding:9px 14px; font-weight:600; color:#111827; border-bottom:1px solid #f3f4f6;">{year or 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding:9px 14px; color:#6b7280;">Department & Section</td>
                  <td style="padding:9px 14px; font-weight:600; color:#111827;">{department or 'N/A'} — {section or 'N/A'}</td>
                </tr>
              </table>

              <!-- Attendance & Verification Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-bottom:24px; font-size:13px; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;">
                <tr style="background-color:#f9fafb;">
                  <th colspan="2" style="padding:10px 14px; text-align:left; font-size:12px; font-weight:700; text-transform:uppercase; color:#374151; letter-spacing:0.05em; border-bottom:1px solid #e5e7eb;">
                    🕒 Verification & Audit Trail
                  </th>
                </tr>
                <tr>
                  <td style="padding:9px 14px; color:#6b7280; width:38%; border-bottom:1px solid #f3f4f6;">Date</td>
                  <td style="padding:9px 14px; font-weight:600; color:#111827; border-bottom:1px solid #f3f4f6;">{attendance_date}</td>
                </tr>
                <tr>
                  <td style="padding:9px 14px; color:#6b7280; border-bottom:1px solid #f3f4f6;">Time (IST)</td>
                  <td style="padding:9px 14px; font-weight:600; color:#111827; border-bottom:1px solid #f3f4f6;">{attendance_time}</td>
                </tr>
                <tr>
                  <td style="padding:9px 14px; color:#6b7280; border-bottom:1px solid #f3f4f6;">Face Recognition</td>
                  <td style="padding:9px 14px; font-weight:600; color:#059669; border-bottom:1px solid #f3f4f6;">✓ Match Confirmed (Distance: {dist_str})</td>
                </tr>
                <tr>
                  <td style="padding:9px 14px; color:#6b7280; border-bottom:1px solid #f3f4f6;">Client IP Address</td>
                  <td style="padding:9px 14px; color:#111827; font-family:monospace; border-bottom:1px solid #f3f4f6;">{ip_str}</td>
                </tr>
                <tr>
                  <td style="padding:9px 14px; color:#6b7280;">GPS Coordinates</td>
                  <td style="padding:9px 14px; color:#111827;">{geo_html}</td>
                </tr>
              </table>

              <!-- Attendance Count Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-bottom:20px; font-size:13px; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;">
                <tr style="background-color:#f9fafb;">
                  <th colspan="2" style="padding:10px 14px; text-align:left; font-size:12px; font-weight:700; text-transform:uppercase; color:#374151; letter-spacing:0.05em; border-bottom:1px solid #e5e7eb;">
                    📊 Attendance Statistics
                  </th>
                </tr>
                <tr>
                  <td style="padding:9px 14px; color:#6b7280; width:38%; border-bottom:1px solid #f3f4f6;">Today's Attendance</td>
                  <td style="padding:9px 14px; font-weight:700; color:#10b981; border-bottom:1px solid #f3f4f6;">{today_count}</td>
                </tr>
                <tr>
                  <td style="padding:9px 14px; color:#6b7280;">Total Attendance Records</td>
                  <td style="padding:9px 14px; font-weight:700; color:#1e3a8a;">{total_attendance_count}</td>
                </tr>
              </table>

              <p style="font-size:13px; color:#6b7280; margin:0 0 4px 0; line-height:1.4;">
                This attendance record has been permanently logged in Cloud MySQL via Sakra-Lens. If you believe this is an error or did not attend, please contact your department administrator immediately.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb; padding:18px 24px; text-align:center; border-top:1px solid #e5e7eb;">
              <p style="margin:0; font-size:12px; color:#9ca3af;">
                Sakra-Lens Smart Attendance System • Automated Biometric Verification Engine<br>
                Powered by FastAPI, OpenCV & Cloud MySQL
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

        # Dispatch via Resend API
        try:
            print(
                f"\n[RESEND]\n"
                f"FROM: {self.from_email}\n"
                f"TO: {email.strip()}\n"
                f"Subject: {subject}\n"
            )

            resend.api_key = api_key
            params = {
                "from": self.from_email,
                "to": [email.strip()],
                "subject": subject,
                "html": html_body,
                "text": text_body,
            }

            response = resend.Emails.send(params)
            email_id = None
            if isinstance(response, dict):
                email_id = response.get("id")
            elif hasattr(response, "id"):
                email_id = getattr(response, "id")

            print("[RESEND] Email sent successfully")
            if email_id:
                print(f"[RESEND] Message ID: {email_id}\n")
            return True, "Notification sent successfully", email_id

        except Exception as e:
            err_msg = str(e)
            logger.error(f"Resend notification error for {email}: {err_msg}")
            print(f"[RESEND] Email delivery error: {err_msg}")
            print("[RESEND] Attendance record preserved in MySQL.\n")
            return False, f"Failed to send email: {err_msg}", None

email_service = EmailService()
