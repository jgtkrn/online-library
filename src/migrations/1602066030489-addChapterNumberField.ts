import {MigrationInterface, QueryRunner} from "typeorm";

export class addChapterNumberField1602066030489 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE ${process.env.SCHEMA}.chapters ADD COLUMN number INT`);
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
