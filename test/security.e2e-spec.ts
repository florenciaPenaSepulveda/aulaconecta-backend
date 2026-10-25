import { INestApplication } from '@nestjs/common';
import { createApp, createClient, randomRut, uniqueSuffix } from './helpers';

describe('Seguridad y permisos (e2e)', () => {
  let app: INestApplication;
  let gql: ReturnType<typeof createClient>['gql'];
  let login: ReturnType<typeof createClient>['login'];
  let admin: Awaited<ReturnType<typeof login>>;
  let teacher: Awaited<ReturnType<typeof login>>;
  let parent: Awaited<ReturnType<typeof login>>;
  let owner: Awaited<ReturnType<typeof login>>;

  const suffix = uniqueSuffix();
  const ownerEmail = `seg.profesor${suffix}@test.cl`;
  const ownerRut = randomRut();
  const courseName = `Curso Seguridad ${suffix}`;
  const subjectName = `Materia Seguridad ${suffix}`;
  let courseId: number;
  let subjectId: number;

  beforeAll(async () => {
    app = await createApp();
    ({ gql, login } = createClient(app));
    admin = await login('admin@aulaconecta.cl');
    teacher = await login('profesor@aulaconecta.cl');
    parent = await login('apoderado@aulaconecta.cl');
    await gql(
      `mutation { register(firstName: "Dueño", lastName: "Materia", rut: "${ownerRut}", email: "${ownerEmail}", password: "Clave12345", role: "teacher") { message } }`,
    );
    owner = await login(ownerEmail, 'Clave12345');
    await gql(`mutation { createCourse(createCourseDto: { nameCourse: "${courseName}", level: Media }) }`, admin.token);
    const list = await gql('{ listCourses { id nameCourse } }', admin.token);
    courseId = Number(list.body.data.listCourses.find((c: { nameCourse: string }) => c.nameCourse === courseName).id);
    await gql(
      `mutation { addNewSubjectAdmin(createSubjectAdminInput: { name: "${subjectName}", numberOfClasses: 5, courseId: ${courseId}, idTeacher: ${owner.id} }) { isCreateSubject } }`,
      admin.token,
    );
    const subjects = await gql('{ listSubject { id name } }', admin.token);
    subjectId = Number(subjects.body.data.listSubject.find((s: { name: string }) => s.name === subjectName).id);
  }, 120000);

  afterAll(async () => {
    await gql(`mutation { deleteSubjectById(id: ${subjectId}) }`, admin.token);
    await gql(`mutation { deleteCourseDto(deleteCourseDto: { nameCourse: "${courseName}", level: Media }) }`, admin.token);
    await gql(`mutation { removeUser(rut: "${ownerRut}") }`, admin.token);
    await app.close();
  });

  describe('cursos y semestres', () => {
    it('exigen sesión', async () => {
      for (const query of [
        '{ listCourses { id } }',
        'mutation { createCourse(createCourseDto: { nameCourse: "X", level: Media }) }',
        'mutation { deleteCourseDto(deleteCourseDto: { nameCourse: "X", level: Media }) }',
        'mutation { deleteSemester(deleteSemesterDto: { nameSemester: "X" }) }',
      ]) {
        const res = await gql(query);
        expect(res.body.errors[0].message).toMatch(/No token found/);
      }
    });

    it('solo el administrador crea, modifica o elimina cursos y semestres', async () => {
      for (const session of [teacher, parent]) {
        for (const query of [
          'mutation { createCourse(createCourseDto: { nameCourse: "X", level: Media }) }',
          'mutation { updateCourseDto(updateCourseDto: { nameCourse: "X", level: Media, newName: "Y" }) }',
          'mutation { deleteCourseDto(deleteCourseDto: { nameCourse: "X", level: Media }) }',
          'mutation { deleteSemester(deleteSemesterDto: { nameSemester: "X" }) }',
        ]) {
          const res = await gql(query, session.token);
          expect(res.body.errors[0].message).toMatch(/No tienes permisos/);
        }
      }
    });

    it('el profesor puede consultar los cursos pero el apoderado no', async () => {
      expect((await gql('{ listCourses { id } }', teacher.token)).body.data.listCourses.length).toBeGreaterThan(0);
      expect((await gql('{ listCourses { id } }', parent.token)).body.errors[0].message).toMatch(/No tienes permisos/);
    });
  });

  describe('asignaturas', () => {
    it('exigen sesión', async () => {
      for (const query of [
        '{ listSubject { id } }',
        `{ subjectById(id: ${subjectId}) { id } }`,
        `{ getAllSubjectByIdTeacher(idTeacher: ${owner.id}) { id } }`,
        `mutation { removeSubject(name: "${subjectName}") }`,
        `mutation { updateSubject(updateSubjectInput: { name: "${subjectName}", numberOfClasses: 1 }) { id } }`,
        `mutation { addNewSubjectAdmin(createSubjectAdminInput: { name: "X", courseId: ${courseId}, idTeacher: 1 }) { isCreateSubject } }`,
      ]) {
        const res = await gql(query);
        expect(res.body.errors[0].message).toMatch(/No token found/);
      }
    });

    it('un apoderado no accede a las asignaturas', async () => {
      for (const query of [
        '{ listSubject { id } }',
        `{ subjectById(id: ${subjectId}) { id } }`,
        `mutation { removeSubject(name: "${subjectName}") }`,
        `mutation { createSubject(createSubjectInput: { name: "X", numberOfClasses: 1, courseId: ${courseId} }) { isCreateSubject } }`,
      ]) {
        const res = await gql(query, parent.token);
        expect(res.body.errors[0].message).toMatch(/No tienes permisos/);
      }
    });

    it('solo el administrador asigna asignaturas a otros profesores', async () => {
      const res = await gql(
        `mutation { addNewSubjectAdmin(createSubjectAdminInput: { name: "X", courseId: ${courseId}, idTeacher: ${owner.id} }) { isCreateSubject } }`,
        teacher.token,
      );
      expect(res.body.errors[0].message).toMatch(/No tienes permisos/);
    });

    it('un profesor no ve ni modifica las asignaturas de otro profesor', async () => {
      for (const query of [
        `{ subjectById(id: ${subjectId}) { id } }`,
        `{ getAllSubjectByIdTeacher(idTeacher: ${owner.id}) { id } }`,
        `mutation { removeSubject(name: "${subjectName}") }`,
        `mutation { updateSubject(updateSubjectInput: { name: "${subjectName}", numberOfClasses: 99 }) { id } }`,
        `mutation { deleteSubjectById(id: ${subjectId}) }`,
      ]) {
        const res = await gql(query, teacher.token);
        expect(res.body.errors[0].message).toMatch(/No tienes permisos|Solo puedes consultar/);
      }
    });

    it('el profesor dueño sí puede consultar y modificar su asignatura', async () => {
      const byId = await gql(`{ subjectById(id: ${subjectId}) { name } }`, owner.token);
      expect(byId.body.data.subjectById.name).toBe(subjectName);
      const own = await gql(`{ getAllSubjectByIdTeacher(idTeacher: ${owner.id}) { name } }`, owner.token);
      expect(own.body.data.getAllSubjectByIdTeacher.length).toBe(1);
      const updated = await gql(
        `mutation { updateSubject(updateSubjectInput: { name: "${subjectName}", numberOfClasses: 7 }) { numberOfClasses } }`,
        owner.token,
      );
      expect(updated.body.data.updateSubject.numberOfClasses).toBe(7);
    });
  });

  describe('asistencia y notas de una asignatura ajena', () => {
    it('un profesor ajeno no registra ni consulta asistencia', async () => {
      for (const query of [
        `mutation { takeAsist(createAsistInput: { asistencias: [{ idUser: 1, idSubject: ${subjectId}, asist: 1, absences: 0 }] }) }`,
        `mutation { enrollStudent(idUser: 1, idSubject: ${subjectId}) }`,
        `mutation { unenrollStudent(idUser: 1, idSubject: ${subjectId}) }`,
        `{ listUsersBySubject(idSubject: ${subjectId}) { totalAsist } }`,
        `{ subjectAttendanceSummary(subjectId: ${subjectId}) { students } }`,
        `{ subjectAttendanceCalendar(subjectId: ${subjectId}) { days { date } } }`,
      ]) {
        const res = await gql(query, teacher.token);
        expect(res.body.errors[0].message).toMatch(/No tienes permisos/);
      }
    });

    it('un apoderado no lista a los alumnos de una asignatura', async () => {
      const res = await gql(`{ listUsersBySubject(idSubject: ${subjectId}) { totalAsist } }`, parent.token);
      expect(res.body.errors[0].message).toMatch(/No tienes permisos/);
    });

    it('un profesor ajeno no crea ni consulta notas', async () => {
      for (const query of [
        `mutation { createGrade(createGradeDto: { grade: 6, studentId: 1, subjectId: ${subjectId} }) { id } }`,
        `{ gradesBySubjectId(subjectId: ${subjectId}) { id } }`,
      ]) {
        const res = await gql(query, teacher.token);
        expect(res.body.errors[0].message).toMatch(/No tienes permisos/);
      }
    });

    it('el listado global de notas es solo del administrador', async () => {
      expect((await gql('{ getAllGrades { id } }', teacher.token)).body.errors[0].message).toMatch(/No tienes permisos/);
      expect((await gql('{ getAllGrades { id } }', admin.token)).body.errors).toBeUndefined();
    });

    it('el profesor dueño sí puede crear, consultar y eliminar notas de su asignatura', async () => {
      const students = await gql('{ getAllStudents { id } }', admin.token);
      const studentId = Number(students.body.data.getAllStudents[0].id);
      const created = await gql(
        `mutation { createGrade(createGradeDto: { grade: 6, studentId: ${studentId}, subjectId: ${subjectId} }) { id } }`,
        owner.token,
      );
      const gradeId = Number(created.body.data.createGrade.id);
      const list = await gql(`{ gradesBySubjectId(subjectId: ${subjectId}) { id } }`, owner.token);
      expect(list.body.data.gradesBySubjectId.length).toBe(1);
      const denied = await gql(`mutation { deleteGrade(id: ${gradeId}) }`, teacher.token);
      expect(denied.body.errors[0].message).toMatch(/No tienes permisos/);
      const removed = await gql(`mutation { deleteGrade(id: ${gradeId}) }`, owner.token);
      expect(removed.body.data.deleteGrade).toBe(true);
    });
  });

  describe('usuarios', () => {
    it('solo profesores y administradores listan o buscan usuarios', async () => {
      for (const query of [
        '{ getAllUser { id } }',
        '{ getAllStudents { id } }',
        '{ getAllParents { id } }',
        '{ findByRut(rut: "1-9") { id } }',
      ]) {
        const anonymous = await gql(query);
        expect(anonymous.body.errors[0].message).toMatch(/No token found/);
        const asParent = await gql(query, parent.token);
        expect(asParent.body.errors[0].message).toMatch(/No tienes permisos/);
      }
    });

    it('un profesor no modifica ni elimina a administradores u otros profesores', async () => {
      const users = await gql('{ getAllUser { rut role } }', admin.token);
      const adminRut = users.body.data.getAllUser.find((u: { role: string }) => u.role === 'Admin').rut;
      const update = await gql(
        `mutation { updateUser(rut: "${adminRut}", updateUserDto: { email: "robado${suffix}@test.cl" }) { id } }`,
        teacher.token,
      );
      expect(update.body.errors[0].message).toMatch(/Solo un administrador/);
      const remove = await gql(`mutation { removeUser(rut: "${adminRut}") }`, teacher.token);
      expect(remove.body.errors[0].message).toMatch(/Solo un administrador/);
      const other = await gql(`mutation { removeUser(rut: "${ownerRut}") }`, teacher.token);
      expect(other.body.errors[0].message).toMatch(/Solo un administrador/);
    });

    it('un administrador no puede eliminar su propia cuenta', async () => {
      const users = await gql('{ getAllUser { rut email } }', admin.token);
      const mine = users.body.data.getAllUser.find((u: { email: string }) => u.email === 'admin@aulaconecta.cl');
      const res = await gql(`mutation { removeUser(rut: "${mine.rut}") }`, admin.token);
      expect(res.body.errors[0].message).toMatch(/propia cuenta/);
    });

    it('valida el formato de los datos al crear usuarios', async () => {
      const create = (fields: string) =>
        gql(
          `mutation { createUser(createUserDto: { firstName: "A", lastName: "B", rut: "${randomRut()}", email: "v${suffix}@test.cl", role: Parents, ${fields} }) { id } }`,
          admin.token,
        );
      expect(JSON.stringify((await create('password: "corta1"')).body.errors)).toMatch(/password must be longer|at least 8|8 characters/i);
      expect(JSON.stringify((await create('password: "soloLetrasAqui"')).body.errors)).toMatch(/letras y números/);
      const badEmail = await gql(
        `mutation { createUser(createUserDto: { firstName: "A", lastName: "B", rut: "${randomRut()}", email: "no-es-correo", role: Parents, password: "Clave12345" }) { id } }`,
        admin.token,
      );
      expect(JSON.stringify(badEmail.body.errors)).toMatch(/email/i);
    });
  });

  describe('contraseñas', () => {
    it('exigen letras y números y un largo mínimo', async () => {
      for (const password of ['corta1', 'soloLetrasAqui', '123456789']) {
        const res = await gql(
          `mutation { register(firstName: "A", lastName: "B", rut: "${randomRut()}", email: "p${suffix}@test.cl", password: "${password}", role: "teacher") { message } }`,
        );
        expect(res.body.errors).toBeDefined();
      }
      const change = await gql('mutation { changePassword(newPassword: "abc") { message } }', owner.token);
      expect(change.body.errors).toBeDefined();
    });

    it('rechaza roles inválidos al registrarse', async () => {
      const res = await gql(
        `mutation { register(firstName: "A", lastName: "B", rut: "${randomRut()}", email: "r${suffix}@test.cl", password: "Clave12345", role: "superadmin") { message } }`,
      );
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('límites y protecciones', () => {
    it('limita los intentos de inicio de sesión', async () => {
      process.env.PROBAR_LIMITES = '1';
      try {
        const respuestas = [];
        for (let intento = 0; intento < 32; intento++) {
          respuestas.push(await gql('mutation { login(email: "nadie@test.cl", password: "xxxxxxxx") { token } }'));
        }
        const mensajes = respuestas.map((res) => res.body.errors?.[0]?.message ?? '');
        expect(mensajes[0]).toMatch(/Credenciales inválidas/);
        expect(mensajes[mensajes.length - 1]).toMatch(/Too Many Requests/);
      } finally {
        delete process.env.PROBAR_LIMITES;
      }
    });

    it('rechaza consultas demasiado profundas', async () => {
      let consulta = 'id';
      for (let nivel = 0; nivel < 6; nivel++) {
        consulta = `subjects { id course { ${consulta} } }`;
      }
      const res = await gql(`{ listCourses { ${consulta} } }`, admin.token);
      expect(res.body.errors[0].message).toMatch(/depth/i);
    });

    it('envía cabeceras de seguridad y no revela la tecnología del servidor', async () => {
      const res = await gql('{ listCourses { id } }', admin.token);
      expect(res.headers['x-powered-by']).toBeUndefined();
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBeDefined();
    });

    it('solo permite peticiones desde los orígenes configurados', async () => {
      const ajeno = await gql('{ listCourses { id } }', admin.token, undefined, 'https://sitio-malicioso.example');
      expect(ajeno.headers['access-control-allow-origin']).toBeUndefined();
      const propio = await gql('{ listCourses { id } }', admin.token, undefined, 'http://localhost:5173');
      expect(propio.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });
  });
});
