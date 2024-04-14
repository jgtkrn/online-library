import {Get, Query, Controller, Post, Body, Put, Param } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

import { userLang } from '../../helpers/app.helpers';
import { User } from '../auth/auth.decorator';
import { queryDto, addFavDto, CategoryDto, SwitchCategoryStatusDto } from './dto';
import { Response } from '../../helpers/response';
import { CategoryService } from './categories.service';

import {
        ApiResponse, ApiBody,
        ApiOperation, ApiTags,
        ApiBearerAuth, ApiQuery
    } from '@nestjs/swagger';

import { Logger } from '../../helpers/logger';
import { UsersService } from '../users/users.service';
  
@ApiTags('category')
@Controller('category')
export class CategoryController {

    constructor(
        private readonly categoryService: CategoryService,
        private readonly userService : UsersService,
        private readonly response: Response,
        private readonly i18n: I18nService,
    ){}
    
    @ApiOperation({ summary: 'Get all categories' })

    @ApiResponse({ status: 200 })

    @Get()
   
    @ApiQuery(({ name: 'page', allowEmptyValue: true, required: false }))
    @ApiQuery(({ name: 'size', allowEmptyValue: true, required: false }))
    @ApiQuery(({ name: 'sort', allowEmptyValue: true, required: false }))
    @ApiQuery(({ name: 'name', allowEmptyValue: true, required: false }))
    @ApiQuery(({ name: 'user_interest', allowEmptyValue: true, required: false }))
    @ApiQuery(({ name: 'active_only', allowEmptyValue: true, required: false }))
    @ApiQuery(({ name: 'search', allowEmptyValue: true, required: false }))
    
    @ApiBearerAuth('access-token')
    // eslint-disable-next-line @typescript-eslint/ban-types
    async findAll(@Query() query: queryDto, @User() user) : Promise<Object> {

        query.page = Number(query.page) || 1
        query.size = Number(query.size) || 0
        query.name = query.name || ''

        const data = await this.categoryService.findAll(query, user);
        Logger.info(`success get all category`, data);
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_GET', 
            { lang: await userLang(user) }), 
            data, null
        );
    }

    @ApiOperation({summary : "Get detail category"})
    @ApiResponse({ status : 200})
    @Get('/detail/:id')
    // eslint-disable-next-line @typescript-eslint/ban-types
    async detail(@Param('id') id) : Promise<Object>{
        const data = await this.categoryService.getCategory(id, null)   
        Logger.info(`Success get category`, {data : data});
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.PROCESSED', 
            { lang: await userLang(null) }), 
            data, null
        );
    }

    @ApiOperation({summary : "Create category"})
    @ApiResponse({ status : 200})
    @ApiBearerAuth('access-token')
    @ApiBody({ type: CategoryDto})
    @Post('/create')
    // eslint-disable-next-line @typescript-eslint/ban-types
    async create(@User() user, @Body() request: CategoryDto) : Promise<Object>{
        const dataUser = await this.userService.findOne(user.sub, null)
        const data = await this.categoryService.createCategory(request, dataUser)

        Logger.info(`Success create category`, {data : data, user : dataUser});
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.PROCESSED', 
            { lang: await userLang(null) }), 
            data, null
        );
    }

    @ApiOperation({summary : "Update category status"})
    @ApiResponse({ status : 200})
    @ApiBearerAuth('access-token')
    @ApiBody({ type: CategoryDto})
    @Put('/update/:id')
    // eslint-disable-next-line @typescript-eslint/ban-types
    async update(@Param('id') id, @Body() request: CategoryDto, @User() user) : Promise<Object>{
        const dataUser = await this.userService.findOne(user.sub, null)
        const data = await this.categoryService.updateCategory(id, request, dataUser)

        Logger.info(`Success update category`, {data : data, user : dataUser});
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.PROCESSED', 
            { lang: await userLang(null) }), 
            data, null  
        );
    }

    @ApiOperation({summary : "Switch category status"})
    @ApiResponse({ status : 200})
    @ApiBearerAuth('access-token')
    @ApiBody({ type: SwitchCategoryStatusDto})
    @Put('/switch-status/:id')
    // eslint-disable-next-line @typescript-eslint/ban-types
    async switchStatus(@Param('id') id, @Body() request: SwitchCategoryStatusDto, @User() user) : Promise<Object>{
        const dataUser = await this.userService.findOne(user.sub, null)
        const data = await this.categoryService.switchStatusCategory(id, request, dataUser)

        Logger.info(`Success switch category status`, {data : data, user : dataUser});
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.PROCESSED', 
            { lang: await userLang(null) }), 
            data, null
        );
    }


    @ApiOperation({ summary: 'insert favorite category' })
    @ApiResponse({ status: 200 })
    @ApiBearerAuth('access-token')
    @ApiBody({ type: addFavDto })    
    @Post('/user-interest')
    // eslint-disable-next-line @typescript-eslint/ban-types
    async addUserFav(@User() user, @Body() data: addFavDto ) : Promise<Object> {
        await this.categoryService.addUserFav(user, data);
        Logger.info(`success insert user interest`, data);
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_CREATE', 
            { lang: await userLang(user) }), 
            [], null
        );
    }

}
