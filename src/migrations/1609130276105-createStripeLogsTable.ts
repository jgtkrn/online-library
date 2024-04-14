import {MigrationInterface, QueryRunner} from "typeorm";

export class createStripeLogsTable1609130276105 implements MigrationInterface {
    name = 'createStripeLogsTable1609130276105'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS ${process.env.SCHEMA}.stripe_logs(
            id text PRIMARY KEY,
            resource_name text,
            resource_id text,
            webhooks_url text,
            request_body json,
            response_body json,
            created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP,
            deleted_at TIMESTAMP )`
         );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS ${process.env.SCHEMA}.stripe_logs`)
    }

}
