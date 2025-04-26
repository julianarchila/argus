from typing import List, Dict, Any
import openai
from src.article_parser.base import Article
from src.database.db import save_articles, save_embedding
from src.utils import logger


def generate_embedding(article: Article, model: str = "text-embedding-ada-002") -> List[float]:
    """
    Generate an embedding vector for the given Article using OpenAI Embeddings API.

    Parameters:
    - article: Article instance containing text and markdown.
    - model: The OpenAI embedding model to use.

    Returns:
    - A list of floats representing the embedding vector.
    """
    # Select content: prefer markdown over plain text
    content = article.markdown or article.text
    content = content.strip()

    # Truncate if too long to stay within token limits
    max_chars = 15000  # adjust based on model limits
    if len(content) > max_chars:
        logger.debug("Truncating content from %d to %d characters", len(content), max_chars)
        content = content[:max_chars]

    response = openai.Embedding.create(
        input=content,
        model=model
    )
    embedding = response["data"][0]["embedding"]
    return embedding


def main(articles_data: List[Dict[str, Any]], site_name: str):
    """
    Save articles, generate embeddings, and store them in DB.

    Parameters:
    - articles_data: list of article dicts as expected by save_articles
    - site_name: identifier for the news site
    """
    # 1) Persist articles and retrieve their IDs
    saved_count, article_ids = save_articles(articles_data, site_name)
    logger.info(f"Saved {saved_count} articles for site {site_name}")

    # 2) For each saved article, generate and store its embedding
    for article_dict, article_id in zip(articles_data, article_ids):
        article = Article(**article_dict)
        try:
            vec = generate_embedding(article)
            success = save_embedding(article_id, vec)
            if not success:
                logger.error(f"Failed to save embedding for article_id {article_id}")
        except Exception as e:
            logger.error(f"Embedding generation failed for {article.url}: {e}")


if __name__ == "__main__":
    # Example usage: define your feed parser and prepare articles_data
    from src.article_parser.eltiempo import ElTiempoRSSParser
    # Retrieve unprocessed feed items
    parser = ElTiempoRSSParser("https://www.eltiempo.com/sitemap.xml", None)
    feed_items = parser.get_unprocessed_items()
    # Convert FeedItem to dict form matching save_articles input
    articles_data = [item.__dict__ for item in feed_items]
    main(articles_data, parser.feed_url)
