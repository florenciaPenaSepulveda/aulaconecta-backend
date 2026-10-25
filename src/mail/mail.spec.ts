import * as nodemailer from 'nodemailer';
import { credentialsTemplate, isMailConfigured, resetTemplate, sendMail } from './mail';

jest.mock('nodemailer');

describe('mail', () => {
  const original = { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS };

  afterEach(() => {
    process.env.MAIL_USER = original.user;
    process.env.MAIL_PASS = original.pass;
    jest.resetAllMocks();
  });

  it('no envía correos cuando faltan las credenciales', async () => {
    delete process.env.MAIL_USER;
    delete process.env.MAIL_PASS;
    expect(isMailConfigured()).toBe(false);
    await expect(sendMail('a@b.cl', 'Asunto', 'texto', '<p>html</p>')).resolves.toBe(false);
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
  });

  it('envía el correo cuando hay credenciales', async () => {
    process.env.MAIL_USER = 'colegio@gmail.com';
    process.env.MAIL_PASS = 'abcd efgh ijkl mnop';
    const sendMailMock = jest.fn().mockResolvedValue({});
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail: sendMailMock });

    expect(isMailConfigured()).toBe(true);
    await expect(sendMail('a@b.cl', 'Asunto', 'texto', '<p>html</p>')).resolves.toBe(true);
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({ from: '"AulaConecta" <colegio@gmail.com>', to: 'a@b.cl', subject: 'Asunto' }),
    );
  });

  it('genera las plantillas con los datos del usuario', () => {
    const credentials = credentialsTemplate('a@b.cl', 'Clave123');
    expect(credentials.text).toContain('a@b.cl');
    expect(credentials.html).toContain('Clave123');
    const reset = resetTemplate('NuevaClave');
    expect(reset.subject).toBe('Tu nueva contraseña');
    expect(reset.html).toContain('NuevaClave');
  });

  it('escapa el HTML de los datos para evitar inyecciones en el correo', () => {
    const credentials = credentialsTemplate('<script>alert(1)</script>@b.cl', '<b>"x"</b>');
    expect(credentials.html).not.toContain('<script>');
    expect(credentials.html).toContain('&lt;script&gt;');
    expect(credentials.html).toContain('&lt;b&gt;&quot;x&quot;&lt;/b&gt;');
    expect(resetTemplate('<i>').html).toContain('&lt;i&gt;');
  });
});
