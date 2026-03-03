import React from "react";
import "./TreeAdoption.css";

export default function TreeAdoption() {
  return (
    <div className="tree-container">
      <header className="header">
        <div className="user-info">
          <span className="username">Sandra_B</span>
          <button className="ranking">Ranking 👑</button>
        </div>
      </header>

      <main className="content">
        <div className="map">
          <div className="tree adopted">Adoptado</div>
          <div className="tree available">Adoptame!</div>
          <div className="tree available">Adoptame!</div>
          <div className="tree adopted">Adoptado</div>
          <div className="tree available">Adoptame!</div>
        </div>

        <div className="details">
          <h3>Detalles del árbol seleccionado:</h3>
          <p><strong>Árbol:</strong> 777hx</p>
          <p><strong>Adoptado por:</strong> Sin dueño</p>
          <div className="buttons">
            <button className="btn history">Ver Historial</button>
            <button className="btn visit">Visitar</button>
            <button className="btn adopt">Adoptar</button>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>Copyright © 2025. Derechos reservados</p>
      </footer>
    </div>
  );
}



