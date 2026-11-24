# Inquiry backend

`inquiry.yaml` is a CloudFormation stack with a Lambda Function URL (Node.js 22) that turns form POSTs into SES mails to the host.

Function URL: https://oc5gtsvhtqsgk6dudsuun5qk240erluc.lambda-url.eu-central-1.on.aws/

```sh
aws cloudformation deploy --region eu-central-1 --stack-name haus-im-gruenen-inquiry \
  --template-file infra/inquiry.yaml --capabilities CAPABILITY_IAM \
  --parameter-overrides Recipient=mail@ambergarten.com FeedbackRecipient=info@silas-mahler.de --tags Project=haus-im-gruenen
```

For tests, deploy with `Recipient=success@simulator.amazonses.com` (or `FeedbackRecipient=…` for the feedback route) and call the function with `aws lambda invoke`. Do not send test mails to the real recipient.

Request: `POST` JSON `{type:'urlaub'|'firma', name, company, email, phone, arrival, departure, guests, message, website, lang}`.
Required: name, email, arrival, departure (yyyy-mm-dd, departure >= arrival); company for `firma`. Guests: 1-3 (firma), 1-8 (urlaub), default 1.
`website` is a honeypot; if it is filled, the response is `{ok:true}` and no mail is sent.

Responses: `200 {ok:true}`, `400 {ok:false,error}` (e.g. `invalid:email`, `required:company`), `413` body > 10 KB (feedback: 32 KB), `405` non-POST, `500 {ok:false,error:'send_failed'}`.

## Feedback route (`/abstimmung`)

`POST` JSON `{type:'feedback', host, host_note, hero, hero_note, menu, menu_note, prices, cleaning, reviews, imprint, travel, other, website}`, all fields optional.
`host`, `hero`, `menu` must be `''`, `'ja'` or `'nein'` (else `400 invalid:<field>`); notes up to 2000 characters, text fields up to 4000.
The mail goes to `FeedbackRecipient` (default info@silas-mahler.de) with subject „Abstimmung Website: Antwort von Susanne“ and Reply-To `FeedbackReplyTo` (default mail@ambergarten.com). The inquiry route is unchanged.
The page reads `NEXT_PUBLIC_FEEDBACK_URL` (fallback `NEXT_PUBLIC_INQUIRY_URL`), so a preview build can enable it without activating the booking form.
