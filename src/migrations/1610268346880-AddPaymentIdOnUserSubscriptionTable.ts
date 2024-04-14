import {MigrationInterface, QueryRunner} from "typeorm";

export class AddPaymentIdOnUserSubscriptionsTable1610268346880 implements MigrationInterface {
    name = 'AddPaymentIdOnUserSubscriptionsTable1610268346880'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE ONLY ${process.env.SCHEMA}.user_subscription ADD COLUMN payment_id text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."user_subscription" DROP COLUMN "payment_id"`);
    }

}
