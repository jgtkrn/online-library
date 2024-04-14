import { Pagination } from '../app/app.interface'

export interface Chapter {
    id: string,
    number: number,
    label: string,
    audio_cantonese: string,
    audio_mandarin: string
}

export interface ChaptersList extends Pagination{
    id: string;
    title: string;
    chapters: Chapter[],
    last_chapter: number
  }
  
