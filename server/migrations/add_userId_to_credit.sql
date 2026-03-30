-- =====================================================
-- MIGRACION: Agregar userId a la tabla credit
-- =====================================================

SET @column_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'credit'
    AND COLUMN_NAME = 'userId'
);

SET @add_column_sql = IF(
  @column_exists = 0,
  'ALTER TABLE credit ADD COLUMN userId SMALLINT(5) UNSIGNED NULL COMMENT "Admin que creó/modificó la opción" AFTER lastUpdate',
  'SELECT 1'
);

PREPARE stmt_add_column FROM @add_column_sql;
EXECUTE stmt_add_column;
DEALLOCATE PREPARE stmt_add_column;

SET @index_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'credit'
    AND INDEX_NAME = 'idx_credit_userId'
);

SET @add_index_sql = IF(
  @index_exists = 0,
  'CREATE INDEX idx_credit_userId ON credit(userId)',
  'SELECT 1'
);

PREPARE stmt_add_index FROM @add_index_sql;
EXECUTE stmt_add_index;
DEALLOCATE PREPARE stmt_add_index;

SET @fk_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND CONSTRAINT_NAME = 'fk_credit_user'
    AND TABLE_NAME = 'credit'
);

SET @add_fk_sql = IF(
  @fk_exists = 0,
  'ALTER TABLE credit ADD CONSTRAINT fk_credit_user FOREIGN KEY (userId) REFERENCES user(id) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
);

PREPARE stmt_add_fk FROM @add_fk_sql;
EXECUTE stmt_add_fk;
DEALLOCATE PREPARE stmt_add_fk;
