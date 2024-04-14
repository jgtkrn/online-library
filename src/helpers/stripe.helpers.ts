import { String } from 'aws-sdk/clients/cloudhsm';
import Stripe from 'stripe';
import { isNotEmpty } from 'class-validator';
import { stripe_payment_type, stripe_coupon_duration } from './util';
import * as moment from 'moment'
import { CreateCustomerDto } from 'src/modules/subscription/dto';

const stripe = new Stripe(process.env.STRIPE_API_KEY, {
    apiVersion: '2020-08-27',
    typescript: true,
  });

export class StripeHelper{

     // eslint-disable-next-line @typescript-eslint/ban-types
    async getWebhooksKey() : Promise<String> {
        return process.env.STRIPE_WEBHOOKS_KEY
    }

    async convertUnixTime(unix_time : number){
        return new Date(moment.unix(unix_time).format("YYYY-MM-DD HH:mm:ss"))
    }

     // eslint-disable-next-line @typescript-eslint/ban-types
    async createProduct(productname : string) : Promise<Object> {
        try {
            return await stripe.products.create({
                name: productname, //Name of product
              });
        } catch (error) {
            return error
        }
    }

     // eslint-disable-next-line @typescript-eslint/ban-types
    async listProduct(data) : Promise<Object>{
        try {
            return await stripe.products.list({
                limit: data.limit //Limit data fetched, can be filled with null if no need
            });
        } catch (error) {
            return error
        }
    }

     // eslint-disable-next-line @typescript-eslint/ban-types
    async createPriceProduct(productId : string, amount : number, currency : string, interval, interval_count : number ) : Promise<Object> {
        try {
            return await stripe.prices.create({
                product: productId, //Id registered Product to Stripe
                unit_amount: amount, //Price for product in cent
                currency: currency, //Price currency used
                recurring: { //Used for recurring payment
                    interval: interval, //Interval frequency, can be filled with day, week, month or year
                    interval_count: interval_count, //Quantity of interval, Maximum of one year interval allowed (1 year, 12 months, or 52 weeks).
                },
            });
        } catch (error) {
            return error
        }
    }

     // eslint-disable-next-line @typescript-eslint/ban-types
    async createCustomer(user, paymentMethodId : string, createCustomerData : CreateCustomerDto): Promise<Object> {

        const params = {
                email: createCustomerData ? createCustomerData.email : user.email,
                name: user.first_name +' '+ user.last_name,
            };

        if(isNotEmpty(paymentMethodId)) {
             params["payment_method"] = paymentMethodId;
        }

        try {
            return await stripe.customers.create(params);
        } catch (error) {
            return error;
        }
    }

    async retrieveCustomer(stripeCustomerId) {
        try {
            return await stripe.customers.retrieve(stripeCustomerId);
        } catch (error) {
            return error;
        }
    }

     // eslint-disable-next-line @typescript-eslint/ban-types
    async getPaymentMethodByStripeId(paymentId): Promise<Object> {
        try {
            return await stripe.paymentMethods.retrieve(paymentId);
        } catch (error) {
            return error
        }
    }

    async getPaymentMethodByUserId(user_id) {
        try {
            return await stripe.paymentMethods.list({
                customer : user_id,
                type: stripe_payment_type.card
            });
        } catch (error) {
            return error
        }
    }

     // eslint-disable-next-line @typescript-eslint/ban-types
    async createPaymentMethod(data, user) : Promise<Object> {
        try {
            return await stripe.paymentMethods.create({
                type: stripe_payment_type.card,
                billing_details: {
                    email : user.email,
                    name : user.first_name +' '+ user.last_name,
                },
                card: {
                  number: data.card_number,
                  exp_month: data.exp_month,
                  exp_year: data.exp_year,
                  cvc: data.cvc,
                },
              });
        } catch (error) {
            return error;
        }
    }

     // eslint-disable-next-line @typescript-eslint/ban-types
    async attachPaymentMethodToUser(paymentMethodId, userId) : Promise<Object> {
        try {
            return await stripe.paymentMethods.attach(
                paymentMethodId,
                    {
                        customer: userId,
                    }
              )
        } catch (error) {
            return error;
        }
    }

     // eslint-disable-next-line @typescript-eslint/ban-types
    async setDefaultPaymentMethod(userId, paymentMethodId) : Promise<Object> {
        try {
            return await stripe.customers.update(
                userId,
                {
                  invoice_settings: {
                    default_payment_method: paymentMethodId
                },
              });
        } catch (error) {
            return error;
        }
    }

     // eslint-disable-next-line @typescript-eslint/ban-types
    async detachPaymentMethod(payment_method) : Promise<Object> {
        try {
            return await stripe.paymentMethods.detach(payment_method);
        } catch (error) {
            return error;
        }
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    async createSubscription(customerId : string, priceId : string, trial_end : number, couponId?: string) : Promise<Object> {
        const params = {
            customer: customerId,
            items: [
              {price: priceId},
            ],
            expand: ['latest_invoice.payment_intent'],
            // cancel_at_period_end: true
        }

        if(trial_end) {
            params["trial_end"] = trial_end
        }

        try {
            if (couponId) {
                return await stripe.subscriptions.create({
                    ...params,
                    coupon: couponId
                });
            }

            return await stripe.subscriptions.create(params);
        } catch (error) {
            return error;
        }
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    async updateSubscription(subscription_id : string, cancel_at_period_end : boolean, item_id : string, price_id : string) : Promise<Object> {

        const params = {
                cancel_at_period_end: cancel_at_period_end,
              }
        if(item_id != null || price_id != null ) {
            params["items"] =[{
                id: item_id,
                price: price_id,
              }]
        };

        try {
            return await stripe.subscriptions.update(subscription_id, params)
        } catch(error) {
            return error;
        }
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    async pausePaymentCollectionSubscription(subscription_id : string, resume_at : number){
        try{
            return await stripe.subscriptions.update(
                subscription_id,
                {
                    pause_collection: {
                        behavior : 'keep_as_draft',
                        resumes_at : resume_at,
                    }
                }
            )
        } catch (error){
            return error;
        }
    }

    async addFreeTrial(subscription_id : string, trial_end : number){
        try{
            return await stripe.subscriptions.update(
                subscription_id,
                {
                    trial_end,
                }
            )
        } catch (error){
            return error;
        }
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    async deleteSubscription(subscription_id : string): Promise<Object>{
        try {
            return await stripe.subscriptions.del(subscription_id);
        } catch (error) {
            return error;
        }
    }



    // eslint-disable-next-line @typescript-eslint/ban-types
    async getSubscription(subscription_id : string) : Promise<Object> {
        try {
           return await stripe.subscriptions.retrieve(subscription_id);
        } catch (error) {
            return error;
        }
    }

     // eslint-disable-next-line @typescript-eslint/ban-types
    async getProduct(stripe_id : string) : Promise<Object> {
        try {
           return await stripe.products.retrieve(stripe_id);
        } catch (error) {
            return error;
        }
    }

     // eslint-disable-next-line @typescript-eslint/ban-types
    async listSubscription(customer_id : string) : Promise<Object> {
        try {
           return await stripe.subscriptions.list({
            customer: customer_id,
            status: 'all',
            expand: ['data.default_payment_method'],
          });
        }
        catch (error){
            return error;
        }
    }

     // eslint-disable-next-line @typescript-eslint/ban-types
    async paidInvoice(invoiceId : string) : Promise<Object> {
        try {
            return await stripe.invoices.pay(invoiceId);
        } catch(error) {
            return error;
        }
    }

     // eslint-disable-next-line @typescript-eslint/ban-types
    async generateHeaderString(payloadString, secret) : Promise<String>{
        try{
            return await stripe.webhooks.generateTestHeaderString({
                payload: payloadString,
                secret,
            });
        } catch (error) {
            return error;
        }

    }

    async constructWebhooks(request_body, signature, endpointSecret){
        try{
            return await stripe.webhooks.constructEvent(
                request_body,
                signature,
                endpointSecret
              );
        } catch (error) {
            return error;
        }
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    async getUpcomingInvoice(customer_id : string, price_id : string, subscription : any) : Promise<Object> {
        try {
            return await stripe.invoices.retrieveUpcoming({
                customer : customer_id,
                subscription : subscription['id'],
                subscription_items :[{
                    id : subscription['items'].data[0].id,
                    price:price_id
                }],
            });
        } catch (error) {
            return error;
        }
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    async createSetupIntent(payment_method) : Promise<Object>{
        try {
            return await stripe.setupIntents.create(payment_method);
        } catch (error) {
            return error
        }
    }


    // eslint-disable-next-line @typescript-eslint/ban-types
    async retrieveSetupIntent(id:string) : Promise<Object>{
        try {
            return await stripe.setupIntents.retrieve(id);
        } catch (error) {
            return error;
        }
    }

    async retrieveCoupon(couponCode: string) {
        try {
            return await stripe.coupons.retrieve(couponCode);
        } catch (error) {
            return error;
        }
    }
}

export default new StripeHelper();
