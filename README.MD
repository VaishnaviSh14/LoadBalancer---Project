
# 🚀 Load Balancer Project – NGINX + Docker + Round Robin + Canary + Weighted Rollout

This project demonstrates **real-world load balancing behavior** using **NGINX**, **Docker**, and **multiple backend microservices**.  
You will learn how modern systems gradually roll out features, balance traffic efficiently, and prevent outages using **traffic weights, canary releases, sticky routing, and circuit-breaker principles.**

---

## 🔥 Features Implemented

| Functionality | Status |
|---|---|
| Round Robin Load Balancing | ✔ |
| Weighted Load Balancing (90/10 Canary) | ✔ |
| Sticky Session Routing | ✔ |
| Canary Release Simulation | ✔ |
| Circuit Breaker Failure Handling | ✔ |
| Auto Canary Monitoring Script | ✔ |

---

## 📂 Project Structure

LoadBalancer-Project/
│
├── backend1/               # Stable Version (Blue)
│   ├── server.js
│   └── Dockerfile
│
├── backend2/               # Canary Version (Green)
│   ├── server.js
│   └── Dockerfile
│
├── nginx.conf              # NGINX Load Balancer Configuration
├── docker-compose.yaml     # Runs all services
├── canary-monitor.js       # Health Test Script
└── README.md               # Documentation

---

## 🖥 Backend Services

### backend1/server.js

 const express = require("express");
 const app = express();
 app.get("/", (req, res) => res.send("⚡ Backend 1 - Stable OK"));
 app.listen(3001, () => console.log("Backend1 running on port 3001"));

---

### backend2/server.js

 const express = require("express");
 const app = express();
 app.get("/", (req, res) => res.send("🌱 Backend 2 - Canary OK"));
 app.listen(3002, () => console.log("Backend2 running on port 3002"));

---

## 🐳 Docker Configuration

### Shared Dockerfile (inside each backend folder)

 FROM node:18
 WORKDIR /app
 COPY server.js .
 RUN npm install express
 EXPOSE 3001   # backend2 uses 3002
 CMD ["node","server.js"]

---

## ⚙ docker-compose.yaml

services:
  backend1:
    build: ./backend1
    ports: ["3001:3001"]

  backend2:
    build: ./backend2
    ports: ["3002:3002"]

  nginx:
    image: nginx
    ports: ["8080:8080"]
    depends_on: [backend1, backend2]
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro

Run project:

docker-compose up --build

Visit:

http://localhost:8080

---

## 🌐 NGINX Load Balancer (90% Blue / 10% Green)

http {
    upstream backend_servers {
        server backend1:3001 weight=9;   # 90%
        server backend2:3002 weight=1;   # 10% Canary
    }

    server {
        listen 8080;
        location / {
            proxy_pass http://backend_servers;
        }
    }
}

---

## 🔁 Testing Load Balancer

for i in {1..20}; do curl -s localhost:8080; echo ""; done

Expected Output:

⚡ Backend1
⚡ Backend1
🌱 Backend2   ← Canary Hit
⚡ Backend1
🌱 Backend2

---

## 📌 Sticky Sessions (IP Hash)

upstream backend_servers {
    ip_hash;
    server backend1:3001;
    server backend2:3002;
}

---

## 🛑 Circuit Breaker Behavior Test

docker stop <backend2-container>
System self-heals using only backend1.

---

## 📊 Canary Monitoring Script

const { execSync } = require("child_process");
let success=0, fail=0;

for(let i=0;i<200;i++){
  try{ execSync("curl -s localhost:8080"); success++; }
  catch{ fail++; }
}

console.log(`Total: ${success+fail} Success: ${success} Failures: ${fail}`);

Run:

node canary-monitor.js

---

## 🎯 Summary

| Concept | Status |
|---|---|
| Round Robin LB | ✔ |
| Weighted Canary | ✔ |
| Sticky Sessions | ✔ |
| Circuit Breaker | ✔ |
| Real Deployment Simulation | ✔ |

---
