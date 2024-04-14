import {MigrationInterface, QueryRunner} from "typeorm";

export class MigrationTable1602268040139 implements MigrationInterface {
    name = 'MigrationTable1602268040139'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign_translate" ALTER COLUMN "_id" SET DEFAULT make_uid()::text`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign_translate" ALTER COLUMN "campaign_label" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign" ALTER COLUMN "_id" SET DEFAULT make_uid()::text`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign" ALTER COLUMN "campaign_label" SET DEFAULT (CAST (TO_CHAR(nextval('unique_label'),'"C_"fm00000') as TEXT))`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."books_campaign" ALTER COLUMN "_id" SET DEFAULT make_uid()::text`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."books_campaign" ALTER COLUMN "campaign_label" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."books_campaign" ALTER COLUMN "campaign_label" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."books_campaign" ALTER COLUMN "_id" SET DEFAULT (make_uid())`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign" ALTER COLUMN "campaign_label" SET DEFAULT to_char(nextval('unique_label'`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign" ALTER COLUMN "_id" SET DEFAULT (make_uid())`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign_translate" ALTER COLUMN "campaign_label" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign_translate" ALTER COLUMN "_id" SET DEFAULT (make_uid())`);
    }

}
