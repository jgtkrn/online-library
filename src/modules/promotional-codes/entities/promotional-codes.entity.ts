import { BaseEntity, BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { v4 } from 'uuid';
import * as moment from 'moment'

@Entity(`${process.env.SCHEMA}.promotional_codes`)
export class PromotionalCodeEntity extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    code : string;

    @Column()
    month_value: number;

    @Column()
    user_label: string;


    @Column()
    claimed_at : Date;

    @Column({  nullable: false, default: () => 'CURRENT_TIMESTAMP' , type: 'timestamp'})
    created_at : string;
    
    @Column({  nullable: false, default: () => 'CURRENT_TIMESTAMP' , type: 'timestamp'})
    updated_at : string;

    @Column()
    deleted_at : Date;

    @BeforeInsert()
    addId(){
        this.id = v4();
    }

    @BeforeUpdate()
    updatedDate() {
        this.created_at = moment().format('YYYY-MM-DD HH:mm:ss');
        this.updated_at = moment().format('YYYY-MM-DD HH:mm:ss');
    }

}