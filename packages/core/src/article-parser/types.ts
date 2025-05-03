export type Article = {
  url: string;
  text: string;
  markdown: string;
  author: string | null;
  date: Date | null;
}


export type ArticleParser = (url: string) => Promise<Article>;
