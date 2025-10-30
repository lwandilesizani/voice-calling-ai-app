import { Resend } from 'resend';

export class EmailService {
  private resend: Resend;

  constructor() {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendFollowUpEmail(lead: { 
    name: string;
    email: string;
    company?: string;
  }, status: 'no_answer' | 'not_interested') {
    const subject = status === 'no_answer' 
      ? 'Following up on our call attempt' 
      : 'Thank you for your time';

    const bookingLink = process.env.CALCOM_BOOKING_LINK || 'https://cal.com/your-booking-link';
    
    const message = status === 'no_answer'
      ? `Hi ${lead.name},\n\n`
        + `We tried to reach you today regarding your interest in our AI voice solutions. `
        + `Since we couldn't connect, I wanted to make it easy for you to schedule a demo at your convenience.\n\n`
        + `You can book a time directly here: ${bookingLink}\n\n`
        + `Best regards,\nAI Dialer Team`
      : `Hi ${lead.name},\n\n`
        + `Thank you for taking the time to speak with us today. While the timing might not be right now, `
        + `we'd love to keep in touch and share updates about our platform that might benefit `
        + `${lead.company ? lead.company : 'your company'} in the future.\n\n`
        + `If you change your mind, you can always book a demo at: ${bookingLink}\n\n`
        + `Best regards,\nAI Dialer Team`;

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'team@wecallsmart.com';
    const fromName = process.env.RESEND_FROM_NAME || 'WeCallSmart';

    return await this.resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: lead.email,
      subject,
      text: message,
    });
  }
}
