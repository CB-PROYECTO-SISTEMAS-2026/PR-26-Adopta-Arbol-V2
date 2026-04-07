import React, { useEffect } from "react";
import { Form, Formik, Field } from "formik";
import "./CreateUser.css";
import { useUsers } from "../context/UserContext.jsx";
import { useNotification } from "../context/NotificationContext.jsx";

function CreateUser({ isOpen, onClose }) {
  // Acceder a la función createUser del contexto y al usuario logueado
  const { createUser, loggedUser } = useUsers();
  const { showSuccess, showError, showWarning } = useNotification();

  // Función de validación para nombre y apellido
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

  // Función de validación para email
  const validateEmail = (value) => {
    if (!value) return "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return "Por favor ingresa un correo electrónico válido";
    }
    return "";
  };

  const handleSubmit = async (values, actions) => {
    try {
      // Verificar que el usuario esté logueado
      if (!loggedUser) {
        showError("Debes estar logueado para crear usuarios");
        return;
      }

      // Aplicar trim a los valores antes de enviar
      const trimmedValues = {
        ...values,
        name: values.name.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
      };

      // Validar nuevamente antes de enviar
      const nameError = validateName(trimmedValues.name);
      const lastNameError = validateName(trimmedValues.lastName);
      const emailError = validateEmail(trimmedValues.email);

      if (nameError || lastNameError || emailError) {
        actions.setErrors({
          nameError: nameError || undefined,
          lastNameError: lastNameError || undefined,
          emailError: emailError || undefined,
        });
        showError("Por favor corrige los errores en el formulario");
        return;
      }

      // Validar campos requeridos
      if (
        !trimmedValues.name ||
        !trimmedValues.lastName ||
        !trimmedValues.email ||
        !trimmedValues.role
      ) {
        showError("Todos los campos son obligatorios");
        return;
      }

      const finalData = {
        ...trimmedValues,
        status: 1,
        userId: loggedUser.id, // Usar el ID del usuario logueado
      };

      console.log("Datos del formulario completos:", finalData);

      const response = await createUser(finalData);

      console.log("✅ Usuario creado con éxito:", response);

      if (response?.emailSent) {
        showSuccess(
          `Usuario creado exitosamente!\n\nSe ha enviado un correo a: ${trimmedValues.email}`,
        );
      } else {
        showWarning(
          "Usuario creado, pero no se pudo enviar el correo de credenciales.",
        );
      }

      // Limpiar formulario
      actions.resetForm();

      // Cerrar modal
      onClose();
    } catch (error) {
      console.error("❌ Error al crear el usuario:", error);

      if (error.response) {
        // Error del servidor
        showError(
          `Error del servidor: ${error.response.data.message || "Error desconocido"}`,
        );
      } else if (error.request) {
        // Error de conexión
        showError(
          "Error de conexión. Verifica que el servidor esté ejecutándose.",
        );
      } else {
        // Otro error
        showError(`Error: ${error.message}`);
      }

      // No cerrar el modal si hay error
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      // Deshabilitar scroll del body
      document.body.style.overflow = "hidden";
      // Agregar clase para desactivar interacciones
      document.body.classList.add("modal-open");
    } else {
      // Restaurar scroll del body
      document.body.style.overflow = "unset";
      // Remover clase
      document.body.classList.remove("modal-open");
    }

    // Cleanup al desmontar el componente
    return () => {
      document.body.style.overflow = "unset";
      document.body.classList.remove("modal-open");
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="create-user-modal">
        {/* Botón cerrar */}
        <button className="modal-close-btn" onClick={onClose}>
          <i className="bi bi-x-lg"></i>
        </button>

        {/* Header con fondo verde */}
        <div className="form-header">
          <div className="tree-icon">
            <i className="bi bi-tree-fill"></i>
          </div>
        </div>

        {/* Formulario */}
        <div className="form-body">
          <h1 className="form-title">CREAR CUENTA</h1>

          <Formik
            initialValues={{
              name: "",
              lastName: "",
              email: "",
              role: "",
            }}
            onSubmit={handleSubmit}
          >
            {({
              isSubmitting,
              values,
              errors,
              touched,
              setFieldValue,
              handleChange,
            }) => {
              // Manejar cambios con validación en tiempo real
              const handleFieldChange = (e) => {
                const { name, value } = e.target;
                let processedValue = value;

                // Aplicar trim al inicio para nombre y apellido
                if (name === "name" || name === "lastName") {
                  processedValue = value.trimStart();
                  // Actualizar el valor del campo
                  setFieldValue(name, processedValue);
                  // Validar en tiempo real y actualizar el error
                  const error = validateName(processedValue);
                  if (error) {
                    setFieldValue(`${name}Error`, error);
                  } else {
                    // Limpiar el error si no hay
                    setFieldValue(`${name}Error`, undefined);
                  }
                } else if (name === "email") {
                  // Actualizar el valor del campo
                  setFieldValue(name, processedValue);
                  // Validar en tiempo real y actualizar el error
                  const error = validateEmail(processedValue);
                  if (error) {
                    setFieldValue(`${name}Error`, error);
                  } else {
                    // Limpiar el error si no hay
                    setFieldValue(`${name}Error`, undefined);
                  }
                } else {
                  // Para otros campos (como role), usar handleChange normal
                  handleChange(e);
                }
              };

              return (
                <Form className="user-form">
                  <div className="form-group">
                    <label htmlFor="name" className="form-label">
                      Nombres
                    </label>
                    <Field
                      type="text"
                      id="name"
                      name="name"
                      className="form-input"
                      placeholder="Ingresa el nombre completo"
                      onChange={handleFieldChange}
                    />
                    {/* Error para nombre */}
                    {errors.nameError && (
                      <div
                        className="error-message"
                        style={{
                          color: "#e74c3c",
                          fontSize: "12px",
                          marginTop: "5px",
                        }}
                      >
                        {errors.nameError}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="lastName" className="form-label">
                      Apellidos
                    </label>
                    <Field
                      type="text"
                      id="lastName"
                      name="lastName"
                      className="form-input"
                      placeholder="Ingresa los apellidos"
                      onChange={handleFieldChange}
                    />
                    {/* Error para apellido */}
                    {errors.lastNameError && (
                      <div
                        className="error-message"
                        style={{
                          color: "#e74c3c",
                          fontSize: "12px",
                          marginTop: "5px",
                        }}
                      >
                        {errors.lastNameError}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="role" className="form-label">
                      Rol
                    </label>
                    <Field
                      as="select"
                      id="role"
                      name="role"
                      className="form-input"
                    >
                      <option value="">Seleccionar rol</option>
                      <option value="tecnico">Técnico</option>
                      <option value="regador">Regador</option>
                    </Field>
                  </div>

                  <div className="form-group">
                    <label htmlFor="email" className="form-label">
                      Correo Electrónico
                    </label>
                    <Field
                      type="email"
                      id="email"
                      name="email"
                      className="form-input"
                      placeholder="ejemplo@correo.com"
                      onChange={handleFieldChange}
                    />
                    {/* Error para email */}
                    {errors.emailError && (
                      <div
                        className="error-message"
                        style={{
                          color: "#e74c3c",
                          fontSize: "12px",
                          marginTop: "5px",
                        }}
                      >
                        {errors.emailError}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={isSubmitting}
                  >
                    Crear Usuario
                  </button>
                </Form>
              );
            }}
          </Formik>
        </div>
      </div>
    </div>
  );
}

export default CreateUser;
