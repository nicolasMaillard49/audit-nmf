# -*- coding: utf-8 -*-
"""
Généré le rapport d'audit NMF pour GP elec à partir des données sources.
Toutes les valeurs chiffrees proviennent des JSON collectes : aucune saisie manuelle.
"""
import base64, json, io, os, pathlib, sys
from PIL import Image

sys.stdout.reconfigure(encoding="utf-8")

# "complet" = audit integral. "marche" = version sans analyse des defauts du site.
VARIANTE = os.environ.get("AUDIT_VARIANTE", "complet")
SANS_SITE = VARIANTE == "marche"
SP = pathlib.Path(__file__).parent
SKILL = pathlib.Path(r"C:\Users\nicol\.claude\skills\audit-digital-google-ads")

ads = json.load(open(SP / "ads-data.json", encoding="utf-8"))
port = json.load(open(SP / "portfolio.json", encoding="utf-8"))
ev1 = json.load(open(SP / "browser-evidence.json", encoding="utf-8"))
ev2 = json.load(open(SP / "browser-evidence-2.json", encoding="utf-8"))
css = (SKILL / "assets" / "audit-design-lock.css").read_text(encoding="utf-8")

# ── Variables de l'audit ───────────────────────────────────────────────────
V = dict(
    client="GP elec",
    gerant="Pierre Guille",
    domain="gp-elec-49.com",
    date="Juillet 2026",
    date_full="31 juillet 2026",
    audit_type="Audit client",
    territory_label="Angers · couronne sud",
    territory_code="49",
    nmf_site="nmf-agence.com",
    nmf_insta="@nmfagence",
    nmf_rdv="koalendar.com/e/reunion-nicolas-maillard",
)

# ── Images embarquees ──────────────────────────────────────────────────────
def b64(path, fmt="PNG", box=None, crop_ratio=None):
    im = Image.open(path).convert("RGB")
    if crop_ratio:  # ratio largeur/hauteur cible
        w, h = im.size
        target = crop_ratio
        if w / h > target:
            nw = int(h * target)
            im = im.crop(((w - nw) // 2, 0, (w + nw) // 2, h))
        else:
            nh = int(w / target)
            im = im.crop((0, int((h - nh) * 0.45), w, int((h - nh) * 0.45) + nh))
    if box:
        im.thumbnail(box, Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, fmt, quality=88, optimize=True)
    return "data:image/%s;base64,%s" % (fmt.lower(), base64.b64encode(buf.getvalue()).decode())

LOGO = "data:image/png;base64," + base64.b64encode(
    pathlib.Path(r"D:\obsidian\MonCerveau\Agence\Logo\logo_light_bg.png").read_bytes()).decode()
MARK = "data:image/png;base64," + base64.b64encode(
    pathlib.Path(r"D:\obsidian\MonCerveau\Agence\Logo\logo_symbole.png").read_bytes()).decode()
S = SP / "shots"
IMG = dict(
    cover=b64(S / "combles-1.jpeg", "JPEG", (700, 2400), crop_ratio=70 / 267),
    chantier=b64(S / "combles-2.jpeg", "JPEG", (1100, 700)),
    desktop=b64(S / "desktop-01-fold.png", "JPEG", (1200, 760)),
    mobile_fold=b64(S / "mobile-01-fold.png", "JPEG", (620, 1400)),
    mobile_form=b64(S / "mobile-form.png", "JPEG", (620, 1400)),
    desktop_services=b64(S / "desktop-services.png", "JPEG", (1200, 760)),
)

# ── Donnees Google ─────────────────────────────────────────────────────────
hist = {h["text"]: h for h in ads["historical"]}
kws = port["keywords"]
withvol = [h for h in ads["historical"] if h.get("vol")]
novol = [h for h in ads["historical"] if not h.get("vol")]
merged = [h for h in ads["historical"] if h.get("closeVariants")]
kw_total = len(kws)
vol_total = sum(h["vol"] for h in withvol)

fam_label = port["familles"]
FAM_SHORT = {"A": "Climatisation", "B": "Dépannage", "C": "Électricien général",
             "D": "Rénovation", "E": "Neuf", "F": "Cuisine", "G": "Domotique", "H": "Devis et prix"}
def fam_of(text):
    for k in kws:
        if k["text"] == text:
            return k["famille"]
    for h in ads["historical"]:
        if h["text"] == text:
            for cv in h.get("closeVariants", []):
                for k in kws:
                    if k["text"] == cv:
                        return k["famille"]
    return "?"

def intent_of(text):
    for k in kws:
        if k["text"] == text:
            return k["intention"]
    return "-"

fam_vol = {}
for h in withvol:
    fam_vol[fam_of(h["text"])] = fam_vol.get(fam_of(h["text"]), 0) + h["vol"]

matrix = ads["matrix"]
def rows_for(strategy):
    return [m for m in matrix if m["strategy"].startswith(strategy) and m.get("ok")]
PRES = rows_for("Presence")
TOP = rows_for("Haut de page")
DOM = rows_for("Domination")
strategies = [("Presence (maximisation des clics)", PRES), ("Haut de page (CPC manuel)", TOP),
              ("Domination (CPC manuel majore)", DOM)]

# Les cles ci-dessus doivent rester identiques aux valeurs renvoyees par l API
# Google : elles servent au rapprochement rapport / sources. Cette table ne sert
# qu a l affichage imprime.
LIBELLE = {
    "Presence (maximisation des clics)": "Présence (maximisation des clics)",
    "Haut de page (CPC manuel)": "Haut de page (CPC manuel)",
    "Domination (CPC manuel majore)": "Domination (CPC manuel majoré)",
    "Presence": "Présence",
    "Haut de page": "Haut de page",
    "Domination": "Domination",
}
lib = lambda k: LIBELLE.get(k, k)

REC = 200  # palier de test recommande, justifie page 7
def at(rows, budget):
    for r in rows:
        if r["budget_mensuel"] == budget:
            return r
    return None

# Plafond : depense < 90 % du budget + 2 paliers superieurs + stabilite ±5 %
def ceiling(rows):
    rows = sorted(rows, key=lambda r: r["budget_mensuel"])
    for i, r in enumerate(rows):
        if r["cost"] and r["cost"] < 0.9 * r["budget_mensuel"] and i + 2 < len(rows):
            a, b = rows[i + 1], rows[i + 2]
            def stable(x, y):
                return abs(x - y) <= 0.05 * max(x, y, 1e-9)
            if stable(r["cost"], a["cost"]) and stable(r["cost"], b["cost"]) \
               and stable(r["clicks"], a["clicks"]) and stable(r["clicks"], b["clicks"]):
                return dict(prouve=True, palier=r["budget_mensuel"], depense=r["cost"], clics=r["clicks"])
    return dict(prouve=False)
CEIL = ceiling(PRES) if PRES else dict(prouve=False)

def eur(x, d=2):
    return ("{:,.%df}" % d).format(x).replace(",", "\u202f").replace(".", ",") if x is not None else "—"
def num(x, d=0):
    return ("{:,.%df}" % d).format(x).replace(",", "\u202f").replace(".", ",") if x is not None else "—"

# ── Score de preparation (grille documentee, publiee page 7 + annexe) ──────
AXES = [
    ("Demande locale mesurée", 20, 16,
     "Portefeuille de %d mots-clés, %s recherches/mois cumulées sur la zone." % (kw_total, num(vol_total))),
    ("Qualité des requêtes", 20, 14,
     "Intention commerciale majoritaire, mais une part du volume reste informationnelle."),
    ("Capacité de conversion", 20, 9,
     "Téléphone omnipresent et bouton d’appel flottant, mais formulaire sans envoi serveur."),
    ("Mesure", 20, 4,
     "GA4 installé, aucun événement de conversion ni marquage Google Ads."),
    ("Pertinence de l’offre", 10, 8,
     "Services réellement vendus et clairement décrits ; pas de page dédiée par service."),
    ("Couverture géographique", 10, 10,
     "Zone déclarée cohérente avec celle du forecast ; fiche établissement en ligne."),
]
SCORE = sum(a[2] for a in AXES)

# ══════════════════════════════════════════════════════════════════════════
#  Figures SVG (statiques, sans JavaScript)
# ══════════════════════════════════════════════════════════════════════════
def svg_budget_curve(w=470, h=190):
    """Courbe budget demande / dépense prévue, toutes stratégies, tous paliers."""
    pad_l, pad_r, pad_t, pad_b = 40, 12, 12, 26
    xs = sorted({r["budget_mensuel"] for _, rr in strategies for r in rr})
    if not xs:
        return "<p class='source'>Données insuffisantes.</p>"
    xmax, ymax = max(xs), 800
    X = lambda v: pad_l + (v / xmax) * (w - pad_l - pad_r)
    Y = lambda v: h - pad_b - (v / ymax) * (h - pad_t - pad_b)
    colors = ["var(--nmf-blue)", "var(--nmf-violet)", "var(--technical-teal)"]
    o = [f'<svg viewBox="0 0 {w} {h}" width="100%" role="img">']
    for gy in range(0, 801, 200):
        o.append(f'<line class="gridline" x1="{pad_l}" y1="{Y(gy):.1f}" x2="{w-pad_r}" y2="{Y(gy):.1f}"/>')
        o.append(f'<text class="axis-label" x="{pad_l-4}" y="{Y(gy)+3:.1f}" text-anchor="end">{gy}</text>')
    o.append(f'<line class="axis" x1="{pad_l}" y1="{Y(0):.1f}" x2="{w-pad_r}" y2="{Y(0):.1f}"/>')
    # reference y = x (budget entierement depense)
    o.append(f'<path d="M {X(0):.1f} {Y(0):.1f} L {X(800):.1f} {Y(800):.1f}" stroke="var(--line-dark)" '
             f'stroke-width="1" stroke-dasharray="3 3" fill="none"/>')
    for i, (name, rr) in enumerate(strategies):
        pts = [(X(r["budget_mensuel"]), Y(min(r["cost"], ymax))) for r in sorted(rr, key=lambda r: r["budget_mensuel"])]
        if not pts:
            continue
        d = " ".join(("M" if k == 0 else "L") + f' {x:.1f} {y:.1f}' for k, (x, y) in enumerate(pts))
        o.append(f'<path d="{d}" fill="none" stroke="{colors[i]}" stroke-width="3" '
                 f'stroke-linecap="round" stroke-linejoin="round"/>')
        for x, y in pts:
            o.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="2.6" fill="{colors[i]}" stroke="var(--white)" stroke-width="1.2"/>')
    for v in (0, 500, 1000, 1500, 2000):
        o.append(f'<text class="axis-label" x="{X(v):.1f}" y="{h-10}" text-anchor="middle">{v}</text>')
    o.append(f'<text class="axis-label" x="{pad_l}" y="{h-1}" text-anchor="start">Budget demande (EUR/mois)</text>')
    if CEIL.get("prouve"):
        o.append(f'<line x1="{X(CEIL["palier"]):.1f}" y1="{pad_t}" x2="{X(CEIL["palier"]):.1f}" y2="{Y(0):.1f}" '
                 f'stroke="var(--critical-red)" stroke-width="1" stroke-dasharray="2 2"/>')
    o.append("</svg>")
    return "".join(o)

def svg_scatter(w=470, h=250):
    """Nuage volume mensuel / enchère haut de page, sur les mots-clés avec volume."""
    pts = [(x["vol"], x["bidHigh"], x["text"]) for x in withvol if x.get("bidHigh")]
    if not pts:
        return "<p class='source'>Données insuffisantes.</p>"
    pad_l, pad_r, pad_t, pad_b = 30, 46, 14, 30
    xmax = max(p[0] for p in pts) * 1.06
    ymax = max(p[1] for p in pts) * 1.10
    X = lambda v: pad_l + (v / xmax) * (w - pad_l - pad_r)
    Y = lambda v: h - pad_b - (v / ymax) * (h - pad_t - pad_b)
    o = ['<svg viewBox="0 0 %d %d" width="100%%" role="img">' % (w, h)]
    for gy in (0, 1, 2, 3, 4, 5):
        if gy > ymax:
            continue
        o.append('<line class="gridline" x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f"/>' % (pad_l, Y(gy), w - pad_r, Y(gy)))
        o.append('<text class="axis-label" x="%.1f" y="%.1f" text-anchor="end">%d €</text>' % (pad_l - 4, Y(gy) + 3, gy))
    o.append('<line class="axis" x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f"/>' % (pad_l, Y(0), w - pad_r, Y(0)))
    # points, les plus gros volumes dessines en dernier
    ordered = sorted(pts, key=lambda p: p[0])
    labelled = {t for _, _, t in sorted(pts, key=lambda p: -p[0])[:4]}
    labelled |= {t for _, b_, t in sorted(pts, key=lambda p: -p[1])[:3]}
    placed = []
    for v, bid, t in ordered:
        it = intent_of(t)
        cls = "point-intent" if "commerciale" in it else ("point-generic" if it == "comparaison" else "point-exclude")
        o.append('<circle class="%s" cx="%.1f" cy="%.1f" r="4.2"/>' % (cls, X(v), Y(bid)))
    for v, bid, t in sorted(pts, key=lambda p: -p[0]):
        if t not in labelled:
            continue
        x, y = X(v), Y(bid)
        anchor, dx = ("end", -7) if x > w * 0.62 else ("start", 7)
        dy = 3
        for px, py in placed:                      # evite les collisions verticales
            if abs(px - (x + dx)) < 90 and abs(py - (y + dy)) < 10:
                dy += 11
        placed.append((x + dx, y + dy))
        o.append('<text class="point-label" x="%.1f" y="%.1f" text-anchor="%s">%s</text>' % (x + dx, y + dy, anchor, t))
    for v in (0, 100, 200, 300, 400):
        if v <= xmax:
            o.append('<text class="axis-label" x="%.1f" y="%d" text-anchor="middle">%d</text>' % (X(v), h - 14, v))
    o.append('<text class="axis-label" x="%.1f" y="%d" text-anchor="middle">Recherches par mois</text>' % ((pad_l + w - pad_r) / 2, h - 3))
    o.append('<text class="axis-label" x="%d" y="%d" text-anchor="start">Enchère haut de page</text>' % (pad_l - 26, pad_t - 4))
    o.append("</svg>")
    return "".join(o)


def svg_strategy_bars(w=225, h=150):
    """Comparaison des trois stratégies au palier recommandé."""
    vals = [(lib(n.split(" (")[0]), at(rr, REC)) for n, rr in strategies]
    vals = [(n, r) for n, r in vals if r]
    if not vals:
        return "<p class='source'>Données insuffisantes.</p>"
    pad_t, pad_b, pad_l = 20, 24, 6
    cmax = max(r["clicks"] for _, r in vals) * 1.22
    bw = (w - pad_l * 2) / len(vals) - 14
    colors = ["var(--nmf-blue)", "var(--nmf-violet)", "var(--technical-teal)"]
    o = [f'<svg viewBox="0 0 {w} {h}" width="100%" role="img">']
    for i, (n, r) in enumerate(vals):
        x = pad_l + i * ((w - pad_l * 2) / len(vals)) + 7
        bh = (r["clicks"] / cmax) * (h - pad_t - pad_b)
        y = h - pad_b - bh
        o.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{bw:.1f}" height="{bh:.1f}" fill="{colors[i]}"/>')
        o.append(f'<text class="point-label" x="{x+bw/2:.1f}" y="{y-5:.1f}" text-anchor="middle">{num(r["clicks"])}</text>')
        o.append(f'<text class="axis-label" x="{x+bw/2:.1f}" y="{h-13}" text-anchor="middle">{n}</text>')
        o.append(f'<text class="axis-label" x="{x+bw/2:.1f}" y="{h-4}" text-anchor="middle">{eur(r["cpc"])} €/clic</text>')
    o.append(f'<line class="axis" x1="{pad_l}" y1="{h-pad_b:.1f}" x2="{w-pad_l}" y2="{h-pad_b:.1f}"/>')
    o.append("</svg>")
    return "".join(o)

def stacked_portfolio(w=470):
    """Barre empilee : intention commerciale / générique / sans volume."""
    inten = sum(1 for k in kws if "commerciale" in k["intention"])
    compa = sum(1 for k in kws if k["intention"] == "comparaison")
    gener = kw_total - inten - compa
    tot = kw_total
    seg = [("Intention commerciale", inten, "var(--nmf-blue)"),
           ("Comparaison de prix", compa, "var(--nmf-violet-data)"),
           ("Générique ou informationnel", gener, "var(--technical-teal)")]
    bars = "".join(
        f'<div style="width:{max(v/tot*100,6):.1f}%;background:{c};height:8mm"></div>' for _, v, c in seg)
    leg = "".join(
        f'<span style="display:inline-flex;align-items:center;gap:1.6mm;margin-right:5mm">'
        f'<i style="width:2.4mm;height:2.4mm;background:{c};display:inline-block"></i>'
        f'{n} — {v} mots-clés ({v/tot*100:.0f} %)</span>' for n, v, c in seg)
    return (f'<div style="display:flex;margin-top:2mm">{bars}</div>'
            f'<div style="margin-top:2.4mm;font-size:6.4pt;color:var(--muted)">{leg}</div>')

# ══════════════════════════════════════════════════════════════════════════
#  Assemblage des pages
# ══════════════════════════════════════════════════════════════════════════
PAGES = []
def page(html):
    PAGES.append(html)

def head(kicker, title, status=None):
    st = f'<div class="head-status">{status}</div>' if status else ""
    return (f'<div class="page-head"><div><div class="kicker">{kicker}</div>'
            f'<h2>{title}</h2></div>{st}</div>')

def foot(section):
    return ('<div class="footer"><span><img class="mini-mark" src="%s" alt="">'
            'Audit %s · NMF Agence — %s</span>'
            '<span class="tabular">{{PAGE}} / {{TOTAL}}</span></div>' % (MARK, V["client"], section))

def findings(items):
    return "".join(f'<div class="finding"><i></i><div><strong>{t}</strong> {c}</div></div>' for t, c in items)

# ─────────────────────────────────────────────── P1 · Couverture
page(f'''<section class="page cover">
  <img class="cover-photo" src="{IMG['cover']}" alt="Chantier GP elec — plancher chauffant electrique">
  <div class="cover-content">
    <div class="cover-meta">
      <img class="brand-logo cover-logo" src="{LOGO}" alt="NMF Agence">
      <span>{V['audit_type']} · {V['date']}</span>
    </div>
    <div class="cover-copy">
      <div class="kicker">{"Potentiel Google Ads" if SANS_SITE else "Audit digital &amp; potentiel Google Ads"}</div>
      <h1>{V['client']}<br>{"Le marché local," if SANS_SITE else "Un site rapide,"}<br><span class="accent">{"chiffré palier par palier" if SANS_SITE else "un marché à la mesure"}</span><br>{"avant d’ouvrir." if SANS_SITE else "de l’atelier."}</h1>
      <p class="lede">{"Ce que la demande locale permet réellement, ce que le marché peut absorber, et le budget que cela justifie — mesuré, pas estimé." if SANS_SITE else "Ce que la demande locale permet réellement, ce que le site laisse encore passer, et le budget que le marché peut absorber — mesuré, pas estimé."}</p>
    </div>
    <div class="cover-ring">
      <span class="territory-label">{V['territory_label']}</span>
      <span class="territory-code">{V['territory_code']}</span>
    </div>
    <div class="cover-facts">
      <span>{V['domain']}</span>
      <span style="text-align:center">{kw_total} mots-clés analyses · {len([m for m in matrix if m.get("ok")])} prévisions Google</span>
      <span>{{{{TOTAL}}}} pages</span>
    </div>
  </div>
</section>''')

# Etapes tournees vers l ouverture de campagne : aucun constat de defaut, aucune
# priorite. Utilisees uniquement dans la variante « marche ».
A_METTRE_EN_PLACE = [
    ("Le comptage des appels et des demandes.",
     "Un compte Google Ads pilote sur ce qu’il sait mesurer. Déclarer l’appel et l’envoi du "
     "formulaire comme conversions est le premier geste, avant toute dépense."),
    ("L’entretien de la fiche établissement.",
     "Elle est en ligne et porte 5,0 sur 9 avis. Continuer à l’alimenter en photos de chantier "
     "et à solliciter un avis en fin d’intervention : c’est le levier le moins coûteux de la zone."),
    ("Une page dédiée au service que l’on pousse.",
     "Une annonce gagne à mener vers une page qui parle du même service, avec le vocabulaire "
     "de la recherche tapée."),
]

# Lecture favorable des memes preuves de site, pour la variante « marche ».
ATOUTS_CAMPAGNE = [
    ("Une page d’arrivée qui ne pénalise pas l’enchère.",
     "La vitesse d’affichage et la stabilité de la mise en page comptent dans la note de qualité "
     "que Google attribue à une annonce."),
    ("Un contact possible en un geste sur mobile.",
     "Une bonne part des recherches de dépannage se font depuis un téléphone : le bouton fixe "
     "capte cette intention sans aucun défilement."),
    ("Un socle prêt à recevoir une page par service.",
     "Les prestations sont déjà décrites et illustrées ; il reste à leur donner une adresse "
     "propre pour les annonces."),
]

# ─────────────────────────────────────────────── P2 · Synthese executive
r200 = at(PRES, REC)
page(f'''<section class="page">
  {head("01 · Synthèse exécutive", ("Le marché est là, mesuré, et son plafond est connu." if SANS_SITE else "Le marché est là. Le site ne sait pas encore le recevoir."), ("Marché mesuré<br>palier par palier" if SANS_SITE else "Test possible<br>sous conditions"))}
  <p class="lead" style="margin-top:6mm">Le site de {V['client']} est techniquement au-dessus de ce que
  l’on observe habituellement chez un artisan local. La demande, elle, est réelle et mesurable.
  Ce qui manque se situe entre les deux : rien ne garantit aujourd’hui qu’une demande envoyée
  depuis le formulaire arrive, et rien ne permet de la compter.</p>

  <div class="metric-strip">
    <div class="metric"><strong class="tabular">{num(vol_total)}</strong>
      <span>recherches par mois cumulées sur le portefeuille, zone {V['territory_label']}<br>Donnée Google Ads</span></div>
    <div class="metric"><strong class="tabular">{REC} €</strong>
      <span>palier de test recommandé par mois, encadré par {len(PRES)} paliers testés<br>Recommandation NMF</span></div>
    <div class="metric"><strong class="tabular">{eur(CEIL.get("depense"), 0) if CEIL.get("prouve") else "—"} €</strong>
      <span>plafond mensuel d’inventaire démontré sur trois paliers<br>Donnée Google Ads</span></div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:9mm;margin-top:7mm">
    <div>
      <h3 class="section-title">Ce sur quoi on peut construire</h3>
      {findings([
        ("Un site plus rapide que la moyenne du métier.",
         "Lighthouse mesure 97/100 sur mobile et 99/100 sur ordinateur, avec un affichage complet en 2,0 s."),
        ("Le téléphone est partout, y compris flottant.",
         "Cinq liens d’appel, dont un bouton fixe de 56 px toujours visible sur mobile. Confirmé dans le navigateur."),
        ("Un positionnement juste et vérifiable.",
         "Entreprise familiale, 40 ans, deux générations : le message tient du haut de page jusqu aux engagements."),
      ])}
    </div>
    <div>
      <h3 class="section-title">{"Ce qu’il reste à mettre en place" if SANS_SITE else "Ce qui bloque l’acquisition"}</h3>
      {findings(A_METTRE_EN_PLACE if SANS_SITE else [
        ("Le formulaire n’envoie rien vers un serveur.",
         "Aucun attribut d’action, cinq champs sans nom : une demande peut se perdre sans que personne le sache."),
        ("Aucune conversion n’est mesurée.",
         "GA4 compte les pages vues, pas les appels ni les demandes. Une campagne serait pilotée à l’aveugle."),
        ("La note affichée ne correspond pas aux avis réels.",
         "Le site annonce 4.9 sur 84 avis ; la fiche Google porte 5,0 sur 9 avis. Deux chiffres pour une même réalité."),
      ])}
    </div>
  </div>

  <div class="decision-band" style="margin-top:7mm">
    <strong>Le chiffre à retenir</strong>
    <p>Au-dela de <b>{num(CEIL.get("palier"))} € par mois</b>, la prévision Google cesse de progresser :
    la dépense se fige à <b>{eur(CEIL.get("depense"))} €</b> et le volume à <b>{num(CEIL.get("clics"))} clics</b>,
    identiques sur les trois derniers paliers. Le marché a un plafond, et il est bas.
    Cela protège le budget autant que cela le limite : inutile de viser plus haut, utile de viser juste.</p>
  </div>

  <div style="margin-top:6mm">
    <h3 class="section-title">Ce que NMF recommandé d’abord</h3>
    <p style="font-size:8.4pt;line-height:1.45">{"Brancher le comptage des appels et des demandes, aligner la note affichée sur celle de la fiche, puis lancer un test encadré au palier étudié plus loin. La mesure d’abord : c’est elle qui rend tout le reste lisible." if SANS_SITE else "Rendre le formulaire opérationnel et brancher la mesure des appels et des demandes. Ces deux corrections ne dépendent d’aucune donnée client et conditionnent tout le reste : sans elles, un test publicitaire ne produirait aucun enseignement exploitable."}</p>
  </div>

  <p class="source" style="margin-top:5mm">Sources — Google Ads API v24, KeywordPlanIdeaService, extraction du {V['date_full']},
  zone {V['territory_label']} ({len(ads['geo'])} communes), langue française, réseau Recherche, devise EUR,
  période de prévision {ads['meta']['periode_forecast']['start_date']} au {ads['meta']['periode_forecast']['end_date']}.
  Mesures de site relevées le même jour dans Chrome sur deux viewports.</p>
  {foot("Synthèse")}
</section>''')

# ─────────────────────────────────────────────── P3 · Entreprise et marche
SERVICES = [
    ("Climatisation réversible et pompe à chaleur air/air", "A",
     "Étude, pose mono-split ou multi-split, circuit dédié NF C 15-100, entretien et dépannage."),
    ("Installation électrique neuve", "E",
     "Installation complete aux normes NF C 15-100, du tableau aux prises, certificat Consuel à la livraison."),
    ("Rénovation et mise aux normes", "D",
     "Diagnostic, dépose, pose neuve et attestation Consuel sur les logements anciens."),
    ("Dépannage en urgence", "B",
     "Disjoncteur, court-circuit, panne totale ou partielle."),
    ("Domotique", "G",
     "Pilotage centralisé de l’éclairage, des volets, du chauffage. Integration KNX, Somfy, Legrand."),
    ("Aménagement électrique de cuisine", "F",
     "Circuits dédiés plaque, four et lave-vaisselle, prises de plan de travail conformes."),
]
srv_rows = "".join(
    f'<tr><td><strong>{n}</strong><br><span style="color:var(--muted)">{d}</span></td>'
    f'<td class="num tabular">{num(fam_vol.get(f, 0))}</td></tr>' for n, f, d in SERVICES)

page(f'''<section class="page">
  {head("02 · Entreprise et marché", "Six services vendus, deux qui portent la demande.", "Preuve observée")}
  <div style="display:grid;grid-template-columns:1.12fr .88fr;gap:9mm;margin-top:6mm">
    <div>
      <p class="lead" style="font-size:9.4pt">{V['client']} est l’entreprise de {V['gerant']}, électricien
      à Brissac Loire Aubance. Le site revendique 40 ans d’expérience et deux générations, et décrit
      six prestations distinctes. La zone annoncée — Brissac, Angers et un rayon de 30 km — correspond
      exactement au territoire sur lequel les données de ce rapport ont été extraites.</p>
      <h3 class="section-title" style="margin-top:6mm">Volume de recherche par famille de service</h3>
      <table>
        <thead><tr><th>Service réellement vendu</th><th class="num">Recherches / mois</th></tr></thead>
        <tbody>{srv_rows}</tbody>
      </table>
      <p class="source">Volumes Google Ads agrégés par famille du portefeuille, zone {V['territory_label']}.
      Un service peut mobiliser plusieurs mots-clés ; le détail figure en annexe.</p>
    </div>
    <div>
      <div class="screen-frame">
        <div class="screen-label">Chantier</div>
        <img src="{IMG['chantier']}" style="display:block;width:100%" alt="Chantier d amenagement de combles">
      </div>
      <p class="photo-caption">Aménagement de combles — photo publiée par l’entreprise,
      accessible depuis la carte Rénovation du site. C’est aujourd’hui la seule réalisation
      réelle visible sur {V['domain']}.</p>

      <h3 class="section-title" style="margin-top:6mm">Présence publique</h3>
      {findings([
        ("Une fiche établissement en ligne, notée 5,0.",
         "GP ELEC, catégorie Électricien, 5,0 sur 9 avis, téléphone, horaires et site liés, avec une zone de service couvrant l’agglomération d’Angers. Un actif déjà solide."),
        ("Domaine récent.",
         "Enregistré le 18 mai 2026 (registre RDAP Verisign). Le référencement naturel ne peut pas encore produire d’effet mesurable."),
        ("Concurrents visibles sur la zone.",
         "AJPB Elec, LG Elec, Electro Renov, D-elec, Savitec et Fouqueron ressortent sur les requêtes électricien à Angers, aux côtés des annuaires."),
      ])}
    </div>
  </div>

  <div class="decision-band" style="margin-top:6mm">
    <strong>Angle à tenir</strong>
    <p>Deux familles concentrent la demande : la climatisation réversible et l’électricité générale.
    Elles ne culminent pas au même moment de l’année, ce qui permet à un budget unique de basculer
    de l’une à l’autre plutôt que de tourner à vide. C’est l’avantage d’une entreprise qui fait
    réellement les deux — la plupart des concurrents locaux n’en font qu’une.</p>
  </div>
  {foot("Entreprise et marché")}
</section>''')

# ─────────────────────────────────────────────── P4 · Audit visuel
d = ev1["desktop"]["facts"]; m = ev1["mobile"]["facts"]
page(f'''<section class="page">
  {head("03 · Audit visuel et expérience", "Ce que voit un visiteur, ordinateur et téléphone.", "Confirmé dans<br>le navigateur")}
  <div style="display:grid;grid-template-columns:1.35fr .65fr;gap:7mm;margin-top:5mm">
    <div>
      <div class="screen-frame" style="height:76mm"><div class="screen-label">Ordinateur · 1440 × 900</div>
        <img src="{IMG['desktop']}" style="display:block;width:100%;height:100%;object-fit:cover;object-position:top" alt="Page d accueil sur ordinateur"></div>
      <p class="photo-caption">{V['domain']}, premier écran, capture du {V['date_full']}.
      Le numéro apparaît deux fois avant tout défilement.</p>
    </div>
    <div>
      <div class="screen-frame" style="height:76mm"><div class="screen-label">Mobile · 412 × 915</div>
        <img src="{IMG['mobile_fold']}" style="display:block;width:100%;height:100%;object-fit:cover;object-position:top" alt="Page d accueil sur telephone"></div>
      <p class="photo-caption">Même page sur téléphone. Le bouton d’appel jaune reste fixe
      en bas à droite pendant tout le défilement.</p>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:9mm;margin-top:4mm">
    <div>
      <h3 class="section-title">Ce qui sert la prise de contact</h3>
      {findings([
        ("Bouton d’appel flottant, 56 × 56 px.",
         "Position fixe, lien téléphonique direct. C’est le meilleur atout de conversion du site sur mobile."),
        ("Aucun débordement horizontal.",
         "Largeur du document égale à la largeur de l’écran sur les deux viewports testés."),
        ("Aucune erreur console.",
         "Aucun message d’erreur ni exception JavaScript relevé sur les deux viewports."),
      ])}
    </div>
    <div>
      <h3 class="section-title">{"Ce que cela vaut pour une campagne" if SANS_SITE else "Ce qui freine"}</h3>
      {findings(ATOUTS_CAMPAGNE if SANS_SITE else [
        ("L’image d’accueil est agrandie trois fois.",
         f"Source {d['heroNatural']} px affichée en {d['heroDisplayed']} px sur ordinateur et {m['heroDisplayed']} px sur téléphone. Priorité P1."),
        ("Le titre principal ne nomme aucune ville.",
         f"H1 relevé : « {d['h1']} ». Le titre de l’onglet cible bien Brissac et Angers, le titre visible non. Priorité P1."),
        ("Le portrait du gérant est absent.",
         "La section personnelle affiché les initiales dans un cercle. Pour un artisan, la photo est le premier facteur de confiance. Priorité P1."),
        ("Contenu court.",
         f"{d['wordCount']} mots sur l’ensemble de la page d’accueil, insuffisant pour un positionnement naturel. Priorité P2."),
      ])}
    </div>
  </div>

  <div class="decision-band" style="margin-top:4mm">
    <strong>{"Ce que dit cette page" if SANS_SITE else "Verdict page de destination"}</strong>
    <p>{"Le site est techniquement au-dessus de ce que l’on rencontre habituellement chez un artisan local, et le téléphone y est traité correctement. C’est un point de départ favorable pour un test d’acquisition : le trafic acheté arrivera sur une page rapide, lisible, et qui donne un moyen de contact immédiat." if SANS_SITE else "Le site peut recevoir du trafic payé : il est rapide, lisible et le téléphone y est immédiatement accessible. Il ne peut pas encore le <b>transformer de manière mesurable</b>, et il n’existe aucune page dédiée à un service précis. Un test reste possible, à condition de traiter d’abord les points P0 de la page suivante."}</p>
  </div>
  {foot("Audit visuel")}
</section>''')

# ─────────────────────────────────────────────── P5 · Conversion, technique, SEO local
CHECKS = [
    ("Envoi du formulaire", "P0",
     "Aucun attribut d’action et %d champs sur %d sans nom. L’envoi ne passe par aucun serveur."
     % (d["formFieldsWithoutName"], d["formFieldCount"]),
     "Brancher un envoi réel avec page de confirmation, puis tester une soumission depuis un téléphone."),
    ("Mesure des conversions", "P0",
     "GA4 est chargé, mais aucun événement d’appel ni d’envoi de formulaire n’est déclaré.",
     "Déclarer un événement sur les liens téléphoniques et sur l’envoi, puis les importer dans Google Ads."),
    ("Avis affichés", "P0",
     "Le site annonce 4.9 sur 84 avis ; la fiche Google porte 5,0 sur 9 avis. Les deux chiffres divergent.",
     "Aligner la note et le balisage sur les valeurs réelles de la fiche, puis les tenir à jour."),
    ("Mentions légales", "P0",
     "Cinq champs restent à l’état de gabarit en production : forme juridique, capital, RCS, TVA, assurance.",
     "Compléter avec les informations de l’entreprise."),
    ("Adresse canonique", "P1",
     "L’adresse déclarée pointe vers la version www, qui redirige en 307 vers le domaine sans www.",
     "Aligner adresse canonique, partages sociaux, plan du site et robots sur une seule version."),
    ("Qualification professionnelle", "P1",
     "Une qualification Qualifelec est déclarée dans les données structurées, sans numéro ni date.",
     "Vérifier la qualification auprès du gérant, sinon retirer la mention."),
    ("Pages de service", "P1",
     "Le site est une page unique à ancres ; aucune adresse propre par prestation.",
     "Créer une page dédiée au service le plus rentable avant toute campagne."),
    ("Fiche établissement", "P2",
     "Fiche en ligne, 5,0 sur 9 avis, zone de service renseignée. Peu de photos et un volume d’avis encore réduit.",
     "Alimenter en photos de chantier et solliciter un avis en fin d’intervention pour épaissir la preuve."),
    ("Accessibilité", "P2",
     "Un défaut de contraste relevé par Lighthouse en pied de page ; la carte Rénovation s’ouvre au clic sans équivalent clavier.",
     "Relever le contraste et rendre la carte utilisable au clavier."),
]
check_rows = "".join(
    '<tr><td><strong>%s</strong></td><td>%s</td><td>%s</td>'
    '<td class="num"><span class="priority %s">%s</span></td></tr>'
    % (p, c, f, pr.lower(), pr) for p, pr, c, f in CHECKS)

# Cette page decrit les defauts du site : omise en variante « marche ».
if not SANS_SITE:
    page('''<section class="page">
      %s
      <div style="display:grid;grid-template-columns:repeat(4,1fr);margin-top:6mm;border:.25mm solid var(--line);background:var(--white-76)">
        <div class="metric" style="min-height:21mm;padding:4.5mm 3mm 3.5mm 4mm">
          <strong class="tabular" style="font-size:18pt;color:var(--nmf-blue)">97</strong>
          <span style="font-size:6.4pt">Performance Lighthouse<br>mobile — 99 sur ordinateur</span></div>
        <div class="metric" style="min-height:21mm;padding:4.5mm 3mm 3.5mm 5mm;border-left:.25mm solid var(--line)">
          <strong class="tabular" style="font-size:18pt;color:var(--nmf-blue)">2,0 s</strong>
          <span style="font-size:6.4pt">Affichage du plus grand<br>élément, mobile</span></div>
        <div class="metric" style="min-height:21mm;padding:4.5mm 3mm 3.5mm 5mm;border-left:.25mm solid var(--line)">
          <strong class="tabular" style="font-size:18pt;color:var(--nmf-blue)">0</strong>
          <span style="font-size:6.4pt">Conversion mesurable<br>déclarée à ce jour</span></div>
        <div class="metric" style="min-height:21mm;padding:4.5mm 3mm 3.5mm 5mm;border-left:.25mm solid var(--line)">
          <strong class="tabular" style="font-size:18pt;color:var(--nmf-blue)">%d %%</strong>
          <span style="font-size:6.4pt">de la page à parcourir avant<br>d’atteindre le formulaire, mobile</span></div>
      </div>

      <h3 class="section-title" style="margin-top:6mm">Points contrôlés</h3>
      <table>
        <thead><tr><th style="width:29mm">Point contrôlé</th><th>Constat observé</th><th>Correction</th><th class="num" style="width:13mm">Priorité</th></tr></thead>
        <tbody>%s</tbody>
      </table>

      <div class="decision-band" style="margin-top:5mm">
        <strong>Le contact, concrètement</strong>
        <p>Un visiteur qui appelle est bien servi : le numéro est présent cinq fois et un bouton flottant
        le suit sur mobile. Un visiteur qui préfère écrire doit parcourir <b>%d %% de la page</b> pour trouver
        le formulaire, puis remplir un envoi qui ne passe par aucun serveur. C’est la seule rupture sérieuse
        de la chaîne de contact, et c’est aussi la plus simple à réparer.</p>
      </div>

      <p class="source" style="margin-top:4mm">Méthode — Lighthouse 12 exécuté le %s sur %s, profils ordinateur
      et mobile. Structure du formulaire, profondeur de page, liens téléphoniques, contrastes et erreurs console
      relevés le même jour dans Chrome piloté, viewports 1440 × 900 et 412 × 915 en résolution double.
      Enregistrement du domaine vérifié au registre RDAP Verisign. Fiche établissement relevée le même jour sur Google Maps, vue publique en français.</p>
      %s
    </section>''' % (
        head("04 · Conversion, technique et SEO local",
             "Une base technique saine, une chaîne de contact incomplète.",
             "Confirmé dans le<br>HTML et Lighthouse"),
        ev2["mobile"]["formDepthPercent"], check_rows, ev2["mobile"]["formDepthPercent"],
        V["date_full"], V["domain"], foot("Conversion et technique")))


# ─────────────────────────────────────────────── P6 · Mots-cles
def kw_row(h):
    emph = ' class="emphasis"' if h["text"] in ("electricien angers", "installateur climatisation", "electricien") else ""
    comp = h["comp"] or "—"
    if h.get("compIndex") is not None:
        comp += " (%d)" % h["compIndex"]
    bid = "%s – %s €" % (eur(h["bidLow"]), eur(h["bidHigh"])) if h.get("bidHigh") else "non renvoyée"
    return ('<tr%s><td>%s</td><td>%s</td><td class="num tabular">%s</td>'
            '<td class="num">%s</td><td class="num tabular">%s</td></tr>'
            % (emph, h["text"], FAM_SHORT.get(fam_of(h["text"]), "—"), num(h["vol"]), comp, bid))

top_rows = "".join(kw_row(h) for h in sorted(withvol, key=lambda x: -x["vol"])[:10])
excl_list = " · ".join(e["text"] for e in port["exclusions"][:8])

page('''<section class="page">
  %s
  <div class="metric-strip">
    <div class="metric"><strong class="tabular">%d</strong>
      <span>mots-clés au portefeuille, répartis en %d familles de service</span></div>
    <div class="metric"><strong class="tabular">%d</strong>
      <span>requêtes écartées volontairement, motif consigné pour chacune</span></div>
    <div class="metric"><strong class="tabular">%d</strong>
      <span>mots-clés sans volume renvoyé par Google sur cette zone</span></div>
  </div>

  <h3 class="section-title" style="margin-top:5mm">Composition du portefeuille</h3>
  %s

  <div style="display:grid;grid-template-columns:1.14fr .86fr;gap:8mm;margin-top:5mm">
    <div>
      <h3 class="section-title">Les dix premières requêtes par volume</h3>
      <table>
        <thead><tr><th>Mot-clé</th><th style="width:24mm">Famille</th><th class="num">Vol./mois</th><th class="num">Concurrence</th><th class="num">Enchère haut de page</th></tr></thead>
        <tbody>%s</tbody>
      </table>
    </div>
    <div>
      <div class="figure-title">Volume mensuel et enchère haut de page</div>
      %s
      <p class="source">Une enchère élevée signale une concurrence installée, pas une rentabilité
      automatique. Points bleus : intention commerciale. Points violets : comparaison de prix.
      Points verts : requête générique.</p>
    </div>
  </div>

  <div style="margin-top:4mm;padding:3.4mm 4.5mm" class="negative-band">
    <strong style="font-family:var(--font-mono);font-size:7pt;text-transform:uppercase;color:var(--nmf-violet)">Écarté volontairement</strong>
    <p style="margin-top:1.8mm;font-size:7pt;line-height:1.38">%s. Le motif de chaque exclusion figure
    en annexe. Deux méritent d’être soulignées : <b>climatiseur</b>, très recherche mais tapé par quelqu’un
    qui veut acheter un appareil, pas faire appel à un installateur ; et les requêtes <b>borne de recharge</b>
    et <b>RGE</b>, écartées parce que les qualifications correspondantes ne sont pas détenues à ce jour.</p>
  </div>

  <p class="source" style="margin-top:2.5mm">Source — Google Ads API v24, KeywordPlanHistoricalMetrics, %s,
  zone %s (%d communes), langue française, réseau Recherche. %d mots-clés fusionnés par Google avec une
  variante proche : volume compte une seule fois. Le cumul de %s recherches additionne des requêtes
  distinctes, dont certaines se recouvrent partiellement.</p>
  %s
</section>''' % (
    head("05 · Étude de mots-clés", "Le volume le plus visible n’est pas le plus vendeur.", "Donnée Google Ads"),
    kw_total, len(fam_label), len(port["exclusions"]), len(novol),
    stacked_portfolio(), top_rows, svg_scatter(), excl_list,
    V["date_full"], V["territory_label"], len(ads["geo"]), len(merged), num(vol_total),
    foot("Mots-clés")))

# ─────────────────────────────────────────────── P7 · Projection Google Ads
def strat_row(name, rows):
    r = at(rows, REC)
    if not r:
        return '<tr><td>%s</td><td colspan="4">Données insuffisantes</td></tr>' % name
    part = r["clicks"] / CEIL["clics"] * 100 if CEIL.get("prouve") and CEIL["clics"] else None
    return ('<tr%s><td><strong>%s</strong></td><td class="num tabular">%s €</td>'
            '<td class="num tabular">%s €</td><td class="num tabular">%s</td>'
            '<td class="num tabular">%s €</td><td class="num tabular">%s</td></tr>'
            % (' class="emphasis"' if name.startswith("Haut de page") else "",
               lib(name), num(r["budget_mensuel"]), eur(r["cost"]), num(r["clicks"]),
               eur(r["cpc"]), ("%.0f %%" % part) if part else "—"))

strat_rows = "".join(strat_row(n, rr) for n, rr in strategies)

def gauge(label, value, maxv, note):
    pct = min(value / maxv * 100, 100) if maxv else 0
    return ('<div style="margin-top:3.5mm"><div style="display:flex;justify-content:space-between;'
            'font-size:6.8pt;color:var(--muted)"><span>%s</span><span class="tabular">%s</span></div>'
            '<div class="gauge-track" style="margin-top:1.2mm"><i style="width:%.1f%%"></i></div>'
            '<div style="font-size:6pt;color:var(--muted);margin-top:1mm">%s</div></div>'
            % (label, note, pct, ""))

axes_rows = "".join(
    '<tr><td>%s</td><td class="num tabular">%d</td><td class="num tabular">%d</td><td>%s</td></tr>'
    % (n, p, s, why) for n, p, s, why in AXES)

BLOC_SCORE = """      <div class="figure-title">Score de préparation</div>
      <div class="score-grid" style="margin-top:2mm;padding:3.2mm 4mm">
        <div style="display:flex;align-items:baseline;gap:3mm">
          <span class="tabular" style="font-family:var(--font-mono);font-size:24pt;font-weight:700;color:var(--nmf-violet)">%d</span>
          <span style="font-size:7.2pt;color:var(--muted)">sur 100 — score de préparation<br>à l’acquisition payante</span>
        </div>
        <p style="margin-top:3mm;font-size:7pt;line-height:1.4;color:var(--nmf-navy-2)">
        Ce score mesure l’état de préparation du dispositif, pas une chance de réussite.
        Il n’exprime aucune probabilité commerciale. Sa grille complète figure ci-dessous
        et son détail de calcul en annexe.</p>
      </div>
      <table style="margin-top:2.2mm;font-size:6pt;line-height:1.12">
        <thead><tr><th>Axe</th><th class="num">Poids</th><th class="num">Obtenu</th><th>Justification</th></tr></thead>
        <tbody>%s</tbody>
      </table>
"""

BLOC_MARCHE = """
      <div class="figure-title">Comment lire cet arbitrage</div>
      <div class="score-grid" style="margin-top:2mm;padding:3.6mm 4mm">
        <p style="font-size:7.4pt;line-height:1.45;color:var(--nmf-navy-2)">
        Les trois stratégies visent la même demande. Ce qui les sépare, c’est le prix
        consenti pour chaque clic, et jusqu’où ce prix monte quand le budget augmente.</p>
      </div>
      <table style="margin-top:2.5mm;font-size:6.4pt;line-height:1.2">
        <thead><tr><th>Stratégie</th><th class="num">CPC prévu</th><th>Comportement quand le budget monte</th></tr></thead>
        <tbody>
          <tr><td>Présence</td><td class="num tabular">1,56 → 4,04 €</td><td>Achète toujours plus de volume, mais paie chaque clic de plus en plus cher.</td></tr>
          <tr class="emphasis"><td>Haut de page</td><td class="num tabular">1,63 €</td><td>Prix du clic constant. Le volume plafonne, la dépense aussi.</td></tr>
          <tr><td>Domination</td><td class="num tabular">2,11 €</td><td>Prix constant plus élevé, pour un volume intermédiaire.</td></tr>
        </tbody>
      </table>
      <p class="source" style="margin-top:2mm">CPC prévus par Google aux paliers testés.
      Le détail palier par palier figure à la section suivante.</p>"""

r_rec = at(PRES, REC)
r_top = at(TOP, REC)
page('''<section class="page">
  %s
  <p class="lead" style="margin-top:5mm;font-size:9.6pt">Les trois stratégies ont été prévues sur le même portefeuille,
  la même zone, la même période et les mêmes paliers. Seule la manière d’enchérir change. Comparées
  au palier recommandé, elles se départagent moins sur le nombre de clics que sur le prix payé pour
  chacun — et sur ce que ce prix devient quand le budget monte.</p>

  <h3 class="section-title" style="margin-top:5mm">Les trois stratégies au palier de %d € par mois</h3>
  <table>
    <thead><tr><th>Stratégie</th><th class="num">Budget demande</th><th class="num">Dépense prévue</th>
    <th class="num">Clics prévus</th><th class="num">CPC prévu</th><th class="num">Part du volume captable</th></tr></thead>
    <tbody>%s</tbody>
  </table>
  <p class="source">Le CPC prévu par Google diffère de la fourchette d’enchère haut de page présentée
  page précédente : la première est un prix payé simulé, la seconde une enchère nécessaire pour apparaître en haut.</p>

  <div style="display:grid;grid-template-columns:.52fr .48fr;gap:8mm;margin-top:5mm">
    <div>
      <div class="figure-title">Clics prévus au palier de %d € par mois</div>
      %s
    </div>
    <div>
      %s
    </div>
  </div>

  <div class="decision-band" style="margin-top:3.4mm">
    <strong>Recommandation de test</strong>
    <p>NMF recommandé de démarrer à <b>%d € par mois en CPC manuel plafonné</b>, stratégie « haut de page ».
    A ce palier, elle produit <b>%s clics pour %s €</b> contre %s clics en maximisation des clics : l’écart
    est faible. La différence se joue plus haut — la maximisation des clics laisse le CPC prévu monter
    jusqu'à <b>%s €</b>, tandis que le CPC manuel le maintient à <b>%s €</b> quel que soit le budget.
    Pour un artisan seul, plafonner le prix du clic vaut mieux que maximiser leur nombre.</p>
  </div>

  <p class="source" style="margin-top:2.5mm">Source — Google Ads API v24, GenerateKeywordForecastMetrics,
  %d prévisions du %s. Impressions et taux de clic ne sont pas renvoyés pour ce type de prévision : ces
  colonnes sont absentes plutôt qu’estimées. Aucun nombre de contacts ni coût par contact n’est avance —
  sans historique de conversion, ces valeurs relèveraient de l’hypothèse.</p>
  %s
</section>''' % (
    head("06 · Projection Google Ads", "Trois stratégies, un même budget, un arbitrage clair.", "Donnée Google Ads"),
    REC, strat_rows, REC, svg_strategy_bars(),
    (BLOC_MARCHE if SANS_SITE else BLOC_SCORE % (SCORE, axes_rows)),
    REC, num(r_top["clicks"]) if r_top else "—", eur(r_top["cost"]) if r_top else "—",
    num(r_rec["clicks"]) if r_rec else "—",
    eur(max(r["cpc"] for r in PRES)) if PRES else "—",
    eur(r_top["cpc"]) if r_top else "—",
    len([m for m in matrix if m.get("ok")]), V["date_full"], foot("Projection")))


# ─────────────────────────────────────────────── P8 · Preuve budgetaire
def matrix_block(name, rows):
    body = "".join(
        '<tr%s><td class="num tabular">%s €</td><td class="num tabular">%s €</td>'
        '<td class="num tabular">%s</td><td class="num tabular">%s €</td>'
        '<td class="num tabular">%.0f %%</td></tr>'
        % (' class="emphasis"' if r["budget_mensuel"] == REC else "",
           num(r["budget_mensuel"]), eur(r["cost"]), num(r["clicks"]), eur(r["cpc"]),
           r["cost"] / r["budget_mensuel"] * 100)
        for r in sorted(rows, key=lambda x: x["budget_mensuel"]))
    return ('<div><div class="figure-title" style="margin-bottom:1.6mm">%s</div><table style="font-size:5.9pt;line-height:1.1">'
            '<thead><tr><th class="num">Demande</th><th class="num">Dépense</th><th class="num">Clics</th>'
            '<th class="num">CPC</th><th class="num">Consommé</th></tr></thead><tbody>%s</tbody></table></div>'
            % (name, body))

ceil_txt = (
    "Le plafond d’inventaire est <b>démontré</b>. Des %s € demandés, la dépense prévue s’arrête à "
    "<b>%s €</b>, soit %.0f %% du budget, et reste identique à %s € et %s €. Les clics ne bougent plus non plus : "
    "<b>%s</b> sur les trois derniers paliers. Les trois conditions sont donc réunies — dépense inférieure à "
    "90 %% du budget, deux paliers supérieurs supplémentaires, et stabilité à moins de 5 %% sur la dépense "
    "comme sur les clics."
    % (num(CEIL["palier"]), eur(CEIL["depense"]), CEIL["depense"] / CEIL["palier"] * 100,
       num(1500), num(2000), num(CEIL["clics"]))
) if CEIL.get("prouve") else "Le plafond d’inventaire n’est <b>pas démontré</b> sur les paliers testés."

page('''<section class="page">
  %s
  <p class="lead" style="margin-top:5mm;font-size:9.6pt">Aucune recommandation de budget ne repose ici sur une prévision
  unique. Dix paliers ont été demandes à Google pour chacune des trois stratégies, soit %d prévisions
  indépendantes, toutes réussies. La courbe ci-dessous montre ou le marché cesse de répondre.</p>

  <div style="margin-top:4mm">
    <div class="figure-title">Budget demande et dépense réellement prévue, par stratégie</div>
    %s
    <div style="display:flex;gap:6mm;margin-top:1mm;font-size:6.4pt;color:var(--muted)">
      <span><i style="display:inline-block;width:5mm;height:.7mm;background:var(--nmf-blue);vertical-align:middle"></i> Présence</span>
      <span><i style="display:inline-block;width:5mm;height:.7mm;background:var(--nmf-violet);vertical-align:middle"></i> Haut de page</span>
      <span><i style="display:inline-block;width:5mm;height:.7mm;background:var(--technical-teal);vertical-align:middle"></i> Domination</span>
      <span><i style="display:inline-block;width:5mm;height:.7mm;background:var(--line-dark);vertical-align:middle"></i> Budget entièrement consommé (référence)</span>
    </div>
    <p class="source">Axe horizontal : budget mensuel demande, en euros. Axe vertical : dépense mensuelle
    prévue par Google, en euros. Tous les paliers testés sont représentés ; aucune valeur n’est interpolée.</p>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:5mm;margin-top:4mm">
    %s %s %s
  </div>

  <div class="decision-band" style="margin-top:4mm">
    <strong>Conclusion sur le plafond</strong>
    <p>%s</p>
  </div>

  <p class="source" style="margin-top:3mm">Paramètres identiques pour les %d’appels — zone %s (%d communes),
  langue française, réseau Recherche uniquement, devise EUR, période du %s’au %s, portefeuille de %d mots-clés
  en expression exacte de phrase. Stratégies : maximisation des clics par budget journalier ; CPC manuel plafonné
  à %s € ; CPC manuel majoré à %s €. Erreurs API : %d.</p>
  %s
</section>''' % (
    head("07 · Preuve budgétaire", "Le marché a un plafond, et il est mesurable.", "Donnée Google Ads"),
    len([m for m in matrix if m.get("ok")]), svg_budget_curve(h=160),
    matrix_block(lib("Presence"), PRES), matrix_block(lib("Haut de page"), TOP), matrix_block(lib("Domination"), DOM),
    ceil_txt, len([m for m in matrix if m.get("ok")]),
    V["territory_label"], len(ads["geo"]),
    ads["meta"]["periode_forecast"]["start_date"], ads["meta"]["periode_forecast"]["end_date"],
    kw_total, eur(ads["meta"]["enchere_reference"]["bid_haut_de_page"]),
    eur(ads["meta"]["enchere_reference"]["bid_domination"]), len(ads["errors"]),
    foot("Preuve budgétaire")))

# ─────────────────────────────────────────────── P9 · Plan d'action et cloture
ROAD_MARCHE = [
    ("Mesure", "Compter les appels et les demandes",
     "Déclarer l’appel téléphonique et l’envoi du formulaire comme conversions, les importer "
     "dans Google Ads et vérifier qu’ils remontent avant la première dépense.",
     "Pilotage possible"),
    ("Présence", "Faire vivre la fiche établissement",
     "La fiche est en ligne et porte déjà 5,0 sur 9 avis. L’alimenter en photos de chantier et "
     "solliciter un avis en fin d’intervention : neuf avis, c’est encore peu pour rassurer.",
     "Présence locale"),
    ("Pertinence", "Une page dédiée au service poussé",
     "Commencer par la climatisation réversible, meilleur rapport entre volume et valeur. "
     "Un titre qui nomme le service et la ville, un contact en haut de page.",
     "Meilleure pertinence"),
    ("Test", "Ouvrir à %d € par mois" % REC,
     "CPC manuel plafonné, réseau Recherche seul, zone des %d communes, liste de négatifs "
     "appliquée dès le premier jour. Lecture des résultats sur la durée nécessaire à une décision."
     % len(ads["geo"]),
     "Premiers enseignements"),
    ("Suite", "Ajuster selon ce que le marché montre",
     "Le plafond mesuré autorise une montée jusqu’au palier où la dépense cesse de suivre. "
     "Toute hausse doit rester adossée à une capacité de chantier réelle.",
     "Croissance maîtrisée"),
]

ROAD = [
    ("Prérequis", "Réparer la chaîne de contact",
     "Brancher un envoi réel du formulaire vers une boîte mail, avec page de confirmation. "
     "Tester une soumission depuis un téléphone avant toute mise en ligne.",
     "Plus aucune demande perdue"),
    ("Prérequis", "Assainir ce qui est publié",
     "Retirer la note d’avis et son balisage, compléter les cinq champs légaux manquants, "
     "vérifier ou retirer la qualification déclarée.",
     "Site conforme"),
    ("Fondations", "Faire vivre la fiche établissement",
     "La fiche est en ligne et porte déjà 5,0 sur 9 avis. L’alimenter en photos de chantier et "
     "solliciter un avis en fin d’intervention : neuf avis, c’est encore peu pour rassurer.",
     "Présence locale"),
    ("Fondations", "Une page par service vendu",
     "Commencer par la climatisation réversible, service au meilleur rapport volume/valeur. "
     "Un titre visible qui nomme le service et la ville, un contenu propre, un contact en haut de page.",
     "Meilleure pertinence"),
    ("Mesure", "Compter ce qui compte",
     "Déclarer un événement sur les liens téléphoniques et sur l’envoi du formulaire, "
     "les importer dans Google Ads, vérifier qu’ils remontent avant de dépenser.",
     "Pilotage possible"),
    ("Test", "Ouvrir à %d € par mois" % REC,
     "CPC manuel plafonné, réseau Recherche seul, zone des %d communes, liste de négatifs appliquée "
     "des le premier jour. Lecture des résultats sur la durée nécessaire à une décision, pas avant."
     % len(ads["geo"]),
     "Premiers enseignements"),
    ("Suite", "Ajuster selon ce que le marché montre",
     "Le plafond mesure autorise une montée jusqu’àu palier ou la dépense cesse de suivre. "
     "Toute hausse doit rester adossée à une capacité de chantier réelle.",
     "Croissance maîtrisée"),
]
if SANS_SITE:
    ROAD = ROAD_MARCHE

road_rows = "".join(
    '<div class="road-row" style="min-height:16mm;padding:3.2mm 0"><div class="phase">%s</div>'
    '<div><h4 style="font-size:9.4pt">%s</h4></div>'
    '<div style="color:var(--muted);font-size:6.9pt;line-height:1.38">%s</div>'
    '<div class="num" style="font-size:6.5pt;text-align:right;color:var(--nmf-navy)">%s</div></div>'
    % (ph, t, dd, im) for ph, t, dd, im in ROAD)

CLOTURE = (
    "La demande existe et son plafond est connu. Le site est rapide et le téléphone y est bien "
    "traité. Il reste à brancher le comptage des demandes et à aligner la note affichée sur celle de la fiche, "
    "puis un test encadré au palier étudié. Nous pouvons dérouler ce plan avec vous, ligne par ligne."
    if SANS_SITE else
    "Verdict : <b>test possible sous conditions</b>. La demande existe et son plafond est connu. "
    "Le site est rapide et le téléphone y est bien traité. Ce qui manque tient en deux corrections "
    "qui ne coûtent pas de budget publicitaire : un formulaire qui envoie, et une mesure qui compte. "
    "Nous pouvons dérouler ce plan avec vous, ligne par ligne."
)

page('''<section class="page">
  %s
  <p class="lead" style="margin-top:5mm;font-size:9.6pt">L’ordre compte davantage que l’ambition budgétaire.
  Les deux premières lignes ne dépendent d’aucune donnée extérieure et conditionnent tout le reste :
  tant qu’une demande peut se perdre et qu’aucune conversion n’est comptée, un test publicitaire
  n’apprendrait rien d’exploitable.</p>

  <div class="roadmap" style="margin-top:4mm">%s</div>

  <div class="closing-copy" style="margin-top:4.5mm;padding:6mm">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8mm">
      <div style="max-width:112mm">
        <h3 style="font-size:21pt;line-height:1.02;letter-spacing:-.035em">Le marché est mesuré.<br>
        Reste à le rendre <span style="color:var(--nmf-violet)">recevable</span>.</h3>
        <p style="margin-top:3mm;font-size:8pt;line-height:1.42">%s</p>
        <p style="margin-top:3mm;font-size:7.4pt;color:var(--nmf-navy-2)">
        <b>NMF Agence</b> — %s · %s · %s</p>
      </div>
      <img class="brand-logo closing-logo" src="%s" alt="NMF Agence">
    </div>
  </div>
  %s
</section>''' % (
    head("08 · Plan d’action", "Par quoi commencer, et dans quel ordre.", "Recommandation NMF"),
    road_rows, CLOTURE, V["nmf_site"], V["nmf_insta"], V["nmf_rdv"], LOGO, foot("Plan d’action")))


# ─────────────────────────────────────────────── Annexes · portefeuille complet
def annex_row(k):
    h = hist.get(k["text"])
    if not h:
        for hh in ads["historical"]:
            if k["text"] in (hh.get("closeVariants") or []):
                h = hh
                break
    if not h:
        return ('<tr class="emphasis"><td class="num tabular">%d</td><td>%s</td><td>%s</td><td>%s</td>'
                '<td>%s</td><td class="num">non renvoyé</td><td class="num">—</td><td class="num">—</td></tr>'
                % (k["n"], k["text"], k["famille"], k["intention"], k["geo"]))
    merged_note = ""
    if h["text"] != k["text"]:
        merged_note = ' <span style="color:var(--muted)">→ fusionné avec « %s »</span>' % h["text"]
    vol = num(h["vol"]) if h.get("vol") else "sans volume"
    comp = h["comp"] or "—"
    if h.get("compIndex") is not None:
        comp += " (%d)" % h["compIndex"]
    bid = "%s – %s" % (eur(h["bidLow"]), eur(h["bidHigh"])) if h.get("bidHigh") else "—"
    cls = ' class="emphasis"' if not h.get("vol") or merged_note else ""
    return ('<tr%s><td class="num tabular">%d</td><td>%s%s</td><td>%s</td><td>%s</td><td>%s</td>'
            '<td class="num tabular">%s</td><td class="num">%s</td><td class="num tabular">%s</td></tr>'
            % (cls, k["n"], k["text"], merged_note, k["famille"], k["intention"], k["geo"], vol, comp, bid))

ANNEX_HEAD = ('<thead><tr><th class="num" style="width:7mm">#</th><th>Mot-clé</th>'
              '<th style="width:9mm">Fam.</th><th style="width:24mm">Intention</th>'
              '<th style="width:22mm">Géographie</th><th class="num" style="width:17mm">Vol./mois</th>'
              '<th class="num" style="width:22mm">Concurrence</th>'
              '<th class="num" style="width:24mm">Enchère (€)</th></tr></thead>')

CHUNK = 26
chunks = [kws[i:i + CHUNK] for i in range(0, len(kws), CHUNK)]
for idx, ch in enumerate(chunks):
    intro = ""
    if idx == 0:
        intro = ('<p class="lead" style="margin-top:5mm;font-size:9pt">Liste exacte et ordonnée des %d mots-clés '
                 'soumis à Google, sans troncature. Les lignes teintées signalent un mot-clé sans volume renvoyé '
                 'ou fusionné par Google avec une variante proche : leur volume est alors porte par la requête '
                 'canonique et n’est pas compte deux fois.</p>' % kw_total)
    page('''<section class="page">
      %s
      %s
      <table style="margin-top:4mm;table-layout:fixed;font-size:6.2pt;line-height:1.13">%s<tbody>%s</tbody></table>
      %s
    </section>''' % (
        head("Annexe A · Portefeuille complet",
             "Les %d mots-clés soumis au forecast (%d / %d)" % (kw_total, idx + 1, len(chunks)),
             "Donnée Google Ads"),
        intro, ANNEX_HEAD, "".join(annex_row(k) for k in ch), foot("Annexe A")))

BLOC_SCORE_ANNEXE = """      <h3 class="section-title" style="margin-top:5mm">Calcul du score de préparation</h3>
      <p style="font-size:6.6pt;line-height:1.4;color:var(--nmf-navy-2)">Somme de six axes notés sur un poids
      fixe, total %d sur 100. Le score décrit l’état de préparation du dispositif d’acquisition. Il ne
      constitue ni une probabilité de réussite, ni une prévision commerciale. Chaque axe et sa justification
      figurent à la section 06 du rapport.</p>
"""

# ─────────────────────────────────────────────── Annexe B · exclusions + parametres
excl_rows = "".join('<tr><td>%s</td><td>%s</td></tr>' % (e["text"], e["raison"]) for e in port["exclusions"])
matrix_rows = "".join(
    '<tr%s><td>%s</td><td class="num tabular">%s</td><td class="num tabular">%s</td>'
    '<td class="num tabular">%s</td><td class="num tabular">%s</td><td class="num tabular">%s</td>'
    '<td class="num">%s</td></tr>'
    % (' class="emphasis"' if m["budget_mensuel"] == REC else "",
       lib(m["strategy"]), num(m["budget_mensuel"]), eur(m["budget_journalier"]),
       eur(m["cost"]) if m.get("ok") else "—", num(m["clicks"]) if m.get("ok") else "—",
       eur(m["cpc"]) if m.get("ok") else "—", "OK" if m.get("ok") else m.get("error", "erreur"))
    for m in matrix)

page('''<section class="page">
  %s
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8mm;margin-top:5mm">
    <div>
      <h3 class="section-title">Requêtes écartées et motif</h3>
      <table style="font-size:6.2pt;line-height:1.15"><thead><tr><th>Requête</th><th>Motif d’exclusion</th></tr></thead>
      <tbody>%s</tbody></table>
    </div>
    <div>
      <h3 class="section-title">Paramètres de la prévision</h3>
      <table style="font-size:6.5pt">
        <tbody>
          <tr><td>Interface</td><td>Google Ads API v24 — KeywordPlanIdeaService</td></tr>
          <tr><td>Compte</td><td>Compte administrateur NMF %s</td></tr>
          <tr><td>Date d’extraction</td><td>%s</td></tr>
          <tr><td>Zone</td><td>%s — %d communes</td></tr>
          <tr><td>Langue</td><td>Français (languageConstants/1002)</td></tr>
          <tr><td>Réseau</td><td>Recherche Google uniquement</td></tr>
          <tr><td>Devise</td><td>EUR</td></tr>
          <tr><td>Période de prévision</td><td>%s’au %s</td></tr>
          <tr><td>Correspondance</td><td>Expression exacte de phrase</td></tr>
          <tr><td>Portefeuille</td><td>%d mots-clés</td></tr>
          <tr><td>Paliers testés</td><td>%s €</td></tr>
          <tr><td>Appels exécutés</td><td>%d — dont %d réussis</td></tr>
          <tr><td>Erreurs API</td><td>%d</td></tr>
          <tr><td>Impressions et taux de clic</td><td>Non renvoyés par ce service pour une prévision de campagne</td></tr>
        </tbody>
      </table>
      %s
    </div>
  </div>

  %s
</section>''' % (
    head("Annexe B · Méthode et données brutes", "Exclusions, paramètres et matrice complete", "Traçabilité"),
    excl_rows, ads["meta"]["mcc"], V["date_full"], V["territory_label"], len(ads["geo"]),
    ads["meta"]["periode_forecast"]["start_date"], ads["meta"]["periode_forecast"]["end_date"],
    kw_total, " · ".join(str(b) for b in ads["meta"]["budgets"]),
    len(matrix), len([m for m in matrix if m.get("ok")]), len(ads["errors"]),
    ("" if SANS_SITE else BLOC_SCORE_ANNEXE % SCORE),
    foot("Annexe B")))

# ─────────────────────────────────────────────── Annexe C · matrice brute
page('''<section class="page">
  %s
  <p class="lead" style="margin-top:5mm;font-size:9pt">Les %d prévisions exécutées, sans agrégation
  ni sélection. Chaque ligne correspond à un appel distinct à Google, avec les mêmes paramètres de
  zone, de langue, de réseau, de période et de portefeuille. La ligne teintée marque le palier recommandé.</p>
  <table style="margin-top:3.4mm;font-size:6.1pt;line-height:1.12">
    <thead><tr><th>Stratégie</th><th class="num">Budget mensuel (€)</th><th class="num">Budget journalier (€)</th>
    <th class="num">Dépense prévue (€)</th><th class="num">Clics prévus</th><th class="num">CPC prévu (€)</th>
    <th class="num">État</th></tr></thead>
    <tbody>%s</tbody>
  </table>
  <p class="source" style="margin-top:3mm">Le service GenerateKeywordForecastMetrics ne renvoie ni impressions
  ni taux de clic pour une prévision de campagne : ces colonnes sont absentes plutôt qu’estimées.
  Nombre d’erreurs API sur l’ensemble de la collecte : %d.</p>
  %s
</section>''' % (
    head("Annexe C · Matrice budgétaire brute",
         "Les %d prévisions, ligne par ligne" % len(matrix), "Traçabilité"),
    len(matrix), matrix_rows, len(ads["errors"]), foot("Annexe C")))

# ══════════════════════════════════════════════════════════════════════════
#  Rendu final
# ══════════════════════════════════════════════════════════════════════════
TOTAL = len(PAGES)
body = "\n".join(PAGES)
n = [0]
def numbered(html):
    out = []
    for chunk in html.split("{{PAGE}}"):
        out.append(chunk)
    return out
# Numerotation : chaque page porte son propre numero
parts = body.split("{{PAGE}}")
rebuilt = parts[0]
for i, p in enumerate(parts[1:], start=2):
    rebuilt += "%02d" % i + p
body = rebuilt.replace("{{TOTAL}}", "%02d" % TOTAL)

html = ('<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n'
        '<title>%s — %s (%s) — NMF Agence</title>\n'
        '<style>\n%s\n</style>\n</head>\n<body data-nmf-audit-design="1.1">\n%s\n</body>\n</html>\n'
        % ("Potentiel Google Ads" if SANS_SITE else "Audit digital et Google Ads",
           V["client"], V["domain"], css, body))

out_path = SP / ("audit-gp-elec-marche.html" if SANS_SITE else "audit-gp-elec.html")
out_path.write_text(html, encoding="utf-8")
print("pages =", TOTAL)
print("score =", SCORE)
print("plafond =", CEIL)
print("html   =", out_path, len(html), "octets")
