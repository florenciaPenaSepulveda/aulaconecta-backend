import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { SubjectModule } from './subject/subject.module';
import { AsistModule } from './asist/asist.module';
import { AdvicesModule } from './advices/advices.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig} from '@nestjs/apollo';
import { join } from 'path';
import { GradesModule } from './grades/grades.module';

@Module({
  imports: [
    AdvicesModule,
    UserModule,
    AuthModule,
    AsistModule,
    SubjectModule,
    GradesModule,
    
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3308,
      database: 'db_crud',
      username: 'crud_db',
      password: 'root',
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
