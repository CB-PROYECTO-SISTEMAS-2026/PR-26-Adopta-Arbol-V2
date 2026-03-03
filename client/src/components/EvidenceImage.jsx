import React, { useEffect, useState } from "react";

// Componente para cargar imágenes de evidencia dinámicamente
const EvidenceImage = ({ irrigationId }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const tryLoadImage = async () => {
      setLoading(true);
      setError(false);
      
      // Extensiones a probar en orden de prioridad
      const extensions = ['png', 'jpg', 'jpeg'];
      
      for (const ext of extensions) {
        const imagePath = `/evidence/${irrigationId}.${ext}`;
        
        try {
          // Crear una promesa para verificar si la imagen existe
          const imageExists = await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = imagePath;
          });
          
          if (imageExists) {
            setImageSrc(imagePath);
            setLoading(false);
            console.log(`Evidence image found: ${imagePath}`);
            return;
          }
        } catch (err) {
          console.log(`Failed to load: ${imagePath}`);
        }
      }
      
      // Si no se encontró ninguna imagen
      setError(true);
      setLoading(false);
      console.log(`No evidence image found for irrigation ID: ${irrigationId}`);
    };

    if (irrigationId) {
      tryLoadImage();
    }
  }, [irrigationId]);

  if (loading) {
    return (
      <div className="loading-evidence">
        <i className="bi bi-hourglass-split"></i>
        <p>Cargando evidencia...</p>
      </div>
    );
  }

  if (error || !imageSrc) {
    return (
      <div className="no-evidence">
        <i className="bi bi-exclamation-triangle"></i>
        <p>No hay evidencia visual disponible (ID: {irrigationId})</p>
      </div>
    );
  }

  return (
    <div className="evidence-container">
      <img 
        src={imageSrc}
        alt="Evidencia de riego" 
        className="evidence-image"
        onError={() => {
          console.error(`Error displaying evidence image: ${imageSrc}`);
          setError(true);
        }}
        onLoad={() => {
          console.log(`Evidence image displayed successfully: ${imageSrc}`);
        }}
      />
    </div>
  );
};

export default EvidenceImage;
