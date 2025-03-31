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
    ? `\nLogin Credentials:\n━━━━━━━━━━━━━━━\nUsername: ${evaluator.email}\nTemporary Password: ${password}\n\nIMPORTANT: For security reasons, please change your password upon your first login.\n` 
    : '';

  const text = `
Dear ${evaluator.username},

${isFirstEvaluation 
  ? 'Welcome to the Academic Evaluation System! We are pleased to have you as part of our evaluation team.' 
  : 'We hope this email finds you well. A new evaluation has been assigned to you.'}

EVALUATION DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Subject:     ${evaluation.subject}
• Regulation:  ${evaluation.regulation}
• Branch:      ${evaluation.branch}
• Year:        ${evaluation.year}
• Semester:    ${evaluation.semester}
• Papers:      ${evaluation.studentSubmissions.length} submissions
• Due Date:    ${new Date(evaluation.endDate).toLocaleDateString()}
${passwordText}
NEXT STEPS
━━━━━━━━━━━
1. Login to the Evaluation System portal
2. Navigate to your dashboard
3. Access the newly assigned evaluation
4. Begin the evaluation process

Please ensure to complete the evaluation before the due date. If you encounter any technical issues or have questions, don't hesitate to reach out to our support team.

IMPORTANT REMINDERS
━━━━━━━━━━━━━━━━━━
• Maintain strict confidentiality throughout the evaluation process
• Submit your evaluations before the deadline

Access the Evaluation System here: ${process.env.FRONTEND_URL || 'https://evaluation-system.com'}

Best regards,
The Academic Evaluation System Team

Note: This is an automated message. Please do not reply to this email.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: evaluator.email,
    subject,
    text
  });
};

module.exports = { sendEvaluationEmail }; 