require('dotenv/config');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const PASSWORD = 'Demo1234';
const reset = process.argv.includes('--reset');

let state = 20261024;
const random = () => {
  state = (state * 1664525 + 1013904223) % 4294967296;
  return state / 4294967296;
};
const between = (min, max) => min + Math.floor(random() * (max - min + 1));
const pick = (list) => list[Math.floor(random() * list.length)];
const gauss = () => {
  let sum = 0;
  for (let i = 0; i < 6; i++) sum += random();
  return (sum - 3) / 0.7071;
};

const withDv = (body) => {
  let sum = 0;
  let mult = 2;
  for (const d of String(body).split('').reverse()) {
    sum += Number(d) * mult;
    mult = mult === 7 ? 2 : mult + 1;
  }
  const r = 11 - (sum % 11);
  const dv = r === 11 ? '0' : r === 10 ? 'K' : String(r);
  return String(body).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + dv;
};

const usedRuts = new Set();
const uniqueRut = (min = 9000000, max = 25000000) => {
  let body;
  do {
    body = between(min, max);
  } while (usedRuts.has(body));
  usedRuts.add(body);
  return withDv(body);
};

const isoDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const classDates = (weekdays) => {
  const dates = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let day = new Date(2026, 7, 3); day < today && dates.length < 40; day.setDate(day.getDate() + 1)) {
    if (weekdays.includes(day.getDay())) dates.push(isoDate(day));
  }
  return dates;
};

const normalize = (text) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');

const maleNames = ['Mateo', 'Benjamín', 'Vicente', 'Martín', 'Tomás', 'Agustín', 'Joaquín', 'Maximiliano', 'Felipe', 'Cristóbal', 'Nicolás', 'Sebastián', 'Gabriel', 'Lucas', 'Emilio'];
const femaleNames = ['Sofía', 'Isidora', 'Emilia', 'Florencia', 'Antonella', 'Josefa', 'Catalina', 'Javiera', 'Amanda', 'Constanza', 'Renata', 'Trinidad', 'Fernanda', 'Valentina', 'Agustina'];
const lastNames = ['González', 'Muñoz', 'Rojas', 'Díaz', 'Pérez', 'Soto', 'Contreras', 'Silva', 'Martínez', 'Sepúlveda', 'Morales', 'Rodríguez', 'López', 'Fuentes', 'Hernández', 'Torres', 'Araya', 'Flores', 'Espinoza', 'Valenzuela', 'Castillo', 'Tapia', 'Reyes', 'Gutiérrez', 'Castro', 'Pizarro', 'Álvarez', 'Vásquez', 'Sánchez', 'Fernández'];
const parentMale = ['Rodrigo', 'Claudio', 'Patricio', 'Marcelo', 'Eduardo', 'Cristian', 'Héctor', 'Gonzalo', 'Mauricio', 'Pablo'];
const parentFemale = ['Carolina', 'Patricia', 'Andrea', 'Mónica', 'Verónica', 'Daniela', 'Paola', 'Claudia', 'Marcela', 'Natalia', 'Lorena', 'Ximena'];

const courses = [
  ['1° Básico A', 'basica'],
  ['3° Básico B', 'basica'],
  ['6° Básico A', 'basica'],
  ['1° Medio A', 'media'],
  ['3° Medio B', 'media'],
];

const subjectNames = ['Matemática', 'Lenguaje y Comunicación', 'Historia y Geografía', 'Ciencias Naturales', 'Inglés', 'Educación Física'];

const staffTeachers = [
  ['Carlos', 'Muñoz', 'profesor@aulaconecta.cl'],
  ['Marta', 'Contreras', 'marta@aulaconecta.cl'],
  ['Andrés', 'Fuentes', 'andres.fuentes@aulaconecta.cl'],
  ['Valentina', 'Araya', 'valentina.araya@aulaconecta.cl'],
  ['Jorge', 'Pizarro', 'jorge.pizarro@aulaconecta.cl'],
  ['Camila', 'Sepúlveda', 'camila.sepulveda@aulaconecta.cl'],
  ['Ricardo', 'Tapia', 'ricardo.tapia@aulaconecta.cl'],
];

const notices = [
  ['Bienvenidos al segundo semestre 2026', 'Damos la bienvenida a toda la comunidad escolar. Las clases del segundo semestre comenzaron el 3 de agosto. Revisa el horario actualizado con el profesor jefe.', 70],
  ['Reunión de apoderados', 'La reunión del segundo semestre será el viernes 30 de octubre a las 18:30 en el gimnasio. Se tratarán el avance académico y las actividades de cierre de año.', 6],
  ['Semana de la ciencia', 'Entre el 9 y el 13 de noviembre se realizará la Semana de la Ciencia. Cada curso presentará un proyecto en la feria del día viernes.', 12],
  ['Cambio de horario de Educación Física', 'A contar del lunes, las clases de Educación Física de los cursos de enseñanza media se realizarán en el bloque de la mañana.', 4],
  ['Entrega de informes de notas', 'Los informes parciales de notas estarán disponibles para los apoderados desde el 6 de noviembre. Pueden consultarlos también en esta plataforma.', 2],
  ['Campaña de vacunación escolar', 'Se informa que la próxima semana se realizará la campaña de vacunación en coordinación con el consultorio municipal. Se enviará la autorización por correo.', 20],
  ['Licenciatura de cuarto medio', 'La ceremonia de licenciatura se realizará el 11 de diciembre a las 19:00. Cada familia podrá invitar a un máximo de cuatro personas.', 1],
];

const threads = [
  [
    ['t', 'Buenos días, le escribo para informarle que {child} ha tenido un buen desempeño este semestre en {subject}.'],
    ['p', 'Muchas gracias profesor, ¿cómo va su asistencia?'],
    ['t', 'Muy bien, solo registra una ausencia justificada. Seguimos en contacto.'],
  ],
  [
    ['p', 'Buenas tardes, quería consultar por la evaluación pendiente de {subject}. {child} estuvo con licencia médica.'],
    ['t', 'Buenas tardes. Puede rendirla el próximo martes después de clases. Le enviaré el temario por este medio.'],
    ['p', 'Perfecto, muchas gracias por la información.'],
  ],
  [
    ['t', 'Estimada apoderada, le recuerdo que la próxima semana hay prueba de {subject}. Sería bueno reforzar en casa los contenidos de la unidad.'],
    ['p', 'Entendido, repasaremos durante el fin de semana. ¿Hay algún material recomendado?'],
    ['t', 'Sí, revise la guía número 4 que se subió al cuaderno. Cualquier duda me avisa.'],
  ],
  [
    ['p', 'Hola profesor, {child} comentó que tiene dudas con {subject}. ¿Hay posibilidad de reforzamiento?'],
    ['t', 'Claro, los jueves a las 15:30 tengo un taller de reforzamiento en la sala 12. Puede asistir sin problemas.'],
  ],
];

async function truncate(db) {
  await db.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const table of ['message_entity', 'grades_entity', 'attendance_record_entity', 'asist_entity', 'subject_entity', 'course_entity', 'notice_entity', 'semester_entity', 'auth_entity', 'user_entity']) {
    await db.query(`TRUNCATE TABLE ${table}`);
  }
  await db.query('SET FOREIGN_KEY_CHECKS = 1');
}

async function main() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  if (reset) {
    await truncate(db);
  } else {
    const [existing] = await db.query("SELECT COUNT(*) c FROM user_entity WHERE email = 'admin@aulaconecta.cl'");
    if (existing[0].c) {
      console.log('La base ya tiene datos. Usa "npm run seed:reset" para regenerarla desde cero.');
      await db.end();
      return;
    }
  }

  const hash = await bcrypt.hash(PASSWORD, 10);
  const emails = new Set();
  const uniqueEmail = (first, last, domain = 'aulaconecta.cl') => {
    const base = `${normalize(first)}.${normalize(last)}`;
    let email = `${base}@${domain}`;
    let n = 1;
    while (emails.has(email)) {
      n += 1;
      email = `${base}${n}@${domain}`;
    }
    emails.add(email);
    return email;
  };

  const insertUser = async (firstName, lastName, rut, email, role, guardianId = null) => {
    emails.add(email);
    const [result] = await db.query(
      'INSERT INTO user_entity (firstName, lastName, rut, email, role, guardianId) VALUES (?,?,?,?,?,?)',
      [firstName, lastName, rut, email, role, guardianId],
    );
    if (role !== 'student') {
      await db.query('INSERT INTO auth_entity (idUser, password, isChangePass) VALUES (?,?,0)', [result.insertId, hash]);
    }
    return result.insertId;
  };

  await insertUser('Ana', 'Vergara', uniqueRut(), 'admin@aulaconecta.cl', 'admin');

  const teachers = [];
  for (const [first, last, email] of staffTeachers) {
    teachers.push({ id: await insertUser(first, last, uniqueRut(), email, 'teacher'), first, last });
  }

  const parents = [];
  const addParent = async (first, last, email) => {
    const id = await insertUser(first, last, uniqueRut(), email ?? uniqueEmail(first, last), 'parents');
    const parent = { id, first, last };
    parents.push(parent);
    return parent;
  };

  const students = [];
  const usedNames = new Set();
  const addStudent = async (first, last, parent, courseIndex) => {
    usedNames.add(`${first} ${last}`);
    const id = await insertUser(first, last, uniqueRut(7000000, 9500000), uniqueEmail(first, last), 'student', parent.id);
    const student = { id, first, last, parent, courseIndex, ability: 4.9 + random() * 1.4, presence: random() < 0.2 ? 0.58 + random() * 0.16 : 0.84 + random() * 0.15 };
    students.push(student);
    return student;
  };

  const paula = await addParent('Paula', 'Apoderada', 'apoderado@aulaconecta.cl');
  const roberto = await addParent('Roberto', 'Soto', 'apoderado2@aulaconecta.cl');
  await addStudent('Juan', 'Pérez', paula, 0);
  await addStudent('Sofía', 'Rojas', paula, 1);
  await addStudent('Diego', 'Soto', roberto, 2);

  const perCourse = 8;
  for (let courseIndex = 0; courseIndex < courses.length; courseIndex++) {
    const count = perCourse - students.filter((s) => s.courseIndex === courseIndex).length;
    for (let i = 0; i < count; i++) {
      const sibling = students.length > 3 && random() < 0.18 ? pick(students.slice(3)) : null;
      let parent;
      let childLast;
      if (sibling) {
        parent = sibling.parent;
        childLast = sibling.last;
      } else {
        const isFemale = random() < 0.6;
        const last = pick(lastNames);
        parent = await addParent(pick(isFemale ? parentFemale : parentMale), last);
        childLast = `${last} ${pick(lastNames)}`;
      }
      let childFirst = pick(random() < 0.5 ? maleNames : femaleNames);
      while (usedNames.has(`${childFirst} ${childLast}`)) {
        childFirst = pick(random() < 0.5 ? maleNames : femaleNames);
      }
      await addStudent(childFirst, childLast, parent, courseIndex);
    }
  }

  const courseIds = [];
  for (const [nameCourse, level] of courses) {
    const [result] = await db.query('INSERT INTO course_entity (nameCourse, level) VALUES (?,?)', [nameCourse, level]);
    courseIds.push(result.insertId);
  }

  const subjects = [];
  for (let ci = 0; ci < courseIds.length; ci++) {
    for (let si = 0; si < subjectNames.length; si++) {
      const teacher = teachers[(ci + si) % teachers.length];
      const [result] = await db.query(
        'INSERT INTO subject_entity (name, courseId, numberOfClasses, idTeacher) VALUES (?,?,?,?)',
        [subjectNames[si], courseIds[ci], 40, teacher.id],
      );
      const days = [1, 2, 3, 4, 5].sort(() => random() - 0.5).slice(0, between(2, 3));
      const dates = classDates(days);
      subjects.push({ id: result.insertId, name: subjectNames[si], courseIndex: ci, teacher, dates, held: dates.length });
    }
  }

  const asistRows = [];
  const recordRows = [];
  const gradeRows = [];
  for (const student of students) {
    for (const subject of subjects.filter((s) => s.courseIndex === student.courseIndex)) {
      let present = 0;
      for (const date of subject.dates) {
        const attended = random() < student.presence;
        if (attended) present += 1;
        recordRows.push([student.id, subject.id, date, attended ? 1 : 0]);
      }
      asistRows.push([student.id, subject.id, present, subject.held - present]);
      const total = between(3, 5);
      for (let i = 0; i < total; i++) {
        const value = Math.min(7, Math.max(2, student.ability + gauss() * 0.6));
        gradeRows.push([Math.round(value * 10) / 10, student.id, subject.id]);
      }
    }
  }
  await db.query('INSERT INTO asist_entity (idUser, idSubject, asist, absences) VALUES ?', [asistRows]);
  for (let i = 0; i < recordRows.length; i += 1000) {
    await db.query('INSERT INTO attendance_record_entity (idUser, idSubject, date, present) VALUES ?', [recordRows.slice(i, i + 1000)]);
  }
  await db.query('INSERT INTO grades_entity (grade, studentId, subjectId) VALUES ?', [gradeRows]);

  await db.query('INSERT INTO semester_entity (nameSemester, startDate, endDate, deadline) VALUES ?', [
    [
      ['2026-1', '2026-03-02', '2026-07-10', '2026-07-17'],
      ['2026-2', '2026-08-03', '2026-12-18', '2026-12-23'],
    ],
  ]);

  const daysAgo = (days, hour = 10) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    date.setHours(hour, between(0, 59), 0, 0);
    return date;
  };

  await db.query(
    'INSERT INTO notice_entity (title, description, createdAt) VALUES ?',
    [notices.map(([title, description, days]) => [title, description, daysAgo(days)])],
  );

  const messageRows = [];
  const carlos = teachers[0];
  const teacherSubjects = (teacher) => subjects.filter((s) => s.teacher.id === teacher.id);
  let threadIndex = 0;
  for (const teacher of teachers.slice(0, 4)) {
    const taught = teacherSubjects(teacher);
    const classStudents = students.filter((s) => taught.some((t) => t.courseIndex === s.courseIndex));
    const chosen = [];
    if (teacher.id === carlos.id) {
      chosen.push(students[0], students[1]);
    }
    while (chosen.length < 3 && classStudents.length) {
      const candidate = pick(classStudents);
      if (!chosen.includes(candidate)) chosen.push(candidate);
    }
    for (const student of chosen) {
      const subject = taught.find((t) => t.courseIndex === student.courseIndex) ?? taught[0];
      const thread = threads[threadIndex % threads.length];
      threadIndex += 1;
      const start = between(2, 25);
      thread.forEach(([who, text], i) => {
        const content = text.replace('{child}', student.first).replace('{subject}', subject.name);
        const from = who === 't' ? teacher.id : student.parent.id;
        const to = who === 't' ? student.parent.id : teacher.id;
        messageRows.push([from, to, content, daysAgo(Math.max(0, start - i), 9 + i * 3)]);
      });
    }
  }
  await db.query('INSERT INTO message_entity (fromId, toId, content, createdAt) VALUES ?', [messageRows]);

  const [[counts]] = await db.query(
    "SELECT (SELECT COUNT(*) FROM user_entity) users, (SELECT COUNT(*) FROM subject_entity) subjects, (SELECT COUNT(*) FROM grades_entity) grades, (SELECT COUNT(*) FROM message_entity) messages",
  );
  console.log(`seed ok: ${counts.users} usuarios, ${courses.length} cursos, ${counts.subjects} asignaturas, ${counts.grades} notas, ${counts.messages} mensajes`);
  await db.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
