interface OAuthAccessToken {
  access_token: string;
  token_type: string;
}

interface HandlerPayload {
  event: import('@chargebee/chargebee-apps-shared').EventRecord;
  iparams?: Record<string, any>;
  oauth_token?: Record<string, OAuthAccessToken>;
}
