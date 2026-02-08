const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);

const domain = process.env.MAILGUN_DOMAIN;
const apiKey = process.env.MAILGUN_API_KEY;

if (domain && apiKey) {
    var client = mailgun.client({ 
        username: 'api', 
        key: apiKey,
        url: process.env.MAILGUN_BASE_URL
    });
}


const sendOTPEmail = async (email, otp) => {
    try {
        const messageData = {
            from: `GDEA <noreply@${domain}>`,
            to: email,
            subject: 'Your GDEA Login OTP',
            text: `Your OTP is: ${otp}\n\nThis OTP will expire in 5-10 minutes.\n\nIf you did not request this OTP, please ignore this email.`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #25649b;">GDEA Portal Login</h2>
                    <p>Your One-Time Password (OTP) is:</p>
                    <div style="background: #f4f7f6; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #25649b; border-radius: 8px; margin: 20px 0;">
                        ${otp}
                    </div>
                    <p style="color: #666; font-size: 14px;">This OTP will expire in 5-10 minutes.</p>
                    <p style="color: #666; font-size: 12px; margin-top: 30px;">If you did not request this OTP, please ignore this email.</p>
                </div>
            `
        };

        if (client && domain) {
            await client.messages.create(domain, messageData);
            console.log(`OTP email sent to ${email}`);
        } else {
            // Development fallback - log to console
            console.log(`[Mailgun not configured] OTP for ${email}: ${otp}`);
        }
    } catch (error) {
        console.error('Failed to send OTP email:', error);
        // In development, still log the OTP
        console.log(`[Email failed] OTP for ${email}: ${otp}`);
    }
};

module.exports = { sendOTPEmail };
