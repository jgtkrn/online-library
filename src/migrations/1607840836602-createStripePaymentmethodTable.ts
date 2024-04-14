import {MigrationInterface, QueryRunner} from "typeorm";

export class createStripePaymentmethodTable1607840836602 implements MigrationInterface {
    name = 'createStripePaymentmethodTable1607840836602'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS ${process.env.SCHEMA}.stripe_paymentmethod (
            id text PRIMARY KEY,
            user_id text,
            stripe_id text,
            created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP,
            deleted_at TIMESTAMP )`
         );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS ${process.env.SCHEMA}.stripe_paymentmethod`)
    }

}
