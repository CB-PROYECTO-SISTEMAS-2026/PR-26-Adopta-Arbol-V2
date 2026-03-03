-- Crear tabla de categorías si no existe
CREATE TABLE IF NOT EXISTS category (
  id SMALLINT(5) PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(30) NOT NULL,
  status TINYINT(4) DEFAULT 1 COMMENT '0: Inactivo, 1: Activo',
  registerDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  lastUpdate DATETIME DEFAULT NULL,
  userId SMALLINT(6) NULL COMMENT 'Usuario que registró o modificó la categoría',
  CONSTRAINT fk_category_user FOREIGN KEY (userId) REFERENCES user(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Tabla de categorías de árboles';

-- Índice para búsquedas por nombre
CREATE INDEX idx_category_name ON category(name);

-- Índice para búsquedas por estado
CREATE INDEX idx_category_status ON category(status);
