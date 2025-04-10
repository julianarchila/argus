from bs4 import BeautifulSoup 
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional, Sequence 
import abc
import requests
from src.utils import logger

@dataclass
class FeedItem:
    url: str
    lastmod: Optional[datetime] = None
    publication_date: Optional[datetime] = None
    title: Optional[str] = None
    keywords: Optional[Sequence[str]] = None

class RSSFeedParser(abc.ABC):
    def __init__(self, feed_url: str, last_processed: Optional[datetime] = None):
        self.feed_url = feed_url
        self.last_processed = last_processed

    def fetch(self) -> BeautifulSoup:
        """Fetches and parses the RSS feed using BeautifulSoup."""
        logger.debug("Fetching feed from URL: %s", self.feed_url)
        response = requests.get(self.feed_url)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, "xml")
        return soup
    

    @abc.abstractmethod
    def parse_feed(self, tree: BeautifulSoup) -> Sequence[FeedItem]:
        """Parses the feed content into a sequence of FeedItems."""
        pass

    def get_unprocessed_items(self) -> Sequence[FeedItem]:
        """Returns feed items newer than the last processed timestamp."""
        tree = self.fetch()
        items = self.parse_feed(tree)
        logger.debug("Total parsed FeedItems: %d", len(items))
        if self.last_processed:
            last_processed_utc = (
                self.last_processed.replace(tzinfo=timezone.utc)
                if self.last_processed.tzinfo is None else self.last_processed
            )
            filtered_items = []
            for item in items:
                if item.publication_date is None:
                    logger.debug("Item %s has no publication_date; skipping.", item.url)
                    continue
                pub_date_utc = item.publication_date.astimezone(timezone.utc)
                if pub_date_utc > last_processed_utc:
                    filtered_items.append(item)
            return filtered_items
        return items
