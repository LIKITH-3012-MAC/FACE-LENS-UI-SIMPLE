import logging
from pathlib import Path
import mysql.connector
from backend.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("smart_attendance.init_db")

SCHEMA_FILE = Path(__file__).resolve().parent / "schema.sql"

def init_database(initial_db: str = "defaultdb", target_db: str = "smart_attendance"):
    """
    Connect to MySQL server, create target database (e.g. smart_attendance),
    and execute schema.sql to create all tables and indexes.
    """
    logger.info(f"Connecting to Cloud MySQL at {settings.DB_HOST}:{settings.DB_PORT}...")
    try:
        conn_params = {
            "host": settings.DB_HOST,
            "port": settings.DB_PORT,
            "user": settings.DB_USER,
            "password": settings.DB_PASSWORD,
            "charset": "utf8mb4",
            "collation": "utf8mb4_unicode_ci",
        }
        if settings.DB_SSL_DISABLED:
            conn_params["ssl_disabled"] = True

        # Try connecting with initial_db first (e.g. defaultdb on Aiven)
        conn = None
        try:
            conn_params_with_db = dict(conn_params)
            conn_params_with_db["database"] = initial_db
            conn = mysql.connector.connect(**conn_params_with_db)
            logger.info(f"Connected to initial database '{initial_db}'.")
        except mysql.connector.Error:
            # Fallback to connecting without database parameter
            conn = mysql.connector.connect(**conn_params)
            logger.info("Connected to MySQL server.")

        cursor = conn.cursor()

        # Create target project database
        logger.info(f"Creating database '{target_db}' if not exists...")
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{target_db}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        cursor.execute(f"USE `{target_db}`;")

        logger.info(f"Applying table schemas from {SCHEMA_FILE}...")
        with open(SCHEMA_FILE, "r", encoding="utf-8") as f:
            sql_script = f.read()

        # Execute statements
        for statement in sql_script.split(";"):
            stmt = statement.strip()
            # Skip CREATE DATABASE / USE from file since already selected
            if stmt and not stmt.upper().startswith("CREATE DATABASE") and not stmt.upper().startswith("USE "):
                try:
                    cursor.execute(stmt)
                except mysql.connector.Error as err:
                    logger.warning(f"Notice: {err.msg}")

        conn.commit()
        cursor.close()
        conn.close()
        logger.info(f"Database '{target_db}' and all tables initialized successfully!")
        return True, f"Database '{target_db}' and all tables initialized successfully!"
    except mysql.connector.Error as err:
        logger.error(f"MySQL error: [{err.errno}] {err.msg}")
        return False, f"MySQL error [{err.errno}]: {err.msg}"
    except Exception as ex:
        logger.error(f"Unexpected error: {str(ex)}")
        return False, f"Unexpected error: {str(ex)}"

if __name__ == "__main__":
    success, msg = init_database()
    print(msg)
