import {MigrationInterface, QueryRunner} from "typeorm";

export class modifyAuthor1702066030489 implements MigrationInterface {
    name = 'modifyAuthor1702066030489'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."author" ALTER COLUMN "_id" SET DEFAULT make_uid()::text`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."author" ALTER COLUMN "_created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."author" ALTER COLUMN "_created_by" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."author" ADD CONSTRAINT "author_label_unique" UNIQUE ("author_label")`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."author" ALTER COLUMN "author_label" SET DEFAULT (CAST (TO_CHAR(nextval('unique_label'),'"A_"fm00000') as TEXT))`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."author_translate" ALTER COLUMN "_id" SET DEFAULT make_uid()::text`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."author_translate" ALTER COLUMN "_created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."author_translate" ALTER COLUMN "_created_by" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."books_author" ALTER COLUMN "_id" SET DEFAULT make_uid()::text`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."books_author" ALTER COLUMN "_created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."books_author" ALTER COLUMN "_created_by" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."books_author" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."books_author" ADD "deleted_at" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
