import {MigrationInterface, QueryRunner} from "typeorm";

export class AddBookNote1602066030423 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE ${process.env.SCHEMA}.books ADD COLUMN note text`);
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."books" DROP COLUMN "note"`);
    }

}