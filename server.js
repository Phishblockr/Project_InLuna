const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());

// Test route
app.get('/', (req, res) => {
  res.json({ msg: "Hello World" })
})

app.listen(5000, () => console.log('running on 5000'));