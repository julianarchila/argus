

from .base import ArticleParser, Article
from bs4 import BeautifulSoup
from bs4.element import Tag
from markdownify import markdownify as md
import requests

class ElPaisArticleParser(ArticleParser):
    def fetch(self) -> BeautifulSoup:
        resp = requests.get(self.url)
        return BeautifulSoup(resp.content, "html.parser")

    def extract_content(self, soup: BeautifulSoup) -> Article:
        # 1) Localiza el contenedor principal según inspección manual
        content_div = soup.find("div", class_="c-cuerpo")
        text, markdown = "", ""

        if isinstance(content_div, Tag):
            # 2) Extrae párrafos
            for p in content_div.find_all("p"):
                text += p.get_text(separator="\n") + "\n"
                markdown += md(str(p)) + "\n"

        return Article(
            url=self.url,
            text=text.strip(),
            markdown=markdown.strip(),
            author=None,  
            date=None,   
        )
