-- Agregar columna receipt a la tabla purchase
ALTER TABLE `adoptaarbol_database_db`.`purchase` 
ADD COLUMN `receipt` VARCHAR(255) NULL DEFAULT NULL AFTER `adminId`;

-- Comentario: La columna receipt almacenará la ruta del archivo de comprobante
