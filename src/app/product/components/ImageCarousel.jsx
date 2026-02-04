"use client";

import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";

const ImageCarousel = ({ images }) => {
  return (
<div className="w-full max-w-full max-h-full">
  <Carousel
    showThumbs={true}
    infiniteLoop
    autoPlay
    showArrows={false}
    className="max-h-[500px]"  // increase max height for desktop main image container
  >
    {images.map((image, index) => (
      <div key={index} className="w-full">
        <img
          src={image.url}
          className="object-contain w-full max-h-[500px]" // taller max height for desktop
          alt={`Product image ${index + 1}`}
        />
      </div>
    ))}
  </Carousel>

  <style jsx>{`
    /* Thumbnails container styling */
    .carousel .carousel-thumb {
      display: flex !important;
      justify-content: center;
      overflow-x: auto;
      gap: 8px;
      padding: 8px 0;
    }
    /* Thumbnail images */
    .carousel .carousel-thumb img {
      max-height: 70px;
      object-fit: contain;
      cursor: pointer;
      border: 2px solid transparent;
      border-radius: 4px;
      transition: border-color 0.3s ease;
    }
    /* Highlight selected thumbnail */
    .carousel .carousel-thumb .selected img {
      border-color: #ef4444; /* Tailwind red-500 */
    }
  `}</style>
</div>

  );
};

export default ImageCarousel;
