import argparse
import numpy as np
from sklearn.cluster import KMeans
from src.database.db import get_all_embeddings, save_cluster_assignment
from src.utils import logger


def cluster_embeddings(k: int = 8) -> None:
    """
    Run K-Means clustering on article embeddings and persist cluster assignments.

    Args:
        k: Number of clusters to form.
    """
    # 1) Load all embeddings
    emb_records = get_all_embeddings()  # List of tuples (record_id, article_id, vector)
    if not emb_records:
        logger.warning("No embeddings found to cluster.")
        return

    # Prepare data for clustering
    vectors = np.array([rec[2] for rec in emb_records])
    article_ids = [rec[1] for rec in emb_records]
    n_samples = len(article_ids)

    logger.info(f"Clustering {n_samples} embeddings into {k} clusters...")

    # 2) Fit KMeans model
    kmeans = KMeans(n_clusters=k, random_state=0)
    labels = kmeans.fit_predict(vectors)

    # 3) Persist cluster assignments
    for article_id, label in zip(article_ids, labels):
        success = save_cluster_assignment(article_id, int(label))
        if not success:
            logger.error(f"Failed to save cluster {label} for article_id {article_id}")

    logger.info("Cluster assignments saved successfully.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Cluster article embeddings and save assignments to the database."
    )
    parser.add_argument(
        "-k", "--n_clusters",
        type=int,
        default=8,
        help="Number of clusters to form (default: 8)."
    )
    args = parser.parse_args()
    cluster_embeddings(k=args.n_clusters)