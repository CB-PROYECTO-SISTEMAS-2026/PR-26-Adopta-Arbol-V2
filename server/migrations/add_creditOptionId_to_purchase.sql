-- =====================================================
-- Agregar campo creditOptionId a tabla purchase
-- =====================================================

ALTER TABLE purchase 
ADD COLUMN creditOptionId SMALLINT(5) UNSIGNED NULL COMMENT 'Referencia a la opción de crédito seleccionada'
AFTER userId;

-- Agregar constraint de llave foránea
ALTER TABLE purchase
ADD CONSTRAINT fk_purchase_creditoption 
FOREIGN KEY (creditOptionId) REFERENCES credit(id) 
ON DELETE SET NULL ON UPDATE CASCADE;

-- Crear índice para búsquedas
CREATE INDEX idx_purchase_creditoption ON purchase(creditOptionId);
