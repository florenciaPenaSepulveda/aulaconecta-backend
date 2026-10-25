require('dotenv/config');
const dataSource = require('../dist/database/data-source').default;

(async () => {
    await dataSource.initialize();
    try {
        await dataSource.runMigrations();
        const pendientes = (await dataSource.driver.createSchemaBuilder().log()).upQueries;
        if (pendientes.length > 0) {
            console.error('Las migraciones no reproducen el esquema de las entidades. Falta una migración:');
            pendientes.forEach((consulta) => console.error('  ' + consulta.query));
            process.exitCode = 1;
        } else {
            console.log('Las migraciones reproducen exactamente el esquema de las entidades.');
        }
    } finally {
        await dataSource.destroy();
    }
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
