import { useState, useMemo, useEffect, type ReactElement } from 'react';
import { ChevronDown, ChevronRight, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  NARRATOLOGY_THEORIES,
  TRADITIONS,
  type NarratologyTheory,
} from './narratology-data';

const TRADITION_COLORS: Record<string, string> = {
  Philosophie: 'bg-violet-100 text-violet-800 border-violet-200',
  Formalisme: 'bg-orange-100 text-orange-800 border-orange-200',
  Structuralisme: 'bg-blue-100 text-blue-800 border-blue-200',
  'Post-structuralisme': 'bg-pink-100 text-pink-800 border-pink-200',
  Phénoménologie: 'bg-teal-100 text-teal-800 border-teal-200',
  Mythologie: 'bg-amber-100 text-amber-800 border-amber-200',
  Dramaturgie: 'bg-[#FFD369]/30 text-[#6B5500] border-[#FFD369]',
};

function TheoryCard({
  theory,
  isExpanded,
  onToggle,
  searchQuery,
}: {
  theory: NarratologyTheory;
  isExpanded: boolean;
  onToggle: () => void;
  searchQuery: string;
}): ReactElement {
  const colorClass =
    TRADITION_COLORS[theory.tradition] ?? 'bg-gray-100 text-gray-800 border-gray-200';

  const highlight = (text: string) => {
    if (!searchQuery.trim()) return text;
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="rounded bg-[#FFD369]/60 px-0.5">
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  return (
    <div className={cn('rounded-lg border border-[#393E46]/20 bg-white transition-shadow', isExpanded && 'shadow-sm')}>
      <button
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left"
        onClick={onToggle}
      >
        <span className="mt-0.5 shrink-0 text-[#393E46]/40">
          {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-serif text-base font-semibold text-[#222831]">
              {theory.author}
            </span>
            <span className="text-sm text-[#222831]/50 italic">{theory.work}</span>
            <span className="text-xs text-[#222831]/35">{theory.year}</span>
          </div>
          <span className={cn('mt-1 inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider', colorClass)}>
            {theory.tradition}
          </span>
          {!isExpanded && (
            <p className="mt-1.5 line-clamp-2 text-xs text-[#222831]/55">{theory.summary}</p>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-[#393E46]/10 px-4 pb-4 pt-3">
          <p className="mb-4 text-sm leading-relaxed text-[#222831]/70">{theory.summary}</p>

          <div className="space-y-2.5">
            {theory.concepts.map((concept) => (
              <div key={concept.name} className="rounded-md bg-[#EEEEEE]/50 px-3 py-2.5">
                <p className="mb-1 text-xs font-semibold text-[#222831]">
                  {highlight(concept.name)}
                </p>
                <p className="text-xs leading-relaxed text-[#222831]/65">
                  {highlight(concept.definition)}
                </p>
              </div>
            ))}
          </div>

          {theory.useInScreenwriting && (
            <div className="mt-3 rounded-md border border-[#FFD369]/40 bg-[#FFD369]/10 px-3 py-2.5">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-[#6B5500]">
                Application scénaristique
              </p>
              <p className="text-xs leading-relaxed text-[#222831]/70">
                {theory.useInScreenwriting}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function NarratologyPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTradition, setSelectedTradition] = useState<string>('Tous');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const filteredTheories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return NARRATOLOGY_THEORIES.filter((theory) => {
      if (selectedTradition !== 'Tous' && theory.tradition !== selectedTradition) return false;
      if (!q) return true;
      return (
        theory.author.toLowerCase().includes(q) ||
        theory.work.toLowerCase().includes(q) ||
        theory.summary.toLowerCase().includes(q) ||
        theory.tradition.toLowerCase().includes(q) ||
        theory.concepts.some(
          (c) => c.name.toLowerCase().includes(q) || c.definition.toLowerCase().includes(q),
        )
      );
    });
  }, [searchQuery, selectedTradition]);

  const allExpanded = filteredTheories.length > 0 && filteredTheories.every((t) => expandedIds.has(t.id));

  function toggleTheory(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        // Auto-expand when searching
      }
      return next;
    });
  }

  function expandAll() {
    setExpandedIds(new Set(filteredTheories.map((t) => t.id)));
  }

  function collapseAll() {
    setExpandedIds(new Set());
  }

  useEffect(() => {
    if (searchQuery.trim()) {
      setExpandedIds(new Set(filteredTheories.map((t) => t.id)));
    }
  }, [searchQuery, filteredTheories]);

  return (
    <div className="overflow-hidden rounded-lg border border-[#393E46]/30 bg-white pb-8">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-[#393E46] bg-white px-6 py-5">
        <h2 className="font-serif text-xl italic tracking-wide text-[#222831]">
          Références Narratologiques
        </h2>
        <p className="mt-0.5 text-xs text-[#222831]/45 uppercase tracking-widest">
          {NARRATOLOGY_THEORIES.length} théories · {NARRATOLOGY_THEORIES.reduce((n, t) => n + t.concepts.length, 0)} concepts
        </p>
      </div>

      {/* Search + filters */}
      <div className="sticky top-[73px] z-10 space-y-3 border-b border-[#393E46]/20 bg-[#EEEEEE]/95 px-6 py-3 backdrop-blur-sm">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#222831]/35" />
          <Input
            placeholder="Rechercher un auteur, concept, définition…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-[#393E46]/30 bg-white pl-8 pr-8 text-sm"
          />
          {searchQuery && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#222831]/35 hover:text-[#222831]"
              onClick={() => setSearchQuery('')}
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {TRADITIONS.map((tradition) => (
            <button
              key={tradition}
              onClick={() => setSelectedTradition(tradition)}
              className={cn(
                'rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors',
                selectedTradition === tradition
                  ? 'border-[#222831] bg-[#222831] text-white'
                  : 'border-[#393E46]/25 bg-white text-[#222831]/60 hover:border-[#393E46]/50 hover:text-[#222831]',
              )}
            >
              {tradition}
            </button>
          ))}
        </div>
      </div>

      {/* Results count + expand controls */}
      <div className="flex items-center justify-between px-6 py-2">
        <span className="text-xs text-[#222831]/40">
          {filteredTheories.length === NARRATOLOGY_THEORIES.length
            ? `${filteredTheories.length} théories`
            : `${filteredTheories.length} résultat${filteredTheories.length !== 1 ? 's' : ''}`}
        </span>
        {!searchQuery && (
          <button
            onClick={allExpanded ? collapseAll : expandAll}
            className="text-xs text-[#222831]/45 hover:text-[#222831] transition-colors"
          >
            {allExpanded ? 'Tout réduire' : 'Tout développer'}
          </button>
        )}
      </div>

      {/* Theory list */}
      <div className="px-6">
        {filteredTheories.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-[#222831]/40">Aucun résultat pour « {searchQuery} »</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTheories.map((theory) => (
              <TheoryCard
                key={theory.id}
                theory={theory}
                isExpanded={expandedIds.has(theory.id)}
                onToggle={() => toggleTheory(theory.id)}
                searchQuery={searchQuery}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
