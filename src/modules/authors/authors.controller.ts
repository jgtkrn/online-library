import {Get, Post ,Body, Put, Query, Param, Controller } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

import { userLang } from '../../helpers/app.helpers';
import { createAuthor } from './dto';
import { AuthorsService } from './authors.service';
import { User } from '../auth/auth.decorator'
import { Response } from '../../helpers/response'

import {
    ApiResponse, ApiBody,
    ApiOperation, ApiTags,
    ApiBearerAuth, ApiParam,
    ApiQuery
  } from '@nestjs/swagger';

import { Logger } from '../../helpers/logger';
  
@ApiTags('authors')
@Controller('authors')
export class AuthorsController {

    constructor(private readonly authorService: AuthorsService,
                private readonly response: Response,
                private readonly i18n: I18nService,
        ) {}

    // swagger summary
    @ApiOperation({ summary: 'Get all authors' })

    // swagger api response
    @ApiResponse({ status: 200 })
    @ApiResponse({ status: 403, description: 'Forbidden.' })

    @Get()
    @ApiBearerAuth('access-token')
    @ApiQuery(({ name: 'page', allowEmptyValue: true, required: false }))
    @ApiQuery(({ name: 'size', allowEmptyValue: true, required: false }))
    @ApiQuery(({ name: 'name', allowEmptyValue: true, required: false }))

    async findAll(@Query() query): Promise<Object> {

        query.page = Number(query.page) || 1
        query.size = Number(query.size) || 0
        query.name = query.name || ''

        const data = await this.authorService.findAll(query) 

        Logger.info(`Success Get All Authors`, data);
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_GET', 
            { lang: await userLang(null) }), 
            data, null
        );
    }
    // swagger summary for get authors detail
    @ApiOperation({ summary: 'Get author by id' })
    @ApiResponse({ status: 200 })
    @ApiResponse({ status: 403, description: 'Forbidden.' })
    
    // get authors detail
    @Get(':id')
    @ApiParam(({ name: 'id',  allowEmptyValue: false,  required: true}))

    @ApiBearerAuth('access-token')
    async findOne(@Param('id') id): Promise<Object> {
        const data = await this.authorService.findOne(id);
        Logger.info(`Success Get Author, ${id}`, data);
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_GET', 
            { lang: await userLang(null) }), 
            data, null
        );
    }

    // swagger summary for create new author
    @ApiOperation({ summary: 'create new author' })
    @ApiBody({ type: createAuthor })
    @Post()
    @ApiBearerAuth('access-token')
    // eslint-disable-next-line @typescript-eslint/ban-types
    async createAuthor( @Body() authorData: createAuthor, @User() user) : Promise<Object> {
        await this.authorService.createAuthor(authorData, user)
        Logger.info(`success create author,UserId: ${user.sub}`, { data: authorData });
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_CREATE', 
            { lang: await userLang(user) }), 
            [], null
        );
    }
    
    // swagger summary for update authors
    @ApiOperation({ summary: 'update author' })
    @ApiBody({ type: createAuthor })

    @Put(':id')
    @ApiBearerAuth('access-token')
    @ApiParam(({ name: 'id',  allowEmptyValue: false,  required: true}))
    // eslint-disable-next-line @typescript-eslint/ban-types
    async updateAuthor(@Param('id') id, @Body() authorData: createAuthor, @User() user) : Promise<Object> {
        await this.authorService.updateAuthor(id, authorData, user) 
        Logger.info(`success update author,UserId: ${user.sub}`,  { data: authorData });
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_UPDATE', 
            { lang: await userLang(user) }), 
            [], null
        );
    }

}
