import { CloudOff, FolderOpen, Plus, Trash2, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { SavedProject } from '../types';

export function ProjectsPage({
  projects, currentProjectId, supabaseEnabled, onCreateProject, onOpenProject, onDeleteProject, onImportDocument,
}: {
  projects: SavedProject[]; currentProjectId: string | null; supabaseEnabled: boolean;
  onCreateProject: () => void; onOpenProject: (p: SavedProject) => void;
  onDeleteProject: (id: string) => void; onImportDocument: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-[#393E46] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-serif text-3xl italic text-[#222831]">Mes Projets</h2>
          <p className="mt-1 text-sm text-[#393E46]">Retrouvez vos scénarios sauvegardés sur cet appareil.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onImportDocument} className="border-[#393E46] px-4 font-bold text-[#222831] hover:bg-[#EEEEEE]">
            <Upload size={16} className="mr-2" />Importer
          </Button>
          <Button onClick={onCreateProject} className="bg-[#FFD369] px-4 font-bold text-black hover:bg-[#FFD369]/90">
            <Plus size={16} className="mr-2" />Nouveau projet
          </Button>
        </div>
      </div>

      {projects.length === 0 ? (
        <Card className="flex min-h-[320px] flex-col items-center justify-center border-[#393E46] bg-[#EEEEEE] p-8 text-center">
          <FolderOpen size={44} className="mb-4 text-[#393E46]/50" />
          <p className="font-serif text-xl italic text-[#222831]">Aucun projet sauvegardé</p>
          <p className="mt-2 max-w-md text-sm text-[#393E46]">Créez un projet, puis utilisez le bouton Sauvegarder pour l'ajouter ici.</p>
          <Button onClick={onCreateProject} className="mt-6 bg-[#FFD369] px-4 font-bold text-black hover:bg-[#FFD369]/90">
            <Plus size={16} className="mr-2" />Commencer
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((sp) => (
            <Card key={sp.id} className="flex min-h-44 flex-col border-[#393E46] bg-[#EEEEEE] p-4 shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-serif text-xl italic text-[#222831]">{sp.title}</h3>
                  <p className="mt-1 text-xs uppercase tracking-widest text-[#393E46]">
                    {new Date(sp.updatedAt).toLocaleDateString('fr-FR', {
                      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {currentProjectId === sp.id && <Badge className="bg-[#FFD369] text-[#222831]">Ouvert</Badge>}
                  {supabaseEnabled && (
                    <Badge className={cn(
                      'gap-1 text-[10px]',
                      sp.syncStatus === 'synced' ? 'bg-[#393E46] text-[#FFFFFF]' : 'bg-red-100 text-red-700',
                    )}>
                      {sp.syncStatus !== 'synced' && <CloudOff size={10} />}
                      {sp.syncStatus === 'synced' ? 'Synchronisé' : 'Local uniquement'}
                    </Badge>
                  )}
                </div>
              </div>
              <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-[#393E46]">
                {sp.project.logline || sp.project.synopsis || 'Aucune logline renseignée.'}
              </p>
              <div className="mt-auto flex gap-2 pt-5">
                <Button className="flex-1 bg-[#FFD369] font-bold text-black hover:bg-[#FFD369]/90" onClick={() => onOpenProject(sp)}>
                  Ouvrir
                </Button>
                <Button variant="outline" size="icon-sm" className="border-[#393E46] text-[#393E46] hover:text-red-500" onClick={() => onDeleteProject(sp.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
