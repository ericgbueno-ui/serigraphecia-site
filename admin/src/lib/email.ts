import nodemailer from "nodemailer";

declare global {
  var emailTransporter: nodemailer.Transporter | undefined;
}

const transporter =
  global.emailTransporter ||
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

if (process.env.NODE_ENV !== "production") {
  global.emailTransporter = transporter;
}

export async function sendEmail(to: string, subject: string, html: string) {
  await transporter.sendMail({ from: process.env.SMTP_USER, to, subject, html });
}
