import * as jose from 'jose';
import axios from 'axios';
const url = 'https://appleid.apple.com/auth/keys';

export class IosAuthModule {
  async verifyIos(
    userData
  ): Promise<object | null> {
    const { token } = userData;

    const {
        JWKS,  // JSON Web Key Set (JWKS)
        JWT,   // JSON Web Token (JWT)
        errors // errors utilized by jose
    } = jose;

    try{
        // get ios store key
        const iosGetKey = await axios.get(url)
        // create jose Keystore
        const key = await jose.JWKS.asKeyStore(iosGetKey.data);
        // jwt verify
        const verified = await jose.JWT.verify(token, key);

        return verified
    } catch (err) {
        throw err;
    }
  }
}

export default new IosAuthModule();