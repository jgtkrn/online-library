import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { Injectable , HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository} from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';

import { userLang } from '../../helpers/app.helpers';
import { AuthEntity, UserEntity, AuthRoleEntity } from './entities';
import { UserTokenEntity } from '../users/entities';
import { generateTokenDto } from './dto'
import { Token } from './auth.interface'
import { Response } from '../../helpers/response'
import { IosAuthModule } from '../../helpers/ios.verify'
import { UsersService  } from '../users/users.service'
import { v4 } from 'uuid';
import * as moment from 'moment';
import { Logger } from '../../helpers/logger';
import { token_type, token_status, unit_of_time, login_type } from '../../helpers/util';
import { validateSync } from 'class-validator';

@Injectable()
export class AuthService {
    constructor(
        private readonly i18n: I18nService,
        private readonly response: Response,
        @InjectRepository(UserEntity)
        private userRepository: Repository<UserEntity>,
        @InjectRepository(AuthEntity)
        private authRepository: Repository<AuthEntity>,
        @InjectRepository(UserTokenEntity)
        private userTokenRepository: Repository<UserTokenEntity>,
        private readonly iosModule: IosAuthModule,
        private readonly usersService: UsersService,
      ) {};


    async getUserToken(user){
        return await UserTokenEntity
        .createQueryBuilder("token")
        .select(['token.id as token_id', 'token as token', 'expired_at as expired_at'])
        .where('token.user_id = :userId', { userId: user.id })
        .andWhere('token.type = :type', { type: token_type.LOGIN })
        .getRawOne()
    }

    async isTokenValid(token){
        const data = await UserTokenEntity
        .createQueryBuilder("token")
        .select(['token.id as token_id', 'token as token', 'user_id as user_id'])
        .where('token.token = :token', { token: token })
        .andWhere('token.type = :type', { type: token_type.LOGIN })
        .getRawOne()

        return data ? true : false;
    }

    async addOrUpdateToken(user, token) {

        const tokenData = await this.getUserToken(user);

        if ( tokenData ){
            await UserTokenEntity.update(
                { id: tokenData['token_id'] } ,
                { status: token_status.VALID,
                  token : token,
                  expired_at : moment().add(unit_of_time.ninety, 'days').format()
                }
            );
        } else {
            const userToken = new UserTokenEntity()
            userToken.user_id = user.id
            userToken.expired_at = moment().add(unit_of_time.ninety, 'days').format()
            userToken.token = token
            userToken.type = token_type.LOGIN
            await userToken.save();
        }
    }
    // eslint-disable-next-line @typescript-eslint/ban-types
    async findUserAndComparePass (email: string, password:string, type:login_type): Promise<object>{
        try{
            const additionalSelect = [ 'auth.password', 'role_id' ]

            const user = await this.usersService.getUser(null, email, additionalSelect)
            .innerJoin( AuthEntity, 'auth', 'auth.id = user._id')
            .leftJoin(AuthRoleEntity, 'role', 'role.auth_id = user._id')
            .getRawOne();

            const allowedRole = ['Admin','Editor'];


            if(user && user.deleted_at) {
                throw new Error(
                    await this.i18n.translate('message.USER.USER_DELETED',
                    { lang: await userLang(user) })
                )
            }

            if(user) {
                if ( user.apple_id ) {
                    throw new Error(
                        await this.i18n.translate('message.USER.USER_REGISTERED_ON_SSO',
                        { lang: await userLang(user) })
                    )
                }

                if( type == login_type.CMS && !allowedRole.includes(user.role_id)) {
                    throw new Error(
                        await this.i18n.translate('message.USER.NOT_ADMIN_USER',
                        { lang: await userLang(user) })
                    )
                };
                // compare pass
                const pass = await bcrypt.compareSync(password, user.auth_password)

                if(!pass) {
                    throw new Error(
                        await this.i18n.translate('message.USER.INCORRECT_PASSWORD',
                        { lang: await userLang(user) })
                    )
                }
                delete user.auth_password;
                return user
            } else {
                throw new Error(
                    await this.i18n.translate('message.USER.USER_NOT_FOUND',
                    { lang: await userLang(user) })
                )
            }
        }catch(err){
            Logger.error(`${err} ${email}`);
            // if (admin) {
            //     throw new HttpException(await this.response.response( err.message, null, null), HttpStatus.UNAUTHORIZED);
            //     //  throw new HttpException(await this.response.response(
            //     //     await this.i18n.translate('message.USER.UNAUTHORIZED',
            //     //     { lang: await userLang(null) }), null, null), HttpStatus.UNAUTHORIZED
            //     // );
            // }else {
                 throw new HttpException(await this.response.response( err.message, null, null), HttpStatus.UNAUTHORIZED);
            // }
        }
    };

    public generateJWT(user, email) {

        return jwt.sign({
          email,
          jti: v4(),
          iss: process.env.JWT_ISS,
          sub: user.id,
          lang: user.language,
          label: user.label,
          member_type: user.member_type
        }, process.env.JWT_PRIVATE_KEY,
        { expiresIn: `${unit_of_time.ninety}d` });
      };

    async generateToken ({email, password}: generateTokenDto, query): Promise<Token> {
        // check user and compare pass
        const user = await this.findUserAndComparePass(email, password, query.type);
        // generate token
        const token = await this.generateJWT(user, email);

        await this.addOrUpdateToken(user, token);

        this.usersService.addLastLoginAt((user as any).id)

        delete (user as any).id

        let interest = null;
        if(query.interest == "true"){
          interest = await this.usersService.getInterestByUserLabel(user['label']);
        }
        return Object.assign({ token }, { user }, {interest} );
    };

    async checkUserAndGenerateToken(userData, interest = null, platform = null): Promise<object> {
        let user = null

        if(userData.apple_id) {
            user = await this.usersService.getUser(null, userData.email, null, userData.apple_id).getRawOne();
            if (user && user.apple_id === null) {
                Logger.error(`failed to create user, user already registered using email and password`, {email: user.email} );
                const message =  await this.i18n.translate('message.USER.USER_REGISTERED_BY_EMAIL', { lang: await userLang(null) })
                throw new HttpException(await this.response.response(message, null, null), HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }else{
            user = await this.usersService.getUser(null, userData.email).getRawOne();
        }

        try{
            if (!user) {
                userData.username = userData.username ? userData.username : null;
                userData.user_type = 'free';
                userData.claim_referralcode = 'free';
                const registrationPlatform = platform || userData.registration_platform;
                await this.usersService.addUser(userData, 'apple', registrationPlatform);
                if(userData.apple_id) {
                    user = await this.usersService.getUser(null, userData.email, null, userData.apple_id).getRawOne();
                }else{
                    user = await this.usersService.getUser(null, userData.email).getRawOne();
                }
            } else {
                userData.firstname = userData['first_name']
                userData.lastname = userData['last_name']
                await this.usersService.updateUser( userData, { sub: user.id })
                user = await this.usersService.getUser(null, userData.email).getRawOne();
            }
            if(userData.apple_id) {
                await this.usersService.updatePassWord(
                    { new_password: userData.apple_id },
                    { sub: (user as any).id })
                if (user && user.apple_id === '' ) {
                    await this.usersService.updateAppleId( userData.apple_id, (user as any).id  )
                    user.apple_id = userData.apple_id
                }
            }

            const token = await this.generateJWT(user, userData.email)

            this.addOrUpdateToken(user, token);
            this.usersService.addLastLoginAt((user as any).id)
            let userInterest = null;
            if(interest == "true") {
                userInterest = await this.usersService.getInterestByUserLabel(user['label'])
            }
            delete (user as any).id
            return Object.assign({ token }, { user }, {interest : userInterest} );

        } catch(error) {
            Logger.error(`invalid login user:`, {data : userData, error : error});
            const err = [{ "sign-in" : 'Something Went Wrong Please Try Again' }];
            const message =  await this.i18n.translate('message.GENERAL.ERROR.SERVER_ERROR', { lang: await userLang(null) })
            throw new HttpException(await this.response.response(message, null, null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async appleLogin(userData, interest = null): Promise<object> {
            const tokenResult = await this.iosModule.verifyIos(userData);
            const email = (tokenResult as any).email
            userData.email = email;
            userData.password = userData.apple_id ? userData.apple_id : tokenResult['sub']
            userData.username = userData.apple_id ? userData.apple_id : tokenResult['sub']
            userData.apple_id = userData.apple_id ? userData.apple_id : tokenResult['sub']

           return await this.checkUserAndGenerateToken(userData, interest);
    };

    async oauth(userData, interest = false, platform = null): Promise<object> {

        try {
            return await this.checkUserAndGenerateToken(userData, interest, platform)
        } catch (error) {
            Logger.error(`invalid login user: ${userData}, ${error}`);
            const message =  await this.i18n.translate('message.USER.UNAUTHORIZED', { lang: await userLang(userData) });
            const err = [{ "sign-in" : 'Something Went Wrong Please Try Again' }];
            throw new HttpException(await this.response.response(message, null, err), HttpStatus.UNAUTHORIZED);
        }
    };

    // eslint-disable-next-line @typescript-eslint/ban-types
    async getStripeID(id) : Promise<Object> {
        const data = await this.authRepository.createQueryBuilder('_auth')
        .where('_auth.id = :id', { id })
        .select('_auth.stripe_id as stripeId')
        .getRawOne();

        if (!data) {
            Logger.error(`Data with id ${id} not found`);
            const message =  await this.i18n.translate('message.GENERAL.ERROR.NOT_FOUND', { lang: await userLang(null) });
            const error = [{ "StripeId" : message }];
            throw new HttpException(await this.response.response(message, null, error), HttpStatus.NOT_FOUND);

        }
        return data;
     }


};

