import * as jose from 'jose'
import * as moment from "moment";
import axios from "axios";

type IntroductoryPriceInfo = {
    introductoryPriceCurrencyCode: string;
    introductoryPriceAmountMicros: string;
    introductoryPricePeriod: string;
    introductoryPriceCycles: number;
};

type SubscriptionCancelSurveyResult = {
    cancelSurveyReason: number;
    userInputCancelReason: string;
};

type Price = {
    priceMicros: string;
    currency: string;
};
type SubscriptionPriceChange = {
    newPrice: Price;
    state: number;
};

type SubscriptionPurchase = {
    kind: string;
    startTimeMillis: string;
    expiryTimeMillis: string;
    autoResumeTimeMillis: string;
    autoRenewing: boolean;
    priceCurrencyCode: string;
    priceAmountMicros: string;
    introductoryPriceInfo: IntroductoryPriceInfo;
    countryCode: string;
    developerPayload: string;
    paymentState: number;
    cancelReason: number;
    userCancellationTimeMillis: string;
    cancelSurveyResult: SubscriptionCancelSurveyResult;
    orderId: string;
    linkedPurchaseToken: string;
    purchaseType: number;
    priceChange: SubscriptionPriceChange;
    profileName: string;
    emailAddress: string;
    givenName: string;
    familyName: string;
    profileId: string;
    acknowledgementState: number;
    externalAccountId: string;
    promotionType: number;
    promotionCode: string;
    obfuscatedExternalAccountId: string;
    obfuscatedExternalProfileId: string;
};

type GoogleOauthToken = {
    access_token: string;
    expires_in: number;
    token_type: string;
};

class GoogleBilling {
    async generateToken(): Promise<string> {
        const issueAt = moment();
        const expiresIn = issueAt.add(1, 'hour');
        const headers = {
            alg: 'RS256',
            typ: 'JWT'
        };

        const claimSet = {
            iss: process.env.GOOGLE_BILLING_CLIENT_EMAIL,
            scope: 'https://www.googleapis.com/auth/androidpublisher',
            aud: 'https://oauth2.googleapis.com/token',
            exp: expiresIn.unix(),
            iat: issueAt.unix()
        };
        const privateKey = jose.JWK.asKey(process.env.GOOGLE_BILLING_CLIENT_KEY)
        return jose.JWT.sign(claimSet, privateKey, { header: headers })
    }

    async getAccessToken(): Promise<GoogleOauthToken> {
        const token = await this.generateToken();
        let oauth: GoogleOauthToken;

        await axios.post('https://oauth2.googleapis.com/token', `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${token}`,{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }).then(data => {
            oauth = data.data;
        })

        return oauth;
    }

    async getsubscriptionDetail(subscriptionId: string, purchaseToken: string): Promise<any> {
        let result: any;
        const oauth = await this.getAccessToken();
        const packageName = process.env.GOOGLE_BILLING_CLIENT_PACKAGE;
        const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptions/${subscriptionId}/tokens/${purchaseToken}`;
        try {        
            await axios.get(url, {
                headers: { 'Authorization': `${oauth.token_type} ${oauth.access_token}` }
            })
            .then(res => {
                result = res.data;
            })

            return result;
        } catch (error) {
            return error.response.data.error;
        }
    }
}

export default new GoogleBilling;
