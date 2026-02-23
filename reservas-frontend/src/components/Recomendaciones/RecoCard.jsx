// src/components/Recomendaciones/RecoCard.jsx
import React from "react";
import "./RecoCard.css";

const RecoCard = ({ destino, categoria, imagen, review }) => {
  return (
    <div className="reco-card">
      <img src={imagen} alt={destino} className="reco-img" />
      <h4 className="reco-destino">{destino}</h4>
      <p className="reco-categoria">{categoria}</p>
      <div className="reco-review">
        <p className="review-text">“{review.texto}”</p>
        <p className="review-autor">— {review.autor}</p>
      </div>
    </div>
  );
};

export default RecoCard;
