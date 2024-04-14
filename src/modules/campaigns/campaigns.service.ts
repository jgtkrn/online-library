import { Injectable , HttpException, HttpStatus } from '@nestjs/common'
import { InjectRepository} from '@nestjs/typeorm'
import { I18nService } from 'nestjs-i18n';

import { userLang } from '../../helpers/app.helpers';

import 
{ 
    Campaign, 
    CampaignsList, 
    CampaignDetail, 
    CampaignDetailWithoutBooks, 
    CampaignWithLabel, 
    CampaignDetailWithActive 
} from './campaigns.interface'
import { BookDetail } from '../books/books.interface'

import { CampaignEntity, CampaignBooksEntity, CampaignTranslateEntity} from './entities'
import { BookEntity, BooksCampaignEntity, BooksCategoriesEntity, BookTranslateEntity } from '../books/entities'

import { AuthorBookEntity, AuthorTranslateEntity } from '../authors/entities'
import { ChaptersEntity , AudioEntity} from '../chapters/entities'

import { Repository, getConnection } from 'typeorm'
import { queryDto } from '../app/dto'
import { CampaignBodyDto, CampaignStatusDto } from './dto'
import { Response } from '../../helpers/response'

import { Logger } from '../../helpers/logger';
import { sort_by, sort, status, default_daily_book, member_type} from '../../helpers/util'
import { BooksService } from '../books/books.service';
import { UsersService } from '../users/users.service';
import * as moment from 'moment';
import { Campaigns } from 'aws-sdk/clients/personalize';


@Injectable()
export class CampaignsService {
    constructor (
        private readonly i18n: I18nService,
        private readonly response: Response,
        private readonly booksService : BooksService,
        private readonly userService : UsersService,
        @InjectRepository(CampaignEntity)
        private campaignRepository: Repository<CampaignEntity>,

        @InjectRepository(CampaignBooksEntity)
        private campaignBooksRepository: Repository<CampaignBooksEntity>
    ) {}


    findCampaignsWithoutCategory (joinedCampaigns: any) {
        return joinedCampaigns
        .select(
            ['campaign._id as id', 'campaignTranslate.title as title', 'campaign.campaign_label as label',
             'campaign.thumbnail as thumbnail', 'campaign.books_count as book_count',
             'campaign._created_at as created_at', 'campaign._updated_at as updated_at',
             'campaign.active as active',
             'campaign.campaign_label as campaign_label',
             'campaign.priority as priority'
            ])
    }

    findCampaignsWithCategory(joinedCampaigns: any, category: string) {
        return joinedCampaigns
            .innerJoin(BooksCampaignEntity, 'books_campaign', 'books_campaign.campaign_label = campaign.campaign_label')
            .innerJoin(BooksCategoriesEntity, 'books_categories', 'books_campaign.book_label = books_categories.book_label')
            .select(
                ['DISTINCT campaign._id as id', 'campaignTranslate.title as title', 'campaign.campaign_label as label',
                    'campaign.thumbnail as thumbnail', 'campaign.books_count as book_count',
                    'campaign._created_at as created_at', 'campaign._updated_at as updated_at',
                    'campaign.active as active', 'campaign.priority as priority'
                ])
            .where('books_categories.category_label IN (:...label)', { label: category.split(',') })
    }

    joinWithCampaignTranslate () {
        return this.campaignRepository
        .createQueryBuilder('campaign')
        .innerJoin(CampaignTranslateEntity, 'campaignTranslate', '"campaignTranslate"."campaign_label" = "campaign"."campaign_label"')
    }

    async findAll(query: queryDto):  Promise<CampaignsList> {
        const joinedCampaigns = this.joinWithCampaignTranslate()

        let selectedCampaigns = null
        if (!query.category) {
            selectedCampaigns = this.findCampaignsWithoutCategory(joinedCampaigns)
        } else {
            selectedCampaigns = this.findCampaignsWithCategory(joinedCampaigns, query.category)
        }

        if (query.status) {
            selectedCampaigns = selectedCampaigns.andWhere('campaign.active = :active', {
                active: query.status === status.ACTIVE
            })
        }

        selectedCampaigns = selectedCampaigns
            .andWhere("lower(campaignTranslate.title) like '%' || :title || '%'", {title: query.title.toLowerCase()})
            
        if(!query.priority) {
            selectedCampaigns.orderBy('campaign._created_at', query.sort === sort_by.ASC ? sort_by.ASC : sort_by.DESC)
        }

        if(query.priority) {
            selectedCampaigns
            .orderBy('campaign.priority', query.priority === sort_by.DESC ? sort_by.DESC : sort_by.ASC)
            .addOrderBy('campaign._created_at', query.sort === sort_by.ASC ? sort_by.ASC : sort_by.DESC)
        }

        const total: number = await selectedCampaigns.getCount()

        const offset: number = (query.page - 1) * query.size
        selectedCampaigns = selectedCampaigns.offset(offset)

        let campaigns: CampaignWithLabel[] = []
        try {
            if (query.size) {
                campaigns = await selectedCampaigns.limit(query.size).getRawMany()
            } else {
                campaigns = await selectedCampaigns.getRawMany()
            }
        } catch (err) {
            Logger.error(`failed to get campaigns, error: ${err}`)
            throw new HttpException(await this.response.response(
                await this.i18n.translate('message.GENERAL.ERROR.INVALID_GET_DATA', { lang: await userLang(null) }),
                null, null), HttpStatus.INTERNAL_SERVER_ERROR
            )
        }

        // get real book count
        let books: any[];
        let active_books: any[];
        for (let i = 0; i < campaigns.length; i++) {
            if (campaigns[i].thumbnail) {
                campaigns[i].thumbnail = `${process.env.ASSEST_BASE_URL}${campaigns[i].thumbnail}`
            }


                books = await this.campaignBooksRepository
                            .createQueryBuilder('books_campaign')
                            .select(['*'])
                            .where('books_campaign.campaign_label = :label', 
                                { label: campaigns[i].campaign_label 
                            })
                            .getRawMany();

                campaigns[i].book_count = books.length;
            

            active_books = await this.campaignBooksRepository
                        .createQueryBuilder('book_active')
                        .select(['*'])
                        .innerJoin(BookEntity, 'books', 'books.book_label = book_active.book_label')
                        .where('book_active.campaign_label = :label AND books.status = :status', 
                            { 
                                label: campaigns[i].campaign_label,
                                status: status.ACTIVE
                            }
                        )
                        .getRawMany();

            campaigns[i].active_books = (active_books.length > 0) ? active_books.length : 0;
        }

        return {
            page: query.page,
            size: query.size,
            total,
            campaigns
        }
    }

    async findOne(id: string, user = null): Promise<CampaignDetailWithActive> {
        // First, fetch campaign detail
        const campaignDetail: CampaignDetailWithoutBooks = await this.campaignRepository
        .createQueryBuilder('campaign')
        .innerJoin(CampaignTranslateEntity, 'campaignTranslate', '"campaignTranslate"."campaign_label" = "campaign"."campaign_label"')
        .select(
            ['campaign._id as id',
            'campaign._created_at as created_at',
            'campaign._updated_at as updated_at',
            'campaign.active as active',
            'campaign.campaign_label as label',
            'campaignTranslate.title as title',
            'campaignTranslate.subtitle as subtitle',
            'campaign.thumbnail as thumbnail',
            'campaign.priority as priority',
            ])
        .where('campaign._id = :id', { id })
        .getRawOne()
        .catch((err) => {
            Logger.error(`failed to get campaign for id: ${id}, error: ${err}`)
            throw new HttpException(this.response.response(`Failed to find campaign detail`, null, null), HttpStatus.INTERNAL_SERVER_ERROR)
        })

        if (!campaignDetail) {
            Logger.error(`campaign not found for id: ${id}`)
            throw new HttpException(await this.response.response(
                await this.i18n.translate('message.GENERAL.ERROR.NOT_FOUND', { lang: await userLang(null) }),
                null, null), HttpStatus.NOT_FOUND
            )
        }

        if (campaignDetail.thumbnail) {
            campaignDetail.thumbnail = `${process.env.ASSEST_BASE_URL}${campaignDetail.thumbnail}`
        }

        const detail_active_books = await this.campaignBooksRepository
                        .createQueryBuilder('book_active')
                        .select(['*'])
                        .innerJoin(BookEntity, 'books', 'books.book_label = book_active.book_label')
                        .where('book_active.campaign_label = :label AND books.status = :status', 
                            { 
                                label: campaignDetail.label,
                                status: status.ACTIVE
                            }
                        )
                        .getRawMany();

        const books_count = await this.campaignBooksRepository
                .createQueryBuilder('book_active')
                .select(['*'])
                .where('book_active.campaign_label = :label', 
                    { 
                        label: campaignDetail.label,
                    }
                )
                .getRawMany();

        campaignDetail.book_count = books_count.length;

        // Then, fetch books by campaign label
        const books = await this.campaignBooksRepository
        .createQueryBuilder('books_campaign')
        .select([
            'books._created_at as created_at',
            'books.note as note',
            'books._id as id', 'title',
            'json_agg(audio.language) AS languages',
            'books.cover_image as cover_image',
            'books.deleted_by as deleted_by',
            'books.book_label as label, books.status as status',
            `json_agg(DISTINCT jsonb_build_object('label', author.author_label, 'name', author.author_name, 'about', author.author_intro)) AS authors `,
            'bookTranslate.subtitle as subtitle', 'bookTranslate.duration as duration',
        ])
        .innerJoin(BookEntity, 'books', 'books.book_label = books_campaign.book_label')
        .innerJoin(BookTranslateEntity, 'bookTranslate', 'bookTranslate.book_label = books.book_label')
        .leftJoin(AuthorBookEntity, 'authorBook', 'authorBook.book_label = books.book_label' )
        .leftJoin(AuthorTranslateEntity, 'author', 'authorBook.author_label = author.author_label')
        .leftJoin(ChaptersEntity, 'chapters', 'books.book_label = chapters.book_label')
        .leftJoin(AudioEntity, 'audio', 'audio.chapter_label = chapters.chapter_label' )
        .where('books_campaign.campaign_label = :label', { label: campaignDetail.label })
        .groupBy(
                `books._id, bookTranslate.title, 
                books.cover_image, books.deleted_by, 
                books.book_label, books.status, 
                books._created_at, books.note, 
                bookTranslate.subtitle, bookTranslate.duration,
                books_campaign.priority
                `)
        .orderBy('books_campaign.priority')
        .getRawMany()
        .catch((err) => {
            Logger.error(`failed to get campaign for id: ${id}, error: ${err}`)
            throw new HttpException(this.response.response(`Failed to find campaign detail`, null, null), HttpStatus.INTERNAL_SERVER_ERROR)
        })

        for (let i = 0; i < books.length; i++) {
            let checkAudio = await this.booksService.checkIfAudioExist(books[i]['label']);
            books[i].active = books[i].status === 'ACTIVE';
            // books[i].is_contain_mandarin_audio = books[i].languages.some(language => language === 'zh-TW');
            // books[i].is_contain_cantonese_audio = books[i].languages.some(language => language === 'zh-HK');
            books[i].is_contain_mandarin_audio = (checkAudio as any).is_contain_mandarin_audio;
            books[i].is_contain_cantonese_audio = (checkAudio as any).is_contain_cantonese_audio;
            delete books[i].languages

            const authors = []
            books[i].authors.forEach((author) => {
                if (author.label || author.name) {
                    authors.push(author)
                }
            })
            books[i].authors = authors

            if (books[i].cover_image) {
                books[i].cover_image = `${process.env.ASSEST_BASE_URL}${books[i].cover_image}`
            }

            delete books[i].deleted_by
        }

        let freebie = default_daily_book;
        let isLocked = true;

        if(user){
            const userData = await this.userService.findOne(user.sub, null);
            isLocked = userData['member_type'] === member_type.PAID ? false : true;
            // get user freebie book
            const freebieBook = await this.booksService.freebieBook(user);
            freebie = freebieBook ? freebieBook['label'] : default_daily_book;
        }

        books.map(async(el) => {
            el.is_locked = isLocked
            if (el.label === freebie) el.is_locked = false
        })
         const active_books = (detail_active_books.length > 0) ? 
                detail_active_books.length : 0;

        return { ...campaignDetail, active_books, books}
    }

    async createCampaign(campaignData: CampaignBodyDto, user: any): Promise<void> {
        const queryRunner = getConnection().createQueryRunner()
        await queryRunner.connect()
        await queryRunner.startTransaction()
        const { active, title, subtitle, thumbnail, books, priority } = campaignData
        let priority_not_min = (priority >= 0) ? priority : 99;

        try {

            const label = await this.getCampaignLabelSequence()
            const campaign: CampaignEntity = new CampaignEntity(active, priority_not_min, thumbnail, '', user.sub, user.sub, label)
            const { campaign_label } = await queryRunner.manager.save(campaign)

            const campaignTranslate: CampaignTranslateEntity =
                new CampaignTranslateEntity(campaign_label, title, subtitle, '',
                    thumbnail, '', user.sub, user.sub)

            const campaignTranslateArr: CampaignTranslateEntity[] = [campaignTranslate]
            await queryRunner.manager.save(campaignTranslateArr)

            // Append all campaignBooks first, then bulk insert
            const campaignBooksArr: CampaignBooksEntity[] = []
            let book_priority = 1
            books.forEach((bookLabel) => {
                const campaignBooks =
                    new CampaignBooksEntity(campaign_label, book_priority, bookLabel, '', user.sub, user.sub)

                campaignBooksArr.push(campaignBooks)
                book_priority += 1
            })
            await queryRunner.manager.save(campaignBooksArr)
            await queryRunner.commitTransaction()

        } catch (err) {
            await queryRunner.rollbackTransaction()
            Logger.error(`failed to create campaign ,userId: ${user.sub}, error:${err}`)
            throw new HttpException(await this.response.response(
                await this.i18n.translate('message.GENERAL.ERROR.UNPROCESSED_CREATE', { lang: await userLang(null) }),
                null, null), HttpStatus.INTERNAL_SERVER_ERROR
            )
        } finally {
            await queryRunner.release()
        }
    }

    async updateCampaign (id: string, campaignData: CampaignBodyDto, user: any): Promise<void> {
        const queryRunner = getConnection().createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        const existingCampaign = await queryRunner.manager.findOne(CampaignEntity, {
            where: {_id: id}
        })
        const { active, title, subtitle, thumbnail, books, priority } = campaignData;
        let priority_not_min = (priority >= 0) ? priority : 99;

        const campaignTranslate = {
            title,
            subtitle,
            thumbnail,
            _updated_by: user.sub
        }

        const campaign = {
            active,
            thumbnail,
            priority
        }

        try {
            await queryRunner.manager.update(CampaignEntity, { _id: id }, campaign )
            await queryRunner.manager.update(CampaignTranslateEntity, {
                campaign_label: existingCampaign.campaign_label
            }, campaignTranslate )

            // Delete books
            await queryRunner.manager.createQueryBuilder().delete().from(CampaignBooksEntity)
            .where('campaign_label = :label', { label: existingCampaign.campaign_label }).execute()

            // Append all campaignBooks first, then bulk insert
            const campaignBooksArr: CampaignBooksEntity[] = []
            let book_priority = 1
            books.forEach((bookLabel) => {
                const campaignBooks = new CampaignBooksEntity(existingCampaign.campaign_label, book_priority, bookLabel, '', user.sub, user.sub)
                campaignBooksArr.push(campaignBooks)
                book_priority += 1
            })
            await queryRunner.manager.save(campaignBooksArr)
            await queryRunner.commitTransaction()

        } catch (err) {
            await queryRunner.rollbackTransaction()
            Logger.error(`failed to update campaign ,userId: ${user.sub}, error:${err}`)
            throw new HttpException(await this.response.response(
                await this.i18n.translate('message.GENERAL.ERROR.UNPROCESSED_UPDATE', { lang: await userLang(null) }),
                null, null), HttpStatus.INTERNAL_SERVER_ERROR
            )
        } finally {
            await queryRunner.release()
        }
    }

    async updateCampaignStatus (id: string, activeData: CampaignStatusDto, user: any): Promise<void> {
        const { active } = activeData
        await this.campaignRepository.createQueryBuilder().update(CampaignEntity)
        .set({ active, _updated_by: user.sub })
        .where("_id = :id", { id })
        .execute()
        .catch(async(err) => {
            Logger.error(`failed to update campaign active status ,userId: ${user.sub}, error:${err}`)
            throw new HttpException(await this.response.response(
                await this.i18n.translate('message.GENERAL.ERROR.UNPROCESSED_UPDATE', { lang: await userLang(null) }),
                null, null), HttpStatus.INTERNAL_SERVER_ERROR
            )
        })
    }

    async getCampaignLabelSequence() : Promise<any>{
        const date =  moment().format('YYYYMMDD');
        const pattern = 'C' + date;

        const data = await this.campaignRepository
        .createQueryBuilder("campaign")
        .where("campaign.campaign_label like :pattern", { pattern:`%${pattern}%` })
        .select([
            'campaign._id as id',
            'campaign.campaign_label as campaign_label',
            'campaign._created_at as created_at'
        ])
        .orderBy('campaign._created_at', 'DESC')

        let count = await data.getCount();

        return pattern + '_' + (++count)
    }

    async updateBookCount() : Promise<any>{
        const data = await this.campaignRepository
        .createQueryBuilder("campaign")
        .leftJoin(BooksCampaignEntity, 'books_campaign', 'books_campaign.campaign_label = campaign.campaign_label')
        .innerJoin(BookEntity, 'books', 'books.book_label = books_campaign.book_label AND "books".status = :status', { status : 'ACTIVE'})
        .select([
            'campaign._id as id',
            'campaign.campaign_label as campaign_label',
            'campaign.books_count as books_count',
            'campaign._created_at as created_at',
            `json_agg(DISTINCT jsonb_build_object('book_id', books._id, 'book_label', books.book_label, 'status', books.status)) AS books`,
            // `json_agg(DISTINCT jsonb_build_object('books_campaign_id', books_campaign._id, 'label_campaign', books_campaign.campaign_label, 'book_label', books_campaign.book_label)) AS books_campaign`,
        ])
        .groupBy(
            `campaign._id, campaign.campaign_label, 
            campaign.books_count, campaign._created_at
            `)
        .orderBy('campaign._created_at', 'DESC')

        const campaigns = await data.getRawMany();

        for(let i = 0; i < campaigns.length; i++){
            const books = campaigns[i].books;
            const books_count = books.length
            if(books[0].book_label != null && books_count !== campaigns[i].books_count){
                await this.campaignRepository.createQueryBuilder().update(CampaignEntity)
                .set({ books_count })
                .where("_id = :id", { id: campaigns[i].id })
                .execute()
                .catch(async(err) => {
                    Logger.error(`failed to update campaign books count ,error:${err}`)
                    throw new HttpException(await this.response.response(
                        await this.i18n.translate('message.GENERAL.ERROR.UNPROCESSED_UPDATE', { lang: await userLang(null) }),
                        null, null), HttpStatus.INTERNAL_SERVER_ERROR
                    )
                })
                console.log(campaigns[i].campaign_label + 'book count updated from ' +campaigns[i].books_count+ ' to ' + books_count);
            }
        }

        return campaigns
    }
}
