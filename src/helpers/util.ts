export const freeTrialValue = process.env.FREE_TRIAL_LENGTH || 168; // week in hours (7 x 24)

export const language_code = {
    MANDARIN : 'MN',
    CANTONESE : 'ZH',
    ENGLISH : 'EN',
}

export const new_language_code = {
    MANDARIN : 'zh-TW',
    CANTONESE : 'zh-HK',
    ENGLISH : 'EN',
}

export const language_detail = [
    {
      "title": "Mandarin",
      "title_hk": "國語",
      "code": "zh-TW"
    },
    {
      "title": "Cantonese",
      "title_hk": "廣東話",
      "code": "zh-HK"
    }
  ]

export const access_type = {
    ONLINE: 'online',
    OFFLINE: 'offline'
}

export const oauth_version_v2 = 'v2'
export const facebook_scope = {
    DISPLAY : 'popup',
    RESPONSE_TYPE: 'token',
    GRANT_TYPE: 'fb_exchange_token',
}
export const scope = {
    EMAIL: 'email',
    PROFILE: 'profile'

}

export enum member_type {
    FREE = 'free',
    PAID = 'paid'
}

export enum role_type {
    ADMIN = 'Admin',
    EDITOR = 'Editor',
    MEMBER = 'Member',
}

export const duration_unit = {
    MINUTES: '分鐘'
}

export const token_type = {
    RESET_PASSWORD : 'RESET-PASSWORD',
    LOGIN : 'LOGIN'
}

export const token_status = {
    VALID : 'VALID',
    INVALID: 'INVALID'
}

export const unit_of_time = {
    twenty_four: 24,
    ninety: 90,
    half_hour : 30
}

export type sort = 'ASC' | 'DESC';

export type desk_status = 'ACTIVE' | 'INACTIVE';

export const sort_by: { ASC: sort; DESC: sort } = { ASC: 'ASC', DESC: 'DESC' }

export const desk_status_options: { ACTIVE: desk_status; INACTIVE: desk_status } = { ACTIVE: 'ACTIVE', INACTIVE: 'INACTIVE' }

export const status = {
    ACTIVE: 'ACTIVE'
}

export const payment_status = {
    PAID: 'PAID',
    PAID_WITH_ERROR: 'PAID_WITH_ERROR',
    UNPAID: 'UNPAID',
}

export const subscription_status = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
}

export const payment_platforms = {
    GOOGLE: 'GOOGLE',
    APPLE: 'APPLE',
    STRIPE: 'STRIPE',
    PROMOTIONAL_CODE: 'PROMOTIONAL_CODE',
}

export const order_id_prefix = {
    STRIPE: 'sub',
    REFERRAL: 'referral',
}

export const stripe_plan_type = {
    YEARLY: 'STRIPE_YEARLY',
    HALF_YEARLY: 'STRIPE_HALF_YEARLY',
    MONTHLY: 'STRIPE_MONTHLY',
}

export const stripe_price_id = {
    YEARLY: process.env.STRIPE_PRICE_YEARLY,
    HALF_YEARLY: process.env.STRIPE_PRICE_HALF_YEARLY,
    MONTHLY: process.env.STRIPE_PRICE_MONTHLY,
}


export enum stripe_coupon_duration {
    forever = 'forever',
    once = 'once',
    repeating = 'repeating',
}

export const email_subject = {
    // stripe_payment_confirmation : 'Payment Confirmation'
    stripe_payment_confirmation : '確認續訂付款'
 }


export enum stripe_payment_type {
    alipay = 'alipay',
    au_becs_debit = 'au_becs_debit',
    bacs_debit = 'bacs_debit',
    bancontact = 'bancontact',
    card = 'card',
    eps = 'eps',
    fpx = 'fpx',
    giropay = 'giropay',
    grabpay = 'grabpay',
    ideal = 'ideal',
    oxxo = 'oxxo',
    p24 = 'p24',
    sepa_debit = 'sepa_debit',
    sofort = 'sofort',
}

export const forget_pass = {
   email_subject : '點點閱帳戶重置密碼'
}

export const default_daily_book = 'B101'

export const fallbackLanguage = 'zh-HK'

export const google_billing_client = {
    "email": process.env.GOOGLE_BILLING_CLIENT_EMAIL,
    "key": process.env.GOOGLE_BILLING_CLIENT_KEY
}

export const payment_method = {
    STRIPE: 'STRIPE',
    APPLE: 'APPLE_IAP',
    GOOGLE: 'GOOGLE_INAPP',
}

export enum oauth_platform {
    IOS = 'ios',
    ANDROID = 'android'
}

export enum login_type {
    WEB = 'web',
    CMS = 'cms'
}

export enum registration_platform {
    IOS = 'ios',
    ANDROID = 'android',
    WEB = 'website'
}
