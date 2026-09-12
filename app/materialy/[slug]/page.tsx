import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {articles, getArticle} from "../../articles";
import SiteShell from "../../site-shell";

type ArticlePageProps = {
  params: Promise<{slug: string}>;
};

export function generateStaticParams() {
  return articles.map((article) => ({slug: article.slug}));
}

export async function generateMetadata({params}: ArticlePageProps): Promise<Metadata> {
  const {slug} = await params;
  const article = getArticle(slug);
  if (!article) return {};
  const path = "/materialy/" + article.slug;
  return {
    title: article.title,
    description: article.description,
    alternates: {canonical: path},
    openGraph: {
      type: "article",
      title: article.title,
      description: article.description,
      url: path,
    },
  };
}

export default async function Article({params}: ArticlePageProps) {
  const {slug} = await params;
  const article = getArticle(slug);
  if (!article) notFound();
  const url = "https://seti96.ru/materialy/" + article.slug;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    mainEntityOfPage: url,
    author: {"@type": "Organization", name: "Сети96", url: "https://seti96.ru"},
    publisher: {"@type": "Organization", name: "Сети96", url: "https://seti96.ru"},
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(structuredData).replace(/</g, "\\u003c")}}
      />
      <SiteShell page="article" article={article} />
    </>
  );
}
