import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository} from '@nestjs/typeorm';
import { Repository, getConnection } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { AwsModule } from '../../helpers/aws.helpers';
import { userLang } from '../../helpers/app.helpers';
import { Chapter, ChaptersList  } from './chapters.interface';
import { AudioEntity, ChaptersEntity , ChaptersTranslateEntity} from './entities';
import { BookEntity, BookTranslateEntity } from '../books/entities';
import { Response } from '../../helpers/response';
import { new_language_code } from '../../helpers/util';
import { Logger } from '../../helpers/logger';
import { UsersService  } from '../users/users.service';
import { AssetsEntity } from '../assets/entities';

@Injectable()
export class ChaptersService {
    static getChapter: any;
        constructor (
            private readonly response: Response,
            private readonly usersService: UsersService,
            private readonly i18n: I18nService,
            private readonly aws: AwsModule,

            @InjectRepository(ChaptersEntity)
            private chaptersRepository: Repository<ChaptersEntity>,

            @InjectRepository(AudioEntity)
            private audioRepository: Repository<AudioEntity>,

            @InjectRepository(AssetsEntity)
            private assetsRepository: Repository<AssetsEntity>,

            @InjectRepository(BookEntity)
            private bookRepository: Repository<BookEntity>,
        ) {}

        getChapter() {
            return this.chaptersRepository
            .createQueryBuilder('chapters')
            .leftJoin(AudioEntity, 'audio', 'audio.chapter_label = chapters.chapter_label')
            .leftJoin( ChaptersTranslateEntity, 'chapterTranslate', 'chapterTranslate.chapter_label = chapters.chapter_label')
            .select([ 
                'chapters._id as id', 'chapters.chapter_label as label', 
                'chapterTranslate.title as title', 'chapterTranslate.content as content', 
                'chapters.number as number', `json_agg(json_build_object('audio_path', audio.audio_path, 'language', audio.language)) AS audio`,
            ])
            .groupBy('chapters._id, chapterTranslate.title, chapters.number, chapters.chapter_label, chapterTranslate.content, chapters._created_at')
            .orderBy('chapters.number', "ASC");
        };

        async getBook(label) {
            return await this.bookRepository
            .createQueryBuilder('books')
            .innerJoin( BookTranslateEntity, 'bookTranslate', 'bookTranslate.book_label = books.book_label')
            .select([
                'books._id as id', 'title', 'subtitle', 'books.cover_image', 
                'author', 'books.deleted_by as deleted_by', 
                'books.book_label as label'
            ])
            .where('books.book_label = :label', { label })
            .getRawOne();
        };

        async lastChapterNumber(label) {
            return await this.chaptersRepository
            .createQueryBuilder('chapters')
            .where('chapters.book_label = :label', { label})
            .select([`MAX(chapters.number) as max`])
            .getRawOne();
        }

        // find all chapters
        async findAll(label, query, user):  Promise<ChaptersList | []> {
            const userData = await this.usersService.findOne(user.sub, null);
            const skippedItems = (query.page - 1) * query.size;
            let chapter = this.getChapter()
                .where('chapters.book_label = :label', { label })

            if(query.page && query.size) {
                chapter = chapter
                .offset(skippedItems)
                .limit(query.size)
            }
            const chapters = await chapter.getRawMany()
            
            chapters.map(async(chapter)=>{
                chapter.audio_mandarin = null
                chapter.audio_cantonese = null
                chapter.audio_display = null
                await Promise.all(chapter.audio.map((el)=>{
                    const audio = el.audio_path ? `${process.env.ASSEST_BASE_URL}${el.audio_path}` : null
                    if (el.language === new_language_code.MANDARIN) chapter.audio_mandarin = audio
                    if (el.language === new_language_code.CANTONESE) chapter.audio_cantonese = audio 

                    let audioDisplay = null;
                    if( userData['language'] === new_language_code.CANTONESE ) {
                        audioDisplay = chapter.audio_cantonese
                    } else if( userData['language'] === new_language_code.MANDARIN ) {
                        audioDisplay = chapter.audio_mandarin
                    }
                    chapter.audio_display = audioDisplay;

                })
                )
    
                delete chapter.audio
            })
            const bookInfo = await this.getBook(label);

            if(!bookInfo){
                return []
            }

            const lastChapter = await this.lastChapterNumber(label)

            const total = await chapter.getCount()
            
            return {
                page: query.page || 1,
                size: query.size || total,
                total,
                id: bookInfo.id,
                title: bookInfo.title,
                chapters: chapters,
                last_chapter: lastChapter ? lastChapter.max : 0
              };
    
            // return json fake data for temporary. will be placed with query
            // return chapterData.chapters
        };
        async findOne(id, user): Promise<Chapter | []> {
            const userData = await this.usersService.findOne(user.sub, null);
            const chapter = await this.getChapter() 
            .where('chapters._id = :id', { id })
            .getRawMany();
    
            if (chapter.length > 0) {
            
                chapter[0].audio_mandarin = null
                chapter[0].audio_cantonese = null

                await Promise.all(chapter[0].audio.map((el)=>{
                    const audio = el.audio_path ? `${process.env.ASSEST_BASE_URL}${el.audio_path}` : null
                    if (el.language === new_language_code.MANDARIN) chapter[0].audio_mandarin = audio
                    if (el.language === new_language_code.CANTONESE) chapter[0].audio_cantonese = audio 
                }));

                let audioDisplay = null;
                if( userData['language'] === new_language_code.CANTONESE ) {
                    audioDisplay = chapter[0].audio_cantonese
                } else if( userData['language'] === new_language_code.MANDARIN ) {
                    audioDisplay = chapter[0].audio_mandarin
                }

                chapter[0].audio_display = audioDisplay;

                delete chapter[0].audio
                return chapter[0]
            } else {
                return []
            }
        };

        async chapterNumber(chapterData, user, id) {

            let where = ''
            if (id) where = 'chapters._id != :id';
            
            const lastChapters = await this.lastChapterNumber(chapterData.book_label);
   
            const lastChapter = lastChapters && lastChapters.max ? lastChapters.max : 0;
            const chapterNumber = chapterData.number ? chapterData.number : lastChapter + 1;

            const getChapter = await this.getChapter() 
            .where(where, {id})
            .andWhere('chapters.book_label = :label', { label: chapterData.book_label })
            .andWhere('chapters.number = :number', { number: chapterNumber })
            .getRawOne();

            if( getChapter ) {
                const error = [{ "chapter" : `Chapter number already exists` }];
                Logger.error(`failed to update chapter ,userId: ${user.sub}, error:${error}`);
                throw new HttpException(await this.response.response(  
                    await this.i18n.translate('message.CHAPTERS.CHAPTER_EXIST', { lang: await userLang(user) }), 
                    null, null), HttpStatus.INTERNAL_SERVER_ERROR
                )
            }     
            return chapterNumber;  
        }
        
        async createChapter(chapterData, user){

            const queryRunner = getConnection().createQueryRunner();
            // establish real database connection using our new query runner
            await queryRunner.connect();
    
            // open new transaction
            await queryRunner.startTransaction();

            const chapterNumber = await this.chapterNumber(chapterData, user, null)
            
            try {
                const chapter = new ChaptersEntity()
                chapter.book_label = chapterData.book_label
                chapter.number = chapterNumber
                chapter._database_id = ''
                chapter._owner_id = user.sub
                chapter._created_by = user.sub

                const { chapter_label } = await queryRunner.manager.save(chapter);

                const chapterTranslate = new ChaptersTranslateEntity()
                chapterTranslate.title = chapterData.title
                chapterTranslate.content = chapterData.content
                chapterTranslate.language = new_language_code.CANTONESE
                chapterTranslate.chapter_label = chapter_label
                chapterTranslate._database_id = ''
                chapterTranslate._owner_id = user.sub
                chapterTranslate._created_by = user.sub

                await queryRunner.manager.save(chapterTranslate);

                await queryRunner.commitTransaction();

            } catch (err) {
                await queryRunner.rollbackTransaction();
                Logger.error(`failed to create chapter ,userId: ${user.sub}, error:${err}`);
                throw new HttpException(await this.response.response(  
                    await this.i18n.translate('message.GENERAL.ERROR.UNPROCESSED_CREATE', { lang: await userLang(user) }), 
                    null, null), HttpStatus.INTERNAL_SERVER_ERROR
                )
            }
            finally {
                // release query runner
                await queryRunner.release();
            }
        }

        async audio(chapterLabel, language) {
  
            return await this.audioRepository
            .createQueryBuilder('audio')
            .select(['audio._id as id'])
            .where('audio.chapter_label = :chapterLabel', { chapterLabel })
            .andWhere('audio.language = :language', { language })
            .getRawOne()
        }

       async updateChapter( id, chapterData, user){
       
            const chapter = await this.chaptersRepository
            .createQueryBuilder('chapters')
            .leftJoin( ChaptersTranslateEntity, 'chapterTranslate', 'chapterTranslate.chapter_label = chapters.chapter_label')
            .select([
                'chapters.book_label as book_label', 
                'chapters.chapter_label as label', 
                'chapterTranslate.language as language'])
            .where('chapters._id = :id', {id})
            .getRawOne();

            if ((chapter as any).length === 0 ) {
                Logger.error(`failed to update chapter ,userId: ${user.sub}, error: chapter not found with id ${id}`);
                throw new HttpException(await this.response.response(  
                    await this.i18n.translate('message.GENERAL.ERROR.NOT_FOUND', { lang: await userLang(user) }), 
                    null, null), HttpStatus.INTERNAL_SERVER_ERROR
                )
            }
       
            chapterData.book_label = (chapter as any).book_label;
         
            const chapterNumber = await this.chapterNumber(chapterData, user, id)

            const chapterBody = {
                number: chapterNumber,
                _updated_by: user.sub
            }

            const chapterTranslate = {
                title : chapterData.title,
                content: chapterData.content,
                _updated_by: user.sub
            }

            let dataPolly = {
                book_label: (chapter as any).book_label,
                number: chapterNumber,
                title: chapterData.title,
                content: chapterData.content
            }
            let full_content = await this.formatAudioText(dataPolly);
            
            const queryRunner = getConnection().createQueryRunner();
            // establish real database connection using our new query runner
            await queryRunner.connect();

            await queryRunner.startTransaction();

            const label = (chapter as any).label;
            await this.fillAudioPolly(label, full_content);
            try{
                await queryRunner.manager.update(ChaptersEntity, { chapter_label: label }, chapterBody );
                await queryRunner.manager.update(ChaptersTranslateEntity, { chapter_label: label }, chapterTranslate );
                await queryRunner.commitTransaction();
            } catch (err) {
                await queryRunner.rollbackTransaction();
                Logger.error(`failed to update chapter ,userId: ${user.sub}, error:${err}`);
                throw new HttpException(await this.response.response(  
                    await this.i18n.translate('message.GENERAL.ERROR.UNPROCESSED_UPDATE', { lang: await userLang(user) }), 
                    null, null), HttpStatus.INTERNAL_SERVER_ERROR
                )
            } finally {
                await queryRunner.release();
            }
        }

        async formatAudioText(content_shape) {
            const related_book = await this.getBook(content_shape.book_label);

            let split_author = related_book.author.replace(/\|/g, ', ');
            let book_authors = `${split_author}`;

            let full_content = `閱點 ${content_shape.number}. ${content_shape.title}. ${content_shape.content.replace(/\n/g, '')}`;
            
            if(content_shape.number == 1){
                full_content = `${related_book.title}, ${related_book.subtitle}. 作者: ${book_authors}. ` + full_content;
            }

            return full_content;
        }

        async loopChapterAudio() {
            try {
                const non_exist_audio = await this.chaptersRepository
                    .createQueryBuilder('chapter')
                    .leftJoin( ChaptersTranslateEntity, 'chapterTranslate', 'chapterTranslate.chapter_label = chapter.chapter_label')
                    .select([
                        'chapter.book_label as book_label',
                        'chapter.chapter_label as label',
                        'chapter.number as number',
                        'chapterTranslate.title as title',
                        'chapterTranslate.content as content',
                        'chapterTranslate.language as language'
                    ])
                    .where(`NOT EXISTS (SELECT * FROM ${process.env.SCHEMA}.audio a WHERE a.chapter_label = chapter.chapter_label AND a.language = 'zh-TW')`)
                    .orWhere(`NOT EXISTS (SELECT * FROM ${process.env.SCHEMA}.audio a WHERE a.chapter_label = chapter.chapter_label AND a.language = 'zh-HK')`)
                    .orderBy('RANDOM()')
                    .limit(1)
                    .getRawMany();

                const non_exist_audio_total = await this.chaptersRepository
                    .createQueryBuilder('chapter')
                    .leftJoin( ChaptersTranslateEntity, 'chapterTranslate', 'chapterTranslate.chapter_label = chapter.chapter_label')
                    .select([
                        'chapter.chapter_label as label',
                    ])
                    .where(`NOT EXISTS (SELECT * FROM ${process.env.SCHEMA}.audio a WHERE a.chapter_label = chapter.chapter_label AND a.language = 'zh-TW')`)
                    .orWhere(`NOT EXISTS (SELECT * FROM ${process.env.SCHEMA}.audio a WHERE a.chapter_label = chapter.chapter_label AND a.language = 'zh-HK')`)
                    .getRawMany();

                let content_shape = non_exist_audio[0];
                let full_content = await this.formatAudioText(content_shape);

                await this.fillAudioPolly(content_shape.label, full_content);
                console.log('Success upload.');
            } catch(error) {
                console.log('Error upload.');
            }
        }

        async fillAudioPolly(label, content, user = {sub:''}) {
            let assets_cantonese: any;
            let assets_mandarin: any;
            const tts_folder = /ttsfolder/;
            const new_date = `${Math.random().toString(36)}`;
            Object.freeze(new_date);
            const new_audio_name_cantonese = `ttsfolder/${label}_${new_date}_CAN.mp3`;
            const new_audio_name_mandarin = `ttsfolder/${label}_${new_date}_MAN.mp3`;

            let audio_cantonese = { audio: '', language: new_language_code.CANTONESE };
            let audio_mandarin = { audio: '', language: new_language_code.MANDARIN };

            // current cantonese
            const current_cantonese = await this.audioRepository
                .createQueryBuilder('audio')
                .select([
                    'audio.audio_path as path'
                ])
                .where('audio.chapter_label = :label AND audio.language = :language', 
                    {
                        label,
                        language : new_language_code.CANTONESE
                    })
                .getRawOne();

            // current mandarin
            const current_mandarin = await this.audioRepository
                .createQueryBuilder('audio')
                .select([
                    'audio.audio_path as path'
                ])
                .where('audio.chapter_label = :label AND audio.language = :language', 
                    {
                        label,
                        language : new_language_code.MANDARIN
                    })
                .getRawOne();

            // if not exist create new 
            if (!current_cantonese && !current_mandarin){
                await this.aws.convertTextToSpeech(new_audio_name_mandarin, content, new_language_code.MANDARIN);
                await this.aws.convertTextToSpeech(new_audio_name_cantonese, content, new_language_code.CANTONESE);
                // add 2 handling
                // create assests;
                assets_mandarin = new AssetsEntity();
                    assets_mandarin.id = new_audio_name_mandarin;
                    assets_mandarin.content_type = 'audio/mp3';
                    assets_mandarin.size = 10;
                await assets_mandarin.save();

                assets_cantonese = new AssetsEntity();
                    assets_cantonese.id = new_audio_name_cantonese;
                    assets_cantonese.content_type = 'audio/mp3';
                    assets_cantonese.size = 10;
                await assets_cantonese.save();

                // create audio
                audio_cantonese.audio = assets_cantonese.id;
                audio_mandarin.audio = assets_mandarin.id;
                await this.addAudioByLabel(audio_cantonese, label, user);
                await this.addAudioByLabel(audio_mandarin, label, user);
            }

            if(!current_cantonese && current_mandarin){
                if(tts_folder.test(current_mandarin.path)){
                    await this.aws.removeAudio(current_mandarin.path);
                    await this.aws.convertTextToSpeech(current_mandarin.path, content, new_language_code.MANDARIN);
                    await this.aws.convertTextToSpeech(new_audio_name_cantonese, content, new_language_code.CANTONESE);
                    // create assests;
                    assets_cantonese = new AssetsEntity();
                        assets_cantonese.id = new_audio_name_cantonese;
                        assets_cantonese.content_type = 'audio/mp3';
                        assets_cantonese.size = 10;
                    await assets_cantonese.save();
                    audio_cantonese.audio = assets_cantonese.id;
                    await this.addAudioByLabel(audio_cantonese, label, user);
                } else {                
                    await this.aws.convertTextToSpeech(new_audio_name_cantonese, content, new_language_code.CANTONESE);
                    // create assests;
                    assets_cantonese = new AssetsEntity();
                        assets_cantonese.id = new_audio_name_cantonese;
                        assets_cantonese.content_type = 'audio/mp3';
                        assets_cantonese.size = 10;
                    await assets_cantonese.save();
                    audio_cantonese.audio = assets_cantonese.id;
                    await this.addAudioByLabel(audio_cantonese, label, user);
                }
            }

            if(!current_mandarin && current_cantonese) {
                if(tts_folder.test(current_cantonese.path)){
                    await this.aws.removeAudio(current_cantonese.path);
                    await this.aws.convertTextToSpeech(current_cantonese.path, content, new_language_code.CANTONESE);
                    await this.aws.convertTextToSpeech(new_audio_name_mandarin, content, new_language_code.MANDARIN);
                    // create assests;
                    assets_mandarin = new AssetsEntity();
                        assets_mandarin.id = new_audio_name_mandarin;
                        assets_mandarin.content_type = 'audio/mp3';
                        assets_mandarin.size = 10;
                    await assets_mandarin.save();
                    audio_mandarin.audio = assets_mandarin.id;
                    await this.addAudioByLabel(audio_mandarin, label, user);
                } else {                
                    await this.aws.convertTextToSpeech(new_audio_name_mandarin, content, new_language_code.MANDARIN);
                    // create assests;
                    assets_mandarin = new AssetsEntity();
                        assets_mandarin.id = new_audio_name_mandarin;
                        assets_mandarin.content_type = 'audio/mp3';
                        assets_mandarin.size = 10;
                    await assets_mandarin.save();
                    audio_mandarin.audio = assets_mandarin.id;
                    await this.addAudioByLabel(audio_mandarin, label, user);
                }
            }

            if(current_mandarin && current_cantonese){
                if (tts_folder.test(current_mandarin.path)) {
                    await this.aws.removeAudio(current_mandarin.path);
                    await this.aws.convertTextToSpeech(current_mandarin.path, content, new_language_code.MANDARIN);
                }

                if (tts_folder.test(current_cantonese.path)) {
                    await this.aws.removeAudio(current_cantonese.path);
                    await this.aws.convertTextToSpeech(current_cantonese.path, content, new_language_code.CANTONESE);
                }
            }
        }

        async addAudioByLabel(audioData, label, user) {

            const audio = new AudioEntity
            audio.audio_path = audioData.audio
            audio._updated_by = user.sub
            audio.language = audioData.language
            audio._database_id = ''
            audio._owner_id = user.sub
            audio.chapter_label = label

            try{
                const audioExist = await this.audio(label, audioData.language);
                if (audioExist){
                    await this.audioRepository.update(
                        { chapter_label: label, language: audioData.language } ,
                        audio
                      );
                } else {
                    await audio.save();
                }
            } catch (err) {
                Logger.error(`failed to update/add chapter audio ,userId: ${user.sub}, error:${err}`);
                throw new HttpException(await this.response.response(  
                    await this.i18n.translate('message.GENERAL.ERROR.UNPROCESSED_CREATE', { lang: await userLang(user) }), 
                    null, null), HttpStatus.INTERNAL_SERVER_ERROR
                )
            }
        }

        async addAudio(audioData, user){
        
            const chapter = await this.findOne(audioData.id, user)

            if ((chapter as any).length === 0 ) {
                Logger.error(`failed to update chapter ,userId: ${user.sub}, error: chapter not found`);
                throw new HttpException(await this.response.response(  
                    await this.i18n.translate('message.GENERAL.ERROR.NOT_FOUND', { lang: await userLang(user) }), 
                    null, null), HttpStatus.INTERNAL_SERVER_ERROR
                )
            }
            const label = (chapter as any).label

            const audio = new AudioEntity
            audio.audio_path = audioData.audio
            audio._updated_by = user.sub
            audio.language = audioData.language
            audio._database_id = ''
            audio._owner_id = user.sub
            audio.chapter_label = label

            try{
                const audioExist = await this.audio(label, audioData.language);
                if (audioExist){
                    await this.audioRepository.update(
                        { chapter_label: label, language: audioData.language } ,
                        audio
                      );
                } else {
                    await audio.save();
                }
            } catch (err) {
                Logger.error(`failed to update/add chapter audio ,userId: ${user.sub}, error:${err}`);
                throw new HttpException(await this.response.response(  
                    await this.i18n.translate('message.GENERAL.ERROR.UNPROCESSED_CREATE', { lang: await userLang(user) }), 
                    null, null), HttpStatus.INTERNAL_SERVER_ERROR
                )
            }
        }

        async deleteAudio ( id, audioBody, user ) {

            const chapter = await this.findOne(id, user)
    
            const label = (chapter as any).label

            if ((chapter as any).length === 0 ) {
                Logger.error(`failed to get chapter ,userId: ${user.sub}, error: chapter not found`);
                throw new HttpException(await this.response.response(  
                    await this.i18n.translate('message.GENERAL.ERROR.NOT_FOUND', { lang: await userLang(user) }), 
                    null, null), HttpStatus.INTERNAL_SERVER_ERROR
                )
            }

            const audioExist = await this.audio(label, audioBody.language);

            try{
                if (audioExist){
                    await getConnection()
                    .createQueryBuilder()
                    .delete()
                    .from(AudioEntity)
                    .where('chapter_label = :label', { label })
                    .andWhere('language = :language', { language: audioBody.language  })
                    .execute();
                } else {
                    throw new Error('audio is not exist')
                }
            } catch (err) {
                Logger.error(`failed to delete audio ,userId: ${user.sub}, error:${err}`);
                throw new HttpException(await this.response.response(  
                    await this.i18n.translate('message.GENERAL.ERROR.UNPROCESSED_DELETE', { lang: await userLang(user) }), 
                    null, null), HttpStatus.INTERNAL_SERVER_ERROR
                )
            }
        } 
        async deleteChapter (id, user) {

            const chapter = await this.findOne(id, user);

            if ((chapter as any).length === 0 ) {
                Logger.error(`failed to get chapter ,userId: ${user.sub}, error: chapter not found`);
                throw new HttpException(await this.response.response(  
                    await this.i18n.translate('message.GENERAL.ERROR.NOT_FOUND', { lang: await userLang(user) }), 
                    null, null), HttpStatus.INTERNAL_SERVER_ERROR
                )
            }
            const label = (chapter as any).label

            const queryRunner = getConnection().createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();

            try{
                await queryRunner.manager.createQueryBuilder().delete().from(ChaptersEntity)
                .where('chapter_label = :label', { label }).execute();
                await queryRunner.manager.createQueryBuilder().delete().from(ChaptersTranslateEntity)
                .where('chapter_label = :label', { label }).execute();
                await queryRunner.manager.createQueryBuilder().delete().from(AudioEntity)
                .where('chapter_label = :label', { label }).execute();

                await queryRunner.commitTransaction();
            }
            catch (err) {
                await queryRunner.rollbackTransaction();
                Logger.error(`failed to delete chapter ,userId: ${user.sub}, error:${err}`);
                throw new HttpException(await this.response.response(  
                    await this.i18n.translate('message.GENERAL.ERROR.UNPROCESSED_DELETE', { lang: await userLang(user) }), 
                    null, null), HttpStatus.INTERNAL_SERVER_ERROR
                )
            } finally {
                await queryRunner.release();
            }
            
        }  

}
