import { Injectable , HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository} from '@nestjs/typeorm';
import { Repository, getConnection, Brackets } from 'typeorm';
import { I18nService } from 'nestjs-i18n';

import { userLang } from '../../helpers/app.helpers';
import { BooksList, BookDetail, Books } from './books.interface';
import { CreateBookDto , queryDto, myDeskQueryDto} from './dto';
import {
            BookEntity, BookTranslateEntity,
            BooksCategoriesEntity, CategoriesEntity,
            UserFavBooksEntity, UserFreebieBooksEntity
        } from './entities';
import { AuthorBookEntity, AuthorTranslateEntity, AuthorEntity} from '../authors/entities'
import { ChaptersEntity , AudioEntity} from '../chapters/entities'
import { Response } from '../../helpers/response';
import { UsersService  } from '../users/users.service';
import { duration_unit, default_daily_book, member_type } from '../../helpers/util';
import { sort_by, desk_status_options } from '../../helpers/util'
import { Logger } from '../../helpers/logger';
import { UserEntity } from '../users/entities';

@Injectable()
export class BooksService {

    constructor(
        private readonly response: Response,
        private readonly usersService: UsersService,

        private readonly i18n: I18nService,

        @InjectRepository(BookEntity)
        private bookRepository: Repository<BookEntity>,

        @InjectRepository(AuthorBookEntity)
        private authorBookRepository: Repository<AuthorBookEntity>,

        @InjectRepository(CategoriesEntity)
        private categoryRepository: Repository<CategoriesEntity>,

        @InjectRepository(AuthorEntity)
        private authorRepository: Repository<AuthorEntity>,

        @InjectRepository(UserFavBooksEntity)
        private userFavBooksRepository: Repository<UserFavBooksEntity>,

        @InjectRepository(UserFreebieBooksEntity)
        private userFreebieBooksEntityRepository: Repository<UserFreebieBooksEntity>,

        @InjectRepository(ChaptersEntity)
        private chaptersEntityRepository: Repository<ChaptersEntity>,

      ) {}


    // find all books
    async findAll(query: queryDto, user = null):  Promise<BooksList> {

        const skippedItems:number = (query.page - 1) * query.size;

        let book = this.bookRepository
        .createQueryBuilder('books')
        .innerJoin( BookTranslateEntity, 'bookTranslate', 'bookTranslate.book_label = books.book_label')
        .leftJoin( AuthorBookEntity, 'authorBook', 'authorBook.book_label = books.book_label' )
        .leftJoin( AuthorTranslateEntity, 'author', 'authorBook.author_label = author.author_label')
        .leftJoin( ChaptersEntity, 'chapters', 'books.book_label = chapters.book_label')
        .leftJoin( AudioEntity, 'audio', 'audio.chapter_label = chapters.chapter_label' )
        .leftJoin( BooksCategoriesEntity, 'bookCategories', 'books.book_label = bookCategories.book_label')
        .select([
                'books._created_at as created_at',
                'books.note as note',
                'books._id as id', 'title',
                'json_agg(audio.language) AS languages',
                'json_agg(audio.audio_path) AS audio_paths',
                'books.cover_image as cover_image',
                'books.deleted_by as deleted_by',
                'books.book_label as label, books.status as status',
                `json_agg(DISTINCT jsonb_build_object('label', author.author_label, 'name', author.author_name, 'about', author.author_intro)) AS authors `,
                'bookTranslate.subtitle as subtitle', 'bookTranslate.duration as duration',
            ])

        if(query.title) {
            book = book.where("lower(bookTranslate.title) like '%' || :title || '%'", { title: query.title.toLowerCase() })
        }
        if(query.category) {
            book = book.andWhere('bookCategories.category_label IN (:...label)', { label: query.category.split(',') })
        }
        if(query.status){
            book = book.andWhere('books.status = :status', { status: query.status })
        }

        if(query.search) {
            book = book
            .andWhere(new Brackets(qb => {
                qb.where("lower(bookTranslate.title) like '%' || :searchTitle || '%'", { searchTitle: query.search.toLowerCase() })
                qb.orWhere("lower(bookTranslate.subtitle) like '%' || :searchSubtitle || '%'", { searchSubtitle: query.search.toLowerCase() })
                qb.orWhere("lower(author.author_name) like '%' || :searchAuthor || '%'", { searchAuthor: query.search.toLowerCase() })
                qb.orWhere("lower(author.author_intro) like '%' || :searchAuthorIntro || '%'", { searchAuthorIntro: query.search.toLowerCase() })
                qb.orWhere("lower(bookTranslate.intro) like '%' || :searchAuthorIntroOnBook || '%'", { searchAuthorIntroOnBook: query.search.toLowerCase() })
                qb.orWhere("lower(bookTranslate.author) like '%' || :searchAuthorOnBook || '%'", { searchAuthorOnBook: query.search.toLowerCase() })
            }))
        }

        book = book.orderBy('books._created_at', query.sort === sort_by.ASC ? sort_by.ASC : sort_by.DESC)
                    .groupBy(
                            `books._id, bookTranslate.title, 
                            books.cover_image, books.deleted_by, 
                            books.book_label, books.status, 
                            books._created_at, books.note, 
                            bookTranslate.subtitle, bookTranslate.duration
                            `)
                    .offset(skippedItems)

        let books = []

        try {
            if (query.size) {
                books = await book.limit(query.size).getRawMany()
            } else {
                books = await book.getRawMany()
            }

        } catch(err) {
            Logger.error(`failed to get books, error: ${err}`)
            throw new HttpException(await this.response.response(
                await this.i18n.translate('message.GENERAL.ERROR.INVALID_GET_DATA', { lang: await userLang(user) }),
                null, null), HttpStatus.INTERNAL_SERVER_ERROR
            )
        }

        let freebie = default_daily_book;
        let isLocked = true;
        const tts_folder = /ttsfolder/;

        if(user){
            const userData = await this.usersService.findOne(user.sub, null);
            isLocked = userData['member_type'] === member_type.PAID ? false : true;
            // get user freebie book
            const freebieBook = await this.freebieBook(user);
            freebie = freebieBook ? freebieBook['label'] : default_daily_book;
        }

        const data = books.map(async(el) => {

            el.is_locked = isLocked

            // islocked false if freebiebook
            if (el.label === freebie) el.is_locked = false

            const status = (el as any).status === 'INACTIVE' ? false : true;
            // el.is_contain_mandarin_audio = el.languages.some(language => language === 'zh-TW');
            // el.is_contain_cantonese_audio = el.languages.some(language => language === 'zh-HK');
            el.is_contain_mandarin_audio = el.audio_paths.some(audio => !tts_folder.test(audio) && audio !== null) && el.languages.some(language => language === 'zh-TW');
            el.is_contain_cantonese_audio = el.audio_paths.some(audio => !tts_folder.test(audio) && audio !== null) && el.languages.some(language => language === 'zh-HK');
            delete el.languages
            delete el.audio_paths

            const authors = []
            await Promise.all(el.authors.map((author)=>{
                if( author.label !== null || author.name !== null ) {
                   authors.push(author)
                }
            })
            )
            el.authors = authors;
            el.active = status;
            el.cover_image = el.cover_image ?`${process.env.ASSEST_BASE_URL}${el.cover_image}` : el.cover_image;

            delete el.deleted_by;

            return el
        })

        return {
            page: query.page,
            size: query.size,
            total: await book.getCount(),
            books: await Promise.all(data),
        }
    };

    // eslint-disable-next-line @typescript-eslint/ban-types
    async surpriseMe(user : any): Promise<Object> {

        const book = this.bookRepository
        .createQueryBuilder('books')
        .innerJoin( BookTranslateEntity, 'bookTranslate', 'bookTranslate.book_label = books.book_label')
        .leftJoin( AuthorBookEntity, 'authorBook', 'authorBook.book_label = books.book_label' )
        .leftJoin( AuthorTranslateEntity, 'author', 'authorBook.author_label = author.author_label')
        .leftJoin( ChaptersEntity, 'chapters', 'books.book_label = chapters.book_label')
        .leftJoin( AudioEntity, 'audio', 'audio.chapter_label = chapters.chapter_label' )
        .leftJoin( BooksCategoriesEntity, 'bookCategories', 'books.book_label = bookCategories.book_label')
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
        .orderBy("RANDOM()")
        .groupBy(
            `books._id, bookTranslate.title, 
            books.cover_image, books.deleted_by, 
            books.book_label, books.status, 
            books._created_at, books.note, 
            bookTranslate.subtitle, bookTranslate.duration
            `)
        .limit(6)

        let books = []

        books = await book.getRawMany()


        let isLocked = true;
        let freebie = null;

        if(user){

            const userData = user ? await this.usersService.findOne(user.sub, null) : null;
            isLocked = userData['member_type'] === member_type.PAID ? false : true;

            // get user freebie book
            const freebieBook = await this.freebieBook(user);
            freebie = freebieBook ? freebieBook['label'] : default_daily_book;

        }


        const data = books.map(async(el) => {
            el.is_locked = isLocked

            // islocked false if freebiebook
            if (el.label === freebie) el.is_locked = false

            const status = (el as any).status === 'INACTIVE' ? false : true;
            el.is_contain_mandarin_audio = el.languages.some(language => language === 'zh-TW');
            el.is_contain_cantonese_audio = el.languages.some(language => language === 'zh-HK');
            delete el.languages

            const authors = []
            await Promise.all(el.authors.map((author)=>{
                if( author.label !== null || author.name !== null ) {
                   authors.push(author)
                }
            })
            )
            el.authors = authors;
            el.active = status;
            el.cover_image = el.cover_image ?`${process.env.ASSEST_BASE_URL}${el.cover_image}` : el.cover_image;

            delete el.deleted_by;

            return el
        })

        return Promise.all(data);
    }


    async categoryById(id: string) {
        return await this.categoryRepository
                        .createQueryBuilder('category')
                        .select('category_label')
                        .where('category._id = :id', { id })
                        .getRawOne();
    };

    async getAuthors(bookLabel: string) {
        return await this.authorBookRepository
                    .createQueryBuilder('bookAuthor')
                    .select(['authorTranlsate.author_name as name', 'bookAuthor.author_label as label', 'authorTranlsate.author_intro as about' ])
                    .innerJoin( AuthorTranslateEntity, 'authorTranlsate', 'authorTranlsate.author_label = bookAuthor.author_label')
                    .where('bookAuthor.book_label = :bookLabel', { bookLabel })
                    .getRawMany()
    };

    async getAuthorByLabel(authorLabel: string) {
        return await this.authorRepository
                    .createQueryBuilder('author')
                    .select(['authorTranlsate.author_name as name'])
                    .innerJoin( AuthorTranslateEntity, 'authorTranlsate', 'authorTranlsate.author_label = author.author_label')
                    .where('author.author_label = :authorLabel', { authorLabel })
                    .getRawOne()
    };
    async userChapter(bookLabel, userLabel) {
        const userFav = await this.userFavBooksRepository
                .createQueryBuilder('userfav')
                .select([
                    'userfav.progress_chapter as progress_chapter',
                    'userfav.total_chapters as total_chapters',
                    'userfav.is_completed as is_completed'
                ])
                .where('userfav.book_label = :bookLabel', { bookLabel })
                .andWhere('userfav.user_label = :userLabel', { userLabel })
                .getRawOne();
        return userFav
    };
    async freebieBook(user) {
        const userData = await this.usersService.findOne(user.sub, null)
        const freebie = await this.userFreebieBooksEntityRepository
            .createQueryBuilder('freebiebook')
            .select(
                ['f._id as id',
                 'f.book_label as label',
                ])
            .from(
                subQuery => {
                    return subQuery
                    .select("freebie.*")
                    .addSelect(`CASE WHEN LEAD(free_assign_date) OVER(ORDER BY free_assign_date)
                    IS NULL THEN now()::date + interval '1d' ELSE
                    LEAD(free_assign_date) OVER(ORDER BY free_assign_date) END as NextValue`)
                    .from(UserFreebieBooksEntity, "freebie")
                    .where('freebie.user_label = :userLabel', { userLabel: userData['label'] })
                    }, "f"
            )
            .where(`now() BETWEEN freebiebook.free_assign_date AND NextValue`)
            .limit(1)
            .getRawOne();

        return freebie
    };
    async findOne(id, query, user = null): Promise<BookDetail | []> {

        const label = query && query.label ? query.label : undefined
        const where = 'books.book_label = :label'

        const book = await this.bookRepository
            .createQueryBuilder('books')
            .select(['books._id as id',
                'books.note as note',
                'books.isbn as ISBN', 'books.ref_link as ref_link',
                'books.book_label as label', 'books.status as status',
                'books.cover_image as cover_image', 'bookTranslate.title as title',
                'bookTranslate.subtitle as subtitle',
                'bookTranslate.intro as introduction', 'bookTranslate.who_is_it_for as suitable_audience',
                'bookTranslate.duration as duration',
                `json_agg(json_build_object('id', categories._id, 'label', categories.category_label)) AS categories`
             ])
            .leftJoin( BookTranslateEntity, 'bookTranslate', 'bookTranslate.book_label = books.book_label')
            .leftJoin( BooksCategoriesEntity, 'bookCategories', 'bookTranslate.book_label = bookCategories.book_label', {isremoved: false})
            .leftJoin( CategoriesEntity, 'categories', 'categories.category_label = bookCategories.category_label')
            .where('books._id = :id', { id })
            .orWhere( where, { label })
            .groupBy('books._id, books.isbn, books.book_label, books.status, books.ref_link, cover_image, bookTranslate.title, bookTranslate.intro, bookTranslate.duration, bookTranslate.subtitle, bookTranslate.who_is_it_for, books.note')
            .getRawOne();


        if (!book || book.length === 0 ) {
            Logger.error(`book not found for id: ${id} and label ${label}`, {book_id : id, book_label : label, user : user});
            return [];
        };

        const bookLabel = (book as any).label;
        book.active = book.status === 'ACTIVE' ? true : false;
        const authors = await this.getAuthors(bookLabel);
        book.image = book.cover_image ?`${process.env.ASSEST_BASE_URL}${book.cover_image}` : book.cover_image;

        const totalChapters = await this.chaptersEntityRepository
            .createQueryBuilder('chapter')
            .where('chapter.book_label = :bookLabel', { bookLabel })
            .getCount();

        let user_chapters = {
            progress_chapter: 0,
            total_chapters : totalChapters,
            is_completed : false
        }

        book['is_favorite'] = false;
        const checkAudio = await this.checkIfAudioExist(bookLabel);

        if ( user ) {
            const userData = await this.usersService.findOne(user.sub, null)
            const userLabel = (userData as any).label;

            const chapters = await this.userChapter(bookLabel, userLabel);

            book['is_favorite'] = chapters ? true : false;

            const isFreebie = await this.freebieBook(user)

            const freebie_book = isFreebie && ( isFreebie.label === book.label )

            if(chapters) {
                user_chapters = chapters
            }
            return Object.assign(book, { authors, user_chapters, freebie_book }, checkAudio );
        } else {
            return Object.assign(book, { authors, user_chapters }, checkAudio );
        }
    }

    async getAuthorsName(authorData) {
        const authors = []
        await Promise.all(authorData.map(async(el) => {
            const author = await this.getAuthorByLabel(el);
            if( !author ) {
                const errorMessage =  await this.i18n.translate('message.GENERAL.ERROR.NOT_FOUND', { lang: await userLang(null) })
                const error = [{ "author" : errorMessage}]
                throw new HttpException(await this.response.response(errorMessage,null, error), HttpStatus.NOT_FOUND)
            }
            authors.push(author.name);
        }))
        return authors;
    };

    async createBook(bookData: CreateBookDto, user): Promise<void> {

        const queryRunner = getConnection().createQueryRunner();

        await queryRunner.connect();

        await queryRunner.startTransaction();

        const authors = await this.getAuthorsName(bookData.authors);

        try {
            const status = bookData.active ? 'ACTIVE' : 'INACTIVE';

            const book = new BookEntity()
            book._database_id = ''
            book._created_by = user.sub
            book._owner_id = user.sub
            book.cover_image = bookData.cover_image
            book.isbn = bookData.isbn
            book.ref_link = bookData.ref_link
            book.status = status
            book.note = bookData.note

            const { book_label } = await queryRunner.manager.save(book);

            const bookTranslate = new BookTranslateEntity()
            bookTranslate.book_label = book_label
            bookTranslate._database_id = ''
            bookTranslate._created_by = user.sub
            bookTranslate._owner_id = user.sub
            bookTranslate.title = bookData.title
            bookTranslate.subtitle = bookData.subtitle
            bookTranslate.author = authors.join('|')
            bookTranslate.duration = `${bookData.duration}${duration_unit.MINUTES}`
            bookTranslate.intro = bookData.introduction
            bookTranslate.who_is_it_for = bookData.suitable_audience


            const saveCat = bookData.categories.map(async (categoryLabel)=>{

                const bookCategories = new BooksCategoriesEntity()
                bookCategories.book_label = book_label
                bookCategories._database_id = ''
                bookCategories._owner_id = user.sub
                bookCategories._created_by = user.sub
                bookCategories.category_label = categoryLabel

                await queryRunner.manager.save(bookCategories);
            });

            await queryRunner.manager.save(bookTranslate);

            await Promise.all(saveCat);

            if(bookData.authors && bookData.authors.length > 0) {
                const saveAuthor = bookData.authors.map(async (authorLabel) =>{
                    const bookAuthor = new AuthorBookEntity(authorLabel, book_label, '', user.sub, user.sub)
                    await queryRunner.manager.save(bookAuthor);
                })
                await Promise.all(saveAuthor);
            }
            // commit transaction
            await queryRunner.commitTransaction();

        } catch (err) {
            // rollback on err
            await queryRunner.rollbackTransaction();
            Logger.error(`failed to create book ,userId: ${user.sub}, error:${err}`);
            const errorMessage =  await this.i18n.translate('message.GENERAL.ERROR.UNPROCESSED_CREATE', { lang: await userLang(null) })
            const error = [{ "book" : errorMessage}]
            throw new HttpException(await this.response.response(errorMessage, null, error), HttpStatus.INTERNAL_SERVER_ERROR);
        } finally {
            // release query runner
            await queryRunner.release();
        }
    }
    async updateBook( id: string, bookData: CreateBookDto, user ): Promise<void> {

        const book = await this.findOne(id, null)

        const bookLabel = (book as any).label;


        const queryRunner = getConnection().createQueryRunner();
        const queryBuilder = getConnection().createQueryBuilder(queryRunner);
        await queryRunner.connect();

        // open new transaction
        await queryRunner.startTransaction();

        const authors = await this.getAuthorsName(bookData.authors);
        const status = bookData.active ? 'ACTIVE' : 'INACTIVE';

        const bookUpdatedData = {
            _updated_by: user.sub,
            cover_image: bookData.cover_image,
            isbn: bookData.isbn,
            ref_link: bookData.ref_link,
            status,
            note: bookData.note
        }

        const bookTranslate = {
            title : bookData.title,
            subtitle : bookData.subtitle,
            duration: `${bookData.duration}${duration_unit.MINUTES}`,
            intro: bookData.introduction,
            who_is_it_for: bookData.suitable_audience,
            author: authors.join('|')
        }
        try {

        await queryRunner.manager.update(BookEntity, { _id: id }, bookUpdatedData );
        await queryRunner.manager.update(BookTranslateEntity, { book_label: bookLabel }, bookTranslate );

        const catLabel = []
        const updateCatData = bookData.categories.map(async (categoryLabel)=> {

            const category =  {
                book_label: bookLabel,
                _database_id: '',
                _owner_id: user.sub,
                _created_by : user.sub,
                _updated_by: user.sub,
                category_label: categoryLabel
            }

            catLabel.push(categoryLabel)

            await queryBuilder.insert().into(BooksCategoriesEntity)
            .values(category).onConflict(`DO NOTHING`).execute();
        })

        await Promise.all(updateCatData)

        await queryRunner.manager.createQueryBuilder().delete().from(BooksCategoriesEntity)
        .where('book_label = :bookLabel', { bookLabel })
        .andWhere(new Brackets(qb => {
            qb.where("category_label NOT IN (:...categories)", { categories: catLabel })
        })).execute()

        if( bookData.authors.length === 0 ){
            await queryRunner.manager.createQueryBuilder().delete().from(AuthorBookEntity)
            .where('book_label = :bookLabel', { bookLabel }).execute()
        }else {
            const authorsLabel = []
            const updateAuthor = bookData.authors.map(async (authorLabel)=> {
                const author =  {
                    book_label: bookLabel,
                    _database_id: '',
                    _owner_id: user.sub,
                    _created_by : user.sub,
                    _updated_by: user.sub,
                    author_label: authorLabel
                }
                authorsLabel.push(authorLabel)

                await queryBuilder.insert().into(AuthorBookEntity)
                .values(author).onConflict(`DO NOTHING`).execute();
            })

            await Promise.all(updateAuthor)

            await queryRunner.manager.createQueryBuilder().delete().from(AuthorBookEntity)
            .where('book_label = :bookLabel', { bookLabel })
            .andWhere(new Brackets(qb => {
                qb.where("author_label NOT IN (:...authors)", { authors: authorsLabel })
            })).execute()
        }

        await queryRunner.commitTransaction();

        } catch (err) {
            await queryRunner.rollbackTransaction()
            Logger.error(`failed to update book ,userId: ${user.sub}, error:${err}`);
            const errorMessage =  await this.i18n.translate('message.GENERAL.ERROR.UNPROCESSED_UPDATE', { lang: await userLang(user) })
            const error = [{ "book" : errorMessage}]
            throw new HttpException(await this.response.response(errorMessage, null, error), HttpStatus.INTERNAL_SERVER_ERROR);
        } finally {
            await queryRunner.release();
        };
    };

    async getCategories(query: queryDto): Promise<Object> {
        // get offset
        const skippedItems = (query.page - 1) * query.size;
        const total = await this.categoryRepository.count();

        const category = await this.categoryRepository
        .createQueryBuilder('categories')
        .select(['categories._id as id', 'categories.category_label as label'])
        .orderBy('categories._created_at', query.sort === sort_by.ASC ? sort_by.ASC : sort_by.DESC)
        .offset(skippedItems)
        .limit(query.size)
        .getRawMany();

        return {
            page: query.page,
            size: query.size,
            total,
            categories: category
        };
    };

    async updateBookStatus( id: string, status, user ): Promise<void> {

        const bookStatus =  status.active ?  'ACTIVE' : 'INACTIVE';
        try {
            await this.bookRepository.update(
                    { _id: id },  { status : bookStatus }
                )
        } catch (err) {
            Logger.error(`Failed To Update Book's Status,userId: ${user.sub}, error:${err}`);
            const errorMessage =  await this.i18n.translate('message.GENERAL.ERROR.UNPROCESSED_CREATE', { lang: await userLang(user) })
            const error = [{ "book" : errorMessage}]
            throw new HttpException(await this.response.response(errorMessage, null, error), HttpStatus.INTERNAL_SERVER_ERROR);

        };
    };

    async checkIfAudioExist(label): Promise<Object>{

        const audios = await this.chaptersEntityRepository
            .createQueryBuilder('chapter')
            .select([
                'json_agg(audio.language) AS languages',
                'json_agg(audio.audio_path) AS audio_paths',
            ])
            .leftJoin( AudioEntity, 'audio', 'audio.chapter_label = chapter.chapter_label' )
            .where('chapter.book_label = :label', {label})
            .getRawOne();

        const tts_folder = /ttsfolder/;
        let is_contain_mandarin_audio = false;
        let is_contain_cantonese_audio = false;
        if(audios.audio_paths != null) { 
            is_contain_mandarin_audio = audios.audio_paths.some(audio => !tts_folder.test(audio) && audio !== null) && audios.languages.some(language => language === 'zh-TW');
            is_contain_cantonese_audio = audios.audio_paths.some(audio => !tts_folder.test(audio) && audio !== null) && audios.languages.some(language => language === 'zh-HK');
        }
        return {
            is_contain_mandarin_audio,
            is_contain_cantonese_audio
        };

    }

    async getDailyBook(user): Promise<Object> {
        let book = {}
        let freebie = {
            label : default_daily_book
        }
        if(user) {
            const freebieBook = await this.freebieBook(user);
            if (freebieBook) freebie = freebieBook;
            book = await this.findOne(freebie['id'], { label: freebie['label'], user })
            if(Object.keys(book).length === 0) {
                book = await this.findOne('find', { label: default_daily_book })
            }
        } else {
            book = await this.findOne('find', { label: freebie['label'] })
        }
        return book;
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    async getMyDesk(query : myDeskQueryDto, user) : Promise<Object>{

            const skippedItems:number = (query.page - 1) * query.size;
            const member = await this.usersService.findOne(user.sub, null);
            const userLabel =  member['label'];

            let userFav = await this.userFavBooksRepository
                    .createQueryBuilder('userfav')
                    .innerJoin( BookTranslateEntity, 'bookTranslate', 'bookTranslate.book_label = userfav.book_label')
                    .leftJoin( UserEntity, 'user', 'user.user_label = userfav.user_label')
                    .leftJoin( BookEntity, 'books', 'books.book_label = userfav.book_label')
                    .leftJoin( AuthorBookEntity, 'authorBook', 'authorBook.book_label = userfav.book_label' )
                    .leftJoin( AuthorTranslateEntity, 'author', 'authorBook.author_label = author.author_label')
                    .leftJoin( ChaptersEntity, 'chapters', 'books.book_label = chapters.book_label')
                    .leftJoin( AudioEntity, 'audio', 'audio.chapter_label = chapters.chapter_label' )
                    .select([
                        'books._id as id',
                        'bookTranslate.title as title',
                        'userfav.progress_chapter as progress_chapter',
                        'userfav.total_chapters as total_chapters',
                        'userfav.is_completed as is_completed',
                        'json_agg(audio.language) AS languages',
                        'bookTranslate.subtitle as subtitle',
                        'books.status as status',
                        'bookTranslate.duration as duration',
                        'books.note as note',
                        'books._created_at as created_at',
                        'books.cover_image as cover_image',
                        'userfav.book_label as book_label',
                        'userfav.user_label as user_label',
                        `json_agg(DISTINCT jsonb_build_object('label', author.author_label, 'name', author.author_name, 'about', author.author_intro)) AS authors `,
                    ])
                    .where('userfav.user_label = :userLabel', { userLabel })

            if(query.is_completed){
                userFav = userFav.andWhere('userfav.is_completed = :is_completed', { is_completed: query.is_completed })
            }

 
            let query_status: any;
            
            if(query.status){
                query_status = query.status.toUpperCase();
                userFav = userFav.andWhere('books.status = :status', { 
                        status : ( query_status === desk_status_options.ACTIVE ) ? desk_status_options.ACTIVE : desk_status_options.INACTIVE 
                    }
                );
            }

            userFav = userFav.orderBy('books._created_at', query.sort === sort_by.ASC ? sort_by.ASC : sort_by.DESC)
                             .groupBy(
                                    `books._id, bookTranslate.title, userfav.progress_chapter, 
                                    userfav.total_chapters, userfav.is_completed, books.status, 
                                    books._created_at, books.cover_image, books.note, 
                                    bookTranslate.subtitle, userfav.book_label, books.status, 
                                    bookTranslate.subtitle, userfav.is_completed, userfav.user_label,
                                    bookTranslate.duration
                                    `)
                             .offset(skippedItems)
            let data = []
            try {
                if (query.size) {
                    data = await userFav.limit(query.size).getRawMany()
                } else {
                    data = await userFav.getRawMany()
                }
            } catch(err) {
                Logger.error(`failed to get books, error: ${err}`)
                const errorMessage =  await this.i18n.translate('message.GENERAL.ERROR.INVALID_GET_DATA', { lang: await userLang(user) })
                const error = [{ "book" : errorMessage}]
                throw new HttpException(await this.response.response(errorMessage, null, null), HttpStatus.INTERNAL_SERVER_ERROR);
            }

            let freebie = default_daily_book;
            let isFreeMember = true;

            if(user) {
                const userData = await this.usersService.findOne(user.sub, null);
                isFreeMember = userData['member_type'] === member_type.FREE ? true : false;
                // get user freebie book
                const freebieBook = await this.freebieBook(user);
                freebie = freebieBook ? freebieBook['label'] : default_daily_book;
            }

            const books = data.map(async(el) => {
                const authors = []
                let checkAudio = await this.checkIfAudioExist(el.book_label);
                el.is_locked = isFreeMember
                el.is_freebie_book = el.book_label == freebie ? true : false;
                // el.is_contain_mandarin_audio = el.languages.some(language => language === 'zh-TW');
                // el.is_contain_cantonese_audio = el.languages.some(language => language === 'zh-HK');
                el.is_contain_mandarin_audio = (checkAudio as any).is_contain_mandarin_audio;
                el.is_contain_cantonese_audio = (checkAudio as any).is_contain_cantonese_audio;
                delete el.languages
                if (el.book_label === freebie) el.is_locked = false
                await Promise.all(el.authors.map((author)=>{
                        if( author.label !== null || author.name !== null ) {
                        authors.push(author)
                        }
                    })
                )
                el.authors = authors;
                el.cover_image = el.cover_image ?`${process.env.ASSEST_BASE_URL}${el.cover_image}` : el.cover_image;

                return el
            })

            return {
                page: query.page,
                size: query.size,
                total: await userFav.getCount(),
                books: await Promise.all(books),
            }
    }

    async updateBookChapterProgress(chapterData, user):Promise<void>  {

        const queryBuilder = getConnection().createQueryBuilder();
        const userData = await this.usersService.findOne(user.sub, null);
        const totalChapters = await this.chaptersEntityRepository
            .createQueryBuilder('chapter')
            .where('chapter.book_label = :bookLabel', { bookLabel: chapterData['book_label'] })
            .getCount();

        if( chapterData['current_progress'] > totalChapters ) {
            Logger.error(`Chapter Progress Should Not Greater Than Total Chapter`, chapterData)
            const errorMessage =  await this.i18n.translate('message.BOOK.MY_DESK.PROGRESS_GREATER_THAN_TOTAL', { lang: await userLang(user) })
            throw new HttpException(await this.response.response(errorMessage, null, null), HttpStatus.BAD_REQUEST);
        }
        try{
            const isComplete = ( chapterData['current_progress'] + 1 ) === totalChapters || chapterData['is_complete'] || false
            const dataChapter = {
                _updated_by: user.sub,
                _created_by: user.sub,
                _owner_id: user.sub,
                _database_id : '',
                user_label: userData['label'],
                book_label: chapterData['book_label'],
                total_chapters: totalChapters,
                progress_chapter: chapterData['current_progress'],
                is_completed: isComplete
            }
            await queryBuilder.insert().into(UserFavBooksEntity)
            .values(dataChapter)
            .onConflict(
                `(book_label, user_label) 
                DO UPDATE SET "progress_chapter" = :progress, 
                "total_chapters" = :totalChapters,
                "is_completed" = :isComplete`)
            .setParameters({"progress": chapterData['current_progress'], totalChapters, isComplete})
            .execute();

        }catch(err){
            Logger.error(`failed to add book progress, error: ${err}`, chapterData)
            const errorMessage =  await this.i18n.translate('message.GENERAL.ERROR.UNPROCESSED_UPDATE', { lang: await userLang(user) })
            throw new HttpException(await this.response.response(errorMessage, null, null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async addFav(bookData ,user):Promise<void> {
        const chapterData: Object = {
            book_label: bookData['book_label'],
            current_progress: 0
        }
        await this.updateBookChapterProgress(chapterData, user)
    }

    async removeFav(bookLabel, user):Promise<void> {
        try{
            await getConnection()
                .createQueryBuilder()
                .delete()
                .from(UserFavBooksEntity)
                .where('user_label =  :userLabel', { userLabel: user.label })
                .andWhere('book_label = :bookLabel', { bookLabel })
                .execute();
        }catch(err){
            Logger.error(`failed to delete user fav, error: ${err}`, bookLabel)
            const errorMessage =  await this.i18n.translate('message.GENERAL.ERROR.UNPROCESSED_UPDATE', { lang: await userLang(user) })
            throw new HttpException(await this.response.response(errorMessage, null, null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

};
