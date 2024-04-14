import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PromotionalCodesService } from './promotional-codes.service';
import { I18nService } from 'nestjs-i18n';
import {
            ApiOperation,
            ApiResponse,
            ApiTags,
            ApiQuery,
            ApiBearerAuth,
            ApiParam,
            ApiBody
        } from '@nestjs/swagger';
import { Logger } from '../../helpers/logger';
import { Response } from '../../helpers/response';
import { userLang } from '../../helpers/app.helpers';
import { UsersService } from '../users/users.service';
// import { queryDto} from './dto/query.dto';
import { 
            CreatePromotionalCodeDto, 
            ClaimPromotionalCodeDto, 
            queryDto 
        } from './dto';
import { User } from '../auth/auth.decorator';

@ApiTags('promotional-codes')
@Controller('promotional-codes')
export class PromotionalCodesController {
    constructor(
        private readonly promotionalCodeService : PromotionalCodesService,
        private readonly userService : UsersService,
        private readonly response: Response,
        private readonly i18n: I18nService,
    ){}

    @ApiOperation({summary : 'Get all promotional code'})
    @ApiResponse({status : 200})
    @Get()

    @ApiQuery(({ name: 'page', allowEmptyValue: true, required: false }))
    @ApiQuery(({ name: 'size', allowEmptyValue: true, required: false }))
    @ApiQuery(({ name: 'code', allowEmptyValue: true, required: false }))
    @ApiQuery(({ name: 'sort', allowEmptyValue: true, required: false }))
    @ApiQuery(({ name: 'search', allowEmptyValue: true, required: false }))

    @ApiBearerAuth('access-token')
    async findAll(@Query() query: queryDto) : Promise<Object>{
        query.page = Number(query.page) || 1
        query.size = Number(query.size) || 0
        query.code = query.code || ''

        const data = await this.promotionalCodeService.findAll(query);
        Logger.info(`Success get all promotional code`, {data:data})
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_GET', 
            { lang: await userLang(null) }), 
            data, null
        );
    }

    @ApiOperation({ summary: 'Get detail Promotional Code' })
    @ApiParam(({ name: 'code',  allowEmptyValue: false,  required: true}))
    @Get('detail/:code')
    // eslint-disable-next-line @typescript-eslint/ban-types
    async detail(@Param('code') code ) : Promise<Object> {

        const data = await this.promotionalCodeService.detail(code);
        Logger.info(`Success get promotional code ${code}`, data);
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.PROCESSED', 
            { lang: await userLang(null) }), 
            data, null
        );
    }
    
    @ApiOperation({ summary: 'Check is promotional code valid' })
    @ApiParam(({ name: 'code',  allowEmptyValue: false,  required: true}))
    @Get('/check/:code')
    // eslint-disable-next-line @typescript-eslint/ban-types
    async check(@Param('code') code ) : Promise<Object> {
        const promotionalCode = await this.promotionalCodeService.isPromotionalCodeValid(code);

        Logger.info(`Success check promotional code ${code}`, {data : promotionalCode});
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.PROCESSED', 
            { lang: await userLang(null) }), 
            promotionalCode, null
        );
    }

    @Post('/create')
    @ApiBearerAuth('access-token')
    @ApiBody({ type : CreatePromotionalCodeDto})
    @ApiOperation({summary : "Create stripe payment mtehod (New Subscription Flow)"})
    // eslint-disable-next-line @typescript-eslint/ban-types
    async create(@User() user, @Body() request : CreatePromotionalCodeDto) : Promise<Object>{
        const data = await this.promotionalCodeService.create(request);

        Logger.info(`Success create promotional code`, {data : data, user : user});
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.PROCESSED', 
            { lang: await userLang(null) }), 
            data, null
        );
    }

    @Post('/claim')
    @ApiBearerAuth('access-token')
    @ApiBody({type: ClaimPromotionalCodeDto})
    @ApiOperation({summary : "Claim promotional code"})
    async claim(@User() user, @Body() request : ClaimPromotionalCodeDto) : Promise<Object>{
        const dataUser = await this.userService.findOne(user.sub, null)
        const data = await this.promotionalCodeService.claim(request.code, dataUser);

        Logger.info(`Success claim promotional code ${request.code}`, {data : data, user : user});
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.PROCESSED',
                {lang : await userLang(user)}
            ), data, null
        );
    }

}
