import { Entity, Column } from 'typeorm'
import { TableEntity } from '../../app/entities'

@Entity(`${process.env.SCHEMA}.author`)
export class AuthorEntity extends TableEntity {

    constructor ( avatar: string, _database_id: string, _owner_id: string, _created_by: string, author_label : string) {
        super(_database_id, _owner_id, _created_by)
        this.avatar = avatar
        this.author_label = author_label
    }

    @Column({ type: 'text', default: null })
    avatar: string

    @Column(
        {
            unique: true,
            nullable: false,
            default: () => `(CAST (TO_CHAR(nextval('unique_label'),'"A_"fm00000') as TEXT))`,
            type: 'text' 
        }
    )
    author_label: string
}
