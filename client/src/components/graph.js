import React from "react";
import {
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
} from "recharts";

const INTERVAL_OPTIONS = {
  "5 days": "5d",
  "1 month": "1m",
  "3 months": "3m",
  "6 months": "6m",
  "Year-to-date": "ytd",
  "1 year": "1y",
  "2 years": "2y",
  "5 years": "5y",
};

class Graph extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: null,
      interval: "1m",
      name: "",
    };
    this.handleChangeInterval = this.handleChangeInterval.bind(this);
    this.setData();
  }

  handleChangeInterval(event) {
    this.setState({ interval: INTERVAL_OPTIONS[event.target.value] }, () =>
      this.setData()
    );
  }

  componentDidUpdate(prevProps) {
    if (prevProps.stock !== this.props.stock) {
      this.setData();
    }
  }

  setData() {
    fetch(
      `//64.227.107.77:5500/getStockData/${this.props.stock}/${this.state.interval}`
    )
      .then((response) => response.json())
      .then((data) => {
        this.setState({ data: data });
      })
      .catch((err) => {
        console.error(err);
      });
    fetch(`//64.227.107.77:5500/getName/${this.props.stock}`)
      .then((response) => response.json())
      .then((data) => {
        this.setState({ name: data.name });
      })
      .catch((err) => {
        console.error(err);
      });
  }

  render() {
    return (
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "25px",
          }}
        >
          <div>
            <label htmlFor='interval_select'>
              <strong>Time Interval: </strong>
            </label>
            <select
              onChange={this.handleChangeInterval}
              defaultValue={"1 month"}
            >
              {Object.keys(INTERVAL_OPTIONS).map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </div>
        </div>
        <span
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "10px",
          }}
        >
          {this.state.name}
        </span>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "15px",
          }}
        >
          <LineChart
            width={400}
            height={300}
            data={this.state.data}
            margin={{ top: 5, right: 30, left: 30, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis
              dataKey='date'
              angle={45}
              dx={15}
              dy={20}
              minTickGap={1}
              axisLine={false}
              style={{
                fontSize: "0.7em",
                fontFamily: "Times New Roman",
              }}
            />
            <YAxis
              type='number'
              allowDecimals={true}
              allowDataOverflow={true}
              domain={["auto", "auto"]}
            />
            <Tooltip />
            <Line
              type='monotone'
              dataKey='close'
              stroke='gray'
              dot={false}
              strokeWidth='2'
            />
          </LineChart>
        </div>
      </div>
    );
  }
}

export default Graph;
