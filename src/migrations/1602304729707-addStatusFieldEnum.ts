import {MigrationInterface, QueryRunner} from "typeorm";

export class addStatusFieldEnum1602304729707 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {

        await queryRunner.query(`ALTER TABLE ${process.env.SCHEMA}.books ADD COLUMN status text`);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
