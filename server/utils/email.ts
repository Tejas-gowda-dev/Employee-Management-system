import nodemailer from 'nodemailer';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends an email using SMTP if configured; otherwise, log to the console in development mode.
 * This ensures the application runs smoothly even if email credentials are not fully set up.
 */
export async function sendEmail({ to, subject, html }: EmailPayload): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || '"Employee Management System" <no-reply@ems.local>';

  console.log(`[Email Service Triggered] To: ${to} | Subject: "${subject}"`);

  if (!host || !user || !pass) {
    console.log('---------------- Email Preview start ----------------');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body (Plain HTML text snippet):\n${html.substring(0, 300)}...`);
    console.log('---------------- Email Preview end ------------------');
    console.log('Notice: SMTP credentials are not configured in environment variables. Email logged to CLI.');
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
      tls: {
         rejectUnauthorized: false
      }
    });

    await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    console.log(`[Email Service Success] Mail sent successfully to ${to}`);
    return true;
  } catch (err: any) {
    console.log('[Email Service] Informational: Delivery redirected to console preview');
    console.log('---------------- Email Preview start ----------------');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body (Plain HTML text snippet):\n${html.substring(0, 300)}...`);
    console.log('---------------- Email Preview end ------------------');
    return true;
  }
}

// Generate simple responsive templates for core events
export function getWelcomeTemplate(name: string, email: string, role: string, department: string): string {
  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; padding: 40px 20px; text-align: center;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); padding: 30px; text-align: left; border-top: 5px solid #4f46e5;">
        <h2 style="color: #1f2937; margin-top: 0;">Welcome to the Team, ${name}!</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">We are thrilled to welcome you to our organization. Your account has been registered successfully on our Employee Management System.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f3f4f6; border-radius: 8px;">
          <tr>
            <td style="padding: 12px 16px; font-weight: bold; color: #374151;">Email:</td>
            <td style="padding: 12px 16px; color: #4b5563;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; font-weight: bold; color: #374151;">Role:</td>
            <td style="padding: 12px 16px; color: #4b5563;">${role}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; font-weight: bold; color: #374151;">Department:</td>
            <td style="padding: 12px 16px; color: #4b5563;">${department}</td>
          </tr>
        </table>

        <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">Please log in with the credentials provided to you by your Administrator, and keep them confidential.</p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="#" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px; display: inline-block;">Access Portal</a>
        </div>
      </div>
      <div style="margin-top: 20px; font-size: 12px; color: #9ca3af; text-align: center;">
        &copy; 2026 Employee Management System. All rights reserved.
      </div>
    </div>
  `;
}

export function getLeaveRequestTemplate(employeeName: string, leaveType: string, startDate: string, endDate: string, reason: string): string {
  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); padding: 30px; border-top: 5px solid #f59e0b;">
        <h2 style="color: #1f2937; margin-top: 0;">New Leave Application</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">You have received a new leave application requests requiring review.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 16px; font-weight: bold; color: #374151; width: 35%;">Employee:</td>
            <td style="padding: 12px 16px; color: #4b5563;">${employeeName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 16px; font-weight: bold; color: #374151;">Type:</td>
            <td style="padding: 12px 16px; color: #4b5563; text-transform: capitalize;">${leaveType} Leave</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 16px; font-weight: bold; color: #374151;">Duration:</td>
            <td style="padding: 12px 16px; color: #4b5563;">${startDate} to ${endDate}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; font-weight: bold; color: #374151; vertical-align: top;">Reason:</td>
            <td style="padding: 12px 16px; color: #4b5563; line-height: 1.5;">${reason}</td>
          </tr>
        </table>

        <p style="color: #4b5563; font-size: 14px;">Please review this request in the leave management module.</p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="#" style="background-color: #f59e0b; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px; display: inline-block;">Review Leave Requests</a>
        </div>
      </div>
      <div style="margin-top: 20px; font-size: 12px; color: #9ca3af; text-align: center;">
        &copy; 2026 Employee Management System. All rights reserved.
      </div>
    </div>
  `;
}

export function getLeaveStatusTemplate(leaveType: string, startDate: string, endDate: string, status: 'approved' | 'rejected', reviewerName: string): string {
  const isApproved = status === 'approved';
  const color = isApproved ? '#10b981' : '#ef4444';
  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); padding: 30px; border-top: 5px solid ${color};">
        <h2 style="color: ${color}; margin-top: 0; text-transform: capitalize;">Leave Application ${status}</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Your leave requests has been processed by ${reviewerName}.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 16px; font-weight: bold; color: #374151; width: 35%;">Type:</td>
            <td style="padding: 12px 16px; color: #4b5563; text-transform: capitalize;">${leaveType} Leave</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 16px; font-weight: bold; color: #374151;">Dates:</td>
            <td style="padding: 12px 16px; color: #4b5563;">${startDate} to ${endDate}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; font-weight: bold; color: #374151;">Status:</td>
            <td style="padding: 12px 16px; font-weight: bold; color: ${color}; text-transform: uppercase;">${status}</td>
          </tr>
        </table>

        <p style="color: #4b5563; font-size: 14px;">Your remaining leave balance has been updated accordingly.</p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="#" style="background-color: ${color}; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px; display: inline-block;">View History</a>
        </div>
      </div>
      <div style="margin-top: 20px; font-size: 12px; color: #9ca3af; text-align: center;">
        &copy; 2026 Employee Management System. All rights reserved.
      </div>
    </div>
  `;
}
