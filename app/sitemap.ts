import type {MetadataRoute} from "next";
import {articles} from "./articles";

export default function sitemap(): MetadataRoute.Sitemap {
  const modified = new Date("2026-09-12");
  const pages: MetadataRoute.Sitemap = [
    {url: "https://seti96.ru", lastModified: modified, changeFrequency: "monthly", priority: 1},
    {url: "https://seti96.ru/dom", lastModified: modified, changeFrequency: "monthly", priority: 0.9},
    {url: "https://seti96.ru/organizaciyam", lastModified: modified, changeFrequency: "monthly", priority: 0.9},
    {url: "https://seti96.ru/materialy", lastModified: modified, changeFrequency: "monthly", priority: 0.7},
    {url: "https://seti96.ru/kontakty", lastModified: modified, changeFrequency: "monthly", priority: 0.7},
    {url: "https://seti96.ru/politika", lastModified: modified, changeFrequency: "yearly", priority: 0.2},
  ];
  return pages.concat(
    articles.map((article) => ({
      url: "https://seti96.ru/materialy/" + article.slug,
      lastModified: modified,
      changeFrequency: "yearly" as const,
      priority: 0.5,
    })),
  );
}
