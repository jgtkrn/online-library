import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'
import { TableEntity } from '../../app/entities'

@Entity(`${process.env.SCHEMA}.user_fav_books`)
export class UserFavBooksEntity extends TableEntity {

    constructor (book_label: string, total_chapters: number, progress_chapter: number, user_label: string, _database_id: string, _owner_id: string, _created_by: string) {
        super(_database_id, _owner_id, _created_by)
        this.book_label = book_label
        this.total_chapters = total_chapters
        this.progress_chapter = progress_chapter
        this.user_label = user_label
    }

    @Column()
    book_label: string

    @Column()
    total_chapters: number

    @Column()
    progress_chapter: number

    @Column()
    is_completed: boolean

    @Column()
    user_label: string
}
