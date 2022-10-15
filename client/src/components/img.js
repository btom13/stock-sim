import React from "react";

function Image({ imageURL, linkURL, width, height }) {
  return (
    <a href={linkURL}>
      <img
        src={imageURL}
        alt='Error loading image'
        width={width}
        height={height}
      />
    </a>
  );
}

export default Image;
