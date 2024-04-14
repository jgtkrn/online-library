import {MigrationInterface, QueryRunner} from "typeorm";

export class addStripeIdOnAuthTable1607838952402 implements MigrationInterface {
    name = 'addStripeIdOnAuthTable1607838952402'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE ONLY ${process.env.SCHEMA}._auth ADD COLUMN stripe_id text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."_auth" DROP COLUMN "stripe_id"`);
    }

}
