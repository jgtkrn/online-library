import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'
import { TableEntity } from '../../app/entities'
import { new_language_code } from '../../../helpers/util';

@Entity(`${process.env.SCHEMA}.author_translate`)
export class AuthorTranslateEntity extends TableEntity {

    constructor (author_label: string, author_name: string, author_intro: string, language: string, _database_id: string, _owner_id: string, _created_by: string) {
        super(_database_id, _owner_id, _created_by)
        this.author_label = author_label
        this.author_name = author_name
        this.author_intro = author_intro
        this.language = language
    }

    @Column()
    author_label: string

    @Column({ type: 'text', default: null })
    author_name: string

    @Column({ type: 'text', default: null })
    author_intro: string

    @Column({ type: 'text', default: new_language_code.CANTONESE })
    language: string
}
