import { BeforeInsert, Column, Entity, PrimaryGeneratedColumn, BeforeUpdate, BaseEntity } from 'typeorm'
import { v4 } from 'uuid';
import * as moment from 'moment'


@Entity(`${process.env.SCHEMA}.stripe_paymentmethod`)
export class StripePaymentMethodEntity extends BaseEntity {

    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    user_id: string;

    @Column()
    stripe_id: string;

    @Column()
    email: string;

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
    }

    
    @BeforeUpdate()
    updatedDate() {
        this.created_at = moment().format('YYYY-MM-DD HH:mm:ss');
        this.updated_at = moment().format('YYYY-MM-DD HH:mm:ss');
    }



}

