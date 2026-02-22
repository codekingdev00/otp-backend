const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

// ✅ IMPORTANT: Allow your frontend domains
app.use(cors({
  origin: [
    'http://127.0.0.1:5500',     // Your local testing
    'http://localhost:5500',      // Localhost
    'https://smartexchange-frontend.onrender.com' // Your future live site
  ],
  credentials: true
}));

app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5
});
app.use('/api/send-otp', limiter);

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'OTP service running' });
});

app.post('/api/send-otp', async (req, res) => {
  // ✅ Add CORS headers manually as backup
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP required' });
    }

    console.log(`Sending OTP ${otp} to ${email}`);

    const mailOptions = {
      from: '"SmartExchange Security" <noreply@smartexchange.com>',
      to: email,
      subject: 'Your Login Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fcd535; border-radius: 10px; background-color: #0b1426; color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #fcd535;">SmartExchange</h2>
          </div>
          <div style="background-color: #131f33; padding: 20px; border-radius: 8px;">
            <h3 style="color: #fcd535; text-align: center;">Login Verification Code</h3>
            <p style="color: #bfc9d4; text-align: center;">Use the code below to complete your login:</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #fcd535; background-color: #0b1426; padding: 15px 25px; border-radius: 8px; border: 2px solid #fcd535;">${otp}</span>
            </div>
            <p style="color: #8f9bb3; font-size: 14px; text-align: center;">This code expires in 5 minutes.</p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #5f6f8a; font-size: 12px;">
            © 2024 SmartExchange
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    
    res.status(200).json({ 
      success: true, 
      message: 'OTP sent successfully' 
    });
    
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ 
      error: 'Failed to send email',
      details: error.message 
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
