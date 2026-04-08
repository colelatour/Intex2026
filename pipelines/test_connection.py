import os
import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv
import urllib

# Load your .env file
load_dotenv()

# Read credentials from environment variables
server   = os.environ['AZURE_SQL_SERVER']
database = os.environ['AZURE_SQL_DATABASE']
username = os.environ['AZURE_SQL_USERNAME']
password = os.environ['AZURE_SQL_PASSWORD']

# Build the connection string
params = urllib.parse.quote_plus(
    f"DRIVER={{ODBC Driver 18 for SQL Server}};"
    f"SERVER={server};"
    f"DATABASE={database};"
    f"UID={username};"
    f"PWD={password};"
    f"Encrypt=yes;"
    f"TrustServerCertificate=no;"
)

# Create the engine
engine = create_engine(f"mssql+pyodbc:///?odbc_connect={params}")

df = pd.read_sql("""
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_TYPE = 'BASE TABLE'
    ORDER BY TABLE_NAME
""", engine)
print(df)