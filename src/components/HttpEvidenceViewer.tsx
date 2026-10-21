import React, { useState } from 'react';
import { ShieldCheck, Eye, EyeOff, Copy, Check, ArrowRight } from 'lucide-react';

interface Props {
  method?: string | null;
  path?: string | null;
  headers?: string | null;
  body?: string | null;
  status?: number | null;
  responseHeaders?: string | null;
  responseBody?: string | null;
  notes?: string | null;
  stage?: string;
}

export const HttpEvidenceViewer: React.FC<Props> = ({
  method = 'GET',
  path = '/',
  headers,
  body,
  status = 200,
  responseHeaders,
  responseBody,
  notes,
  stage
}) => {
  const [redacted, setRedacted] = useState(true);
  const [copied, setCopied] = useState(false);

  // Redaction helper for tokens, passwords, cookies
  const sanitizeText = (text?: string | null) => {
    if (!text) return '';
    if (!redacted) return text;
    return text
      .replace(/(Bearer\s+)[a-zA-Z0-9._-]+/gi, '$1[REDACTED_JWT_TOKEN]')
      .replace(/("password"\s*:\s*")[^"]+(")/gi, '$1[REDACTED_PASSWORD]$2')
      .replace(/("totp_secret"\s*:\s*")[^"]+(")/gi, '$1[REDACTED_SECRET]$2')
      .replace(/(token=)[^&;]+/gi, '$1[REDACTED_TOKEN]')
      .replace(/(password_hash\s*[:=]\s*')[^']+(')/gi, '$1[REDACTED_HASH]$2');
  };

  const getStatusColor = (code: number | null) => {
    if (!code) return 'bg-slate-700 text-slate-300';
    if (code >= 200 && code < 300) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    if (code >= 300 && code < 400) return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    if (code >= 400 && code < 500) return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
  };

  const fullTranscript = `REQUEST:
${method} ${path} HTTP/1.1
${sanitizeText(headers) || 'Host: 127.0.0.1:3000\nContent-Type: application/json'}

${sanitizeText(body) || ''}

------------------------------------------------
RESPONSE:
HTTP/1.1 ${status || '200 OK'}
${sanitizeText(responseHeaders) || ''}

${sanitizeText(responseBody) || ''}`;

  const handleCopyTranscript = () => {
    navigator.clipboard.writeText(fullTranscript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-lab-700 bg-lab-900 overflow-hidden font-mono text-xs shadow-md">
      {/* Top action bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-lab-800 border-b border-lab-700">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-300 uppercase tracking-wider flex items-center">
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
            HTTP Request / Response Transcript
          </span>
          {stage && (
            <span className="px-2 py-0.5 rounded bg-lab-700 text-slate-300 text-[10px]">
              {stage}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setRedacted(!redacted)}
            className={`flex items-center space-x-1 px-2 py-1 rounded text-[11px] border transition-colors ${
              redacted
                ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
            }`}
            title="Toggle sensitive token and password redaction"
          >
            {redacted ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{redacted ? 'Secrets Redacted' : 'Showing Raw'}</span>
          </button>
          <button
            onClick={handleCopyTranscript}
            className="flex items-center space-x-1 px-2 py-1 rounded text-[11px] bg-lab-700 text-slate-200 hover:text-white transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Request & Response Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-lab-700">
        {/* Request Side */}
        <div className="p-3.5 space-y-2.5 bg-lab-900/60">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 tracking-wider">REQUEST</span>
            <div className="flex items-center space-x-1.5">
              <span className="px-1.5 py-0.5 font-bold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {method}
              </span>
              <span className="text-slate-300 font-medium break-all">{path}</span>
            </div>
          </div>

          {headers && (
            <div>
              <div className="text-[10px] text-slate-500 mb-1 uppercase font-semibold">Headers</div>
              <div className="p-2 rounded bg-lab-950 border border-lab-800 text-slate-300 overflow-x-auto leading-relaxed">
                <pre>{sanitizeText(headers)}</pre>
              </div>
            </div>
          )}

          {body ? (
            <div>
              <div className="text-[10px] text-slate-500 mb-1 uppercase font-semibold">Request Payload</div>
              <div className="p-2.5 rounded bg-lab-950 border border-lab-800 text-cyan-200 overflow-x-auto leading-relaxed">
                <pre>{sanitizeText(body)}</pre>
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 italic py-1">No request payload (empty body)</div>
          )}
        </div>

        {/* Response Side */}
        <div className="p-3.5 space-y-2.5 bg-lab-950/40">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 tracking-wider">RESPONSE</span>
            <span className={`px-2 py-0.5 rounded font-bold border ${getStatusColor(status)}`}>
              HTTP {status || 200}
            </span>
          </div>

          {responseHeaders && (
            <div>
              <div className="text-[10px] text-slate-500 mb-1 uppercase font-semibold">Response Headers</div>
              <div className="p-2 rounded bg-lab-950 border border-lab-800 text-slate-300 overflow-x-auto leading-relaxed">
                <pre>{sanitizeText(responseHeaders)}</pre>
              </div>
            </div>
          )}

          {responseBody ? (
            <div>
              <div className="text-[10px] text-slate-500 mb-1 uppercase font-semibold">Response Content (Text Safe)</div>
              <div className="p-2.5 rounded bg-lab-950 border border-lab-800 text-slate-200 overflow-x-auto leading-relaxed max-h-72">
                <pre>{sanitizeText(responseBody)}</pre>
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 italic py-1">No response body captured</div>
          )}
        </div>
      </div>

      {notes && (
        <div className="p-3 bg-lab-850 border-t border-lab-700 flex items-start space-x-2">
          <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-slate-300 text-xs leading-relaxed">
            <span className="font-semibold text-white">Analyst Notes: </span>
            {notes}
          </div>
        </div>
      )}
    </div>
  );
};
