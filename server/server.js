const axios = require("axios");
const bcrypt = require("bcryptjs");
const express = require("express");
const app = express();
const cors = require("cors");
const https = require("https");
const cookieParser = require("cookie-parser");
const aesjs = require("aes-js");
const fs = require("fs");
require("dotenv").config({ path: "./config.env" });
const port = process.env.PORT;

app.use(cors({ credentials: true, origin: "https://batom.online" }));

app.use(express.json());
app.use(cookieParser());
const db = require("./db");
const e = require("express");
let client;

let temp = process.env.AES_KEY.match(/[0-9a-z]{2}/gi);
const AES_KEY = temp.map((t) => parseInt(t, 16));

function encryptAES(str) {
  let textBytes = aesjs.utils.utf8.toBytes(str);
  let aesCtr = new aesjs.ModeOfOperation.ctr(AES_KEY);
  let encryptedBytes = aesCtr.encrypt(textBytes);
  return aesjs.utils.hex.fromBytes(encryptedBytes);
}

function decryptAES(str) {
  let encryptedBytes = aesjs.utils.hex.toBytes(str);
  let aesCtr = new aesjs.ModeOfOperation.ctr(AES_KEY);
  let decryptedBytes = aesCtr.decrypt(encryptedBytes);

  return aesjs.utils.utf8.fromBytes(decryptedBytes);
}

https
  .createServer(
    { key: fs.readFileSync("key.pem"), cert: fs.readFileSync("cert.pem") },
    app
  )
  .listen(port, () => {
    // perform a database connection when server starts
    db.initializeDb().then(async (db) => {
      client = db;
    });
  });


async function getQuote(stock) {
  try {
    const response = await axios.get(
      `https://cloud.iexapis.com/stable/stock/${stock}/quote?token=${process.env.STOCK_KEY}`
    );
    return response.data;
  } catch (error) {
    return "error";
  }
}

app.get("/getStockData/:stock/:timeframe", async (request, response) => {
  try {
    const data = await axios.get(
      `https://cloud.iexapis.com/stable/stock/${request.params.stock}/chart/${request.params.timeframe}?token=${process.env.STOCK_KEY}`
    );

    response.json(
      data.data.map((item) => ({
        close: item.close,
        date: item.date,
      }))
    );
  } catch (error) {
    response.send("error");
  }
});

app.get("/getStocks", async (request, response) => {
  if (request.cookies.token) {
    const id = decryptAES(request.cookies.token);

    const stocks = await client.getAllStocks(id);
    response.json({ stocks: JSON.stringify(stocks) });
  } else response.json({ response: "Not logged in" });
});

app.get("/getBal", async (request, response) => {
  const id = decryptAES(request.cookies.token);

  const bal = await client.getUserBalance(id);
  response.json({ bal: bal.toString() });
});

/*
Each stock has
symbol: string
name: string
lastPrice: number
userID: string
amount: number
*/

app.post("/makeAccount", async (request, response) => {
  try{
    const username = request.body.username;
    const password = request.body.password;
    let salt = bcrypt.genSaltSync(12);
    let hash = bcrypt.hashSync(password, salt);
    let id;
    if (await client.doesUserExist(username)) {
      response.json({ response: "Username already taken" });
    } else {
      id = await client.createUser(username, hash);
      if (id) {
        response.cookie("token", encryptAES(id), {
          httpOnly: false,
          secure: false,
          expires: new Date(Date.now() + 31536000000),
        }); // MAKE THIS SECURE ON WEBSITE
        response.json({ response: "success" });
      } else {
        response.json({ response: "Error creating account" });
      }
    }
  } catch {
      response.json({ response: "Error creating account" });
  }
});

app.post("/login", async (request, response) => {
  try{
    const username = request.body.username;
    const password = request.body.password;

    if (!(await client.doesUserExist(username))) {
      response.json({ response: "Username or password is incorrect" });
    } else {
      pass = (await client.getPass(username)).hashedPass;
      if (bcrypt.compareSync(password,pass)) {
        let id = await client.getID(username);
        response.cookie("token", encryptAES(id), {
          httpOnly: false,
          secure: false,
          expires: new Date(Date.now() + 31536000000),
        }); // MAKE THIS SECURE ON WEBSITE
        response.json({ response: "success" });
      } else {
        response.json({ response: "Username or password is incorrect" });
      }
    }
  } catch {
    response.json({ response: "Username or password is incorrect" });
  }
});

app.post("/buy", async (request, response) => {
  const id = decryptAES(request.cookies.token);
  const amount = parseInt(request.body.amount);
  const stock = request.body.stock;
  const result = await client.getStock(stock, id);
  try {
    if (amount) {
      const data = await getQuote(stock);
      if (data.latestPrice * amount > (await client.getUserBalance(id))) {
        response.send("Can't afford");
        return;
      }
      if (!result) {
        await client.createStock(stock, data.companyName, data.latestPrice, id);
      }
      await client.updateStock(stock, amount, data.latestPrice, id);
      await client.updateBal(id, -1 * amount * data.latestPrice);
      response.send("success");
    } else {
      response.json({ res: "Input a value" });
    }
  } catch (error) {
    console.error(error);
    response.send("error");
  }
});

app.post("/sell", async (request, response) => {
  const id = decryptAES(request.cookies.token);
  const amount = parseInt(request.body.amount);
  const stock = request.body.stock;
  const result = await client.getStock(stock, id);
  if (!result) {
    response.send("not enough");
    return;
  }
  try {
    if (amount) {
      const data = await getQuote(stock);
      if (amount > result.amount) {
        response.send("Can't afford");
        return;
      } else if (amount == result.amount) {
        if (await client.deleteStock(stock, id)) {
          await client.updateBal(id, amount * data.latestPrice);
          response.send("success");
        } else {
          response.send("not enough shares");
        }
      } else {
        await client.updateStock(stock, -1 * amount, data.latestPrice, id);
        await client.updateBal(id, amount * data.latestPrice);
        response.send("success");
      }
    } else {
      response.json({ res: "Input a value" });
    }
  } catch (error) {
    console.error(error);
    response.send("error");
  }
});

app.get("/getName/:stock", async (request, response) => {
  try {
    const data = await getQuote(request.params.stock);
    response.json({ name: data.companyName });
  } catch (error) {
    response.json({ error: true });
    console.error(error);
  }
});

app.get("/getQuote/:stock", async (request, response) => {
  try {
    const data = await getQuote(request.params.stock);
    response.json({ value: data.latestPrice.toString() });
  } catch (error) {
    response.json({ error: true });
    console.error(error);
  }
});

app.get("/getNews", async (request, response) => {
  try {
    const res = await axios.get(
      `https://newsapi.org/v2/everything?q=stock%20market&pageSize=10&apiKey=${process.env.NEWS_KEY}`
    );
    response.json(
      res.data.articles.map((element) => {
        return (({ title, url, urlToImage }) => ({ title, url, urlToImage }))(
          element
        );
      })
    );
  } catch (error) {
    // response.send("error");
    return "error";
  }
});

app.get("/getNews/:stock", async (request, response) => {
  try {
    const res = await axios.get(
      `https://newsapi.org/v2/everything?q=${request.params.stock}%20stock&pageSize=10&apiKey=${process.env.NEWS_KEY}`
    );
    response.json(
      res.data.articles.map((element) => {
        return (({ title, url, urlToImage }) => ({ title, url, urlToImage }))(
          element
        );
      })
    );
  } catch (error) {
    return "error";
  }
});
