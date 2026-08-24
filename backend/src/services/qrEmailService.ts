import QRCode from 'qrcode';
import nodemailer from 'nodemailer';
import { config } from '../config';

let testAccountTransporter: nodemailer.Transporter | null = null;

const getTransporter = async () => {
  if (config.smtpUser && config.smtpPass) {
    return nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    });
  }

  if (!testAccountTransporter) {
    try {
      const testAccount = await nodemailer.createTestAccount();
      testAccountTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log('[Email] Created Ethereal test account:', testAccount.user);
    } catch (err) {
      console.warn('[Email] Falling back to console logger.');
    }
  }
  return testAccountTransporter;
};

export const generateQRCodeDataUrl = async (payload: object): Promise<string> => {
  try {
    const jsonString = JSON.stringify(payload);
    return await QRCode.toDataURL(jsonString, {
      errorCorrectionLevel: 'H',
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (error) {
    console.error('Error generating QR Code:', error);
    throw new Error('Failed to generate QR Code');
  }
};

export const sendBookingConfirmationEmail = async (bookingDetails: {
  customerEmail: string;
  customerName: string;
  bookingRef: string;
  eventTitle: string;
  venueName: string;
  showtime: string;
  seats: string[];
  totalAmount: number;
  qrCodeDataUrl: string;
}) => {
  try {
    const transporter = await getTransporter();
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 20px; border-radius: 8px; color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">??? Booking Confirmed!</h1>
          <p style="margin: 4px 0 0; opacity: 0.9;">Ref: <strong>${bookingDetails.bookingRef}</strong></p>
        </div>
        <div style="padding: 20px 0;">
          <p>Hi <strong>${bookingDetails.customerName}</strong>,</p>
          <p>Your seats are confirmed for <strong>${bookingDetails.eventTitle}</strong>.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; color: #64748b;">Venue</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${bookingDetails.venueName}</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; color: #64748b;">Showtime</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${bookingDetails.showtime}</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; color: #64748b;">Seats</td><td style="padding: 8px 0; font-weight: 600; text-align: right; color: #4f46e5;">${bookingDetails.seats.join(', ')}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">Total Paid</td><td style="padding: 8px 0; font-weight: 700; text-align: right; font-size: 18px;">$${bookingDetails.totalAmount.toFixed(2)}</td></tr>
          </table>
          <div style="text-align: center; margin: 24px 0; padding: 16px; background: #f8fafc; border-radius: 8px;">
            <p style="margin-bottom: 8px; font-weight: 600; color: #334155;">Show this QR Code at the entry gate:</p>
            <img src="${bookingDetails.qrCodeDataUrl}" alt="Booking QR Code" style="width: 180px; height: 180px; border-radius: 8px; border: 1px solid #cbd5e1;" />
          </div>
        </div>
      </div>
    `;

    if (transporter) {
      const info = await transporter.sendMail({
        from: '"SeatSwift Tickets" <no-reply@seatswift.com>',
        to: bookingDetails.customerEmail,
        subject: `Booking Confirmed: ${bookingDetails.eventTitle} [${bookingDetails.bookingRef}]`,
        html: htmlContent,
      });
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`[Email Sent] Message ID: ${info.messageId}`);
      if (previewUrl) console.log(`[Email Preview Link]: ${previewUrl}`);
      return { success: true, previewUrl };
    } else {
      console.log(`[Email Simulated] Sent to ${bookingDetails.customerEmail} for Ref ${bookingDetails.bookingRef}`);
      return { success: true, previewUrl: null };
    }
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
    return { success: false, error };
  }
};

export const sendWaitlistOfferEmail = async (details: {
  customerEmail: string;
  customerName: string;
  eventTitle: string;
  showtime: string;
  category: string;
  seatNumber: string;
  claimToken: string;
  offerExpiresAt: Date;
}) => {
  try {
    const transporter = await getTransporter();
    const claimUrl = `${config.clientUrl}/waitlist/claim/${details.claimToken}`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 20px; border-radius: 8px; color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">?? Seat Available from Waitlist!</h1>
        </div>
        <div style="padding: 20px 0;">
          <p>Hi <strong>${details.customerName}</strong>,</p>
          <p>A seat in <strong>${details.category}</strong> (Seat <strong>${details.seatNumber}</strong>) has opened up for <strong>${details.eventTitle}</strong>.</p>
          <p>Reserved exclusively for you until: <strong>${details.offerExpiresAt.toLocaleTimeString()}</strong>.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${claimUrl}" style="background: #059669; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; display: inline-block;">
              Claim & Book Seat Now ?
            </a>
          </div>
          <p style="font-size: 13px; color: #ef4444; text-align: center;">
            ?? If not claimed within the deadline, this seat will be automatically passed to the next person in line.
          </p>
        </div>
      </div>
    `;

    if (transporter) {
      const info = await transporter.sendMail({
        from: '"SeatSwift Waitlist" <waitlist@seatswift.com>',
        to: details.customerEmail,
        subject: `Seat Available! Claim your ticket for ${details.eventTitle}`,
        html: htmlContent,
      });
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`[Waitlist Email Sent] Preview: ${previewUrl}`);
      return { success: true, previewUrl };
    }
  } catch (error) {
    console.error('Failed to send waitlist email:', error);
  }
};
