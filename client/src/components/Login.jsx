import React, { useState, useEffect } from "react";
import "./Login.css";
import { useNavigate, Link } from "react-router-dom";
import { useUsers } from "../context/UserContext";

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, loggedUser } = useUsers();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated && loggedUser) {
      console.log("Usuario ya autenticado, redirigiendo...");
      // Redirección basada en el rol del usuario
      if (loggedUser.role === "admin") {
        navigate("/users");
      } else if (loggedUser.role === "adoptante") {
        navigate("/home");
      } else if (loggedUser.role === "tecnico") {
        navigate("/tecnico/tree-log");
      } else if (loggedUser.role === "regador") {
        navigate("/regador/map");
      }
    }
  }, [isAuthenticated, loggedUser, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(formData);

      if (result.success) {
        // Redirección basada en el rol del usuario
        if (result.user.role === "admin") {
          navigate("/users");
        } else if (result.user.role === "adoptante") {
          navigate("/home");
        } else if (result.user.role === "tecnico") {
          navigate("/tecnico/tree-log");
        } else if (result.user.role === "regador") {
          navigate("/regador/map");
        } else {
          // Rol por defecto o desconocido
          navigate("/tree-log");
        }
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        {/* Logo */}
        <div className="logo">
          <img src="/logo.png" alt="Logo AdoptaÁrbol" />
        </div>

        {/* Encabezado */}
        <h2>🌳 Bienvenido</h2>
        <p className="login-subtitle">Inicia sesión para continuar</p>

        {/* Formulario */}
        <form onSubmit={handleLogin} className="login-form">
          {/* Input Usuario */}
          <div className="input-group">
            <label htmlFor="username">Usuario</label>
            <div className="input-wrapper">
              <i className="bi bi-person-fill input-icon"></i>
              <input
                id="username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Tu usuario"
                required
                autoComplete="username"
              />
            </div>
          </div>

          {/* Input Contraseña */}
          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <div className="input-wrapper">
              <i className="bi bi-lock-fill input-icon"></i>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Tu contraseña"
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          {/* Mensaje de Error */}
          {error && (
            <div className="error-message">
              <span>⚠️ {error}</span>
            </div>
          )}

          {/* Botón Login */}
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? (
              <>
                <span>Iniciando sesión...</span>
              </>
            ) : (
              <>Iniciar Sesión</>
            )}
          </button>
        </form>

        {/* Divisor */}
        <div className="divider">O</div>

        {/* Sección de Registro */}
        <div className="register-section">
          <p className="register-text">
            ¿No tienes cuenta?
            <br />
            <Link to="/register">Regístrate ahora</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
