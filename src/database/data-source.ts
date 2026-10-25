import 'dotenv/config';
import { join } from 'path';
import { DataSource } from 'typeorm';
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import { NoticeEntity } from '../advices/entities/notice.entity';
import { AsistEntity } from '../asist/entities/asist.entity';
import { AttendanceRecordEntity } from '../asist/entities/attendance-record.entity';
import { AuthEntity } from '../auth/entity/auth.entity';
import { CourseEntity } from '../course/entity/course.entity';
import { GradeEntity } from '../grades/entities/grade.entity';
import { MessageEntity } from '../messages/entities/message.entity';
import { SemesterEntity } from '../semester/entity/semester.entity';
import { SubjectEntity } from '../subject/entities/subject.entity';
import { UserEntity } from '../user/entity/user.entity';

export const entidades = [
    NoticeEntity,
    AsistEntity,
    AttendanceRecordEntity,
    AuthEntity,
    CourseEntity,
    GradeEntity,
    MessageEntity,
    SemesterEntity,
    SubjectEntity,
    UserEntity,
];

export const opcionesBase = (): MysqlConnectionOptions => ({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
});

export default new DataSource({ ...opcionesBase(), entities: entidades });
