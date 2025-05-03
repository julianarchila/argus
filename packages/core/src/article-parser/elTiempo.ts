import { cherrioFromUrl } from "../utils";
import { Article, ArticleParser } from "./types";
import TurndownService from "turndown";


export const elTiempoArticleParser: ArticleParser = async (url) => {
  const $ = await cherrioFromUrl({
    url,
    xml: true
  });

  const article = _elTiempoExtractContent($);
  return {
    ...article,
    url
  };

}

const _elTiempoExtractContent = ($: cheerio.Root): Omit<Article, 'url'> => {

  const contentDiv = $('div.c-cuerpo');
  let articleText = '';
  let articleMarkdown = '';
  const turndownService = new TurndownService();

  contentDiv.find('div.paragraph').each((_, elem) => {
    const paragraph = $(elem);
    const textParts = paragraph.find('*').addBack().contents()
      .filter((_, el) => el.type === 'text')
      .map((_, el) => (el as any).data)
      .get();
    articleText += textParts.join('\n') + '\n';
    articleMarkdown += turndownService.turndown(paragraph.html() || "") + '\n';
  });

  return {
    text: articleText.trim(),
    markdown: articleMarkdown.trim(),
    author: null,
    date: null
  };

}
