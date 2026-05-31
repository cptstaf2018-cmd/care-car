from app.core.database import engine
from sqlalchemy import text

migrations = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS activation_code VARCHAR(6)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS activation_expires_at TIMESTAMP",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS activation_attempts SMALLINT NOT NULL DEFAULT 0",
    "ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plate_recognizer_token VARCHAR(200)",
    "ALTER TABLE tenants ADD COLUMN IF NOT EXISTS reminder_message_template VARCHAR(1000)",
    "ALTER TABLE cars ADD COLUMN IF NOT EXISTS car_color VARCHAR(30)",
    "ALTER TABLE message_logs ADD COLUMN IF NOT EXISTS reminder_type VARCHAR(20) NOT NULL DEFAULT 'pre_reminder'",
]

with engine.connect() as conn:
    for sql in migrations:
        try:
            conn.execute(text(sql))
            print("OK:", sql[:70])
        except Exception as e:
            print("SKIP:", str(e)[:80])
    conn.commit()

print("\nMigration complete.")
