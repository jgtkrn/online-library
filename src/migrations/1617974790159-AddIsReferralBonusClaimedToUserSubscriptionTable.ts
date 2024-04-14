import {MigrationInterface, QueryRunner} from "typeorm";

export class AddIsReferralBonusClaimedToUserSubscriptionTable1617974790159 implements MigrationInterface {
    name = 'AddIsReferralBonusClaimedToUserSubscriptionTable1617974790159'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE ONLY ${process.env.SCHEMA}.user_subscription ADD COLUMN is_referral_bonus_claimed BOOLEAN NOT NULL DEFAULT FALSE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."user_subscription" DROP COLUMN "is_referral_bonus_claimed"`);
    }

}
