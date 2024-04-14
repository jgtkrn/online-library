
import { Entity, Column, PrimaryGeneratedColumn, BeforeInsert, BeforeUpdate } from 'typeorm'
import { TableEntity } from '../../app/entities'
import { v4 } from 'uuid';
import * as moment from 'moment'

@Entity(`${process.env.SCHEMA}.categories_translate`)
export class CategoriesTranslateEntity extends TableEntity {

    constructor (deleted_at: Date, deleted_by: string, category_label:string, language:string  ,_database_id: string, _owner_id: string, name: string, _created_by: string) {
        super(_database_id, _owner_id, _created_by)
        this.deleted_at = deleted_at
        this.deleted_by = deleted_by
        this.category_label = category_label
        this.language = language
        this.name = name
        this._created_at = new Date(moment().format('YYYY-MM-DD HH:mm:ss'))
        this._updated_at = new Date(moment().format('YYYY-MM-DD HH:mm:ss'))
    }

    @PrimaryGeneratedColumn("uuid")
    _id: string;

    @Column()
    deleted_at : Date;

    @Column()
    deleted_by : string;

    @Column()
    category_label : string;

    @Column()
    language : string;

    @Column()
    name : string;

    @Column({  nullable: false, default: () => 'CURRENT_TIMESTAMP' , type: 'timestamp'})
    _created_at : Date;

    @Column({  nullable: false, default: () => 'CURRENT_TIMESTAMP' , type: 'timestamp'})
    _updated_at : Date;

    @BeforeInsert()
    addId(){
        this._id = v4();
    }

    @BeforeUpdate()
    updatedDate() {
        // this._created_at = new Date(moment().format('YYYY-MM-DD HH:mm:ss'));
        this._updated_at = new Date(moment().format('YYYY-MM-DD HH:mm:ss'));
    }

}
