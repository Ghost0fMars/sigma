import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

// Rendu Markdown des réponses IA (titres, gras, listes, tableaux…).
const components: Components = {
  h1: ({ node, ...props }) => <h3 className="mt-4 mb-2 font-serif text-lg font-bold first:mt-0" {...props} />,
  h2: ({ node, ...props }) => <h4 className="mt-4 mb-2 font-serif text-base font-bold first:mt-0" {...props} />,
  h3: ({ node, ...props }) => <h5 className="mt-3 mb-1.5 text-sm font-bold first:mt-0" {...props} />,
  h4: ({ node, ...props }) => <h6 className="mt-3 mb-1 text-sm font-semibold first:mt-0" {...props} />,
  h5: ({ node, ...props }) => <h6 className="mt-3 mb-1 text-sm font-semibold first:mt-0" {...props} />,
  h6: ({ node, ...props }) => <h6 className="mt-3 mb-1 text-sm font-semibold first:mt-0" {...props} />,
  p: ({ node, ...props }) => <p className="my-2 first:mt-0 last:mb-0" {...props} />,
  strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
  em: ({ node, ...props }) => <em className="italic" {...props} />,
  ul: ({ node, ...props }) => <ul className="my-2 list-disc space-y-1 pl-5" {...props} />,
  ol: ({ node, ...props }) => <ol className="my-2 list-decimal space-y-1 pl-5" {...props} />,
  li: ({ node, ...props }) => <li className="pl-0.5" {...props} />,
  blockquote: ({ node, ...props }) => <blockquote className="my-2 border-l-2 border-[#FFD369] pl-3 italic text-[#393E46]" {...props} />,
  hr: ({ node, ...props }) => <hr className="my-3 border-[#393E46]/20" {...props} />,
  a: ({ node, ...props }) => <a className="underline underline-offset-2" target="_blank" rel="noreferrer" {...props} />,
  code: ({ node, className, ...props }) => <code className={cn('rounded bg-black/5 px-1 py-0.5 font-mono text-[0.85em]', className)} {...props} />,
  pre: ({ node, ...props }) => <pre className="my-2 overflow-x-auto rounded bg-black/5 p-2 [&>code]:bg-transparent [&>code]:p-0" {...props} />,
  table: ({ node, ...props }) => <div className="my-2 overflow-x-auto"><table className="w-full border-collapse text-xs" {...props} /></div>,
  th: ({ node, ...props }) => <th className="border border-[#393E46]/20 bg-black/5 px-2 py-1 text-left font-semibold" {...props} />,
  td: ({ node, ...props }) => <td className="border border-[#393E46]/20 px-2 py-1 align-top" {...props} />,
};

export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn('break-words', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{children}</ReactMarkdown>
    </div>
  );
}
