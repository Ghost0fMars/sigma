import { ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function FullScreenNotice({ title, message }: { title: string; message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FFFFFF] px-4 text-[#222831]">
      <Card className="w-full max-w-md border-[#393E46] bg-[#EEEEEE] p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded bg-[#FFD369] text-black">
          <ShieldCheck size={24} />
        </div>
        <h1 className="font-serif text-2xl italic">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#393E46]">{message}</p>
      </Card>
    </main>
  );
}
