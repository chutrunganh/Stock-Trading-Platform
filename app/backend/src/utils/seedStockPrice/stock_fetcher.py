import requests
import psycopg2
from psycopg2.extras import RealDictCursor
import argparse
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv, find_dotenv
import logging
import time
import pandas as pd
from pathlib import Path

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

#Define the root directory - for loading .env file
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent.parent.parent

#load all the environment variables
load_dotenv(os.path.join(PROJECT_ROOT, '.env'))
#Alpha Vantage API key - specified in the .env file
ALPHA_VANTAGE_API_KEY = os.getenv('ALPHA_VANTAGE_API_KEY')
if not ALPHA_VANTAGE_API_KEY:
    logger.error("No Alpha Vantage API key found. Please add ALPHA_VANTAGE_API_KEY to your .env file.")
    exit(1)

def get_db_connection():
    """Establish connection to the PostgreSQL database."""
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            database=os.getenv('DB_NAME', 'postgres'),
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD', ''),
            port=os.getenv('DB_PORT', '5432')
        )
        return conn
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        raise

def check_stock_exists(conn, symbol):
    """Check if a stock already exists in the database."""
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("SELECT stock_id FROM stocks WHERE symbol = %s", (symbol,))
            result = cursor.fetchone()
            return result['stock_id'] if result else None
    except Exception as e:
        logger.error(f"Error checking if stock exists: {e}")
        conn.rollback()
        raise

def insert_stock_info(conn, stock_info):
    """Insert stock information into the stocks table."""
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            query = """
            INSERT INTO stocks (symbol, company_name, industry, market_cap, description)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING stock_id
            """
            cursor.execute(
                query,
                (
                    stock_info['symbol'],
                    stock_info['company_name'],
                    stock_info['industry'],
                    stock_info['market_cap'],
                    stock_info['description']
                )
            )
            stock_id = cursor.fetchone()['stock_id']
            conn.commit()
            return stock_id
    except Exception as e:
        logger.error(f"Error inserting stock info: {e}")
        conn.rollback()
        raise

def update_stock_info(conn, stock_id, stock_info):
    """Update stock information in the stocks table."""
    try:
        with conn.cursor() as cursor:
            query = """
            UPDATE stocks 
            SET company_name = %s, industry = %s, market_cap = %s, description = %s
            WHERE stock_id = %s
            """
            cursor.execute(
                query,
                (
                    stock_info['company_name'],
                    stock_info['industry'],
                    stock_info['market_cap'],
                    stock_info['description'],
                    stock_id
                )
            )
            conn.commit()
            return stock_id
    except Exception as e:
        logger.error(f"Error updating stock info: {e}")
        conn.rollback()
        raise

def insert_stock_prices(conn, stock_id, price_data):
    """Insert stock price data into the stockprices table."""
    inserted_count = 0
    skipped_count = 0
    
    try:
        with conn.cursor() as cursor:
            for date, row in price_data.iterrows():
                try:
                    query = """
                    INSERT INTO stockprices 
                    (stock_id, date, open_price, high_price, low_price, close_price, volume)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """
                    cursor.execute(
                        query,
                        (
                            stock_id,
                            date,
                            float(row['open']),
                            float(row['high']),
                            float(row['low']),
                            float(row['close']),
                            int(row['volume'])
                        )
                    )
                    inserted_count += 1
                except psycopg2.errors.UniqueViolation:
                    # Skip duplicate entries (based on unique constraint)
                    conn.rollback()
                    skipped_count += 1
                    continue
                except Exception as e:
                    logger.error(f"Error inserting price for {date}: {e}")
                    conn.rollback()
                    continue
            
            conn.commit()
            return inserted_count, skipped_count
    except Exception as e:
        logger.error(f"Error inserting stock prices: {e}")
        conn.rollback()
        raise

def get_stock_info(ticker_symbol):
    """Fetch stock information from Alpha Vantage."""
    try:
        # Company Overview endpoint
        url = f"https://www.alphavantage.co/query?function=OVERVIEW&symbol={ticker_symbol}&apikey={ALPHA_VANTAGE_API_KEY}"
        response = requests.get(url)
        response.raise_for_status()  # Raise exception for HTTP errors
        data = response.json()
        
        if not data or "Symbol" not in data:
            logger.error(f"No company information found for {ticker_symbol}")
            raise ValueError(f"No company information found for {ticker_symbol}")
        
        # Extract relevant information
        stock_info = {
            'symbol': ticker_symbol,
            'company_name': data.get('Name', ticker_symbol),
            'industry': data.get('Industry', 'Unknown'),
            'market_cap': float(data.get('MarketCapitalization', 0)),
            'description': data.get('Description', 'No description available')
        }
        
        return stock_info
    except requests.exceptions.HTTPError as e:
        logger.error(f"HTTP error fetching stock info: {e}")
        # If we get a 429 Too Many Requests error
        if e.response.status_code == 429:
            logger.warning("Rate limit hit. Waiting 60 seconds before retry")
            time.sleep(60)  # Wait for 60 seconds before retrying
            return get_stock_info(ticker_symbol)  # Retry
        raise
    except Exception as e:
        logger.error(f"Error fetching stock info: {e}")
        raise

def get_stock_prices(ticker_symbol, start_date, end_date):
    """Fetch historical stock prices from Alpha Vantage."""
    try:
        # Daily Time Series endpoint
        url = f"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol={ticker_symbol}&outputsize=full&apikey={ALPHA_VANTAGE_API_KEY}"
        response = requests.get(url)
        response.raise_for_status()  # Raise exception for HTTP errors
        data = response.json()
        
        if "Time Series (Daily)" not in data:
            logger.error(f"No price data found for {ticker_symbol}")
            if "Note" in data:
                logger.error(f"API message: {data['Note']}")
            raise ValueError(f"No price data found for {ticker_symbol}")
        
        # Convert to pandas DataFrame
        time_series = data["Time Series (Daily)"]
        df = pd.DataFrame.from_dict(time_series, orient='index')
        
        # Rename columns to match our database schema
        df.rename(columns={
            '1. open': 'open',
            '2. high': 'high',
            '3. low': 'low',
            '4. close': 'close',
            '5. volume': 'volume'
        }, inplace=True)
        
        # Convert index to datetime
        df.index = pd.to_datetime(df.index)
        
        # Filter by date range
        start = pd.to_datetime(start_date)
        end = pd.to_datetime(end_date)
        df = df[(df.index >= start) & (df.index <= end)]
        
        # Convert to numeric
        for col in ['open', 'high', 'low', 'close', 'volume']:
            df[col] = pd.to_numeric(df[col])
        
        # Sort by date (newest first)
        df = df.sort_index(ascending=False)
        
        return df
    except requests.exceptions.HTTPError as e:
        logger.error(f"HTTP error fetching stock prices: {e}")
        # If we get a 429 Too Many Requests error
        if e.response.status_code == 429:
            logger.warning("Rate limit hit. Waiting 60 seconds before retry")
            time.sleep(60)  # Wait for 60 seconds before retrying
            return get_stock_prices(ticker_symbol, start_date, end_date)  # Retry
        raise
    except Exception as e:
        logger.error(f"Error fetching stock prices: {e}")
        raise

def main():
    parser = argparse.ArgumentParser(description='Fetch stock data and save to database')
    parser.add_argument('symbol', type=str, help='Stock ticker symbol (e.g., AAPL)')
    parser.add_argument('--start', type=str, help='Start date (YYYY-MM-DD)', 
                        default=(datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d'))
    parser.add_argument('--end', type=str, help='End date (YYYY-MM-DD)', 
                        default=datetime.now().strftime('%Y-%m-%d'))
    parser.add_argument('--update-info', action='store_true', 
                        help='Update stock info even if it already exists')
    
    args = parser.parse_args()
    
    # Validate the symbol
    ticker_symbol = args.symbol.upper()
    
    try:
        # Connect to the database
        conn = get_db_connection()
        
        # Check if the stock already exists
        stock_id = check_stock_exists(conn, ticker_symbol)
        
        if stock_id is None:
            # Fetch stock information
            logger.info(f"Fetching information for {ticker_symbol}...")
            stock_info = get_stock_info(ticker_symbol)
            
            # Insert new stock
            stock_id = insert_stock_info(conn, stock_info)
            logger.info(f"Added {ticker_symbol} to stocks table with ID {stock_id}")
        elif args.update_info:
            # Update existing stock info
            logger.info(f"Updating information for {ticker_symbol}...")
            stock_info = get_stock_info(ticker_symbol)
            update_stock_info(conn, stock_id, stock_info)
            logger.info(f"Updated {ticker_symbol} info")
        else:
            logger.info(f"Stock {ticker_symbol} already exists with ID {stock_id}")
        
        # Fetch historical stock prices
        logger.info(f"Fetching price history for {ticker_symbol} from {args.start} to {args.end}...")
        price_data = get_stock_prices(ticker_symbol, args.start, args.end)
        
        if not price_data.empty:
            # Insert price data
            inserted, skipped = insert_stock_prices(conn, stock_id, price_data)
            logger.info(f"Inserted {inserted} price records for {ticker_symbol} (skipped {skipped} duplicates)")
        else:
            logger.warning(f"No price data available for {ticker_symbol}")
        
        # Close connection
        conn.close()
        
    except Exception as e:
        logger.error(f"An error occurred: {e}")
        exit(1)
    
    logger.info("Operation completed successfully")

if __name__ == "__main__":
    main()