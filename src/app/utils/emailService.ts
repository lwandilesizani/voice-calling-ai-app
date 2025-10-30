// Email service for sending notifications
export class EmailService {
  // Instance method
  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    // Placeholder implementation
    console.log(`Sending email to ${to} with subject: ${subject}`);
    console.log(`Body: ${body}`);
    return true;
  }
  
  // Static method for use in the API route
  static async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    // Placeholder implementation
    console.log(`Sending email to ${to} with subject: ${subject}`);
    console.log(`Body: ${body}`);
    return true;
  }
} 