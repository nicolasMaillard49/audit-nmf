from pathlib import Path
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader

ROOT = Path(__file__).parent
ASSETS = ROOT / "assets" / "totowood"
OUT = ROOT / "output" / "pdf" / "audit-totowood-fr-nmf.pdf"
TMP = ROOT / "tmp" / "pdfs" / "totowood-v2"
OUT.parent.mkdir(parents=True, exist_ok=True)
TMP.mkdir(parents=True, exist_ok=True)

W, H = A4
NAVY = HexColor("#071B2B")
BROWN = HexColor("#5B443A")
SAND = HexColor("#C9A87C")
PAPER = HexColor("#F6F4EF")
INK = HexColor("#172433")
MUTED = HexColor("#65717D")
LINE = HexColor("#D8DDE2")
RED = HexColor("#C95046")
ORANGE = HexColor("#D98A31")
GREEN = HexColor("#24806A")
LILAC = HexColor("#EEE7E1")

pdfmetrics.registerFont(TTFont("Audit", r"C:\Windows\Fonts\arial.ttf"))
pdfmetrics.registerFont(TTFont("Audit-Bold", r"C:\Windows\Fonts\arialbd.ttf"))


def wrap(text, font, size, width):
    lines = []
    for paragraph in text.split("\n"):
        words, line = paragraph.split(), ""
        for word in words:
            test = (line + " " + word).strip()
            if pdfmetrics.stringWidth(test, font, size) <= width:
                line = test
            else:
                if line:
                    lines.append(line)
                line = word
        if line:
            lines.append(line)
    return lines


def txt(c, text, x, y, width, size=8.5, leading=11, color=INK, font="Audit"):
    c.setFillColor(color)
    c.setFont(font, size)
    for line in wrap(text, font, size, width):
        c.drawString(x, y, line)
        y -= leading
    return y


def crop(src, name, ratio):
    im = Image.open(src).convert("RGB")
    w, h = im.size
    if w / h > ratio:
        nw = int(h * ratio)
        im = im.crop(((w - nw) // 2, 0, (w + nw) // 2, h))
    else:
        nh = int(w / ratio)
        im = im.crop((0, (h - nh) // 2, w, (h + nh) // 2))
    p = TMP / name
    im.save(p, quality=91)
    return p


def page_base(c, page, section, title):
    c.setFillColor(PAPER)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.rect(0, 0, 17 * mm, H, fill=1, stroke=0)
    c.setFillColor(BROWN)
    c.rect(0, H - 52 * mm, 17 * mm, 52 * mm, fill=1, stroke=0)
    c.saveState()
    c.translate(10 * mm, 20 * mm)
    c.rotate(90)
    c.setFillColor(white)
    c.setFont("Audit-Bold", 7)
    c.drawString(0, 0, "NMF AGENCE  /  AUDIT PROSPECT")
    c.restoreState()
    c.setFillColor(BROWN)
    c.setFont("Audit-Bold", 8)
    c.drawString(27 * mm, H - 20 * mm, section.upper())
    c.setFillColor(NAVY)
    c.setFont("Audit-Bold", 23)
    yy = H - 31 * mm
    for line in wrap(title, "Audit-Bold", 23, 165 * mm):
        c.drawString(27 * mm, yy, line)
        yy -= 9 * mm
    c.setStrokeColor(LINE)
    c.line(27 * mm, yy - 2 * mm, 194 * mm, yy - 2 * mm)
    c.line(27 * mm, 14 * mm, 194 * mm, 14 * mm)
    c.setFillColor(MUTED)
    c.setFont("Audit", 6.5)
    c.drawString(27 * mm, 9 * mm, "Audit Totowood.fr  •  relevé public du 26 juillet 2026")
    c.drawRightString(194 * mm, 9 * mm, f"{page} / 11")
    return yy - 10 * mm


def rounded_card(c, x, y, w, h, accent=BROWN):
    c.setFillColor(white)
    c.roundRect(x, y, w, h, 3 * mm, fill=1, stroke=0)
    c.setFillColor(accent)
    c.rect(x, y + h - 2.5 * mm, w, 2.5 * mm, fill=1, stroke=0)


def card_text(c, x, y, w, title, body, accent=BROWN):
    rounded_card(c, x, y, w, 34 * mm, accent)
    c.setFillColor(NAVY)
    c.setFont("Audit-Bold", 9)
    c.drawString(x + 4 * mm, y + 24 * mm, title)
    txt(c, body, x + 4 * mm, y + 18 * mm, w - 8 * mm, 7.2, 9, MUTED)


def note(c, y, label, body, accent=BROWN):
    x, w, h = 27 * mm, 167 * mm, 25 * mm
    c.setFillColor(LILAC)
    c.roundRect(x, y, w, h, 2 * mm, fill=1, stroke=0)
    c.setFillColor(accent)
    c.rect(x, y, 3 * mm, h, fill=1, stroke=0)
    c.setFont("Audit-Bold", 7.5)
    c.drawString(x + 7 * mm, y + 16 * mm, label.upper())
    txt(c, body, x + 36 * mm, y + 17 * mm, 125 * mm, 8, 10.5, INK)


def screen_strip(c, path, y, caption, height=53 * mm):
    x, w = 27 * mm, 167 * mm
    p = crop(path, f"crop-{Path(path).stem}-{int(y)}.jpg", w / height)
    c.drawImage(ImageReader(str(p)), x, y, width=w, height=height)
    c.setFillColor(NAVY)
    c.rect(x, y - 8 * mm, w, 8 * mm, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Audit", 6.7)
    c.drawString(x + 3 * mm, y - 5 * mm, caption)


def cover(c):
    hero = crop(ASSETS / "photos" / "project-1.jpg", "cover.jpg", W / H)
    c.drawImage(ImageReader(str(hero)), 0, 0, width=W, height=H)
    c.setFillColorRGB(0.025, 0.07, 0.11, alpha=.79)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(BROWN)
    c.rect(0, 0, 8 * mm, H, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Audit-Bold", 31)
    c.drawString(25 * mm, H - 89 * mm, "TOTOWOOD")
    c.setFont("Audit", 14)
    c.drawString(25 * mm, H - 102 * mm, "Audit digital & plan de conversion")
    c.setStrokeColor(SAND)
    c.setLineWidth(2)
    c.line(25 * mm, H - 113 * mm, 80 * mm, H - 113 * mm)
    c.setFillColor(SAND)
    c.setFont("Audit-Bold", 8)
    c.drawString(25 * mm, 45 * mm, "MENUISERIE SUR MESURE  •  JUILLET 2026")
    c.setFillColor(white)
    c.setFont("Audit", 8)
    c.drawString(25 * mm, 37 * mm, "Rapport préparé par NMF Agence")
    c.roundRect(139 * mm, 27 * mm, 47 * mm, 26 * mm, 3 * mm, fill=0, stroke=1)
    c.setFont("Audit-Bold", 8)
    c.drawCentredString(162.5 * mm, 42 * mm, "AUDIT DU SITE PUBLIC")
    c.setFont("Audit", 7)
    c.drawCentredString(162.5 * mm, 35 * mm, "Desktop • Mobile • SEO")
    c.showPage()


def synthesis(c):
    y = page_base(c, 2, "01  /  Synthèse exécutive", "Une urgence visuelle, un vrai potentiel commercial")
    values = [("28 / 100", "SCORE ACTUEL"), ("P0", "AFFICHAGE"), ("5 pages", "CONTRÔLÉES"), ("30 jours", "PLAN D'ACTION")]
    x = 27 * mm
    for value, label in values:
        rounded_card(c, x, y - 34 * mm, 39.5 * mm, 30 * mm, RED if value == "P0" else BROWN)
        c.setFillColor(NAVY)
        c.setFont("Audit-Bold", 18 if len(value) < 8 else 15)
        c.drawCentredString(x + 19.75 * mm, y - 15 * mm, value)
        c.setFillColor(MUTED)
        c.setFont("Audit-Bold", 6.2)
        c.drawCentredString(x + 19.75 * mm, y - 24 * mm, label)
        x += 42.5 * mm
    y -= 47 * mm
    txt(c, "Totowood possède les bons actifs : plus de 10 ans d’expérience, fabrication sur mesure, projets réels et discours artisanal. Mais le site public affiche actuellement des éléments cassés qui empêchent ces preuves de jouer leur rôle.", 27 * mm, y, 167 * mm, 9.2, 13, INK)
    y -= 35 * mm
    card_text(c, 27 * mm, y, 52 * mm, "01  Réparer", "Logo, photos, SVG et tailles d’icônes. Tester toutes les pages.", RED)
    card_text(c, 84.5 * mm, y, 52 * mm, "02  Convertir", "Téléphone, devis, zone et preuves visibles dès le premier écran.", ORANGE)
    card_text(c, 142 * mm, y, 52 * mm, "03  Se positionner", "Titles, metas, pages locales et données structurées.", GREEN)
    note(c, y - 38 * mm, "Décision NMF", "Ne pas lancer de trafic payant avant correction du rendu. Une fois stabilisé, le site peut devenir un bon dispositif de génération de devis.", RED)
    c.showPage()


def visual_audit(c):
    y = page_base(c, 3, "02  /  Audit visuel", "Le premier écran détruit la confiance")
    screen_strip(c, ASSETS / "screens" / "homepage-desktop.png", y - 60 * mm,
                 "Capture réelle desktop • accueil totowood.fr • logo absent et bloc SVG noir surdimensionné")
    y -= 77 * mm
    card_text(c, 27 * mm, y, 52 * mm, "Logo non chargé", "Le repère de marque apparaît comme une image cassée.", RED)
    card_text(c, 84.5 * mm, y, 52 * mm, "Visuel principal cassé", "Le média devient une forme noire qui occupe l’écran.", RED)
    card_text(c, 142 * mm, y, 52 * mm, "Navigation illisible", "Liens presque blancs sur fond clair et hiérarchie confuse.", RED)
    note(c, y - 40 * mm, "Impact business", "Un prospect associe ce rendu à un site abandonné ou à une entreprise peu fiable. Le taux de sortie est probablement élevé, même si le savoir-faire réel est bon.", RED)
    c.showPage()


def mobile_and_security(c):
    y = page_base(c, 4, "03  /  Mobile & robustesse", "Le problème se répète et l’hébergement bloque")
    mobile = ASSETS / "screens" / "homepage-mobile.png"
    block = ASSETS / "screens" / "projects-desktop.png"
    pm = crop(mobile, "mobile-crop.jpg", .56)
    pb = crop(block, "block-crop.jpg", 1.5)
    c.drawImage(ImageReader(str(pm)), 27 * mm, y - 108 * mm, 58 * mm, 103 * mm)
    c.drawImage(ImageReader(str(pb)), 91 * mm, y - 72 * mm, 103 * mm, 68 * mm)
    c.setFillColor(NAVY)
    c.rect(27 * mm, y - 116 * mm, 58 * mm, 8 * mm, fill=1, stroke=0)
    c.rect(91 * mm, y - 80 * mm, 103 * mm, 8 * mm, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Audit", 6.2)
    c.drawString(29 * mm, y - 113 * mm, "Mobile • titre coupé et SVG géant")
    c.drawString(93 * mm, y - 77 * mm, "HTTP 429 • protection TigerProtect déclenchée")
    txt(c, "Après plusieurs contrôles automatisés, l’hébergement a renvoyé une page HTTP 429. La protection est utile, mais sa configuration doit éviter de bloquer les robots légitimes, les outils de mesure et potentiellement certains visiteurs.", 91 * mm, y - 91 * mm, 103 * mm, 8.2, 11, INK)
    note(c, y - 145 * mm, "Priorité technique", "Corriger le composant média/SVG, purger les caches, tester en navigation privée, puis revoir le seuil de rate-limit et l’allowlist des robots connus.", RED)
    c.showPage()


def conversion(c):
    y = page_base(c, 5, "04  /  Conversion", "Faire du site une machine à devis")
    rows = [
        ("CRITIQUE", "Contact immédiat", "Aucun lien tel: ou mailto: détecté.", "Téléphone cliquable + CTA devis fixe sur mobile."),
        ("CRITIQUE", "Accueil généraliste", "Le projet n’est pas qualifié.", "CTA par besoin : cuisine, dressing, bibliothèque."),
        ("IMPORTANT", "Preuve sociale", "Avis cités mais pas reliés à une source.", "Note Google et avis vérifiables près du CTA."),
        ("IMPORTANT", "Zone d’intervention", "Seine-et-Marne évoquée mais peu visible.", "Communes et rayon affichés dès l’accueil."),
        ("IMPORTANT", "Formulaire", "Présent seulement sur Contact.", "3 à 5 champs + photos + délai + confirmation."),
        ("BONUS", "Processus", "Étapes et délais peu explicites.", "Brief, conception, fabrication, pose, SAV.")
    ]
    x0, widths = 27 * mm, [26 * mm, 38 * mm, 48 * mm, 55 * mm]
    headers = ["NIVEAU", "CONSTAT", "IMPACT", "SOLUTION"]
    xx = x0
    for h, w in zip(headers, widths):
        c.setFillColor(NAVY)
        c.rect(xx, y - 11 * mm, w, 11 * mm, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont("Audit-Bold", 6.5)
        c.drawString(xx + 2 * mm, y - 7 * mm, h)
        xx += w
    y -= 11 * mm
    for i, row in enumerate(rows):
        h = 22 * mm
        c.setFillColor(white if i % 2 == 0 else HexColor("#ECEFF1"))
        c.rect(x0, y - h, sum(widths), h, fill=1, stroke=0)
        xx = x0
        for j, (cell, w) in enumerate(zip(row, widths)):
            txt(c, cell, xx + 2 * mm, y - 6 * mm, w - 4 * mm, 6.6, 8,
                RED if j == 0 and row[0] == "CRITIQUE" else INK,
                "Audit-Bold" if j in (0, 1) else "Audit")
            xx += w
        y -= h
    note(c, y - 10 * mm, "Micro-copy", "« Parlez-nous de votre projet sur mesure — première réponse sous 48 h ouvrées. »", BROWN)
    c.showPage()


def seo(c):
    y = page_base(c, 6, "05  /  SEO local", "Une base indexable, presque non optimisée")
    facts = [
        ("0 / 5", "META DESCRIPTIONS", RED),
        ("0", "LIENS TÉLÉPHONE", RED),
        ("5 / 5", "ALT VIDES ACCUEIL", ORANGE),
        ("1", "SITEMAP DÉCLARÉ", GREEN)
    ]
    x = 27 * mm
    for val, lab, color in facts:
        rounded_card(c, x, y - 33 * mm, 39.5 * mm, 29 * mm, color)
        c.setFillColor(NAVY)
        c.setFont("Audit-Bold", 18)
        c.drawCentredString(x + 19.75 * mm, y - 14 * mm, val)
        c.setFillColor(MUTED)
        c.setFont("Audit-Bold", 6)
        c.drawCentredString(x + 19.75 * mm, y - 23 * mm, lab)
        x += 42.5 * mm
    y -= 48 * mm
    items = [
        ("Titre accueil", "totowood", "Menuisier sur mesure en Seine-et-Marne | Totowood"),
        ("Meta description", "Absente", "Métier + zone + preuves + invitation au devis"),
        ("Données structurées", "Absentes", "LocalBusiness, Service et avis si vérifiables"),
        ("Pages locales", "Non visibles", "Annet-sur-Marne, Marne-la-Vallée, Seine-et-Marne"),
        ("Partage social", "Pas d’Open Graph", "Titre, description et image de partage")
    ]
    for label, current, target in items:
        rounded_card(c, 27 * mm, y - 24 * mm, 167 * mm, 20 * mm, BROWN)
        c.setFillColor(BROWN)
        c.setFont("Audit-Bold", 7)
        c.drawString(31 * mm, y - 10 * mm, label.upper())
        c.setFillColor(RED)
        c.setFont("Audit-Bold", 7.5)
        c.drawString(72 * mm, y - 10 * mm, current)
        txt(c, target, 113 * mm, y - 9 * mm, 76 * mm, 7.2, 9, INK)
        y -= 24 * mm
    note(c, y - 5 * mm, "Signal positif", "Les cinq pages principales répondaient en HTTP 200 lors du relevé initial ; canonical, robots.txt et sitemap WordPress sont présents.", GREEN)
    c.showPage()


def content(c):
    y = page_base(c, 7, "06  /  Contenu & preuve", "Montrer le niveau réel de l’atelier")
    photos = [ASSETS / "photos" / f"project-{i}.jpg" for i in (1, 2, 3)]
    x = 27 * mm
    for i, p in enumerate(photos):
        cp = crop(p, f"gallery-{i}.jpg", .92)
        c.drawImage(ImageReader(str(cp)), x, y - 75 * mm, 52 * mm, 69 * mm)
        x += 57.5 * mm
    c.setFillColor(NAVY)
    c.rect(27 * mm, y - 83 * mm, 167 * mm, 8 * mm, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Audit", 6.5)
    c.drawString(30 * mm, y - 80 * mm, "Visuels issus des médias publics de totowood.fr • la matière existe, elle doit être rendue correctement")
    y -= 102 * mm
    card_text(c, 27 * mm, y, 52 * mm, "1  Le besoin", "Contexte, contraintes, dimensions et attente du client.", BROWN)
    card_text(c, 84.5 * mm, y, 52 * mm, "2  La fabrication", "Plans, matériaux, quincaillerie et détails d’atelier.", SAND)
    card_text(c, 142 * mm, y, 52 * mm, "3  Le résultat", "Avant/après, pose, délai, commune et avis client.", GREEN)
    note(c, y - 40 * mm, "Règle éditoriale", "Chaque réalisation doit convaincre un prospect et se positionner sur une intention : type de meuble + sur mesure + commune.", BROWN)
    c.showPage()


def ads_keywords(c):
    y = page_base(c, 8, "07  /  Google Ads", "Capter des projets, pas des recherches vagues")
    groups = [
        ("AG 1 • MENUISIER SUR MESURE", RED, [
            "menuisier sur mesure", "menuisier agenceur", "menuiserie sur mesure",
            "agencement intérieur sur mesure"
        ]),
        ("AG 2 • DRESSING / PLACARD", ORANGE, [
            "dressing sur mesure", "placard sur mesure", "dressing sous pente",
            "aménagement placard sur mesure"
        ]),
        ("AG 3 • BIBLIOTHÈQUE / MEUBLE TV", BROWN, [
            "bibliothèque sur mesure", "meuble tv sur mesure",
            "meuble bibliothèque sur mesure", "meuble sur mesure salon"
        ]),
        ("AG 4 • CUISINE / AGENCEMENT", GREEN, [
            "cuisine sur mesure menuisier", "agencement cuisine sur mesure",
            "fabricant cuisine sur mesure", "menuisier cuisine"
        ])
    ]
    for idx, (title, color, kws) in enumerate(groups):
        col, row = idx % 2, idx // 2
        x = 27 * mm + col * 85.5 * mm
        yy = y - 72 * mm - row * 80 * mm
        rounded_card(c, x, yy, 80 * mm, 67 * mm, color)
        c.setFillColor(color)
        c.setFont("Audit-Bold", 8.2)
        c.drawString(x + 5 * mm, yy + 54 * mm, title)
        ky = yy + 43 * mm
        for kw in kws:
            c.setFillColor(color)
            c.circle(x + 6 * mm, ky + 1 * mm, 1.2 * mm, fill=1, stroke=0)
            ky = txt(c, f"[{kw}]", x + 11 * mm, ky + 3 * mm, 63 * mm, 7.3, 9.5, INK) - 2 * mm
    note(c, y - 173 * mm, "Ciblage", "Démarrer en correspondance exacte et expression. Ajouter les communes uniquement quand le volume existe : Meaux, Lagny-sur-Marne, Marne-la-Vallée, Claye-Souilly, Chelles et Est parisien.", BROWN)
    c.setFillColor(NAVY)
    c.setFont("Audit-Bold", 9)
    c.drawString(27 * mm, 36 * mm, "À EXCLURE DÈS LE DÉPART")
    txt(c, "emploi • formation • stage • salaire • plan gratuit • tuto • DIY • logiciel • occasion • IKEA • Castorama • Leroy Merlin • fenêtre PVC • réparation urgente", 70 * mm, 36 * mm, 124 * mm, 7.3, 9, MUTED)
    c.showPage()


def ads_projection(c):
    y = page_base(c, 9, "08  /  Budget & projection", "Trois scénarios, un calcul transparent")
    scenarios = [
        ("TEST", "600 €", "1,50–3,50 €", "171–400", "7–28", "21–86 €", RED),
        ("RECOMMANDÉ", "900 €", "1,50–3,50 €", "257–600", "10–42", "21–90 €", ORANGE),
        ("ACCÉLÉRATION", "1 500 €", "1,50–3,50 €", "429–1 000", "17–70", "21–88 €", BROWN)
    ]
    headers = ["SCÉNARIO", "BUDGET", "CPC", "CLICS", "LEADS", "CPL"]
    widths = [34, 28, 31, 28, 25, 21]
    x = 27 * mm
    xx = x
    for label, width in zip(headers, widths):
        c.setFillColor(NAVY)
        c.rect(xx, y - 11 * mm, width * mm, 11 * mm, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont("Audit-Bold", 6.4)
        c.drawString(xx + 2 * mm, y - 7 * mm, label)
        xx += width * mm
    y -= 11 * mm
    for i, row in enumerate(scenarios):
        values, color = row[:-1], row[-1]
        c.setFillColor(white if i % 2 == 0 else HexColor("#ECEFF1"))
        c.rect(x, y - 24 * mm, 167 * mm, 24 * mm, fill=1, stroke=0)
        xx = x
        for j, (value, width) in enumerate(zip(values, widths)):
            c.setFillColor(color if j == 0 else INK)
            c.setFont("Audit-Bold" if j in (0, 1) else "Audit", 7.4)
            c.drawString(xx + 2 * mm, y - 14 * mm, value)
            xx += width * mm
        y -= 24 * mm
    card_y = y - 40 * mm
    card_text(c, 27 * mm, card_y, 52 * mm, "Hypothèse CPC", "1,50 à 3,50 € par clic. À remplacer par les données Keyword Planner locales.", RED)
    card_text(c, 84.5 * mm, card_y, 52 * mm, "Hypothèse conversion", "4 à 7 % après création d’une landing page dédiée et mesurée.", ORANGE)
    card_text(c, 142 * mm, card_y, 52 * mm, "Valeur du lead", "Projet sur mesure à panier élevé : privilégier la qualité, pas le volume.", GREEN)
    note(c, card_y - 42 * mm, "Recommandation NMF", "Phase 1 : 600 € pendant 30 jours, Search uniquement. Passer à 900 € si les termes de recherche sont propres et si le coût par lead qualifié reste soutenable.", BROWN)
    c.setFillColor(MUTED)
    c.setFont("Audit", 6.5)
    c.drawString(27 * mm, 33 * mm, "Calcul : clics = budget / CPC. Leads = clics × 4–7 %. Données estimatives NMF, non issues d’un export Google Ads.")
    c.showPage()


def ads_structure(c):
    y = page_base(c, 10, "09  /  Architecture Ads", "La campagne à construire après réparation")
    steps = [
        ("1", "CAMPAGNE SEARCH", "Zone : Seine-et-Marne + Est parisien. Présence uniquement, pas intérêt."),
        ("2", "4 GROUPES D’ANNONCES", "Menuisier, dressing, bibliothèque/meuble TV, cuisine/agencement."),
        ("3", "4 LANDING PAGES", "Une promesse, des preuves et un formulaire alignés sur chaque intention."),
        ("4", "MESURE", "Appels, formulaires, ajout de photos, rendez-vous et devis qualifiés."),
        ("5", "OPTIMISATION", "Termes de recherche 2×/semaine, négatifs, annonces et zones par rentabilité.")
    ]
    for i, (no, title, body) in enumerate(steps):
        yy = y - 35 * mm - i * 34 * mm
        c.setFillColor(BROWN if i < 3 else GREEN)
        c.circle(36 * mm, yy + 8 * mm, 7 * mm, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont("Audit-Bold", 10)
        c.drawCentredString(36 * mm, yy + 5.5 * mm, no)
        c.setFillColor(NAVY)
        c.setFont("Audit-Bold", 9)
        c.drawString(49 * mm, yy + 12 * mm, title)
        txt(c, body, 49 * mm, yy + 5 * mm, 140 * mm, 7.7, 10, MUTED)
        c.setStrokeColor(LINE)
        c.line(49 * mm, yy - 6 * mm, 194 * mm, yy - 6 * mm)
    note(c, y - 205 * mm, "Go / no-go", "NO-GO aujourd’hui : le trafic payant arriverait sur un site visuellement cassé. GO après validation desktop/mobile, tracking et pages d’atterrissage.", RED)
    c.showPage()


def roadmap(c):
    y = page_base(c, 11, "10  /  Plan d’action", "30 jours pour remettre le site en vente")
    phases = [
        ("48 H", RED, ["Réparer logo, images et SVG", "Purger caches et minification", "Tester desktop / mobile", "Contrôler HTTP 429"]),
        ("7 JOURS", ORANGE, ["CTA téléphone et devis", "Formulaire court avec photos", "Titles, metas et Open Graph", "LocalBusiness schema"]),
        ("30 JOURS", BROWN, ["Pages services dédiées", "3 pages de zones locales", "6 études de cas complètes", "Avis vérifiables + mesure"])
    ]
    x = 27 * mm
    for title, color, items in phases:
        rounded_card(c, x, y - 115 * mm, 52 * mm, 108 * mm, color)
        c.setFillColor(color)
        c.rect(x, y - 33 * mm, 52 * mm, 26 * mm, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont("Audit-Bold", 14)
        c.drawCentredString(x + 26 * mm, y - 22 * mm, title)
        yy = y - 44 * mm
        for item in items:
            c.setFillColor(color)
            c.circle(x + 6 * mm, yy + 1 * mm, 1.4 * mm, fill=1, stroke=0)
            yy = txt(c, item, x + 11 * mm, yy + 3 * mm, 36 * mm, 7.3, 10, INK) - 6 * mm
        x += 57.5 * mm
    note(c, y - 133 * mm, "KPI à suivre", "Demandes qualifiées, clics téléphone, taux de formulaire, trafic local, vitesse mobile et erreurs 4xx/5xx.", GREEN)
    c.setFillColor(BROWN)
    c.setFont("Audit-Bold", 8)
    c.drawString(27 * mm, 34 * mm, "NMF AGENCE")
    c.setFillColor(NAVY)
    c.setFont("Audit-Bold", 11)
    c.drawString(27 * mm, 27 * mm, "Stratégie digitale • Acquisition • Conversion")
    c.showPage()


c = canvas.Canvas(str(OUT), pagesize=A4)
c.setTitle("Audit digital Totowood.fr")
c.setAuthor("NMF Agence")
cover(c)
synthesis(c)
visual_audit(c)
mobile_and_security(c)
conversion(c)
seo(c)
content(c)
ads_keywords(c)
ads_projection(c)
ads_structure(c)
roadmap(c)
c.save()
print(OUT)
