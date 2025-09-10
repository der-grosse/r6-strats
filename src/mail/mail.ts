"use server";
import { createTransport } from "nodemailer";
import { PASSWORD_RESET_MAIL_TEMPLATE } from "./templates";

const transporter = createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

async function sendMail(to: string, subject: string, html: string) {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    html,
  });
}

export async function sendResetEmail(email: string, token: string) {
  const html = PASSWORD_RESET_MAIL_TEMPLATE(email, token);
  await sendMail(email, "R6 Strats Password Reset", html);
}
