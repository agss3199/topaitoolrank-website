/**
 * ArticleBody Component
 * Renders MDX content with styled HTML elements
 */

import { MDXRemote } from "next-mdx-remote/rsc";
import "./ArticleBody.css";

interface ArticleBodyProps {
  content: string; // raw MDX string
}

const components = {
  h2: ({ children }: any) => (
    <h2 className="article-prose-h2">{children}</h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="article-prose-h3">{children}</h3>
  ),
  h4: ({ children }: any) => (
    <h4 className="article-prose-h4">{children}</h4>
  ),
  p: ({ children }: any) => <p className="article-prose-p">{children}</p>,
  ul: ({ children }: any) => <ul className="article-prose-ul">{children}</ul>,
  ol: ({ children }: any) => <ol className="article-prose-ol">{children}</ol>,
  li: ({ children }: any) => <li className="article-prose-li">{children}</li>,
  blockquote: ({ children }: any) => (
    <blockquote className="article-prose-blockquote">{children}</blockquote>
  ),
  code: ({ children }: any) => (
    <code className="article-prose-code">{children}</code>
  ),
  pre: ({ children }: any) => (
    <pre className="article-prose-pre">{children}</pre>
  ),
  a: ({ href, children }: any) => (
    <a
      href={href}
      className="article-prose-a"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  ),
  img: ({ src, alt }: any) => (
    <figure className="article-prose-figure">
      <img src={src} alt={alt} className="article-prose-img" />
      {alt && <figcaption>{alt}</figcaption>}
    </figure>
  ),
  table: ({ children }: any) => (
    <div className="article-prose-table-wrapper">
      <table className="article-prose-table">{children}</table>
    </div>
  ),
  thead: ({ children }: any) => <thead>{children}</thead>,
  tbody: ({ children }: any) => <tbody>{children}</tbody>,
  tr: ({ children }: any) => <tr>{children}</tr>,
  th: ({ children }: any) => <th>{children}</th>,
  td: ({ children }: any) => <td>{children}</td>,
};

export function ArticleBody({ content }: ArticleBodyProps) {
  return (
    <article className="article-prose">
      <MDXRemote source={content} components={components} />
    </article>
  );
}
