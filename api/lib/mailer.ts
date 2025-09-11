import type { Transporter } from 'nodemailer';

type MailOptions = {
  to: string;
  subject: string;
  html: string;
};

let transporterPromise: Promise<Transporter | null> | null = null;

async function getTransporter(): Promise<Transporter | null> {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
      console.warn('[MAILER] SMTP não configurado. Emails serão ignorados.');
      return null;
    }
    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: SMTP_SECURE === 'true',
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      });
      return transporter;
    } catch (e) {
      console.warn('[MAILER] Falha ao carregar nodemailer. Emails serão ignorados.');
      return null;
    }
  })();

  return transporterPromise;
}

export async function sendEmail(options: MailOptions): Promise<boolean> {
  const transporter = await getTransporter();
  if (!transporter) return false;
  try {
    const from = process.env.MAIL_FROM || process.env.SMTP_FROM || 'no-reply@memora.music';
    await transporter.sendMail({ from, ...options });
    return true;
  } catch (e) {
    console.warn('[MAILER] Falha ao enviar email:', e);
    return false;
  }
}

