# Inquiry backend

`inquiry.yaml` is a CloudFormation stack with a Lambda Function URL (Node.js 22) that turns form POSTs into SES mails to the host.

Function URL: https://oc5gtsvhtqsgk6dudsuun5qk240erluc.lambda-url.eu-central-1.on.aws/

```sh
aws cloudformation deploy --region eu-central-1 --stack-name haus-im-gruenen-inquiry \
  --template-file infra/inquiry.yaml --capabilities CAPABILITY_IAM \
  --parameter-overrides Recipient=mail@ambergarten.com --tags Project=haus-im-gruenen
```

For tests, deploy with `Recipient=success@simulator.amazonses.com`. Do not send test mails to the real recipient.

Request: `POST` JSON `{type:'urlaub'|'firma', name, company, email, phone, arrival, departure, guests, message, website, lang}`.
Required: name, email, arrival, departure (yyyy-mm-dd, departure >= arrival); company for `firma`. Guests: 1-3 (firma), 1-8 (urlaub), default 1.
`website` is a honeypot; if it is filled, the response is `{ok:true}` and no mail is sent.

Responses: `200 {ok:true}`, `400 {ok:false,error}` (e.g. `invalid:email`, `required:company`), `413` body > 10 KB, `405` non-POST, `500 {ok:false,error:'send_failed'}`.
