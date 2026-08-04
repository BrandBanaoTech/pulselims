export interface LabConfig {
  name: string;
  address: string;
  email: string;
  phone: string;
  regNo: string;
  doctorName: string;
  doctorDegree: string;
  logoUrl?: string;
  signatureUrl?: string;
  reportTemplate?: 'classic' | 'modern' | 'minimal';
  primaryColor?: string;
  fontStyle?: 'sans' | 'serif';
  tagline?: string;
  nablNumber?: string;
  // Notification fields
  notifyEnabled?: boolean;
  notifyChannel?: 'twilio' | 'emailjs' | 'whatsapp';
  twilioSid?: string;
  twilioToken?: string;
  twilioFrom?: string;
  emailjsSrcId?: string;
  emailjsTempId?: string;
  emailjsKey?: string;
}