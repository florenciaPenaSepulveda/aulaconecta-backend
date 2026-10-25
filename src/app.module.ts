import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { SubjectModule } from './subject/subject.module';
import { AsistModule } from './asist/asist.module';
import { AdvicesModule } from './advices/advices.module';
import { CourseModule } from './course/course.module';
import { SemesterModule } from './semester/semester.module';
import { GraphQLModule } from '@nestjs/graphql';
import { GradesModule } from './grades/grades.module';
import { ApolloDriver, ApolloDriverConfig} from '@nestjs/apollo';
import { MessagesModule } from './messages/messages.module';
import { join } from 'path';


@Module({
  imports: [
    AdvicesModule,
    UserModule,
    AuthModule,
    AsistModule,
    SubjectModule,
    GradesModule,
    CourseModule,
    SemesterModule,
    MessagesModule,
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      autoLoadEntities: true,
      synchronize: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver:ApolloDriver,
      autoSchemaFile: {
        path: join(process.cwd(), 'src', 'graphql', 'schema.gql'),
      },
      playground: true,
      context: ({ req }) => ({ req }),
    }),
  ],
})
export class AppModule {}
