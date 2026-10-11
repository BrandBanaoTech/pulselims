import uuid
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..models.lab import DailyStats
from ..models.lab import Lab

def get_next_accession_number(db: Session, lab_id: uuid.UUID, lab: str, sequence_record: int) -> tuple[int, str]:
    """
    Generates a daily resetting accession number: [LAB_ABBR]-[YYMMDD]-[SEQ]
    Example: CITY-260918-001
    """
    lab_prefix = lab.upper()[:4] if lab else "LAB"
    today = datetime.now().date()

    if not sequence_record:
        sequence_record = DailyStats(lab_id=lab_id, sequence_date=today, daily_value=1)
        db.add(sequence_record)
        db.flush()
    else:
        if sequence_record.sequence_date < today:
            sequence_record.sequence_date = today
            sequence_record.daily_value = 1
        else:
            sequence_record.daily_value += 1

    next_seq = sequence_record.daily_value
    date_str = today.strftime("%y%m%d")
    accession_string = f"{lab_prefix}-{date_str}-{next_seq}"
    
    return accession_string