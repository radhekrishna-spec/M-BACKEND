const { google } = require('googleapis');
const credentials = require('./oauth-client.json');

const { client_id, client_secret, redirect_uris } =
  credentials.installed || credentials.web;

const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0],
);

const code =
  '4/0Aci98E9gz3BZBcVPlez2KOirvG5eAutN3iF7Lmr4Gz2ya1ZFzfXW25CLyR3nE3MadBZK3A';

async function getToken() {
  const { tokens } = await oAuth2Client.getToken(code);
  console.log(tokens);
}

getToken();
