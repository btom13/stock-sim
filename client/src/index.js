import React from "react";
import ReactDOM from "react-dom/client";
import News from "./components/news";
import Graph from "./components/graph";
import Login from "./components/login";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { loggedIn: false, loaded: false };
    this.login = this.componentDidMount.bind(this);
    this.logout = this.logout.bind(this);
  }

  componentDidMount() {
    const getCookieValue = (name) =>
      document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)")?.pop() ||
      "";
    if (getCookieValue("token")) {
      this.setState({ loggedIn: true, loaded: true });
    } else {
      this.setState({ loggedIn: false, loaded: true });
    }
  }

  logout() {
    const removeItem = (sKey, sPath, sDomain) => {
      document.cookie =
        encodeURIComponent(sKey) +
        "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" +
        (sDomain ? "; domain=" + sDomain : "") +
        (sPath ? "; path=" + sPath : "");
    };
    removeItem("token");
    window.location.reload();
  }

  render() {
    if (!this.state.loaded) {
      return;
    }
    if (this.state.loggedIn) {
      return (
        <div>
          <StockSearch logout={this.logout} />
        </div>
      );
    } else {
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            alignSelf: "center  ",
            marginTop: "20vh",
          }}
        >
          <Login login={this.login} />
        </div>
      );
    }
  }
}

function TotalValue(props) {
  let val = parseFloat(props.balance) * 1000000;
  props.stocks.forEach((stock) => {
    val += 1000000 * stock.amount * stock.lastPrice;
  });
  return <span>Net Worth: ${(val / 1000000).toFixed(2)}</span>;
}

function Stocks(props) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        height: "auto",
        maxHeight: "80vh",
        width: "auto",
      }}
    >
      <div style={{ flex: "1", /*background: "#aaa",*/ overflowY: "scroll" }}>
        {props.stocks.length ? <p style={{ marginTop: "5px" }}>Stocks</p> : ""}
        {props.stocks ? (
          props.stocks.map((stock) => (
            <div key={stock.name + stock.amount} style={{ lineHeight: "8px" }}>
              <p style={{ fontSize: "1em" }}>
                {stock.name} - ${stock.lastPrice}
              </p>
              <p style={{ fontSize: "0.8em" }}>
                {stock.amount} shares of {stock.symbol}
              </p>
            </div>
          ))
        ) : (
          <p>No stocks owned</p>
        )}
      </div>
    </div>
  );
}

class BuySell extends React.Component {
  constructor(props) {
    super(props);
    this.handleBuy = this.handleBuy.bind(this);
    this.handleSell = this.handleSell.bind(this);

    this.state = { buyAmount: 0, sellAmount: 0 };
    this.handleBuyChange = this.handleBuyChange.bind(this);
    this.handleSellChange = this.handleSellChange.bind(this);
  }

  handleBuyChange(event) {
    this.setState({ buyAmount: event.target.value });
  }
  handleSellChange(event) {
    this.setState({ sellAmount: event.target.value });
  }

  handleBuy(event) {
    event.preventDefault();
    fetch("http:https://batom.online:5500/buy", {
      headers: {
        "Content-type": "application/json",
      },
      credentials: "include",
      method: "POST",
      body: JSON.stringify({
        stock: this.props.stock,
        amount: this.state.buyAmount,
      }),
    })
      .then(() => this.props.update())
      .catch((err) => console.log(err));
  }
  handleSell(event) {
    event.preventDefault();
    fetch("http:https://batom.online:5500/sell", {
      headers: {
        "Content-type": "application/json",
      },
      credentials: "include",
      method: "POST",
      body: JSON.stringify({
        stock: this.props.stock,
        amount: this.state.sellAmount,
      }),
    })
      .then(() => this.props.update())
      .catch((err) => console.log(err));
  }

  render() {
    if (this.props.price === "") {
      return null;
    }
    return (
      <div style={{ display: "flex" }}>
        <Form
          handleSubmit={this.handleBuy}
          handleChange={this.handleBuyChange}
          value={this.state.value}
          text={"$" + this.props.price + "  "}
          buttonText='Buy'
          type='number'
          width='40px'
        />
        <Form
          handleSubmit={this.handleSell}
          handleChange={this.handleSellChange}
          value={this.state.value}
          text=''
          buttonText='Sell'
          type='number'
          width='40px'
        />
      </div>
    );
  }
}

function Form(props) {
  return (
    <form onSubmit={props.handleSubmit}>
      <label>
        {props.text}
        <input
          type={props.type}
          value={props.value}
          onChange={props.handleChange}
          placeholder={props.placeholder}
          min='1'
          style={{ width: props.width }}
        />
      </label>
      <input type='submit' value={props.buttonText} />
    </form>
  );
}

class StockSearch extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: "",
      price: "",
      error: false,
      balance: 0,
      stocks: [],
      news: [],
      loaded: false,
      lastStock: "",
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.update = this.update.bind(this);
    this.update();
  }

  update() {
    const getBal = fetch(`https://batom.online:5500/getBal`, {
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => data.bal)
      .catch((err) => {
        console.err(err);
      });
    const getStocks = fetch(`https://batom.online:5500/getStocks`, {
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => JSON.parse(data.stocks))
      .catch((err) => {
        console.err(err);
      });
    Promise.all([getBal, getStocks]).then((vals) => {
      this.setState({
        balance: vals[0],
        stocks: vals[1],
        news: vals[2],
        loaded: true,
      });
    });
  }

  handleChange(event) {
    this.setState({ value: event.target.value });
  }

  handleSubmit(event) {
    event.preventDefault();
    let stock = this.state.value;
    fetch(`https://batom.online:5500/getQuote/${stock}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          this.setState({ error: true });
          return;
        }
        this.setState({ error: false, price: data.value, lastStock: stock });
      })
      .catch((err) => console.log(err));
  }

  render() {
    return (
      <div>
        {this.state.loaded ? (
          <div>
            <p>
              {this.state.balance
                ? `Balance: $${(
                    Math.round(this.state.balance * 100) / 100
                  ).toFixed(2)}`
                : ""}
            </p>
            <Stocks stocks={this.state.stocks} />
            <TotalValue
              balance={this.state.balance}
              stocks={this.state.stocks}
            />{" "}
          </div>
        ) : (
          ""
        )}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "10%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <Form
            handleSubmit={this.handleSubmit}
            handleChange={this.handleChange}
            value={this.state.value}
            text='Stock: '
            buttonText='Submit'
            placeholder='AAPL'
            type='text'
            width='50px'
          />
        </div>
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "17%",
            transform: "translate(-50%, -50%)",
          }}
        >
          {this.state.error ? (
            <p>Stock not found</p>
          ) : (
            <BuySell
              price={this.state.price}
              stock={this.state.value}
              update={this.update}
            />
          )}
        </div>
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "60%",
            transform: "translate(-50%, -50%)",
          }}
        >
          {this.state.lastStock ? <Graph stock={this.state.lastStock} /> : ""}
        </div>
        <div
          style={{
            position: "absolute",
            top: "1vw",
            width: "18vw",
            flex: "1",
            overflowY: "scroll",
            float: "right",
            left: "80vw",
            height: "98vh",
          }}
        >
          <News stock={this.state.lastStock} />
        </div>
        <span
          style={{
            position: "absolute",
            left: "1%",
            top: "97%",
            fontSize: ".8em",
            cursor: "pointer",
            textDecoration: "underline",
          }}
          onClick={this.props.logout}
        >
          Logout
        </span>
      </div>
    );
  }
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
