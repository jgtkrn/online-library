import { Entity, Column } from 'typeorm'
import { TableEntity } from '../../app/entities'

@Entity(`${process.env.SCHEMA}.campaign`)
export class CampaignEntity extends TableEntity {

    constructor (active: boolean, priority: number, thumbnail: string, _database_id: string, _owner_id: string, _created_by: string, campaign_label : string) {
        super(_database_id, _owner_id, _created_by)
        this.active = active
        this.thumbnail = thumbnail
        this.campaign_label = campaign_label
        this.priority = priority
    }

    @Column({ default: false })
    active: boolean

    @Column({ default: 1 })
    priority: number

    @Column(
        {
            unique: true,
            nullable: false,
            default: () => `(CAST (TO_CHAR(nextval('unique_label'),'"C_"fm00000') as TEXT))`,
            type: 'text' 
        }
    )
    campaign_label: string

    @Column({ type: 'text' })
    thumbnail: string

    @Column({ default: 0 })
    books_count: number
}
