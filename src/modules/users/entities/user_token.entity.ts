import {Entity, PrimaryGeneratedColumn, Column, BeforeInsert, BaseEntity } from 'typeorm';
import { v4 } from 'uuid';

@Entity(`${process.env.SCHEMA}.user_token`)
export class UserTokenEntity extends BaseEntity{

    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    user_id: string;

    @Column()
    token: string;

    @Column()
    type: string;

    @Column('timestamp with time zone', 
        {   nullable: false, 
            default: () => `CURRENT_TIMESTAMP + (min * interval '30 minute')`
        })
    expired_at: string;

    @Column()
    created_at: Date;

    @BeforeInsert()
	addId() {
		this.id = v4();
    }

    @Column()
    status: string;

}

