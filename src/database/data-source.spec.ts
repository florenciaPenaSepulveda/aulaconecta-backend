import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { entidades, opcionesBase } from './data-source';

const archivosTs = (carpeta: string): string[] =>
    readdirSync(carpeta).flatMap((nombre) => {
        const ruta = join(carpeta, nombre);
        if (statSync(ruta).isDirectory()) {
            return archivosTs(ruta);
        }
        return ruta.endsWith('.ts') && !ruta.endsWith('.spec.ts') ? [ruta] : [];
    });

describe('configuración de la base de datos', () => {
    it('incluye todas las entidades del proyecto para generar migraciones', () => {
        const declaradas = archivosTs(join(__dirname, '..')).filter((ruta) => /@Entity\(/.test(readFileSync(ruta, 'utf8')));
        expect(entidades).toHaveLength(declaradas.length);
    });

    it('lee la conexión del entorno y busca las migraciones en su carpeta', () => {
        const opciones = opcionesBase();
        expect(opciones.type).toBe('mysql');
        expect(opciones.host).toBe(process.env.DB_HOST);
        expect(opciones.port).toBe(Number(process.env.DB_PORT));
        expect(String(opciones.migrations)).toContain('migrations');
    });
});
