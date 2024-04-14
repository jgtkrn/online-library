import {MigrationInterface, QueryRunner} from "typeorm";

export class AddBadgeOnSubscriptionPlanTable1625486684418 implements MigrationInterface {
    name = 'AddBadgeOnSubscriptionPlanTable1625486684418'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE ONLY ${process.env.SCHEMA}.subscription_plan ADD COLUMN badge text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."subscription_plan" DROP COLUMN "badge"`);
    }

}
