import 'dotenv/config';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request = require('supertest');
import { AppModule } from './../src/app.module';

export interface Session {
  token: string;
  role: string;
  id: number;
}

export const createApp = async (): Promise<INestApplication> => {
  const moduleFixture = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ forbidUnknownValues: false }));
  await app.init();
  return app;
};

export const createClient = (app: INestApplication) => {
  const gql = (query: string, token?: string, rawAuth?: string) => {
    const req = request(app.getHttpServer()).post('/graphql');
    if (rawAuth) {
      req.set('Authorization', rawAuth);
    } else if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }
    return req.send({ query });
  };

  const login = async (email: string, password = 'Demo1234'): Promise<Session> => {
    const res = await gql(`mutation { login(email: "${email}", password: "${password}") { token role id } }`);
    return res.body.data.login as Session;
  };

  return { gql, login };
};

export const uniqueSuffix = (): string => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

export const rutWithDv = (body: number): string => {
  let sum = 0;
  let multiplier = 2;
  for (const digit of String(body).split('').reverse()) {
    sum += Number(digit) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const rest = 11 - (sum % 11);
  const dv = rest === 11 ? '0' : rest === 10 ? 'K' : String(rest);
  return `${String(body).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`;
};

export const randomRut = (): string => rutWithDv(30000000 + Math.floor(Math.random() * 9000000));
