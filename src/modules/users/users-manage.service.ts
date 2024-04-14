import { Injectable, HttpException, HttpStatus, Body } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UserEntity } from './entities';
import { Repository, getConnection, Brackets} from 'typeorm';
import { Response } from '../../helpers/response';
import { userLang } from '../../helpers/app.helpers';
import { role_type } from '../../../src/helpers/util';
import { queryDto } from './dto';
import { AuthEntity, AuthRoleEntity } from '../auth/entities';
import { UserSubscriptionEntity } from '../subscription/entities/user-subscription.entity';
import { Logger } from '../../helpers/logger';
import { I18nService } from 'nestjs-i18n';
import { member_type, sort_by } from '../../helpers/util';
// import { manageUserCreate } from "./dto/manage-user/manage-user-create.dto";
import { manageUserCreate } from "./dto/manage-user";
import * as moment from 'moment'
import { UsersService } from "./users.service";
import {UpdateRoleDto} from "./dto/manage-user/update-role.dto";

@Injectable()
export class UsersManageService{

    constructor(
        private readonly response : Response,
        private readonly i18n: I18nService,
        private readonly userService : UsersService,

        @InjectRepository(UserEntity)
        private userRepository: Repository<UserEntity>,

    ) {};

    async getAllUser(query : queryDto) {
        const skippedItems:number = (query.page - 1) * query.size;
        let user = await this.userRepository
        .createQueryBuilder("user")
        .select([
            'user._id as id',
            'user.firstname as first_name',
            'user.lastname as last_name',
            'user.email as email',
            'user.registration_platform as registration_platform',
            'user.last_login_at as last_login_at',
            'user.referral_code as referral_code',
            'user.member_type as member_type',
            'user.user_label as label',
            'user._created_at as created_at',
            'authRole.role_id as role_id',
            'usersubs.enddate as enddate',
        ])
        .where('user.deleted_at IS NULL')
        .leftJoin(AuthRoleEntity, 'authRole', 'user._id = authRole.auth_id')
        .leftJoin(UserSubscriptionEntity, 'usersubs', 'user.user_label = usersubs.user_label')

        let role = query.role;
        if(role){
            role = role.toString();
            let role_admin;
            let role_editor;
            let role_member;
            let strCapFirstLetter = (str) => {
                return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
            };

            let arr_role = role.split(',').map((str) => {
                return str.trim();
            });

            for (let i = 0; i < arr_role.length; i++){
                arr_role[i] = strCapFirstLetter(arr_role[i]);
            }

            for (let i = 0; i < arr_role.length; i++){
                if(arr_role[i] == "Admin") role_admin = arr_role[i];
                if(arr_role[i] == "Editor") role_editor = arr_role[i];
                if(arr_role[i] == "Member") role_member = arr_role[i];
            }

            if (role_admin && role_editor) {
                 user = user.andWhere(new Brackets(qb => {
                    qb.where('authRole.role_id = :admin OR authRole.role_id = :editor', { admin: role_admin, editor: role_editor})
                 }))
            } else if(!role_admin && role_editor){
                 user = user.andWhere(new Brackets(qb => {
                    qb.where('authRole.role_id = :editor', { editor: role_editor})
                 }))        
            } else if(role_admin && !role_editor){
                 user = user.andWhere(new Brackets(qb => {
                    qb.where('authRole.role_id = :admin', { admin: role_admin})
                 }))              
            }
        }


        if(query.search) {
            user = user
            .andWhere(new Brackets(qb => {
                qb.where("lower(user.firstname) like '%' || :searchFirstName|| '%'", { searchFirstName: query.search.toLowerCase() })
                qb.orWhere("lower(user.lastname) like '%' || :searchLastName || '%'", { searchLastName: query.search.toLowerCase() })
                qb.orWhere("lower(user.email) like '%' || :searchEmail || '%'", { searchEmail: query.search.toLowerCase() })
            }))
        }

        const total = await user.getCount();

        user = user.orderBy('user._created_at', query.sort === sort_by.ASC ? sort_by.ASC : sort_by.DESC)
        .offset(skippedItems)

        let users = []

        try {
            if (query.size) {
                users = await user.limit(query.size).getRawMany()
            } else {
                users = await user.getRawMany()
            }

        } catch(err) {
            Logger.error(`failed to get promotional codes`, {error : err})
            throw new HttpException(await this.response.response(
                await this.i18n.translate('message.GENERAL.ERROR.INVALID_GET_DATA', { lang: await userLang(null) }),
                null, null), HttpStatus.INTERNAL_SERVER_ERROR
            )
        }
        const data = await users.map( async(el) =>{
            return el;
        })

        return {
            page: query.page,
            size: query.size,
            total: total,
            codes: await Promise.all(data)
        };

    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    async create(request : manageUserCreate, user) : Promise<Object> {
        const isEmailPassedValidation = await this.userService.isUserUniqueValidationPassed(request.email, null)
        const isUsernamePassedValidation = await this.userService.isUserUniqueValidationPassed(null, request.username)
        if(!isEmailPassedValidation) {
            Logger.error(`Email already used: ${request.email}`);
            throw new HttpException(await this.response.response(
                await this.i18n.translate('message.USER.USER_REGISTERED', { lang: await userLang(user) }),
                null, null), HttpStatus.BAD_REQUEST
            )
        }

        if(!isUsernamePassedValidation) {
            Logger.error(`Username already used:: ${request.username}`);
            throw new HttpException(await this.response.response(
                await this.i18n.translate('message.USER.USERNAME_REGISTERED', { lang: await userLang(user) }),
                null, null), HttpStatus.BAD_REQUEST
            )
        }

        const query = getConnection().createQueryRunner();
        await query.connect();

        await query.startTransaction();
        try {
            const user: UserEntity = new UserEntity(
                request.username ?? request.email,
                request.email,
                moment().local().format(),
                request.first_name,
                request.last_name,
                null,
                member_type.FREE,
                null,
                null,
                null,
                '',
                '',
                null,
                moment().local().format(),
                moment().local().format(),
                null,
                null,
                null,
                await this.userService.generateReferralCode()
            );

            const userData = await query.manager.save(user);

            const authUser: AuthEntity = new AuthEntity()
            authUser.id = user._id
            authUser.token_valid_since = moment().local().format(),
            authUser.disabled = false,
            authUser.password = request.password

            const ownerId = {
                _owner_id : userData._id,
                _created_by: userData._id,
            }

            await query.manager.save(authUser);

            await query.manager.update(UserEntity, { _id: userData._id }, ownerId );

            if(request.role == role_type.ADMIN || request.role == role_type.EDITOR) {
                const role: AuthRoleEntity = new AuthRoleEntity()
                role.auth_id = userData._id,
                role.role_id = request.role

                await query.manager.save(role);
            }

            await query.commitTransaction();

            return {
                id : userData._id,
                email : userData.email,
                username : userData.username,
                first_name : userData.firstname,
                last_name : userData.lastname,
                password : authUser.password,
                role : request.role
            }

        }catch(err) {
            await query.rollbackTransaction();
            Logger.error(`Failed to create user with email ${err}`, {error: err});
            throw new HttpException(await this.response.response(
                await this.i18n.translate('message.GENERAL.ERROR.SERVER_ERROR', { lang: await userLang(user) }),
                null, null), HttpStatus.INTERNAL_SERVER_ERROR
            )
        } finally {
            await query.release();
        }
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    async delete(id : string, user) : Promise<Object>{
        const data = await this.userService.getUser(id, null, ['user.username as username'])
        .andWhere('user.deleted_at IS NULL')
        .getRawOne();

        const now = moment()
        const deleted_prefix = '_deleted_' + now.format('YYYYMMDDHHmmss');

        if(!data) {
            Logger.error(`User not found: ${id}`);
            const message =  await this.i18n.translate('message.GENERAL.ERROR.NOT_FOUND', { lang: await userLang(user) })
            const err = [{ "delete-user" : message }];
            throw new HttpException(await this.response.response(
                message,
                null, err), HttpStatus.NOT_FOUND
            )
        }
        try {
            await this.userRepository.update(
                { _id: id },
                {
                    deleted_at :now.format('YYYY-MM-DD HH:mm:ss'),
                    deleted_by : user.sub,
                    email : data.email + deleted_prefix,
                    username : data.username + deleted_prefix,
                })
        } catch(error){
            Logger.error( `Failed delete user ${id}`, {error : error});
            const message =  await this.i18n.translate('message.GENERAL.ERROR.SERVER_ERROR', { lang: await userLang(user) })
            const err = [{ "delete-user" : message }];
            throw new HttpException(await this.response.response(
                message,
                null, err), HttpStatus.INTERNAL_SERVER_ERROR
            )
        }

        return data;

    }

    async updateRole(user, request: UpdateRoleDto) : Promise<void> {
        const query = getConnection().createQueryRunner();
        await query.connect();
        const userId = user.sub ?? user.id;

        try {
            const userRole = await query.manager.findOne(AuthRoleEntity, {auth_id: userId});

            if (userRole) {
                if (request.role === role_type.MEMBER) {
                    await query.manager.delete(AuthRoleEntity, userRole);
                } else {
                    await query.manager.update(AuthRoleEntity, { auth_id: userId }, { role_id: request.role });
                }
            } else {
                if (request.role !== role_type.MEMBER) {
                    const newRole: AuthRoleEntity = new AuthRoleEntity();
                    newRole.auth_id = userId;
                    newRole.role_id = request.role;
                    Logger.debug('data: ' + JSON.stringify(newRole));

                    await query.manager.save(newRole);
                }
            }
        } catch(error){
            Logger.error( `Failed update user ${user._id} role`, {error : error});
            const message =  await this.i18n.translate('message.GENERAL.ERROR.SERVER_ERROR', { lang: await userLang(user) })
            const err = [{ "update-user-user" : message }];
            throw new HttpException(await this.response.response(
                message,
                null, err), HttpStatus.INTERNAL_SERVER_ERROR
            )
        } finally {
            await query.release();
        }

    }


}
