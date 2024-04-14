
import { Entity, Column } from 'typeorm'
import { TableEntity } from '../../app/entities'

@Entity(`${process.env.SCHEMA}.category_relationship`)
export class CategoriesRelationshipEntity extends TableEntity {

    constructor (deleted_at: Date, deleted_by: string, category_label:string, related_category:string  ,_database_id: string, _owner_id: string, priority: number, _created_by: string) {
        super(_database_id, _owner_id, _created_by)
        this.deleted_at = deleted_at
        this.deleted_by = deleted_by
        this.category_label = category_label
        this.related_category = related_category
        this.priority = priority
    }
    @Column()
    deleted_at : Date;

    @Column()
    deleted_by : string;

    @Column()
    category_label : string;

    @Column()
    related_category : string;

    @Column()
    priority : number;
}
