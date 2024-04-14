import {Entity, PrimaryGeneratedColumn, Column, BeforeInsert , OneToOne, JoinColumn} from 'typeorm';
import * as bcrypt from 'bcryptjs';

@Entity(`${process.env.SCHEMA}._auth`)
export class AuthEntity {

    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    password: string;

    @BeforeInsert()
    async hashPassword() {
       this.password = this.password ? await bcrypt.hashSync(this.password, Number(10)) : '';
    }

    @Column()
    provider_info: string;

    @Column()
    token_valid_since: string;

    @Column()
    last_seen_at: Date;

    @Column()
    disabled: boolean;

    @Column()
    disabled_message: string;

    @Column()
    disabled_expiry: Date;

    @Column()
    stripe_id: string;

}
