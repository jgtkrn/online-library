import {Entity, PrimaryGeneratedColumn, Column, BeforeInsert, BeforeUpdate, BaseEntity } from 'typeorm';
import { v4 } from 'uuid';
import * as moment from 'moment'

@Entity(`${process.env.SCHEMA}.feedbacks`)
export class FeedbackEntity extends BaseEntity{

    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    user_id: string;

    @Column()
    description: string;

    @Column({  nullable: false,
    default: () => 'CURRENT_TIMESTAMP' ,
    type: 'timestamp',})
    created_at : string;

    @Column({  nullable: false,
    default: () => 'CURRENT_TIMESTAMP' ,
    type: 'timestamp',})
    updated_at : string;

    @Column()
    deleted_at : Date;

    @BeforeInsert()
	addId() {
        this.id = v4();
        this.created_at = moment().format('YYYY-MM-DD HH:mm:ss');
        this.updated_at = moment().format('YYYY-MM-DD HH:mm:ss');
    }

    @BeforeUpdate()
    updatedDate() {
        this.updated_at = moment().format('YYYY-MM-DD HH:mm:ss');
    }

}

