import {
    Get, Post ,Body, Put, 
    Param, Controller,
    ValidationPipe, HttpException, 
    HttpStatus,
    Res
    } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

import { userLang } from '../../helpers/app.helpers';
import { User } from '../auth/auth.decorator'
import { AuthService } from '../auth/auth.service'
import { Response } from '../../helpers/response'
import { ExportFile } from '../../helpers/export-file';
import { createUser, forgetPassword, resetPassword, updateUser, passworConfirm, addFeedback } from './dto'
import {  UsersService } from './users.service'
import { Logger } from '../../helpers/logger'
import {
    ApiBody, ApiOperation, ApiTags,
    ApiBearerAuth, ApiParam
  } from '@nestjs/swagger';
import { SubscriptionService } from '../subscription/subscription.service';
import { language_detail } from '../../helpers/util';

  @ApiTags('users')
  @Controller('users')
export class UsersController {

        constructor(
            private readonly authService: AuthService,
            private readonly userService: UsersService,
            private readonly subscriptionService : SubscriptionService,
            private readonly response: Response,
            private readonly i18n: I18nService,
            private readonly exportFile : ExportFile,
        ) {}

       @ApiOperation({ summary: 'create new user' })
       @ApiBody({ type: createUser })
       @Post('register')
       // eslint-disable-next-line @typescript-eslint/ban-types
       async createUser( @Body(new ValidationPipe()) userData: createUser ) : Promise<Object> {
           await this.userService.createNewUser(userData);
           Logger.info(`success create User with email: ${userData.email}`, {data: userData});
           const data =  await this.authService.generateToken(userData, { isAdmin: false });
           Logger.info(`success login , email: ${userData.email}`);

        //    const referral =  await this.subscriptionService.registReferralCode(userData.email);
        //    Logger.info(`Success register referral code with id ${referral['id']}`);
    
           return this.response.response('success', data, null);
       } 

       @ApiOperation({ summary: 'forget password' })
       @ApiBody({ type: forgetPassword })
       @Post('forget-password')
       // eslint-disable-next-line @typescript-eslint/ban-types
       async forgetPassword( @Body() userData: forgetPassword ) : Promise<Object> {
           await this.userService.forgetPassword(userData);
           Logger.info(`Success Processing Password Reset ,email: ${userData.email}, data: ${userData}`);
           return this.response.response(
                await this.i18n.translate('message.GENERAL.SUCCESS.PROCESSED', 
                { lang: await userLang(null) }), 
                [], null
           );
       } 

       @ApiOperation({ summary: 'reset password' })
       @ApiBody({ type: resetPassword })
       @Post('reset-password')
       @ApiBearerAuth('access-token')

       // eslint-disable-next-line @typescript-eslint/ban-types
       async resetPassword( @User() user, @Body() userData: resetPassword ) : Promise<Object> {
  
            if (userData.new_password !== userData.repeat_password) {
                Logger.error(`new password missmatch}`);
                const message =  await this.i18n.translate('message.USER.PASSWORD_SHOULD_BE_MATCH', { lang: await userLang(user) });
                const error = [{ "reset-password" : message }];
                throw new HttpException(await this.response.response(message, null, error), HttpStatus.BAD_REQUEST);
            }

            await this.userService.resetPassword(userData, user)
            Logger.info(`Success Processing Reset Password`);
            return this.response.response(
                await this.i18n.translate('message.GENERAL.SUCCESS.PROCESSED', 
                { lang: await userLang(user) }), 
                [], null
            );
       } 

       @ApiOperation({ summary: 'confirm password' })
       @ApiBody({ type: passworConfirm })
       @Put('confirm-password')
       @ApiBearerAuth('access-token')

       // eslint-disable-next-line @typescript-eslint/ban-types
       async confirmPassword( @Body() userData: passworConfirm ) : Promise<Object> {
           if (userData.new_password !== userData.repeat_password) {
                Logger.info(`error Processing Reset Password, password and confirm password doesnt match`, {userData});
                const message =  await this.i18n.translate('message.USER.PASSWORD_SHOULD_BE_MATCH', { lang: await userLang(null) });
                const error = [{ "reset-password" : message }];
                throw new HttpException(await this.response.response(message, null, error), HttpStatus.BAD_REQUEST);
           }

           await this.userService.confirmPassword(userData)
           Logger.info(`Success Processing Reset Password`);
            return this.response.response(
                await this.i18n.translate('message.GENERAL.SUCCESS.PROCESSED', 
                { lang: await userLang(null) }), 
                [], null
            );
       } 

       @ApiOperation({ summary: 'get detail user' })
       @Get('/detail')
       @ApiBearerAuth('access-token')

       // eslint-disable-next-line @typescript-eslint/ban-types
       async userDetail(@User() user ) : Promise<Object> {
           const data = await this.userService.getUserWithSubscription(user.sub, ['user.birthday as birthday']);
           
           Logger.info(`Success Get User Detail`, user);
           return this.response.response(
                await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_GET', 
                { lang: await userLang(user) }), 
                data, null
            );
       }   

       @ApiOperation({ summary: 'Update user profile' })
       @ApiBody({ type: updateUser })
       @Put('/')
       @ApiBearerAuth('access-token')
        // eslint-disable-next-line @typescript-eslint/ban-types
       async updateUser(@User() user, @Body() userData: updateUser ) : Promise<Object> {
        await this.userService.updateUser(userData, user);
        
        Logger.info(`Success Update User`,user);
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_UPDATE', 
            { lang: await userLang(user) }), 
            [], null
        );
       }
       
       @ApiOperation({ summary: 'check is user already registered' })
       @ApiParam(({ name: 'email',  allowEmptyValue: false,  required: true}))
       @Get('/registered/:email')

       // eslint-disable-next-line @typescript-eslint/ban-types
       async checkEmailExist(@Param('email') email ) : Promise<Object> {
           const user = await this.userService.getUser(null, email).getRawOne()
           const data = user ? { exist: true } : { exist: false }
           Logger.info(`Success check User ${email}`, data);
           return this.response.response(
                await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_GET', 
                { lang: await userLang(user) }), 
                data, null
            );
       } 

       @ApiOperation({ summary: 'Download data user' })
       @Get('download-csv')
       // eslint-disable-next-line @typescript-eslint/ban-types
       async exportUser(@Res() res){
          try { 
            Logger.info(`Export processed`);
            return this.userService.exportCsv(res);     
          } catch (err) {
            Logger.error(`Failed to export user data`, {error : err});
            const message =  await this.i18n.translate('message.GENERAL.ERROR.SERVER_ERROR', { lang: await userLang(null) })
            const error = [{ "ExportCsvUserData" : message }];
            throw new HttpException(await this.response.response(  
                message,
                null, error), HttpStatus.INTERNAL_SERVER_ERROR
            )
          }
       } 
       
       @ApiOperation({ summary: 'Add Feedback' })
       @ApiBody({ type: addFeedback })
       @Post('add-feedback')
       // eslint-disable-next-line @typescript-eslint/ban-types
       async addFeedback(@User() user, @Body() feedback: addFeedback ) : Promise<Object> {
           await this.userService.addFeedback(user.sub, feedback['description']);
           Logger.info(`Success add feedback from user with id ${user.sub}, data: ${feedback['description']}`);
           return this.response.response(
                await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_CREATE', 
                { lang: await userLang(user) }), 
                [], null
            );
       } 

       @ApiOperation({ summary: 'Get data language' })
       @Get('language')
       async language() {
           return this.response.response('success', language_detail, null);
       }

    //    @ApiOperation({ summary: 'Update referral code to new format' })
    //    @Get('update-referral')
    //    async updateReferralCode() {
    //        return this.userService.updateFormatReferralCode();
    //     //    return this.response.response('success', language_detail, null);
    //    }
}
