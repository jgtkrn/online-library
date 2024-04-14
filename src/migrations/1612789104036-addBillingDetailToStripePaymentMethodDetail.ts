import {MigrationInterface, QueryRunner} from "typeorm";

export class addBillingDetailToStripePaymentMethodDetail1612789104036 implements MigrationInterface {
    name = 'addBillingDetailToStripePaymentMethodDetail1612789104036'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop old column for change position
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."stripe_paymentmethod" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."stripe_paymentmethod" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."stripe_paymentmethod" DROP COLUMN "deleted_at"`);

        await queryRunner.query(`ALTER TABLE ONLY ${process.env.SCHEMA}.stripe_paymentmethod ADD COLUMN email text`);
        await queryRunner.query(`ALTER TABLE ONLY ${process.env.SCHEMA}.stripe_paymentmethod ADD COLUMN mobile_number text`);
        await queryRunner.query(`ALTER TABLE ONLY ${process.env.SCHEMA}.stripe_paymentmethod ADD COLUMN address text`);
        await queryRunner.query(`ALTER TABLE ONLY ${process.env.SCHEMA}.stripe_paymentmethod ADD COLUMN created_at  TIMESTAMP NOT NULL DEFAULT NOW()`);
        await queryRunner.query(`ALTER TABLE ONLY ${process.env.SCHEMA}.stripe_paymentmethod ADD COLUMN updated_at TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE ONLY ${process.env.SCHEMA}.stripe_paymentmethod ADD COLUMN deleted_at TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."stripe_paymentmethod" DROP COLUMN "email"`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."stripe_paymentmethod" DROP COLUMN "mobile_number"`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."stripe_paymentmethod" DROP COLUMN "address"`);
    }

}
