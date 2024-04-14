import {MigrationInterface, QueryRunner} from "typeorm";

export class dropStripeLogTables1618654163545 implements MigrationInterface {
    name = 'dropStripeLogTables1618654163545'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS ${process.env.SCHEMA}.stripe_logs`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
       
    }

}
