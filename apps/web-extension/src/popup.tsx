import { useState, useEffect } from "react";
import "./popup.css";
import ClickableLink from "./components/ClickableLink";

function IndexPopup() {
  useEffect(() => {
    // Handle filter icons
    const filterIcons = document.querySelectorAll(".filter-icons svg");
    for (const icon of filterIcons) {
      icon.addEventListener("click", () => {
        // Toggle active state visually
        icon.classList.toggle("active");
        // In a real app, this would filter the content
      });
    }
  }, []);

  return (
    <div className="popup-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="logo">
            <title>Argus Logo</title>
            <path d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,5V7.5H5V5H19M5,19V9.5H19V19H5Z" />
          </svg>
          <h1 className="app-title">Argus</h1>
        </div>
      </header>

      {/* Current Article */}
      <section className="current-article">
        <h2 className="section-title">Current Article</h2>
        <div className="article-content">
          <ClickableLink href="https://example.com/article" className="article-title-link">
            <h3 className="article-title">
              Global Summit Addresses Climate Change Amidst Rising Tensions
            </h3>
          </ClickableLink>
          <div className="article-meta">
            <span className="source">The New York Times</span>
            <span className="date">Published on July 28, 2024</span>
          </div>
        </div>
      </section>

      {/* Key Contrasts */}
      <section className="key-contrasts">
        <div className="section-header">
          <h2 className="section-title">Key Contrasts</h2>
          <ClickableLink href="https://example.com/all-contrasts" className="view-all">
            View All
          </ClickableLink>
        </div>
        <div className="contrasts-list">
          <div className="contrast-item">
            <div className="contrast-indicator orange" />
            <div className="contrast-content">
              <h4>Focus on Economic Impact vs. Geopolitical Strategy</h4>
              <p>
                Current article emphasizes economic repercussions, while BBC
                highlights the geopolitical chess game.
              </p>
            </div>
          </div>
          <div className="contrast-item">
            <div className="contrast-indicator purple" />
            <div className="contrast-content">
              <h4>Differing Quotes from Key Leaders</h4>
              <p>
                Reuters includes a crucial statement from the EU representative
                not found in the current article.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Related Articles */}
      <section className="related-articles">
        <div className="section-header">
          <h2 className="section-title">Related Articles</h2>
          <div className="filter-icons">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <title>Filter Icon</title>
              <path d="M14,12V19.88C14.04,20.18 13.94,20.5 13.71,20.71C13.32,21.1 12.69,21.1 12.3,20.71L10.29,18.7C10.06,18.47 9.96,18.16 10,17.87V12H9.97L4.21,4.62C3.87,4.19 3.95,3.56 4.38,3.22C4.57,3.08 4.78,3 5,3V3H19V3C19.22,3 19.43,3.08 19.62,3.22C20.05,3.56 20.13,4.19 19.79,4.62L14.03,12H14Z" />
            </svg>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <title>Sort Icon</title>
              <path d="M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z" />
            </svg>
          </div>
        </div>
        <div className="articles-list">
          <article className="related-article">
            <ClickableLink href="https://example.com/article" className="related-title-link">
              <h4 className="related-title">
                Climate Summit: World Leaders Clash Over Emission Targets
              </h4>
            </ClickableLink>
            <div className="related-meta">
              <span className="related-source">BBC News</span>
              <span className="related-date">Published on July 28, 2024</span>
            </div>
            <div className="key-differences">
              <span className="differences-label">Key Differences:</span>
              <p>
                Highlights internal disagreements and specific national pledges
                more prominently.
              </p>
            </div>
            <ClickableLink
              href="https://example.com/bbc-climate-summit"
              className="read-article">
              Read Article ↗
            </ClickableLink>
          </article>

          <article className="related-article">
            <ClickableLink href="https://example.com/article" className="related-title-link">
              <h4 className="related-title">
                Exclusive: Leaked Document Reveals Climate Summit's Hidden Agenda
              </h4>
            </ClickableLink>
            <div className="related-meta">
              <span className="related-source">Reuters</span>
              <span className="related-date">Published on July 27, 2024</span>
            </div>
            <div className="key-differences">
              <span className="differences-label">Key Differences:</span>
              <p>
                Focuses on behind-the-scenes negotiations and potential
                conflicts of interest.
              </p>
            </div>
            <ClickableLink
              href="https://example.com/reuters-leaked-document"
              className="read-article">
              Read Article ↗
            </ClickableLink>
          </article>

          <article className="related-article">
            <ClickableLink href="https://example.com/article" className="related-title-link">
              <h4 className="related-title">
                Activists Protest Lack of Action at Global Climate Talks
              </h4>
            </ClickableLink>
            <div className="related-meta">
              <span className="related-source">The Guardian</span>
              <span className="related-date">Published on July 28, 2024</span>
            </div>
            <div className="key-differences">
              <span className="differences-label">Key Differences:</span>
              <p>
                Emphasizes public reaction and activist perspectives, largely
                absent in the current article.
              </p>
            </div>
            <ClickableLink
              href="https://example.com/guardian-activists-protest"
              className="read-article">
              Read Article ↗
            </ClickableLink>
          </article>
        </div>
      </section>
    </div>
  );
}

export default IndexPopup;
