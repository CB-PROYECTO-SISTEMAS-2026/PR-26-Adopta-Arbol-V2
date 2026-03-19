-- ============================================
-- Migración: Agregar categoryId faltante en tree
-- ============================================

-- Agregar categoryId a la tabla tree si no existe
ALTER TABLE tree ADD COLUMN IF NOT EXISTS categoryId SMALLINT(5) NULL COMMENT 'Categoría del árbol' AFTER userId;

-- Agregar constraint de foreign key para categoryId si no existe
ALTER TABLE tree ADD CONSTRAINT FOREIGN KEY (categoryId) REFERENCES category(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Agregar índice para categoryId si no existe  
ALTER TABLE tree ADD INDEX IF NOT EXISTS idx_tree_category (categoryId);

-- Verificar
SELECT 'Migración completada: categoryId agregado correctamente en tree' AS status;
