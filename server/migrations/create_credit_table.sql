-- =====================================================
-- TABLA: credit (Opciones de compra de créditos)
-- =====================================================

CREATE TABLE IF NOT EXISTS credit (
  id SMALLINT(5) PRIMARY KEY AUTO_INCREMENT,
  amount SMALLINT(5) NOT NULL COMMENT 'Identificador de la opción de créditos',
  price DECIMAL(5,2) NOT NULL COMMENT 'Precio en Bs',
  purchased DECIMAL(5,2) NOT NULL COMMENT 'Créditos que recibe el usuario',
  bonus DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Créditos bonificados',
  status TINYINT(1) DEFAULT 1 COMMENT '0: Inactivo (delete lógico), 1: Activo',
  registerDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  lastUpdate DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Tabla de opciones de compra de créditos';

-- Índices para búsqueda y filtrado
CREATE INDEX idx_credit_status ON credit(status);
CREATE INDEX idx_credit_price ON credit(price);

-- Datos iniciales (ejemplo)
INSERT INTO credit (amount, price, purchased, bonus, status) VALUES
(10, 10.00, 10.00, 0.00, 1),
(20, 18.00, 20.00, 2.00, 1),
(50, 45.00, 50.00, 5.00, 1),
(100, 88.00, 100.00, 12.00, 1),
(200, 200.00, 200.00, 0.00, 1);
