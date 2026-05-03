import React, { useState } from "react";
import "./CreateAccount.css";
import { useNavigate, Link } from "react-router-dom";
import { useUsers } from "../context/UserContext";

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
        result.message ||
          "Su cuenta ha sido creada exitosamente. Verifique sus credenciales de acceso en su correo electrónico.",
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

      <h2>Crear Cuenta</h2>

      <form onSubmit={handleRegister}>
        {/* Campo: Nombre */}
        <div className="input-group">
          <label>Nombre</label>
          <div className="input-with-icon">
            <i className="bi bi-person-fill input-icon"></i>
            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Ingresa tu nombre" required />
          </div>
          {fieldErrors.name && (
            <span className="error-message" style={{ color: '#ff5252', fontSize: '12px', marginTop: '-105px', marginBottom: '-105pxnch' }}>
              {fieldErrors.name}
            </span>
          )}
        </div>

        {/* Campo: Apellido */}
        <div className="input-group">
          <label>Apellido</label>
          <div className="input-with-icon">
            <i className="bi bi-person-vcard-fill input-icon"></i>
            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Ingresa tu apellido" required />
          </div>
          {fieldErrors.lastName && (
            <span className="error-message" style={{ color: '#ff5252', fontSize: '12px', marginTop: '-105px', marginBottom: '-105px' }}>
              {fieldErrors.lastName}
            </span>
          )}
        </div>

        {/* Campo: Correo */}
        <div className="input-group">
          <label>Correo Electrónico</label>
          <div className="input-with-icon">
            <i className="bi bi-envelope-fill input-icon"></i>
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="ejemplo@correo.com" required />
          </div>
          {fieldErrors.email && (
            <span className="error-message" style={{ color: '#ff5252', fontSize: '12px', marginTop: '-105px', marginBottom: '-105px' }}>
              {fieldErrors.email}
            </span>
          )}
        </div>

        {/* Campo: Contraseña */}
        <div className="input-group">
          <label>Contraseña</label>
          <div className="input-with-icon">
            <i className="bi bi-lock-fill input-icon"></i>
            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Crea una contraseña" required />
          </div>
          {fieldErrors.password && (
            <span className="error-message" style={{ color: '#ff5252', fontSize: '12px', marginTop: '-105px', marginBottom: '-105px' }}>
              {fieldErrors.password}
            </span>
          )}
        </div>

        {/* Campo: Confirmar Contraseña */}
        <div className="input-group">
          <label>Confirmar Contraseña</label>
          <div className="input-with-icon">
            <i className="bi bi-shield-lock-fill input-icon"></i>
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Repite tu contraseña" required />
          </div>
          {fieldErrors.confirmPassword && (
            <span className="error-message" style={{ color: '#ff5252', fontSize: '12px', marginTop: '-105px', marginBottom: '-105px'}}>
              {fieldErrors.confirmPassword}
            </span>
          )}
        </div>

        {/* Alertas generales */}
        {error && <div className="alert-message error-alert" style={{ color: '#ff5252', fontSize: '13px', marginTop: '12px', marginBottom: '12px' }}>{error}</div>}
        {success && <div className="alert-message success-alert">{success}</div>}

        <button type="submit" className="btn-register" disabled={loading}>
          {loading ? "Creando cuenta..." : "Crear Cuenta"}
        </button>
      </form>

      <p className="login-text">
        ¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
      </p>
      
    </div>
  </div>
);
}
