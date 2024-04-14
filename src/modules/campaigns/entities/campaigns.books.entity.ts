import { Entity, Column } from 'typeorm'
import { TableEntity } from '../../app/entities'

@Entity(`${process.env.SCHEMA}.books_campaign`)
export class CampaignBooksEntity extends TableEntity {

    constructor (campaign_label: string, priority: number, book_label: string, _database_id: string, _owner_id: string, _created_by: string) {
        super(_database_id, _owner_id, _created_by)
        this.campaign_label = campaign_label
        this.priority = priority
        this.book_label = book_label
    }

    @Column({ type: 'text', nullable: false })
    campaign_label: string

    @Column({ default: 1 })
    priority: number

    @Column({ type: 'text', default: ' ' })
    book_label: string
}