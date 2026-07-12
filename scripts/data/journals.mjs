/** Bilingual rules journal for the crafting workshop — created by the installer (FR + EN pages). */
export const JOURNALS = [
  {
    role: "workshop-rules",
    pages: [
      { name: "🇫🇷 Ateliers — Fonctionnement & règles", content: `
<h1>⚒️ Ateliers de fabrication</h1>
<p>Une macro unique — <b>⚒️ Atelier de fabrication</b> — donne accès à trois flux : <b>Sabre laser</b>,
<b>Arme / Armure</b> (accessoires &amp; mods) et <b>Équipement</b> (potions &amp; talismans). Toutes les
listes viennent de <b>ton compendium</b> ; les profils sont calculés par le système, rien n'est codé en dur.</p>

<h2>🔩 Emplacements (hard points)</h2>
<p>Chaque objet (arme/armure) possède un nombre d'<b>emplacements</b>. Chaque accessoire posé en
consomme ; on ne peut pas dépasser le total. L'atelier affiche en direct le budget <em>utilisés / total</em>.</p>

<h2>⚔️ Sabre laser</h2>
<p>Un sabre = <b>poignée</b> (le châssis : emplacements, encombrement) + <b>cristal</b> (qui fixe les
Dégâts et le seuil critique de base) + <b>accessoires</b>. Chaque partie est un vrai attachement, et
chacune reste <b>modifiable</b> ensuite (voir « Activer un mod »). Mode <b>Recustom</b> : refaire un sabre
existant en place (on change le cristal / les accessoires sans créer de doublon).</p>

<h2>🔧 Poser un accessoire (arme ou armure)</h2>
<ol>
<li>Choisis l'objet, coche un ou plusieurs accessoires compatibles (la liste s'adapte à l'objet).</li>
<li>L'aperçu montre le <b>profil résultant</b> et le budget d'emplacements.</li>
<li><b>Test de Mécanique</b> — la difficulté dépend de la rareté (Facile ◆ / Moyenne ◆◆ / Difficile ◆◆◆).
Le jet part <b>avant</b> la pose : en cas d'échec, rien n'est installé.</li>
</ol>
<p><em>Armes</em> : Dégâts/Critique sont calculés nativement. <em>Armures</em> : Encaissement/Défense
sont inscrits sur le profil de l'objet (ils s'appliquent quand l'armure est portée).</p>

<h2>⚙️ Activer un mod (Étape 2)</h2>
<p>Chaque accessoire posé propose des <b>mods</b> (Dégâts +X, une qualité…). On les active un par un :</p>
<ul>
<li>La difficulté suit la <b>règle du livre</b> : base <b>Moyenne ◆◆</b>, <b>+1 par mod déjà activé</b> sur
ce même accessoire (Moyenne → Difficile → Redoutable…).</li>
<li>Le compteur <em>X / total</em> est natif (visible sur la fiche de l'accessoire).</li>
<li>Sur une réussite, un mod chiffré (Dégâts +X…) <b>modifie réellement le profil</b> de l'arme/armure.</li>
</ul>

<h2>⚗️ Équipement — Potions &amp; Talismans</h2>
<p>Choisis une recette, lance le test ; sur réussite, l'objet est créé sur ta fiche. Les
<b>avantages</b> et <b>triomphes</b> ouvrent des options (durée, lot, minutie, effet renforcé…) à cocher
avant de valider la création.</p>

<h2>🎲 Symboles &amp; résultats</h2>
<p><b>Succès net</b> requis pour fabriquer. <b>Avantage</b> : bonus (réduire le temps, poser un mod, effet
supplémentaire). <b>Triomphe</b> : mod / qualité exceptionnelle. <b>Menace / Désespoir</b> : complication,
matériaux gâchés ou pièce endommagée.</p>

<h2>🛠️ Réparer / enrichir (MJ)</h2>
<p><em>Configuration des options → Réparer / enrichir les équipements</em> : rend lisibles les fiches
d'accessoires déjà en jeu et applique correctement leurs mods activés. Sûr, réversible.</p>
` },
      { name: "🇬🇧 Workshops — How it works & rules", content: `
<h1>⚒️ Crafting Workshops</h1>
<p>A single macro — <b>⚒️ Crafting Workshop</b> — opens three flows: <b>Lightsaber</b>,
<b>Weapon / Armor</b> (attachments &amp; mods) and <b>Equipment</b> (potions &amp; talismans). Every list
comes from <b>your compendium</b>; profiles are computed by the system, nothing is hardcoded.</p>

<h2>🔩 Hard points</h2>
<p>Each item (weapon/armor) has a number of <b>hard points</b>. Every installed attachment consumes some;
you can't exceed the total. The workshop shows the <em>used / total</em> budget live.</p>

<h2>⚔️ Lightsaber</h2>
<p>A saber = <b>hilt</b> (chassis: hard points, encumbrance) + <b>crystal</b> (which sets base Damage and
Critical) + <b>accessories</b>. Each part is a real attachment and stays <b>moddable</b> afterwards (see
"Activate a mod"). <b>Recustom</b> mode: rebuild an existing saber in place (swap crystal/accessories with
no duplicate).</p>

<h2>🔧 Install an attachment (weapon or armor)</h2>
<ol>
<li>Pick the item, tick one or more compatible attachments (the list adapts to the item).</li>
<li>The preview shows the <b>resulting profile</b> and the hard-point budget.</li>
<li><b>Mechanics check</b> — difficulty follows rarity (Easy ◆ / Average ◆◆ / Hard ◆◆◆). The roll comes
<b>first</b>: on a failure nothing is installed.</li>
</ol>
<p><em>Weapons</em>: Damage/Critical are computed natively. <em>Armor</em>: Soak/Defence are written to the
item's profile (they apply while the armor is worn).</p>

<h2>⚙️ Activate a mod (Step 2)</h2>
<p>Each installed attachment offers <b>mods</b> (Damage +X, a quality…). Activate them one at a time:</p>
<ul>
<li>Difficulty follows the <b>book rule</b>: base <b>Average ◆◆</b>, <b>+1 per mod already activated</b> on
that same attachment (Average → Hard → Daunting…).</li>
<li>The <em>X / total</em> counter is native (visible on the attachment).</li>
<li>On a success, a numeric mod (Damage +X…) <b>actually changes</b> the weapon/armor profile.</li>
</ul>

<h2>⚗️ Equipment — Potions &amp; Talismans</h2>
<p>Pick a recipe, roll the check; on a success the item is created on your sheet. <b>Advantages</b> and
<b>Triumphs</b> unlock options (duration, batch, thrift, stronger effect…) to tick before confirming.</p>

<h2>🎲 Symbols &amp; results</h2>
<p><b>Net success</b> is required to craft. <b>Advantage</b>: bonus (reduce time, place a mod, extra effect).
<b>Triumph</b>: free mod / exceptional quality. <b>Threat / Despair</b>: complication, wasted materials or a
damaged component.</p>

<h2>🛠️ Repair / enrich (GM)</h2>
<p><em>Configure Settings → Repair / enrich equipment</em>: makes existing attachment sheets readable and
correctly applies their activated mods. Safe, revertible.</p>
` },
    ],
  },
];
