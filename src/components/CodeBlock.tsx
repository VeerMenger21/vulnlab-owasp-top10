import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface Props {
  code: string;
  language?: string;
  title?: string;
  variant?: 'default' | 'vulnerable' | 'secure';
}

export const CodeBlock: React.FC<Props> = ({ code, language = 'javascript', title, variant = 'default' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getBorderColor = () => {
    if (variant === 'vulnerable') return 'border-red-500/30 bg-red-950/10';
    if (variant === 'secure') return 'border-emerald-500/30 bg-emerald-950/10';
    return 'border-lab-700 bg-lab-900';
  };

  const getHeaderColor = () => {
    if (variant === 'vulnerable') return 'bg-red-500/10 text-red-300 border-red-500/20';
    if (variant === 'secure') return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
    return 'bg-lab-800 text-slate-300 border-lab-700';
  };

  return (
    <div className={`rounded-lg border overflow-hidden font-mono text-sm shadow-md ${getBorderColor()}`}>
      {(title || language) && (
        <div className={`flex items-center justify-between px-3.5 py-2 border-b text-xs font-semibold ${getHeaderColor()}`}>
          <div className="flex items-center space-x-2">
            <span className="uppercase tracking-wider">{title || language}</span>
            {variant === 'vulnerable' && (
              <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px]">INSECURE / FLAWED</span>
            )}
            {variant === 'secure' && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">SECURE / PATCHED</span>
            )}
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 text-slate-400 hover:text-white transition-colors"
            title="Copy code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      )}
      <div className="p-3.5 overflow-x-auto text-xs leading-relaxed text-slate-200">
        <pre>
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};
