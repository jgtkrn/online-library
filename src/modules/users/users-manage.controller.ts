import { Body, Controller, Get, Param, Post, Put, Delete, Query, HttpException, HttpStatus } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags, ApiQuery, ApiParam, ApiBody } from "@nestjs/swagger";
import { UsersManageService } from './users-manage.service';
import { Response } from '../../helpers/response';
import { I18nService } from 'nestjs-i18n';
import { userLang } from "../../helpers/app.helpers";
import { queryDto, forgetPassword } from './dto';

import { UsersService } from "./users.service";
import { Logger } from '../../helpers/logger'
import { manageUserCreate, updatePassword } from "./dto/manage-user";
import { User } from "../auth/auth.decorator";
import {UpdateRoleDto} from "./dto/manage-user/update-role.dto";

@ApiTags('users-manage')
@Controller('users-manage')
export class UsersManageController{
    constructor(
        private readonly response: Response,
        private readonly i18n: I18nService,
        private readonly userService : UsersService,

        private readonly userManageService : UsersManageService
    ){};

    @ApiOperation({summary: 'Get all user'})
    @Get('/')
    @ApiBearerAuth('access-token')
    @ApiQuery(({ name: 'page', allowEmptyValue: true, required: false }))
    @ApiQuery(({ name: 'size', allowEmptyValue: true, required: false }))
    @ApiQuery(({ name: 'sort', allowEmptyValue: true, required: false }))
    @ApiQuery(({ name: 'role', allowEmptyValue: true, required: false }))
    @ApiQuery(({ name: 'search', allowEmptyValue: true, required: false }))
     // eslint-disable-next-line @typescript-eslint/ban-types
    async findAll(@Query() query: queryDto, @User() user) : Promise<Object>{
        query.page = Number(query.page) || 1
        query.size = Number(query.size) || 0

        const data = await  this.userManageService.getAllUser(query);
        Logger.info(`Success get data user`, {data:data})
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_GET', {lang : await userLang(user)}), data, null
        );
    }

    @ApiOperation({ summary: 'Get user by id' })
    @ApiBearerAuth('access-token')
    @ApiParam(({ name: 'id',  allowEmptyValue: false,  required: true}))
    @Get('/detail/:id')
    // eslint-disable-next-line @typescript-eslint/ban-types
    async detail(@Param('id') id : string,  @User() user) : Promise<Object> {
        const data = await this.userService.getUser(id, null).getRawOne()

        if(!data) {
            Logger.error(`User not found: ${id}`);
            const message =  await this.i18n.translate('message.GENERAL.ERROR.NOT_FOUND', { lang: await userLang(user) })
            const err = [{ "detail-user" : message }];
            throw new HttpException(await this.response.response(
                message,
                null, err), HttpStatus.NOT_FOUND
            )
        }

        Logger.info(`Success get User ${id}`, {data : data});
        return this.response.response(
             await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_GET', { lang: await userLang(user) }), data, null
         );
    }

    @ApiOperation({summary : 'Create new user'})
    @ApiBearerAuth('access-token')
    @ApiBody({type : manageUserCreate})
    @Post('/create')
    // eslint-disable-next-line @typescript-eslint/ban-types
    async create(@Body() request : manageUserCreate, @User() user) : Promise<Object>{
        // return request;
        const data = await this.userManageService.create(request, user)
        Logger.info('Success create user', {data : data})
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.PROCESSED',
            { lang: await userLang(user) }),
            data, null
        );
    }

    @ApiOperation({summary : 'Update Password'})
    @ApiBearerAuth('access-token')
    @ApiBody({type: updatePassword})
    @Put('/update-password/:id')
    // eslint-disable-next-line @typescript-eslint/ban-types
    async updatePassWord(@Param('id') id, @Body() request:updatePassword, @User() user) : Promise<Object>{
        const dataUser = await this.userService.findOne(id, null)
            if (!dataUser) {
                Logger.error(`User with id ${id} not found`);
                const message =  await this.i18n.translate('message.USER.USER_NOT_FOUND', { lang: await userLang(user) });
                const error = [{ "update-password" : message }];
                throw new HttpException(await this.response.response(message, null, error), HttpStatus.BAD_REQUEST);
            }
        await this.userService.updatePassWord(request, dataUser);
        Logger.info(`Success update password`);
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.PROCESSED',
            { lang: await userLang(user) }),
            [], null
        );
    }

    @ApiOperation({summary : 'Update User Role'})
    @ApiBearerAuth('access-token')
    @ApiBody({type: updatePassword})
    @Put('/update-role/:id')
    // eslint-disable-next-line @typescript-eslint/ban-types
    async updateRole(@Param('id') id, @Body() request: UpdateRoleDto, @User() user) : Promise<Object>{
        const dataUser = await this.userService.findOne(id, null)
        if (!dataUser) {
            Logger.error(`User with id ${id} not found`);
            const message =  await this.i18n.translate('message.USER.USER_NOT_FOUND', { lang: await userLang(user) });
            const error = [{ "update-password" : message }];
            throw new HttpException(await this.response.response(message, null, error), HttpStatus.BAD_REQUEST);
        }
        await this.userManageService.updateRole(dataUser, request);
        Logger.info(`Success update user role`);
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.PROCESSED',
                { lang: await userLang(user) }),
            [], null
        );
    }

    @ApiOperation({ summary: 'Delete user by id' })
    @ApiBearerAuth('access-token')
    @ApiParam(({ name: 'id',  allowEmptyValue: false,  required: true}))
    @Delete('/delete/:id')
    // eslint-disable-next-line @typescript-eslint/ban-types
    async delete(@Param('id') id : string,  @User() user ) : Promise<Object> {
        const data = await this.userManageService.delete(id, user);

        Logger.info(`Success delete user ${id}`, {data : data, deleted_by : user});
        return this.response.response(
             await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_DELETE', { lang: await userLang(user) }), [], null
         );
    }

    @ApiOperation({ summary: 'Send email reset password link' })
    @ApiBearerAuth('access-token')
    @ApiBody({type: forgetPassword})
    @Post('/send-reset-password')
    // eslint-disable-next-line @typescript-eslint/ban-types
    async sendResetPassword(@Body() request : forgetPassword,  @User() user ) : Promise<Object> {

        await this.userService.forgetPassword(request);

        Logger.info(`Success send reset password link to ${request.email}`, {causer : user});
        return this.response.response(
             await this.i18n.translate('message.GENERAL.SUCCESS.PROCESSED', { lang: await userLang(user) }), [], null
         );
    }
}
