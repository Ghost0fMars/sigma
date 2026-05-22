import type { ReactNode } from 'react';
import { Lightbulb, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SuggestionPanel } from './SuggestionPanel';

export function StepContent({
  title, description, children, onAiAssist, onAiAnalyze,
  isAiLoading, isAnalysisLoading, suggestions,
}: {
  title: string; description: string; children: ReactNode;
  onAiAssist?: () => void; onAiAnalyze?: () => void;
  isAiLoading?: boolean; isAnalysisLoading?: boolean; suggestions?: string;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-[#393E46] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-serif text-3xl italic text-[#222831]">{title}</h2>
          <p className="mt-1 text-sm text-[#393E46]">{description}</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button variant="outline" size="sm"
            className="w-full border-[#393E46] text-xs uppercase tracking-widest text-[#393E46] hover:bg-[#393E46] hover:text-[#FFFFFF] sm:w-auto"
            onClick={onAiAnalyze} disabled={isAnalysisLoading || isAiLoading}>
            <Lightbulb size={14} className={cn('mr-2', isAnalysisLoading && 'animate-pulse')} />
            {isAnalysisLoading ? 'Analyse...' : 'Pistes IA'}
          </Button>
          <Button variant="outline" size="sm"
            className="w-full border-[#393E46] text-xs uppercase tracking-widest text-[#393E46] hover:bg-[#393E46] hover:text-[#FFFFFF] sm:w-auto"
            onClick={onAiAssist} disabled={isAiLoading || isAnalysisLoading}>
            <Wand2 size={14} className={cn('mr-2', isAiLoading && 'animate-spin')} />
            {isAiLoading ? 'Génération...' : 'Assistant IA'}
          </Button>
        </div>
      </div>
      <div className="min-h-[500px] rounded-lg border border-[#393E46] bg-[#EEEEEE] p-5 shadow-2xl sm:p-10">
        {children}
      </div>
      {suggestions && <SuggestionPanel text={suggestions} />}
    </div>
  );
}
