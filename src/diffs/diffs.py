from typing import List, Dict
import openai
from src.article_parser.base import Article
from src.database.db import save_diff


def generate_diff(article: Article, other_texts: List[str], model: str = "gpt-4") -> str:
    """
    Generate a textual diff for `article` against a list of other articles' content.

    A "diff" here is a summary of differences and unique points of the target article
    when compared to similar articles in the same cluster.
    """
    # Build a comparison prompt
    others_combined = "\n\n---\n\n".join(other_texts)
    prompt = f"""
You are an assistant that extracts the distinctive points of a target article
compared to related articles. Provide a diff-like summary highlighting
unique additions, changes, or perspectives in the target article.

---
TARGET ARTICLE:
{article.markdown or article.text}
---
RELATED ARTICLES:
{others_combined}
"""
    response = openai.ChatCompletion.create(
        model=model,
        messages=[
            {"role": "system", "content": "You compare texts and highlight differences."},
            {"role": "user", "content": prompt}
        ]
    )
    diff_text = response.choices[0].message.content.strip()
    return diff_text


def process_cluster_diffs(cluster_article_texts: Dict[int, Article], model: str = "gpt-4"):
    """
    For each article in a cluster, generate and save its diff against others.

    Args:
        cluster_article_texts: mapping of article_id to Article instance
    """
    ids = list(cluster_article_texts.keys())
    for aid in ids:
        target = cluster_article_texts[aid]
        others = [cluster_article_texts[oid].markdown or cluster_article_texts[oid].text for oid in ids if oid != aid]
        if not others:
            continue
        diff = generate_diff(target, others, model)
        save_diff(aid, diff)
