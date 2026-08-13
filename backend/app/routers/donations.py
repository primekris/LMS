from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.schemas.donation import CampaignCreate, CampaignOut, DonateRequest, DonationOut
from app.services import donation_service

router = APIRouter(prefix="/api/donations", tags=["donations"])

staff_only = require_roles(UserRole.HEAD_ADMIN, UserRole.MODERATOR)
donor_only = require_roles(UserRole.DONOR)


@router.get("/me", response_model=list[DonationOut])
def my_donations(db: Session = Depends(get_db), current_user: User = Depends(donor_only)):
    return donation_service.my_donations(db, current_user.id)


@router.get("/campaigns", response_model=list[CampaignOut])
def list_campaigns(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    active_only = current_user.role not in (UserRole.HEAD_ADMIN, UserRole.MODERATOR)
    return donation_service.list_campaigns(db, active_only=active_only)


@router.post("/campaigns", response_model=CampaignOut, status_code=201)
def create_campaign(data: CampaignCreate, db: Session = Depends(get_db), current_user: User = Depends(staff_only)):
    return donation_service.create_campaign(db, creator_id=current_user.id, data=data)


@router.post("/campaigns/{campaign_id}/donate", response_model=DonationOut, status_code=201)
def donate_to_campaign(
    campaign_id: int,
    data: DonateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(donor_only),
):
    return donation_service.donate(db, donor_id=current_user.id, campaign_id=campaign_id, data=data)


@router.get("/summary")
def summary(db: Session = Depends(get_db), _: User = Depends(staff_only)):
    return donation_service.donation_summary(db)
