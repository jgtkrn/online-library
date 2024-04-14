
import { Entity, Column } from 'typeorm'
import { TableEntity } from '../../app/entities'
import * as moment from 'moment'
import { Json } from 'aws-sdk/clients/robomaker';

@Entity(`${process.env.SCHEMA}.categories`)
export class CategoriesEntity extends TableEntity {

    constructor (deleted_at: Date, deleted_by: string, category_label:string, thumbnail:string  ,_database_id: string, _owner_id: string, _created_by: string, access : any, is_active : boolean) {
        super(_database_id, _owner_id, _created_by)
        this.deleted_at = deleted_at
        this.deleted_at = deleted_at
        this.deleted_by = deleted_by
        this.category_label = category_label
        this.thumbnail = thumbnail
        this._updated_at = new Date(moment().format('YYYY-MM-DD HH:mm:ss')),
        this._access = access
        this.is_active = is_active;
    }
    @Column()
    deleted_at : Date;

    @Column()
    deleted_by : string;

    @Column()
    category_label : string;

    @Column()
    thumbnail : string;

    @Column()
    _access : any;

    @Column()
    is_active : boolean;

}
