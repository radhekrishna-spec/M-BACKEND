require('dotenv').config();
const { google } = require('googleapis');
const readline = require('readline');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost',
);

const scopes = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/presentations',
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: scopes,
});

// console.log('\nOpen this URL in browser:\n');
// console.log(authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('\nPaste NEW code here: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code.trim());

    // console.log('\nTOKENS:\n');
    // console.log(tokens);

    // console.log('\nREFRESH TOKEN:\n');
    // console.log(tokens.refresh_token);

    rl.close();
  } catch (err) {
    console.error('TOKEN ERROR:', err.response?.data || err.message);
    rl.close();
  }
});
