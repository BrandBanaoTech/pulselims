import uuid
from sqlalchemy import Column, DateTime, Boolean, ForeignKey, Uuid, func
from sqlalchemy.orm import declared_attr

class AuditMixin:
    """
    Enterprise Audit & Soft-Delete Mixin.
    Guarantees strict legal compliance by tracking the exact lifecycle of a record 
    and preventing permanent data destruction.
    """

    # ---------------------------------------------------------
    # 1. TIMESTAMPS
    # ---------------------------------------------------------
    # Indexed because dashboards frequently query "Show me today's orders"
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    # ---------------------------------------------------------
    # 2. SOFT DELETE FLAG (Legal Compliance)
    # ---------------------------------------------------------
    # Indexed for ultra-fast `WHERE is_deleted = false` global filtering
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)

    # ---------------------------------------------------------
    # 3. MAKER-CHECKER TRACKING
    # ---------------------------------------------------------
    @declared_attr
    def created_by_id(cls):
        # Indexed because admins often filter: "Show all records created by User X"
        return Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    @declared_attr
    def updated_by_id(cls):
        return Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    @declared_attr
    def deleted_by_id(cls):
        return Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # ---------------------------------------------------------
    # 4. HELPER METHODS (ORM Level)
    # ---------------------------------------------------------
    def soft_delete(self, user_id: uuid.UUID):
        """Safely 'deletes' the record without destroying database rows."""
        self.is_deleted = True
        self.deleted_at = func.now()
        self.deleted_by_id = user_id
        
    def restore(self, user_id: uuid.UUID):
        """Restores a soft-deleted record."""
        self.is_deleted = False
        self.deleted_at = None
        self.deleted_by_id = None
        self.updated_by_id = user_id