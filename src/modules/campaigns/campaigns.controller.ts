/* eslint-disable @typescript-eslint/ban-types */
import { Get, Post, Put, Controller, Query, Param, Body } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

import { userLang } from '../../helpers/app.helpers';
import { queryDto } from '../app/dto';
import { CampaignBodyDto, CampaignStatusDto } from './dto';
import { CampaignsService } from './campaigns.service';
import { User } from '../auth/auth.decorator'
import { Response } from '../../helpers/response'
import { Logger } from '../../helpers/logger';

import {
    ApiBody, ApiResponse, ApiParam,
    ApiOperation, ApiTags, ApiQuery,
    ApiBearerAuth
  } from '@nestjs/swagger';
import { ObjectCountByEncryptionType } from 'aws-sdk/clients/macie2';

@ApiTags('campaigns')
@Controller('campaigns')
export class CampaignsController {

    constructor(
      private readonly campaignService: CampaignsService, 
      private readonly response: Response,
      private readonly i18n: I18nService,
      ) {}
    // Get all campaigns
    @ApiOperation({ summary: 'Get all campaigns' })
    @ApiResponse({ status: 200 })
    @ApiResponse({ status: 403, description: 'Forbidden.' })

    @Get()
    @ApiBearerAuth('access-token')

    @ApiQuery(({ name: 'page', allowEmptyValue: true, required: false }))
    @ApiQuery(({ name: 'size', allowEmptyValue: true, required: false }))
    @ApiQuery(({ name: 'title', allowEmptyValue: true, required: false }))
    @ApiQuery(({ name: 'status', allowEmptyValue: true, required: false }))
    @ApiQuery(({ name: 'category', allowEmptyValue: true, required: false }))
    @ApiQuery(({ name: 'sort', allowEmptyValue: true, required: false }))

    async findAll(@Query() query: queryDto): Promise<Object> {
        query.page = Number(query.page) || 1
        query.size = Number(query.size) || 0
        query.title = query.title || ''
        
        const data = await this.campaignService.findAll(query)
        Logger.info(`Success get all Campaigns}`, data)
        return this.response.response(
          await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_GET', 
          { lang: await userLang(null) }), 
          data, null
        );
    }

    // Get book detail
    @ApiOperation({ summary: 'Get book by id' })
    @ApiResponse({ status: 200 })
    @ApiResponse({ status: 403, description: 'Forbidden.' })
    @ApiParam(({ name: 'id',  allowEmptyValue: false,  required: true}))
    
    @Get(':id')
    @ApiBearerAuth('access-token')
    async findOne(@Param('id') id: string, @User() user ): Promise<Object> {
      const data = await this.campaignService.findOne(id, user)
      Logger.info(`Success get campaign detail`, data)
      return this.response.response(
        await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_GET', 
        { lang: await userLang(null) }), 
        data, null
    );
    }

    // Create new campaign
    @ApiOperation({ summary: 'create new campaign' })
    @ApiBody({ type: CampaignBodyDto })
    
    @Post()
    @ApiBearerAuth('access-token')
    async createCampaign(@Body() campaignData: CampaignBodyDto, @User() user: any): Promise<ObjectCountByEncryptionType> {
      await this.campaignService.createCampaign(campaignData, user)
      Logger.info(`Success create campaign, UserId: ${user.sub}`, { data: campaignData })
      return this.response.response(
        await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_CREATE', 
        { lang: await userLang(user) }), 
        [], null
      );
    }

    // Update existing campaign
    @ApiOperation({ summary: 'update existing campaign'})
    @ApiBody({ type: CampaignBodyDto })

    @Put(':id')
    @ApiBearerAuth('access-token')
    async updateCampaign(@Param('id') id: string, @Body() campaignData: CampaignBodyDto, @User() user: any): Promise<Object> {
      await this.campaignService.updateCampaign(id, campaignData, user)
      Logger.info(`Success update campaign, UserId: ${user.sub}`, { data: campaignData })
      return this.response.response(
        await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_UPDATE', 
        { lang: await userLang(user) }), 
        [], null
    );
    }

    // Update campaign by active status
    @ApiOperation({ summary: 'update campaign status' })
    @ApiBody({ type: CampaignStatusDto })

    @Put('/active/:id')
    @ApiBearerAuth('access-token')
    async updateCampaignStatus(@Param('id') id: string, @Body() activeData: CampaignStatusDto, @User() user: any): Promise<Object> {
      await this.campaignService.updateCampaignStatus(id, activeData, user)
      Logger.info(`Success update campaign, UserId: ${user.sub}, data: ${activeData}`)
      return this.response.response(
        await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_UPDATE', 
        { lang: await userLang(user) }), 
        [], null);
    }

        // Get book detail
      @ApiOperation({ summary: 'Count books' })
      @Get('/books/count')
      @ApiBearerAuth('access-token')
      async bookCount(): Promise<Object> {
        const data = await this.campaignService.updateBookCount()
        // Logger.info(`Update book count`, data)
        return this.response.response(
          await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_GET', 
          { lang: await userLang(null) }), 
          data, null
      );
      }
}
