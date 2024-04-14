import {MigrationInterface, QueryRunner} from "typeorm";

export class AddExtraEndDateOnUserSubscriptionTables1617369643065 implements MigrationInterface {
    name = 'AddExtraEndDateOnUserSubscriptionTables1617369643065'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE ONLY ${process.env.SCHEMA}.user_subscription ADD COLUMN extra_enddate TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."user_subscription" DROP COLUMN "extra_enddate"`);
    }

}
