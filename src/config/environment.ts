const REQUERIDAS = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASS', 'JWT_SECRET'];

export const esProduccion = (env: NodeJS.ProcessEnv = process.env): boolean => env.NODE_ENV === 'production';

export const validarEntorno = (env: NodeJS.ProcessEnv = process.env): void => {
    const faltantes = REQUERIDAS.filter((nombre) => !env[nombre]);
    if (faltantes.length > 0) {
        throw new Error(`Faltan variables de entorno: ${faltantes.join(', ')}`);
    }
    if (esProduccion(env) && (env.JWT_SECRET.length < 32 || env.JWT_SECRET === 'change-me')) {
        throw new Error('JWT_SECRET debe tener al menos 32 caracteres en producción');
    }
};

export const origenesPermitidos = (env: NodeJS.ProcessEnv = process.env): string[] =>
    (env.CORS_ORIGINS ?? 'http://localhost:5173,http://localhost:5174,http://localhost:8081')
        .split(',')
        .map((origen) => origen.trim())
        .filter(Boolean);
