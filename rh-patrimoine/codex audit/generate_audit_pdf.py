from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable
)


OUT = Path("output/pdf/audit-rh-patrimoine-nmf.pdf")
OUT.parent.mkdir(parents=True, exist_ok=True)

PURPLE = HexColor("#7B4FE0")
PALE = HexColor("#F3EEFF")
CREAM = HexColor("#FBF9F5")
INK = HexColor("#1A1A1A")
MID = HexColor("#62606A")
LIGHT = HexColor("#F3F3F5")
GREEN = HexColor("#24936E")
AMBER = HexColor("#D38B24")
RED = HexColor("#C94C4C")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="CoverKicker", fontName="Helvetica-Bold", fontSize=10,
                          leading=13, textColor=PURPLE, spaceAfter=8, tracking=1.4))
styles.add(ParagraphStyle(name="CoverTitle", fontName="Times-Bold", fontSize=31,
                          leading=34, textColor=INK, spaceAfter=14))
styles.add(ParagraphStyle(name="CoverSub", fontName="Helvetica", fontSize=15,
                          leading=20, textColor=MID))
styles.add(ParagraphStyle(name="H1x", fontName="Times-Bold", fontSize=22,
                          leading=25, textColor=INK, spaceAfter=10))
styles.add(ParagraphStyle(name="H2x", fontName="Times-Bold", fontSize=14,
                          leading=17, textColor=INK, spaceBefore=5, spaceAfter=6))
styles.add(ParagraphStyle(name="Bodyx", fontName="Helvetica", fontSize=8.7,
                          leading=12.2, textColor=INK, spaceAfter=5))
styles.add(ParagraphStyle(name="Smallx", fontName="Helvetica", fontSize=7.2,
                          leading=9.5, textColor=MID))
styles.add(ParagraphStyle(name="CardTitle", fontName="Helvetica-Bold", fontSize=9.2,
                          leading=11.5, textColor=INK, spaceAfter=3))
styles.add(ParagraphStyle(name="CardBody", fontName="Helvetica", fontSize=7.8,
                          leading=10.5, textColor=MID))
styles.add(ParagraphStyle(name="BigScore", fontName="Helvetica-Bold", fontSize=34,
                          leading=36, textColor=PURPLE, alignment=TA_CENTER))
styles.add(ParagraphStyle(name="BigBudget", fontName="Helvetica-Bold", fontSize=20,
                          leading=24, textColor=PURPLE, alignment=TA_CENTER))
styles.add(ParagraphStyle(name="CenterSmall", fontName="Helvetica", fontSize=7.5,
                          leading=10, textColor=MID, alignment=TA_CENTER))
styles.add(ParagraphStyle(name="TableHead", fontName="Helvetica-Bold", fontSize=7,
                          leading=8.5, textColor=colors.white))
styles.add(ParagraphStyle(name="TableCell", fontName="Helvetica", fontSize=6.5,
                          leading=8, textColor=INK))
styles.add(ParagraphStyle(name="TableCellSmall", fontName="Helvetica", fontSize=5.8,
                          leading=7, textColor=INK))


def P(text, style="Bodyx"):
    return Paragraph(text, styles[style])


def pill(text, bg=PALE, fg=PURPLE):
    t = Table([[P(text, "CardTitle")]], colWidths=[48*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("TEXTCOLOR", (0, 0), (-1, -1), fg),
        ("BOX", (0, 0), (-1, -1), 0.5, bg),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return t


def callout(title, body, color=PURPLE):
    data = [[P(title, "CardTitle")], [P(body, "CardBody")]]
    t = Table(data, colWidths=[171*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PALE),
        ("LINEBEFORE", (0, 0), (0, -1), 3, color),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
        ("BOTTOMPADDING", (0, -1), (-1, -1), 8),
    ]))
    return t


def card(title, body, width=54*mm):
    t = Table([[P(title, "CardTitle")], [P(body, "CardBody")]], colWidths=[width])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CREAM),
        ("BOX", (0, 0), (-1, -1), 0.5, HexColor("#E6E1DB")),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
        ("BOTTOMPADDING", (0, -1), (-1, -1), 8),
    ]))
    return t


def section_title(kicker, title):
    return [P(kicker.upper(), "CoverKicker"), P(title, "H1x"),
            HRFlowable(width="100%", thickness=1, color=HexColor("#E8E5EC"), spaceAfter=9)]


def footer(canvas, doc):
    if doc.page == 1:
        return
    canvas.saveState()
    canvas.setStrokeColor(HexColor("#E5E1EA"))
    canvas.line(20*mm, 13*mm, 190*mm, 13*mm)
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(MID)
    canvas.drawString(20*mm, 8*mm, "Audit réalisé par NMF Agence - juillet 2026")
    canvas.drawRightString(190*mm, 8*mm, f"{doc.page} / 8")
    canvas.restoreState()


class AuditDoc(BaseDocTemplate):
    pass


doc = AuditDoc(str(OUT), pagesize=A4, rightMargin=19*mm, leftMargin=19*mm,
               topMargin=18*mm, bottomMargin=18*mm, title="Audit digital RH Patrimoine",
               author="NMF Agence")
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main")
doc.addPageTemplates([PageTemplate(id="audit", frames=[frame], onPage=footer)])

story = []

# PAGE 1 - COUVERTURE
story += [Spacer(1, 18*mm), P("NMF AGENCE  /  AUDIT PROSPECT", "CoverKicker"),
          Spacer(1, 17*mm), P("RH Patrimoine", "CoverTitle"),
          P("Audit digital & potentiel Google Ads", "CoverSub"), Spacer(1, 10*mm),
          HRFlowable(width=35*mm, thickness=4, color=PURPLE, hAlign="LEFT", spaceAfter=12*mm),
          P("Agence immobilière sur Bordeaux Métropole", "H2x"),
          P("www.rhpatrimoine.com", "Bodyx"), Spacer(1, 43*mm),
          Table([[pill("SITE & CONVERSION"), pill("SEO LOCAL"), pill("GOOGLE ADS")]],
                colWidths=[57*mm]*3, hAlign="LEFT"), Spacer(1, 16*mm),
          P("Analyse réalisée en juillet 2026", "Smallx"),
          P("Rapport confidentiel préparé par NMF Agence", "Smallx"), PageBreak()]

# PAGE 2 - SYNTHESE
story += section_title("01  Synthèse exécutive", "L'essentiel en 60 secondes")
score = Table([[P("71 %", "BigScore"), P("500 à 900 €", "BigBudget"), P("3 à 8", "BigScore")],
               [P("score de réussite estimé", "CenterSmall"), P("budget média mensuel", "CenterSmall"),
                P("leads/mois avec landing pages", "CenterSmall")]], colWidths=[57*mm]*3)
score.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), CREAM),
                           ("BOX", (0, 0), (-1, -1), 0.5, HexColor("#E6E1DB")),
                           ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                           ("TOPPADDING", (0, 0), (-1, 0), 8),
                           ("BOTTOMPADDING", (0, -1), (-1, -1), 8)]))
story += [score, Spacer(1, 8*mm), P("Trois points forts", "H2x")]
story += [Table([[card("Positionnement local clair", "Bordeaux et la métropole sont identifiés dès l'arrivée."),
                  card("Offre complète", "Vente, estimation, location, gestion, viager et neuf."),
                  card("Capital confiance", "Équipe visible et réputation externe très favorable.")]],
                colWidths=[57*mm]*3), Spacer(1, 7*mm), P("Trois axes prioritaires", "H2x")]
story += [Table([[card("Créer deux landing pages", "Une page estimation/mandat et une page gestion locative."),
                  card("Réduire les frictions", "Bannière cookies mobile, formulaire long et CTA dispersés."),
                  card("Renforcer la preuve", "Afficher note, avis et résultats près des formulaires.")]],
                colWidths=[57*mm]*3), Spacer(1, 7*mm),
          callout("Recommandation NMF", "Concentrer le premier budget sur les propriétaires : estimation, mandat de vente et gestion locative. Éviter d'envoyer les annonces vers l'accueil généraliste."),
          Spacer(1, 4*mm), P("Le score de 71 % suppose la création de pages d'atterrissage dédiées, un suivi fiable des appels et formulaires, et une réponse commerciale rapide. Volumes et enchères issus du Keyword Planner Google Ads via le MCC NMF le 22 juillet 2026.", "Smallx"), PageBreak()]

# PAGE 3 - MARCHE
story += section_title("02  Entreprise & marché", "Une agence locale, multi-métiers")
story += [P("Cœur d'activité", "H2x"),
          P("RH Patrimoine accompagne les projets immobiliers sur Bordeaux Métropole. Le site présente six segments : vente et estimation, achat, location, gestion locative, viager et immobilier neuf. Pour l'acquisition payante, les segments propriétaires sont les plus rentables : un mandat de vente ou de gestion crée une valeur récurrente supérieure à une simple demande d'annonce."),
          P("Zone de chalandise", "H2x"),
          P("Bordeaux, Talence et les communes de la métropole, avec des pages de biens visibles pour Pessac, Mérignac, Floirac et Carbon-Blanc. Le siège indiqué sur le site est au 228 rue du 14 Juillet, 33400 Talence."),
          P("Positionnement observé", "H2x")]
market = [[P("PROMESSE", "TableHead"), P("PREUVES SUR LE SITE", "TableHead"), P("LECTURE BUSINESS", "TableHead")],
          [P("Service humain et sur mesure", "TableCell"), P("Conseillers nommés, téléphones directs, accompagnement personnalisé", "TableCell"), P("Différenciation crédible à renforcer par des avis visibles", "TableCell")],
          [P("Expertise bordelaise", "TableCell"), P("Contenus locaux, blog, pages par commune et connaissance du marché", "TableCell"), P("Bonne base pour des annonces géolocalisées", "TableCell")],
          [P("Service complet", "TableCell"), P("Vente, location, gestion, viager, neuf", "TableCell"), P("Largeur d'offre utile, mais parcours de conversion à segmenter", "TableCell")]]
t = Table(market, colWidths=[42*mm, 65*mm, 64*mm], repeatRows=1)
t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), PURPLE), ("GRID", (0, 0), (-1, -1), 0.4, HexColor("#DED9E5")),
                       ("VALIGN", (0, 0), (-1, -1), "TOP"), ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT]),
                       ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                       ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))
story += [t, Spacer(1, 6*mm), P("Concurrence visible", "H2x"),
          P("Sporting Immobilier, L'Agencerie, Laforêt, AD Immo, Avileo et plusieurs agences indépendantes disposent de pages locales spécialisées. La concurrence est soutenue, mais la valeur d'un mandat rend l'enchère économiquement défendable."),
          callout("Réputation locale", "Une fiche tierce consultée lors de l'audit affiche 4,8/5 pour 38 avis, avec des témoignages récents valorisant la disponibilité et le suivi. L'adresse externe observée diffère toutefois de celle du site : la cohérence NAP et la fiche Google Business Profile doivent être vérifiées.", AMBER),
          Spacer(1, 3*mm), P("Sources : rhpatrimoine.com ; résultats web consultés en juillet 2026. Les avis et coordonnées externes devront être confirmés directement dans Google Business Profile.", "Smallx"), PageBreak()]

# PAGE 4 - AUDIT POINTS FORTS
story += section_title("03  Audit du site", "Des fondations solides à exploiter")
strengths = [
    ("✓", "Offre & positionnement", "La zone bordelaise et les métiers sont compris rapidement. L'accueil explique l'accompagnement, l'expertise locale et la relation de proximité."),
    ("✓", "Contenus commerciaux", "La page gestion locative détaille les étapes, le taux de gestion de 7,08 % TTC et la garantie loyers impayés à 2,5 %. La page vente expose les moyens de valorisation."),
    ("✓", "Équipe incarnée", "Quatre conseillers sont présentés avec leur fonction et leurs coordonnées. Cette visibilité soutient la confiance dans une activité à forte dimension humaine."),
    ("✓", "SEO de base", "Les sept pages contrôlées possèdent un H1 unique. Les images analysées ont un attribut alt. Le sitemap.xml et le robots.txt sont accessibles."),
    ("✓", "Performance initiale", "Le test navigateur relève un FCP et un LCP proches de 0,8 s, avec un TTFB proche de 0,71 s. Le chargement perçu est rapide dans ce test ponctuel."),
    ("✓", "Contenu local actif", "Le blog publie des sujets liés aux quartiers et aux évolutions de Bordeaux, utiles pour l'autorité locale et le référencement naturel.")]
rows = []
for icon, title, body in strengths:
    rows.append([P(f"<font color='#24936E'><b>{icon}</b></font>", "H2x"), P(f"<b>{title}</b><br/>{body}", "Bodyx")])
t = Table(rows, colWidths=[9*mm, 162*mm])
t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LINEBELOW", (0, 0), (-1, -2), 0.4, HexColor("#E8E5EC")),
                       ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7)]))
story += [t, Spacer(1, 5*mm), callout("À retenir", "Le site ne souffre pas d'un manque d'offre ou de crédibilité. Le principal enjeu est de transformer cette richesse en parcours simples, chacun centré sur une intention commerciale."), PageBreak()]

# PAGE 5 - AUDIT FAIBLESSES
story += section_title("04  Audit du site", "Priorités de conversion et de SEO")
issues = [
    ("CRITIQUE", RED, "Bannière cookies dominante sur mobile", "Elle masque presque entièrement le premier écran.", "Réduire sa hauteur et conserver des boutons de choix immédiatement visibles."),
    ("CRITIQUE", RED, "Accueil trop généraliste pour les Ads", "Six intentions cohabitent et diluent le message.", "Créer une landing page estimation/mandat et une landing page gestion locative."),
    ("CRITIQUE", RED, "Liens et destinations incohérents", "Certains accès Estimation ou Gestion locative renvoient vers l'accueil ou Contact.", "Attribuer une URL dédiée et cohérente à chaque CTA."),
    ("IMPORTANT", AMBER, "Preuve sociale éloignée des CTA", "Les avis favorables trouvés en ligne ne rassurent pas au moment de convertir.", "Afficher note, volume d'avis et témoignages près des formulaires."),
    ("IMPORTANT", AMBER, "Deux numéros sans hiérarchie", "Le visiteur ne sait pas lequel appeler.", "Définir un numéro commercial principal et mesurer les appels Ads."),
    ("IMPORTANT", AMBER, "Formulaire à forte friction", "Le formulaire cumule coordonnées, commune, projet, message et consentement long.", "Limiter la première étape à nom, téléphone et type de projet."),
    ("IMPORTANT", AMBER, "Titres SEO trop génériques", "Location, Conseillers, Contact et Blog ciblent peu le métier et la ville.", "Réécrire les titles avec service + Bordeaux/Talence + marque."),
    ("BONUS", PURPLE, "Stabilité visuelle", "Le CLS mesuré à 0,25 dépasse le seuil recommandé de 0,10.", "Réserver l'espace des médias et stabiliser les éléments chargés tardivement.")]
data = [[P("NIVEAU", "TableHead"), P("CONSTAT", "TableHead"), P("IMPACT", "TableHead"), P("RECOMMANDATION", "TableHead")]]
for level, col, title, impact, reco in issues:
    data.append([P(f"<font color='{col.hexval()}'><b>{level}</b></font>", "TableCellSmall"), P(f"<b>{title}</b>", "TableCell"), P(impact, "TableCell"), P(reco, "TableCell")])
t = Table(data, colWidths=[22*mm, 45*mm, 48*mm, 56*mm], repeatRows=1)
t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), PURPLE), ("GRID", (0, 0), (-1, -1), 0.35, HexColor("#DED9E5")),
                       ("VALIGN", (0, 0), (-1, -1), "TOP"), ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT]),
                       ("LEFTPADDING", (0, 0), (-1, -1), 5), ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                       ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5)]))
story += [t, Spacer(1, 5*mm), callout("Verdict landing page", "Oui avec corrections. Le site peut soutenir la marque et le référencement, mais le trafic payant doit être dirigé vers des pages dédiées avec un objectif, un CTA et un formulaire court."), PageBreak()]

# PAGE 6 - MOTS-CLES
story += section_title("05  Recherche de mots-clés", "Intentions propriétaires prioritaires")
keywords = [
    ("Agence", "agence immobilière", "2 900", "0,19-1,37 €", "20/100", "Mixte"),
    ("Viager", "viager", "320", "0,12-1,37 €", "31/100", "Forte"),
    ("Achat", "maison à vendre", "260", "0,14-0,75 €", "49/100", "Acheteur"),
    ("Estimation", "estimation maison", "210", "2,38-4,60 €", "78/100", "Très forte"),
    ("Achat", "appartement à vendre", "170", "0,18-0,89 €", "58/100", "Acheteur"),
    ("Estimation", "estimation bien immobilier", "140", "2,40-6,67 €", "81/100", "Très forte"),
    ("Achat", "acheter appartement", "110", "0,22-1,13 €", "51/100", "Acheteur"),
    ("Estimation", "estimation immobilière", "70", "2,38-6,47 €", "81/100", "Très forte"),
    ("Gestion", "gestion locative", "70", "1,35-3,69 €", "46/100", "Très forte"),
    ("Location", "agence immobilière location", "70", "0,22-0,97 €", "32/100", "Mixte"),
    ("Estimation", "estimation appartement", "40", "2,39-9,26 €", "82/100", "Très forte"),
    ("Neuf", "immobilier neuf", "30", "0,69-2,46 €", "70/100", "Forte"),
    ("Viager", "maisons en viager", "30", "0,03-1,05 €", "21/100", "Forte"),
    ("Estimation", "estimation prix maison", "20", "1,87-4,58 €", "81/100", "Très forte")]
data = [[P(x, "TableHead") for x in ["SEGMENT", "MOT-CLÉ", "VOLUME / MOIS", "CPC EST.", "CONC.", "INTENTION"]]]
for row in keywords:
    data.append([P(str(x), "TableCellSmall") for x in row])
t = Table(data, colWidths=[20*mm, 58*mm, 25*mm, 22*mm, 21*mm, 25*mm], repeatRows=1)
t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), PURPLE), ("GRID", (0, 0), (-1, -1), 0.3, HexColor("#DED9E5")),
                       ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT]),
                       ("LEFTPADDING", (0, 0), (-1, -1), 4), ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                       ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]))
story += [t, Spacer(1, 5*mm),
          callout("Top 5 de lancement", "estimation maison ; estimation bien immobilier ; estimation immobilière ; gestion locative ; agence immobilière, cette dernière uniquement en exact/phrase avec négatifs stricts."),
          Spacer(1, 3*mm), P("Source : Keyword Plan Idea Service Google Ads, MCC NMF 671, zone Bordeaux (geoTargetConstants/1005811), réseau Google Search, 22 juillet 2026. Volume = moyenne mensuelle Google ; CPC = enchère haut de page basse-haute. Les variantes proches ne doivent pas être additionnées car elles peuvent partager une même grappe de volume.", "Smallx"), PageBreak()]

# PAGE 7 - PROJECTION
story += section_title("06  Projection Google Ads", "Un pilote centré sur la valeur")
calc = [[P("1. CLICS", "TableHead"), P("2. BUDGET", "TableHead"), P("3. LEADS", "TableHead"), P("4. CPL", "TableHead")],
        [P("70 à 170 / mois", "CardTitle"), P("500 à 900 € / mois", "CardTitle"), P("3 à 8 / mois", "CardTitle"), P("90 à 170 €", "CardTitle")],
        [P("Mix estimation, gestion, agence et viager", "TableCell"), P("Enchères Keyword Planner réelles par segment", "TableCell"), P("Conversion cible : 4 à 5 % sur pages dédiées", "TableCell"), P("Fourchette prudente de démarrage", "TableCell")]]
t = Table(calc, colWidths=[42.75*mm]*4)
t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), PURPLE), ("BACKGROUND", (0, 1), (-1, -1), CREAM),
                       ("GRID", (0, 0), (-1, -1), 0.4, HexColor("#DED9E5")), ("VALIGN", (0, 0), (-1, -1), "TOP"),
                       ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                       ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7)]))
story += [t, Spacer(1, 5*mm), P("Lecture économique", "H2x"),
          P("Le Keyword Planner confirme un marché accessible, mais les requêtes propriétaires les plus rentables ont moins de volume et des enchères plus élevées. Le site actuel est projeté à 2 à 5 leads par mois ; les 3 à 8 leads supposent deux landing pages ciblées, des formulaires courts et une preuve sociale proche du CTA. Un mandat signé peut absorber plusieurs mois de coût média."),
          P("Score de réussite détaillé", "H2x")]
score_rows = [[P("CRITÈRE", "TableHead"), P("POIDS", "TableHead"), P("NOTE", "TableHead"), P("JUSTIFICATION", "TableHead")],
              [P("Demande locale", "TableCell"), P("25", "TableCell"), P("18", "TableCell"), P("Fort générique, mais volume propriétaire plus resserré", "TableCell")],
              [P("Intention commerciale", "TableCell"), P("20", "TableCell"), P("18", "TableCell"), P("Estimation, mandat et gestion portent une intention forte", "TableCell")],
              [P("Concurrence / valeur", "TableCell"), P("20", "TableCell"), P("14", "TableCell"), P("Estimation jusqu'à 9,26 € ; valeur mandat élevée", "TableCell")],
              [P("Landing page", "TableCell"), P("25", "TableCell"), P("14", "TableCell"), P("Site crédible, parcours encore généralistes et friction mobile", "TableCell")],
              [P("Traitement des leads", "TableCell"), P("10", "TableCell"), P("7", "TableCell"), P("Téléphones visibles ; organisation et traçage à confirmer", "TableCell")],
              [P("TOTAL", "CardTitle"), P("100", "CardTitle"), P("71", "CardTitle"), P("Faisable avec corrections préalables", "CardTitle")]]
t = Table(score_rows, colWidths=[46*mm, 18*mm, 18*mm, 89*mm], repeatRows=1)
t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), PURPLE), ("BACKGROUND", (0, -1), (-1, -1), PALE),
                       ("GRID", (0, 0), (-1, -1), 0.35, HexColor("#DED9E5")), ("VALIGN", (0, 0), (-1, -1), "TOP"),
                       ("LEFTPADDING", (0, 0), (-1, -1), 5), ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                       ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5)]))
story += [t, Spacer(1, 4*mm), P("Étalon compte couvreur NMF, 30 derniers jours : 385 impressions, 10 clics, CTR 2,60 %, CPC moyen 6,86 €, coût 68,64 €, 0 conversion et 42,27 % de part d'impressions perdue par le budget. Ce compte appartient à un autre métier : il ne fixe pas le CPC immobilier, mais confirme le risque des requêtes trop larges et concurrentes. Définitions : CPC = coût par clic ; CPL = coût par lead.", "Smallx"), PageBreak()]

# PAGE 8 - PLAN
story += section_title("07  Plan d'action", "Transformer le potentiel en demandes qualifiées")
actions = [
    ("1", "CRITIQUE", "Corriger les destinations des CTA Estimation et Gestion locative", "Parcours cohérent, moins de pertes"),
    ("2", "CRITIQUE", "Créer une landing page estimation et mandat de vente", "Hausse du taux de conversion vendeur"),
    ("3", "CRITIQUE", "Créer une landing page gestion locative", "Acquisition ciblée de propriétaires bailleurs"),
    ("4", "CRITIQUE", "Réduire la bannière cookies sur mobile", "Proposition de valeur visible dès l'arrivée"),
    ("5", "IMPORTANT", "Afficher avis, note et témoignages près des formulaires", "Réassurance au moment de l'action"),
    ("6", "IMPORTANT", "Simplifier les formulaires et choisir un téléphone principal", "Moins de friction et meilleure attribution"),
    ("7", "IMPORTANT", "Installer le suivi appels, formulaires et rendez-vous", "Pilotage sur les leads réels"),
    ("8", "IMPORTANT", "Vérifier le NAP et la fiche Google Business Profile", "Cohérence locale et confiance"),
    ("9", "LANCEMENT", "Déployer en exact/phrase : estimation, agence, gestion, viager", "Budget concentré sur les intentions fortes"),
    ("10", "OPTIMISATION", "Analyser les termes de recherche et exclure les requêtes locataires", "CPL maîtrisé et meilleure qualité")]
data = [[P("#", "TableHead"), P("PRIORITÉ", "TableHead"), P("ACTION", "TableHead"), P("IMPACT ATTENDU", "TableHead")]]
for row in actions:
    data.append([P(row[0], "TableCell"), P(row[1], "TableCellSmall"), P(row[2], "TableCell"), P(row[3], "TableCell")])
t = Table(data, colWidths=[10*mm, 28*mm, 78*mm, 55*mm], repeatRows=1)
t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), PURPLE), ("GRID", (0, 0), (-1, -1), 0.35, HexColor("#DED9E5")),
                       ("VALIGN", (0, 0), (-1, -1), "TOP"), ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT]),
                       ("LEFTPADDING", (0, 0), (-1, -1), 5), ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                       ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5)]))
story += [t, Spacer(1, 8*mm), callout("Prochaine décision", "Valider les deux offres prioritaires, construire les landing pages et le plan de mesure, puis lancer le pilote à partir des données Keyword Planner déjà extraites sur Bordeaux."),
          Spacer(1, 9*mm), P("NMF AGENCE", "CoverKicker"),
          P("Stratégie digitale, acquisition et conversion", "H2x"),
          P("Rapport préparé pour RH Patrimoine - www.rhpatrimoine.com", "Bodyx")]

doc.build(story)
print(OUT.resolve())
