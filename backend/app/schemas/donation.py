from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CampaignCreate(BaseModel):
    title: str
    description: str = ""
    goal_amount: float = Field(default=0, ge=0)


class CampaignOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: str
    goal_amount: float
    is_active: bool
    created_at: datetime
    raised_amount: float = 0
    donor_count: int = 0


class DonateRequest(BaseModel):
    amount: float = Field(gt=0)
    message: str | None = None


class DonationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    donor_id: int
    campaign_id: int
    amount: float
    message: str | None
    created_at: datetime
