import React from "react";
import "./CarouselCard.css";

import { FaStar } from "react-icons/fa";

// Basic card used inside carousels
// props:
// - image: url for the top picture
// - title: main text
// - subtitle: secondary text (optional)
// - price: number (optional)
// - rating: string/number (optional)
export default function CarouselCard({ image, title, subtitle, price, rating }) {
  // Generate random rating for UI if not provided
  const displayRating = rating || (Math.random() * (5.0 - 4.5) + 4.5).toFixed(1);

  return (
    <div className="carousel-card">
      <div className="carousel-img-wrapper">
        <img
          src={image || "/assets/default.jpg"}
          alt={title || ""}
          className="carousel-img"
        />
        <div className="carousel-badge">
          <FaStar className="badge-icon" /> {displayRating}
        </div>
      </div>
      <div className="carousel-info">
        {subtitle && <p className="carousel-subtitle">{subtitle}</p>}
        <div className="carousel-footer">
          {title && <h4 className="carousel-title">{title}</h4>}
          {price != null && <p className="carousel-price">${price.toFixed(2)}</p>}
        </div>
      </div>
    </div>
  );
}
