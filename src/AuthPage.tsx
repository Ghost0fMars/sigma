import { useState } from 'react';
import { Clapperboard, LogIn, UserPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { isSupabaseConfigured, supabase } from './supabaseClient';

export function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async () => {
    if (!supabase) {
      setMessage("Supabase n'est pas encore configuré.");
      return;
    }

    setIsLoading(true);
    setMessage('');

    const result =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (result.error) {
      setMessage(result.error.message);
    } else if (mode === 'signup') {
      setMessage("Compte créé. Votre accès restera en attente jusqu'à l'approbation manuelle de l'administrateur.");
    }

    setIsLoading(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FFFFFF] px-4 text-[#222831]">
      <Card className="w-full max-w-md border-[#393E46] bg-[#EEEEEE] p-6 shadow-2xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded bg-[#FFD369] text-black">
            <Clapperboard size={22} />
          </div>
          <div>
            <h1 className="font-serif text-2xl italic">Sigma</h1>
            <p className="text-xs uppercase tracking-widest text-[#393E46]">Accès auteur</p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2">
          <Button
            variant={mode === 'signin' ? 'default' : 'outline'}
            className={mode === 'signin' ? 'bg-[#FFD369] text-[#222831]' : 'border-[#393E46]'}
            onClick={() => setMode('signin')}
          >
            <LogIn size={15} className="mr-2" />
            Connexion
          </Button>
          <Button
            variant={mode === 'signup' ? 'default' : 'outline'}
            className={mode === 'signup' ? 'bg-[#FFD369] text-[#222831]' : 'border-[#393E46]'}
            onClick={() => setMode('signup')}
          >
            <UserPlus size={15} className="mr-2" />
            Inscription
          </Button>
        </div>

        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#393E46]">Email</span>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-11 border-[#393E46] bg-[#FFFFFF]"
              placeholder="vous@example.com"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#393E46]">Mot de passe</span>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 border-[#393E46] bg-[#FFFFFF]"
              placeholder="Minimum 6 caractères"
            />
          </label>

          <Button
            className="h-11 w-full bg-[#FFD369] font-bold text-[#222831] hover:bg-[#FFD369]/90"
            onClick={submit}
            disabled={isLoading || !email || password.length < 6 || !isSupabaseConfigured}
          >
            {isLoading ? 'Veuillez patienter...' : mode === 'signin' ? 'Se connecter' : 'Créer un compte'}
          </Button>

          {!isSupabaseConfigured && (
            <p className="rounded border border-[#393E46] bg-[#FFFFFF] p-3 text-sm text-[#393E46]">
              Ajoutez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans Vercel pour activer
              l'authentification.
            </p>
          )}

          {message && <p className="text-sm text-[#393E46]">{message}</p>}
        </div>
      </Card>
    </main>
  );
}
