from .base import RSSFeedParser, FeedItem
from datetime import timezone
from datetime import datetime
from typing import Sequence, Any
from bs4 import BeautifulSoup

from src.utils import logger


# ------------------------------------------------------------------------------
# Concrete implementation for the El Tiempo XML feed.
# ------------------------------------------------------------------------------
class ElTiempoRSSParser(RSSFeedParser):
    def parse_feed(self, tree: BeautifulSoup) -> Sequence[FeedItem]:
        """Parses an El Tiempo RSS feed into FeedItems using BeautifulSoup."""
        items: list[FeedItem] = []
        url_nodes:Any = tree.find_all("url")

        print(type(url_nodes[0]))

        for url_node in url_nodes:
            loc_node = url_node.find("loc")
            if not loc_node or not loc_node.text:
                print("No <loc> element found; skipping.")
                continue
            loc = loc_node.text.strip()

            lastmod = None
            lastmod_node = url_node.find("lastmod")
            if lastmod_node and lastmod_node.text:
                try:
                    lastmod = datetime.fromisoformat(lastmod_node.text.strip())
                except Exception as e:
                    print(f"Failed to parse <lastmod> for {loc}: {e}")

            news_node = url_node.find("news:news")
            publication_date = None
            title = None
            keywords = None
            if news_node:
                pub_date_node = news_node.find("news:publication_date")
                if pub_date_node and pub_date_node.text:
                    try:
                        publication_date = datetime.fromisoformat(pub_date_node.text.strip())
                    except Exception as e:
                        logger.debug("Failed to parse <news:publication_date> for %s: %s", loc, e)
                title_node = news_node.find("news:title")
                if title_node and title_node.text:
                    title = title_node.text.strip()
                keywords_node = news_node.find("news:keywords")
                if keywords_node and keywords_node.text:
                    keywords = keywords_node.text.split(",")
                    keywords = [keyword.strip() for keyword in keywords]

            item = FeedItem(
                url=loc,
                lastmod=lastmod,
                publication_date=publication_date,
                title=title,
                keywords=keywords
            )
            items.append(item) 

        logger.debug("Total parsed FeedItems: %d", len(items))
        return items






# ------------------------------------------------------------------------------
# Example usage.
# ------------------------------------------------------------------------------
if __name__ == "__main__":
    from datetime import timedelta

    # Set last processed to 1 day ago (timezone-aware).
    last_processed_time = datetime.now(timezone.utc) - timedelta(days=1)
    feed_url = "https://www.eltiempo.com/sitemap-google-news.xml"
    
    # Choose an adapter; for example, LxmlParserAdapter.
    parser = ElTiempoRSSParser(feed_url, last_processed=last_processed_time)
    
    try:
        new_items = parser.get_unprocessed_items()
        logger.info("Found %d new items.", len(new_items))
        for item in new_items[:10]:
            print("=" * 40)
            print(f"Title: {item.title}")
            print(f"Publication Date: {item.publication_date}")
            print(f"URL: {item.url}")
            print(f"Keywords: {item.keywords}")
            print("=" * 40)
    except Exception as e:
        logger.exception("An error occurred during feed processing: %s", e)

