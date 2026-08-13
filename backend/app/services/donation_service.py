from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.donation import Donation, DonationCampaign
from app.schemas.donation import CampaignCreate, DonateRequest


def _with_totals(db: Session, campaign: DonationCampaign) -> DonationCampaign:
    raised, count = (
        db.query(func.coalesce(func.sum(Donation.amount), 0), func.count(Donation.id))
        .filter(Donation.campaign_id == campaign.id)
        .first()
    )
    campaign.raised_amount = float(raised)
    campaign.donor_count = count
    return campaign


def create_campaign(db: Session, creator_id: int, data: CampaignCreate) -> DonationCampaign:
    campaign = DonationCampaign(
        title=data.title, description=data.description, goal_amount=data.goal_amount, created_by_id=creator_id
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return _with_totals(db, campaign)


def list_campaigns(db: Session, active_only: bool = False) -> list[DonationCampaign]:
    query = db.query(DonationCampaign)
    if active_only:
        query = query.filter(DonationCampaign.is_active.is_(True))
    campaigns = query.order_by(DonationCampaign.created_at.desc()).all()
    return [_with_totals(db, c) for c in campaigns]


def donate(db: Session, donor_id: int, campaign_id: int, data: DonateRequest) -> Donation:
    campaign = db.get(DonationCampaign, campaign_id)
    if not campaign or not campaign.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found or inactive")

    donation = Donation(donor_id=donor_id, campaign_id=campaign_id, amount=data.amount, message=data.message)
    db.add(donation)
    db.commit()
    db.refresh(donation)
    return donation


def donation_summary(db: Session) -> dict:
    total_raised = db.query(func.coalesce(func.sum(Donation.amount), 0)).scalar()
    total_donations = db.query(func.count(Donation.id)).scalar()
    active_campaigns = db.query(func.count(DonationCampaign.id)).filter(DonationCampaign.is_active.is_(True)).scalar()
    return {
        "total_raised": float(total_raised),
        "total_donations": total_donations,
        "active_campaigns": active_campaigns,
    }


def my_donations(db: Session, donor_id: int) -> list[Donation]:
    return db.query(Donation).filter(Donation.donor_id == donor_id).order_by(Donation.created_at.desc()).all()
