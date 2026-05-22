import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { MessageSquare, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ChatMessage } from '../types';

export function ChatPanel({
  open, messages, isLoading, onClose, onSend, onClear,
}: {
  open: boolean; messages: ChatMessage[]; isLoading: boolean;
  onClose: () => void; onSend: (text: string) => void; onClear: () => void;
}) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    onSend(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const SUGGESTIONS = [
    'Quels sont les points faibles de ma structure ?',
    'Analyse la courbe dramatique de mes scènes.',
    "Comment renforcer l'arc de mon protagoniste ?",
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-40 bg-black/20 md:hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }} onClick={onClose} />
          <motion.aside
            className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-[#393E46] bg-[#FFFFFF] shadow-2xl sm:w-[420px]"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.24 }}>

            <div className="flex shrink-0 items-center justify-between border-b border-[#393E46] px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded bg-[#FFD369] text-black">
                  <MessageSquare size={15} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#222831]">Script Doctor IA</p>
                  <p className="text-[10px] uppercase tracking-widest text-[#393E46]/60">Connecté à votre projet</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <Button variant="ghost" size="sm"
                    className="text-[10px] uppercase tracking-widest text-[#393E46]/50 hover:text-[#222831]"
                    onClick={onClear}>Effacer</Button>
                )}
                <Button variant="ghost" size="icon-sm" onClick={onClose} className="text-[#393E46] hover:text-[#222831]">
                  <X size={16} />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 px-4 py-4">
              {messages.length === 0 && !isLoading && (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-[#FFD369]/20">
                    <MessageSquare size={26} className="text-[#FFD369]" />
                  </div>
                  <p className="font-serif text-lg italic text-[#222831]">Votre script doctor</p>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-[#393E46]/70">
                    Posez une question sur votre projet, demandez une analyse dramaturgique, ou explorez des pistes de réécriture.
                  </p>
                  <div className="mt-5 flex w-full max-w-xs flex-col gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button key={s} onClick={() => onSend(s)}
                        className="rounded border border-[#393E46]/30 bg-[#EEEEEE] px-3 py-2 text-left text-xs text-[#393E46] transition-colors hover:border-[#FFD369] hover:bg-[#FFD369]/10">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className={cn('flex flex-col gap-1', msg.role === 'user' ? 'items-end' : 'items-start')}>
                  <span className="text-[10px] uppercase tracking-widest text-[#393E46]/50">
                    {msg.role === 'user' ? 'Vous' : 'Script Doctor'}
                  </span>
                  <div className={cn(
                    'max-w-[85%] rounded px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
                    msg.role === 'user'
                      ? 'bg-[#222831] text-white'
                      : 'border border-[#393E46]/20 bg-[#EEEEEE] text-[#222831]',
                  )}>
                    {msg.content}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex flex-col items-start gap-1">
                  <span className="text-[10px] uppercase tracking-widest text-[#393E46]/50">Script Doctor</span>
                  <div className="flex items-center gap-1.5 rounded border border-[#393E46]/20 bg-[#EEEEEE] px-4 py-3">
                    {[0, 150, 300].map((delay) => (
                      <span key={delay} className="size-1.5 rounded-full bg-[#393E46]/40 animate-bounce"
                        style={{ animationDelay: `${delay}ms` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="shrink-0 border-t border-[#393E46] bg-[#FFFFFF] p-3">
              <div className="flex items-end gap-2">
                <Textarea placeholder="Posez votre question…"
                  className="min-h-[44px] max-h-36 resize-none rounded border-[#393E46] bg-[#EEEEEE] px-3 py-2.5 text-sm leading-snug shadow-none focus-visible:ring-[#FFD369]"
                  value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown} disabled={isLoading} rows={1} />
                <Button onClick={handleSubmit} disabled={!input.trim() || isLoading}
                  className="shrink-0 size-10 rounded bg-[#FFD369] p-0 text-black hover:bg-[#FFD369]/90 disabled:opacity-40">
                  <Send size={15} />
                </Button>
              </div>
              <p className="mt-1.5 text-[10px] text-[#393E46]/40">Entrée pour envoyer · Maj+Entrée pour nouvelle ligne</p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
