import React from "react";
import "./CarouselCard.css";

import { FaStar, FaClock, FaUtensils } from "react-icons/fa";

export default function CarouselCard({
  image,
  title,
  subtitle,
  price,
  rating,
  duration,
  tag,
  included,
  actions,
}) {
  const numericRating =
    rating != null && !Number.isNaN(Number(rating)) ? Number(rating) : 4.8;
  const displayRating = numericRating.toFixed(1);
  const displayDur = duration || "12h 00m";
  const displayTag = tag || "DIRECT FLIGHT";
  const displayInc = included || "Meals included";

  // price formatting
  const formattedPrice = price ? (price % 1 === 0 ? price : price.toFixed(2)) : "0";

  return (
    <div className="carousel-card">
      <div className="carousel-img-wrapper">
        <img
          src={image || "/assets/default.jpg"}
          alt={title || ""}
          className="carousel-img"
        />
        {actions ? <div className="carousel-actions">{actions}</div> : null}
        <div className="carousel-badge">
          <FaStar className="badge-icon" /> {displayRating}
        </div>
        <div className="carousel-flight-tag">
          {displayTag}
        </div>
      </div>
      <div className="carousel-info">
        <div className="carousel-info-header">
          {title && <h4 className="carousel-title">{title}</h4>}
          {price != null && <p className="carousel-price">${formattedPrice}</p>}
        </div>
        {subtitle && <p className="carousel-subtitle">{subtitle}</p>}

        <div className="carousel-footer">
          <span className="carousel-dur"><FaClock className="footer-icon" /> {displayDur}</span>
          <span className="carousel-inc"><FaUtensils className="footer-icon" /> {displayInc}</span>
        </div>
      </div>
    </div>
  );
}
