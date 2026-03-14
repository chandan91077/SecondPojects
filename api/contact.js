const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { name, phone, serviceType, message } = req.body;

  // Basic validation
  if (!name || !phone || !serviceType) {
    return res.status(400).json({ message: 'Missing required fields (Name, Phone, Service Type).' });
  }

  try {
    // 1. SMTP Setup using Nodemailer
    // IMPORTANT: Make sure to set these Environment Variables in your hosting platform (e.g. Vercel)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || '[Your SMTP Host]',
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : parseInt('[Your Port]', 10) || 587,
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER || '[Your Email]',
        pass: process.env.SMTP_PASS || '[Your Password]',
      },
    });

    // 2. Email Formatting
    const mailOptions = {
      from: `"AC Repair Bookings" <${process.env.SMTP_USER || '[Your Email]'}>`,
      to: process.env.CONTACT_RECEIVER || 'yadavbrahamdev635@gmail.com',
      subject: `New Service Request: ${serviceType}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <h2 style="color: #0D47A1;">New Booking Request</h2>
            <hr />
            <table width="100%" cellpadding="5">
                <tr><td width="30%"><strong>Name:</strong></td><td>${name}</td></tr>
                <tr><td><strong>Phone:</strong></td><td>${phone}</td></tr>
                <tr><td><strong>Service Type:</strong></td><td>${serviceType}</td></tr>
            </table>
            <br />
            <strong>Additional Message:</strong>
            <p style="background: #f4f4f4; padding: 10px; border-radius: 5px;">${message || 'No additional details provided.'}</p>
        </div>
      `,
    };

    // 3. Send Email
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);

    // 4. Return Success
    return res.status(200).json({ message: 'Email sent successfully!' });

  } catch (error) {
    console.error('SMTP Error:', error);
    return res.status(500).json({ message: 'Failed to send email due to a server error. Please check your SMTP configuration.' });
  }
};
