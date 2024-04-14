import {MigrationInterface, QueryRunner} from "typeorm";

export class addISBNField1602153562357 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE ${process.env.SCHEMA}.books ADD COLUMN isbn text`);
        await queryRunner.query(`ALTER TABLE ${process.env.SCHEMA}.books ADD COLUMN ref_link text`);
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
