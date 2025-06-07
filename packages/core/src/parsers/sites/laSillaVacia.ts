import { createArticleParser, createFeedParser } from "../parser-utils";
import { FeedItem, SiteConfig } from "../types";

// Constants
const SITE_NAME = "lasillavacia";
const FEED_URL = "https://www.lasillavacia.com/post-sitemap.xml";

/**
 * Parse the La Silla Vacía sitemap using Cheerio
 */
const parseFeed = ($: cheerio.Root): FeedItem[] => {
  const items: FeedItem[] = [];
  $("url").each((_, el) => {
    const loc = $(el).find("loc").text();
    const lastmod = $(el).find("lastmod").text();
    if (!loc || !lastmod) return;
    items.push({
      url: loc,
      title: "", // se extrae luego en parseArticle
      lastModified: new Date(lastmod),
      publicationDate: new Date(lastmod),
      keywords: "",
    });
  });
  return items;
};

/**
 * Parse a single article from La Silla Vacía - FIXED VERSION
 */

const parseArticle = ($: cheerio.Root) => {
    // Título del artículo - múltiples fallbacks
    const title =
      $("h1").first().text().trim() ||
      $('meta[property="og:title"]').attr("content")?.trim() ||
      $('title').text().trim() ||
      "";
  
    // Autor - múltiples selectores
    const author =
      $('meta[name="author"]').attr("content")?.trim() ||
      $('span[itemprop="name"]').first().text().trim() ||
      $('div[class*="author"] a').first().text().trim() ||
      $('div[class*="autor"] a').first().text().trim() ||
      $('a[rel="author"]').first().text().trim() ||
      null;
  
    // Fecha de publicación - múltiples fallbacks
    const dateStr = 
      $('meta[property="article:published_time"]').attr("content") ||
      $('meta[name="date"]').attr("content") ||
      $('time[datetime]').attr("datetime") ||
      "";
    const date = dateStr ? new Date(dateStr) : null;
  
    let articleText = "";
  
    // Intentar múltiples selectores para encontrar el contenido
    const contentSelectors = [
      'div.field__item', // Tu selector original
      'article div.field__item',
      'div[class*="field__item"]',
      'div[class*="content"] div.field__item',
      'main div.field__item',
      // Selectores alternativos para LSV
      'div.post-content',
      'div.entry-content',
      'article div.content',
      'div[class*="post-body"]',
      'div[class*="article-content"]',
      // Selectores más genéricos
      'article p',
      'main p',
      'div[class*="content"] p',
      'p' // Último fallback
    ];
  
    let contentFound = false;
  
    for (const selector of contentSelectors) {
      const content = $(selector);
      
      if (content.length > 0) {
        if (selector === 'div.field__item' || selector.includes('field__item')) {
          // Para selectores específicos de LSV, tomar el contenido completo
          articleText = content.first().text().trim();
        } else if (selector.includes(' p')) {
          // Para selectores de párrafos, concatenar todos
          content.each((_, p) => {
            const text = $(p).text().trim();
            if (text.length > 20 && 
                !text.match(/^(Compartir|Seguir|Más|También|Ver|Leer)/i) &&
                !text.match(/^@\w+/) &&
                !text.includes('twitter.com') &&
                !text.includes('facebook.com')) {
              articleText += text + "\n\n";
            }
          });
        } else {
          // Para otros selectores, tomar el texto del primer elemento
          articleText = content.first().text().trim();
        }
  
        // Si encontramos contenido suficiente, salir del bucle
        if (articleText.trim().length > 100) {
          contentFound = true;
          break;
        } else {
          articleText = "";
        }
      }
    }
  
    // Si aún no encontramos contenido, hacer un último intento más agresivo
    if (!contentFound) {
      // Buscar divs con mucho texto que podrían contener el artículo
      const textDivs = $('div').filter((_, el) => {
        const text = $(el).text().trim();
        return text.length > 200 && 
               text.length < 10000 &&
               !$(el).find('script').length &&
               !$(el).find('style').length &&
               !$(el).find('nav').length &&
               !$(el).find('header').length &&
               !$(el).find('footer').length;
      });
  
      if (textDivs.length > 0) {
        // Tomar el div con más texto relevante
        let bestDiv = null;
        let bestScore = 0;
  
        textDivs.each((_, div) => {
          const text = $(div).text().trim();
          const score = text.length;
          if (score > bestScore) {
            bestScore = score;
            bestDiv = div;
          }
        });
  
        if (bestDiv) {
          articleText = $(bestDiv).text().trim();
          contentFound = true;
        }
      }
    }
  
    // Limpiar el texto final
    articleText = articleText
      .replace(/\s+/g, ' ') // Normalizar espacios
      .replace(/\n{3,}/g, '\n\n') // Limitar saltos de línea
      .trim();
  
    return {
      title,
      text: articleText,
      author,
      date,
      markdown: "", // Agregar markdown como cadena vacía
    };
  };

/**
 * Export configuration for site
 */
export const lasillavaciaConfig: SiteConfig = {
  siteName: SITE_NAME,
  feedParser: createFeedParser(SITE_NAME, FEED_URL, parseFeed),
  articleParser: createArticleParser(SITE_NAME, parseArticle),
};