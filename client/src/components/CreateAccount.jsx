import React, { useState } from "react";
import "./CreateAccount.css";
import { useNavigate, Link } from "react-router-dom";
import { useUsers } from "../context/UserContext";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function CreateAccount() {
  const navigate = useNavigate();
  const { registerUser } = useUsers();

  const [formData, setFormData] = useState({
    name: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    name: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const validateName = (value) => {
    if (!value) return "";

    // Verificar espacios al final
    if (value !== value.trimEnd()) {
      return "No se permiten espacios al final";
    }

    // Verificar caracteres no permitidos (números y caracteres especiales)
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
      return "Solo se permiten letras y espacios (no números ni caracteres especiales)";
    }

    return "";
  };

  const validatePassword = (value) => {
    const errors = [];
    if (value.length > 0) {
      if (!/[A-Z]/.test(value)) {
        errors.push("Debe contener al menos una mayúscula");
      }
      if (!/[a-z]/.test(value)) {
        errors.push("Debe contener al menos una minúscula");
      }
      if (!/[0-9]/.test(value)) {
        errors.push("Debe contener al menos un número");
      }
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
        errors.push("Debe contener al menos un carácter especial");
      }
    }
    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    let fieldError = "";

    // Validación y procesamiento según el campo
    if (name === "name" || name === "lastName") {
      // Aplicar trim automático de espacios al inicio, pero permitir escribir todo
      processedValue = value.trimStart();
      // Validar y mostrar error si hay caracteres no permitidos, pero permitir escribir
      fieldError = validateName(processedValue);
    } else if (name === "password") {
      processedValue = value;
      const passwordErrors = validatePassword(processedValue);
      fieldError = passwordErrors.join(". ");
      // Validar también confirmPassword si ya tiene valor
      if (formData.confirmPassword) {
        const confirmError =
          processedValue !== formData.confirmPassword
            ? "Las contraseñas no coinciden"
            : "";
        setFieldErrors((prev) => ({
          ...prev,
          confirmPassword: confirmError,
        }));
      }
    } else if (name === "confirmPassword") {
      processedValue = value;
      if (value && value !== formData.password) {
        fieldError = "Las contraseñas no coinciden";
      }
    } else if (name === "email") {
      processedValue = value;
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        fieldError = "Por favor ingresa un correo electrónico válido";
      }
    }

    setFormData({
      ...formData,
      [name]: processedValue,
    });

    setFieldErrors((prev) => ({
      ...prev,
      [name]: fieldError,
    }));

    // Limpiar error general
    setError("");
  };

  const validateForm = () => {
    const errors = { ...fieldErrors };
    let hasErrors = false;

    // Validar nombre
    if (!formData.name.trim()) {
      errors.name = "El nombre es obligatorio";
      hasErrors = true;
    } else {
      const nameError = validateName(formData.name.trim());
      if (nameError) {
        errors.name = nameError;
        hasErrors = true;
      }
    }

    // Validar apellido
    if (!formData.lastName.trim()) {
      errors.lastName = "El apellido es obligatorio";
      hasErrors = true;
    } else {
      const lastNameError = validateName(formData.lastName.trim());
      if (lastNameError) {
        errors.lastName = lastNameError;
        hasErrors = true;
      }
    }
    if (!formData.email) {
      errors.email = "El correo electrónico es obligatorio";
      hasErrors = true;
    }
    if (!formData.password) {
      errors.password = "La contraseña es obligatoria";
      hasErrors = true;
    }
    if (!formData.confirmPassword) {
      errors.confirmPassword = "Confirma tu contraseña";
      hasErrors = true;
    }

    // Validar coincidencia de contraseñas
    if (
      formData.password &&
      formData.confirmPassword &&
      formData.password !== formData.confirmPassword
    ) {
      errors.confirmPassword = "Las contraseñas no coinciden";
      hasErrors = true;
    }

    // Validar requisitos de contraseña
    const passwordErrors = validatePassword(formData.password);
    if (formData.password && passwordErrors.length > 0) {
      errors.password = passwordErrors.join(". ");
      hasErrors = true;
    }

    setFieldErrors(errors);

    if (hasErrors || Object.values(errors).some((err) => err !== "")) {
      setError("Por favor corrige los errores en el formulario");
      return false;
    }

    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Aplicar trim completo antes de validar
    const trimmedData = {
      ...formData,
      name: formData.name.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
    };

    setFormData(trimmedData);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const registrationData = {
        name: trimmedData.name,
        lastName: trimmedData.lastName,
        email: trimmedData.email,
        password: trimmedData.password,
      };

      const result = await registerUser(registrationData);

      setSuccess(
        `¡Cuenta creada exitosamente! Tu nombre de usuario es: ${result.username}. Tu solicitud está pendiente de aprobación.`,
      );
      setFormData({
        name: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Error al crear la cuenta. Intenta nuevamente.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <div className="logo">
          <img src="/logo.png" alt="Logo" />
        </div>

        <h2>🌳 Crear Cuenta</h2>
        <p className="register-subtitle">Crea tu cuenta para adoptar árboles</p>

        <form onSubmit={handleRegister}>
          <div className="input-group">
            <label htmlFor="name">Nombre</label>
            <div className="input-wrapper">
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Tu nombre"
                autoComplete="given-name"
                required
              />
              <i className="bi bi-person input-icon"></i>
            </div>
            {fieldErrors.name && (
              <div className="error-message">{fieldErrors.name}</div>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="lastName">Apellido</label>
            <div className="input-wrapper">
              <input
                id="lastName"
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Tu apellido"
                autoComplete="family-name"
                required
              />
              <i className="bi bi-person input-icon"></i>
            </div>
            {fieldErrors.lastName && (
              <div className="error-message">{fieldErrors.lastName}</div>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="email">Correo Electrónico</label>
            <div className="input-wrapper">
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="tu@correo.com"
                autoComplete="email"
                required
              />
              <i className="bi bi-envelope input-icon"></i>
            </div>
            {fieldErrors.email && (
              <div className="error-message">{fieldErrors.email}</div>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <div className="input-wrapper">
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Crea una contraseña securaa"
                autoComplete="new-password"
                required
              />
              <i className="bi bi-lock input-icon"></i>
            </div>
            {fieldErrors.password && (
              <div className="error-message">{fieldErrors.password}</div>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword">Confirmar Contraseña</label>
            <div className="input-wrapper">
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repite tu contraseña"
                autoComplete="new-password"
                required
              />
              <i className="bi bi-lock input-icon"></i>
            </div>
            {fieldErrors.confirmPassword && (
              <div className="error-message">{fieldErrors.confirmPassword}</div>
            )}
          </div>

          {error && <div className="error-message">⚠️ {error}</div>}

          {success && <div className="success-message">✓ {success}</div>}

          <button type="submit" className="btn-register" disabled={loading}>
            {loading ? "Creando cuenta..." : "Crear Cuenta"}
          </button>
        </form>

        <div className="divider">O</div>

        <div className="login-section">
          <p className="login-text">
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
