import {MigrationInterface, QueryRunner} from "typeorm";

export class addSequenceOnSubscriptionPlansTable1613806862254 implements MigrationInterface {
    name = 'addSequenceOnSubscriptionPlansTable1613806862254'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE ONLY ${process.env.SCHEMA}.subscription_plan ADD COLUMN sequence integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."subscription_plan" DROP COLUMN "sequence"`);
    }

}
