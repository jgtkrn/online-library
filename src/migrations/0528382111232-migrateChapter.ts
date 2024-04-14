import {MigrationInterface, QueryRunner} from "typeorm";

export class migrateChapterLabel0528382111232 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE ${process.env.SCHEMA}.chapters
            add new_chapter_label SERIAL not null;`)
        await queryRunner.query(`ALTER TABLE ${process.env.SCHEMA}.chapters ALTER COLUMN new_chapter_label TYPE CHARACTER VARYING;`)
        await queryRunner.query(`ALTER TABLE ${process.env.SCHEMA}.chapters  ALTER COLUMN new_chapter_label type text using new_chapter_label::text;`)
        await queryRunner.query(`ALTER TABLE ${process.env.SCHEMA}.audio ADD new_chapter_label text;`)
        await queryRunner.query(`UPDATE ${process.env.SCHEMA}.audio a
            SET new_chapter_label = ab.new_chapter_label
                FROM (
                SELECT *
                FROM ${process.env.SCHEMA}.chapters
                NATURAL LEFT JOIN ${process.env.SCHEMA}.audio 
                WHERE  ${process.env.SCHEMA}.chapters.chapter_label != ''
                ) ab
            WHERE a.chapter_label = ab.chapter_label;`)
        await queryRunner.query(`ALTER TABLE ${process.env.SCHEMA}.chapters_translate
            add new_chapter_label text;`)
        await queryRunner.query(`UPDATE ${process.env.SCHEMA}.chapters_translate ct
            SET new_chapter_label = ab.new_chapter_label
                FROM (
                SELECT *
                FROM  ${process.env.SCHEMA}.chapters
                NATURAL LEFT JOIN  ${process.env.SCHEMA}.chapters_translate
                WHERE  ${process.env.SCHEMA}.chapters.chapter_label != ''
                ) ab
            WHERE  ct.chapter_label = ab.chapter_label;`)
        await queryRunner.query(`ALTER TABLE ${process.env.SCHEMA}.audio RENAME COLUMN chapter_label TO old_chapter_label;`);
        await queryRunner.query(`ALTER TABLE ${process.env.SCHEMA}.audio RENAME COLUMN new_chapter_label TO chapter_label;`);
        await queryRunner.query(`ALTER TABLE ${process.env.SCHEMA}.chapters_translate RENAME COLUMN chapter_label TO old_chapter_label;`);
        await queryRunner.query(`ALTER TABLE ${process.env.SCHEMA}.chapters_translate RENAME COLUMN new_chapter_label TO chapter_label;`);
        await queryRunner.query(`ALTER TABLE ${process.env.SCHEMA}.chapters RENAME COLUMN chapter_label TO old_chapter_label;`);
        await queryRunner.query(`ALTER TABLE ${process.env.SCHEMA}.chapters RENAME COLUMN new_chapter_label TO chapter_label;`);
    }


    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE ${process.env.SCHEMA}.audio RENAME COLUMN chapter_label TO new_chapter_label;`);
        await queryRunner.query(`ALTER TABLE ${process.env.SCHEMA}.audio RENAME COLUMN old_chapter_label TO chapter_label;`);
        await queryRunner.query(`ALTER TABLE ${process.env.SCHEMA}.chapters_translate RENAME COLUMN chapter_label TO new_chapter_label;`);
        await queryRunner.query(`ALTER TABLE ${process.env.SCHEMA}.chapters_translate RENAME COLUMN old_chapter_label TO chapter_label;`);
        await queryRunner.query(`ALTER TABLE ${process.env.SCHEMA}.chapters RENAME COLUMN chapter_label TO new_chapter_label;`);
        await queryRunner.query(`ALTER TABLE ${process.env.SCHEMA}.chapters RENAME COLUMN old_chapter_label TO chapter_label;`);
    }

}
