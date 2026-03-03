import { createContext, useContext, useState, useEffect } from "react";
import {
  loginRequest,
  getUsersRequest,
  deleteUserRequest,
  createUserRequest,
  registerUserRequest,
  acceptUserRequest,
  refreshUserDataRequest,
} from "../api/user.api.js";

export const UserContext = createContext();

// Custom hook para usar el contexto
export const useUsers = () => {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useUsers must be used within a UserContextProvider");
  }
  return context;
};

// Proveedor del contexto
export const UserContextProvider = ({ children }) => {
  // Estado de usuarios
  const [users, setUsers] = useState([]);
  
  // Estado de autenticación
  const [loggedUser, setLoggedUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar si hay un usuario logueado al cargar la aplicación
  useEffect(() => {
    const savedUser = localStorage.getItem('loggedUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      console.log("=== CARGA DESDE LOCALSTORAGE ===");
      console.log("Usuario cargado desde localStorage:", user);
      console.log("ID del usuario:", user.id);
      console.log("Tipo del ID:", typeof user.id);
      console.log("ID es undefined:", user.id === undefined);
      console.log("ID es null:", user.id === null);
      console.log("ID es 'undefined':", user.id === 'undefined');
      
      // Validar que el ID sea válido
      if (user.id && user.id !== undefined && user.id !== null && user.id !== 'undefined') {
        setLoggedUser(user);
        setIsAuthenticated(true);
      } else {
        console.error("ID de usuario inválido en localStorage, limpiando datos");
        localStorage.removeItem('loggedUser');
      }
    }
  }, []);

  // Login de usuario
  const login = async (credentials) => {
    try {
      const response = await loginRequest(credentials);
      const user = response.data.user;
      
      console.log("=== LOGIN EXITOSO ===");
      console.log("Usuario recibido del login:", user);
      console.log("ID del usuario en login:", user.id);
      console.log("Tipo del ID:", typeof user.id);
      
      // Validar que el usuario tenga un ID válido
      if (!user.id || user.id === undefined || user.id === null) {
        console.error("Error: Usuario sin ID válido recibido del login");
        return { 
          success: false, 
          message: "Error: Datos de usuario incompletos" 
        };
      }
      
      setLoggedUser(user);
      setIsAuthenticated(true);
      
      // Guardar en localStorage para persistencia
      localStorage.setItem('loggedUser', JSON.stringify(user));
      console.log("Usuario guardado en localStorage:", user);
      
      return { success: true, user, message: response.data.message };
    } catch (error) {
      console.error("Error en login:", error);
      return { 
        success: false, 
        message: error.response?.data?.message || "Error de conexión" 
      };
    }
  };

  // Logout de usuario
  const logout = () => {
    console.log("=== INICIANDO LOGOUT ===");
    
    // Limpiar estado del contexto
    setLoggedUser(null);
    setIsAuthenticated(false);
    
    // Limpiar localStorage completamente
    localStorage.removeItem('loggedUser');
    localStorage.clear(); // Limpiar todo el localStorage por seguridad
    
    // Limpiar sessionStorage también
    sessionStorage.clear();
    
    // Limpiar cookies si las hay (opcional)
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toISOString() + ";path=/");
    });
    
    console.log("=== LOGOUT COMPLETADO ===");
    console.log("Estado limpiado, localStorage y sessionStorage vaciados");
    
    // Forzar recarga de la página para limpiar completamente el estado
    window.location.href = '/';
  };

  // Cargar Usuarios
  async function loadUsers() {
    const response = await getUsersRequest();
    setUsers(response.data);
    console.log(response.data);
  }

  // Eliminar Usuario
  const deleteUser = async (id) => {
    try {
      if (!loggedUser) {
        throw new Error("Debes estar logueado para eliminar usuarios");
      }
      
      const deletedBy = loggedUser.id; // Usar ID del usuario logueado
      console.log("Eliminando usuario con deletedBy:", deletedBy);
      const response = await deleteUserRequest(id, deletedBy);
      setUsers(users.filter((user) => user.id !== id));
      console.log(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  // Crear Usuario (ahora con auditoría del usuario logueado)
  const createUser = async (userData) => {
    try {
      if (!loggedUser) {
        throw new Error("Debes estar logueado para crear usuarios");
      }
      
      // Agregar el ID del usuario logueado para auditoría
      const userDataWithAudit = {
        ...userData,
        userId: loggedUser.id // Usar ID del usuario logueado
      };
      
      const response = await createUserRequest(userDataWithAudit);
      // Agregar el nuevo usuario al estado local
      setUsers(prevUsers => [...prevUsers, response.data]);
      return response.data;
    } catch (error) {
      console.error("Error en contexto:", error);
      throw error;
    }
  };

  // Registrar Usuario (auto-registro)
  const registerUser = async (userData) => {
    try {
      const response = await registerUserRequest(userData);
      return response.data;
    } catch (error) {
      console.error("Error en registro:", error);
      throw error;
    }
  };

  // Aceptar Usuario
  const acceptUser = async (id) => {
    try {
      if (!loggedUser) {
        throw new Error("Debes estar logueado para aceptar usuarios");
      }
      
      const acceptedBy = loggedUser.id; // Usar ID del usuario logueado
      console.log("Aceptando usuario con acceptedBy:", acceptedBy);
      const response = await acceptUserRequest(id, acceptedBy);
      
      // Actualizar el usuario en el estado local
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === id 
            ? { ...user, status: 1, userId: acceptedBy, lastUpdate: new Date().toISOString() }
            : user
        )
      );
      
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error("Error aceptando usuario:", error);
      throw error;
    }
  };

  // Actualizar créditos del usuario logueado
  const updateUserCredits = (newCredits) => {
    if (loggedUser) {
      const updatedUser = { ...loggedUser, credits: newCredits };
      setLoggedUser(updatedUser);
      localStorage.setItem('loggedUser', JSON.stringify(updatedUser));
    }
  };

  // Refrescar datos del usuario desde la base de datos
  const refreshUserData = async () => {
    console.log("=== REFRESCAR DATOS DE USUARIO ===");
    console.log("loggedUser:", loggedUser);
    console.log("loggedUser?.id:", loggedUser?.id);
    
    if (loggedUser?.id) {
      try {
        console.log("Solicitando datos actualizados para usuario ID:", loggedUser.id);
        const response = await refreshUserDataRequest(loggedUser.id);
        const updatedUser = response.data;
        
        console.log("Datos actualizados recibidos:", updatedUser);
        console.log("ID del usuario actualizado:", updatedUser.id);
        console.log("Tipo del ID:", typeof updatedUser.id);
        
        setLoggedUser(updatedUser);
        localStorage.setItem('loggedUser', JSON.stringify(updatedUser));
        console.log("Usuario actualizado en contexto y localStorage");
        
        return updatedUser;
      } catch (error) {
        console.error("Error al refrescar datos del usuario:", error);
        throw error;
      }
    } else {
      console.warn("No se puede refrescar: no hay ID de usuario disponible");
    }
  };

  return (
    <UserContext.Provider value={{ 
      // Estados de usuarios
      users, 
      loadUsers, 
      deleteUser, 
      createUser,
      registerUser,
      acceptUser,
      // Estados de autenticación
      loggedUser,
      isAuthenticated,
      login,
      logout,
      updateUserCredits,
      refreshUserData
    }}>
      {children}
    </UserContext.Provider>
  );
};
