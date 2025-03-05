"use client";

import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";

const ImageCarousel = ({ images }) => {
  return (
    <div className="">
      <Carousel showThumbs={true} infiniteLoop autoPlay showArrows={false}>
        {images.map((image, index) => (
          <div key={index} className="lg:w-[100%]">
            <img src={image.url} />
          </div>
        ))}
      </Carousel>
    </div>
  );
};

export default ImageCarousel;
