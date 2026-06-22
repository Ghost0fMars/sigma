import { LogOut, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function PendingApprovalPage({
  email, message, isError, onRefresh, onSignOut,
}: {
  email: string; message: string; isError: boolean;
  onRefresh: () => void; onSignOut: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FFFFFF] px-4 text-[#222831]">
      <Card className="w-full max-w-md border-[#393E46] bg-[#EEEEEE] p-6 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded bg-[#FFD369] text-black">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className="font-serif text-2xl italic">Accès en attente</h1>
            <p className="text-xs uppercase tracking-widest text-[#393E46]">Validation manuelle</p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-[#393E46]">
          Votre compte {email ? <strong className="text-[#222831]">{email}</strong> : null} est créé, mais il doit être approuvé manuellement avant d'accéder à Sigma.
        </p>
        <p className={cn('mt-4 rounded border p-3 text-sm', isError ? 'border-red-500 bg-white text-red-700' : 'border-[#393E46] bg-[#FFFFFF] text-[#393E46]')}>
          {message || "Vous pourrez entrer dans l'application dès que l'administrateur aura activé votre accès dans Supabase."}
        </p>
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Button className="bg-[#FFD369] font-bold text-[#222831] hover:bg-[#FFD369]/90" onClick={onRefresh}>
            <RefreshCw size={15} className="mr-2" />Vérifier
          </Button>
          <Button variant="outline" className="border-[#393E46]" onClick={onSignOut}>
            <LogOut size={15} className="mr-2" />Se déconnecter
          </Button>
        </div>
      </Card>
    </main>
  );
}
