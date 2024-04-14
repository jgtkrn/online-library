import * as util from 'util';
import { Injectable , HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository} from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from '../../helpers/response';
import { AwsModule } from '../../helpers/aws.helpers';
import { AssetsEntity } from './entities';
import { Logger } from '../../helpers/logger';
const logDir = 'logs';
const fs = require('fs');

const readdir = util.promisify(fs.readdir);
const unlink = util.promisify(fs.unlink);

@Injectable()
export class AssetsService {

    constructor(
        private readonly response: Response,
        private readonly awsmodule: AwsModule,

        @InjectRepository(AssetsEntity)
        private assetsRepository: Repository<AssetsEntity>,
      ) {}
 
    async createAssets(file, user): Promise<object | null> {
        
        const fileUpload = await this.awsmodule.uploadAudio((file as any).originalname, (file as any).buffer);

        const assets = new AssetsEntity()
        assets.id = (fileUpload as any).key || (fileUpload as any).Key;
        assets.content_type = (file as any).mimetype;
        assets.size = (file as any).size;
   
        try {
            await assets.save();
            return assets;
        } catch (err) {
            Logger.error(`failed to upload file`, {user : user, error : err});
            const error = [{ "file" : `Invalid Create File` }];
            throw new HttpException(await this.response.response('Unprocessed', null, error), HttpStatus.INTERNAL_SERVER_ERROR); 
        } 
    }
    async uploadLogs(){
        try{
            const files = await readdir(logDir);
            files.map(async(filename)=>{
                const buffer = fs.readFileSync(`${logDir}/${filename}`);
                const upload = await this.awsmodule.uploadAudio(`${filename}.txt`, buffer);
                await unlink(`${logDir}/${filename}`)
                Logger.info(`success upload log file`,{ upload })
            })
        }catch(err){
            Logger.error(`failed upload log file`, {error : err});
        }
    }
}
 