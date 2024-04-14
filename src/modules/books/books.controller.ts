import {Get, Post, Put, Delete, Query, Param, Controller, Body } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

import { userLang } from '../../helpers/app.helpers';
import { BooksService } from './books.service';
import { User } from '../auth/auth.decorator';
import { Response } from '../../helpers/response';
import { Logger } from '../../helpers/logger';
import {    
    CreateBookDto, 
    queryDto, 
    statusDto, 
    labelDto, 
    myDeskQueryDto, 
    myProgressDTo, 
    myFavBookDto } 
from './dto';

import {
    ApiResponse, ApiBody,
    ApiOperation, ApiTags, ApiParam,
    ApiBearerAuth, ApiQuery
  } from '@nestjs/swagger';
  
@ApiTags('books')
@Controller('books')
export class BooksController {

    constructor(
        private readonly booksService: BooksService,
        private readonly response: Response,
        private readonly i18n: I18nService,
    ){}

    @ApiOperation({ summary: 'Get My Desk' })
    @ApiBearerAuth('access-token')
    @Get('/my-desk')

    @ApiQuery(({ name: 'page', allowEmptyValue: true, required: false }))
    @ApiQuery(({ name: 'size', allowEmptyValue: true, required: false }))
    @ApiQuery(({ name: 'sort', allowEmptyValue: true, required: false }))
    @ApiQuery(({ name: 'is_completed', allowEmptyValue: true, required: false }))
    @ApiQuery(({ name: 'status', allowEmptyValue: true, required: false }))
    // eslint-disable-next-line @typescript-eslint/ban-types
    async getMyDesk(@User() user, @Query() query: myDeskQueryDto): Promise<Object> {
   
        query.page = Number(query.page) || 1
        query.size = Number(query.size) || 0

        const data = await this.booksService.getMyDesk(query, user);

        Logger.info(`success get my desk data: ${user.sub}, data ${JSON.stringify(data)}`);
        return this.response.response(
                await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_GET', 
                { lang: await userLang(user) }), 
                data, null
            );
    }

    @ApiOperation({ summary: 'Surprise Me' })
    @ApiBearerAuth('access-token')
    @Get('/surprise-me')
    // eslint-disable-next-line @typescript-eslint/ban-types
    async surpriseMe(@User() user): Promise<Object> {
        const data = await this.booksService.surpriseMe(user);

        Logger.info(`success get surprise book`);
        return this.response.response(
                await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_GET', 
                { lang: await userLang(null) }), 
                data, null
            );
    }

    // swagger summary
    @ApiOperation({ summary: 'Get all books' })

    // swagger api response
    @ApiResponse({ status: 200 })
    @ApiResponse({ status: 403, description: 'Forbidden.' })

    // get all books
    @Get()
    @ApiBearerAuth('access-token')
   
    @ApiQuery(({ name: 'page', allowEmptyValue: true, required: false }))
    @ApiQuery(({ name: 'size', allowEmptyValue: true, required: false }))
    @ApiQuery(({ name: 'title', allowEmptyValue: true, required: false }))
    @ApiQuery(({ name: 'status', allowEmptyValue: true, required: false }))
    @ApiQuery(({ name: 'category', allowEmptyValue: true, required: false }))
    @ApiQuery(({ name: 'sort', allowEmptyValue: true, required: false }))
    @ApiQuery(({ name: 'search', allowEmptyValue: true, required: false }))

    async findAll(@Query() query: queryDto,@User() user ): Promise<Object> {
    
        query.page = Number(query.page) || 1
        query.size = Number(query.size) || 0

        const data = await this.booksService.findAll(query, user);
        Logger.info(`success get all book, data ${JSON.stringify(data)}`);
        return this.response.response( 
                await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_GET', 
                { lang: await userLang(user) }), 
                data, null
            );
    }

        // swagger summary
    @ApiOperation({ summary: 'Get all books categories' })

    // swagger api response
    @ApiResponse({ status: 200 })
    @ApiResponse({ status: 403, description: 'Forbidden.' })

    // get all books categories
    @Get('/categories')
    @ApiBearerAuth('access-token')
   
    @ApiQuery(({ name: 'page', allowEmptyValue: true, required: false }))
    @ApiQuery(({ name: 'size', allowEmptyValue: true, required: false }))

    async getCategories(@Query() query: queryDto): Promise<Object> {

        query.page = Number(query.page) || 1
        query.size = Number(query.size) || 0
        query.title = query.title || ''

        const data = await this.booksService.getCategories(query);
        Logger.info(`success get all book categories`, data);
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_GET', 
            { lang: await userLang(null) }), 
            data, null
        );
    }

    @ApiOperation({ summary: 'get free daily book(freebie book)' })
    @ApiBearerAuth('access-token')
    @Get('/daily')
    // eslint-disable-next-line @typescript-eslint/ban-types
    async getDailyBook( @User() user ): Promise<Object> {
        const data = await this.booksService.getDailyBook( user );
        Logger.info(`success get freebie book`, { user: user, data });
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_GET' , 
            { lang: await userLang(null) }), 
            data, null
        );
    }


    // swagger summary for get book detail
    @ApiOperation({ summary: 'Get book by id' })
    @ApiResponse({ status: 200 })
    @ApiResponse({ status: 403, description: 'Forbidden.' })

    @ApiQuery(({ name: 'label', allowEmptyValue: true, required: false }))
    @Get(':id')
    @ApiParam(({ name: 'id',  allowEmptyValue: false,  required: true}))

    @ApiBearerAuth('access-token')
    async findOne(@Param('id') id, @User() user, @Query() query: labelDto): Promise<Object> {
       
        const data = await this.booksService.findOne(id, query, user);
        Logger.info(`success get book with id: ${id}`, data);
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_GET', 
            { lang: await userLang(user) }), 
            data, null
        );
    }
  
    // swagger summary for create new book
    @ApiOperation({ summary: 'create new book' })
    @ApiBody({ type: CreateBookDto })

    @Post()
    @ApiBearerAuth('access-token')
    // eslint-disable-next-line @typescript-eslint/ban-types
    async createBook( @User() user, @Body() bookData: CreateBookDto) : Promise<Object> {
        await this.booksService.createBook(bookData, user)
        Logger.info(`success create book ,UserId: ${user.sub}`, { data: bookData });
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_CREATE', 
            { lang: await userLang(user) }), 
            [], null
        );
    }

    // swagger summary for update book
    @ApiOperation({ summary: 'update book' })
    @ApiBody({ type: CreateBookDto })
    @ApiParam(({ name: 'id',  allowEmptyValue: false,  required: true}))
    @ApiBearerAuth('access-token')
    @Put(':id')
    // eslint-disable-next-line @typescript-eslint/ban-types
    async updateBook( @Param('id') id, @User() user, @Body() bookData: CreateBookDto ) : Promise<Object> {
        await this.booksService.updateBook(id, bookData, user )
        Logger.info(`success update book ,UserId: ${user.sub}`,{ data: bookData });
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_UPDATE', 
            { lang: await userLang(user) }), 
            [], null
        );
    }


    @ApiOperation({ summary: 'update book status' })
    @ApiBody({ type: statusDto })
    @ApiParam(({ name: 'id',  allowEmptyValue: false,  required: true}))
    @ApiBearerAuth('access-token')
    @Put('status/:id')
    // eslint-disable-next-line @typescript-eslint/ban-types
    async updateBookStatus( @Param('id') id, @User() user, @Body() status: statusDto ) : Promise<Object> {
        await this.booksService.updateBookStatus(id, status, user )
        Logger.info(`success update book's status ,UserId: ${user.sub}, status: ${status}`);
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_UPDATE', 
            { lang: await userLang(user) }), 
            [], null
        );
    }

    // swagger summary for update chapter progress
    @ApiOperation({ summary: 'update chapter progress' })
    @ApiBody({ type: myProgressDTo })
    @ApiBearerAuth('access-token')
    @Post('/my-progress')
    // eslint-disable-next-line @typescript-eslint/ban-types
    async createProgress(  @User() user, @Body() chapterData: myProgressDTo ) : Promise<Object> {
        await this.booksService.updateBookChapterProgress(chapterData ,user )
        Logger.info(`success update book ,UserId: ${user.sub}`,{ data: chapterData });
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_UPDATE',
            { lang: await userLang(user) }),
            [], null
        );
    }

    @ApiOperation({ summary: 'add into fav' })
    @ApiBody({ type: myFavBookDto })
    @ApiBearerAuth('access-token')
    @Post('/my-fav')
    // eslint-disable-next-line @typescript-eslint/ban-types
    async addMyFav(  @User() user, @Body() bookData: myFavBookDto ) : Promise<Object> {
        await this.booksService.addFav(bookData, user)
        Logger.info(`success add fav book ,UserId: ${user.sub}`,{ data: bookData });
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_CREATE', 
            { lang: await userLang(user) }), 
            [], null
        );
    }

    @ApiOperation({ summary: 'delete user fav' })
    @ApiBearerAuth('access-token')
    @Delete('/my-fav/:label')

    @ApiParam(({ name: 'label',  allowEmptyValue: false,  required: true}))
    // eslint-disable-next-line @typescript-eslint/ban-types
    async deleteFav(  @User() user, @Param('label') label ) : Promise<Object> {
        await this.booksService.removeFav(label, user)
        Logger.info(`success delete fav book ,UserId: ${user.sub}`,{ label });
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_DELETE', 
            { lang: await userLang(user) }), 
            [], null
        );
    }
}
