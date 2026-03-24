-- Migración: Agregar columnas faltantes a la tabla irrigation
ALTER TABLE `irrigation` 
ADD COLUMN `reward` DECIMAL(10,2) DEFAULT '0.00' AFTER `treeId`,
ADD COLUMN `observations` TEXT DEFAULT NULL AFTER `evidence`;

