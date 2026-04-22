// src/services/email.service.ts
import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

// Simple nodemailer transporter (works with SendGrid SMTP or any SMTP)
// For SendGrid: set SMTP_HOST=smtp.sendgrid.net, SMTP_USER=apikey, SMTP_PASS=<api-key>
function createTransport() {
  if (!env.sendgridApiKey) {
    // Dev fallback: log emails to console
    return null;
  }
  return nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    auth: {
      user: 'apikey',
      pass: env.sendgridApiKey,
    },
  });
}

const transport = createTransport();

interface InviteEmailParams {
  to: string;
  candidateName: string;
  jobTitle: string;
  companyName: string;
  interviewLink: string;
  expiryDate: Date;
}

export async function sendInterviewInvite(params: InviteEmailParams): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  <div style="background: #0f172a; padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">NexHire</h1>
    <p style="color: #94a3b8; margin: 4px 0 0;">AI-Powered Interviews</p>
  </div>
  
  <div style="background: #f8fafc; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
    <h2 style="margin: 0 0 16px; font-size: 20px;">Interview Invitation</h2>
    <p>Hi ${params.candidateName},</p>
    <p>You've been invited to interview for the <strong>${params.jobTitle}</strong> position at <strong>${params.companyName}</strong>.</p>
    <p>This is an AI-powered video interview. You'll answer questions at your own pace — no scheduling needed.</p>
    
    <div style="margin: 32px 0; text-align: center;">
      <a href="${params.interviewLink}" 
         style="background: #3b82f6; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
        Start Interview →
      </a>
    </div>
    
    <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0 0 8px; font-weight: 600; font-size: 14px;">Before you start:</p>
      <ul style="margin: 0; padding-left: 20px; color: #64748b; font-size: 14px;">
        <li>Find a quiet place with good lighting</li>
        <li>Ensure your webcam and microphone work</li>
        <li>Use Chrome or Edge for best experience</li>
        <li>Allow 30-45 minutes to complete</li>
      </ul>
    </div>
    
    <p style="color: #64748b; font-size: 14px;">
      This link expires on <strong>${params.expiryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
    </p>
    <p style="color: #64748b; font-size: 14px;">
      If you have any issues, reply to this email.
    </p>
  </div>
</body>
</html>`;

  if (!transport) {
    // Dev mode: log to console
    logger.info('[Email] Interview invite (dev mode - not sent):', {
      to: params.to,
      subject: `Interview Invitation: ${params.jobTitle} at ${params.companyName}`,
      link: params.interviewLink,
    });
    return;
  }

  await transport.sendMail({
    from: `NexHire <${env.emailFrom}>`,
    to: params.to,
    subject: `Interview Invitation: ${params.jobTitle} at ${params.companyName}`,
    html,
  });

  logger.info(`[Email] Invite sent to ${params.to}`);
}
