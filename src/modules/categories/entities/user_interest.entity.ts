
import { Entity, Column, BeforeInsert, PrimaryGeneratedColumn } from 'typeorm'
import { TableEntity } from '../../app/entities'
import { v4 } from 'uuid';

@Entity(`${process.env.SCHEMA}.user_interest`)
export class UserInterestEntity extends TableEntity {

    constructor (deleted_at: Date, deleted_by: string,  user_label:string, category_label:string,_database_id: string, _owner_id: string, _created_by: string) {
        super(_database_id, _owner_id, _created_by)
        this.deleted_at = deleted_at
        this.deleted_by = deleted_by
        this.category_label = category_label
        this.user_label = user_label
    }
    @PrimaryGeneratedColumn("uuid")
    _id : string;

    @Column()
    deleted_at : Date;

    @Column()
    deleted_by : string;

    @Column()
    user_label : string;

    @Column()
    category_label : string;

    @BeforeInsert()
	addId() {
		this._id = v4();
    }
}
