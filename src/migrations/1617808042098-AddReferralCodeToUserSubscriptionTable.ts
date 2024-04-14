import {MigrationInterface, QueryRunner} from "typeorm";

export class AddReferralCodeToUserSubscriptionTable1617808042098 implements MigrationInterface {
    name = 'AddReferralCodeToUserSubscriptionTable1617808042098'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE ONLY ${process.env.SCHEMA}.user_subscription ADD COLUMN referral_code text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."user_subscription" DROP COLUMN "referral_code"`);
    }

}
