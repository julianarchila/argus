import { makeArticleParser } from "./article-parser";
import { Article } from "./types";
import TurndownService from "turndown";

const parseEltiempoDate = (dateText: string) => {
  if (!dateText) return null;
  
  const [datePart, timePart] = dateText.split(' ');
  const [day, month, year] = datePart.split('.').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  
  // Create date in local time
  const localDate = new Date(year, month - 1, day, hours, minutes);
  
  // Convert from Bogota timezone (UTC-5) to UTC
  // Add 5 hours to convert from Bogota to UTC
  const utcDate = new Date(localDate.getTime() + 5 * 60 * 60 * 1000);
  
  return utcDate;
}

const _elTiempoExtractContent = ($: cheerio.Root): Omit<Article, 'url'> => {

  let author = $(".c-articulo__autor__nombre").text();

  let dateText = $(".c-articulo__autor__fecha").find("time").first().text()
  let date = parseEltiempoDate(dateText)


  const contentDiv = $('div.c-cuerpo');
  let articleText = '';
  let articleMarkdown = '';
  const turndownService = new TurndownService();

  contentDiv.find('div.paragraph').each((_, elem) => {
    const paragraph = $(elem);
    articleText += paragraph.text() + '\n';
    articleMarkdown += turndownService.turndown(paragraph.html() || "") + '\n';
  });

  return {
    text: articleText,
    markdown: articleMarkdown,
    author,
    date
  };

}

export const elTiempoArticleParser = makeArticleParser(_elTiempoExtractContent) 
