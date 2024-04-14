import {MigrationInterface, QueryRunner} from "typeorm";

export class AddTokenTable0311202030423 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE  ${process.env.SCHEMA}.token_type AS ENUM('RESET-PASSWORD', 'LOGIN')`)
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS ${process.env.SCHEMA}.user_token (
            id text PRIMARY KEY,
            user_id text,
            token text,
            type ${process.env.SCHEMA}.token_type,
            expired_at TIMESTAMP
         );`
        )
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS ${process.env.SCHEMA}.user_token`)
    }

}
