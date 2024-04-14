import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import * as moment from 'moment'
import { userLang } from '../../helpers/app.helpers';
import { CategoriesEntity, CategoriesTranslateEntity, UserInterestEntity,CategoriesRelationshipEntity } from './entities';
import { Response } from '../../helpers/response';
import { Repository, getConnection, Brackets, getManager } from 'typeorm';
import { CategoryDto, queryDto, SwitchCategoryStatusDto } from './dto';
import { UsersService  } from '../users/users.service';
import { Logger } from '../../helpers/logger';
import { UserFreebieBooksEntity, UserFavBooksEntity, BooksCategoriesEntity, BookEntity } from '../books/entities';
import { UserEntity} from '../users/entities';
import { AssetsService } from '../assets/assets.service';
import { new_language_code, sort_by } from '../../helpers/util'

@Injectable()
export class CategoryService {
    constructor(
        private readonly response: Response,
        private readonly usersService: UsersService,
        private readonly assetService : AssetsService,
        private readonly i18n: I18nService,

        @InjectRepository(CategoriesEntity)
        private categoryRepository: Repository<CategoriesEntity>,

        @InjectRepository(CategoriesTranslateEntity)
        private categoryTranslateRepository: Repository<CategoriesTranslateEntity>,

        @InjectRepository(UserFreebieBooksEntity)
        private userFreebieBooksEntityRepository: Repository<UserFreebieBooksEntity>,

        @InjectRepository(UserFavBooksEntity)
        private userFavBooksRepository: Repository<UserFavBooksEntity>,

        @InjectRepository(UserEntity)
        private userRepository: Repository<UserEntity>,

        @InjectRepository(BooksCategoriesEntity)
        private bookCategoriesRepository: Repository<BooksCategoriesEntity>,

        @InjectRepository(CategoriesRelationshipEntity)
        private categoryRelationshipRepository: Repository<CategoriesRelationshipEntity>,
      ) {}

      async findAll(query: queryDto, user): Promise<Object> {

        const skippedItems:number = (query.page - 1) * query.size;

        let category = this.categoryRepository
        .createQueryBuilder('categories')
        .innerJoin( CategoriesTranslateEntity, 'categoryTranslate', 'categoryTranslate.category_label = categories.category_label')
        .select([
            'categories._id as id',
            'categories.category_label as label',
            `categories.thumbnail as thumbnail`,
            'categories.is_active as is_active',
            'categories._created_at as created_at',
            `json_agg(json_build_object('language', categoryTranslate.language, 'name', categoryTranslate.name)) AS names `
            ])
        .where("categoryTranslate.name like '%' || :name || '%'", { name: query.name })

        if(query.active_only) {
            category = category.andWhere("categories.is_active = :status", {status : true})
        }

        if (user) {
            const userData = await this.usersService.findOne(user.sub, null)
            category = category
                .leftJoin(UserInterestEntity,
                    'userInterest',
                    `categories.category_label = userInterest.category_label AND userInterest.user_label = :label`, { label: (userData as any).label }
                    )
                .orderBy('userInterest.user_label', 'ASC')
                .groupBy('userInterest.user_label')

            if (query.user_interest) {
                category = category
                .where("userInterest.category_label IS NOT NULL")
            }
        }



        if(query.search) {
            category = category
            .andWhere(new Brackets(qb => {
                qb.where("lower(categories.category_label) like '%' || :searchCode || '%'", { searchCode: query.search.toLowerCase() })
            }))
        }

        const total = await category.getCount();

        category = category.orderBy('categories._created_at', query.sort === sort_by.ASC ? sort_by.ASC : sort_by.DESC)
        .offset(skippedItems)

        category = category.addGroupBy('categories._id, categories.category_label, categories._created_at, categories.thumbnail, categories.is_active')
        .offset(skippedItems)

        let categories
        if (query.size) {
            categories = await category.limit(query.size).getRawMany();
        } else {
            categories = await category.getRawMany();
        }


        const data = categories.map( async(el) =>{
            el.thumbnail = el.thumbnail === null ? el.thumbnail : `${process.env.ASSEST_BASE_URL}${el.thumbnail}`
            return el;
        })

        return {
            page: query.page,
            size: query.size,
            total: total,
            categories: await Promise.all(data)
        };
      }

      async getCategoryByLabel(label) {
        const category = await this.categoryRepository
            .createQueryBuilder('category')
            .select(['category_label'])
            .where('category_label = :label', { label })
            .getRawOne()
        return category
      }

      // eslint-disable-next-line @typescript-eslint/ban-types
      async getCategory(id, label)  : Promise<Object>{
        let category = await this.categoryRepository
            .createQueryBuilder('category')
            .leftJoin( CategoriesTranslateEntity, 'categoryTranslate', 'categoryTranslate.category_label = category.category_label')
            .select([
                'category._id as id',
                'category.category_label as category_label',
                'category.thumbnail as thumbnail',
                'category.is_active as is_active',
                'category._created_at as created_at',
                `json_agg(json_build_object('language', categoryTranslate.language, 'name', categoryTranslate.name)) AS names `
            ])
            .groupBy(`
                category._id, 
                category.category_label, 
                category.thumbnail, 
                category.is_active, 
                category._created_at
            `)

        if(id) {
            category = category.where('category._id = :id', { id })
        }

        if(label) {
            category = category.where('category.category_label = :label', { label })
        }

        const data = await category.getRawOne();

        data.thumbnail = data && data.thumbnail === null ? data.thumbnail : `${process.env.ASSEST_BASE_URL}${data.thumbnail}`;

        return data;
      }

      // eslint-disable-next-line @typescript-eslint/ban-types
      async createCategory(request : CategoryDto, user : any) : Promise<Object> {
        //   return user;
          const query = getConnection().createQueryRunner();
          await query.connect();

          const category: CategoriesEntity = new CategoriesEntity(
              null,
              null,
              request.label,
              request.thumbnail,
              '',
              user.id,
              user.id,
              [{"level": "read", "public": true}],
              request.is_active
              );

          const english_name: CategoriesTranslateEntity = new CategoriesTranslateEntity(
              null,
              null,
              request.label,
              new_language_code.ENGLISH,
              '',
              user.id,
              request.english_name,
              user.id
          )

          const cantonese_name: CategoriesTranslateEntity = new CategoriesTranslateEntity(
              null,
              null,
              request.label,
              new_language_code.CANTONESE,
              '',
              user.id,
              request.cantonese_name,
              user.id
          )


          await query.startTransaction();

          try {
             const createCategory = await query.manager.save(category);
             const createEnglishName = await query.manager.save(english_name);
             const createCantoneseName = await query.manager.save(cantonese_name);


             await query.commitTransaction();

             return {
                 category : createCategory,
                 english_name : createEnglishName,
                 cantonese_name : createCantoneseName
             };

          } catch (err) {
              await query.rollbackTransaction();
              const message =  await this.i18n.translate('message.GENERAL.ERROR.UNPROCESSED_CREATE', { lang: await userLang(user) });
              const error = [{ "CreateCategory" : message }];
              Logger.error(`Failed create category`, {error: err, user : user});
              throw new HttpException(await this.response.response( message, null, error), HttpStatus.INTERNAL_SERVER_ERROR)
          } finally {
            await query.release();
        }
      }

      // eslint-disable-next-line @typescript-eslint/ban-types
      async updateCategory(id : string, request : CategoryDto, user : any) : Promise<Object>{
          const category = await this.categoryRepository
          .createQueryBuilder('categories')
          .select(['categories._id as id, categories.is_active as is_active','categories.category_label as label'])
          .where('categories._id = :id', {id})
          .getRawOne();

          if(!category){
            Logger.error(`Failed to switch category status with id ${id}, data not found`);
            throw new HttpException(await this.response.response(
                await this.i18n.translate('message.GENERAL.ERROR.NOT_FOUND', { lang: await userLang(user) }),
                null, null), HttpStatus.INTERNAL_SERVER_ERROR
            )
          }

        const query = getConnection().createQueryRunner();
        await query.connect();
        await query.startTransaction();

          try {
              await this.categoryRepository.update({_id : id},
                {
                    category_label : request.label,
                    thumbnail : request.thumbnail,
                    is_active : request.is_active,
                    _updated_at : moment().format('YYYY-MM-DD HH:mm:ss')
                })

              await this.categoryTranslateRepository.update({category_label : category.label, language : new_language_code.ENGLISH},
                {
                    category_label : request.label,
                    name : request.english_name,
                    _updated_at : moment().format('YYYY-MM-DD HH:mm:ss')
                })

              await this.categoryTranslateRepository.update({category_label : category.label, language : new_language_code.CANTONESE},
                {
                    category_label : request.label,
                    name : request.cantonese_name,
                    _updated_at : moment().format('YYYY-MM-DD HH:mm:ss')
                })

             await query.commitTransaction();

             return await this.getCategory(id, null);

          } catch (err) {
            await query.rollbackTransaction();
            Logger.error(`Failed update category`, { user: user, error : err });
            const message = await this.i18n.translate('message.GENERAL.ERROR.SERVER_ERROR', { lang: await userLang(user) })
            const error = [{ "subscription" : message }];
            throw new HttpException(await this.response.response(message, null, error), HttpStatus.BAD_REQUEST);
        } finally {
            await query.release();
        }
      }

      // eslint-disable-next-line @typescript-eslint/ban-types
      async switchStatusCategory(id : string, request : SwitchCategoryStatusDto, user : any) : Promise<Object>{
          const category = await this.categoryRepository
          .createQueryBuilder('categories')
          .select(['categories._id as id, categories.is_active as is_active','categories.category_label as label'])
          .where('categories._id = :id', {id})
          .getRawOne();

          if(!category){
            Logger.error(`Failed to switch category status with id ${id}, data not found`);
            throw new HttpException(await this.response.response(
                await this.i18n.translate('message.GENERAL.ERROR.NOT_FOUND', { lang: await userLang(user) }),
                null, null), HttpStatus.INTERNAL_SERVER_ERROR
            )
          }

          try {
              await this.categoryRepository.update({_id : id}, {is_active : request.status, _updated_at : moment().format('YYYY-MM-DD HH:mm:ss')})
              return {
                id : category.id,
                label : category.label,
                is_active : request.status
              };
          } catch (err) {
            Logger.error(`Failed switch category status`, { user: user, error : err });
            const message = await this.i18n.translate('message.GENERAL.ERROR.SERVER_ERROR', { lang: await userLang(user) })
            const error = [{ "subscription" : message }];
            throw new HttpException(await this.response.response(message, null, error), HttpStatus.BAD_REQUEST);
          }
      }


      async addUserFav(user, data): Promise<void> {

        const queryRunner = getConnection().createQueryRunner();
        const queryBuilder = getConnection().createQueryBuilder(queryRunner);

        await queryRunner.connect();
        await queryRunner.startTransaction();
        const userData = await this.usersService.findOne(user.sub, null);
        const catLabel = []
        try {
            const saveCategoryFav = data.label.map(async(el)=>{

                catLabel.push(el)
                const categoryExist = await this.getCategoryByLabel(el)

                if (!categoryExist) {
                    const error = `category label ${el} is not found`
                    Logger.error(`failed to create user interest ,userId: ${user.sub}, error:${error}`);
                    throw new HttpException(await this.response.response(
                        await this.i18n.translate('message.GENERAL.ERROR.NOT_FOUND', { lang: await userLang(user) })
                        ,null, null), HttpStatus.NOT_FOUND
                    );
                } else {
                    const userFav = {
                        user_label: userData['label'],
                        category_label: el,
                        _database_id : '',
                        _owner_id: user.sub,
                        _created_by: user.sub
                    }
                    await queryBuilder.insert().into(UserInterestEntity)
                    .values(userFav).onConflict(`DO NOTHING`).execute();
                }
            })
            await Promise.all(saveCategoryFav);

            await queryRunner.manager.createQueryBuilder().delete().from(UserInterestEntity)
            .where('user_label = :userLabel', { userLabel: userData['label'] })
            .andWhere(new Brackets(qb => {
                qb.where("category_label NOT IN (:...categories)", { categories: catLabel })
            })).execute()

            await queryRunner.commitTransaction();

            await this.removeCurrentActiveFreebie(user)

            await this.processFreebie(user, data.label)

        } catch (err) {
            await queryRunner.rollbackTransaction();
            Logger.error(`failed to add user interest`, {userId: user.sub , category_label : catLabel, error: err});
            const errorMessage =  await this.i18n.translate('message.GENERAL.ERROR.UNPROCESSED_CREATE', { lang: await userLang(user) })
            throw new HttpException(await this.response.response(errorMessage, null, null), HttpStatus.INTERNAL_SERVER_ERROR);
        } finally {
            await queryRunner.release();
        }
      }


      // Migrate Cloud Function
      async removeCurrentActiveFreebie(user):Promise<void> {
        const user_label = user['label'];
        try {
            await this.userFreebieBooksEntityRepository
                            .createQueryBuilder('user_freebie_books')
                            .delete()
                            .where('user_freebie_books.user_label = :user_label', {user_label})
                            // .andWhere('user_freebie_books.free_assign_date > :today', {today: moment().format('YYYY-MM-DD')})
                            .execute();

            Logger.info(`Success to delete current active freebie from ${user_label}`);
        } catch (error) {
            Logger.error(`Failed to delete current active freebie, error: ${error}`)
            const errorMessage =  await this.i18n.translate('message.GENERAL.ERROR.UNPROCESSED_UPDATE', { lang: await userLang(user) })
            throw new HttpException(await this.response.response(errorMessage, null, null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
      }

      // eslint-disable-next-line @typescript-eslint/ban-types
      async processFreebie(user, user_interest):Promise<void> {
            let user_label = user['label'];

            const categories_related = await this.categoryRelationshipRepository
            .createQueryBuilder('category_relationship')
            .select(['*'])
            .where('category_relationship.category_label IN (:...user_interest)', {user_interest: user_interest})
            .getRawMany();

            categories_related.map(async(el) => {
                user_interest.push(el.related_category)
            })

            const fav_books = await this.userFavBooksRepository
            .createQueryBuilder('user_fav_books')
            .select(['user_fav_books.book_label as book_label'])
            .where('user_fav_books.user_label = :user_label', {user_label})
            .getRawMany();

            const fav_books_id = [];
            fav_books.map(async(el) => {
                fav_books_id.push(el.book_label)
            })

            const books_categories = await this.bookCategoriesRepository
            .createQueryBuilder('books_categories')
            .select(['*'])
            .innerJoin( BookEntity, 'books', 'books_categories.book_label = books.book_label')
            .where('books_categories.category_label IN (:...user_interest)', {user_interest: user_interest})
            .andWhere('books_categories.is_removed = :is_removed', {is_removed: false})


            if(fav_books_id.length) {
                books_categories.andWhere('books_categories.book_label NOT IN (:...fav_books_id)', {fav_books_id: fav_books_id})
            }

            const data = await books_categories.orderBy('RANDOM()').limit(1).getRawMany();

            const book_label = [];
            data.map(async(el) => {
                if(!book_label.includes(el.book_label)) {
                    book_label.push(el.book_label)
                }
            })

            const now = moment().format('YYYY-MM-DD HH:mm:ss')
            const freebie_data = [];
            book_label.map(async (label, index) => {
                freebie_data.push({
                    _database_id : '',
                    _owner_id : user.sub,
                    _created_at: now,
                    _updated_at: now,
                    book_label: label,
                    user_label: user_label,
                    free_assign_date: moment(now),
                    is_assigning: false,
                    is_complete: false,
                })
            })

            await this.bulkInsertFreebie(user, freebie_data);
      }

      async bulkInsertFreebie(user, freebie_data): Promise<void> {
        const queryRunner = getConnection().createQueryRunner();
        const queryBuilder = getConnection().createQueryBuilder(queryRunner);

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try{
            await queryBuilder.insert().into(UserFreebieBooksEntity)
            .values(freebie_data).onConflict(`DO NOTHING`).execute();
            await queryRunner.commitTransaction();
            Logger.info(`Success insert freebie for ${user['label']}`);
        } catch (err) {
            await queryRunner.rollbackTransaction();
            const message =  await this.i18n.translate('message.GENERAL.ERROR.UNPROCESSED_CREATE', { lang: await userLang(user) });
            const error = [{ "InsertFreebie" : message }];
            Logger.error(`Failed insert freebie `);
            Logger.error(err);
            throw new HttpException(await this.response.response( message, null, error), HttpStatus.INTERNAL_SERVER_ERROR)
        }

        finally {
            // release query runner
            await queryRunner.release();
        }
    }

    async getTrancationIdFromSubscriptionResult(data : any) : Promise<string> {
        return data.payment_intent_id ?? data.invoice_id
    }
     // eslint-disable-next-line @typescript-eslint/ban-types
    async getCurrentActiveFreebie(user):Promise<Object> {
       const user_label = user['label'];

       const data = await this.userFreebieBooksEntityRepository
       .createQueryBuilder('user_freebie_books')
       .select(['*'])
       .where('user_freebie_books.user_label = :user_label', {user_label})
       .getRawMany();
       return data;
    }

    // async removeExpiredFreebie() : Promise<any> {

    //     const today = moment().format('YYYY-MM-DD HH:mm:ss');
    //     const weeks_ago = moment().subtract(7, "day").format('YYYY-MM-DD');
    //     try {
    //         await this.userFreebieBooksEntityRepository
    //                         .createQueryBuilder('user_freebie_books')
    //                         .delete()
    //                         .where('user_freebie_books.free_assign_date <= :weeks_ago', {weeks_ago: weeks_ago})
    //                         .execute();

    //         Logger.info(`Success remove freebies that has expired 7 days ago at ${today}`);
    //     } catch (error) {
    //             Logger.error(`Failed to remove freebies that has expired 7 days ago at, error: ${error}`)
    //             const errorMessage =  await this.i18n.translate('message.GENERAL.ERROR.UNPROCESSED_UPDATE', { lang: await userLang(null) })
    //             throw new HttpException(await this.response.response(errorMessage, null, null), HttpStatus.INTERNAL_SERVER_ERROR);
    //     }

    // }

    async insertFreebie():Promise<any> {
        const days_ago = moment().subtract(1, "day").format('YYYY-MM-DD');
        const removeFreebies = await this.userFreebieBooksEntityRepository
                            .createQueryBuilder('user_freebie_books')
                            .where('user_freebie_books.free_assign_date <= :days_ago', {days_ago: days_ago})
                            .delete()
                            .execute();

        if(removeFreebies || removeFreebies == null) {        
            let lastThirtyDays = moment().subtract(30, 'days').format('YYYY-MM-DD HH:mm:ss');
            let users = await this.userRepository
            .createQueryBuilder('users')
            .select([
                'users._id as sub',
                'users.user_label as label',
                `json_agg(user_interest.category_label) AS interest`
            ])

            .where(`users.last_login_at >= '${lastThirtyDays}'`)
            .andWhere('users.deleted_at IS NULL')
            .andWhere(`NOT EXISTS (SELECT FROM  ${process.env.SCHEMA}.user_freebie_books f WHERE f.user_label = users.user_label)`)
            .andWhere(`EXISTS (SELECT * FROM  ${process.env.SCHEMA}.user_interest i WHERE i.user_label = users.user_label)`)
            .limit(10000)
            .leftJoin(UserInterestEntity, 'user_interest', `users.user_label = user_interest.user_label` )
            .groupBy('users.user_label, users._id')
            .orderBy('users.user_label', 'ASC')
            .getRawMany();

            if(users.length) {
                console.log(users.length)
                users.map(async(user) => {
                    this.processFreebie(user, user.interest)
                })
            }
        } else {
            Logger.error(`Failed to update freebies that has expired yesterday`)
            const errorMessage =  await this.i18n.translate('message.GENERAL.ERROR.UNPROCESSED_UPDATE', { lang: await userLang(null) })
            throw new HttpException(await this.response.response(errorMessage, null, null), HttpStatus.INTERNAL_SERVER_ERROR);          
        }
    }
}
