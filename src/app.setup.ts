import { INestApplication, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { esProduccion, origenesPermitidos } from './config/environment';

export const configurarApp = (app: INestApplication): void => {
    app.use(helmet({ contentSecurityPolicy: esProduccion() ? undefined : false, crossOriginEmbedderPolicy: false }));
    app.useGlobalPipes(new ValidationPipe({ forbidUnknownValues: false }));
    app.enableCors({ origin: origenesPermitidos() });
    if (process.env.TRUST_PROXY) {
        app.getHttpAdapter().getInstance().set('trust proxy', Number(process.env.TRUST_PROXY));
    }
};
