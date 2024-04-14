import { Post ,Body, Query, Controller, Get, Req, Res, UseGuards, HttpException, HttpStatus, Redirect } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

import { userLang } from '../../helpers/app.helpers';
import { generateTokenDto, appleLogin, isAdmin, verifyDto, loginDto } from './dto'
import { AuthService } from './auth.service'
import { Response } from '../../helpers/response'
import { GoogleVerify } from '../../helpers/google.oauth';
import { FacebookOauth } from '../../helpers/facebook.oauth';
import { Logger } from '../../helpers/logger';

import {
    ApiResponse, ApiBody,
    ApiOperation, ApiTags,
    ApiQuery,
  } from '@nestjs/swagger';
import { login_type, oauth_platform } from '../../helpers/util';
import { verifyTokenMobileDto } from './dto/verify-token-mobile.dto';
import { UsersService } from '../users/users.service';
import { query } from 'winston';


@ApiTags('auth')
@Controller('auth')
export class AuthController {

    constructor(
        private readonly authService: AuthService,
        private readonly response: Response,
        private readonly googleVerify: GoogleVerify,
        private readonly facebookOauth: FacebookOauth,
        private readonly i18n: I18nService,
    ) {}

    // swagger summary
    @ApiOperation({ summary: 'login' })

    // swagger api response
    @ApiResponse({ status: 200 })
    @ApiResponse({ status: 401, description: 'Unauthorization' })
    @ApiQuery(({ name: 'login_type', allowEmptyValue: true, required: false}))

    @ApiBody({ type: generateTokenDto })
    // get all campaigns
    @Post('login')
    async login( @Body() userData: generateTokenDto, @Query() query :loginDto) : Promise<Object> {
        if(query.type && !Object.values(login_type).includes(query.type)){
            Logger.error(`Invalid login type selected`);
            const err = [{ "sign-in" : 'Invalid login type selected' }];
            throw new HttpException(await this.response.response('Invalid login type selected', null, err), HttpStatus.BAD_REQUEST);
        }

        const data =  await this.authService.generateToken(userData, query);
        Logger.info(`success login , email: ${userData.email}`, {data : data});
        return this.response.response('success', data, null);

    }

    // swagger summary
    @ApiOperation({ summary: 'apple_login' })

    // swagger api response
    @ApiResponse({ status: 200 })
    @ApiResponse({ status: 401, description: 'Unauthorization' })


    @ApiBody({ type: appleLogin })
    @Post('login/apple')
    async appleLogin( @Body() userData: appleLogin, @Query() query) : Promise<Object> {
        Logger.info(`Log applelogin:`, {data : userData});
        const data =  await this.authService.appleLogin(userData, query.interest);
        Logger.info(`success login , user: ${userData.email}`, {data : data});
        return this.response.response('success', data, null);

    }

    @ApiOperation({ summary: 'google login' })
    @Get('login/google')
    async googleAuth(@Req() req, @Res() res) {
        const url = await this.googleVerify.login()
        res.redirect(url)
    }

    @ApiOperation({ summary: 'verify token google' })
    @ApiBody({ type: verifyDto })
    @Post('google/verify/')
    async googleAuthVerify( @Body() token: verifyDto) {
        try{
            const user = await this.googleVerify.verifyToken(token.token);
            const data = await this.authService.oauth(user, false, 'website');
            Logger.info(`Success login by google`, {data : data});
            return this.response.response('success', data, null);
        } catch (error){

            Logger.error(`invalid login`, {error : error});
            const message =  await this.i18n.translate('message.USER.UNAUTHORIZED', { lang: await userLang(null) });
            const err = [{ "sign-in" : message }];
            throw new HttpException(await this.response.response(message, null, err), HttpStatus.UNAUTHORIZED);
        }
    }

    @ApiOperation({ summary: 'verify token google for mobile' })
    @ApiBody({ type: verifyDto })
    @Post('google/verify/mobile/')
    async googleAuthVerifyMobile( @Body() token: verifyDto, @Query() query : verifyTokenMobileDto) {
        if(!query.platform || !Object.values(oauth_platform).includes(query.platform)){
            Logger.error(`Invalid platform selected`);
            const err = [{ "sign-in" : 'Invalid platform selected' }];
            throw new HttpException(await this.response.response('Invalid platform selected', null, err), HttpStatus.BAD_REQUEST);
        }
        try{
            // const user = await this.googleVerify.verifyToken(token.token);
            const user = await this.googleVerify.verifyIdToken(token.token, query.platform);
            const data = await this.authService.oauth(user, query.interest, query.platform);
            Logger.info(`Success login by google`, {data : data});
            return this.response.response('success', data, null);
        } catch (error){
            Logger.error(`invalid login`, {error : error});
            const message =  await this.i18n.translate('message.USER.UNAUTHORIZED', { lang: await userLang(null) });
            const err = [{ "sign-in" : message }];
            throw new HttpException(await this.response.response(message, null, err), HttpStatus.UNAUTHORIZED);
        }
    }

    @ApiOperation({ summary: 'facebook login' })
    @Get('login/facebook')
    async facebookAuth(@Req() req, @Res() res) {
        const url = await this.facebookOauth.login();
        res.redirect(url)
    }

    @ApiOperation({ summary: 'verify token facebook' })
    @ApiBody({ type: verifyDto })
    @Post('facebook/verify/')
    async facebookAuthVerify( @Body() token: verifyDto) {
        try{
            const user = await this.facebookOauth.verifyToken(token.token);
            const data = await this.authService.oauth(user, false, 'website');

            Logger.info(`success login by facebook`, {data : data});
            return this.response.response('success', data, null);
        } catch (error){
            Logger.error(`invalid login`,  {error : error});
            const message =  await this.i18n.translate('message.USER.UNAUTHORIZED', { lang: await userLang(null) });
            const err = [{ "sign-in" : message }];
            throw new HttpException(await this.response.response(message, null, err), HttpStatus.UNAUTHORIZED);
        }
    }

    @ApiOperation({ summary: 'verify token facebook for mobile' })
    @ApiBody({ type: verifyDto })
    @Post('facebook/verify/mobile/')
    async facebookAuthVerifyMobile( @Body() token: verifyDto, @Query() query : verifyTokenMobileDto) {
        if(!query.platform || !Object.values(oauth_platform).includes(query.platform)){
            Logger.error(`Invalid platform selected`);
            const err = [{ "sign-in" : 'Invalid platform selected' }];
            throw new HttpException(await this.response.response('Invalid platform selected', null, err), HttpStatus.BAD_REQUEST);
        }
        try{
            const user = await this.facebookOauth.verifyTokenMobile(token.token);
            const data = await this.authService.oauth(user, query.interest, query.platform);
            Logger.info(`success login by facebook`, {data : data});
            return this.response.response('success', data, null);
        } catch (error){
            Logger.error(`invalid login`, {error : error});
            const message =  await this.i18n.translate('message.USER.UNAUTHORIZED', { lang: await userLang(null) });
            const err = [{ "sign-in" : message }];
            throw new HttpException(await this.response.response(message, null, err), HttpStatus.UNAUTHORIZED);
        }
    }
}

