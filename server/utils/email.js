const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

const FROM = process.env.SMTP_FROM || 'BlingzStore <noreply@blingzstore.com>';

async function sendEmail(to, subject, html) {
  if (!process.env.SMTP_USER) {
    console.log(`[Email] SMTP not configured. Would send to: ${to}`);
    console.log(`[Email] Subject: ${subject}`);
    return;
  }
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
    console.log(`[Email] Sent to ${to}: ${subject}`);
  } catch (err) {
    console.error(`[Email] Failed to send to ${to}:`, err.message);
  }
}

function welcomeEmail(name) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1a1a1a;">Welcome to BlingzStore!</h2>
      <p>Hi ${name || 'there'},</p>
      <p>Thank you for joining BlingzStore. We're excited to have you!</p>
      <p>Browse our collection of premium hair products, organic honey, and delicious plantain chips.</p>
      <a href="http://localhost:3000" style="display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 16px;">Start Shopping</a>
      <p style="margin-top: 24px; color: #666; font-size: 12px;">BlingzStore - Abuja, Nigeria</p>
    </div>
  `;
}

function orderConfirmationEmail(name, orderId, total, items) {
  const itemList = items.map(i => `<li>${i.name} x ${i.quantity} - ₦${(i.price * i.quantity).toFixed(2)}</li>`).join('');
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1a1a1a;">Order Confirmed!</h2>
      <p>Hi ${name},</p>
      <p>Your order <strong>#${orderId}</strong> has been placed successfully.</p>
      <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px;"><strong>Items:</strong></p>
        <ul style="margin: 0; padding-left: 20px;">${itemList}</ul>
        <p style="margin: 12px 0 0; font-size: 18px;"><strong>Total: ₦${total.toFixed(2)}</strong></p>
      </div>
      <p>We'll notify you when your order ships.</p>
      <a href="http://localhost:3000/orders/${orderId}" style="display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 16px;">View Order</a>
      <p style="margin-top: 24px; color: #666; font-size: 12px;">BlingzStore - Abuja, Nigeria</p>
    </div>
  `;
}

function orderShippedEmail(name, orderId) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1a1a1a;">Your Order Has Shipped!</h2>
      <p>Hi ${name},</p>
      <p>Great news! Your order <strong>#${orderId}</strong> is on its way to you.</p>
      <a href="http://localhost:3000/orders/${orderId}" style="display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 16px;">Track Order</a>
      <p style="margin-top: 24px; color: #666; font-size: 12px;">BlingzStore - Abuja, Nigeria</p>
    </div>
  `;
}

function orderDeliveredEmail(name, orderId) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1a1a1a;">Order Delivered!</h2>
      <p>Hi ${name},</p>
      <p>Your order <strong>#${orderId}</strong> has been delivered. We hope you love your products!</p>
      <p>Got a moment? Leave us a review to help other shoppers.</p>
      <a href="http://localhost:3000/orders/${orderId}" style="display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 16px;">Leave a Review</a>
      <p style="margin-top: 24px; color: #666; font-size: 12px;">BlingzStore - Abuja, Nigeria</p>
    </div>
  `;
}

module.exports = { sendEmail, welcomeEmail, orderConfirmationEmail, orderShippedEmail, orderDeliveredEmail };
