import uuid
import logging
import json
from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, Depends, Request, Form, status, HTTPException, UploadFile, File
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.orm import Session

# Database & Models
from ..core.database import get_db
from ..models.user import User
from ..models.lab import Lab
from ..models.testdictionary import MasterCatalogTest, DepartmentEnum, SampleTypeEnum

# Security
from ..api.deps import require_admin_cookie
from ..core.security import verify_password, create_access_token

# 🚀 FIX 1: Use standard Python logging, NOT asyncio.log
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Admin UI"])
templates = Jinja2Templates(directory="templates")

# ==========================================
# SCHEMAS
# ==========================================
class AdminTestCreate(BaseModel):
    official_name: str
    loinc_code: Optional[str] = None
    department: DepartmentEnum
    sample_type: SampleTypeEnum
    default_tat: str
    default_price: Decimal
    pdf_result_fields: List[str] = []
    clinical_guidelines: Optional[str] = None

class AdminTestUpdate(BaseModel):
    official_name: str
    loinc_code: Optional[str] = None
    department: DepartmentEnum
    sample_type: SampleTypeEnum
    default_tat: str
    default_price: Decimal
    pdf_result_fields: List[str] = []
    clinical_guidelines: Optional[str] = None

class BulkDeleteRequest(BaseModel):
    test_ids: List[uuid.UUID]


# ==========================================
# 1. LOGIN & LOGOUT
# ==========================================
@router.get("/login", response_class=HTMLResponse)
def login_page(request: Request):
    return templates.TemplateResponse(request=request, name="admin_login.html")

@router.post("/login")
def process_login(
    request: Request, 
    email: str = Form(...), 
    password: str = Form(...), 
    db: Session = Depends(get_db)
):
    user = db.execute(select(User).where(User.email == email)).scalars().first()
    
    if not user or not getattr(user, 'is_platform_admin', False):
        return templates.TemplateResponse(request=request, name="admin_login.html", context={"error": "Access Denied: Invalid Credentials"})
        
    if not verify_password(password, user.hashed_password):
        return templates.TemplateResponse(request=request, name="admin_login.html", context={"error": "Invalid Password"})

    # 🚀 FIX 2: Added `is_superadmin=True` (or is_platform_admin) so the cookie bouncer accepts the token!
    token = create_access_token(
        subject=str(user.id), 
        email=user.email, 
        mobile=str(user.mobile),
        is_superadmin=True # Ensure this matches whatever your `create_access_token` accepts
    )
    
    response = RedirectResponse(url="/admin/dashboard", status_code=status.HTTP_303_SEE_OTHER)
    # Ensure this cookie name exactly matches what `require_admin_cookie` in deps.py is looking for!
    response.set_cookie("platform_admin_session", token, httponly=True, secure=True, samesite="lax", max_age=3600)
    
    return response

@router.get("/logout")
def logout():
    response = RedirectResponse(url="/admin/login", status_code=status.HTTP_303_SEE_OTHER)
    response.delete_cookie("platform_admin_session")
    return response


# ==========================================
# 2. TABBED DASHBOARD UI
# ==========================================
@router.get("/dashboard", response_class=HTMLResponse)
def admin_dashboard(
    request: Request, 
    tab: str = "overview", 
    db: Session = Depends(get_db),
    admin_user: dict = Depends(require_admin_cookie) 
):
    context = {
        "request": request,
        "admin_email": admin_user.get("email", "Platform Admin"),
        "current_tab": tab,
        "departments": [d.value for d in DepartmentEnum],
        "sample_types": [s.value for s in SampleTypeEnum]
    }
    
    if tab == "overview":
        context["metrics"] = {
            "total_labs": db.execute(select(func.count(Lab.id))).scalar() or 0,
            "active_labs": db.execute(select(func.count(Lab.id)).where(Lab.is_active == True)).scalar() or 0,
            "total_master_tests": db.execute(select(func.count(MasterCatalogTest.id))).scalar() or 0,
            "total_users": db.execute(select(func.count(User.id))).scalar() or 0,
        }
    elif tab == "users":
        context["users"] = db.execute(select(User).order_by(User.created_at.desc()).limit(100)).scalars().all()
    elif tab == "labs":
        context["labs"] = db.execute(select(Lab).order_by(Lab.created_at.desc()).limit(100)).scalars().all()
    elif tab == "tests":
        context["tests"] = db.execute(select(MasterCatalogTest).order_by(MasterCatalogTest.official_name).limit(200)).scalars().all()

    return templates.TemplateResponse(request=request, name="admin_dashboard.html", context=context)


# ==========================================
# 3. INSTANT ACTION ENDPOINTS (AJAX)
# ==========================================
@router.post("/api/users/{user_id}/toggle-admin")
def toggle_user_admin(user_id: uuid.UUID, db: Session = Depends(get_db), admin_user: dict = Depends(require_admin_cookie)):
    if str(user_id) == admin_user.get("sub"):
        return JSONResponse(status_code=400, content={"error": "You cannot revoke your own admin privileges."})
        
    user = db.execute(select(User).where(User.id == user_id)).scalars().first()
    if not user: raise HTTPException(status_code=404)
    
    user.is_platform_admin = not user.is_platform_admin
    db.commit()
    return {"success": True, "new_status": user.is_platform_admin}

@router.post("/api/users/{user_id}/toggle-active")
def toggle_user_active(user_id: uuid.UUID, db: Session = Depends(get_db), admin_user: dict = Depends(require_admin_cookie)):
    if str(user_id) == admin_user.get("sub"):
        return JSONResponse(status_code=400, content={"error": "You cannot deactivate your own account."})
        
    user = db.execute(select(User).where(User.id == user_id)).scalars().first()
    if not user: raise HTTPException(status_code=404)
    
    user.is_active = not user.is_active
    db.commit()
    return {"success": True, "new_status": user.is_active}

@router.post("/api/labs/{lab_id}/toggle-active")
def toggle_lab_active(lab_id: uuid.UUID, db: Session = Depends(get_db), admin_user: dict = Depends(require_admin_cookie)):
    lab = db.execute(select(Lab).where(Lab.id == lab_id)).scalars().first()
    if not lab: raise HTTPException(status_code=404)
    
    lab.is_active = not lab.is_active
    db.commit()
    return {"success": True, "new_status": lab.is_active}


# ==========================================
# 4. MASTER CATALOG CRUD
# ==========================================
@router.post("/api/tests/create")
def create_master_test_ui(
    payload: AdminTestCreate, 
    db: Session = Depends(get_db), 
    admin_user: dict = Depends(require_admin_cookie)
):
    if payload.loinc_code:
        existing = db.execute(select(MasterCatalogTest).where(MasterCatalogTest.loinc_code == payload.loinc_code)).scalars().first()
        if existing:
            return JSONResponse(status_code=400, content={"error": f"LOINC Code '{payload.loinc_code}' is already in use."})
            
    new_test = MasterCatalogTest(**payload.model_dump())
    db.add(new_test)
    
    try:
        db.commit()
        return {"success": True}
    except Exception as e:
        db.rollback()
        logger.error(f"Test creation failed: {e}")
        return JSONResponse(status_code=500, content={"error": "Database integrity error."})


@router.post("/api/tests/upload")
async def upload_master_tests_json(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin_user: dict = Depends(require_admin_cookie)
):
    """
    Bulk Upload with UPSERT (Update/Insert) logic.
    Updates prices/guidelines for existing tests, inserts new ones.
    """
    if not file.filename.endswith(".json"):
        return JSONResponse(status_code=400, content={"error": "Invalid file type. Please upload a .json file."})

    try:
        contents = await file.read()
        data = json.loads(contents)
        
        if not isinstance(data, list):
            return JSONResponse(status_code=400, content={"error": "JSON structure must be an array (list) of tests."})

        added_count = 0
        updated_count = 0

        for item in data:
            try:
                test_data = AdminTestCreate(**item)
            except Exception as e:
                db.rollback()
                return JSONResponse(status_code=400, content={"error": f"Validation failed on test '{item.get('official_name', 'Unknown')}': {str(e)}"})

            if test_data.loinc_code:
                existing = db.execute(
                    select(MasterCatalogTest).where(MasterCatalogTest.loinc_code == test_data.loinc_code)
                ).scalars().first()
                
                if existing:
                    # 🚀 FIX 3: True UPSERT Logic (Updates existing tests instead of skipping)
                    update_dict = test_data.model_dump()
                    for key, value in update_dict.items():
                        setattr(existing, key, value)
                    updated_count += 1
                    continue

            # Insert as a brand new test
            new_test = MasterCatalogTest(**test_data.model_dump())
            db.add(new_test)
            added_count += 1

        db.commit()
        return {"success": True, "added": added_count, "updated": updated_count}

    except json.JSONDecodeError:
        return JSONResponse(status_code=400, content={"error": "The uploaded file contains invalid JSON."})
    except Exception as e:
        db.rollback()
        logger.error(f"Bulk Upload failed: {e}")
        return JSONResponse(status_code=500, content={"error": "An internal database error occurred."})


@router.post("/api/tests/{test_id}/update")
def update_master_test_ui(
    test_id: uuid.UUID,
    payload: AdminTestUpdate,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(require_admin_cookie)
):
    test = db.execute(select(MasterCatalogTest).where(MasterCatalogTest.id == test_id)).scalars().first()
    
    if not test:
        return JSONResponse(status_code=404, content={"error": "Test record not found."})

    if payload.loinc_code and payload.loinc_code != test.loinc_code:
        existing = db.execute(select(MasterCatalogTest).where(MasterCatalogTest.loinc_code == payload.loinc_code)).scalars().first()
        if existing:
            return JSONResponse(status_code=400, content={"error": f"LOINC Code '{payload.loinc_code}' is already assigned to another test."})

    for key, value in payload.model_dump().items():
        setattr(test, key, value)

    try:
        db.commit()
        return {"success": True}
    except Exception as e:
        db.rollback()
        logger.error(f"Test update failed: {e}")
        return JSONResponse(status_code=500, content={"error": "Failed to update record in database."})


@router.post("/api/tests/{test_id}/delete")
def delete_master_test_ui(
    test_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(require_admin_cookie)
):
    test = db.execute(select(MasterCatalogTest).where(MasterCatalogTest.id == test_id)).scalars().first()
    
    if not test:
        return JSONResponse(status_code=404, content={"error": "Test record not found."})

    try:
        db.delete(test)
        db.commit()
        return {"success": True}
    except Exception as e:
        db.rollback()
        logger.warning(f"Failed deletion attempt on linked test {test_id}: {e}")
        return JSONResponse(
            status_code=400, 
            content={"error": "Cannot delete this test because tenant labs are actively using it in their local dictionaries."}
        )

@router.post("/api/tests/bulk-delete")
def bulk_delete_master_tests_ui(
    payload: BulkDeleteRequest,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(require_admin_cookie)
):
    """
    AJAX endpoint for bulk deleting Master Catalog tests.
    Iterates safely so that tests actively used by tenant labs fail gracefully,
    allowing the rest of the batch to delete successfully.
    """
    deleted_count = 0
    failed_count = 0

    for test_id in payload.test_ids:
        test = db.execute(select(MasterCatalogTest).where(MasterCatalogTest.id == test_id)).scalars().first()
        if test:
            try:
                db.delete(test)
                db.commit() # Commit individually to isolate failures
                deleted_count += 1
            except Exception as e:
                db.rollback() # Roll back ONLY this single test if a lab is using it
                failed_count += 1
                logger.warning(f"Bulk Delete Skipped {test_id} (Likely in use by a lab): {e}")

    return {"success": True, "deleted": deleted_count, "failed": failed_count}