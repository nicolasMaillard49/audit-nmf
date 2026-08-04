from pathlib import Path

from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Image, KeepTogether, HRFlowable
)
from reportlab.lib.utils import ImageReader


ROOT = Path(__file__).parent
ASSETS = ROOT / "assets/rhpatrimoine"
TMP = ROOT / "tmp/pdfs/assets-v2"
OUT = ROOT / "output/pdf/audit-rh-patrimoine-nmf.pdf"
TMP.mkdir(parents=True, exist_ok=True)
OUT.parent.mkdir(parents=True, exist_ok=True)

NAVY = HexColor("#111827")
NAVY_2 = HexColor("#1E293B")
PURPLE = HexColor("#7B4FE0")
LILAC = HexColor("#EEE9FF")
GOLD = HexColor("#C8A36A")
PAPER = HexColor("#F7F7F4")
WHITE = colors.white
INK = HexColor("#172033")
MUTED = HexColor("#667085")
LINE = HexColor("#D9DEE7")
GREEN = HexColor("#15856F")
ORANGE = HexColor("#C77818")
RED = HexColor("#C84B4B")


def crop(src: str, out: str, ratio: float):
    im = PILImage.open(ASSETS / src).convert("RGB")
    w, h = im.size
    current = w / h
    if current > ratio:
        nw = int(h * ratio)
        left = (w - nw) // 2
        im = im.crop((left, 0, left + nw, h))
    else:
        nh = int(w / ratio)
        top = (h - nh) // 2
        im = im.crop((0, top, w, top + nh))
    im.save(TMP / out, quality=92)
    return TMP / out


hero = crop("bordeaux.webp", "hero.jpg", 210/297)
talence = crop("talence.webp", "talence.jpg", 3.2)
vente = crop("vente.webp", "vente.jpg", 3.2)
gestion = crop("gestion.webp", "gestion.jpg", 3.2)
equipe = crop("equipe.webp", "equipe.jpg", 3.2)


S = {}
S["kicker"] = ParagraphStyle("kicker", fontName="Helvetica-Bold", fontSize=8,
    leading=10, textColor=PURPLE, spaceAfter=5, tracking=1.2)
S["h1"] = ParagraphStyle("h1", fontName="Helvetica-Bold", fontSize=23,
    leading=26, textColor=NAVY, spaceAfter=10)
S["h2"] = ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=12,
    leading=15, textColor=NAVY, spaceBefore=5, spaceAfter=5)
S["body"] = ParagraphStyle("body", fontName="Helvetica", fontSize=8.5,
    leading=12, textColor=INK, spaceAfter=5)
S["small"] = ParagraphStyle("small", fontName="Helvetica", fontSize=6.7,
    leading=9, textColor=MUTED)
S["cardtitle"] = ParagraphStyle("cardtitle", fontName="Helvetica-Bold", fontSize=9,
    leading=11, textColor=NAVY, spaceAfter=3)
S["cardbody"] = ParagraphStyle("cardbody", fontName="Helvetica", fontSize=7.2,
    leading=9.5, textColor=MUTED)
S["metric"] = ParagraphStyle("metric", fontName="Helvetica-Bold", fontSize=24,
    leading=27, textColor=NAVY, alignment=TA_CENTER)
S["metriclabel"] = ParagraphStyle("metriclabel", fontName="Helvetica-Bold", fontSize=6.4,
    leading=8, textColor=MUTED, alignment=TA_CENTER, tracking=.5)
S["th"] = ParagraphStyle("th", fontName="Helvetica-Bold", fontSize=6.2,
    leading=7.5, textColor=WHITE)
S["td"] = ParagraphStyle("td", fontName="Helvetica", fontSize=6.1,
    leading=7.4, textColor=INK)
S["tds"] = ParagraphStyle("tds", fontName="Helvetica", fontSize=5.5,
    leading=6.7, textColor=INK)
S["whitebig"] = ParagraphStyle("whitebig", fontName="Helvetica-Bold", fontSize=27,
    leading=30, textColor=WHITE)


def P(text, style="body"):
    return Paragraph(text, S[style])


def title(no, kicker, title):
    return [P(f"{no}  /  {kicker.upper()}", "kicker"), P(title, "h1"),
            HRFlowable(width="100%", thickness=.7, color=LINE, spaceAfter=8)]


def strip(path, caption):
    img = Image(str(path), width=167*mm, height=52*mm)
    cap = Table([[P(caption, "small")]], colWidths=[167*mm])
    cap.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,-1), NAVY),
                             ("LEFTPADDING", (0,0), (-1,-1), 8),
                             ("RIGHTPADDING", (0,0), (-1,-1), 8),
                             ("TOPPADDING", (0,0), (-1,-1), 4),
                             ("BOTTOMPADDING", (0,0), (-1,-1), 4),
                             ("TEXTCOLOR", (0,0), (-1,-1), WHITE)]))
    return KeepTogether([img, cap])


def card(label, body, color=PURPLE, width=52*mm):
    t = Table([[P(label, "cardtitle")], [P(body, "cardbody")]], colWidths=[width])
    t.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,-1), WHITE),
                           ("LINEABOVE", (0,0), (-1,0), 3, color),
                           ("BOX", (0,0), (-1,-1), .5, LINE),
                           ("LEFTPADDING", (0,0), (-1,-1), 7),
                           ("RIGHTPADDING", (0,0), (-1,-1), 7),
                           ("TOPPADDING", (0,0), (-1,0), 8),
                           ("BOTTOMPADDING", (0,-1), (-1,-1), 8)]))
    return t


def note(label, body, accent=PURPLE):
    t = Table([[P(label.upper(), "kicker"), P(body, "body")]], colWidths=[31*mm, 136*mm])
    t.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,-1), LILAC),
                           ("LINEBEFORE", (0,0), (0,-1), 3, accent),
                           ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
                           ("LEFTPADDING", (0,0), (-1,-1), 8),
                           ("RIGHTPADDING", (0,0), (-1,-1), 8),
                           ("TOPPADDING", (0,0), (-1,-1), 8),
                           ("BOTTOMPADDING", (0,0), (-1,-1), 8)]))
    return t


def page_bg(canvas, doc):
    canvas.saveState()
    w, h = A4
    if doc.page == 1:
        canvas.drawImage(ImageReader(hero), 0, 0, width=w, height=h, mask="auto")
        canvas.setFillColorRGB(0.035, 0.055, 0.10, alpha=.78)
        canvas.rect(0, 0, w, h, fill=1, stroke=0)
        canvas.setFillColor(PURPLE)
        canvas.rect(0, 0, 8*mm, h, fill=1, stroke=0)
        canvas.drawImage(str(ASSETS / "logo.png"), 25*mm, h-40*mm, width=45*mm, height=16*mm,
                         preserveAspectRatio=True, mask="auto", anchor="w")
        canvas.setFillColor(WHITE)
        canvas.setFont("Helvetica-Bold", 30)
        canvas.drawString(25*mm, h-92*mm, "RH PATRIMOINE")
        canvas.setFont("Helvetica", 14)
        canvas.drawString(25*mm, h-104*mm, "Audit digital & potentiel Google Ads")
        canvas.setStrokeColor(GOLD)
        canvas.setLineWidth(2)
        canvas.line(25*mm, h-114*mm, 76*mm, h-114*mm)
        canvas.setFont("Helvetica-Bold", 8)
        canvas.setFillColor(LILAC)
        canvas.drawString(25*mm, 45*mm, "BORDEAUX MÉTROPOLE  •  JUILLET 2026")
        canvas.setFont("Helvetica", 8)
        canvas.drawString(25*mm, 37*mm, "Rapport confidentiel préparé par NMF Agence")
        canvas.setFillColor(WHITE)
        canvas.roundRect(142*mm, 28*mm, 43*mm, 25*mm, 3*mm, fill=0, stroke=1)
        canvas.setFont("Helvetica-Bold", 8)
        canvas.drawCentredString(163.5*mm, 43*mm, "DONNÉES GOOGLE ADS")
        canvas.setFont("Helvetica", 7)
        canvas.drawCentredString(163.5*mm, 36*mm, "Keyword Planner • Bordeaux")
    else:
        canvas.setFillColor(PAPER)
        canvas.rect(0, 0, w, h, fill=1, stroke=0)
        canvas.setFillColor(NAVY)
        canvas.rect(0, 0, 17*mm, h, fill=1, stroke=0)
        canvas.setFillColor(PURPLE)
        canvas.rect(0, h-52*mm, 17*mm, 52*mm, fill=1, stroke=0)
        canvas.saveState()
        canvas.translate(10*mm, 20*mm)
        canvas.rotate(90)
        canvas.setFillColor(WHITE)
        canvas.setFont("Helvetica-Bold", 7)
        canvas.drawString(0, 0, "NMF AGENCE  /  AUDIT PROSPECT")
        canvas.restoreState()
        canvas.setStrokeColor(LINE)
        canvas.line(27*mm, 14*mm, 194*mm, 14*mm)
        canvas.setFillColor(MUTED)
        canvas.setFont("Helvetica", 6.5)
        canvas.drawString(27*mm, 9*mm, "Audit RH Patrimoine  •  Données Google Ads au 22 juillet 2026")
        canvas.drawRightString(194*mm, 9*mm, f"{doc.page} / 8")
    canvas.restoreState()


doc = BaseDocTemplate(str(OUT), pagesize=A4, leftMargin=27*mm, rightMargin=16*mm,
                      topMargin=17*mm, bottomMargin=18*mm,
                      title="Audit digital RH Patrimoine", author="NMF Agence")
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="content")
doc.addPageTemplates([PageTemplate(id="corporate", frames=[frame], onPage=page_bg)])

story = [Spacer(1, 250*mm), PageBreak()]

# 2 — SYNTHÈSE
story += title("01", "Synthèse exécutive", "Une opportunité ciblée, pas une campagne de volume")
metrics = [[P("77 %", "metric"), P("≈ 333 €", "metric"), P("≈ 86", "metric"), P("3 à 5", "metric")],
           [P("SCORE SOUS CONDITIONS", "metriclabel"), P("BUDGET GOOGLE / MOIS", "metriclabel"),
            P("CLICS / MOIS", "metriclabel"), P("LEADS / MOIS", "metriclabel")]]
t = Table(metrics, colWidths=[41.75*mm]*4)
t.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,-1), WHITE), ("BOX", (0,0), (-1,-1), .5, LINE),
                       ("INNERGRID", (0,0), (-1,-1), .35, LINE), ("TOPPADDING", (0,0), (-1,0), 10),
                       ("BOTTOMPADDING", (0,-1), (-1,-1), 8)]))
story += [t, Spacer(1, 8*mm),
          Table([[card("01  Positionnement clair", "Bordeaux Métropole et offre multi-métiers immédiatement visibles.", GREEN),
                  card("02  Capital confiance", "Équipe incarnée, coordonnées directes et avis externes favorables.", GREEN),
                  card("03  Contenu utile", "Pages vente et gestion détaillées, blog local actif.", GREEN)]], colWidths=[55.6*mm]*3),
          Spacer(1, 6*mm),
          Table([[card("01  Landing dédiée", "Séparer estimation/mandat et gestion locative.", RED),
                  card("02  Conversion mobile", "Réduire la bannière cookies et simplifier le formulaire.", RED),
                  card("03  Preuve au CTA", "Afficher note et avis au moment de la prise de contact.", ORANGE)]], colWidths=[55.6*mm]*3),
          Spacer(1, 7*mm),
          note("Décision NMF", "Feu vert conditionnel. Le marché propriétaire est plus petit que le trafic générique, mais les CPC élevés confirment sa valeur. Lancer un cluster estimation + gestion, en exact et expression, vers deux pages dédiées."),
          Spacer(1, 4*mm), P("Données Google : volume, CPC et concurrence. Hypothèses NMF : 40 % de part d'impression, 3 % de CTR et 4 à 6 % de conversion selon la landing page.", "small"), PageBreak()]

# 3 — ENTREPRISE
story += title("02", "Entreprise & marché", "Une agence locale, six métiers, deux priorités")
story += [strip(talence, "Visuel issu de rhpatrimoine.com  •  ancrage Talence / Bordeaux Métropole"), Spacer(1, 6*mm)]
seg = [[P("SEGMENTS COMMERCIAUX", "th"), P("ZONE & POSITIONNEMENT", "th")],
       [P("Vente & estimation<br/>Achat ancien et neuf<br/>Location<br/>Gestion locative<br/>Viager<br/>Conseil en investissement", "body"),
        P("Bordeaux, Talence et communes métropolitaines. Positionnement humain, moderne et sur mesure. La valeur Ads est concentrée sur les propriétaires vendeurs et bailleurs, davantage que sur les chercheurs de biens.", "body")]]
t = Table(seg, colWidths=[70*mm, 97*mm])
t.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,0), NAVY), ("BACKGROUND", (0,1), (-1,-1), WHITE),
                       ("GRID", (0,0), (-1,-1), .4, LINE), ("VALIGN", (0,0), (-1,-1), "TOP"),
                       ("LEFTPADDING", (0,0), (-1,-1), 8), ("RIGHTPADDING", (0,0), (-1,-1), 8),
                       ("TOPPADDING", (0,0), (-1,-1), 7), ("BOTTOMPADDING", (0,0), (-1,-1), 7)]))
story += [t, Spacer(1, 6*mm), P("Concurrence visible", "h2"),
          P("Sporting Immobilier, L'Agencerie, Laforêt, AD Immo, Avileo et plusieurs indépendants disposent déjà de pages locales spécialisées. RH Patrimoine possède une base crédible, mais doit rendre ses preuves et ses parcours plus immédiats."),
          note("Réputation", "Une fiche externe consultée affiche 4,8/5 pour 38 avis. L'adresse externe diffère cependant de celle du site : la cohérence du nom, de l'adresse et du téléphone doit être confirmée dans Google Business Profile.", ORANGE), PageBreak()]

# 4 — FORCES
story += title("03", "Audit du site", "Une marque crédible et humaine")
story += [strip(equipe, "Équipe RH Patrimoine  •  visuel issu de la page Conseillers"), Spacer(1, 6*mm)]
forces = [
    ("01", "Offre compréhensible", "Le métier, la zone et les principaux services sont compris rapidement."),
    ("02", "Équipe visible", "Quatre conseillers sont présentés avec fonction et coordonnées directes."),
    ("03", "Contenu commercial", "La gestion locative détaille prestations, taux de gestion et garantie loyers impayés."),
    ("04", "Socle SEO", "H1 unique sur les pages contrôlées, images avec alt, sitemap et robots accessibles."),
    ("05", "Vitesse initiale", "FCP et LCP proches de 0,8 s lors du test navigateur ; TTFB proche de 0,71 s."),
]
rows = []
for no, lab, body in forces:
    rows.append([P(f"<font color='#7B4FE0'><b>{no}</b></font>", "h2"), P(f"<b>{lab}</b><br/>{body}", "body")])
t = Table(rows, colWidths=[14*mm, 153*mm])
t.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,-1), WHITE), ("LINEBELOW", (0,0), (-1,-2), .4, LINE),
                       ("VALIGN", (0,0), (-1,-1), "TOP"), ("LEFTPADDING", (0,0), (-1,-1), 7),
                       ("RIGHTPADDING", (0,0), (-1,-1), 7), ("TOPPADDING", (0,0), (-1,-1), 7),
                       ("BOTTOMPADDING", (0,0), (-1,-1), 7)]))
story += [t, Spacer(1, 5*mm), note("Lecture", "Le problème n'est pas la crédibilité de RH Patrimoine. Le manque à gagner vient surtout de parcours trop larges pour convertir efficacement un trafic payant."), PageBreak()]

# 5 — PRIORITÉS
story += title("04", "Audit du site", "Les points qui freinent la prise de contact")
story += [strip(vente, "Page Vente  •  le bon contenu existe, il faut maintenant raccourcir le parcours"), Spacer(1, 6*mm)]
issues = [
    ("CRITIQUE", "Bannière cookies mobile", "Elle masque le premier écran.", "Réduire sa hauteur et garder les choix visibles."),
    ("CRITIQUE", "Accueil généraliste", "Six intentions diluent le message Ads.", "Créer deux landing pages dédiées."),
    ("CRITIQUE", "Destinations incohérentes", "Certains CTA reviennent vers Accueil ou Contact.", "Une URL unique et mesurée par intention."),
    ("IMPORTANT", "Preuve sociale éloignée", "Les avis ne rassurent pas près du formulaire.", "Afficher note, avis et verbatims au CTA."),
    ("IMPORTANT", "Formulaire long", "Coordonnées, commune, projet, message et RGPD.", "Limiter la première étape à trois champs."),
    ("IMPORTANT", "Deux téléphones", "Le visiteur ne sait pas lequel appeler.", "Choisir un numéro commercial traqué."),
    ("BONUS", "CLS à 0,25", "Des éléments bougent pendant le chargement.", "Réserver l'espace des médias et widgets."),
]
data = [[P("NIVEAU", "th"), P("CONSTAT", "th"), P("IMPACT", "th"), P("SOLUTION", "th")]]
for level, c, imp, sol in issues:
    data.append([P(level, "tds"), P(f"<b>{c}</b>", "td"), P(imp, "td"), P(sol, "td")])
t = Table(data, colWidths=[22*mm, 43*mm, 47*mm, 55*mm], repeatRows=1)
t.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,0), NAVY), ("ROWBACKGROUNDS", (0,1), (-1,-1), [WHITE, HexColor("#F0F2F5")]),
                       ("GRID", (0,0), (-1,-1), .35, LINE), ("VALIGN", (0,0), (-1,-1), "TOP"),
                       ("LEFTPADDING", (0,0), (-1,-1), 5), ("RIGHTPADDING", (0,0), (-1,-1), 5),
                       ("TOPPADDING", (0,0), (-1,-1), 5), ("BOTTOMPADDING", (0,0), (-1,-1), 5)]))
story += [t, Spacer(1, 5*mm), note("Verdict landing", "Oui avec corrections. Le trafic Ads ne doit pas arriver sur l'accueil : chaque campagne doit ouvrir une page alignée sur une seule demande."), PageBreak()]

# 6 — KEYWORDS
story += title("05", "Données Google Ads", "Le CPC révèle la valeur")
kw = [
    ("Estimation maison", "210", "2,38–4,60 €", "78", "Priorité"),
    ("Estimation bien immobilier", "140", "2,40–6,67 €", "81", "Priorité"),
    ("Estimation immobilière", "70", "2,38–6,47 €", "81", "Priorité"),
    ("Estimation maison gratuite", "50", "2,28–5,95 €", "84", "Priorité"),
    ("Estimation appartement", "40", "2,39–9,26 €", "82", "Priorité"),
    ("Vente appartement", "50", "0,23–3,69 €", "32", "Test"),
    ("Gestion locative", "70", "1,35–3,69 €", "46", "Priorité"),
    ("Agence immobilière", "2 900", "0,19–1,37 €", "20", "Second rideau"),
    ("Agence à proximité", "1 300", "0,26–0,67 €", "65", "Second rideau"),
    ("Viager", "320", "0,12–1,37 €", "31", "Campagne séparée"),
]
data = [[P(x, "th") for x in ["MOT-CLÉ", "VOL./MOIS", "CPC BAS–HAUT", "CONC.", "RÔLE"]]]
for r in kw: data.append([P(x, "td") for x in r])
t = Table(data, colWidths=[60*mm, 24*mm, 32*mm, 19*mm, 32*mm], repeatRows=1)
t.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,0), NAVY), ("ROWBACKGROUNDS", (0,1), (-1,-1), [WHITE, HexColor("#F0F2F5")]),
                       ("GRID", (0,0), (-1,-1), .35, LINE), ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
                       ("LEFTPADDING", (0,0), (-1,-1), 6), ("RIGHTPADDING", (0,0), (-1,-1), 6),
                       ("TOPPADDING", (0,0), (-1,-1), 6), ("BOTTOMPADDING", (0,0), (-1,-1), 6)]))
story += [t, Spacer(1, 7*mm),
          Table([[card("2 900 recherches", "« agence immobilière » : volume élevé mais CPC et concurrence faibles.", GOLD, 80*mm),
                  card("Jusqu'à 9,26 €", "« estimation appartement » : faible volume, intention et valeur maximales.", PURPLE, 80*mm)]], colWidths=[83.5*mm]*2),
          Spacer(1, 6*mm), note("Insight central", "Une estimation peut devenir un mandat à plusieurs milliers d'euros. Le CPC élevé n'est pas un défaut : il prouve que le marché accepte de payer pour cette intention."),
          Spacer(1, 4*mm), P("Source : Google Ads Keyword Planner, Bordeaux, juillet 2026. 3 762 idées brutes, 1 855 requêtes distinctes après dédoublonnage. Négatifs initiaux : Laforêt, Nestenn, Arthurimmo, Orpi, Century 21, Espaces Atypiques, SeLoger et autres marques concurrentes.", "small"), PageBreak()]

# 7 — PROJECTION
story += title("06", "Projection campagne", "Un budget précis pour une demande précise")
metrics = [[P("7 200", "metric"), P("3,87 €", "metric"), P("≈ 86", "metric"), P("≈ 333 €", "metric")],
           [P("VOLUME INTENTION", "metriclabel"), P("CPC HAUT MOYEN", "metriclabel"), P("CLICS / MOIS", "metriclabel"), P("BUDGET / MOIS", "metriclabel")]]
t = Table(metrics, colWidths=[41.75*mm]*4)
t.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,-1), WHITE), ("BOX", (0,0), (-1,-1), .5, LINE),
                       ("INNERGRID", (0,0), (-1,-1), .35, LINE), ("TOPPADDING", (0,0), (-1,0), 10),
                       ("BOTTOMPADDING", (0,-1), (-1,-1), 8)]))
story += [t, Spacer(1, 7*mm), P("Calcul transparent", "h2")]
calc = [[P("ÉTAPE", "th"), P("FORMULE", "th"), P("RÉSULTAT", "th"), P("NATURE", "th")],
        [P("Diffusion", "td"), P("7 200 × 40 % × 3 %", "td"), P("≈ 86 clics", "td"), P("Hypothèse NMF", "td")],
        [P("Budget", "td"), P("86 × 3,87 €", "td"), P("≈ 333 €", "td"), P("CPC Google", "td")],
        [P("Leads site actuel", "td"), P("86 × 3 %", "td"), P("≈ 2 à 3", "td"), P("Hypothèse NMF", "td")],
        [P("Leads landing dédiée", "td"), P("86 × 4–6 %", "td"), P("≈ 3 à 5", "td"), P("Hypothèse NMF", "td")],
        [P("CPL cible", "td"), P("333 € / 3 à 5", "td"), P("≈ 67 à 111 €", "td"), P("Projection", "td")]]
t = Table(calc, colWidths=[35*mm, 52*mm, 38*mm, 42*mm])
t.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,0), NAVY), ("ROWBACKGROUNDS", (0,1), (-1,-1), [WHITE, HexColor("#F0F2F5")]),
                       ("GRID", (0,0), (-1,-1), .35, LINE), ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
                       ("LEFTPADDING", (0,0), (-1,-1), 6), ("RIGHTPADDING", (0,0), (-1,-1), 6),
                       ("TOPPADDING", (0,0), (-1,-1), 6), ("BOTTOMPADDING", (0,0), (-1,-1), 6)]))
story += [t, Spacer(1, 6*mm),
          note("Score 77 / 100", "Feu vert sous réserve de deux landing pages, d'un suivi des appels et formulaires, et d'une réponse commerciale structurée. La valeur potentielle d'un mandat rend un CPL de 67 à 111 € défendable."),
          Spacer(1, 4*mm), P("Volume, CPC et concurrence : données Google. Part d'impression, CTR et taux de conversion : hypothèses NMF. Google ne fournit pas encore ici une prévision native de clics via GenerateForecastMetrics.", "small"), PageBreak()]

# 8 — ACTION
story += title("07", "Plan d'action", "Passer d'un site vitrine à un dispositif d'acquisition")
story += [strip(gestion, "Gestion locative  •  deuxième axe prioritaire après l'estimation vendeur"), Spacer(1, 6*mm)]
actions = [
    ("01", "PRÉREQUIS", "Corriger les CTA et la bannière mobile", "Supprimer les pertes immédiates"),
    ("02", "PRÉREQUIS", "Créer une landing Estimation / Mandat", "Convertir les vendeurs"),
    ("03", "PRÉREQUIS", "Créer une landing Gestion locative", "Convertir les bailleurs"),
    ("04", "MESURE", "Tracer appels, formulaires et rendez-vous", "Piloter sur des leads réels"),
    ("05", "LANCEMENT", "Exact + expression sur le cluster estimation", "Concentrer la dépense sur la valeur"),
    ("06", "LANCEMENT", "Gestion et viager en groupes séparés", "Lire la rentabilité par métier"),
    ("07", "PROTECTION", "Ajouter les marques concurrentes en négatifs", "Éviter le trafic navigationnel"),
    ("08", "OPTIMISATION", "Réviser les termes de recherche chaque semaine", "Réduire le CPL et élargir proprement"),
]
data = [[P("#", "th"), P("PHASE", "th"), P("ACTION", "th"), P("IMPACT", "th")]]
for r in actions: data.append([P(x, "td") for x in r])
t = Table(data, colWidths=[12*mm, 30*mm, 78*mm, 47*mm])
t.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,0), NAVY), ("ROWBACKGROUNDS", (0,1), (-1,-1), [WHITE, HexColor("#F0F2F5")]),
                       ("GRID", (0,0), (-1,-1), .35, LINE), ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
                       ("LEFTPADDING", (0,0), (-1,-1), 6), ("RIGHTPADDING", (0,0), (-1,-1), 6),
                       ("TOPPADDING", (0,0), (-1,-1), 5), ("BOTTOMPADDING", (0,0), (-1,-1), 5)]))
story += [t, Spacer(1, 7*mm), note("Cap NMF", "Commencer à environ 333 € de média mensuel sur les requêtes propriétaires. Ne pas gonfler artificiellement le budget avec les gros volumes génériques à faible valeur."),
          Spacer(1, 8*mm), P("NMF AGENCE", "kicker"), P("Stratégie digitale  •  Acquisition  •  Conversion", "h2"),
          P("Rapport préparé pour RH Patrimoine — www.rhpatrimoine.com", "body")]

doc.build(story)
print(OUT)
