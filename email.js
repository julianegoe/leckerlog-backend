const nodemailer = require("nodemailer");



const sendEmail = async (email, subject, template) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: process.env.GMAIL_PORT,
      secure: true,
      auth: {
        user: process.env.GMAIL_USERNAME,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.USER,
      to: email,
      subject: subject,
      html: template,
    });
    console.log("email sent sucessfully");
    return 'SUCCESS'
  } catch (error) {
    console.log("email not sent");
    console.log(error);
    return error
  }
};

module.exports = sendEmail;