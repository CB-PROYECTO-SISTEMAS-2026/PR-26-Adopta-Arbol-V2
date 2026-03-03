-- ============================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS
-- PSI-Adopta-Arbol
-- ============================================

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS adoptaarbol_database_db 
CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

USE adoptaarbol_database_db;

-- ============================================
-- TABLA: user
-- ============================================
CREATE TABLE IF NOT EXISTS user (
  id SMALLINT(5) UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  lastName VARCHAR(50) NOT NULL,
  role ENUM('admin', 'adoptante', 'regador', 'tecnico') NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  photo VARCHAR(255) NULL DEFAULT NULL,
  credits DECIMAL(10,2) DEFAULT 0.00,
  point INT(11) DEFAULT 0,
  status TINYINT(1) DEFAULT 1 COMMENT '0: Inactivo, 1: Activo, 2: Pendiente',
  registerDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  lastUpdate DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  userId SMALLINT(5) UNSIGNED NULL COMMENT 'Usuario que creó o modificó',
  CONSTRAINT fk_user_user FOREIGN KEY (userId) REFERENCES user(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================
-- TABLA: category
-- ============================================
CREATE TABLE IF NOT EXISTS category (
  id SMALLINT(5) PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(30) NOT NULL,
  status TINYINT(4) DEFAULT 1 COMMENT '0: Inactivo, 1: Activo',
  registerDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  lastUpdate DATETIME DEFAULT NULL,
  userId SMALLINT(6) NULL COMMENT 'Usuario que registró o modificó la categoría',
  CONSTRAINT fk_category_user FOREIGN KEY (userId) REFERENCES user(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Tabla de categorías de árboles';

CREATE INDEX idx_category_name ON category(name);
CREATE INDEX idx_category_status ON category(status);

-- ============================================
-- TABLA: tree
-- ============================================
CREATE TABLE IF NOT EXISTS tree (
  id INT(11) PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  address VARCHAR(255) NOT NULL,
  latitude DECIMAL(10,8) NULL,
  longitude DECIMAL(11,8) NULL,
  userId SMALLINT(5) UNSIGNED NOT NULL COMMENT 'Técnico que registró el árbol',
  status TINYINT(1) DEFAULT 0 COMMENT '0: Inactivo, 1: Activo, 2: Pendiente aprobación',
  registerDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  lastUpdate DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tree_user FOREIGN KEY (userId) REFERENCES user(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE INDEX idx_tree_status ON tree(status);
CREATE INDEX idx_tree_code ON tree(code);

-- ============================================
-- TABLA: multimedia
-- ============================================
CREATE TABLE IF NOT EXISTS multimedia (
  id INT(11) PRIMARY KEY AUTO_INCREMENT,
  treeId INT(11) NOT NULL,
  path VARCHAR(255) NOT NULL,
  status TINYINT(1) DEFAULT 1 COMMENT '0: Inactivo, 1: Activo, 2: Aprobado',
  registerDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_multimedia_tree FOREIGN KEY (treeId) REFERENCES tree(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE INDEX idx_multimedia_tree ON multimedia(treeId);
CREATE INDEX idx_multimedia_status ON multimedia(status);

-- ============================================
-- TABLA: adoption
-- ============================================
CREATE TABLE IF NOT EXISTS adoption (
  id INT(11) PRIMARY KEY AUTO_INCREMENT,
  userId SMALLINT(5) UNSIGNED NOT NULL COMMENT 'Usuario adoptante',
  treeId INT(11) NOT NULL COMMENT 'Árbol adoptado',
  status TINYINT(1) DEFAULT 2 COMMENT '0: Inactivo, 1: Activo, 2: Pendiente aprobación',
  registerDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  lastUpdate DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_adoption_user FOREIGN KEY (userId) REFERENCES user(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_adoption_tree FOREIGN KEY (treeId) REFERENCES tree(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  UNIQUE KEY unique_adoption (userId, treeId, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE INDEX idx_adoption_user ON adoption(userId);
CREATE INDEX idx_adoption_tree ON adoption(treeId);
CREATE INDEX idx_adoption_status ON adoption(status);

-- ============================================
-- TABLA: irrigation
-- ============================================
CREATE TABLE IF NOT EXISTS irrigation (
  id INT(11) PRIMARY KEY AUTO_INCREMENT,
  userId SMALLINT(5) UNSIGNED NOT NULL COMMENT 'Regador que realiza el riego',
  treeId INT(11) NOT NULL COMMENT 'Árbol regado',
  status TINYINT(1) DEFAULT 0 COMMENT '0: Pendiente, 1: Completado, 2: Aprobado',
  evidence VARCHAR(255) NULL COMMENT 'Ruta de la imagen de evidencia',
  registerDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  lastUpdate DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_irrigation_user FOREIGN KEY (userId) REFERENCES user(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_irrigation_tree FOREIGN KEY (treeId) REFERENCES tree(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE INDEX idx_irrigation_user ON irrigation(userId);
CREATE INDEX idx_irrigation_tree ON irrigation(treeId);
CREATE INDEX idx_irrigation_status ON irrigation(status);

-- ============================================
-- TABLA: qrcode
-- ============================================
CREATE TABLE IF NOT EXISTS qrcode (
  id INT(11) PRIMARY KEY AUTO_INCREMENT,
  url VARCHAR(255) NOT NULL COMMENT 'Ruta del archivo QR',
  expirationDate DATETIME NULL,
  status TINYINT(1) DEFAULT 1 COMMENT '0: Inactivo, 1: Activo',
  userId SMALLINT(5) UNSIGNED NULL COMMENT 'Admin que creó el QR',
  registerDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_qrcode_user FOREIGN KEY (userId) REFERENCES user(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE INDEX idx_qrcode_status ON qrcode(status);

-- ============================================
-- TABLA: purchase
-- ============================================
CREATE TABLE IF NOT EXISTS purchase (
  id INT(11) PRIMARY KEY AUTO_INCREMENT,
  userId SMALLINT(5) UNSIGNED NOT NULL COMMENT 'Usuario que compra créditos',
  qrcodeId INT(11) NOT NULL COMMENT 'QR utilizado para la compra',
  amount DECIMAL(10,2) NOT NULL COMMENT 'Cantidad de créditos comprados',
  adminId SMALLINT(5) UNSIGNED NULL COMMENT 'Admin que validó la compra',
  receipt VARCHAR(255) NULL DEFAULT NULL COMMENT 'Ruta del comprobante de pago',
  status TINYINT(1) DEFAULT 0 COMMENT '0: Pendiente, 1: Aprobado, 2: Rechazado',
  registerDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  lastUpdate DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_purchase_user FOREIGN KEY (userId) REFERENCES user(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_purchase_qrcode FOREIGN KEY (qrcodeId) REFERENCES qrcode(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_purchase_admin FOREIGN KEY (adminId) REFERENCES user(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE INDEX idx_purchase_user ON purchase(userId);
CREATE INDEX idx_purchase_status ON purchase(status);

-- ============================================
-- TABLA: redemption
-- ============================================
CREATE TABLE IF NOT EXISTS redemption (
  id INT(11) PRIMARY KEY AUTO_INCREMENT,
  userId SMALLINT(5) UNSIGNED NOT NULL COMMENT 'Usuario que solicita canje',
  amount DECIMAL(10,2) NOT NULL COMMENT 'Cantidad de créditos a canjear',
  status TINYINT(1) DEFAULT 0 COMMENT '0: Pendiente, 1: Aprobado, 2: Rechazado',
  adminId SMALLINT(5) UNSIGNED NULL COMMENT 'Admin que procesó el canje',
  registerDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  lastUpdate DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_redemption_user FOREIGN KEY (userId) REFERENCES user(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_redemption_admin FOREIGN KEY (adminId) REFERENCES user(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE INDEX idx_redemption_user ON redemption(userId);
CREATE INDEX idx_redemption_status ON redemption(status);

-- ============================================
-- TABLA: notification
-- ============================================
CREATE TABLE IF NOT EXISTS notification (
  id INT(11) PRIMARY KEY AUTO_INCREMENT,
  userId SMALLINT(5) UNSIGNED NOT NULL COMMENT 'Usuario destinatario de la notificación',
  type VARCHAR(50) NOT NULL COMMENT 'Tipo de notificación: adoption_approved, adoption_rejected, tree_irrigated, credits_purchased, etc.',
  title VARCHAR(200) NOT NULL COMMENT 'Título de la notificación',
  message TEXT NOT NULL COMMENT 'Mensaje de la notificación',
  isRead TINYINT(1) DEFAULT 0 COMMENT '0: No leída, 1: Leída',
  status TINYINT(1) DEFAULT 1 COMMENT '0: Eliminada, 1: Activa',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación',
  readAt DATETIME NULL COMMENT 'Fecha en que se leyó',
  relatedId INT(11) NULL COMMENT 'ID relacionado (ej: adoptionId, purchaseId, etc.)',
  CONSTRAINT fk_notification_user FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Tabla de notificaciones de usuarios';

CREATE INDEX idx_notification_user ON notification(userId);
CREATE INDEX idx_notification_type ON notification(type);
CREATE INDEX idx_notification_isRead ON notification(isRead);
CREATE INDEX idx_notification_status ON notification(status);
CREATE INDEX idx_notification_createdAt ON notification(createdAt);

