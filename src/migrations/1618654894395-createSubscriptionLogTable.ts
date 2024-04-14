import {MigrationInterface, QueryRunner} from "typeorm";

export class createSubscriptionLogTable1618654894395 implements MigrationInterface {
    name = 'createSubscriptionLogTable1618654894395'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS ${process.env.SCHEMA}.subscription_logs(
            id text PRIMARY KEY,
            user_label text,
            type text,
            transaction_name text,
            transaction_id text,
            request_body json,
            response_body json,
            webhooks_url text,
            created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP,
            deleted_at TIMESTAMP )`
         );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS ${process.env.SCHEMA}.subscription_logs`)
    }

}
