import { createArticleParser, createFeedParser } from "../parser-utils";
import { FeedItem, SiteConfig } from "../types";
import TurndownService from "turndown";

// Constants
const SITE_NAME = "publimetro";
const FEED_URL = "https://www.publimetro.co/co/sitemap/news-sitemap.xml";

/**
 * Parse Publimetro news sitemap XML using Cheerio
 */
const parseFeed = ($: cheerio.Root): FeedItem[] => {
  const items: FeedItem[] = [];
  $('url').each((_, el) => {
    const loc = $(el).find('loc').text();
    const lastmod = $(el).find('lastmod').text();
    const title = $(el).find('news\\:title').text();
    const pubDate = $(el).find('news\\:publication_date').text();
    const keywords = $(el).find('news\\:keywords').text();
    if (!loc) return;
    items.push({
      url: loc,
      title,
      lastModified: lastmod ? new Date(lastmod) : new Date(pubDate),
      publicationDate: new Date(pubDate),
      keywords,
    });
  });
  return items;
};

/**
 * Parse an individual Publimetro article page - FIXED VERSION
 */
const parseArticle = ($: cheerio.Root) => {
  const turndownService = new TurndownService();
  
  // Título del artículo - múltiples fallbacks
  const title =
    $("h1").first().text().trim() ||
    $('meta[property="og:title"]').attr("content")?.trim() ||
    $('title').text().trim() ||
    "";
  
  // Autor - múltiples selectores
  const author =
    $('meta[name="author"]').attr("content")?.trim() ||
    $(".author-name").text().trim() ||
    $('h2.c-heading.b-author-bio__author-name').text().trim() ||
    $('h2.b-author-bio__author-name').text().trim() ||
    $('.b-author-bio__author-name').text().trim() ||
    $('h2[class*="author-name"]').text().trim() ||
    $('a[href*="/autor/"]').text().trim() ||
    $('a[href*="autor"]').text().trim() ||
    $('div[class*="author-bio"] a').text().trim() ||
    $('div[class*="author-name"] a').text().trim() ||
    $('h2[class*="author"] a').text().trim() ||
    $('span[class*="author"]').text().trim() ||
    $('div[class*="author"] a').text().trim() ||
    $('a[rel="author"]').text().trim() ||
    // Selectores más genéricos como fallback
    $('a[href*="linarobles"]').text().trim() ||
    null;
  
  // Fecha de publicación - múltiples fallbacks
  const dateStr = 
    $('meta[property="article:published_time"]').attr("content") ||
    $('meta[name="date"]').attr("content") ||
    $('time[datetime]').attr("datetime") ||
    "";
  const date = dateStr ? new Date(dateStr) : null;
  
  let articleText = "";
  let articleMarkdown = "";
  
  // Múltiples selectores para encontrar el contenido del artículo
  const contentSelectors = [
    'div.article-content',     // Selector original
    'div.content-body',        // Selector original
    'article',                 // Selector original
    // Selectores específicos para Publimetro
    'div[class*="entry-content"]',
    'div[class*="post-content"]',
    'div[class*="article-body"]',
    'div[class*="content-text"]',
    'main article',
    'main div[class*="content"]',
    // Selectores más genéricos
    'div.container p',
    'main p',
    'article p',
    '.content p',
    'p' // Último fallback
  ];
  
  let contentFound = false;
  
  for (const selector of contentSelectors) {
    const content = $(selector);
    
    if (content.length > 0) {
      if (selector.includes('article') || selector.includes('content') || selector.includes('body')) {
        // Para selectores de contenedor, tomar el primer elemento
        const firstContent = content.first();
        const htmlContent = firstContent.html() || "";
        const textContent = firstContent.text().trim();
        
        if (textContent.length > 100) {
          articleText = textContent;
          articleMarkdown = turndownService.turndown(htmlContent);
          contentFound = true;
          break;
        }
      } else if (selector.includes(' p') || selector === 'p') {
        // Para selectores de párrafos, concatenar todos los párrafos relevantes
        let combinedText = "";
        let combinedHtml = "";
        
        content.each((_, p) => {
          const text = $(p).text().trim();
          const html = $(p).html() || "";
          
          // Filtrar párrafos irrelevantes (publicidad, navegación, etc.)
          if (text.length > 20 && 
              !text.match(/^(PUBLICIDAD|Compartir|Síguenos|Para leer|También|Ver más|Leer más)/i) &&
              !text.match(/^@\w+/) &&
              !text.includes('twitter.com') &&
              !text.includes('facebook.com') &&
              !text.includes('instagram.com') &&
              !text.match(/^\d{1,2}:\d{2}$/)) { // Filtrar horarios
            combinedText += text + "\n\n";
            combinedHtml += html + "\n";
          }
        });
        
        if (combinedText.trim().length > 100) {
          articleText = combinedText.trim();
          articleMarkdown = turndownService.turndown(combinedHtml);
          contentFound = true;
          break;
        }
      }
    }
  }
  
  // Si no encontramos contenido, intento más agresivo
  if (!contentFound) {
    // Buscar el div o elemento con más texto que podría ser el artículo
    const textElements = $('div, section, article').filter((_, el) => {
      const text = $(el).text().trim();
      return text.length > 200 && 
             text.length < 15000 &&
             !$(el).find('script').length &&
             !$(el).find('style').length &&
             !$(el).find('nav').length &&
             !$(el).find('header').length &&
             !$(el).find('footer').length &&
             !$(el).find('.ads').length &&
             !$(el).find('[class*="ad"]').length;
    });
    
    if (textElements.length > 0) {
      let bestElement = null;
      let bestScore = 0;
      
      textElements.each((_, element) => {
        const text = $(element).text().trim();
        // Puntar basado en longitud y ausencia de palabras clave de navegación
        let score = text.length;
        if (text.includes('PUBLICIDAD')) score -= 1000;
        if (text.includes('Síguenos')) score -= 500;
        if (text.includes('Compartir')) score -= 500;
        
        if (score > bestScore) {
          bestScore = score;
          bestElement = element;
        }
      });
      
      if (bestElement) {
        const htmlContent = $(bestElement).html() || "";
        articleText = $(bestElement).text().trim();
        articleMarkdown = turndownService.turndown(htmlContent);
        contentFound = true;
      }
    }
  }
  
  // Limpiar el texto final
  articleText = articleText
    .replace(/PUBLICIDAD\s*/g, '') // Remover marcadores de publicidad
    .replace(/\s+/g, ' ') // Normalizar espacios
    .replace(/\n{3,}/g, '\n\n') // Limitar saltos de línea
    .trim();
  
  // Limpiar el markdown
  articleMarkdown = articleMarkdown
    .replace(/PUBLICIDAD\s*/g, '') // Remover marcadores de publicidad
    .replace(/\n{3,}/g, '\n\n') // Limitar saltos de línea
    .trim();
  
  return {
    title,
    text: articleText,
    markdown: "",
    author,
    date,
  };
};

// Export config
export const publimetroConfig: SiteConfig = {
  siteName: SITE_NAME,
  feedParser: createFeedParser(SITE_NAME, FEED_URL, parseFeed),
  articleParser: createArticleParser(SITE_NAME, parseArticle),
};