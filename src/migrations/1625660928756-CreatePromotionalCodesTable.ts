import {MigrationInterface, QueryRunner} from "typeorm";

export class CreatePromotionalCodesTable1625660928756 implements MigrationInterface {
    name = 'CreatePromotionalCodesTable1625660928756'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS ${process.env.SCHEMA}.promotional_codes(
            id text PRIMARY KEY,
            code text,
            month_value integer,
            user_label text,
            claimed_at TIMESTAMP,
            created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP,
            deleted_at TIMESTAMP )`
         );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS ${process.env.SCHEMA}.promotional_codes`)
    }

}
