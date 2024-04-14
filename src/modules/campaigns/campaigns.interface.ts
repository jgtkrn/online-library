import { Pagination } from '../app/app.interface'
import { BookDetail } from '../books/books.interface'

export interface Campaign {
    id: number
    title: string
    label: string
    thumbnail: string
    book_count: number
    active: boolean
    created_at: string
    updated_at: string
    deleted_by ?: string
}

export interface CampaignBook {
    title: string
    label: string,
    created_at: string,
    note: string,
}

export interface CampaignDetailWithoutBooks extends Campaign {
    subtitle: string
}

export interface CampaignDetail extends CampaignDetailWithoutBooks {
    books: BookDetail[]
}

export interface CampaignsList extends Pagination {
    campaigns: Campaign[]
}

export interface CampaignWithLabel extends Campaign {
    campaign_label: string,
    active_books: number
}

export interface CampaignDetailWithActive extends CampaignDetail {
    active_books: number
}