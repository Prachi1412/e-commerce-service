const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const NODE_ENV = process.env.NODE_ENV || "development";
dotenv.config({ path: ".env." + NODE_ENV });

module.exports = async function sendEmail(toEmail, subject, body) {
  const transport = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: process.env.MAILTRAP_EMAIL,
      pass: process.env.MAILTRAP_PASSWORD,
    },
  });
  return await transport.sendMail({
    from: "noreply@.com", // sender address
    to: toEmail, // list of receivers
    subject: subject, // Subject line
    html: body, // html body
  });
};
