import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository} from '@nestjs/typeorm';
import { Repository, getConnection } from 'typeorm';
import { I18nService } from 'nestjs-i18n';

import { userLang } from '../../helpers/app.helpers';
import { Author } from './authors.interface';
import { AuthorBookEntity, AuthorTranslateEntity, AuthorEntity } from './entities'
import { Response } from '../../helpers/response';
import { Logger } from '../../helpers/logger';
import { sort_by, new_language_code } from '../../helpers/util'

@Injectable()
export class AuthorsService {

    constructor(
        private readonly response: Response,
        private readonly i18n: I18nService,

        @InjectRepository(AuthorEntity)
        private authorRepository: Repository<AuthorEntity>,

        @InjectRepository(AuthorTranslateEntity)
        private authorTranslateEntityRepository: Repository<AuthorTranslateEntity>,

      ) {}

    findAuthors(name) {
        return this.authorRepository
        .createQueryBuilder('authors')
        .select([
            'authors._id as id', 'authors.author_label as label', 
            'authorTranslate.author_name as name', 
            `json_array_length(case when count(authorBook.book_label)= 0 then '[]' ELSE json_agg(authorBook.book_label)END) AS book_on_apps`,
            'authorTranslate.author_intro as about'])
        .innerJoin( AuthorTranslateEntity, 'authorTranslate', 'authorTranslate.author_label = authors.author_label')
        .leftJoin( AuthorBookEntity, 'authorBook', 'authorBook.author_label = authors.author_label')
        .where("lower(authorTranslate.author_name) like '%' || :name || '%'", { name: name.toLowerCase() })
        .groupBy('authors._id, authors.author_label , authorTranslate.author_name, authorTranslate.author_intro, authors._created_at')
    }

    async findAll(query):  Promise<Object> {

        const skippedItems: number = (query.page - 1) * query.size
        const selectedAuthors = this.findAuthors(query.name)
                                    .orderBy('authors._created_at', query.sort === sort_by.ASC ? sort_by.ASC : sort_by.DESC)
                                    .offset(skippedItems)
        let authors = []

        try {
             if (query.size) {
                authors = await selectedAuthors.limit(query.size).getRawMany();
            } else {
                authors = await selectedAuthors.getRawMany();
            }
        } catch (err) {
            Logger.error(`failed to get authors, error: ${err}`, { query })
            throw new HttpException(await this.response.response(  
                await this.i18n.translate('message.GENERAL.ERROR.INVALID_GET_DATA', { lang: await userLang(null) }), 
                null, null), HttpStatus.INTERNAL_SERVER_ERROR
            )
        }

        const total: number =  await this.findAuthors(query.name).getCount()

        return {
            page: query.page,
            size: query.size,
            total,
            authors
        }
    }

    async findOne(id: string): Promise<Author> {

        const author = await (await this.findAuthors(''))
        .where('authors._id = :id', { id })
        .getRawOne();
        return author

    }
    async createAuthor(authorData, user): Promise<void> {

        const queryRunner = getConnection().createQueryRunner();
        await queryRunner.connect();

        const author_label = await this.getAuthorLabelSequence();
        const { name, about } = authorData
        const chapter: AuthorEntity = new AuthorEntity(null, '', user.sub, user.sub, author_label);
        const language = new_language_code.CANTONESE

        await queryRunner.startTransaction();

       try{
            const createAuthor = await queryRunner.manager.save(chapter)
            const authorTranlate: AuthorTranslateEntity = new AuthorTranslateEntity(createAuthor.author_label, name, about, language, '', user.sub, user.sub  ) 
            await queryRunner.manager.save(authorTranlate)
            await queryRunner.commitTransaction();
       }catch(err){
            await queryRunner.rollbackTransaction();
            Logger.error(`failed to create author ,userId: ${user.sub}, error:${err}`, { body: authorData });
            const errorMessage =  await this.i18n.translate('message.GENERAL.ERROR.UNPROCESSED_CREATE', { lang: await userLang(null) })
            const error = [{ "author" : errorMessage}]
            throw new HttpException(await this.response.response(errorMessage, null, error), HttpStatus.INTERNAL_SERVER_ERROR); 
        }finally{
            await queryRunner.release();
        }        
    } 

    async updateAuthor(id, authorData, user): Promise<void> {
        const author = await this.findOne(id)

        if ( !author || (author as any).length === 0 ) {
            Logger.error(`failed to update author ,userId: ${user.sub}, error: chapter not found`, { data:authorData } );
            const errorMessage =  await this.i18n.translate('message.GENERAL.ERROR.NOT_FOUND', { lang: await userLang(null) })
            const error = [{ "author" : errorMessage}]
            throw new HttpException(await this.response.response(errorMessage, null, error), HttpStatus.NOT_FOUND); 
        }
        const authorTranslate = {
            author_name: authorData.name,
            author_intro: authorData.about
        }
        try{
            await this.authorTranslateEntityRepository.update(
                { author_label: (author as any).label }, authorTranslate
            )
        }catch(err){
            Logger.error(`failed to update author ,userId: ${user.sub}, error:${err}`, { data:authorData });
            const errorMessage =  await this.i18n.translate('message.GENERAL.ERROR.UNPROCESSED_UPDATE', { lang: await userLang(null) })
            const error = [{ "author" : errorMessage}]
            throw new HttpException(await this.response.response(errorMessage, null, error), HttpStatus.INTERNAL_SERVER_ERROR); 
        }
    }

    async getAuthorLabelSequence() : Promise<any>{
        const data = await this.authorRepository
        .createQueryBuilder("author")
        .where("author.author_label like :pattern", { pattern:`%A_%` })
        .select([
            'author._id as id', 
            'author.author_label as author_label', 
            'author._created_at as created_at'
        ])
        .orderBy('author._created_at', 'DESC')
        .getRawOne();
        
        const last_label = data.author_label.split('_')[1];
        const number = Number(last_label) + 1 ;
        let result = "";
        for(let i = 5 - number.toString().length; i > 0; i--) {
          result += "0"
        }
        return 'A_' + (result + number);
    
    }
}
