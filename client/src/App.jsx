import React from "react";
import TreeAdoption from "./components/TreeAdoption";
import AdminDashboard from "./pages/AdminDashboard"; // Página de administración de usuarios
import BuyCredits from "./components/BuyCredits";
import UserBuyCredits from "./components/UserBuyCredits";
import QRCodeDisplay from "./components/QRCodeDisplay";
import FinalViewCard from "./components/FinalViewCard";
import VisitTree from "./components/VisitTree";
import AdminTree from "./components/AdminTree"; //Componente de administración de árboles
import AdminIrrigation from "./components/AdminIrrigation"; //Componente de administración de riegos
import TreeHome from "./components/TreeHome";
import Ranking from "./components/Ranking";
import IrrigatorRanking from "./components/IrrigatorRanking";
import TreeLog from "./components/TreeLog";
import CreateAccount from "./components/CreateAccount";
import AdoptTree from "./pages/AdoptTree";
import IrrigateTree from "./pages/IrrigateTree";
import IrrigatorMap from "./components/IrrigatorMap"; // Componente para regadores
import IrrigatorConfirm from "./components/IrrigatorConfirm"; // Componente para confirmar riego
import IrrigatorCredits from "./components/IrrigatorCredits"; // Componente para cobro de créditos del regador
import ProtectedRoute from "./components/ProtectedRoute";
import { Route, Routes } from "react-router-dom";
import SideNavbar from "./components/SideNavbar";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import AdminAdoption from "./components/AdminAdoption";
import AdminQrCode from "./components/AdminQrCode";
import AdminCategory from "./components/AdminCategory";
import MyTrees from "./components/MyTrees";
import LandPage from "./components/LandPage";

import { Link } from "react-router-dom";
import { UserContextProvider } from "./context/UserContext.jsx";
import { IrrigationContextProvider } from "./context/IrrigationContext.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import NotificationContainer from "./components/NotificationContainer.jsx";
import ConfirmDialog from "./components/ConfirmDialog.jsx";

import Login from "./components/Login";

function App() {
  return (
    <UserContextProvider>
      <IrrigationContextProvider>
        <NotificationProvider>
          <NotificationContainer />
          <ConfirmDialog />
          <Routes>
            {/* Ruta de la página de inicio (LandPage) */}
            <Route path="/" element={<LandPage />} />

            {/* Rutas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<CreateAccount />} />

            {/* Rutas de usuario protegidas (sin navbar de admin) */}
            <Route
              path="/visit-tree"
              element={
                <ProtectedRoute requiredRole="adoptante">
                  <VisitTree />
                </ProtectedRoute>
              }
            />
            <Route
              path="/home"
              element={
                <ProtectedRoute requiredRole="adoptante">
                  <TreeHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tree-home"
              element={
                <ProtectedRoute requiredRole="adoptante">
                  <TreeHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ranking"
              element={
                <ProtectedRoute allowedRoles={["adoptante", "regador"]}>
                  <Ranking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tree-log"
              element={
                <ProtectedRoute requiredRole="adoptante">
                  <TreeLog />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tecnico/tree-log"
              element={
                <ProtectedRoute requiredRole="tecnico">
                  <TreeLog />
                </ProtectedRoute>
              }
            />
            <Route
              path="/regador/map"
              element={
                <ProtectedRoute requiredRole="regador">
                  <IrrigatorMap />
                </ProtectedRoute>
              }
            />
            <Route
              path="/regador/confirm/:id"
              element={
                <ProtectedRoute requiredRole="regador">
                  <IrrigatorConfirm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/regador/credits"
              element={
                <ProtectedRoute requiredRole="regador">
                  <IrrigatorCredits />
                </ProtectedRoute>
              }
            />
            <Route
              path="/regador/ranking"
              element={
                <ProtectedRoute requiredRole="regador">
                  <IrrigatorRanking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/adopt-tree/:treeId"
              element={
                <ProtectedRoute requiredRole="adoptante">
                  <AdoptTree />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user-buy-credits"
              element={
                <ProtectedRoute requiredRole="adoptante">
                  <UserBuyCredits />
                </ProtectedRoute>
              }
            />
            <Route
              path="/qr-display"
              element={
                <ProtectedRoute requiredRole="adoptante">
                  <QRCodeDisplay />
                </ProtectedRoute>
              }
            />
            <Route
              path="/purchase-review"
              element={
                <ProtectedRoute requiredRole="adoptante">
                  <FinalViewCard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-trees"
              element={
                <ProtectedRoute requiredRole="adoptante">
                  <MyTrees />
                </ProtectedRoute>
              }
            />
            <Route
              path="/irrigate-tree/:treeId"
              element={
                <ProtectedRoute requiredRole="adoptante">
                  <IrrigateTree />
                </ProtectedRoute>
              }
            />

            {/* Rutas de administración protegidas (con navbar de admin) */}
            <Route
              path="/users"
              element={
                <ProtectedRoute requiredRole="admin">
                  <div className="app-layout">
                    <SideNavbar />
                    <div className="app-content">
                      <AdminDashboard />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/adopt"
              element={
                <ProtectedRoute requiredRole="admin">
                  <div className="app-layout">
                    <SideNavbar />
                    <div className="app-content">
                      <AdminAdoption />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/buy-credits"
              element={
                <ProtectedRoute requiredRole="admin">
                  <div className="app-layout">
                    <SideNavbar />
                    <div className="app-content">
                      <BuyCredits />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/tree"
              element={
                <ProtectedRoute requiredRole="admin">
                  <div className="app-layout">
                    <SideNavbar />
                    <div className="app-content">
                      <AdminTree />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/irrigation"
              element={
                <ProtectedRoute requiredRole="admin">
                  <div className="app-layout">
                    <SideNavbar />
                    <div className="app-content">
                      <AdminIrrigation />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/AdminQr"
              element={
                <ProtectedRoute requiredRole="admin">
                  <div className="app-layout">
                    <SideNavbar />
                    <div className="app-content">
                      <AdminQrCode />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/AdminCategory"
              element={
                <ProtectedRoute requiredRole="admin">
                  <div className="app-layout">
                    <SideNavbar />
                    <div className="app-content">
                      <AdminCategory />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </NotificationProvider>
      </IrrigationContextProvider>
    </UserContextProvider>
  );
}

export default App;
