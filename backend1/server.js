const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send("🔥 Response from Backend Service 1");
});

app.listen(3001, () => console.log("Backend1 running on port 3001"));
