import { MigrationInterface, QueryRunner } from "typeorm";

export class Inicial1792957231208 implements MigrationInterface {
    name = 'Inicial1792957231208'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`notice_entity\` (\`id\` int NOT NULL AUTO_INCREMENT, \`title\` varchar(255) NOT NULL, \`description\` varchar(255) NOT NULL, \`imageUrl\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`asist_entity\` (\`id\` int NOT NULL AUTO_INCREMENT, \`idUser\` int NOT NULL, \`idSubject\` int NOT NULL, \`asist\` int NOT NULL DEFAULT '0', \`absences\` int NOT NULL DEFAULT '0', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`attendance_record_entity\` (\`id\` int NOT NULL AUTO_INCREMENT, \`idUser\` int NOT NULL, \`idSubject\` int NOT NULL, \`date\` date NOT NULL, \`present\` tinyint NOT NULL, UNIQUE INDEX \`IDX_da739742eb31b02f550eeeb83e\` (\`idUser\`, \`idSubject\`, \`date\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`auth_entity\` (\`id\` int NOT NULL AUTO_INCREMENT, \`idUser\` int NOT NULL, \`password\` varchar(255) NOT NULL, \`isChangePass\` tinyint NOT NULL DEFAULT 0, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`subject_entity\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`numberOfClasses\` int NOT NULL, \`idTeacher\` int NOT NULL, \`courseId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`course_entity\` (\`id\` int NOT NULL AUTO_INCREMENT, \`nameCourse\` varchar(255) NOT NULL, \`level\` enum ('basica', 'media', 'kinder', 'prekinder') NOT NULL DEFAULT 'basica', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`grades_entity\` (\`id\` int NOT NULL AUTO_INCREMENT, \`grade\` decimal(5,2) NOT NULL, \`studentId\` int NOT NULL, \`subjectId\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`message_entity\` (\`id\` int NOT NULL AUTO_INCREMENT, \`fromId\` int NOT NULL, \`toId\` int NOT NULL, \`content\` text NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`semester_entity\` (\`id\` int NOT NULL AUTO_INCREMENT, \`nameSemester\` varchar(255) NOT NULL, \`startDate\` datetime NOT NULL, \`endDate\` datetime NOT NULL, \`deadline\` datetime NOT NULL, UNIQUE INDEX \`IDX_bcc092496766da236c2b13cda9\` (\`nameSemester\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`user_entity\` (\`id\` int NOT NULL AUTO_INCREMENT, \`firstName\` varchar(255) NOT NULL, \`lastName\` varchar(255) NOT NULL, \`rut\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`role\` enum ('student', 'teacher', 'admin', 'parents') NOT NULL DEFAULT 'student', \`guardianId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`subject_entity\` ADD CONSTRAINT \`FK_e3bd00bdc8425352c475e62e750\` FOREIGN KEY (\`courseId\`) REFERENCES \`course_entity\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`subject_entity\` DROP FOREIGN KEY \`FK_e3bd00bdc8425352c475e62e750\``);
        await queryRunner.query(`DROP TABLE \`user_entity\``);
        await queryRunner.query(`DROP INDEX \`IDX_bcc092496766da236c2b13cda9\` ON \`semester_entity\``);
        await queryRunner.query(`DROP TABLE \`semester_entity\``);
        await queryRunner.query(`DROP TABLE \`message_entity\``);
        await queryRunner.query(`DROP TABLE \`grades_entity\``);
        await queryRunner.query(`DROP TABLE \`course_entity\``);
        await queryRunner.query(`DROP TABLE \`subject_entity\``);
        await queryRunner.query(`DROP TABLE \`auth_entity\``);
        await queryRunner.query(`DROP INDEX \`IDX_da739742eb31b02f550eeeb83e\` ON \`attendance_record_entity\``);
        await queryRunner.query(`DROP TABLE \`attendance_record_entity\``);
        await queryRunner.query(`DROP TABLE \`asist_entity\``);
        await queryRunner.query(`DROP TABLE \`notice_entity\``);
    }

}
