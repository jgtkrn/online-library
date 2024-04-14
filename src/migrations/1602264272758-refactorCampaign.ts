import {MigrationInterface, QueryRunner} from "typeorm";

export class MigrationTable1602264272758 implements MigrationInterface {
    name = 'MigrationTable1602264272758'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign_translate" ALTER COLUMN "_id" SET DEFAULT make_uid()::text`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign_translate" ALTER COLUMN "_created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign_translate" ALTER COLUMN "_created_by" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign_translate" ALTER COLUMN "_updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign_translate" ALTER COLUMN "_updated_by" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign_translate" ALTER COLUMN "campaign_label" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign" ALTER COLUMN "_id" SET DEFAULT make_uid()::text`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign" ALTER COLUMN "_created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign" ALTER COLUMN "_created_by" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign" ALTER COLUMN "_updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign" ALTER COLUMN "_updated_by" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign" ALTER COLUMN "active" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign" ALTER COLUMN "priority" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign" ADD CONSTRAINT "campaign_campaign_label_unique" UNIQUE ("campaign_label")`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign" ALTER COLUMN "campaign_label" SET DEFAULT (CAST (TO_CHAR(nextval('unique_label'),'"C_"fm00000') as TEXT))`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign" ALTER COLUMN "thumbnail" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign" ALTER COLUMN "books_count" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."books_campaign" ALTER COLUMN "_id" SET DEFAULT make_uid()::text`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."books_campaign" ALTER COLUMN "_created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."books_campaign" ALTER COLUMN "_created_by" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."books_campaign" ALTER COLUMN "_updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."books_campaign" ALTER COLUMN "_updated_by" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."books_campaign" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."books_campaign" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."books_campaign" ALTER COLUMN "priority" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."books_campaign" DROP CONSTRAINT "books_campaign_pkey"`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."books_campaign" ADD CONSTRAINT "books_campaign_pkey" PRIMARY KEY ("_id", "_database_id", "_owner_id")`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."books_campaign" ALTER COLUMN "campaign_label" DROP DEFAULT`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."books_campaign" ALTER COLUMN "campaign_label" SET DEFAULT ' '`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."books_campaign" DROP CONSTRAINT "books_campaign_pkey"`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."books_campaign" ADD CONSTRAINT "PK_001923920845bb5bbad10610446" PRIMARY KEY ("_id", "_database_id", "_owner_id", "campaign_label", "book_label")`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."books_campaign" ALTER COLUMN "priority" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."books_campaign" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."books_campaign" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."books_campaign" ALTER COLUMN "_updated_by" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."books_campaign" ALTER COLUMN "_updated_at" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."books_campaign" ALTER COLUMN "_created_by" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."books_campaign" ALTER COLUMN "_created_at" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."books_campaign" ALTER COLUMN "_id" SET DEFAULT (${process.env.SCHEMA}.uuid_generate_v4())`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign" ALTER COLUMN "books_count" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign" ALTER COLUMN "thumbnail" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign" ALTER COLUMN "campaign_label" SET DEFAULT to_char(nextval('unique_label'`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign" DROP CONSTRAINT "campaign_campaign_label_unique"`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign" ALTER COLUMN "priority" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign" ALTER COLUMN "active" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign" ALTER COLUMN "_updated_by" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign" ALTER COLUMN "_updated_at" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign" ALTER COLUMN "_created_by" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign" ALTER COLUMN "_created_at" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign" ALTER COLUMN "_id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign_translate" ALTER COLUMN "campaign_label" SET DEFAULT to_char(nextval('unique_label'`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign_translate" ALTER COLUMN "subtitle" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign_translate" ALTER COLUMN "_updated_by" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign_translate" ALTER COLUMN "_updated_at" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign_translate" ALTER COLUMN "_created_by" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign_translate" ALTER COLUMN "_created_at" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."campaign_translate" ALTER COLUMN "_id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."books_campaign" DROP CONSTRAINT "books_campaign_pkey"`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."books_campaign" ADD CONSTRAINT "books_campaign_pkey" PRIMARY KEY ("_id", "_database_id", "_owner_id", "campaign_label", "book_label")`);
    }

}
