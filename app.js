const express = require('express');
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');
const { Client } = require('pg');

const app = express();
const port = process.env.PORT || 3000;


const KEYVAULT_URI = process.env.KEYVAULT_URI;
const SECRET_DB_HOST = process.env.DB_HOST_SECRET;
const SECRET_DB_USER = process.env.DB_USER_SECRET;
const SECRET_DB_PASSWORD = process.env.DB_PASSWORD_SECRET;
const SECRET_DB_NAME = process.env.DB_NAME_SECRET;


const credential = new DefaultAzureCredential();
const secretClient = new SecretClient(KEYVAULT_URI, credential);


let cachedSecrets = null;

async function loadSecrets() {
  if (cachedSecrets) return cachedSecrets;

  const host = await secretClient.getSecret(SECRET_DB_HOST);
  const user = await secretClient.getSecret(SECRET_DB_USER);
  const pass = await secretClient.getSecret(SECRET_DB_PASSWORD);
  const db = await secretClient.getSecret(SECRET_DB_NAME);

  cachedSecrets = {
    host: host.value,
    user: user.value,
    password: pass.value,
    database: db.value
  };

  return cachedSecrets;
}


app.get('/hello', async (req, res) => {
  try {
    const secrets = await loadSecrets();

    const client = new Client({
      host: secrets.host,
      user: secrets.user,
      password: secrets.password,
      database: secrets.database,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        text VARCHAR(200)
      );
    `);

    
    const countRes = await client.query(`SELECT COUNT(*) FROM messages`);
    if (Number(countRes.rows[0].count) === 0) {
      await client.query(`INSERT INTO messages(text) VALUES ('Grup 3'den SELAMLAR: Everythink is OK :)')`);
    }

    const result = await client.query(`SELECT text FROM messages LIMIT 1`);
    const message = result.rows[0].text;

    await client.end();

    res.send("Message from DB: " + message);

  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("Internal Error: " + err.message);
  }
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
