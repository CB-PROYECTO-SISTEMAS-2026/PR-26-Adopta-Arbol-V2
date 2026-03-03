import React from "react";
import "./VisitTree.css";

export default function VisitTree() {
  return (
    <div className="visit-container">
      <header className="header">
        <button className="back">←</button>
        <div className="user-info">
          <span className="username">Sandra_B</span>
          <button className="ranking">Ranking 👑</button>
        </div>
      </header>

      <main className="content">
        <p className="map-hint">Haz click en un árbol para ver su información</p>
        <div className="map">
          <div className="route">📍</div>
          <div className="tree available">Adoptame!</div>
        </div>

        <div className="details">
          <h3>Detalles del árbol seleccionado:</h3>
          <p><strong>Árbol:</strong> 777hx</p>
          <p><strong>Adoptado por:</strong> Sin dueño</p>
          <div className="buttons">
            <button className="btn history">Ver Historial</button>
            <button className="btn adopt">Adoptar</button>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>Copyright © 2025. All rights reserved</p>
      </footer>
    </div>
  );
}
