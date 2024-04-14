import { new_language_code } from '../../../helpers/util';
import { Entity, Column} from 'typeorm';
import { TableEntity } from '../../app/entities'

@Entity(`${process.env.SCHEMA}.campaign_translate`)
export class CampaignTranslateEntity extends TableEntity {

    constructor (campaign_label: string, title: string, subtitle: string, excerpt: string, thumbnail: string, _database_id: string, _owner_id: string, _created_by: string) {
        super(_database_id, _owner_id, _created_by)
        this.campaign_label = campaign_label
        this.title = title
        this.subtitle = subtitle
        this.excerpt = excerpt
        this.thumbnail = thumbnail
    }

    @Column({ type: 'text', nullable: false })
    campaign_label: string

    @Column({ type: 'text', default: new_language_code.CANTONESE})
    language: string

    @Column({ type: 'text', default: ' ' })
    title: string

    @Column({ type: 'text', nullable: true })
    subtitle: string

    @Column({ type: 'text', default: ' ' })
    excerpt: string

    @Column({ type: 'text', nullable: true })
    thumbnail: string
}