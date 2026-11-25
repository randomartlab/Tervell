import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import hljs from 'highlight.js/lib/common';
import 'highlight.js/styles/github-dark.css';
import { native } from './bridge';
import { CopyButton } from './ui';
export function Code({
  source,
  language = 'text'
}: {
  source: string;
  language?: string;
}) {
  const html = useMemo(() => {
    try {
      return hljs.getLanguage(language) ? hljs.highlight(source, {
        language
      }).value : hljs.highlightAuto(source).value;
    } catch {
      return '';
    }
  }, [source, language]);
  return <div className="code-block"><header><span>{language}</span><CopyButton text={source} /></header><pre>{html ? <code dangerouslySetInnerHTML={{
        __html: html
      }} /> : <code>{source}</code>}</pre></div>;
}
export function Markdown({
  text
}: {
  text: string;
}) {
  return <div className="markdown"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{
      pre: ({
        children
      }) => <>{children}</>,
      code: ({
        className,
        children,
        ...props
      }) => {
        const source = String(children),
          language = /language-(\S+)/.exec(className ?? '')?.[1];
        return language || source.includes('\n') ? <Code source={source.replace(/\n$/, '')} language={language} /> : <code {...props}>{children}</code>;
      },
      a: ({
        href,
        children
      }) => <button className="inline-link" onClick={() => {
        if (href && /^https?:\/\//.test(href)) void native('external', {
          url: href
        });
      }}>{children}</button>,
      img: ({
        alt
      }) => <span className="attachment-note">图片：{alt || '附件'}（点击原附件查看）</span>,
      table: ({
        children
      }) => <div className="table-scroll"><table>{children}</table></div>
    }}>{text}</ReactMarkdown></div>;
}
