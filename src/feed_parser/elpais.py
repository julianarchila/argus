

from .base import RSSFeedParser, FeedItem
from bs4 import BeautifulSoup
from datetime import datetime
from typing import List             
from src.utils import logger

class ElPaisRSSParser(RSSFeedParser):
    def parse_feed(self, tree: BeautifulSoup) -> List[FeedItem]:  
        items: List[FeedItem] = []                                
        # 1) find all nodes <url>
        for url_node in tree.find_all("url"):
            loc = url_node.find("loc")
            if not loc or not loc.text:
                continue
            link = loc.text.strip()

            # 2) lastmod 
            lastmod = None
            lm = url_node.find("lastmod")
            if lm and lm.text:
                lastmod = datetime.fromisoformat(lm.text.strip())

            # 3) sección <news:news> 
            pub_date = None
            title = None
            keywords = None
            news = url_node.find("news:news")
            if news:
                pd = news.find("news:publication_date")
                if pd and pd.text:
                    pub_date = datetime.fromisoformat(pd.text.strip())
                tn = news.find("news:title")
                if tn and tn.text:
                    title = tn.text.strip()
                kw = news.find("news:keywords")
                if kw and kw.text:
                    keywords = [k.strip() for k in kw.text.split(",")]

            items.append(FeedItem(
                url=link,
                lastmod=lastmod,
                publication_date=pub_date,
                title=title,
                keywords=keywords
            ))

        logger.debug(f"ElPaisRSSParser: parsed {len(items)} items")
        return items
