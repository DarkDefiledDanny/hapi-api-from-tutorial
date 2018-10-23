/* @flow */
import sgMail from '@sendgrid/mail';
import { load as loadEnv } from 'dotenv';
if (process.env.NODE_ENV !== 'production') {
  loadEnv();
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function VerifyEmail(to: string, key: string) {
  const url = `http://localhost:3000/Login/VerifyEmail?email=${to}&key=${encodeURI(
    key
  )}`;

  const msg = {
    to: to,
    from: 'service@baiv-uren-api.com',
    header: 'Email Verificatie',
    html:
      'Je bent er bijna, om je account te verifieren klik je op de link <a href=' +
      url +
      '>Activeer Account</a>',
    templateId: 'd-17c58eb0b06243d9967ef1ce8a2a7045',
    dynamic_template_data: {
      subject: 'Valideer uw email.',
      header: 'Email Verificatie',
      c2a_link: url,
      c2a_button: 'Verifieer Account'
    }
  };

  const [sentEmail] = await sgMail.send(msg);
  const statusCode = sentEmail.statusCode;
  if (statusCode >= 200 && statusCode < 300) {
    console.log('Email successvol verzonden!', sentEmail.toJSON());
  } else {
    console.warn('Email heeft problemen!', sentEmail.toJSON());
  }

  return sentEmail;
}
