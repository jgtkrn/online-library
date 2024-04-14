import {MigrationInterface, QueryRunner} from "typeorm";

export class ModifyTokenTable1211201030123 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE ${process.env.SCHEMA}.user_token ADD COLUMN created_at timestamp`);
        await queryRunner.query(`ALTER TABLE ${process.env.SCHEMA}.user_token ADD COLUMN ip_address text`);
        await queryRunner.query(`ALTER TABLE ${process.env.SCHEMA}.user_token ADD COLUMN status text default 'VALID' not null`);
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."user_token" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."user_token" DROP COLUMN "ip_address"`);
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."user_token" DROP COLUMN "status"`);
    }
}
