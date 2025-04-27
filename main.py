import json
import os
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Type, Optional, NamedTuple

from src.feed_parser.base import RSSFeedParser
from src.article_parser.base import ArticleParser, Article
from src.feed_parser.eltiempo import ElTiempoRSSParser
from src.feed_parser.elpais import ElPaisRSSParser
from src.article_parser.eltiempo import ElTiempoArticleParser
from src.article_parser.elpais import ElPaisArticleParser
from src.database import init_db, get_last_processed_date, update_last_processed_date, save_articles
from src.utils import logger

from fastapi import FastAPI, HTTPException, Query
from typing import List
from src.api.schemas import RelatedArticleDTO
from src.database.db import get_db_connection


class NewsSiteConfig(NamedTuple):
    """Configuration for a news site crawler."""
    name: str
    feed_url: str
    feed_parser_class: Type[RSSFeedParser]
    article_parser_class: Type[ArticleParser]


class NewsRegistry:
    """Registry for news site configurations."""
    
    def __init__(self):
        self.sites: Dict[str, NewsSiteConfig] = {}
    
    def register_site(self, config: NewsSiteConfig) -> None:
        """Register a news site configuration."""
        self.sites[config.name] = config
        
    def get_site(self, name: str) -> Optional[NewsSiteConfig]:
        """Get a news site configuration by name."""
        return self.sites.get(name)
    
    def get_all_sites(self) -> List[NewsSiteConfig]:
        """Get all registered news site configurations."""
        return list(self.sites.values())


def process_feed(config: NewsSiteConfig) -> None:
    """
    Process a feed using the configuration's parsers and save results to the database.
    
    Args:
        config: The news site configuration
    """
    # Get the last processed date from database or use default (1 day ago)
    last_processed = get_last_processed_date(config.name)
    if not last_processed:
        # Default to 1 day ago if no last processed date is found
        last_processed = datetime.now(timezone.utc) - timedelta(days=1)
        logger.info(f"No previous processing record for {config.name}, using default (1 day ago)")
    
    # Create feed parser instance with the last processed date
    feed_parser = config.feed_parser_class(config.feed_url, last_processed=last_processed)
    
    # Get unprocessed items from the feed
    items = feed_parser.get_unprocessed_items()
    logger.info(f"[{config.name}] Found {len(items)} new items to process")
    
    # Process each item with the appropriate article parser
    articles: List[Dict[str, Any]] = []
    for item in items:
        try:
            # Create an article parser for the item URL
            parser = config.article_parser_class(item.url)
            # Parse the article
            article = parser.parse()
            
            # Convert article to dictionary
            article_data = {
                "url": article.url,
                "text": article.text,
                "markdown": article.markdown,
                "author": article.author,
                "date": article.date,
                "title": item.title,
                "keywords": item.keywords,
                "publication_date": item.publication_date.isoformat() if item.publication_date else None,
                "lastmod": item.lastmod.isoformat() if item.lastmod else None
            }
            articles.append(article_data)
            logger.info(f"[{config.name}] Processed: {item.title}")
        except Exception as e:
            logger.error(f"[{config.name}] Error processing {item.url}: {e}")
    
    # Save articles to database
    if articles:
        saved_count = save_articles(articles, config.name)
        logger.info(f"[{config.name}] Saved {saved_count} articles to database")
        
        # Update last processed date if we have items
        if items:
            # Find most recent publication date from items
            most_recent = max(
                (item.publication_date for item in items if item.publication_date),
                default=datetime.now(timezone.utc)
            )
            update_last_processed_date(config.name, most_recent)
            logger.info(f"[{config.name}] Updated last processed date to {most_recent.isoformat()}")


def register_default_sites(registry: NewsRegistry) -> None:
    """Register default news sites with the registry."""
    # Register El Tiempo
    registry.register_site(
        NewsSiteConfig(
            name="eltiempo",
            feed_url="https://www.eltiempo.com/sitemap-google-news.xml",
            feed_parser_class=ElTiempoRSSParser,
            article_parser_class=ElTiempoArticleParser
        )
    )

    #  El País
    registry.register_site(
        NewsSiteConfig(
            name="elpais",
            feed_url="https://elpais.com/sitemap.xml",
            feed_parser_class=ElPaisRSSParser,
            article_parser_class=ElPaisArticleParser
        )
    )
    
    # To add a new site, just add another registry.register_site call here:
    # For example:
    # registry.register_site(
    #     NewsSiteConfig(
    #         name="newssite",
    #         feed_url="https://www.newssite.com/feed.xml",
    #         feed_parser_class=NewsSiteFeedParser,
    #         article_parser_class=NewsSiteArticleParser
    #     )
    # )


def process_all_sites(registry: NewsRegistry) -> None:
    """Process all registered news sites."""
    for site_config in registry.get_all_sites():
        process_feed(site_config)


def process_site(registry: NewsRegistry, site_name: str) -> None:
    """Process a specific news site by name."""
    site_config = registry.get_site(site_name)
    if site_config:
        process_feed(site_config)
    else:
        logger.error(f"No configuration found for site: {site_name}")

#FASTAPI CONTROLLER
app = FastAPI(
    title="Argus Related-Articles API",
    version="1.0",
)

@app.get("/api/related", response_model=List[RelatedArticleDTO])
def get_related(url: str = Query(..., description="URL of the article to find related versions")):
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1) Search for the main article by URL
    cursor.execute("SELECT id FROM articles WHERE url = ?", (url,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Article not found for URL: {url}")
    article_id = row["id"]

    # 2) Check its cluster
    cursor.execute(
        "SELECT cluster FROM article_clusters WHERE article_id = ?", (article_id,)
    )
    row = cursor.fetchone()
    if not row:
        conn.close()
        # No cluster assigned yet → empty list
        return []
    cluster = row["cluster"]

    # 3) Retrieve peers from the same cluster (excluding the primary)
    cursor.execute("""
        SELECT 
            a.id, a.url, a.title, a.site_name, 
            COALESCE(d.diff, '') AS diff
        FROM articles AS a
        JOIN article_clusters AS c ON a.id = c.article_id
        LEFT JOIN article_diffs AS d ON a.id = d.article_id
        WHERE c.cluster = ? AND a.id <> ?
    """, (cluster, article_id))
    peers = cursor.fetchall()
    conn.close()

    # 4) Mapea a DTOs
    result = [
        RelatedArticleDTO(
            id    = p["id"],
            url   = p["url"],
            title = p["title"],
            site_name = p["site_name"],
            diff  = p["diff"]
        )
        for p in peers
    ]
    return result


if __name__ == "__main__":
    # Initialize the database
    init_db()
    
    # Create and populate the registry
    registry = NewsRegistry()
    register_default_sites(registry)
    
    # Process all registered sites
    process_all_sites(registry)
    
    # Alternatively, process just one site:
    # process_site(registry, "eltiempo")
