import {MigrationInterface, QueryRunner} from "typeorm";

export class AddReferralCodeOnUserTable1609398910793 implements MigrationInterface {
    name = 'AddReferralCodeOnUserTable1609398910793'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE ONLY ${process.env.SCHEMA}.user ADD COLUMN referral_code text`);
        await queryRunner.query(`ALTER TABLE ONLY ${process.env.SCHEMA}.user ADD COLUMN claim_referralcode BOOLEAN NOT NULL DEFAULT FALSE`);
        await queryRunner.query(`ALTER TABLE ONLY ${process.env.SCHEMA}.user ADD COLUMN claim_freetrial BOOLEAN NOT NULL DEFAULT FALSE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."user" DROP COLUMN "referral_code"`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."user" DROP COLUMN "claim_referralcode"`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."user" DROP COLUMN "claim_freetrial"`);
    }

}
