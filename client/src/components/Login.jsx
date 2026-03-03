import React, { useState, useEffect } from "react";
import "./Login.css";
import { useNavigate, Link } from "react-router-dom";
import { useUsers } from "../context/UserContext";

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, loggedUser } = useUsers();
  
  const [formData, setFormData] = useState({
    username: "",
    password: ""
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
      [e.target.name]: e.target.value
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
        <div className="logo">
          <img src="/logo.png" alt="Logo" />
        </div>

        <h2>Iniciar Sesión</h2>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Usuario</label>
            <input 
              type="text" 
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Ingresa tu usuario"
              required
            />
          </div>

          <div className="input-group">
            <label>Contraseña</label>
            <input 
              type="password" 
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Ingresa tu contraseña"
              required
            />
          </div>

          {error && (
            <div className="error-message" style={{
              color: '#e74c3c',
              textAlign: 'center',
              marginBottom: '15px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn-login" 
            disabled={loading}
          >
            {loading ? "Iniciando..." : "Iniciar Sesión"}
          </button>
        </form>

        <p className="register-text">
          ¿No tienes cuenta? <Link to="/register">Regístrate ahora</Link>
        </p>
      </div>
    </div>
  );
}
