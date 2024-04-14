import { Json } from "aws-sdk/clients/robomaker";

export interface SubscriptionLogs {
    id: string;
    user_label: string;
    type: string;
    transaction_name: string;
    transaction_id: string;
    request_body: Json;
    response_body: Json;
    webhooks_url: string;
}