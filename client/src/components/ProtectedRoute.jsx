import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUsers } from '../context/UserContext';

const ProtectedRoute = ({ children, requiredRole = null, allowedRoles = null }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loggedUser } = useUsers();

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("MODO DESARROLLO: Acceso sin autenticación");
      return;
    }

    console.log("=== PROTECTED ROUTE DEBUG ===");
    console.log("isAuthenticated:", isAuthenticated);
    console.log("loggedUser:", loggedUser);
    console.log("requiredRole:", requiredRole);
    console.log("allowedRoles:", allowedRoles);
    console.log("loggedUser?.role:", loggedUser?.role);
    
    // Verificar si el usuario está autenticado
    if (!isAuthenticated || !loggedUser) {
      console.log("Usuario no autenticado, redirigiendo a login");
      navigate('/');
      return;
    }

    // Verificar rol si es requerido (compatibilidad con código existente)
    if (requiredRole && loggedUser.role !== requiredRole) {
      console.log(`Usuario no tiene el rol requerido: ${requiredRole}. Usuario tiene rol: ${loggedUser.role}`);
      // Redirigir según el rol del usuario
      if (loggedUser.role === 'admin') {
        navigate('/users');
      } else if (loggedUser.role === 'adoptante') {
        navigate('/home');
      } else if (loggedUser.role === 'tecnico') {
        navigate('/tecnico/tree-log');
      } else if (loggedUser.role === 'regador') {
        navigate('/regador/map');
      } else {
        navigate('/');
      }
      return;
    }

    // Verificar si el usuario tiene uno de los roles permitidos
    if (allowedRoles && Array.isArray(allowedRoles) && !allowedRoles.includes(loggedUser.role)) {
      console.log(`Usuario no tiene uno de los roles permitidos: ${allowedRoles}. Usuario tiene rol: ${loggedUser.role}`);
      // Redirigir según el rol del usuario
      if (loggedUser.role === 'admin') {
        navigate('/users');
      } else if (loggedUser.role === 'adoptante') {
        navigate('/home');
      } else if (loggedUser.role === 'tecnico') {
        navigate('/tecnico/tree-log');
      } else if (loggedUser.role === 'regador') {
        navigate('/regador/map');
      } else {
        navigate('/');
      }
      return;
    }

    // Verificar si la sesión es válida (opcional: verificar con el servidor)
    const checkSessionValidity = async () => {
      try {
        // Aquí podrías hacer una llamada al servidor para verificar la validez del token/sesión
        // Por ahora solo verificamos que el usuario tenga datos válidos
        console.log("Verificando sesión - loggedUser.id:", loggedUser.id);
        if (!loggedUser.id || loggedUser.id === undefined || loggedUser.id === null) {
          console.log("Sesión inválida, limpiando datos");
          localStorage.removeItem('loggedUser');
          navigate('/');
        } else {
          console.log("Sesión válida, continuando");
        }
      } catch (error) {
        console.error("Error verificando sesión:", error);
        localStorage.removeItem('loggedUser');
        navigate('/');
      }
    };

    checkSessionValidity();
  }, [isAuthenticated, loggedUser, navigate, requiredRole]);

  // Mostrar loading mientras se verifica la autenticación
  if (!isAuthenticated || !loggedUser) {
    console.log("Mostrando loading - no autenticado");
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#1b4d4d'
      }}>
        Verificando sesión...
      </div>
    );
  }

  // Si se requiere un rol específico, verificar (compatibilidad con código existente)
  if (requiredRole && loggedUser.role !== requiredRole) {
    console.log(`Acceso denegado - Rol requerido: ${requiredRole}, Rol del usuario: ${loggedUser.role}`);
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#e74c3c'
      }}>
        No tienes permisos para acceder a esta página
      </div>
    );
  }

  // Si se requiere uno de varios roles permitidos
  if (allowedRoles && Array.isArray(allowedRoles) && !allowedRoles.includes(loggedUser.role)) {
    console.log(`Acceso denegado - Roles permitidos: ${allowedRoles}, Rol del usuario: ${loggedUser.role}`);
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#e74c3c'
      }}>
        No tienes permisos para acceder a esta página
      </div>
    );
  }

  console.log("Acceso permitido - renderizando children");

  return children;
};

export default ProtectedRoute;
