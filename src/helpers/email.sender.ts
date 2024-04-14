import * as nodemailer from 'nodemailer';
import { Logger } from './logger';

export class EmailSender{

    async send(data): Promise<void> {
        const transporter = nodemailer.createTransport({
            name: process.env.EMAIL_HOST,
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: process.env.EMAIL_SECURE === 'true' ? true : false, // true for 465, false for other ports
            auth: {
              user: process.env.EMAIL_SENDER, 
              pass: process.env.EMAIL_APP_PASSWORD, 
            },
            tls: {
              rejectUnauthorized: false,
            },
          });
          let info = await transporter.sendMail({
            from: process.env.EMAIL_SENDER, // sender address
            to: data.receiver, // list of receivers
            subject: data.subject, // Subject line
            text: data.text, // plain text body
            html: data.template, // html body
          });

          Logger.info("Message sent: %s", info.messageId);
          Logger.info("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
}
export default new EmailSender();