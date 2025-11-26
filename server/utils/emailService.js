const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: Number(process.env.EMAIL_PORT) === 465, // 465 -> secure, warna false
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendAlertEmail = async (to, subject, text) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Alert email sent to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = { sendAlertEmail };


// const nodemailer = require('nodemailer');

// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST,
//   port: process.env.EMAIL_PORT,
//   secure: false,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// const sendAlertEmail = async (to, subject, text) => {
//   try {
//     const mailOptions = {
//       from: process.env.EMAIL_USER,
//       to,
//       subject,
//       text,
//     };

//     await transporter.sendMail(mailOptions);
//     console.log(`Alert email sent to ${to}`);
//   } catch (error) {
//     console.error('Error sending email:', error);
//   }
// };

// module.exports = { sendAlertEmail };