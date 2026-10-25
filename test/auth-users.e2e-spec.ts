import { INestApplication } from '@nestjs/common';
import { createApp, createClient, randomRut, uniqueSuffix } from './helpers';

describe('Autenticación y usuarios (e2e)', () => {
  let app: INestApplication;
  let gql: ReturnType<typeof createClient>['gql'];
  let login: ReturnType<typeof createClient>['login'];
  let admin: Awaited<ReturnType<typeof login>>;
  let teacher: Awaited<ReturnType<typeof login>>;
  let parent: Awaited<ReturnType<typeof login>>;

  const suffix = uniqueSuffix();
  const teacherEmail = `e2e.teacher${suffix}@test.cl`;
  const parentEmail = `e2e.parent${suffix}@test.cl`;
  const parentRut = randomRut();
  const teacherRut = randomRut();
  const studentRut = randomRut();
  const studentEmail = `e2e.student${suffix}@test.cl`;

  beforeAll(async () => {
    app = await createApp();
    ({ gql, login } = createClient(app));
    admin = await login('admin@aulaconecta.cl');
    teacher = await login('profesor@aulaconecta.cl');
    parent = await login('apoderado@aulaconecta.cl');
  }, 120000);

  afterAll(async () => {
    for (const rut of [studentRut, parentRut, teacherRut]) {
      await gql(`mutation { removeUser(rut: "${rut}") }`, admin.token);
    }
    await app.close();
  });

  describe('login', () => {
    it('devuelve token, rol y datos del usuario', async () => {
      expect(admin.role).toBe('admin');
      expect(admin.token).toBeTruthy();
    });

    it('rechaza un correo desconocido', async () => {
      const res = await gql('mutation { login(email: "nadie@test.cl", password: "xxxxxxx") { token } }');
      expect(res.body.errors[0].message).toMatch(/Credenciales inválidas/);
    });

    it('rechaza una contraseña incorrecta', async () => {
      const res = await gql('mutation { login(email: "admin@aulaconecta.cl", password: "incorrecta") { token } }');
      expect(res.body.errors[0].message).toMatch(/Credenciales inválidas/);
    });

    it('rechaza a un usuario sin credenciales (estudiante)', async () => {
      const students = await gql('{ getAllStudents { email } }', admin.token);
      const email = students.body.data.getAllStudents[0].email;
      const res = await gql(`mutation { login(email: "${email}", password: "xxxxxxx") { token } }`);
      expect(res.body.errors[0].message).toMatch(/Credenciales inválidas/);
    });
  });

  describe('registro', () => {
    it('permite registrar un profesor', async () => {
      const res = await gql(
        `mutation { register(firstName: "Prueba", lastName: "Docente", rut: "${teacherRut}", email: "${teacherEmail}", password: "Clave12345", role: "teacher") { message } }`,
      );
      expect(res.body.data.register.message).toMatch(/creado/);
    });

    it('permite registrar un apoderado', async () => {
      const res = await gql(
        `mutation { register(firstName: "Prueba", lastName: "Apoderado", rut: "${parentRut}", email: "${parentEmail}", password: "Clave12345", role: "parents") { message } }`,
      );
      expect(res.body.data.register.message).toMatch(/creado/);
    });

    it('rechaza el registro de administradores', async () => {
      const res = await gql(
        `mutation { register(firstName: "A", lastName: "B", rut: "${randomRut()}", email: "x${suffix}@test.cl", password: "Clave12345", role: "admin") { message } }`,
      );
      expect(res.body.errors[0].message).toMatch(/Solo profesores y padres/);
    });

    it('rechaza un correo duplicado', async () => {
      const res = await gql(
        `mutation { register(firstName: "A", lastName: "B", rut: "${randomRut()}", email: "${teacherEmail}", password: "Clave12345", role: "teacher") { message } }`,
      );
      expect(res.body.errors[0].message).toMatch(/ya se encuentra registrado/);
    });
  });

  describe('contraseñas', () => {
    it('permite cambiar la contraseña con sesión activa', async () => {
      const session = await login(teacherEmail, 'Clave12345');
      const res = await gql(
        'mutation { changePassword(currentPassword: "Clave12345", newPassword: "NuevaClave123") { message } }',
        session.token,
      );
      expect(res.body.data.changePassword.message).toMatch(/actualizada/);
      const again = await login(teacherEmail, 'NuevaClave123');
      expect(again.token).toBeTruthy();
    });

    it('exige la contraseña actual correcta para cambiarla', async () => {
      const session = await login(teacherEmail, 'NuevaClave123');
      const wrong = await gql(
        'mutation { changePassword(currentPassword: "Equivocada1", newPassword: "OtraClave123") { message } }',
        session.token,
      );
      expect(wrong.body.errors[0].message).toMatch(/contraseña actual no es correcta/);
      const same = await gql(
        'mutation { changePassword(currentPassword: "NuevaClave123", newPassword: "NuevaClave123") { message } }',
        session.token,
      );
      expect(same.body.errors[0].message).toMatch(/distinta de la actual/);
      expect((await login(teacherEmail, 'NuevaClave123')).token).toBeTruthy();
    });

    it('exige un token para cambiar la contraseña', async () => {
      const res = await gql('mutation { changePassword(currentPassword: "x", newPassword: "NuevaClave123") { message } }');
      expect(res.body.errors[0].message).toMatch(/No token found/);
    });

    it('responde igual con un correo desconocido para no revelar qué correos existen', async () => {
      const res = await gql('mutation { forgotPass(email: "nadie@test.cl") { message } }');
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.forgotPass.message).toMatch(/Si el correo está registrado/);
    });

    it('responde igual para un usuario sin credenciales', async () => {
      const students = await gql('{ getAllStudents { email } }', admin.token);
      const email = students.body.data.getAllStudents[0].email;
      const res = await gql(`mutation { forgotPass(email: "${email}") { message } }`);
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.forgotPass.message).toMatch(/Si el correo está registrado/);
    });

    it('no cambia la contraseña cuando el envío de correos no está configurado', async () => {
      if (process.env.MAIL_USER && process.env.MAIL_PASS) {
        return;
      }
      const res = await gql(`mutation { forgotPass(email: "${parentEmail}") { message } }`);
      expect(res.body.data.forgotPass.message).toMatch(/Si el correo está registrado/);
      expect((await login(parentEmail, 'Clave12345')).token).toBeTruthy();
    });
  });

  describe('administración de usuarios', () => {
    it('el administrador crea un estudiante asociado a un apoderado', async () => {
      const res = await gql(
        `mutation { createUser(createUserDto: { firstName: "Alumno", lastName: "Prueba", rut: "${studentRut}", email: "${studentEmail}", role: Student, guardianRut: "${parentRut}" }) { id guardianId role } }`,
        admin.token,
      );
      expect(res.body.data.createUser.role).toBe('Student');
      expect(res.body.data.createUser.guardianId).toBeTruthy();
    });

    it('rechaza RUT duplicado', async () => {
      const res = await gql(
        `mutation { createUser(createUserDto: { firstName: "A", lastName: "B", rut: "${studentRut}", email: "otro${suffix}@test.cl", role: Student }) { id } }`,
        admin.token,
      );
      expect(res.body.errors[0].message).toMatch(/RUT .* ya está registrado/);
    });

    it('rechaza correo duplicado', async () => {
      const res = await gql(
        `mutation { createUser(createUserDto: { firstName: "A", lastName: "B", rut: "${randomRut()}", email: "${studentEmail}", role: Student }) { id } }`,
        admin.token,
      );
      expect(res.body.errors[0].message).toMatch(/email .* ya está registrado/);
    });

    it('exige contraseña para roles con acceso', async () => {
      const res = await gql(
        `mutation { createUser(createUserDto: { firstName: "A", lastName: "B", rut: "${randomRut()}", email: "p${suffix}@test.cl", role: Teacher }) { id } }`,
        admin.token,
      );
      expect(res.body.errors[0].message).toMatch(/contraseña/);
    });

    it('rechaza un apoderado inexistente', async () => {
      const res = await gql(
        `mutation { createUser(createUserDto: { firstName: "A", lastName: "B", rut: "${randomRut()}", email: "g${suffix}@test.cl", role: Student, guardianRut: "1.111.111-1" }) { id } }`,
        admin.token,
      );
      expect(res.body.errors[0].message).toMatch(/No existe un apoderado/);
    });

    it('un profesor no puede crear usuarios que no sean estudiantes', async () => {
      const res = await gql(
        `mutation { createUser(createUserDto: { firstName: "A", lastName: "B", rut: "${randomRut()}", email: "t${suffix}@test.cl", role: Teacher, password: "Clave12345" }) { id } }`,
        teacher.token,
      );
      expect(res.body.errors[0].message).toMatch(/Solo un administrador/);
    });

    it('un apoderado no puede crear usuarios', async () => {
      const res = await gql(
        `mutation { createUser(createUserDto: { firstName: "A", lastName: "B", rut: "${randomRut()}", email: "q${suffix}@test.cl", role: Student }) { id } }`,
        parent.token,
      );
      expect(res.body.errors[0].message).toMatch(/permisos/);
    });

    it('consulta usuarios por rut, listados y pupilos', async () => {
      const one = await gql(`{ findByRut(rut: "${studentRut}") { firstName } }`, admin.token);
      expect(one.body.data.findByRut.firstName).toBe('Alumno');
      const all = await gql('{ getAllUser { id } getAllStudents { id } getAllParents { id } }', admin.token);
      expect(all.body.data.getAllUser.length).toBeGreaterThan(10);
      expect(all.body.data.getAllParents.length).toBeGreaterThan(5);
      const missing = await gql('{ findByRut(rut: "9.999.999-9") { id } }', admin.token);
      expect(missing.body.errors[0].message).toMatch(/no encontrado/);
    });

    it('actualiza datos y reasigna o quita al apoderado', async () => {
      const renamed = await gql(
        `mutation { updateUser(rut: "${studentRut}", updateUserDto: { firstName: "Renombrado", lastName: "Nuevo", email: "nuevo${suffix}@test.cl" }) { id } }`,
        teacher.token,
      );
      expect(renamed.body.data.updateUser.id).toBeTruthy();
      const cleared = await gql(
        `mutation { updateUser(rut: "${studentRut}", updateUserDto: { guardianRut: "" }) { guardianId } }`,
        admin.token,
      );
      expect(cleared.body.data.updateUser.guardianId).toBeNull();
      const assigned = await gql(
        `mutation { updateUser(rut: "${studentRut}", updateUserDto: { guardianRut: "${parentRut}" }) { guardianId } }`,
        admin.token,
      );
      expect(assigned.body.data.updateUser.guardianId).toBeTruthy();
    });

    it('rechaza un correo ya usado por otro usuario o un usuario inexistente', async () => {
      const taken = await gql(
        `mutation { updateUser(rut: "${studentRut}", updateUserDto: { email: "${parentEmail}" }) { id } }`,
        admin.token,
      );
      expect(taken.body.errors[0].message).toMatch(/ya esta en uso/);
      const missing = await gql(
        'mutation { updateUser(rut: "9.999.999-9", updateUserDto: { firstName: "x" }) { id } }',
        admin.token,
      );
      expect(missing.body.errors[0].message).toMatch(/no encontrado/);
    });

    it('el apoderado ve a sus pupilos', async () => {
      const session = await login(parentEmail, 'Clave12345');
      const res = await gql('{ myChildren { firstName } }', session.token);
      expect(res.body.data.myChildren.map((c: { firstName: string }) => c.firstName)).toContain('Renombrado');
    });

    it('elimina usuarios y rechaza eliminar uno inexistente', async () => {
      const removed = await gql(`mutation { removeUser(rut: "${studentRut}") }`, admin.token);
      expect(removed.body.data.removeUser).toBe(true);
      const again = await gql(`mutation { removeUser(rut: "${studentRut}") }`, admin.token);
      expect(again.body.errors[0].message).toMatch(/no encontrado/);
    });

    it('exige autenticación en las consultas protegidas', async () => {
      const none = await gql('{ getAllUser { id } }');
      expect(none.body.errors[0].message).toMatch(/No token found/);
      const badToken = await gql('{ getAllUser { id } }', 'abc.def.ghi');
      expect(badToken.body.errors[0].message).toMatch(/invalid or expired/);
      const badFormat = await gql('{ getAllUser { id } }', undefined, 'Basic abc');
      expect(badFormat.body.errors[0].message).toMatch(/No token found/);
    });
  });
});
