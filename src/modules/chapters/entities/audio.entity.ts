import {Entity, PrimaryGeneratedColumn, Column, BeforeInsert, BeforeUpdate, BaseEntity } from 'typeorm';
import { v4 } from 'uuid';
import * as moment from 'moment'

@Entity(`${process.env.SCHEMA}.audio`)
export class AudioEntity extends BaseEntity{

    @PrimaryGeneratedColumn("uuid")
    _id: string;

    @Column()
    _database_id: string;

    @Column()
    _owner_id : string;

    @Column("text",{ array: true })
    _access : string[];

    @Column()
    _created_at : string;

    @Column()
    _updated_at : string;

    @Column()
    _created_by : string;

    @Column()
    _updated_by : string;

    @Column()
    deleted_at : Date;

    @Column()
    deleted_by : string;

    @Column()
    chapter_label : string;

    @Column()
    audio_path : string;

    @Column()
    language : string;

    @BeforeInsert()
	addId() {
		this._id = v4();
    }

    @BeforeInsert()
	now() {
        this._created_at = moment().format('YYYY-MM-DD HH:mm:ss');
        this._updated_at = moment().format('YYYY-MM-DD HH:mm:ss');
    }
    
    @BeforeUpdate()
    updatedDate() {
        this._updated_at = moment().format('YYYY-MM-DD HH:mm:ss');
    }


}