const AWS = require("aws-sdk");
const DDB = new AWS.DynamoDB({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  region: process.env.REGION,
});

function insert(params) {
  return new Promise((resolve, reject) => {
    DDB.putItem(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

function getAll(params) {
  return new Promise((resolve, reject) => {
    DDB.scan(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = new express();
app.use(bodyParser.json());
app.use(cors());

const jwt = require("jsonwebtoken");
const TOKEN_SECRET = process.env.TOKEN_SECRET;

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);
  jwt.verify(token, TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

function generateAccessToken(username) {
  return jwt.sign(username, TOKEN_SECRET, { expiresIn: "1800s" });
}

app.post("/credentials", async (req, res) => {
  const { username, password } = req.body;
  if ((username === "admin", password === "admin")) {
    res.json({ token: generateAccessToken({ username: username }) });
  } else {
    res.sendStatus(401);
  }
});

app.get("/", authenticateToken, async (req, res) => {
  try {
    const params = {
      TableName: "FinalExam",
    };
    const results = await getAll(params);
    res.json(
      results.Items.map((data) => {
        return {
          Id: data.Id.S,
          Text: data.Text.S,
        };
      })
    );
  } catch (error) {
    res.json({ message: "error" });
  }
});

app.post("/", authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;
    const params = {
      TableName: "FinalExam",
      Item: {
        Id: { S: Date.now().toString() },
        Text: { S: text },
      },
    };
    await insert(params);
    res.json(params);
  } catch (error) {
    res.json({ message: "error" });
  }
});

app.listen(8080);
