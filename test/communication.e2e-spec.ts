import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createApp, createClient, randomRut, uniqueSuffix } from './helpers';

describe('Anuncios, mensajes y semestres (e2e)', () => {
  let app: INestApplication;
  let gql: ReturnType<typeof createClient>['gql'];
  let login: ReturnType<typeof createClient>['login'];
  let admin: Awaited<ReturnType<typeof login>>;
  let teacher: Awaited<ReturnType<typeof login>>;
  let parent: Awaited<ReturnType<typeof login>>;

  const suffix = uniqueSuffix();
  const loneTeacherRut = randomRut();
  const loneParentRut = randomRut();
  const childRut = randomRut();

  beforeAll(async () => {
    app = await createApp();
    ({ gql, login } = createClient(app));
    admin = await login('admin@aulaconecta.cl');
    teacher = await login('profesor@aulaconecta.cl');
    parent = await login('apoderado@aulaconecta.cl');
  }, 120000);

  afterAll(async () => {
    await app.get(DataSource).query("DELETE FROM message_entity WHERE content LIKE 'E2E %'");
    for (const rut of [childRut, loneParentRut, loneTeacherRut]) {
      await gql(`mutation { removeUser(rut: "${rut}") }`, admin.token);
    }
    await app.close();
  });

  describe('anuncios', () => {
    let noticeId: number;

    it('profesor y administrador publican anuncios', async () => {
      const res = await gql(
        `mutation { createNotice(title: "E2E ${suffix}", description: "Contenido de prueba", imageUrl: "https://example.com/a.png") { isCreateNotice } }`,
        teacher.token,
      );
      expect(res.body.data.createNotice.isCreateNotice).toBe(true);
      const byAdmin = await gql(
        `mutation { createNotice(title: "E2E admin ${suffix}", description: "Otro") { isCreateNotice } }`,
        admin.token,
      );
      expect(byAdmin.body.data.createNotice.isCreateNotice).toBe(true);
    });

    it('los apoderados leen los anuncios, más recientes primero', async () => {
      const res = await gql('{ getAllNotices { id title imageUrl createdAt } }', parent.token);
      const notices = res.body.data.getAllNotices;
      expect(notices[0].title).toMatch(/^E2E/);
      noticeId = Number(notices.find((n: { title: string }) => n.title === `E2E ${suffix}`).id);
    });

    it('un apoderado no publica ni elimina anuncios', async () => {
      const create = await gql('mutation { createNotice(title: "x", description: "y") { isCreateNotice } }', parent.token);
      expect(create.body.errors[0].message).toMatch(/permisos/);
      const remove = await gql(`mutation { deleteNotice(id: ${noticeId}) }`, parent.token);
      expect(remove.body.errors[0].message).toMatch(/permisos/);
    });

    it('elimina anuncios y reporta los inexistentes', async () => {
      const notices = await gql('{ getAllNotices { id title } }', teacher.token);
      for (const notice of notices.body.data.getAllNotices.filter((n: { title: string }) => n.title.startsWith('E2E'))) {
        const res = await gql(`mutation { deleteNotice(id: ${notice.id}) }`, teacher.token);
        expect(res.body.data.deleteNotice).toBe(true);
      }
      const again = await gql(`mutation { deleteNotice(id: ${noticeId}) }`, teacher.token);
      expect(again.body.data.deleteNotice).toBe(false);
    });
  });

  describe('mensajes', () => {
    it('el administrador ve a profesores y apoderados como contactos', async () => {
      const res = await gql('{ chatContacts { id role } }', admin.token);
      const roles = new Set(res.body.data.chatContacts.map((c: { role: string }) => c.role));
      expect(roles).toEqual(new Set(['Teacher', 'Parents']));
    });

    it('profesor y apoderado pueden conversar', async () => {
      const contacts = await gql('{ chatContacts { id } }', teacher.token);
      expect(contacts.body.data.chatContacts.some((c: { id: string }) => Number(c.id) === parent.id)).toBe(true);
      const parentContacts = await gql('{ chatContacts { id } }', parent.token);
      expect(parentContacts.body.data.chatContacts.some((c: { id: string }) => Number(c.id) === teacher.id)).toBe(true);

      const sent = await gql(
        `mutation { sendMessage(toId: ${parent.id}, content: "  E2E hola apoderado  ") { id content fromId toId } }`,
        teacher.token,
      );
      expect(sent.body.data.sendMessage.content).toBe('E2E hola apoderado');
      await gql(`mutation { sendMessage(toId: ${teacher.id}, content: "E2E respuesta") { id } }`, parent.token);
      const thread = await gql(`{ conversation(withId: ${teacher.id}) { content fromId } }`, parent.token);
      const contents = thread.body.data.conversation.map((m: { content: string }) => m.content);
      expect(contents).toEqual(expect.arrayContaining(['E2E hola apoderado', 'E2E respuesta']));
    });

    it('rechaza mensajes vacíos y conversaciones no permitidas', async () => {
      const empty = await gql(`mutation { sendMessage(toId: ${parent.id}, content: "   ") { id } }`, teacher.token);
      expect(empty.body.errors[0].message).toMatch(/no puede estar vacío/);
      const forbidden = await gql(`mutation { sendMessage(toId: ${admin.id}, content: "E2E x") { id } }`, parent.token);
      expect(forbidden.body.errors[0].message).toMatch(/No puedes conversar/);
      const thread = await gql(`{ conversation(withId: ${admin.id}) { id } }`, parent.token);
      expect(thread.body.errors[0].message).toMatch(/No puedes conversar/);
    });

    it('un profesor sin asignaturas y un apoderado sin pupilos no tienen contactos', async () => {
      await gql(
        `mutation { register(firstName: "Sin", lastName: "Clases", rut: "${loneTeacherRut}", email: "lone.teacher${suffix}@test.cl", password: "Clave12345", role: "teacher") { message } }`,
      );
      await gql(
        `mutation { register(firstName: "Sin", lastName: "Pupilos", rut: "${loneParentRut}", email: "lone.parent${suffix}@test.cl", password: "Clave12345", role: "parents") { message } }`,
      );
      const loneTeacher = await login(`lone.teacher${suffix}@test.cl`, 'Clave12345');
      const loneParent = await login(`lone.parent${suffix}@test.cl`, 'Clave12345');
      const teacherContacts = await gql('{ chatContacts { id } }', loneTeacher.token);
      expect(teacherContacts.body.data.chatContacts).toHaveLength(0);
      const parentContacts = await gql('{ chatContacts { id } }', loneParent.token);
      expect(parentContacts.body.data.chatContacts).toHaveLength(0);

      await gql(
        `mutation { createUser(createUserDto: { firstName: "Sin", lastName: "Inscripción", rut: "${childRut}", email: "child${suffix}@test.cl", role: Student, guardianRut: "${loneParentRut}" }) { id } }`,
        admin.token,
      );
      const withChild = await gql('{ chatContacts { id } }', loneParent.token);
      expect(withChild.body.data.chatContacts).toHaveLength(0);
    });
  });

  describe('semestres', () => {
    const name = `E2E-${suffix}`;
    const renamed = `E2E-${suffix}-B`;

    it('crea, actualiza y elimina un semestre', async () => {
      const created = await gql(
        `mutation { createSemester(createSemesterDto: { nameSemester: "${name}", startDate: "2031-03-01T00:00:00.000Z", endDate: "2031-07-01T00:00:00.000Z", deadline: "2031-07-10T00:00:00.000Z" }) }`,
        admin.token,
      );
      expect(created.body.data.createSemester).toBe(true);
      const duplicate = await gql(
        `mutation { createSemester(createSemesterDto: { nameSemester: "${name}", startDate: "2031-03-01T00:00:00.000Z", endDate: "2031-07-01T00:00:00.000Z", deadline: "2031-07-10T00:00:00.000Z" }) }`,
        admin.token,
      );
      expect(duplicate.body.errors[0].message).toMatch(/ya existe/);

      const updated = await gql(
        `mutation { updateSemester(updateSemesterDto: { nameSemester: "${name}", newNameSemester: "${renamed}", startDate: "2031-03-02T00:00:00.000Z", endDate: "2031-07-02T00:00:00.000Z", deadline: "2031-07-11T00:00:00.000Z" }) }`,
        admin.token,
      );
      expect(updated.body.data.updateSemester).toBe(true);
      const noChanges = await gql(`mutation { updateSemester(updateSemesterDto: { nameSemester: "${renamed}" }) }`, admin.token);
      expect(noChanges.body.errors[0].message).toMatch(/No hay cambios/);
      const missing = await gql('mutation { updateSemester(updateSemesterDto: { nameSemester: "No existe", newNameSemester: "x" }) }', admin.token);
      expect(missing.body.errors[0].message).toMatch(/no existe/);

      const removed = await gql(`mutation { deleteSemester(deleteSemesterDto: { nameSemester: "${renamed}" }) }`, admin.token);
      expect(removed.body.data.deleteSemester).toBe(true);
      const removedAgain = await gql(`mutation { deleteSemester(deleteSemesterDto: { nameSemester: "${renamed}" }) }`, admin.token);
      expect(removedAgain.body.errors[0].message).toMatch(/no existe/);
    });
  });
});
