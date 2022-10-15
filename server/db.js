const { MongoClient, ObjectId } = require("mongodb");

require("dotenv").config({ path: "./config.env" });

/*
Each stock has
symbol: string
name: string
lastPrice: number
userID: string
amount: number
*/

/*
Each user has
username: string
hashedPass: string
balance: number
*/

// note: will want to sanitize data

// case sensitivity for usernames

class Db {
  static async initializeDb() {
    const client = new MongoClient(process.env.URI);
    await client.connect();
    const db = new Db();
    db.client = client;
    return db;
  }

  async getUserBalance(userID) {
    return (await this.getUser(userID)).balance / 1000000;
  }

  async getUser(userID) {
    let result = await this.client
      .db("stonk")
      .collection("users")
      .findOne({ _id: ObjectId.createFromHexString(userID) });
    if (result) {
      return result;
    } else {
      console.log(`No users found with the ID '${userID}'`);
    }
  }

  async getID(username) {
    let result = await this.client
      .db("stonk")
      .collection("users")
      .findOne({ username: username });
    return result._id.toString();
  }

  async getPass(username) {
    let result = await this.client
      .db("stonk")
      .collection("users")
      .findOne({ username: username });
    return result;
  }

  async doesUserExist(username) {
    let result = await this.client
      .db("stonk")
      .collection("users")
      .findOne({ username: username });
    return Boolean(result);
  }

  async updateBal(userID, changeInBal) {
    let result = await this.client
      .db("stonk")
      .collection("users")
      .updateOne(
        { _id: ObjectId.createFromHexString(userID) },
        { $inc: { balance: changeInBal * 1000000 } }
      );
    if (result.matchedCount) {
      return "Success";
    }
  }

  async createUser(username, hashedPass) {
    const result = await this.client
      .db("stonk")
      .collection("users")
      .insertOne({
        username: username,
        hashedPass: hashedPass,
        balance: 10000 * 1000000,
      });
    console.log(`New user created with the following id: ${result.insertedId}`);
    return result.insertedId.toString();
  }

  async createStock(stock, name, lastPrice, userID) {
    stock = stock.toUpperCase();
    const result = await this.client
      .db("stonk")
      .collection("stonks")
      .insertOne({
        symbol: stock,
        name: name,
        lastPrice: lastPrice,
        userID: userID,
        amount: 0,
      });
    console.log(
      `New listing created with the following id: ${result.insertedId}`
    );
  }

  async getStock(stock, userID) {
    stock = stock.toUpperCase();
    let result = await this.client
      .db("stonk")
      .collection("stonks")
      .findOne({ symbol: stock, userID: userID });
    return result;
  }

  async getAllStocks(userID) {
    await this.cleanStocks(userID);
    let result = await this.client
      .db("stonk")
      .collection("stonks")
      .find({ userID: userID })
      .sort({ name: 1 });
    return result.toArray();
  }

  async cleanStocks(userID) {
    let result = await this.client
      .db("stonk")
      .collection("stonks")
      .find({ userID: userID });
    const promises = (await result.toArray()).map(async (stock) => {
      if (stock.amount == 0) {
        await this.client
          .db("stonk")
          .collection("stonks")
          .deleteOne({ _id: stock._id });
      }
    });

    await Promise.all(promises);
  }

  async updateStock(stock, changeInAmount, lastPrice, userID) {
    stock = stock.toUpperCase();
    let result = await this.client
      .db("stonk")
      .collection("stonks")
      .updateOne(
        { symbol: stock, userID: userID },
        { $inc: { amount: changeInAmount }, $set: { lastPrice: lastPrice } }
      );
  }

  async deleteStock(stock, userID) {
    stock = stock.toUpperCase();
    const result = await this.client
      .db("stonk")
      .collection("stonks")
      .deleteOne({ symbol: stock, userID: userID });
    console.log(`${result.deletedCount} document(s) was/were deleted.`);
    return result.deletedCount;
  }
}

module.exports = Db;
