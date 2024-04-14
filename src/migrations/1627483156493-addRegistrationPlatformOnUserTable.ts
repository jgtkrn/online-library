import {MigrationInterface, QueryRunner} from "typeorm";

export class addRegistrationPlatformOnUserTable1627483156493 implements MigrationInterface {
    name = 'addRegistrationPlatformOnUserTable1627483156493'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE ONLY ${process.env.SCHEMA}.user ADD COLUMN registration_platform text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."user" DROP COLUMN "registration_platform"`);
    }

}
