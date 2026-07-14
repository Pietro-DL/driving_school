import sys
import os
import json
import subprocess
from sqlalchemy.inspection import inspect

# 1. Dynamically append the backend directory to the Python path
# This allows the script to import your FastAPI models from outside the backend folder.
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "../../backend"))
sys.path.append(BACKEND_DIR)

try:
    # 2. Import the SQLAlchemy Base and the models
    # Importing user_model ensures it is registered in Base.metadata
    from app.db.base_class import Base
    from app.models import user_model 
except ImportError as e:
    print(f"Error importing database models: {e}")
    print("Ensure you are running this from the correct virtual environment.")
    sys.exit(1)

def get_schema_dict():
    """Extracts tables, columns, and constraints directly from SQLAlchemy metadata."""
    schema = {}
    for table_name, table in Base.metadata.tables.items():
        columns = []
        for col in table.columns:
            columns.append({
                "name": col.name,
                "type": str(col.type),
                "primary_key": col.primary_key,
                "nullable": col.nullable,
                "default": str(col.default.arg) if col.default else None,
                "unique": col.unique
            })
        schema[table_name] = columns
    return schema

def get_alembic_history():
    """Runs the Alembic history command to get the migration timeline."""
    try:
        # We run the command inside the backend directory where alembic.ini lives
        result = subprocess.run(
            ["alembic", "history"], 
            cwd=BACKEND_DIR,
            capture_output=True, 
            text=True,
            shell=True # <-- Add this line
        )
        if result.returncode != 0:
            return ["Alembic history not found or Alembic not yet initialized."]
        
        # Split the output by lines to make it a clean JSON array
        return [line for line in result.stdout.strip().split('\n') if line]
    
    except Exception as e:
        return [f"Failed to execute Alembic command: {str(e)}"]

if __name__ == "__main__":
    # 3. Compile the documentation payload
    schema_info = {
        "models": get_schema_dict(),
        "migration_history": get_alembic_history()
    }
    
    # 4. Save to db_schema.json in the same directory as this script
    out_path = os.path.join(CURRENT_DIR, "db_schema.json")
    with open(out_path, "w") as f:
        json.dump(schema_info, f, indent=2)
    
    print(f"Database schema and Alembic history successfully saved to {out_path}")