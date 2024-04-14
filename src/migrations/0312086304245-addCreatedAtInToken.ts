import {MigrationInterface, QueryRunner} from "typeorm";

export class AddCreatedAtInToken0312086304245 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE ${process.env.SCHEMA}.user_token ADD COLUMN created_at TIMESTAMP;`);
        await queryRunner.query(`ALTER TABLE ${process.env.SCHEMA}.user_token ALTER COLUMN created_at SET DEFAULT now()`);
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "${process.env.SCHEMA}"."user_token" DROP COLUMN "created_at"`);
    }

}
