import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { GraphQLModule } from '@nestjs/graphql';
import {ApolloDriver, ApolloDriverConfig} from '@nestjs/apollo';
import { join } from 'path';

@Module({
  imports: [],
  controllers: [],
  providers: [],
})
export class AppModule {}
