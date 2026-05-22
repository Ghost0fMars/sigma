import { Lightbulb } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function SuggestionPanel({ text }: { text: string }) {
  return (
    <Card className="border-[#393E46] bg-[#FFFFFF] p-4 shadow-lg">
      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#393E46]">
        <Lightbulb size={14} />
        Pistes d'amélioration
      </div>
      <div className="whitespace-pre-wrap text-sm leading-relaxed text-[#222831]">{text}</div>
    </Card>
  );
}
