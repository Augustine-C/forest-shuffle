import { useEffect } from 'react';
import type { ReactNode } from 'react';
import englishRules from '../../../help/game-rules/rules.md?raw';
import chineseRules from '../../../help/game-rules/rules.zh-CN.md?raw';
import { useI18n } from '../i18n';
import type { Language } from '../i18n';
import './RulesPage.css';

type RulesLanguage = Language;

interface RulesPageProps {
  returnLabel: string;
  onClose: () => void;
}

interface RulesTable {
  headers: string[];
  rows: string[][];
  nextIndex: number;
}

const inlineToken = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;

function renderInline(text: string, onSelectLanguage: (language: RulesLanguage) => void): ReactNode[] {
  return text.split(inlineToken).filter(Boolean).map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const [, label, href] = link;
      if (href === 'rules.md' || href === 'rules.zh-CN.md') {
        const language = href === 'rules.md' ? 'en' : 'zh-CN';
        return (
          <button key={index} type="button" className="rules-inline-link" onClick={() => onSelectLanguage(language)}>
            {label}
          </button>
        );
      }
      return <span key={index} className="rules-reference-link">{label}</span>;
    }
    return part;
  });
}

function readTable(lines: string[], startIndex: number): RulesTable {
  const tableLines: string[][] = [];
  let index = startIndex;
  while (index < lines.length && /^\s*\|/.test(lines[index])) {
    tableLines.push(lines[index].trim().slice(1, -1).split('|').map(cell => cell.trim()));
    index += 1;
  }
  return {
    headers: tableLines[0] ?? [],
    rows: tableLines.slice(2),
    nextIndex: index
  };
}

function RulesDocument({ markdown, onSelectLanguage }: {
  markdown: string;
  onSelectLanguage: (language: RulesLanguage) => void;
}) {
  const lines = markdown.split('\n');
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      const blockKey = `heading-${index}`;
      const level = heading[1].length;
      const content = renderInline(heading[2], onSelectLanguage);
      if (level === 1) blocks.push(<h1 key={blockKey}>{content}</h1>);
      if (level === 2) blocks.push(<h2 key={blockKey}>{content}</h2>);
      if (level === 3) blocks.push(<h3 key={blockKey}>{content}</h3>);
      if (level === 4) blocks.push(<h4 key={blockKey}>{content}</h4>);
      index += 1;
      continue;
    }

    if (line.startsWith('>')) {
      const blockKey = `quote-${index}`;
      const quoteLines: string[] = [];
      while (index < lines.length && lines[index].startsWith('>')) {
        const quote = lines[index].replace(/^>\s?/, '').trim();
        if (quote) quoteLines.push(quote);
        index += 1;
      }
      blocks.push(
        <aside key={blockKey} className="rules-note">
          {quoteLines.map((quote, quoteIndex) => (
            <p key={quoteIndex}>{renderInline(quote, onSelectLanguage)}</p>
          ))}
        </aside>
      );
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const blockKey = `ordered-${index}`;
      const items: Array<{ text: string; table?: RulesTable }> = [];
      while (index < lines.length) {
        const item = lines[index].match(/^\d+\.\s+(.+)$/);
        if (!item) break;
        const entry: { text: string; table?: RulesTable } = { text: item[1] };
        index += 1;
        while (index < lines.length && !lines[index].trim()) index += 1;
        if (index < lines.length && /^\s*\|/.test(lines[index])) {
          entry.table = readTable(lines, index);
          index = entry.table.nextIndex;
          while (index < lines.length && !lines[index].trim()) index += 1;
        }
        items.push(entry);
      }
      blocks.push(
        <ol key={blockKey} className="rules-steps">
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>
              {renderInline(item.text, onSelectLanguage)}
              {item.table && <RulesTableView table={item.table} />}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    if (line.startsWith('- ')) {
      const blockKey = `unordered-${index}`;
      const items: string[] = [];
      while (index < lines.length && lines[index].startsWith('- ')) {
        items.push(lines[index].slice(2));
        index += 1;
      }
      blocks.push(
        <ul key={blockKey}>{items.map((item, itemIndex) => (
          <li key={itemIndex}>{renderInline(item, onSelectLanguage)}</li>
        ))}</ul>
      );
      continue;
    }

    if (/^\s*\|/.test(line)) {
      const blockKey = `table-${index}`;
      const table = readTable(lines, index);
      blocks.push(<RulesTableView key={blockKey} table={table} />);
      index = table.nextIndex;
      continue;
    }

    const blockKey = `paragraph-${index}`;
    const paragraph: string[] = [];
    while (index < lines.length && lines[index].trim() &&
      !/^(#{1,4})\s+/.test(lines[index]) &&
      !lines[index].startsWith('>') &&
      !lines[index].startsWith('- ') &&
      !/^\d+\.\s+/.test(lines[index]) &&
      !/^\s*\|/.test(lines[index])) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push(<p key={blockKey}>{renderInline(paragraph.join(' '), onSelectLanguage)}</p>);
  }

  return <article className="rules-document">{blocks}</article>;
}

function RulesTableView({ table }: { table: RulesTable }) {
  return (
    <div className="rules-table-scroll">
      <table>
        <thead><tr>{table.headers.map(header => <th key={header}>{header}</th>)}</tr></thead>
        <tbody>
          {table.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RulesPage({ returnLabel, onClose }: RulesPageProps) {
  const { language, setLanguage, t } = useI18n();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="rules-overlay" role="dialog" aria-modal="true" aria-label={t('rulesDialog')}>
      <main className="rules-page">
        <header className="rules-toolbar">
          <button type="button" className="rules-back" onClick={onClose}>← {returnLabel}</button>
          <div className="rules-language" role="group" aria-label={t('rulesLanguage')}>
            <button
              type="button"
              className={language === 'en' ? 'active' : ''}
              aria-pressed={language === 'en'}
              onClick={() => setLanguage('en')}
            >
              English
            </button>
            <button
              type="button"
              className={language === 'zh-CN' ? 'active' : ''}
              aria-pressed={language === 'zh-CN'}
              onClick={() => setLanguage('zh-CN')}
            >
              中文
            </button>
          </div>
        </header>
        <RulesDocument
          markdown={language === 'en' ? englishRules : chineseRules}
          onSelectLanguage={setLanguage}
        />
      </main>
    </div>
  );
}
