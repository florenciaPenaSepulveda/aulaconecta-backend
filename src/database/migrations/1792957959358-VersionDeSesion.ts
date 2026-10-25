import { MigrationInterface, QueryRunner } from "typeorm";

export class VersionDeSesion1792957959358 implements MigrationInterface {
    name = 'VersionDeSesion1792957959358'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`auth_entity\` ADD \`tokenVersion\` int NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`auth_entity\` DROP COLUMN \`tokenVersion\``);
    }

}
