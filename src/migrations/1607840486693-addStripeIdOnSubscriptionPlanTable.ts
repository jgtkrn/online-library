import {MigrationInterface, QueryRunner} from "typeorm";

export class addStripeIdOnSubscriptionPlanTable1607840486693 implements MigrationInterface {
    name = 'addStripeIdOnSubscriptionPlanTable1607840486693'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE ONLY ${process.env.SCHEMA}.subscription_plan ADD COLUMN stripe_id text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."subscription_plan" DROP COLUMN "stripe_id"`);
    }

}
