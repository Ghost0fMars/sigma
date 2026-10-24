/**
 * Vérifie l'import déterministe : `npx tsx scripts/check-import.ts [fichier.md]`
 * Sans argument, teste des fixtures intégrées ; avec un fichier, affiche le bilan réel.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { asMarkdown, createScene } from '../src/lib/dramaturgical';
import { parseImportedDocument } from '../src/lib/importDocument';
import { SceneType } from '../src/types';

const file = process.argv[2];
if (file) {
  const parsed = parseImportedDocument(readFileSync(file, 'utf8'), 'scenario');
  assert(parsed, 'rien reconnu dans le fichier');
  const { kind, project } = parsed;
  console.log(`${kind} · « ${project.title} » · ${project.scenes.length} scènes · ${project.screenplay.length} caractères de scénario`);
  project.scenes.slice(0, 5).forEach((s) => console.log(` - ${s.indications} | ${s.title} | ${s.description.slice(0, 70)}`));
  process.exit(0);
}

// 1. Scénario : intitulés en tiret cadratin, INT./EXT., Fountain forcé, Markdown gras/titres, faux amis.
const script = [
  '# MON FILM', '', 'Un scénario de long-métrage', '',
  'INT – UNE CHAMBRE D’HÔTEL – JOUR', 'Des rideaux volent.', 'Est-ce que ça marche ?', '',
  'L’HOMME', '(Essoufflé)', 'Tu me rends fou.', '',
  '**EXT/INT – MAISON NORMANDE – SOIR**', 'Un chat observe les poules.', '',
  '## INT. BUREAU - NUIT', 'Interdit au public. Il écrit.', '',
  '.LE GARAGE', 'Noir.', '', 'ELLIPSE', 'Il attend.',
].join('\n');
const sp = parseImportedDocument(script, 'scenario');
assert(sp && sp.kind === 'screenplay');
assert.equal(sp.project.scenes.length, 4);                                  // aucune scène perdue ni inventée
assert.equal(sp.project.title, 'Mon Film');
assert.equal(sp.project.scenes[0].title, 'Une Chambre d’hôtel');            // lieu sans « INT » ni « JOUR »
assert.equal(sp.project.scenes[0].description, 'Des rideaux volent. Est-ce que ça marche ?'); // répliques exclues
assert.equal(sp.project.scenes[1].indications, 'EXT/INT – MAISON NORMANDE – SOIR');
assert.equal(sp.project.scenes[2].description, 'Interdit au public. Il écrit.');  // « Interdit » n'est pas un intitulé
assert(sp.project.screenplay.includes('Tu me rends fou.'));                 // scénario repris en entier
assert.equal(parseImportedDocument('Une idée de film sur un homme.', 'idee'), null);   // retombe sur l'IA

// 2. Aller-retour : export Markdown de SIGMA → import = projet identique.
const project = {
  title: 'Aller-retour', logline: 'Une logline.', synopsis: 'Syn.', developedSynopsis: 'Syn dev.',
  treatment: 'Traitement.', notes: 'Notes.', screenplay: '## Un titre dans le scénario\nINT – SALON – NUIT\nTexte.',
  scenes: [
    createScene(0, { title: 'Ouverture', indications: 'INT. SALON - NUIT', description: 'Elle entre.', dramaticInfo: 'Elle ment.', type: SceneType.INCITING_INCIDENT, vt: -1, ct: 0.8, duration: 2 }),
    createScene(1, { title: 'Chute', indications: 'EXT. RUE - JOUR', description: 'Il tombe.', type: SceneType.CLIMAX, vt: 2, ct: 1 }),
  ],
};
const rt = parseImportedDocument(asMarkdown(project), 'idee');
assert(rt && rt.kind === 'sigma');
assert.equal(rt.project.screenplay, project.screenplay);
assert.equal(rt.project.scenes.length, 2);
assert.deepEqual(
  rt.project.scenes.map(({ id, order, st, ...rest }) => rest),
  project.scenes.map(({ id, order, st, ...rest }) => ({ ...rest, duration: rest.duration ?? 1.5, dramaticInfo: rest.dramaticInfo })),
);
console.log('import : tout est OK');
