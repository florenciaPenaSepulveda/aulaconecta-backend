import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer'; // Importar el módulo de Mailer

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com', // Configura el host SMTP
        port: 587, // Puerto para TLS
        secure: false, // true para SSL
        auth: {
          user: 'flopi2801@gmail.com', // Tu correo electrónico
          pass: 'vjwa owqk pwuh qodb', // Contraseña o token de aplicación
        },
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService], // Exportamos el servicio para que otros módulos puedan usarlo
})
export class MailModule {}
