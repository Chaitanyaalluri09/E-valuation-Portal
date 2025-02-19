const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

const sendEvaluationEmail = async (evaluator, evaluation, isFirstEvaluation, password = null) => {
  const subject = isFirstEvaluation 
    ? 'Welcome to the Evaluation System - First Evaluation Assigned' 
    : 'New Evaluation Assigned';

  const passwordText = password 
    ? `\nYour login credentials:\nUsername: ${evaluator.email}\nTemporary Password: ${password}\n\nPlease change your password when you first login.` 
    : '';

  const text = `
    Dear ${evaluator.username},

    ${isFirstEvaluation ? 'Welcome to the Evaluation System!' : 'You have been assigned a new evaluation.'}

    Evaluation Details:
    Subject: ${evaluation.subject}
    Regulation: ${evaluation.regulation}
    Branch: ${evaluation.branch}
    Year: ${evaluation.year}
    Semester: ${evaluation.semester}
    Number of Papers: ${evaluation.studentSubmissions.length}
    Due Date: ${new Date(evaluation.endDate).toLocaleDateString()}
    ${passwordText}

    Please login to the system to start the evaluation process.

    Best regards,
    Evaluation System Team
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: evaluator.email,
    subject,
    text
  });
};

module.exports = { sendEvaluationEmail }; 