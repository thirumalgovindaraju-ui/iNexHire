// src/services/whatsapp.service.ts
// SIMULATION by default — real sends require TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/
// TWILIO_WHATSAPP_NUMBER env vars. Without them, every send is logged to
// WhatsAppLog with isSimulated:true and never reaches a real phone number.
import { prisma } from '../config/db';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export type WhatsAppMessageType = 'INVITE' | 'REMINDER' | 'RESULT' | 'OFFER' | 'CUSTOM';

interface TemplateParams {
  name: string;
  role: string;
  company: string;
  link?: string;
}

const TEMPLATES: Record<Exclude<WhatsAppMessageType, 'CUSTOM'>, (p: TemplateParams) => string> = {
  INVITE: (p) => `Hi ${p.name}! You have been invited to interview for ${p.role} at ${p.company}. Click here to start: ${p.link}. Valid for 7 days.`,
  REMINDER: (p) => `Hi ${p.name}! Reminder: Your interview for ${p.role} expires in 24 hours. Start now: ${p.link}`,
  RESULT: (p) => `Hi ${p.name}! Your interview for ${p.role} has been evaluated. The recruiter will be in touch soon.`,
  OFFER: (p) => `Congratulations ${p.name}! You have received an offer for ${p.role}. Please check your email for details.`,
};

export function renderWhatsAppTemplate(messageType: Exclude<WhatsAppMessageType, 'CUSTOM'>, params: TemplateParams): string {
  return TEMPLATES[messageType](params);
}

function isTwilioConfigured(): boolean {
  return Boolean(env.twilioAccountSid && env.twilioAuthToken && env.twilioWhatsAppNumber);
}

async function sendViaTwilio(toPhone: string, body: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${env.twilioAccountSid}/Messages.json`;
    const auth = Buffer.from(`${env.twilioAccountSid}:${env.twilioAuthToken}`).toString('base64');
    const form = new URLSearchParams({
      From: env.twilioWhatsAppNumber,
      To: `whatsapp:${toPhone}`,
      Body: body,
    });

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, error: `Twilio ${res.status}: ${text.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (err) {
    logger.error('[whatsapp.service] sendViaTwilio failed:', err);
    return { ok: false, error: (err as Error).message };
  }
}

interface SendWhatsAppParams {
  candidateId: string;
  phone: string;
  messageType: WhatsAppMessageType;
  candidateName: string;
  role: string;
  company: string;
  link?: string;
  customMessage?: string;
}

export async function sendWhatsApp(params: SendWhatsAppParams) {
  const { candidateId, phone, messageType, customMessage } = params;

  const message = messageType === 'CUSTOM'
    ? (customMessage ?? '')
    : renderWhatsAppTemplate(messageType, {
        name: params.candidateName,
        role: params.role,
        company: params.company,
        link: params.link,
      });

  const simulated = !isTwilioConfigured();
  let status: 'SENT' | 'DELIVERED' | 'FAILED' | 'SIMULATED';

  if (simulated) {
    status = 'SIMULATED';
    logger.info(`[whatsapp.service] SIMULATED WhatsApp to ${phone}: ${message}`);
  } else {
    const result = await sendViaTwilio(phone, message);
    status = result.ok ? 'SENT' : 'FAILED';
    if (!result.ok) {
      logger.error(`[whatsapp.service] WhatsApp send failed to ${phone}: ${result.error}`);
    }
  }

  const log = await prisma.whatsAppLog.create({
    data: {
      candidateId,
      phone,
      messageType,
      status,
      message,
      isSimulated: simulated,
    },
  });

  return { log, simulated };
}
