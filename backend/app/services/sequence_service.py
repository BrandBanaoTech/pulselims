import uuid
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..models.lab_sequence import LabSequence
from ..models.lab import Lab

def get_next_accession_number(db: Session, lab_id: uuid.UUID) -> tuple[int, str]:
    """
    Generates a daily resetting accession number: [LAB_ABBR]-[YYMMDD]-[SEQ]
    Example: CITY-260918-001
    """
    
    # 1. Get the Lab Abbreviation (e.g., "CITY", "APEX")
    lab = db.execute(select(Lab.abbreviation).where(Lab.id == lab_id)).scalar_one_or_none()
    lab_prefix = lab.upper() if lab else "LAB"

    # Get the current date in your local timezone (e.g., India Standard Time)
    today = datetime.now().date()
    
    # 2. Lock the Sequence Row
    sequence_record = db.execute(
        select(LabSequence)
        .where(LabSequence.lab_id == lab_id)
        .with_for_update() # 🚀 THE LOCK: Pauses other requests until this completes
    ).scalar_one_or_none()

    if not sequence_record:
        # First time this lab is generating an order ever
        sequence_record = LabSequence(lab_id=lab_id, sequence_date=today, daily_value=1)
        db.add(sequence_record)
        db.flush()
    else:
        # 3. The Daily Reset Logic
        if sequence_record.sequence_date < today:
            # It's a new day! Reset the counter to 1
            sequence_record.sequence_date = today
            sequence_record.daily_value = 1
        else:
            # Same day, just increment
            sequence_record.daily_value += 1

    next_seq = sequence_record.daily_value
    
    # 4. Format the String
    # %y%m%d formats 2026-09-18 as "260918"
    # %03d pads the sequence with zeros (001, 002, 099, 100)
    date_str = today.strftime("%y%m%d")
    accession_string = f"{lab_prefix}-{date_str}-{next_seq:03d}"
    
    return next_seq, accession_string