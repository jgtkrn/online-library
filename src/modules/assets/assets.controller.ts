import { Post, Controller, UseInterceptors, UploadedFile,} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express'
import { AssetsService } from './assets.service';
import { User } from '../auth/auth.decorator'
import { Response } from '../../helpers/response'
import { Logger } from '../../helpers/logger';

import {
    ApiOperation, ApiTags,
    ApiBearerAuth,ApiConsumes
  } from '@nestjs/swagger';
  
@ApiTags('upload')
@Controller('upload')
export class AssetsController {

    constructor(private readonly assetsService: AssetsService,
    private readonly response: Response,
    ){}

    // swagger summary for create new assets (upload)
    @ApiOperation({ summary: 'create new assets' })

    // create new assets 
    @Post()
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiBearerAuth('access-token')
    // eslint-disable-next-line @typescript-eslint/ban-types
    async createAssets(@UploadedFile() file, @User() user) : Promise<Object> {
        const dataupload = await this.assetsService.createAssets(file, user)
        const file_name = (dataupload as any).id

        const data = {
            file_name
        }
        Logger.info(`success upload file ,UserId: ${user.sub}`, data);
        return this.response.response('success upload file', data, null);
    }
}
