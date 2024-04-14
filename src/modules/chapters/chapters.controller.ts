import {Get, Post, Res ,Body, Put, Delete, Query, Param, Controller, HttpException, HttpStatus} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

import { userLang } from '../../helpers/app.helpers';
import { ChaptersService } from './chapters.service';
import { User } from '../auth/auth.decorator';
import { CreateChapterDto, AddAudioDto, DeleteAudio, updateChapterDto } from './dto';
import { queryDto } from '../app/dto';
import { Response } from '../../helpers/response';
import {
    ApiResponse, ApiBody,
    ApiOperation, ApiTags,
    ApiBearerAuth, ApiQuery,
    ApiParam
  } from '@nestjs/swagger';
import { Logger } from '../../helpers/logger';
  
@ApiTags('chapters')
@Controller('chapters')
export class ChaptersController {

    constructor(
            private readonly chapterService: ChaptersService,
            private readonly response: Response,
            private readonly i18n: I18nService,
        ) {};

    // swagger summary
    @ApiOperation({ summary: 'Get all chapters by book label' })

    // swagger api response
    @ApiResponse({ status: 200 })
    @ApiResponse({ status: 403, description: 'Forbidden.' })
    @Get('/book/:label')
    @ApiParam(({ name: 'label',  allowEmptyValue: false,  required: true}))
    @ApiBearerAuth('access-token')
    @ApiQuery(({ name: 'page', allowEmptyValue: true, required: false }))
    @ApiQuery(({ name: 'size', allowEmptyValue: true, required: false }))

    // eslint-disable-next-line @typescript-eslint/ban-types
    async findAllChapters(@User() user, @Param('label') label, @Query() query: queryDto): Promise<Object> {

        const data =  await this.chapterService.findAll(label, query, user);
        Logger.info(`success get all chapter bookLabel: ${label}`, data);
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_GET', 
            { lang: await userLang(user) }), 
            data, null
        );
    }

    @ApiOperation({ summary: 'add or update audio' })

    // swagger api response
    @ApiResponse({ status: 200 })
    @ApiResponse({ status: 403, description: 'Forbidden.' })

    @ApiBody({ type: AddAudioDto })
    @Post('audio')
    @ApiBearerAuth('access-token')
    // eslint-disable-next-line @typescript-eslint/ban-types
    async addAudio( @User() user, @Body() audiodData: AddAudioDto) : Promise<Object> {
        await this.chapterService.addAudio(audiodData, user)
        Logger.info(`success create audio ,UserId: ${user.sub}`);
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_CREATE', 
            { lang: await userLang(user) }), 
            [], null
        );
    }

    // swagger summary
    @ApiOperation({ summary: 'Get chapter by chapter id' })
    @ApiResponse({ status: 200 })
    @ApiResponse({ status: 403, description: 'Forbidden.' })
    @Get(':id')
    @ApiBearerAuth('access-token')
    @ApiParam(({ name: 'id',  allowEmptyValue: false,  required: true}))

    // eslint-disable-next-line @typescript-eslint/ban-types
    async findChapter(@Param('id') id, @User() user ): Promise<Object> {
        const data = await this.chapterService.findOne(id, user); 
        Logger.info(`success get chapter id: ${id}`, data);
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_GET', 
            { lang: await userLang(user) }), 
            data, null
        );
    }

    // swagger summary for create new chapter
    @ApiOperation({ summary: 'create new chapter' })
    // create new chapter 

    @ApiBody({ type: CreateChapterDto })
    @Post()
    @ApiBearerAuth('access-token')

    // eslint-disable-next-line @typescript-eslint/ban-types
    async createChapter( @User() user, @Body() chapterData: CreateChapterDto) : Promise<Object> {

        if( chapterData.number % 1 != 0 ) {
            Logger.error(`Chapter Number Should be a Whole Number: ${user.sub}`,  { data: chapterData });
            const message =  await this.i18n.translate('message.CHAPTERS.SHOULD_BE_WHOLE', { lang: await userLang(user) });
            const error = [{ "chapter" : message }];
            throw new HttpException(await this.response.response(message, null, error), HttpStatus.BAD_REQUEST);
        };

        if ( chapterData.number <= 0 ) {
            Logger.error(`Chapter Number Should be Positive Number: ${user.sub}`,  { data: chapterData });
            const message =  await this.i18n.translate('message.CHAPTERS.SHOULD_BE_POSITIVE', { lang: await userLang(user) });
            const error = [{ "chapter" : message }];
            throw new HttpException(await this.response.response(message, null, error), HttpStatus.BAD_REQUEST);
        };

        await this.chapterService.createChapter(chapterData, user);
        Logger.info(`success create chapter ,UserId: ${user.sub}`, { data: chapterData });
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_CREATE', 
            { lang: await userLang(user) }), 
            [], null
        );
    }

    // swagger summary for update chapter
    @ApiOperation({ summary: 'update chapter' })
    @ApiBody({ type: updateChapterDto })
    @ApiParam(({ name: 'id',  allowEmptyValue: false,  required: true}))
    @ApiBearerAuth('access-token')
    @Put(':id')

    // eslint-disable-next-line @typescript-eslint/ban-types
    async updateChapter(@Param('id') id, @User() user, @Body() chapterData: updateChapterDto) : Promise<Object> {

        if( chapterData.number % 1 != 0 ) {
            Logger.error(`Chapter Number Should be a Whole Number: ${user.sub}`, { data: chapterData });
            const message =  await this.i18n.translate('message.CHAPTERS.SHOULD_BE_WHOLE', { lang: await userLang(user) });
            const error = [{ "chapter" : message }];
            throw new HttpException(await this.response.response(message, null, error), HttpStatus.BAD_REQUEST);
        };

        if ( chapterData.number <= 0 ) {
            Logger.error(`Chapter Number Should be Positive Number: ${user.sub}`, { data: chapterData });
            const message =  await this.i18n.translate('message.CHAPTERS.SHOULD_BE_POSITIVE', { lang: await userLang(user) });
            const error = [{ "chapter" : message }];
            throw new HttpException(await this.response.response(message, null, error), HttpStatus.BAD_REQUEST);
        };
        
        await this.chapterService.updateChapter(id ,chapterData, user)
        Logger.info(`success update chapter ,UserId: ${user.sub}`, { data: chapterData });
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_UPDATE', 
            { lang: await userLang(user) }), 
            [], null
        );
    }

    // swagger summary for delete audio
    @ApiOperation({ summary: 'delete chapter audio' })
    @ApiParam(({ name: 'id',  allowEmptyValue: false,  required: true}))
    @ApiBearerAuth('access-token')
    @Delete('audio/:id')
    @ApiQuery(({ name: 'language', allowEmptyValue: true, required: false }))

    // eslint-disable-next-line @typescript-eslint/ban-types
    async deleteAudio(@Param('id') id, @User() user, @Query() query: DeleteAudio) : Promise<Object> {
        await this.chapterService.deleteAudio(id, query , user)
        Logger.info(`Success Delete chapter Audio,UserId: ${user.sub}, data: ${query}`);
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_DELETE', 
            { lang: await userLang(user) }), 
            [], null
        );
    }

    // swagger summary for delete chapter
    @ApiOperation({ summary: 'delete chapter' })
    @ApiParam(({ name: 'id',  allowEmptyValue: false,  required: true}))
    @ApiBearerAuth('access-token')
    @Delete(':id')

    // eslint-disable-next-line @typescript-eslint/ban-types
    async deleteChapter(@Param('id') id, @User() user) : Promise<Object> {
        await this.chapterService.deleteChapter(id , user)
        Logger.info(`Success Delete chapter ,UserId: ${user.sub}, id: ${id}`);
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_DELETE', 
            { lang: await userLang(user) }), 
            [], null
        );
    }

}
