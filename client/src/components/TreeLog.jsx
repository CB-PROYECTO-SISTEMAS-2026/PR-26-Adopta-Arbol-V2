import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./TreeLog.css";
import "./IrrigatorMap.css";
import { registerTree, getCategories } from "../api/tec.api.js";
import { useUsers } from "../context/UserContext.jsx";
import { useNotification } from "../context/NotificationContext.jsx";

const redMarkerIcon = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  iconRetinaUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const treeIcon = L.icon({
  iconUrl: "/default-tree.svg",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -32],
});

// Ubicación actual del usuario
function LocationMarker({ setLocation }) {
  const [position, setPosition] = useState(null);
  const map = useMap();

  useEffect(() => {
    map.locate().on("locationfound", (e) => {
      setPosition(e.latlng);
      setLocation(e.latlng);
      map.flyTo(e.latlng, 15);
    });
  }, [map, setLocation]);

  return position ? <Marker position={position} icon={redMarkerIcon} /> : null;
}

// Selección manual de ubicación
function LocationPicker({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng);
    },
  });
  return null;
}

export default function TreeLog() {
  const navigate = useNavigate();
  const { loggedUser, logout } = useUsers();
  const { showSuccess, showError, showWarning } = useNotification();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [address, setAddress] = useState("");
  const [images, setImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [location, setLocation] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const imagesRef = useRef(images);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, []);

  // Cargar categorías
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.error("Error al cargar categorías:", error);
        showError("Error al cargar las categorías");
      }
    };
    loadCategories();
  }, [showError]);

  const handleFiles = (fileList) => {
    if (!fileList?.length) return;

    const files = Array.from(fileList);
    const newItems = files.map((file, index) => ({
      id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newItems]);
  };

  const handleImage = (e) => {
    const files = e.target.files;
    if (files) {
      handleFiles(files);
      e.target.value = "";
    }
  };

  const handleDropAreaKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer?.files;
    if (files?.length) {
      handleFiles(files);
    }
  };

  const handleRemoveImage = (id) => {
    setImages((prev) => {
      const toRemove = prev.find((item) => item.id === id);
      if (toRemove) {
        URL.revokeObjectURL(toRemove.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleRegister = async () => {
    if (
      !name ||
      !description ||
      !price ||
      !location ||
      !selectedCategoryId ||
      images.length === 0
    ) {
      showWarning(
        "Completa todos los campos obligatorios y selecciona una ubicación 🌳",
      );
      return;
    }
    if (!loggedUser) {
      showWarning("Debes estar logueado para registrar un árbol");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("latitude", location.lat);
      formData.append("longitude", location.lng);
      formData.append("price", parseFloat(price));
      formData.append("address", address || "");
      formData.append("userId", loggedUser.id);
      formData.append("categoryId", parseInt(selectedCategoryId));
      images.forEach((item) => {
        formData.append("images", item.file);
      });

      await registerTree(formData);
      showSuccess("🌿 Árbol registrado correctamente!");

      // Limpiar formulario
      setName("");
      setDescription("");
      setPrice("");
      setAddress("");
      imagesRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      setImages([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setLocation(null);
      setSelectedCategoryId("");
    } catch (error) {
      console.error("Error al registrar árbol:", error);
      showError(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/"); // Redirige a Login.jsx
  };

  return (
    <div className="tree-log-container-modern">
      {/* Cabecera similar a map-header (solo visual, sin opciones de menú) */}
      <nav className="map-navbar">
        <div className="navbar-container">
          <button className="btn-back-map" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left"></i>
          </button>

          <div className="navbar-center">
            <span className="navbar-greeting">
              BIENVENIDO {loggedUser?.name || "Usuario"}
            </span>
          </div>

          <div className="navbar-actions">
            <button className="btn-logout" onClick={handleLogout}>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>

      {/* Card de formulario */}
      <div className="form-card">
        <h2 className="mt-3">Registrar Árbol</h2>
        <form className="tree-form-modern">
          <div className="form-group">
            <label className="text-white">Nombre del Árbol</label>
            <input
              type="text"
              placeholder="Ej. Jacarandá"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="text-white">Precio (Bs)</label>
            <input
              type="number"
              step="0.01"
              placeholder="Ej. 25.50"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          <div className="form-group full-width">
            <label className="text-white">Descripción</label>
            <textarea
              placeholder="Ej. Árbol ornamental de flores violetas..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="text-white">Categoría</label>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
            >
              <option value="">Selecciona una categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="text-white">Dirección de referencia</label>
            <input
              type="text"
              placeholder="Ej. Avenida del Bosque #123"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="form-group full-width">
            <div className="image-section-modern">
              <div
                className={`image-preview-modern ${
                  isDragging ? "dragging" : ""
                } ${images.length > 0 ? "has-images" : ""}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragEnter={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                role="button"
                tabIndex={0}
                onKeyDown={handleDropAreaKeyDown}
              >
                {images.length === 0 ? (
                  <div className="image-preview-content">
                    <i
                      className="text-white bi bi-images"
                      aria-hidden="true"
                    ></i>
                    <p className="text-white upload-instructions">
                      Arrastra y suelta aquí o haz clic para seleccionar
                      imágenes
                    </p>
                    <p className="text-white upload-hint">
                      Puedes subir varias imágenes en formato JPG o PNG
                    </p>
                  </div>
                ) : (
                  <>
                    <img
                      className="image-preview-main"
                      src={images[0].previewUrl}
                      alt={`Vista previa de ${images[0].file.name}`}
                    />
                    <div className="image-preview-overlay">
                      <span className="upload-count">
                        {images.length} imagen
                        {images.length > 1 ? "es" : ""} seleccionada
                        {images.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  </>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                multiple
                onChange={handleImage}
                style={{ display: "none" }}
              />
              <button
                type="button"
                className="btn-upload-modern"
                onClick={() => fileInputRef.current?.click()}
              >
                Subir Imagen
              </button>
              {images.length > 0 && (
                <div className="image-gallery">
                  {images.map((item) => (
                    <div className="image-thumbnail" key={item.id}>
                      <img
                        src={item.previewUrl}
                        alt={`Vista previa de ${item.file.name}`}
                      />
                      <button
                        type="button"
                        className="image-remove-button"
                        onClick={() => handleRemoveImage(item.id)}
                        aria-label={`Eliminar ${item.file.name}`}
                      >
                        <i className="bi bi-x-lg" aria-hidden="true"></i>
                      </button>
                      <span className="image-name" title={item.file.name}>
                        {item.file.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-group full-width">
            <div className="map-section-modern">
              <p className="text-white">Selecciona la ubicación en el mapa</p>
              <MapContainer
                center={[-16.5, -68.15]}
                zoom={13}
                style={{
                  height: "250px",
                  borderRadius: "15px",
                  marginTop: "10px",
                }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap"
                />
                <LocationMarker setLocation={setLocation} />
                <LocationPicker onSelect={setLocation} />
                {location && <Marker position={location} icon={treeIcon} />}
              </MapContainer>
              {location && (
                <p className="coords">
                  📍 Lat: {location.lat.toFixed(5)} | Lng:{" "}
                  {location.lng.toFixed(5)}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            className="btn-register-modern full-width"
            onClick={handleRegister}
            disabled={loading}
          >
            {loading ? "Registrando..." : "Registrar Árbol"}
          </button>
        </form>
      </div>
    </div>
  );
}
