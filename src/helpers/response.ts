import { Injectable} from '@nestjs/common';


@Injectable()
export class Response {

 // eslint-disable-next-line @typescript-eslint/ban-types
 async response ( message, data, error ) : Promise<Object> {

    let resp = {
        success: false, 
        message: message, 
    }

    if ( data ) {
        resp.success = true
        resp = Object.assign({ data }, resp)
    }
    if ( error ) resp = Object.assign({ error }, resp)
    
    return resp 
    }
}
