import { useEffect, useRef, useState } from 'react';
import { Search, Brain, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { officerService } from '../../services/officerService';

/* ─── Types ────────────────────────────────────────────────────── */
type BnsSection = {
  sectionNumber: string;
  sectionTitle: string;
  ipcEquivalent: string | null;
  ipcTitle: string | null;
  description: string | null;
  mappingReasoning: string | null;
  maxImprisonmentMonths: number | null;
  isLifeOrDeath: boolean;
  isCognizable: boolean;
  isBailable: boolean;
};

type ModelResult = {
  sections: BnsSection[];
  urgency: string;
  transcript: string;
};

const urgencyColor: Record<string, string> = {
  CRITICAL: 'text-[#FCA5A5] border-[#DC2626]/40 bg-[#DC2626]/10',
  HIGH: 'text-[#FDBA74] border-[#F97316]/40 bg-[#F97316]/10',
  MEDIUM: 'text-[#FDE68A] border-[#D97706]/40 bg-[#D97706]/10',
  LOW: 'text-[#86EFAC] border-[#16A34A]/40 bg-[#16A34A]/10',
};

const punishment = (s: BnsSection) => {
  if (s.isLifeOrDeath) return 'Life imprisonment or death';
  if (!s.maxImprisonmentMonths) return 'Punishment as prescribed';
  const y = Math.floor(s.maxImprisonmentMonths / 12);
  return y > 0
    ? `Up to ${y} year${y > 1 ? 's' : ''} imprisonment`
    : `Up to ${s.maxImprisonmentMonths} months imprisonment`;
};

/* ─── Section card ─────────────────────────────────────────────── */
const SectionCard = ({ sec, highlight }: { sec: BnsSection; highlight?: boolean }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className={`rounded-xl border p-5 transition-all ${
        highlight
          ? 'border-[#F97316]/50 bg-[#F97316]/5'
          : 'border-white/[0.08] bg-[rgba(255,255,255,0.03)]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[#F97316] font-extrabold font-mono text-sm">BNS §{sec.sectionNumber}</span>
            {sec.ipcEquivalent && (
              <span className="text-[#9CA3AF] text-xs font-mono">/ IPC §{sec.ipcEquivalent}</span>
            )}
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sec.isCognizable ? 'bg-[#DC2626]/15 text-[#FCA5A5]' : 'bg-white/[0.05] text-[#9CA3AF]'}`}>
              {sec.isCognizable ? 'Cognizable' : 'Non-Cognizable'}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${!sec.isBailable ? 'bg-[#D97706]/15 text-[#FDE68A]' : 'bg-white/[0.05] text-[#9CA3AF]'}`}>
              {sec.isBailable ? 'Bailable' : 'Non-Bailable'}
            </span>
          </div>
          <p className="text-white font-semibold mt-1">{sec.sectionTitle}</p>
          {sec.ipcTitle && sec.ipcEquivalent && (
            <p className="text-[#9CA3AF] text-xs mt-0.5">IPC: {sec.ipcTitle}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="shrink-0 text-[#6B7280] hover:text-white"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-xs text-[#9CA3AF]">
        <span><span className="text-[#6B7280] uppercase tracking-wide text-[9px]">Punishment</span><br /><span className="text-[#D1D5DB] font-semibold">{punishment(sec)}</span></span>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3 border-t border-white/[0.06] pt-4">
          {sec.description && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280] mb-1">Description</p>
              <p className="text-sm text-[#D1D5DB] leading-relaxed">{sec.description}</p>
            </div>
          )}
          {sec.mappingReasoning && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280] mb-1">AI Mapping Reason</p>
              <p className="text-sm text-[#9CA3AF] italic leading-relaxed">{sec.mappingReasoning}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── Main Component ───────────────────────────────────────────── */
export const BNSTranslator = () => {
  const [mode, setMode] = useState<'search' | 'ai'>('search');

  // ── Section search mode ─────────────────────────────────────────
  const [q, setQ] = useState('');
  const [searchResults, setSearchResults] = useState<BnsSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<BnsSection | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchTimer = useRef<number | null>(null);

  // ── AI model mode ───────────────────────────────────────────────
  const [complaint, setComplaint] = useState('');
  const [modelResult, setModelResult] = useState<ModelResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  // Section search effect
  useEffect(() => {
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    const trimmed = q.trim();
    if (!trimmed) { setSearchResults([]); return; }

    searchTimer.current = window.setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      try {
        const results = await officerService.searchBns(trimmed);
        setSearchResults(results as unknown as BnsSection[]);
        if (results.length === 1) {
          setSelectedSection(results[0] as unknown as BnsSection);
        }
      } catch (err) {
        setSearchError(err instanceof Error ? err.message : 'Search failed.');
      } finally {
        setSearching(false);
      }
    }, 280);

    return () => { if (searchTimer.current) window.clearTimeout(searchTimer.current); };
  }, [q]);

  const handleSelectSection = async (sectionNumber: string) => {
    try {
      const data = await officerService.getBnsBySectionNumber(sectionNumber);
      // Map from API response shape to BnsSection
      const sec = data.bnsSection as unknown as BnsSection;
      setSelectedSection({ ...sec, ipcEquivalent: data.ipcEquivalent, ipcTitle: data.ipcTitle });
    } catch {
      // ignore, show from search results
    }
  };

  // AI model analysis
  const analyzeComplaint = async () => {
    const text = complaint.trim();
    if (!text) return;
    setAnalyzing(true);
    setModelError(null);
    setModelResult(null);
    try {
      // Use the ML pipeline endpoint via backend BNS search
      // The backend exposes /officer/bns/search which calls ML
      const results = await officerService.searchBns(text);
      const sections = results as unknown as BnsSection[];
      setModelResult({
        sections,
        urgency: 'HIGH', // backend-level urgency comes from FIR creation, not standalone search
        transcript: text,
      });
    } catch (err) {
      setModelError(err instanceof Error ? err.message : 'Analysis failed. Is the ML service running?');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight text-white">BNS ↔ IPC Translator</h1>
      <p className="text-[11px] font-bold tracking-[0.18em] text-[#6B7280] uppercase mt-2 mb-8">
        — कानून अनुवादक · Search sections or analyse a complaint with AI
      </p>

      {/* Mode tabs */}
      <div className="flex gap-1 mb-8 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] w-fit">
        {(['search', 'ai'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`px-5 py-2 rounded-lg text-xs font-extrabold uppercase tracking-widest transition-all ${
              mode === m
                ? 'bg-[#F97316] text-white shadow'
                : 'text-[#6B7280] hover:text-white'
            }`}
          >
            {m === 'search' ? '🔍 Section Search' : '🧠 AI Complaint Analysis'}
          </button>
        ))}
      </div>

      {/* ── Section Search Mode ─────────────────────────────────── */}
      {mode === 'search' && (
        <div className="space-y-6">
          <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search BNS section number, keyword, or IPC number…"
              className="w-full rounded-xl border border-white/[0.08] bg-[rgba(255,255,255,0.04)] py-4 pl-5 pr-12 text-sm text-white placeholder:text-[#4B5563]"
            />
            {searching ? (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#F97316] animate-spin" />
            ) : (
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#F97316]" strokeWidth={2} />
            )}
          </div>

          {searchError && (
            <p className="text-sm text-[#FCA5A5]">{searchError}</p>
          )}

          {/* Search results list */}
          {searchResults.length > 1 && (
            <div className="rounded-xl border border-white/[0.08] overflow-hidden">
              <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#6B7280] border-b border-white/[0.06]">
                {searchResults.length} sections found
              </p>
              {searchResults.slice(0, 8).map((s) => (
                <button
                  key={s.sectionNumber}
                  type="button"
                  onClick={() => void handleSelectSection(s.sectionNumber)}
                  className="w-full text-left px-4 py-3 hover:bg-white/[0.05] border-b border-white/[0.04] last:border-0 transition-colors"
                >
                  <span className="font-mono text-[#F97316] font-bold text-sm">§{s.sectionNumber}</span>
                  <span className="ml-3 text-[#D1D5DB] text-sm">{s.sectionTitle}</span>
                </button>
              ))}
            </div>
          )}

          {/* Selected section detail */}
          {selectedSection && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280] mb-3">Section Detail</p>
              <SectionCard sec={selectedSection} highlight />
            </div>
          )}

          {q.trim() && !searching && searchResults.length === 0 && (
            <p className="text-sm text-[#6B7280]">No sections found for "{q}". Try a different keyword or section number.</p>
          )}

          {!q.trim() && (
            <p className="text-sm text-[#4B5563] text-center py-4">
              Type a keyword (e.g. "theft", "murder", "fraud") or section number (e.g. "303", "115") to search.
            </p>
          )}
        </div>
      )}

      {/* ── AI Complaint Analysis Mode ──────────────────────────── */}
      {mode === 'ai' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-white/[0.08] bg-[rgba(255,255,255,0.03)] p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280] mb-3">
              Describe the complaint in plain language
            </p>
            <textarea
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              rows={5}
              placeholder="E.g.: The victim was assaulted and robbed by two men near Connaught Place at night. They took his wallet and phone and threatened him with a knife…"
              className="w-full rounded-xl border border-white/[0.08] bg-[#0a0a0a] px-4 py-3 text-sm text-[#D1D5DB] placeholder:text-[#4B5563] outline-none resize-none"
            />
            <button
              type="button"
              onClick={() => void analyzeComplaint()}
              disabled={analyzing || !complaint.trim()}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#F97316] py-3 text-xs font-extrabold uppercase tracking-widest text-white hover:bg-[#ea580c] disabled:cursor-not-allowed disabled:opacity-60 transition-all"
            >
              {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
              {analyzing ? 'Analysing with AI…' : 'Analyse & Map BNS / IPC Sections'}
            </button>
          </div>

          {modelError && (
            <div className="rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/30 px-4 py-3 text-sm text-[#FCA5A5]">
              {modelError}
            </div>
          )}

          {modelResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">
                  {modelResult.sections.length} Applicable Section{modelResult.sections.length !== 1 ? 's' : ''} — Model Output
                </p>
                <span className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-full border ${urgencyColor[modelResult.urgency] ?? urgencyColor.MEDIUM}`}>
                  {modelResult.urgency} Urgency
                </span>
              </div>

              {modelResult.sections.length === 0 ? (
                <p className="text-sm text-[#6B7280]">No sections mapped. Try a more detailed complaint description.</p>
              ) : (
                <div className="space-y-3">
                  {modelResult.sections.map((sec, i) => (
                    <SectionCard key={sec.sectionNumber} sec={sec} highlight={i === 0} />
                  ))}
                </div>
              )}
            </div>
          )}

          {!modelResult && !analyzing && (
            <p className="text-sm text-[#4B5563] text-center py-4">
              Paste or type the victim's complaint and press "Analyse" — the AI model will map the appropriate BNS and IPC sections.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default BNSTranslator;
