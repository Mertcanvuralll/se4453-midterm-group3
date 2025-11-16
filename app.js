const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Şimdilik DB yok, sadece düz hello.
// Sonra buraya PostgreSQL + Key Vault entegrasyonu ekleyeceğiz.
app.get('/hello', (req, res) => {
  res.send('Hello from SE4453 Group 3!');
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
