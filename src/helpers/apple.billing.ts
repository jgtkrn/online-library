import * as jwt from 'jsonwebtoken';
import * as moment from "moment";
import axios from "axios";
import { Logger } from './logger';

class AppleBilling {

    async generateToken(): Promise<string> {
        const issueAt = moment();
        const expiresIn = moment().add(1, "hour");
        const headers = {
            alg: 'ES256',
            kid: '8NUA5UDM53',
            typ: 'JWT'
        };

        const payload = {
          iss : "0096bf33-b2f6-49d4-9d0a-c0494618ac7b",
          iat : issueAt.unix(),
          exp : expiresIn.unix(),
          aud : "appstoreconnect-v1",
          bid : "book.job.news.learn.read"
        };

        const privateKey = `-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg+QC6sqB3XejLM0yM
ZYfYxsBhSXofrcQPuS9U2pPZ3/mgCgYIKoZIzj0DAQehRANCAASaFi7r+Pn64RuC
kX/HJZZQbMvBCYj2V4o2tlOjQQ2Uu0KL+GJ9lsFGLQruluiATCq/H2xOKVfbCW0p
Da7Ukopi
-----END PRIVATE KEY-----`;
        // const privateKey = process.env.APPLE_CLIENT_PRIVATE_KEY.replace(/\\n/g, '\n');
        return jwt.sign(payload, privateKey, {header:headers, algorithm:'ES256'});
    }

    async checkUserSubsToApple(transaction_id: string): Promise<any> {
        const sandbox_api = `https://api.storekit-sandbox.itunes.apple.com/inApps/v1/subscriptions/${transaction_id}`;
        const ios_api = `https://api.storekit.itunes.apple.com/inApps/v1/subscriptions/${transaction_id}`;

        try {        
            const token = await this.generateToken();
            
            let transaction_token = await axios.get(ios_api, {
                headers: {
                    'Authorization' : `Bearer ${token}`
                }
            });

            let data_token = transaction_token.data.data[0].lastTransactions[0].signedTransactionInfo;
            let apple_data = jwt.decode(data_token);
            return apple_data;

        } catch (error) {
            if (error.response) {
                const token = await this.generateToken();
            
                let transaction_token = await axios.get(sandbox_api, {
                    headers: {
                        'Authorization' : `Bearer ${token}`
                    }
                });

                let data_token = transaction_token.data.data[0].lastTransactions[0].signedTransactionInfo;
                let apple_data = jwt.decode(data_token);
                return apple_data;
            }

            Logger.info('invalid check purchase apple', { error : error.response });
        }
    }
}

export default new AppleBilling;
