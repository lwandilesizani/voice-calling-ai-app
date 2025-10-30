// Google API configuration
export const googleConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
  calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
}; 