// const express = require('express');
// const app = express();

// app.get('/', (req, res) => {
//     res.send("⚡ Response from Backend Service 2");
// });

// app.listen(3002, () => console.log("Backend2 running on port 3002"));


const express = require('express');
const app = express();

// helper: 30% of the time simulate a failure
function isFail() {
  return Math.random() < 0.3; // 30% failure rate
}

app.get('/', (req, res) => {
  if (isFail()) {
    console.log("⚡ Backend 2: Simulated ERROR");
    return res.status(500).send("⚡ Backend 2 ERROR (simulated bug)");
  }
  console.log("⚡ Backend 2: OK");
  res.send("⚡ Backend 2 OK");
});

app.listen(3002, () => console.log("Backend2 (canary) running on 3002"));
