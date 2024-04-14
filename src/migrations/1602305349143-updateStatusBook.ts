import {MigrationInterface, QueryRunner} from "typeorm";

export class updateStatusBook1602305349143 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {

        await queryRunner.query(`ALTER TABLE ONLY ${process.env.SCHEMA}.books ALTER COLUMN status SET DEFAULT 'ACTIVE'`);
        await queryRunner.query(`UPDATE ${process.env.SCHEMA}.books SET status = 'ACTIVE' `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
