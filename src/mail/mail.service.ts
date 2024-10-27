import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'flopi2801@gmail.com',
        pass: 'vjwa owqk pwuh qodb', // Considera usar un "App Password"
      },
    });
  }

  async sendPasswordReset(to: string, token: string) {
    const resetUrl = `http://localhost:3000/reset-password?token=${token}`;

    const mailOptions = {
      from: '"CloseAI S.A." <flopi2801@gmail.com>',
      to,
      subject: 'Recuperación de contraseña',
      text: `Utiliza el siguiente enlace para recuperar tu contraseña: ${resetUrl}`,
      html: `<p>Haz clic en el siguiente enlace para recuperar tu contraseña:</p><a href="${resetUrl}">${resetUrl}</a>`,
    };

    try {
      return await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error al enviar el correo:', error);
      throw new Error('Error al enviar el correo de recuperación');
    }
  }
}
