-- ============================================
-- DATOS DE EJEMPLO
-- PSI-Adopta-Arbol
-- ============================================

USE adoptaarbol_database_db;

-- Insertar usuario administrador
INSERT INTO user (name, lastName, role, username, password, email, credits, point, status) 
VALUES ('Admin', 'Sistema', 'admin', 'admin', 'admin123', 'admin@adoptaarbol.com', 0, 0, 1);

-- Insertar usuario técnico
INSERT INTO user (name, lastName, role, username, password, email, credits, point, status, userId) 
VALUES ('Juan', 'Pérez', 'tecnico', 'juan_perez', 'tecnico123', 'juan@example.com', 0, 0, 1, 1);

-- Insertar usuario regador
INSERT INTO user (name, lastName, role, username, password, email, credits, point, status, userId) 
VALUES ('María', 'González', 'regador', 'maria_gonzalez', 'regador123', 'maria@example.com', 0, 0, 1, 1);

-- Insertar usuario adoptante
INSERT INTO user (name, lastName, role, username, password, email, credits, point, status) 
VALUES ('Carlos', 'Rodríguez', 'adoptante', 'carlos_rodriguez', 'adoptante123', 'carlos@example.com', 100.00, 0, 1);

-- Insertar categorías
INSERT INTO category (name, status, userId) VALUES 
('Árboles Frutales', 1, 1),
('Árboles Ornamentales', 1, 1),
('Árboles Nativos', 1, 1);

-- Insertar código QR inicial
INSERT INTO qrcode (id, url, expirationDate, status, userId) 
VALUES (1, '/qrcodes/1.png', NULL, 1, 1);

-- Insertar árboles de ejemplo
INSERT INTO tree (name, description, code, price, address, latitude, longitude, userId, status) 
VALUES 
('Eucalipto', 'Árbol de gran altura, ideal para espacios amplios', 'ARB-001', 50.00, 'Av. Principal 123', -16.5000, -68.1500, 2, 2),
('Pino', 'Árbol perenne, resistente a diferentes climas', 'ARB-002', 45.00, 'Calle Los Olivos 456', -16.5100, -68.1600, 2, 2),
('Cedro', 'Árbol de madera valiosa, crecimiento lento', 'ARB-003', 60.00, 'Plaza Central', -16.5200, -68.1700, 2, 1);

-- Insertar imágenes de árboles (ajustar paths según archivos reales)
INSERT INTO multimedia (treeId, path, status) 
VALUES 
(1, '/Tree/tree-1760404759169-633033552.png', 2),
(2, '/Tree/tree-1760405002646-864194627.png', 2),
(3, '/Tree/tree-1760405161842-988836269.jpg', 2);

