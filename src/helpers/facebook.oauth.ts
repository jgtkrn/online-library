import { FB } from 'fb';
import  { facebook_scope, scope} from './util'

export class FacebookOauth  {

  async login() {
    const url = await FB.getLoginUrl({
      client_id: process.env.FACEBOOK_CLIENT_ID,
      scope: scope.EMAIL,
      display: facebook_scope.DISPLAY,
      response_type: facebook_scope.RESPONSE_TYPE,
      redirect_uri:  process.env.FACEBOOK_REDIRECT_LINK
    });
    return url
  }

  async verifyToken(token) {

    const verify = await FB.api('oauth/access_token', {
      client_id:  process.env.FACEBOOK_CLIENT_ID,
      client_secret:  process.env.FACEBOOK_CLIENT_SECRET,
      grant_type: facebook_scope.GRANT_TYPE,
      fb_exchange_token: token
  });

    const user = await FB.api('me', {
      fields: ['id', 'email', 'name', 'first_name', 'last_name', 'picture'], 
      access_token: verify.access_token
    });

    const avatar = user.picture && user.picture.data ? user.picture.data.url : null

    const data : Object = { 
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      avatar 
    }
    return data
  }

  async verifyTokenMobile(token) {
    const user = await FB.api('me', {
      fields: ['id', 'email', 'name', 'first_name', 'last_name', 'picture'], 
      access_token: token
    });

    const avatar = user.picture && user.picture.data ? user.picture.data.url : null

    const data : Object = { 
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      avatar 
    }
    return data
  }
}
export default new FacebookOauth();