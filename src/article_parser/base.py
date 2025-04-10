from abc import ABC, abstractmethod
from dataclasses import dataclass  # Removed unused 'field'
from typing import Optional
from bs4 import BeautifulSoup

@dataclass
class Article:
    url: str
    text: str = ""
    markdown: str = ""
    author: Optional[str] = None
    date: Optional[str] = None
    # Future fields can be added here (e.g., summary, tags, etc.)

class ArticleParser(ABC):
    def __init__(self, url: str):
        self.url = url

    @abstractmethod
    def fetch(self) -> BeautifulSoup:
        """Fetch the webpage and return a BeautifulSoup object."""
        pass

    @abstractmethod
    def extract_content(self, soup: BeautifulSoup) -> Article:
        """Extract content from the BeautifulSoup object and return an Article object."""
        pass

    def parse(self) -> Article:
        """Fetch and extract content in one go."""
        soup = self.fetch()
        return self.extract_content(soup)

