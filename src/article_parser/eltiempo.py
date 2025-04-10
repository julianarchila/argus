from .base import ArticleParser, Article
from bs4 import BeautifulSoup
from bs4.element import Tag  # Import Tag for type checking
from markdownify import markdownify as md
import requests

class ElTiempoArticleParser(ArticleParser):
    def fetch(self) -> BeautifulSoup:
        response = requests.get(self.url)
        return BeautifulSoup(response.content, "html.parser")

    def extract_content(self, soup: BeautifulSoup) -> Article:
        # Find the main content div based on the website structure.
        content_div = soup.find("div", class_="c-cuerpo")
        article_text = ""
        article_markdown = ""
        # Check if content_div is a Tag before calling find_all
        if content_div and isinstance(content_div, Tag):
            paragraphs = content_div.find_all("div", class_="paragraph")
            for p in paragraphs:
                # Accumulate the plain text.
                article_text += p.get_text(separator="\n") + "\n"
                # Convert each paragraph's HTML into Markdown.
                article_markdown += md(str(p)) + "\n"
        # Additional fields like date and author can be extracted here.
        return Article(
            url=self.url,
            text=article_text.strip(),
            markdown=article_markdown.strip(),
            author=None,
            date=None
        )


# Example usage:
if __name__ == "__main__":
    url = (
        "https://www.eltiempo.com/deportes/futbol-internacional/eliminatoria-al-mundial-2026-asi-marcha-la-seleccion-colombia-en-la-tabla-de-posiciones-antes-de-visitar-brasil-3436789"
    )
    parser = ElTiempoArticleParser(url)
    article = parser.parse()
    
    print("Article Text:")
    print(article.text)
    print("\nArticle Markdown:")
    print(article.markdown)
