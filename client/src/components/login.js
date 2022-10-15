import React from "react";
// hash passwords on server
class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: "",
      password: "",
      confirmPassword: "",
      errorMessage: "",
      register: false,
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.register = this.register.bind(this);
    this.createAccount = this.createAccount.bind(this);
  }

  register() {
    this.setState({ register: true });
  }

  handleChange(event) {
    this.setState({ [event.target.name]: event.target.value });
  }
  createAccount(event) {
    event.preventDefault();

    let err = "";
    if (this.state.username === "") err = "Username required";
    else if (this.state.password === "") err = "Password required";
    else if (this.state.password !== this.state.confirmPassword)
      err = "Passwords must match";
    else if (this.state.password.length > 70)
      err = "Password too long (max 70 characters)";
    else if (this.state.password.length < 6)
      err = "Password too long (min 6 characters)";
    else {
      fetch("http://localhost:5500/makeAccount", {
        headers: {
          "Content-type": "application/json",
        },
        credentials: "include",
        method: "POST",
        body: JSON.stringify({
          username: this.state.username,
          password: this.state.password,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.response !== "success") {
            err = data.response;
            this.setState({ errorMessage: err });
          } else {
            this.props.login();
          }
        });
    }

    this.setState({ errorMessage: err });
  }

  handleSubmit(event) {
    event.preventDefault();
    let err = "";

    if (this.state.username === "") err = "Username required";
    else if (this.state.password === "") err = "Password required";
    else {
      fetch("http://localhost:5500/login", {
        headers: {
          "Content-type": "application/json",
        },
        credentials: "include",
        method: "POST",
        body: JSON.stringify({
          username: this.state.username,
          password: this.state.password,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.response !== "success") {
            err = data.response;
            this.setState({ errorMessage: err });
          } else {
            this.props.login();
          }
        });
    }
    this.setState({ errorMessage: err });
  }

  render() {
    if (this.state.register) {
      return (
        <div>
          <center>
            <form onSubmit={this.createAccount}>
              <input
                type='text'
                name='username'
                placeholder='username'
                value={this.state.username}
                onChange={this.handleChange}
              />
              <br />
              <input
                placeholder='password'
                type='password'
                name='password'
                value={this.state.password}
                onChange={this.handleChange}
              />
              <br />
              <input
                placeholder='confirm password'
                type='password'
                name='confirmPassword'
                value={this.state.confirmPassword}
                onChange={this.handleChange}
              />
              <br />

              <input type='submit' name='submit' value='Create account' />
            </form>
            <span style={{ marginTop: "3px", color: "red", fontSize: "0.8em" }}>
              {this.state.errorMessage}
            </span>
          </center>
        </div>
      );
    } else {
      return (
        <div>
          <center>
            <form onSubmit={this.handleSubmit}>
              <input
                type='text'
                name='username'
                placeholder='username'
                value={this.state.username}
                onChange={this.handleChange}
              />
              <br />
              <input
                placeholder='password'
                type='password'
                name='password'
                value={this.state.password}
                onChange={this.handleChange}
              />
              <br />

              <input type='submit' name='submit' value='Login' />
            </form>
            <div
              style={{
                lineHeight: "12px",
              }}
            >
              <span
                style={{
                  fontSize: "0.6em",
                  cursor: "pointer",
                  textDecoration: "underline",
                  marginTop: "2px",
                }}
                onClick={this.register}
              >
                Don't have an account?
              </span>
              <br style={{ display: "block", content: "", marginTop: "0" }} />
              <span
                style={{
                  fontSize: "0.6em",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
                onClick={() => alert("Tough luck")}
              >
                Forgot password?
              </span>
            </div>
            <span style={{ marginTop: "3px", color: "red", fontSize: "0.8em" }}>
              {this.state.errorMessage}
            </span>
          </center>
        </div>
      );
    }
  }
}

export default Login;
