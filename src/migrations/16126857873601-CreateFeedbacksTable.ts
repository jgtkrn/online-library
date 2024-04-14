import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateFeedbacksTable16126857873601 implements MigrationInterface {
    name = 'CreateFeedbacksTable16126857873601'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS ${process.env.SCHEMA}.feedbacks(
            id text PRIMARY KEY,
            user_id text,
            description text,
            created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP,
            deleted_at TIMESTAMP )`
         );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS ${process.env.SCHEMA}.feedbacks`)
    }

}
