import React from "react";
import { Route, Routes } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

import AdminDashboard from "./pages/AdminDashboard"; // Página de administración de usuarios
import BuyCredits from "./components/BuyCredits";
import UserBuyCredits from "./components/UserBuyCredits";
import QRCodeDisplay from "./components/QRCodeDisplay";
import FinalViewCard from "./components/FinalViewCard";
import VisitTree from "./components/VisitTree";
import TreeHome from "./components/TreeHome";
import Ranking from "./components/Ranking";
import TreeLog from "./components/TreeLog";
import AdoptTree from "./pages/AdoptTree";
import IrrigateTree from "./pages/IrrigateTree";
import MyTrees from "./components/MyTrees";
import {
  AdminAdoption,
  AdminCategory,
  AdminIrrigation,
  AdminPayments,
  AdminQrCode,
  AdminRedemptions,
  AdminTree,
  SideNavbar,
} from "./components/admin";
import { CreateAccount, Login } from "./components/auth";
import {
  IrrigatorConfirm,
  IrrigatorCredits,
  IrrigatorMap,
  IrrigatorRanking,
} from "./components/irrigator";
import { LandPage } from "./components/landing";
import {
  ConfirmDialog,
  NotificationContainer,
  ProtectedRoute,
} from "./components/shared";
import { UserContextProvider } from "./context/UserContext.jsx";
import { IrrigationContextProvider } from "./context/IrrigationContext.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";

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
            <Route
              path="/admin/redemptions"
              element={
                <ProtectedRoute requiredRole="admin">
                  <div className="app-layout">
                    <SideNavbar />
                    <div className="app-content">
                      <AdminRedemptions />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/payments"
              element={
                <ProtectedRoute requiredRole="admin">
                  <div className="app-layout">
                    <SideNavbar />
                    <div className="app-content">
                      <AdminPayments />
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
