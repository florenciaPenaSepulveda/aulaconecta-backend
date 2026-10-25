import * as nodemailer from 'nodemailer';

const escapeHtml = (valor: string): string =>
    valor.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export const isMailConfigured = (): boolean =>
    Boolean(process.env.MAIL_USER && process.env.MAIL_PASS);

export const sendMail = async (to: string, subject: string, text: string, html: string): Promise<boolean> => {
    if (!isMailConfigured()) {
        return false;
    }
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        },
    });
    await transporter.sendMail({
        from: `"AulaConecta" <${process.env.MAIL_USER}>`,
        to,
        subject,
        text,
        html,
    });
    return true;
};

export const credentialsTemplate = (email: string, password: string) => ({
    subject: 'Credenciales de acceso a AulaConecta',
    text: `Hola,\n\nTus credenciales de acceso a AulaConecta son:\n\nUsuario: ${email}\nContraseña: ${password}\n\nTe recomendamos cambiar tu contraseña después de iniciar sesión.\n\nSaludos,\nEquipo AulaConecta`,
    html: `<div style="font-family: Arial, sans-serif; color: #1f2937;"><h2>Hola,</h2><p>Tus credenciales de acceso a <strong>AulaConecta</strong> son:</p><p><strong>Usuario:</strong> ${escapeHtml(email)}<br><strong>Contraseña:</strong> ${escapeHtml(password)}</p><p>Te recomendamos cambiar esta contraseña al iniciar sesión.</p><p>Equipo AulaConecta</p></div>`,
});

export const resetTemplate = (password: string) => ({
    subject: 'Tu nueva contraseña',
    text: `Tu nueva contraseña es: ${password}`,
    html: `<div style="font-family: Arial, sans-serif; color: #1f2937;"><h2>Hola,</h2><p>Hemos restablecido tu contraseña de <strong>AulaConecta</strong>.</p><p><strong>Nueva contraseña:</strong> ${escapeHtml(password)}</p><p>Te recomendamos cambiarla al iniciar sesión. Si no solicitaste este cambio, ignora este correo.</p><p>Equipo AulaConecta</p></div>`,
});
