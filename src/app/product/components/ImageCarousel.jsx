"use client";

import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";

const ImageCarousel = ({ images }) => {
  return (
    <div>
      <Carousel showThumbs={true} infiniteLoop autoPlay>
        {images.map((image, index) => (
          <div key={index} className="lg:w-[80%] w-full">
            <img src={image.url}  />
          </div>
        ))}
      </Carousel>
    </div>
  );
};

export default ImageCarousel;
