import { google } from 'googleapis';
import {OAuth2Client} from 'google-auth-library';
import { access_type, oauth_platform, oauth_version_v2, scope } from './util';

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_LINK
  );

  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID_IOS);
export class GoogleVerify  {

    async login() {
          const scopes = [scope.EMAIL, scope.PROFILE];
          const url = oauth2Client.generateAuthUrl({
            access_type: access_type.OFFLINE,
            scope: scopes
          });
          return url
    }
    async verifyToken(code) { 
        const {tokens} = await oauth2Client.getToken(decodeURIComponent(code))
        oauth2Client.setCredentials({access_token: tokens.access_token});
        var oauth2 = google.oauth2({
            auth: oauth2Client,
            version: oauth_version_v2
          });
        const user = await oauth2.userinfo.get();
        return {
            email: user.data.email,
            first_name: user.data.given_name,
            last_name: user.data.family_name,
            picture: user.data.picture
        }
    }

    async verifyIdToken(code, platform) {
        const ticket = await client.verifyIdToken({
            idToken: code,
            audience: [process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_ID_IOS, process.env.GOOGLE_CLIENT_ID_ANDROID],  // Specify the CLIENT_ID of the app that accesses the backend
        });
        const payload = ticket.getPayload();
        // const userid = payload['sub'];

        return payload ? {
          email: payload.email,
          first_name: payload.given_name,
          last_name: payload.family_name,
          picture: payload.picture
      } : ticket;
    }

    async getCLientIdByPlatform(platform){
      switch (platform) {
        case oauth_platform.IOS:
            return process.env.GOOGLE_CLIENT_ID_IOS;
          break;
        case oauth_platform.ANDROID:
            return process.env.GOOGLE_CLIENT_ID_ANDROID;
          break;
        default:
          return null;
          break;
      }
    }


}
export default new GoogleVerify();
