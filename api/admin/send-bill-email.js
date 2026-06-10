const nodemailer = require('nodemailer');
const { verifyToken } = require('../_token');

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  // Token Verification
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authorization required. Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
  }

  const {
    id,
    customerName,
    customerPhone,
    customerEmail,
    machineType,
    serviceType,
    repairDescription,
    partsUsed,
    amount,
    paymentMethod,
    paymentStatus,
    serviceDate,
    technicianName,
    notes
  } = req.body;

  if (!customerEmail) {
    return res.status(400).json({ success: false, message: 'Customer Email is required to send mail.' });
  }

  try {
    // 1. SMTP Setup using Nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // 2. Format HTML Receipt Template
    const paymentBadgeColor = paymentStatus === 'Paid' ? '#2e7d32' : '#c62828';
    const paymentBadgeBg = paymentStatus === 'Paid' ? '#e8f5e9' : '#ffebee';

    const emailHtml = `
      <div style="font-family: 'Outfit', 'Helvetica Neue', Arial, sans-serif; color: #1e293b; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
        <!-- Header -->
        <div style="background: #0d47a1; color: #ffffff; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">Advanced AC Repair</h1>
          <p style="margin: 5px 0 0 0; font-size: 14px; color: #e1f5fe; font-weight: 500;">Invoice & Repair Receipt</p>
        </div>

        <!-- Body -->
        <div style="padding: 30px; background: #ffffff;">
          <!-- Table header layout (stable for Gmail) -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px; font-size: 14px;">
            <tr>
              <td>
                <span style="font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; margin-bottom: 4px;">Service Date</span>
                <strong style="color: #0d47a1; font-size: 15px;">${serviceDate}</strong>
              </td>
              <td align="right" style="vertical-align: bottom;">
                <span style="font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; margin-bottom: 4px; text-align: right;">Payment Status</span>
                <span style="display: inline-block; padding: 4px 12px; border-radius: 50px; font-size: 12px; font-weight: 700; color: ${paymentBadgeColor}; background-color: ${paymentBadgeBg}; text-transform: uppercase;">
                  ${paymentStatus}
                </span>
              </td>
            </tr>
          </table>

          <!-- Customer details -->
          <h3 style="margin-top: 0; color: #0d47a1; border-bottom: 2px solid #e1f5fe; padding-bottom: 8px;">Customer Information</h3>
          <table width="100%" cellpadding="6" cellspacing="0" style="margin-bottom: 20px; font-size: 14px;">
            <tr>
              <td width="35%" style="color: #64748b; font-weight: 600;">Customer Name:</td>
              <td style="font-weight: 700;">${customerName}</td>
            </tr>
            <tr>
              <td style="color: #64748b; font-weight: 600;">Phone Number:</td>
              <td>${customerPhone}</td>
            </tr>
            <tr>
              <td style="color: #64748b; font-weight: 600;">Email Address:</td>
              <td>${customerEmail}</td>
            </tr>
          </table>

          <!-- Job Details -->
          <h3 style="color: #0d47a1; border-bottom: 2px solid #e1f5fe; padding-bottom: 8px;">Service & Repair Details</h3>
          <table width="100%" cellpadding="6" cellspacing="0" style="margin-bottom: 20px; font-size: 14px;">
            <tr>
              <td width="35%" style="color: #64748b; font-weight: 600;">Machine Type:</td>
              <td><strong style="color: #1e293b;">${machineType}</strong></td>
            </tr>
            <tr>
              <td style="color: #64748b; font-weight: 600;">Service Provided:</td>
              <td><strong style="color: #1e293b;">${serviceType}</strong></td>
            </tr>
            <tr>
              <td style="color: #64748b; font-weight: 600; vertical-align: top;">Description:</td>
              <td style="color: #475569;">${repairDescription || 'Regular system maintenance & checkup.'}</td>
            </tr>
            <tr>
              <td style="color: #64748b; font-weight: 600;">Parts Used:</td>
              <td style="color: #475569;">${partsUsed || 'No parts replaced.'}</td>
            </tr>
            <tr>
              <td style="color: #64748b; font-weight: 600;">Technician Name:</td>
              <td style="color: #475569;">${technicianName || 'Certified Technician'}</td>
            </tr>
          </table>

          <!-- Pricing summary -->
          <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <table width="100%" cellpadding="4" cellspacing="0" style="font-size: 14px;">
              <tr>
                <td style="color: #64748b; font-weight: 600;">Payment Method:</td>
                <td align="right" style="font-weight: 700; color: #1e293b;">${paymentMethod}</td>
              </tr>
              <tr style="font-size: 18px; font-weight: 800; color: #0d47a1;">
                <td style="padding-top: 10px; border-top: 1px solid #e2e8f0;">Total Amount Paid:</td>
                <td align="right" style="padding-top: 10px; border-top: 1px solid #e2e8f0; color: #0d47a1;">₹ ${parseFloat(amount).toLocaleString('en-IN')}</td>
              </tr>
            </table>
          </div>

          ${notes ? `
            <div style="border-left: 3px solid #00b8d4; padding-left: 12px; margin-bottom: 20px; font-size: 13px; color: #64748b; font-style: italic;">
              <strong>Admin Note:</strong> ${notes}
            </div>
          ` : ''}

          <!-- PDF Download CTA Option -->
          ${id ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://advancedac.in/bill?id=${id}" target="_blank" style="background-color: #0d47a1; color: #ffffff; padding: 14px 28px; border-radius: 50px; font-weight: 700; text-decoration: none; font-size: 15px; display: inline-block; box-shadow: 0 4px 10px rgba(13, 71, 161, 0.25);">
                Download PDF Invoice
              </a>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b;">
                Or visit our website at <a href="https://advancedac.in/" style="color: #0d47a1; font-weight: 600; text-decoration: none;">https://advancedac.in/</a>
              </p>
            </div>
          ` : ''}
        </div>

        <!-- Footer -->
        <div style="background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0 0 5px 0; font-weight: 700;">Advanced AC Repair & Home Services</p>
          <p style="margin: 0 0 10px 0;">Surat, Gujarat, India | Call: +91 9005341723 | Web: <a href="https://advancedac.in/" style="color: #0d47a1; text-decoration: none; font-weight: 600;">https://advancedac.in/</a></p>
          <p style="margin: 0; font-size: 11px; color: #94a3b8;">This is a digitally generated invoice receipt. Thank you for your business!</p>
        </div>
      </div>
    `;

    // 3. Email Formatting
    const mailOptions = {
      from: `"Advanced AC Receipts" <${process.env.SMTP_USER}>`,
      to: customerEmail,
      subject: `Invoice receipt for ${machineType} repair - Advanced AC`,
      html: emailHtml,
    };

    // 4. Send Email
    const info = await transporter.sendMail(mailOptions);
    console.log('Invoice email sent: %s', info.messageId);

    return res.status(200).json({ success: true, message: 'Invoice email sent successfully!' });

  } catch (error) {
    console.error('SMTP Invoice Send Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send email due to server error. SMTP configuration might be invalid.' });
  }
};
