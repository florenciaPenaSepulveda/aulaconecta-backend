import { esProduccion, origenesPermitidos, validarEntorno } from './environment';

const entornoCompleto = {
    DB_HOST: 'localhost',
    DB_PORT: '3306',
    DB_NAME: 'db',
    DB_USER: 'usuario',
    DB_PASS: 'clave',
    JWT_SECRET: 'una-clave-secreta-de-prueba-bastante-larga',
};

describe('configuración del entorno', () => {
    it('acepta un entorno completo', () => {
        expect(() => validarEntorno(entornoCompleto as NodeJS.ProcessEnv)).not.toThrow();
    });

    it('indica las variables que faltan', () => {
        expect(() => validarEntorno({ ...entornoCompleto, DB_PASS: '', JWT_SECRET: '' } as NodeJS.ProcessEnv)).toThrow(/DB_PASS, JWT_SECRET/);
    });

    it('en producción exige una clave JWT larga y no la de ejemplo', () => {
        const produccion = { ...entornoCompleto, NODE_ENV: 'production' } as NodeJS.ProcessEnv;
        expect(() => validarEntorno({ ...produccion, JWT_SECRET: 'corta' } as NodeJS.ProcessEnv)).toThrow(/32 caracteres/);
        expect(() => validarEntorno({ ...produccion, JWT_SECRET: 'change-me' } as NodeJS.ProcessEnv)).toThrow(/32 caracteres/);
        expect(() => validarEntorno(produccion)).not.toThrow();
    });

    it('reconoce el modo producción', () => {
        expect(esProduccion({ NODE_ENV: 'production' } as NodeJS.ProcessEnv)).toBe(true);
        expect(esProduccion({ NODE_ENV: 'development' } as NodeJS.ProcessEnv)).toBe(false);
    });

    it('lee los orígenes permitidos de CORS_ORIGINS o usa los locales', () => {
        expect(origenesPermitidos({ CORS_ORIGINS: ' https://a.cl , https://b.cl ,' } as NodeJS.ProcessEnv)).toEqual(['https://a.cl', 'https://b.cl']);
        expect(origenesPermitidos({} as NodeJS.ProcessEnv)).toContain('http://localhost:5173');
        expect(origenesPermitidos({} as NodeJS.ProcessEnv)).not.toContain('*');
    });
});
