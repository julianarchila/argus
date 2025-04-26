import sqlite3
import os
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from pathlib import Path

from src.utils import logger

# Database file path
DB_PATH = "data/news.db"

def get_db_connection():
    """Get a connection to the SQLite database."""
    # Ensure the data directory exists
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize the database with required tables."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # Create articles table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS articles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT UNIQUE NOT NULL,
            title TEXT,
            text TEXT NOT NULL,
            markdown TEXT NOT NULL,
            author TEXT,
            date TEXT,
            publication_date TEXT,
            lastmod TEXT,
            site_name TEXT NOT NULL,
            keywords TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        # Create site_tracking table to store last processed date
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS site_tracking (
            site_name TEXT PRIMARY KEY,
            last_processed TEXT NOT NULL
        )
        ''')
        
        conn.commit()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise
    finally:
        conn.close()

def save_articles(articles: List[Dict[str, Any]], site_name: str) -> int:
    """
    Save articles to the database.
    
    Args:
        articles: List of article dictionaries
        site_name: Name of the site the articles came from
    
    Returns:
        Number of articles saved
    """
    if not articles:
           return 0, []
        
    conn = get_db_connection()
    saved_count = 0
    article_ids: List[int] = []
    
    try:
        cursor = conn.cursor()
        
        for article in articles:
            # Convert keywords list to JSON string if present
            keywords_json = json.dumps(article.get("keywords", [])) if article.get("keywords") else None
            
            # Insert the article
            cursor.execute('''
            INSERT OR IGNORE INTO articles (
                url, title, text, markdown, author, date,
                publication_date, lastmod, site_name, keywords
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                article["url"],
                article.get("title"),
                article["text"],
                article["markdown"],
                article.get("author"),
                article.get("date"),
                article.get("publication_date"),
                article.get("lastmod"),
                site_name,
                keywords_json
            ))
            
       # Determine the article_id
            if cursor.rowcount > 0:
                saved_count += 1
                article_id = cursor.lastrowid
            else:
                # Already existed: fetch its ID
                cursor.execute("SELECT id FROM articles WHERE url = ?", (article["url"],))
                row = cursor.fetchone()
                article_id = row["id"] if row else None
            if article_id:
                article_ids.append(article_id)
        conn.commit()
        logger.info(f"Saved {saved_count} new articles for site {site_name}")
    except Exception as e:
        conn.rollback()
        logger.error(f"Error saving articles: {e}")
        raise
    finally:
        conn.close()
    return saved_count, article_ids

def get_last_processed_date(site_name: str) -> Optional[datetime]:
    """
    Get the last processed date for a site.
    
    Args:
        site_name: Name of the site
    
    Returns:
        Last processed date as datetime or None if not found
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT last_processed FROM site_tracking WHERE site_name = ?",
            (site_name,)
        )
        result = cursor.fetchone()
        
        if result and result[0]:
            return datetime.fromisoformat(result[0])
        return None
    except Exception as e:
        logger.error(f"Error getting last processed date: {e}")
        return None
    finally:
        conn.close()

def update_last_processed_date(site_name: str, last_processed: datetime) -> bool:
    """
    Update the last processed date for a site.
    
    Args:
        site_name: Name of the site
        last_processed: Last processed datetime
    
    Returns:
        True if successful, False otherwise
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        last_processed_iso = last_processed.isoformat()
        
        cursor.execute('''
        INSERT INTO site_tracking (site_name, last_processed)
        VALUES (?, ?)
        ON CONFLICT(site_name) DO UPDATE SET
            last_processed = excluded.last_processed
        ''', (site_name, last_processed_iso))
        
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        logger.error(f"Error updating last processed date: {e}")
        return False
    finally:
        conn.close() 

def save_embedding(article_id: int, embedding: List[float]) -> bool:
    """Save an embedding vector for an article."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        emb_json = json.dumps(embedding)
        cursor.execute(
            '''
            INSERT INTO embeddings (article_id, embedding) VALUES (?, ?)
            ''',
            (article_id, emb_json)
        )
        conn.commit()
        logger.info(f"Saved embedding for article_id {article_id}")
        return True
    except Exception as e:
        conn.rollback()
        logger.error(f"Error saving embedding for article {article_id}: {e}")
        return False
    finally:
        conn.close()