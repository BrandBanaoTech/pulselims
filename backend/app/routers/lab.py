import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, DataError

# Adjust imports to match your project structure
from ..core.database import get_db
from ..api.deps import get_current_token_payload, require_lab_permission
from ..schemas.auth import TokenPayload
from ..core.security import verify_password
from ..schemas.lab import LabCreate, LabDeletionChallenge, LabResponse, LabUpdate
from ..models.user import User
from ..models.lab import Lab
from ..models.labmembership import LabMembership

router = APIRouter(prefix="/labs")


# ==========================================
# 1. CREATE A NEW LAB (TENANT PROVISIONING)
# ==========================================
@router.post("/", response_model=LabResponse, status_code=status.HTTP_201_CREATED)
def create_lab(
    lab_in: LabCreate,
    db: Session = Depends(get_db),
    current_user: TokenPayload = Depends(get_current_token_payload) 
):
    """
    Creates a new Lab Tenant.
    Enforces a strict 1:1 owner constraint and grants 'owner' rights atomically.
    """
    user_uuid = uuid.UUID(current_user.sub)

    # 🔒 ENFORCE 1:1 RULE: Ensure user doesn't already own a lab
    existing_lab_stmt = select(Lab).where(Lab.owner_id == user_uuid)
    if db.execute(existing_lab_stmt).scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already registered a laboratory. Multiple labs per account are not supported."
        )

    # 1. Construct the Lab record
    new_lab = Lab(
        name=lab_in.name,
        license_number=lab_in.license_number,
        support_email=lab_in.support_email,
        contact_phone=lab_in.contact_phone,
        timezone=lab_in.timezone,
        address=lab_in.address.model_dump(), 
        owner_id=user_uuid,
        # Brand assets can be added later via PUT/PATCH
        logo_url=str(lab_in.logo_url) if lab_in.logo_url else None,
        website=str(lab_in.website) if lab_in.website else None,
        report_header_text=lab_in.report_header_text,
        report_footer_text=lab_in.report_footer_text,
        director_name=lab_in.director_name,
        director_signature_url=str(lab_in.director_signature_url) if lab_in.director_signature_url else None
    )
    
    db.add(new_lab)
    
    # db.flush() executes the SQL to generate new_lab.id, but does NOT commit yet.
    db.flush() 

    # 2. Create the strict Membership Mapping (Tenant-Scoped RBAC)
    membership = LabMembership(
        user_id=user_uuid,
        lab_id=new_lab.id,
        status="ACTIVE",
        permissions=["owner"] # 'owner' acts as a wildcard for all other permissions
    )
    
    db.add(membership)
    
    # 3. Commit both atomically
    try:
        db.commit()
        db.refresh(new_lab)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while provisioning your laboratory. Please try again."
        )
    
    return new_lab


# ==========================================
# 2. GET ALL LABS FOR CURRENT USER
# ==========================================
@router.get("/", response_model=list[LabResponse], status_code=status.HTTP_200_OK)
def get_my_labs(
    db: Session = Depends(get_db),
    current_user: TokenPayload = Depends(get_current_token_payload)
):
    """
    Dashboard Endpoint: Returns all active labs the user owns or works at.
    Optimized with a direct database JOIN for extreme scalability.
    """
    user_uuid = uuid.UUID(current_user.sub)

    # ⚡ FAST QUERY: PostgreSQL handles the join, preventing memory leaks
    stmt = (
        select(Lab)
        .join(LabMembership, Lab.id == LabMembership.lab_id)
        .where(
            LabMembership.user_id == user_uuid,
            Lab.is_active == True
        )
    )
    
    labs = db.execute(stmt).scalars().all()
    return list(labs)


# ==========================================
# 3. GET SPECIFIC LAB DETAILS (Zero-Trust Security)
# ==========================================
@router.get("/{lab_id}", response_model=LabResponse, status_code=status.HTTP_200_OK)
def get_lab_details(
    lab_id: uuid.UUID,
    db: Session = Depends(get_db),
    # Layer 1 Security (The Bouncer): Pre-checks RBAC permissions
    token_payload: TokenPayload = Depends(require_lab_permission("read_lab_settings"))
):
    """
    Retrieves specific branding and legal info for a single lab.
    Protected by Tenant-Scoped RBAC and Defense-in-Depth database querying.
    """
    user_uuid = uuid.UUID(token_payload.sub)

    # Layer 2 Security (Defense in Depth): 
    # Hard-link the Lab to the User's Membership in the SQL query.
    # This prevents IDOR attacks if the dependency above ever fails.
    stmt = (
        select(Lab)
        .join(LabMembership, Lab.id == LabMembership.lab_id)
        .where(
            Lab.id == lab_id,
            LabMembership.user_id == user_uuid, # Must be a current staff member/owner
            Lab.is_active == True
        )
    )
    
    lab = db.execute(stmt).scalars().first()
    
    if not lab:
        # We return a generic 404 to avoid confirming to hackers that the lab_id exists
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Laboratory not found or you do not have access."
        )
        
    return lab


# ==========================================
# 4. UPDATE LAB BRANDING / SETTINGS (Zero-Trust Security)
# ==========================================
@router.patch("/{lab_id}", response_model=LabResponse, status_code=status.HTTP_200_OK)
def update_lab(
    lab_id: uuid.UUID,
    lab_update: LabUpdate,
    db: Session = Depends(get_db),
    # Layer 1 Security: Pre-checks RBAC permissions
    token_payload: TokenPayload = Depends(require_lab_permission("update_lab_settings"))
):
    """
    Updates lab information.
    Applies partial updates securely without overwriting existing data.
    Protected by Defense-in-Depth database querying.
    """
    user_uuid = uuid.UUID(token_payload.sub)

    # Layer 2 Security (Defense in Depth): 
    # Ensure the user is actually authorized for THIS specific lab at the database level.
    stmt = (
        select(Lab)
        .join(LabMembership, Lab.id == LabMembership.lab_id)
        .where(
            Lab.id == lab_id,
            LabMembership.user_id == user_uuid, # Must be a current staff member/owner
            Lab.is_active == True
        )
    )
    lab = db.execute(stmt).scalars().first()
    
    if not lab:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Laboratory not found or you do not have permission to edit it."
        )
    
    # 2. Strict RBAC: Only the Owner can modify lab configurations
    if lab.owner_id != user_uuid:
        raise HTTPException(
            status_code=403, 
            detail="Access Denied: Only the workspace owner can update these settings."
        )

    # 🛡️ SECURE PATCH: Only extract fields the user actually sent
    update_data = lab_update.model_dump(exclude_unset=True)
    
    # 🚨 CRITICAL FIX: Pydantic V2 keeps HttpUrl as objects. 
    # SQLAlchemy requires standard Python strings. We must cast them.
    for url_field in ["logo_url", "website", "director_signature_url"]:
        if url_field in update_data and update_data[url_field] is not None:
            update_data[url_field] = str(update_data[url_field])

    if "address" in update_data and update_data["address"]:
        # Pydantic's model_dump already turns nested schemas into dicts, 
        # so this is perfectly safe for a JSON column now!
        lab.address = update_data["address"]
        del update_data["address"]
        
    for key, value in update_data.items():
        setattr(lab, key, value)

    try:
        db.commit()
        db.refresh(lab)
        
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Update failed: Data conflict detected (e.g., duplicate license number)."
        )
        
    except DataError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Update failed: Invalid data format (check your JSON address payload)."
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal database error occurred while updating the laboratory."
        )
        
    return lab


# ==========================================
# 4. DELETE LAB BRANDING / SETTINGS (Zero-Trust Security)
# ==========================================
@router.delete("/{lab_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lab(
    lab_id: uuid.UUID,
    challenge: LabDeletionChallenge,
    db: Session = Depends(get_db),
    # 1. Security: Enforce Owner permissions immediately
    token_payload: TokenPayload = Depends(require_lab_permission("owner"))
):
    """
    Destroys the laboratory, all memberships, and associated records.
    Requires password re-authentication and name matching.
    """ 
    user_uuid = uuid.UUID(token_payload.sub)

    # 2. Fetch the Lab
    stmt = select(Lab).where(
        Lab.id == lab_id,
        Lab.owner_id == user_uuid
    )
    lab = db.execute(stmt).scalars().first()

    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found.")
    
    # 3. Re-Authenticate User (Check Password)
    # Fetch current user from token subject
    user_stmt = select(User).where(User.id == user_uuid)
    current_user = db.execute(user_stmt).scalars().first()

    if not current_user or not verify_password(challenge.owner_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Incorrect password. Re-authentication failed."
        )

    # 4. Confirm Intent (Name check)
    if challenge.lab_name_confirmation != lab.name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Deletion aborted. Expected name '{lab.name}', but got '{challenge.lab_name_confirmation}'."
        )
    
    # 5. Delete (The cascade="all, delete-orphan" in your models 
    # handles cleaning up all memberships automatically)
    try:
        db.delete(lab)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete laboratory."
        )

    return None