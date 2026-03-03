-- Crear registro inicial en qrcode si no existe
INSERT IGNORE INTO qrcode (id, url, expirationDate, status, userId) 
VALUES (1, '/qrcodes/1.png', NULL, 1, 1);
