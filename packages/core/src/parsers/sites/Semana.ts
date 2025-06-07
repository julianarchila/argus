import { createArticleParser, createFeedParser } from "../parser-utils";
import { FeedItem, SiteConfig } from "../types";
import TurndownService from "turndown";

// Constants
const SITE_NAME = "semana";
const FEED_URL =
  "https://www.semana.com/arc/outboundfeeds/news-sitemap/?from=0&outputType=xml";

/**
 * Parse the Semana news sitemap using Cheerio
 */
const parseFeed = ($: cheerio.Root): FeedItem[] => {
  const items: FeedItem[] = [];
  $("url").each((_, el) => {
    const loc = $(el).find("loc").text().trim();
    const lastmod = $(el).find("lastmod").text().trim();
    const title = $(el).find("news\\:title").text().trim();
    const pubDate = $(el)
      .find("news\\:publication_date")
      .text()
      .trim();
    const keywords = $(el).find("news\\:keywords").text().trim();

    if (!loc || !title) return;

    items.push({
      url: loc,
      title,
      lastModified: lastmod ? new Date(lastmod) : new Date(pubDate),
      publicationDate: pubDate ? new Date(pubDate) : new Date(lastmod),
      keywords,
    });
  });

  return items;
};

/**
 * Article parser for Semana - FIXED VERSION
 */
const parseArticle = ($: cheerio.Root) => {
  const turndownService = new TurndownService();
  
  // Configure turndown to handle links properly
  turndownService.addRule('links', {
    filter: 'a',
    replacement: function (content, node) {
      const href = node.getAttribute('href');
      return href ? `[${content}](${href})` : content;
    }
  });

  // Título del artículo - multiple fallbacks
  const title =
    $("h1").first().text().trim() ||
    $('meta[property="og:title"]').attr("content")?.trim() ||
    $('title').text().trim() ||
    "";

  // Autor - check multiple possible selectors
  const author = 
    $('meta[name="author"]').attr("content")?.trim() ||
    $('meta[property="article:author"]').attr("content")?.trim() ||
    $('[class*="author"]').first().text().trim() ||
    null;

  // Fecha de publicación - multiple fallbacks
  const dateStr = 
    $('meta[property="article:published_time"]').attr("content") ||
    $('meta[name="date"]').attr("content") ||
    $('time[datetime]').attr("datetime") ||
    "";
  const date = dateStr ? new Date(dateStr) : null;

  // Contenido del artículo - PROBLEMA PRINCIPAL: El selector actual no existe
  // Según el HTML real, necesitamos buscar los párrafos de manera diferente
  let articleText = "";

  // Intentar múltiples selectores para encontrar el contenido principal
  const contentSelectors = [
    'div.max-w-screen-md.prose.prose-lg.mx-auto.mb-5 p[data-type="text"]', // Tu selector original
    'article p', // Selector más genérico
    '.article-content p', // Selector de contenido de artículo
    'div[class*="prose"] p', // Cualquier div con clase prose
    'main p', // Párrafos en el main
    'p' // Fallback: todos los párrafos
  ];

  let contentFound = false;
  
  for (const selector of contentSelectors) {
    const paragraphs = $(selector);
    if (paragraphs.length > 0) {
      paragraphs.each((_, p) => {
        const text = $(p).text().trim();
        const html = $(p).html() || "";
        
        // Filtrar párrafos muy cortos o que parecen ser navegación/metadata
        if (text.length > 20 && 
            !text.match(/^(Siga|Seguir|Más|También|Ver|Leer)/i) &&
            !text.match(/^@\w+/) && // Handles de redes sociales
            !text.includes('pic.twitter.com') &&
            !text.includes('t.co/')) {
          articleText += text + "\n\n";
         
        }
      });
      
      if (articleText.trim().length > 100) {
        contentFound = true;
        break;
      } else {
        // Reset si no encontramos suficiente contenido
        articleText = "";
    
      }
    }
  }

  // Si no encontramos contenido con párrafos, intentar con otros elementos
  if (!contentFound) {
    const textElements = $('div, span, section').filter((_, el) => {
      const text = $(el).text().trim();
      return text.length > 50 && 
             text.length < 2000 && // Evitar elementos muy largos que podrían ser toda la página
             !$(el).find('script').length && // Sin scripts
             !$(el).find('style').length; // Sin estilos
    });

    textElements.each((_, el) => {
      const text = $(el).text().trim();
      const html = $(el).html() || "";
      
      if (text && !articleText.includes(text.substring(0, 50))) {
        articleText += text + "\n\n";
      
      }
    });
  }

  // Limpiar el contenido final
  articleText = articleText.trim().replace(/\n{3,}/g, '\n\n');

  return {
    title,
    text: articleText,
    markdown: "", 
    author,
    date,
  };
};

/**
 * Export configuration for site
 */
export const semanaConfig: SiteConfig = {
  siteName: SITE_NAME,
  feedParser: createFeedParser(SITE_NAME, FEED_URL, parseFeed),
  articleParser: createArticleParser(SITE_NAME, parseArticle),
};