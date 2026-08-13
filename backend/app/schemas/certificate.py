from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CertificateIssueRequest(BaseModel):
    student_id: int
    course_id: int


class CertificateOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    student_id: int
    course_id: int
    code: str
    issued_at: datetime
    student_name: str | None = None
    course_title: str | None = None
    issuer_name: str | None = None
    org_name: str | None = None


class CertificateVerifyOut(BaseModel):
    valid: bool
    student_name: str | None = None
    course_title: str | None = None
    issued_at: datetime | None = None
