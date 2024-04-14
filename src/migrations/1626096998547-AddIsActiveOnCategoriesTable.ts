import {MigrationInterface, QueryRunner} from "typeorm";

export class AddIsActiveOnCategoriesTable1626096998547 implements MigrationInterface {
    name = 'AddIsActiveOnCategoriesTable1626096998547'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE ONLY ${process.env.SCHEMA}.categories ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT FALSE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."categories" DROP COLUMN "is_active"`);

    }

}
