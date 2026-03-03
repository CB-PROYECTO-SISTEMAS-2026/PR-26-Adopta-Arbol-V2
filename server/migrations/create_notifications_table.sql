-- Crear tabla de notificaciones si no existe
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

-- Índices para búsquedas rápidas
CREATE INDEX idx_notification_user ON notification(userId);
CREATE INDEX idx_notification_type ON notification(type);
CREATE INDEX idx_notification_isRead ON notification(isRead);
CREATE INDEX idx_notification_status ON notification(status);
CREATE INDEX idx_notification_createdAt ON notification(createdAt);

