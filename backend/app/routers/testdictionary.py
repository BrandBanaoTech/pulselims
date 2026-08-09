import uuid
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, exc
from sqlalchemy.orm import Session, selectinload

from ..core.database import get_db
from ..models.user import User
from ..models.lab import LabTest
from ..models.testdictionary import MasterCatalogTest
from ..schemas.testdictionary import (
    MasterCatalogTestResponse, 
    LabTestCreate, 
    LabTestUpdate, 
    LabTestResponse
)
from ..schemas.auth import TokenPayload

# 🚀 Use our Contextual Dependency for Zero-Trust RBAC
from ..api.deps import require_lab_permission

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tests", tags=["Local Lab Test Dictionary"])


# ==========================================
# 1. SEARCH MASTER CATALOG (Global Reference)
# ==========================================
@router.get("/master-catalog", response_model=List[MasterCatalogTestResponse])
def search_master_catalog(
    search: str = "",
    db: Session = Depends(get_db)
):
    """
    Search the global LOINC-mapped Master Catalog.
    Used by the frontend to populate the 'Add Test' autocomplete dropdown.
    """
    stmt = select(MasterCatalogTest)
    if search:
        stmt = stmt.where(
            (MasterCatalogTest.official_name.ilike(f"%{search}%")) |
            (MasterCatalogTest.loinc_code.ilike(f"%{search}%"))
        )
    
    stmt = stmt.limit(50)
    return db.execute(stmt).scalars().all()


# ==========================================
# 2. GET LAB'S LOCAL DICTIONARY
# ==========================================
@router.get("", response_model=List[LabTestResponse])
def get_lab_tests(
    is_active: bool = True,
    db: Session = Depends(get_db),
    token: TokenPayload = Depends(require_lab_permission("view_tests"))
):
    """
    Retrieves the tenant-specific active test dictionary for the current workspace.
    """
    user_uuid = uuid.UUID(token.sub)
    
    # ⚡ HIGH-PERFORMANCE SQL: 
    # 1. Joins the User table to automatically filter by default_lab_id.
    # 2. Uses `selectinload` to fetch the Master Catalog link in a single batch query (No N+1 problem).
    stmt = (
        select(LabTest)
        .options(selectinload(LabTest.master_test))
        .join(User, User.default_lab_id == LabTest.lab_id)
        .where(
            User.id == user_uuid,
            LabTest.is_active == is_active
        )
        .order_by(LabTest.name)
    )
    
    tests = db.execute(stmt).scalars().all()
    
    # 🚀 MAGIC: No manual mapping loops needed! 
    # Pydantic reads the @property decorators in your LabTest model automatically.
    return tests


# ==========================================
# 3. ADD TEST TO LAB DICTIONARY
# ==========================================
@router.post("", response_model=LabTestResponse, status_code=status.HTTP_201_CREATED)
def create_lab_test(
    payload: LabTestCreate,
    db: Session = Depends(get_db),
    token: TokenPayload = Depends(require_lab_permission("manage_tests"))
):
    """
    Adds a new test to the lab's local dictionary using the contextual default lab.
    """
    user_uuid = uuid.UUID(token.sub)
    
    # Securely fetch the active workspace ID
    user_lab_id = db.execute(select(User.default_lab_id).where(User.id == user_uuid)).scalar()
    if not user_lab_id:
        raise HTTPException(status_code=400, detail="No active workspace found.")

    new_test = LabTest(
        lab_id=user_lab_id,
        **payload.model_dump()
    )
    
    db.add(new_test)
    
    try:
        db.commit()
        db.refresh(new_test)
    except exc.IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A test with the local code '{payload.code}' already exists in this lab."
        )

    # 🚀 MAGIC: Pydantic will lazy-load the master_test properties automatically.
    return new_test


# ==========================================
# 4. UPDATE LOCAL LAB TEST
# ==========================================
@router.put("/{test_id}", response_model=LabTestResponse)
def update_lab_test(
    test_id: uuid.UUID,
    payload: LabTestUpdate,
    db: Session = Depends(get_db),
    token: TokenPayload = Depends(require_lab_permission("manage_tests"))
):
    """
    Updates pricing, TAT, guidelines, or active status of a local lab test.
    """
    user_uuid = uuid.UUID(token.sub)
    
    # 🛡️ ZERO-TRUST QUERY: Guarantee the test belongs to the user's active default lab
    stmt = (
        select(LabTest)
        .options(selectinload(LabTest.master_test))
        .join(User, User.default_lab_id == LabTest.lab_id)
        .where(
            LabTest.id == test_id,
            User.id == user_uuid
        )
    )
    test = db.execute(stmt).scalars().first()
    
    if not test:
        logger.warning(f"IDOR attempt blocked: User {user_uuid} tried to update test {test_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Test not found in your current workspace."
        )

    # Apply updates dynamically
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(test, key, value)
        
    try:
        db.commit()
        db.refresh(test)
    except exc.IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Billing code conflict. Another test is already using this code."
        )

    # 🚀 MAGIC: Pydantic handles the loinc_code and pdf_result_fields via the @property automatically.
    return test


# ==========================================
# 5. DELETE LOCAL LAB TEST
# ==========================================
@router.delete("/{test_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lab_test(
    test_id: uuid.UUID,
    db: Session = Depends(get_db),
    token: TokenPayload = Depends(require_lab_permission("manage_tests"))
):
    """
    Permanently removes a test from the tenant lab's local dictionary.
    """
    user_uuid = uuid.UUID(token.sub)
    
    stmt = (
        select(LabTest)
        .join(User, User.default_lab_id == LabTest.lab_id)
        .where(
            LabTest.id == test_id,
            User.id == user_uuid
        )
    )
    test = db.execute(stmt).scalars().first()
    
    if not test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Test not found in your current workspace."
        )

    db.delete(test)
    db.commit()
    
    return None