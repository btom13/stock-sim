import React from "react";
import Image from "./img";

class News extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      news: [],
      loaded: false,
    };
    this.setData();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.stock !== this.props.stock) {
      this.setData();
    }
  }

  async setData() {
    let getNews;
    if (this.props.stock) {
      let data = await (
        await fetch(`//64.227.107.77:5500/getName/${this.props.stock}`)
      ).json();
      getNews = fetch(`//64.227.107.77:5500/getNews/${data.name}`)
        .then((response) => response.json())
        .catch((err) => {
          console.error(err);
        });
    } else {
      getNews = fetch(`//64.227.107.77:5500/getNews`)
        .then((response) => response.json())
        .catch((err) => {
          console.error(err);
        });
    }
    getNews.then((data) => this.setState({ news: data, loaded: true }));
  }
  render() {
    return (
      <div>
        {this.state.loaded ? (
          <div>
            <p style={{ marginTop: "5px" }}>News</p>
            {this.state.news.map((element) => (
              <div key={element.title}>
                <New
                  imageURL={element.urlToImage}
                  linkURL={element.url}
                  title={element.title}
                />
              </div>
            ))}
          </div>
        ) : (
          ""
        )}
      </div>
    );
  }
}

function New({ imageURL, linkURL, title }) {
  return (
    <div>
      <a href={linkURL}>
        {<h6 style={{ marginTop: "5px", marginBottom: "5px" }}>{title}</h6>}
      </a>
      <Image imageURL={imageURL} linkURL={linkURL} width='100%' height='15%' />
    </div>
  );
}

export default News;
