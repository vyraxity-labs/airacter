import nodemailer from "nodemailer";

const getTransporter = () => {
  const host = process.env.SMTP_HOST || "smtp-relay.brevo.com";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!user || !pass) {
    // Fall back to console logging during development if credentials are empty
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
};

export async function sendVerificationEmail(email: string, token: string) {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || "no-reply@airacter.com";
  const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/verify?token=${token}`;

  const subject = "Verify your email - Airacter";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0ea5e9; text-align: center;">Welcome to Airacter</h2>
      <p>Thank you for registering. Please click the button below to verify your email address and activate your account. You will receive 50,000 free tokens upon verification!</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationLink}" style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email Address</a>
      </div>
      <p style="font-size: 12px; color: #64748b; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
        If the button above does not work, copy and paste this link into your browser: <br/>
        <a href="${verificationLink}" style="color: #0ea5e9;">${verificationLink}</a>
      </p>
      <p style="font-size: 12px; color: #64748b;">If you did not request this email, you can safely ignore it.</p>
    </div>
  `;

  if (!transporter) {
    console.log("=========================================");
    console.log(`VERIFICATION EMAIL LOG FOR: ${email}`);
    console.log(`Verification URL: ${verificationLink}`);
    console.log("=========================================");
    return true;
  }

  try {
    await transporter.sendMail({
      from: `"Airacter" <${from}>`,
      to: email,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("Failed to send verification email:", error);
    throw new Error("Failed to send verification email. Please check your credentials.");
  }
}
