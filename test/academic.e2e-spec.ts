import { INestApplication } from '@nestjs/common';
import { createApp, createClient, randomRut, uniqueSuffix } from './helpers';

describe('Cursos, asignaturas, asistencia y notas (e2e)', () => {
  let app: INestApplication;
  let gql: ReturnType<typeof createClient>['gql'];
  let login: ReturnType<typeof createClient>['login'];
  let admin: Awaited<ReturnType<typeof login>>;
  let teacher: Awaited<ReturnType<typeof login>>;
  let parent: Awaited<ReturnType<typeof login>>;

  const suffix = uniqueSuffix();
  const courseName = `Curso E2E ${suffix}`;
  const renamedCourse = `Curso E2E ${suffix} B`;
  const subjectName = `Materia E2E ${suffix}`;
  const studentRut = randomRut();
  const guardianRut = randomRut();
  let courseId: number;
  let subjectId: number;
  let studentId: number;
  let guardianId: number;
  let gradeId: number;

  beforeAll(async () => {
    app = await createApp();
    ({ gql, login } = createClient(app));
    admin = await login('admin@aulaconecta.cl');
    teacher = await login('profesor@aulaconecta.cl');
    parent = await login('apoderado@aulaconecta.cl');

    await gql(
      `mutation { createUser(createUserDto: { firstName: "Tutor", lastName: "E2E", rut: "${guardianRut}", email: "tutor${suffix}@test.cl", role: Parents, password: "Clave12345" }) { id } }`,
      admin.token,
    ).then((res) => {
      guardianId = Number(res.body.data.createUser.id);
    });
    await gql(
      `mutation { createUser(createUserDto: { firstName: "Alumno", lastName: "E2E", rut: "${studentRut}", email: "alumno${suffix}@test.cl", role: Student, guardianRut: "${guardianRut}" }) { id } }`,
      admin.token,
    ).then((res) => {
      studentId = Number(res.body.data.createUser.id);
    });
  }, 120000);

  afterAll(async () => {
    await gql(`mutation { removeUser(rut: "${studentRut}") }`, admin.token);
    await gql(`mutation { removeUser(rut: "${guardianRut}") }`, admin.token);
    await app.close();
  });

  describe('cursos', () => {
    it('crea y lista cursos', async () => {
      const created = await gql(
        `mutation { createCourse(createCourseDto: { nameCourse: "${courseName}", level: Media }) }`,
      );
      expect(created.body.data.createCourse).toBe(true);
      const list = await gql('{ listCourses { id nameCourse level subjects { id } } }');
      const course = list.body.data.listCourses.find((c: { nameCourse: string }) => c.nameCourse === courseName);
      expect(course.level).toBe('Media');
      courseId = Number(course.id);
    });

    it('rechaza un curso duplicado', async () => {
      const res = await gql(`mutation { createCourse(createCourseDto: { nameCourse: "${courseName}", level: Media }) }`);
      expect(res.body.errors[0].message).toMatch(/ya esta creado/);
    });

    it('actualiza un curso y valida los cambios', async () => {
      const ok = await gql(
        `mutation { updateCourseDto(updateCourseDto: { nameCourse: "${courseName}", level: Media, newName: "${renamedCourse}", newLevel: Basica }) }`,
      );
      expect(ok.body.data.updateCourseDto).toBe(true);
      const noChanges = await gql(
        `mutation { updateCourseDto(updateCourseDto: { nameCourse: "${renamedCourse}", level: Basica }) }`,
      );
      expect(noChanges.body.errors[0].message).toMatch(/No hay cambios/);
      const missing = await gql(
        'mutation { updateCourseDto(updateCourseDto: { nameCourse: "No existe", level: Basica, newName: "x" }) }',
      );
      expect(missing.body.errors[0].message).toMatch(/no existe/);
    });
  });

  describe('asignaturas', () => {
    it('el profesor crea una asignatura en un curso', async () => {
      const res = await gql(
        `mutation { createSubject(createSubjectInput: { name: "${subjectName}", numberOfClasses: 10, courseId: ${courseId} }) { isCreateSubject } }`,
        teacher.token,
      );
      expect(res.body.data.createSubject.isCreateSubject).toBe(true);
      const list = await gql('{ listSubject { id name idTeacher course { id } } }');
      const subject = list.body.data.listSubject.find((s: { name: string }) => s.name === subjectName);
      subjectId = Number(subject.id);
      expect(subject.idTeacher).toBe(teacher.id);
    });

    it('rechaza crear una asignatura sin sesión o en un curso inexistente', async () => {
      const anon = await gql(
        `mutation { createSubject(createSubjectInput: { name: "x", numberOfClasses: 1, courseId: ${courseId} }) { isCreateSubject } }`,
      );
      expect(anon.body.errors[0].message).toMatch(/No token found/);
      const bad = await gql(
        'mutation { createSubject(createSubjectInput: { name: "x", numberOfClasses: 1, courseId: 999999 }) { isCreateSubject } }',
        teacher.token,
      );
      expect(bad.body.errors[0].message).toMatch(/no encontrado/);
      const malformed = await gql(
        `mutation { createSubject(createSubjectInput: { name: "x", numberOfClasses: 1, courseId: ${courseId} }) { isCreateSubject } }`,
        undefined,
        'Token abc',
      );
      expect(malformed.body.errors).toBeDefined();
    });

    it('el administrador asigna asignaturas a un profesor', async () => {
      const ok = await gql(
        `mutation { addNewSubjectAdmin(createSubjectAdminInput: { name: "${subjectName} Admin", numberOfClasses: 5, courseId: ${courseId}, idTeacher: ${teacher.id} }) { isCreateSubject } }`,
      );
      expect(ok.body.data.addNewSubjectAdmin.isCreateSubject).toBe(true);
      const badCourse = await gql(
        `mutation { addNewSubjectAdmin(createSubjectAdminInput: { name: "x", courseId: 999999, idTeacher: ${teacher.id} }) { isCreateSubject } }`,
      );
      expect(badCourse.body.errors[0].message).toMatch(/no encontrado/);
      const badTeacher = await gql(
        `mutation { addNewSubjectAdmin(createSubjectAdminInput: { name: "x", courseId: ${courseId}, idTeacher: 0 }) { isCreateSubject } }`,
      );
      expect(badTeacher.body.errors[0].message).toMatch(/no válido/);
    });

    it('consulta por id y por profesor', async () => {
      const byId = await gql(`{ subjectById(id: ${subjectId}) { name course { nameCourse } } }`);
      expect(byId.body.data.subjectById.course.nameCourse).toBe(renamedCourse);
      const byTeacher = await gql(`{ getAllSubjectByIdTeacher(idTeacher: ${teacher.id}) { name } }`);
      expect(byTeacher.body.data.getAllSubjectByIdTeacher.length).toBeGreaterThan(0);
    });

    it('actualiza una asignatura', async () => {
      const res = await gql(
        `mutation { updateSubject(updateSubjectInput: { name: "${subjectName} Admin", newName: "${subjectName} Renombrada", numberOfClasses: 8, courseId: ${courseId} }) { name numberOfClasses } }`,
      );
      expect(res.body.data.updateSubject.name).toMatch(/Renombrada/);
      const missing = await gql('mutation { updateSubject(updateSubjectInput: { name: "No existe" }) { name } }');
      expect(missing.body.errors[0].message).toMatch(/no encontrado/);
      const badCourse = await gql(
        `mutation { updateSubject(updateSubjectInput: { name: "${subjectName} Renombrada", courseId: 999999 }) { name } }`,
      );
      expect(badCourse.body.errors[0].message).toMatch(/no encontrado/);
    });

    it('elimina asignaturas por nombre', async () => {
      const res = await gql(`mutation { removeSubject(name: "${subjectName} Renombrada") }`);
      expect(res.body.data.removeSubject).toBe(true);
      const missing = await gql('mutation { removeSubject(name: "No existe") }');
      expect(missing.body.errors[0].message).toMatch(/no encontrado/);
    });
  });

  describe('asistencia', () => {
    it('inscribe a un estudiante y rechaza casos inválidos', async () => {
      const ok = await gql(`mutation { enrollStudent(idUser: ${studentId}, idSubject: ${subjectId}) }`, teacher.token);
      expect(ok.body.data.enrollStudent).toBe(true);
      const again = await gql(`mutation { enrollStudent(idUser: ${studentId}, idSubject: ${subjectId}) }`, teacher.token);
      expect(again.body.data.enrollStudent).toBe(true);
      const notStudent = await gql(`mutation { enrollStudent(idUser: ${guardianId}, idSubject: ${subjectId}) }`, teacher.token);
      expect(notStudent.body.errors[0].message).toMatch(/Solo se pueden inscribir estudiantes/);
      const noSubject = await gql(`mutation { enrollStudent(idUser: ${studentId}, idSubject: 999999) }`, teacher.token);
      expect(noSubject.body.errors[0].message).toMatch(/no existe/);
      const forbidden = await gql(`mutation { enrollStudent(idUser: ${studentId}, idSubject: ${subjectId}) }`, parent.token);
      expect(forbidden.body.errors[0].message).toMatch(/permisos/);
    });

    const mark = (present: boolean, date?: string) =>
      gql(
        `mutation { takeAsist(createAsistInput: { ${date ? `date: "${date}", ` : ''}asistencias: [{ idUser: ${studentId}, idSubject: ${subjectId}, asist: ${present ? 1 : 0}, absences: ${present ? 0 : 1} }] }) }`,
        teacher.token,
      );

    it('registra asistencias por fecha y acumula los totales', async () => {
      expect((await mark(true, '2026-10-01')).body.data.takeAsist).toBe(true);
      expect((await mark(true, '2026-10-02')).body.data.takeAsist).toBe(true);
      expect((await mark(false, '2026-10-03')).body.data.takeAsist).toBe(true);
      const list = await gql(
        `{ listUsersBySubject(idSubject: ${subjectId}) { user { id } totalAsist totalAbsences } }`,
        teacher.token,
      );
      expect(list.body.data.listUsersBySubject[0]).toMatchObject({ totalAsist: 2, totalAbsences: 1 });
    });

    it('corrige un día ya registrado sin duplicarlo', async () => {
      expect((await mark(false, '2026-10-02')).body.data.takeAsist).toBe(true);
      expect((await mark(false, '2026-10-02')).body.data.takeAsist).toBe(true);
      let list = await gql(
        `{ listUsersBySubject(idSubject: ${subjectId}) { totalAsist totalAbsences } }`,
        teacher.token,
      );
      expect(list.body.data.listUsersBySubject[0]).toMatchObject({ totalAsist: 1, totalAbsences: 2 });
      expect((await mark(true, '2026-10-02')).body.data.takeAsist).toBe(true);
      list = await gql(`{ listUsersBySubject(idSubject: ${subjectId}) { totalAsist totalAbsences } }`, teacher.token);
      expect(list.body.data.listUsersBySubject[0]).toMatchObject({ totalAsist: 2, totalAbsences: 1 });
    });

    it('registra con la fecha de hoy por defecto y rechaza fechas inválidas o futuras', async () => {
      expect((await mark(true)).body.data.takeAsist).toBe(true);
      const future = await mark(true, '2999-01-01');
      expect(future.body.errors[0].message).toMatch(/fecha futura/);
      const malformed = await mark(true, '24-10-2026');
      expect(malformed.body.errors[0].message).toMatch(/AAAA-MM-DD/);
      const impossible = await mark(true, '2026-02-31');
      expect(impossible.body.errors[0].message).toMatch(/AAAA-MM-DD/);
      await mark(false);
      const calendar = await gql(
        `{ subjectAttendanceCalendar(subjectId: ${subjectId}) { days { date } } }`,
        teacher.token,
      );
      expect(calendar.body.data.subjectAttendanceCalendar.days).toHaveLength(4);
    });

    it('entrega el calendario de asistencia con los días registrados', async () => {
      const res = await gql(
        `{ subjectAttendanceCalendar(subjectId: ${subjectId}) {
          subject { name }
          days { date present absent percentage }
          students { user { id } totalAsist totalAbsences percentage marks { date present } }
        } }`,
        teacher.token,
      );
      const calendar = res.body.data.subjectAttendanceCalendar;
      expect(calendar.days.map((day: { date: string }) => day.date).slice(0, 3)).toEqual(['2026-10-01', '2026-10-02', '2026-10-03']);
      expect(calendar.days[0]).toMatchObject({ present: 1, absent: 0, percentage: 100 });
      expect(calendar.days[2]).toMatchObject({ present: 0, absent: 1, percentage: 0 });
      expect(calendar.students).toHaveLength(1);
      expect(calendar.students[0].marks.slice(0, 3)).toEqual([
        { date: '2026-10-01', present: true },
        { date: '2026-10-02', present: true },
        { date: '2026-10-03', present: false },
      ]);
    });

    it('controla el acceso al calendario', async () => {
      const missing = await gql('{ subjectAttendanceCalendar(subjectId: 999999) { days { date } } }', teacher.token);
      expect(missing.body.errors[0].message).toMatch(/no existe/);
      const denied = await gql(`{ subjectAttendanceCalendar(subjectId: ${subjectId}) { days { date } } }`, parent.token);
      expect(denied.body.errors[0].message).toMatch(/permisos/);
    });

    it('registra asistencia de un estudiante no inscrito aún', async () => {
      const res = await gql(
        `mutation { takeAsist(createAsistInput: { asistencias: [{ idUser: ${studentId}, idSubject: 999998, asist: 1, absences: 0 }] }) }`,
        teacher.token,
      );
      expect(res.body.data.takeAsist).toBe(true);
      await gql(`mutation { unenrollStudent(idUser: ${studentId}, idSubject: 999998) }`, teacher.token);
    });

    it('un apoderado no puede registrar asistencia', async () => {
      const res = await gql(
        `mutation { takeAsist(createAsistInput: { asistencias: [{ idUser: ${studentId}, idSubject: ${subjectId}, asist: 1, absences: 0 }] }) }`,
        parent.token,
      );
      expect(res.body.errors[0].message).toMatch(/permisos/);
    });

    it('entrega el resumen global por asignatura', async () => {
      const res = await gql(
        `{ subjectAttendanceSummary(subjectId: ${subjectId}) { students classesHeld totalAsist totalAbsences percentage subject { name } studentsSummary { percentage user { id } } } }`,
        teacher.token,
      );
      expect(res.body.data.subjectAttendanceSummary).toMatchObject({
        students: 1,
        classesHeld: 4,
        totalAsist: 2,
        totalAbsences: 2,
        percentage: 50,
      });
      const missing = await gql('{ subjectAttendanceSummary(subjectId: 999999) { students } }', teacher.token);
      expect(missing.body.errors[0].message).toMatch(/no existe/);
      const denied = await gql(`{ subjectAttendanceSummary(subjectId: ${subjectId}) { students } }`, parent.token);
      expect(denied.body.errors[0].message).toMatch(/permisos/);
    });

    it('entrega el resumen global por curso', async () => {
      const res = await gql(
        '{ courseAttendanceSummaries { course { nameCourse } students classesHeld percentage subjects { subject { name } percentage } studentsSummary { percentage } } }',
        admin.token,
      );
      const course = res.body.data.courseAttendanceSummaries.find(
        (c: { course: { nameCourse: string } }) => c.course.nameCourse === renamedCourse,
      );
      expect(course.students).toBe(1);
      expect(course.percentage).toBe(50);
      expect(course.studentsSummary).toHaveLength(1);
      const empty = res.body.data.courseAttendanceSummaries.find(
        (c: { students: number }) => c.students === 0,
      );
      if (empty) {
        expect(empty.percentage).toBe(0);
      }
      const denied = await gql('{ courseAttendanceSummaries { students } }', parent.token);
      expect(denied.body.errors[0].message).toMatch(/permisos/);
    });

    it('controla el acceso a la asistencia de cada estudiante', async () => {
      const tutor = await login(`tutor${suffix}@test.cl`, 'Clave12345');
      const own = await gql(`{ attendanceByStudent(studentId: ${studentId}) { totalAsist subject { name } } }`, tutor.token);
      expect(own.body.data.attendanceByStudent[0].totalAsist).toBe(2);
      const foreign = await gql(`{ attendanceByStudent(studentId: ${studentId}) { totalAsist } }`, parent.token);
      expect(foreign.body.errors[0].message).toMatch(/no está a tu cargo/);
      const staff = await gql(`{ attendanceByStudent(studentId: ${studentId}) { totalAsist } }`, teacher.token);
      expect(staff.body.data.attendanceByStudent).toHaveLength(1);
    });

    it('retira a un estudiante de la asignatura', async () => {
      const res = await gql(`mutation { unenrollStudent(idUser: ${studentId}, idSubject: ${subjectId}) }`, teacher.token);
      expect(res.body.data.unenrollStudent).toBe(true);
      const list = await gql(`{ listUsersBySubject(idSubject: ${subjectId}) { totalAsist } }`, teacher.token);
      expect(list.body.data.listUsersBySubject).toHaveLength(0);
      await gql(`mutation { enrollStudent(idUser: ${studentId}, idSubject: ${subjectId}) }`, teacher.token);
    });
  });

  describe('notas', () => {
    it('crea notas y valida la escala', async () => {
      const ok = await gql(
        `mutation { createGrade(createGradeDto: { grade: 6.5, studentId: ${studentId}, subjectId: ${subjectId} }) { id grade } }`,
        teacher.token,
      );
      expect(ok.body.data.createGrade.grade).toBe(6.5);
      gradeId = Number(ok.body.data.createGrade.id);
      await gql(
        `mutation { createGrade(createGradeDto: { grade: 5.5, studentId: ${studentId}, subjectId: ${subjectId} }) { id } }`,
        teacher.token,
      );
      const high = await gql(
        `mutation { createGrade(createGradeDto: { grade: 7.5, studentId: ${studentId}, subjectId: ${subjectId} }) { id } }`,
        teacher.token,
      );
      expect(high.body.errors).toBeDefined();
      const low = await gql(
        `mutation { createGrade(createGradeDto: { grade: 0.5, studentId: ${studentId}, subjectId: ${subjectId} }) { id } }`,
        teacher.token,
      );
      expect(low.body.errors).toBeDefined();
    });

    it('consulta notas y promedios', async () => {
      const queries = await gql(
        `{
          byStudent: gradesByStudentId(studentId: ${studentId}) { id }
          bySubject: gradesBySubjectId(subjectId: ${subjectId}) { id }
          one: findGradeById(id: ${gradeId}) { grade }
          all: getAllGrades { id }
          both: gradesByStudentAndSubject(studentId: ${studentId}, subjectId: ${subjectId}) { id }
          average: averageGradeByStudentAndSubject(studentId: ${studentId}, subjectId: ${subjectId})
          none: averageGradeByStudentAndSubject(studentId: ${studentId}, subjectId: 999999)
        }`,
        teacher.token,
      );
      const data = queries.body.data;
      expect(data.byStudent).toHaveLength(2);
      expect(data.bySubject).toHaveLength(2);
      expect(data.one.grade).toBe(6.5);
      expect(data.all.length).toBeGreaterThan(2);
      expect(data.both).toHaveLength(2);
      expect(data.average).toBe(6);
      expect(data.none).toBe(0);
    });

    it('el apoderado solo consulta las notas de sus pupilos', async () => {
      const tutor = await login(`tutor${suffix}@test.cl`, 'Clave12345');
      const own = await gql(`{ gradesByStudentId(studentId: ${studentId}) { grade } }`, tutor.token);
      expect(own.body.data.gradesByStudentId).toHaveLength(2);
      const foreign = await gql(`{ gradesByStudentId(studentId: ${studentId}) { grade } }`, parent.token);
      expect(foreign.body.errors[0].message).toMatch(/no está a tu cargo/);
      const average = await gql(
        `{ averageGradeByStudentAndSubject(studentId: ${studentId}, subjectId: ${subjectId}) }`,
        parent.token,
      );
      expect(average.body.errors).toBeDefined();
      const bySubject = await gql(`{ gradesBySubjectId(subjectId: ${subjectId}) { id } }`, parent.token);
      expect(bySubject.body.errors[0].message).toMatch(/permisos/);
    });

    it('actualiza y elimina notas', async () => {
      const updated = await gql(
        `mutation { updateGrade(id: ${gradeId}, updateGradeDto: { grade: 4.5 }) { grade } }`,
        teacher.token,
      );
      expect(updated.body.data.updateGrade.grade).toBe(4.5);
      const missing = await gql('mutation { updateGrade(id: 999999, updateGradeDto: { grade: 4.5 }) { grade } }', teacher.token);
      expect(missing.body.errors).toBeDefined();
      const removed = await gql(`mutation { deleteGrade(id: ${gradeId}) }`, teacher.token);
      expect(removed.body.data.deleteGrade).toBe(true);
      const removedAgain = await gql(`mutation { deleteGrade(id: ${gradeId}) }`, teacher.token);
      expect(removedAgain.body.errors).toBeDefined();
    });
  });

  describe('limpieza', () => {
    it('elimina la asignatura por id (con su asistencia y notas) y el curso', async () => {
      const denied = await gql(`mutation { deleteSubjectById(id: ${subjectId}) }`);
      expect(denied.body.errors[0].message).toMatch(/No token found/);
      const removed = await gql(`mutation { deleteSubjectById(id: ${subjectId}) }`, teacher.token);
      expect(removed.body.data.deleteSubjectById).toBe(true);
      const missing = await gql(`mutation { deleteSubjectById(id: ${subjectId}) }`, teacher.token);
      expect(missing.body.errors[0].message).toMatch(/no existe/);

      const withSubjects = await gql(
        `{ listCourses { id subjects { id } } }`,
      );
      const course = withSubjects.body.data.listCourses.find((c: { id: string }) => Number(c.id) === courseId);
      for (const subject of course.subjects) {
        await gql(`mutation { deleteSubjectById(id: ${subject.id}) }`, teacher.token);
      }
      const res = await gql(
        `mutation { deleteCourseDto(deleteCourseDto: { nameCourse: "${renamedCourse}", level: Basica }) }`,
      );
      expect(res.body.data.deleteCourseDto).toBe(true);
      const missingCourse = await gql(
        `mutation { deleteCourseDto(deleteCourseDto: { nameCourse: "${renamedCourse}", level: Basica }) }`,
      );
      expect(missingCourse.body.errors[0].message).toMatch(/no existe/);
    });

    it('no elimina cursos con asignaturas asociadas', async () => {
      const first = await gql('{ listCourses { nameCourse level subjects { id } } }');
      const withSubjects = first.body.data.listCourses.find((c: { subjects: unknown[] }) => c.subjects.length > 0);
      const res = await gql(
        `mutation { deleteCourseDto(deleteCourseDto: { nameCourse: "${withSubjects.nameCourse}", level: ${withSubjects.level} }) }`,
      );
      expect(res.body.errors[0].message).toMatch(/asignaturas asociadas/);
    });
  });
});
