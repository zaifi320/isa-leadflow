r"""
seed_data.py - Run this AFTER adding real DB credentials to .env
Usage: D:\Tools\Anaconda\python.exe seed_data.py
"""
import sys
import os
import random
import uuid
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from database import SessionLocal, engine
import models

models.Base.metadata.create_all(bind=engine)

random.seed(42)

# --- Configuration ---
TOTAL_LEADS = 500

# Daily counts for Nov 1-12, 2026 (12 days)
# Nov 6=12, Nov 7=18, Nov 8=15, Nov 9=24, Nov 10=17, Nov 11=22, Nov 12=20
DAILY_COUNTS = {
    1: 35, 2: 40, 3: 38, 4: 42, 5: 36,
    6: 12, 7: 18, 8: 15, 9: 24, 10: 17, 11: 22, 12: 20
}
# remaining is distributed on days 1-5

EMPLOYEES = [
    ("Adam Smith", 120),
    ("Sarah Johnson", 95),
    ("Mike Davis", 72),
    ("Jessica Brown", 58),
    ("David Wilson", 42),
    ("Emily Clark", 35),
    ("James Taylor", 28),
    ("Ashley Martinez", 25),
    ("Chris Anderson", 15),
    ("Megan Thomas", 10),
]

LEAD_TYPES = ["Seller"] * 50 + ["Buyer"] * 49 + ["Investor"] * 1
PROPERTY_TYPES = ["SFH"] * 64 + ["Condo"] * 20 + ["Land"] * 16

LOCATIONS = [
    "Portland, OR 97236",
    "Portland, OR 97201",
    "Beaverton, OR 97005",
    "Salem, OR 97301",
    "Eugene, OR 97401",
    "Hartford, CT 06101",
    "Bridgeport, CT 06604",
    "New Haven, CT 06510",
    "Austin, TX 78701",
    "Dallas, TX 75201",
    "Houston, TX 77001",
    "San Antonio, TX 78201",
    "Sacramento, CA 95814",
    "Los Angeles, CA 90001",
    "San Diego, CA 92101",
    "San Francisco, CA 94102",
    "Miami, FL 33101",
    "Orlando, FL 32801",
    "Tampa, FL 33601",
    "Jacksonville, FL 32099",
    "Phoenix, AZ 85001",
    "Tucson, AZ 85701",
    "Las Vegas, NV 89101",
    "Denver, CO 80201",
    "Seattle, WA 98101",
    "Spokane, WA 99201",
    "Atlanta, GA 30301",
    "Savannah, GA 31401",
    "Chicago, IL 60601",
    "Nashville, TN 37201",
    "Charlotte, NC 28201",
    "Columbus, OH 43085",
    "Detroit, MI 48201",
    "Minneapolis, MN 55401",
    "St. Louis, MO 63101",
    "Kansas City, MO 64101",
    "New York, NY 10001",
    "Buffalo, NY 14201",
    "Philadelphia, PA 19101",
    "Pittsburgh, PA 15201",
]

FIRST_NAMES = [
    "James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph",
    "Thomas", "Charles", "Mary", "Patricia", "Jennifer", "Linda", "Barbara",
    "Susan", "Jessica", "Sarah", "Karen", "Lisa", "Nancy", "Betty", "Dorothy",
    "Daniel", "Matthew", "Anthony", "Mark", "Donald", "Steven", "Paul",
    "Andrew", "Joshua", "Kevin", "Brian", "George", "Timothy", "Ronald",
    "Edward", "Jason", "Jeffrey", "Ryan", "Jacob", "Gary", "Nicholas", "Eric",
    "Jonathan", "Stephen", "Larry", "Justin", "Scott", "Brandon", "Benjamin"
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
    "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
    "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
    "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen",
    "Hill", "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera",
    "Campbell", "Mitchell", "Carter", "Roberts"
]

BUDGETS = ["$150,000-$200,000", "$200,000-$300,000", "$300,000-$400,000",
           "$400,000-$500,000", "$500,000-$700,000", "$700,000+", "Under $150,000"]

BEDS_BATHS = ["2/1", "3/2", "4/2", "4/3", "5/3", "2/2", "3/1", "1/1", "Studio"]

SENDER_NAMES = ["ISA Bot", "Lead Bot", "CRM Import", "Web Form", "Referral System"]


def random_phone():
    area = random.randint(200, 999)
    mid = random.randint(200, 999)
    end = random.randint(1000, 9999)
    return f"{area}-{mid}-{end}"


def random_email(first, last):
    domains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com"]
    formats = [
        f"{first.lower()}.{last.lower()}@{random.choice(domains)}",
        f"{first.lower()}{random.randint(1, 99)}@{random.choice(domains)}",
        f"{first[0].lower()}{last.lower()}@{random.choice(domains)}",
    ]
    return random.choice(formats)


def build_leads():
    # Build employee pool matching target counts
    employee_pool = []
    for name, count in EMPLOYEES:
        employee_pool.extend([name] * count)
    # pad/trim to TOTAL_LEADS
    while len(employee_pool) < TOTAL_LEADS:
        employee_pool.extend([emp[0] for emp in EMPLOYEES])
    random.shuffle(employee_pool)
    employee_pool = employee_pool[:TOTAL_LEADS]

    # Build date pool
    date_pool = []
    for day, count in DAILY_COUNTS.items():
        base = datetime(2026, 11, day)
        for _ in range(count):
            hour = random.randint(7, 20)
            minute = random.randint(0, 59)
            second = random.randint(0, 59)
            date_pool.append(base.replace(hour=hour, minute=minute, second=second))
    # fill remaining with days 1-5 spread
    while len(date_pool) < TOTAL_LEADS:
        day = random.randint(1, 5)
        base = datetime(2026, 11, day)
        hour = random.randint(7, 20)
        date_pool.append(base.replace(hour=hour, minute=random.randint(0, 59)))
    random.shuffle(date_pool)
    date_pool = sorted(date_pool[:TOTAL_LEADS])

    leads = []
    for i in range(TOTAL_LEADS):
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        full_name = f"{first} {last}"

        has_phone = random.random() < 0.92
        has_name = random.random() < 0.90
        has_email = random.random() < 0.85

        sender = random.choice(SENDER_NAMES)
        lead_type = random.choice(LEAD_TYPES)
        prop_type = random.choice(PROPERTY_TYPES)
        location = random.choice(LOCATIONS)
        lead_by_cleaned = employee_pool[i]

        lead = {
            "message_id": f"MSG-{uuid.uuid4().hex[:12].upper()}",
            "message_time": date_pool[i],
            "sender_id": f"BOT-{random.randint(1000, 9999)}",
            "sender_name": sender,
            "type_of_lead": lead_type,
            "type_of_property": prop_type,
            "beds_baths": random.choice(BEDS_BATHS) if prop_type != "Land" else None,
            "area_city": location,
            "budget": random.choice(BUDGETS),
            "cash_finance": random.choice(["Cash", "Finance", "Either", None]),
            "under_contract": random.choice(["Yes", "No", None]),
            "willing_to_sign": random.choice(["Yes", "No", "Maybe", None]),
            "name": full_name if has_name else None,
            "number": random_phone() if has_phone else None,
            "email": random_email(first, last) if has_email else None,
            "size": f"{random.randint(800, 4500)} sqft" if prop_type != "Land" else f"{random.randint(1, 10)} acres",
            "call_appointment_time": None,
            "lead_by": lead_by_cleaned,
            "lead_by_cleaned": lead_by_cleaned,
            "lead_for": random.choice(["Buying", "Selling", "Investment", None]),
            "note": None,
        }
        leads.append(lead)
    return leads


def seed():
    db = SessionLocal()
    try:
        existing = db.query(models.Lead).count()
        if existing > 0:
            print(f"Database already has {existing} leads. Skipping seed.")
            print("To re-seed, delete existing records first.")
            return

        print("Generating sample data...")
        leads_data = build_leads()

        print(f"Inserting {len(leads_data)} leads...")
        for chunk_start in range(0, len(leads_data), 50):
            chunk = leads_data[chunk_start:chunk_start + 50]
            db.bulk_insert_mappings(models.Lead, chunk)
            db.commit()
            print(f"  Inserted {min(chunk_start + 50, len(leads_data))}/{len(leads_data)}")

        # Insert a sample sync history record
        sync = models.SyncHistory(
            records_synced=len(leads_data),
            status="success",
            source="seed_data"
        )
        db.add(sync)
        db.commit()

        print(f"\nDone! Seeded {len(leads_data)} leads and 1 sync history record.")
        print("\nLead type breakdown:")
        from collections import Counter
        type_counts = Counter(l["type_of_lead"] for l in leads_data)
        for t, c in sorted(type_counts.items(), key=lambda x: -x[1]):
            print(f"  {t}: {c}")

        print("\nTop lead agents:")
        agent_counts = Counter(l["lead_by_cleaned"] for l in leads_data)
        for a, c in agent_counts.most_common(5):
            print(f"  {a}: {c}")

    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
