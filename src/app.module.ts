import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import depthLimit = require('graphql-depth-limit');
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
import { esProduccion } from './config/environment';
import { GqlThrottlerGuard } from './security/gql-throttler.guard';


@Module({
  providers: [{ provide: APP_GUARD, useClass: GqlThrottlerGuard }],
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: Number(process.env.RATE_LIMIT) || 300,
        skipIf: () => process.env.NODE_ENV === 'test' && !process.env.PROBAR_LIMITES,
      },
    ]),
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
      synchronize: !esProduccion(),
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver:ApolloDriver,
      autoSchemaFile: esProduccion() ? true : { path: join(process.cwd(), 'src', 'graphql', 'schema.gql') },
      playground: !esProduccion(),
      introspection: !esProduccion(),
      validationRules: [depthLimit(10)],
      context: ({ req }) => ({ req }),
    }),
  ],
})
export class AppModule {}
