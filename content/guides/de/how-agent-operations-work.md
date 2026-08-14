---
locale: "de"
slug: "how-agent-operations-work"
canonicalPath: "/guides/how-agent-operations-work"
title: "Wie Agentenabläufe funktionieren: Von der Anfrage zum überprüften Artefakt"
heading: "Wie Agentenabläufe funktionieren: Von der Anfrage zum überprüften Artefakt"
description: "Folgen Sie einem operativen Agentenablauf in acht Etappen, der Verantwortliche zuweist, Werkzeuge begrenzt, Nachweise erfasst, ungewisse Nebenwirkungen behandelt und mit einer Prüfung endet."
eyebrow: "Leitfaden für Agentenabläufe"
author: "Toone Content"
authorType: "Organization"
authorUrl: "/en/editorial-policy"
published: "2026-08-14"
updated: "2026-08-14"
readTime: "17 Min. Lesezeit"
featured: true
image: "/assets/og/toone-og.png"
imageAlt: "Toone Leitfaden für Agentenabläufe"
sourceWorkId: "CNT-editorial-post-a44edaec"
sourceSha256: "c62f2674638470c80780bb0f1d9f984435f02e35bf1ceeeb671a6ec247af1cdc"
englishSourceSha256: "374faf21eaf71d93e2efb73c4427942b8940affd2ecbe290eaf98a9d2643082a"
translationManifestSha256: "fd5ea2d9ce3434b9a3f81d95a4346d61e82683ee97e4dabbc9ddfe3155c43bbd"
translationQaSha256: "d2678d637fa99bfa0de0f3db44a968add4d3f306276e6c8e56da57b68b7cdd92"
---
Ein operativer Agentenablauf ist ein kontrollierter Weg von einer abgegrenzten Anfrage zu einem überprüften Artefakt. Der Ablauf weist Verantwortung zu, registriert Eingaben, begrenzt Werkzeuge und Daten, zeichnet Handlungen und Nachweise auf, prüft das Ergebnis, behandelt Fehler und endet in einem ausdrücklich akzeptierten, zu überarbeitenden oder gestoppten Zustand.

Diese Definition ist das Arbeitsmodell dieses Leitfadens. Sie verbindet aktuelle Empfehlungen von Anbietern und aus dem Risikomanagement mit einem praktischen Betriebsvertrag. Sie ist weder ein allgemeingültiger Standard noch die Beschreibung eines bestimmten Produkts.

Der Ablauf ist wichtig, weil die Aussage eines Agenten, er sei fertig, nur eine Art von Evidenz darstellt. Eine brauchbare Betriebsaufzeichnung unterscheidet zwischen dem, was eine Quelle oder ein System beobachtet hat, dem, was ein Entwurf verlangt, dem, was der Agent behauptet, dem, was ein verantwortlicher Betreiber entschieden hat, und dem, was unbekannt bleibt.

## Entscheiden Sie zuerst, ob die Arbeit einen Agenten erfordert

Beginnen Sie nicht mit einem Werkzeug. Beginnen Sie mit der Aufgabe, der für die Entscheidung verantwortlichen Person und der Evidenz, die am Ende vorliegen muss.

[Microsofts Leitfaden zur Geschäftsplanung für KI-Agenten](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ai-agents/business-strategy-plan) unterscheidet zwischen vorhersehbarer Arbeit, für die regulärer Code genügt, statischen Abrufaufgaben und Arbeit, die dynamisches Schlussfolgern oder den Einsatz von Werkzeugen erfordert. [Anthropics Leitfaden zum Aufbau wirksamer Agenten](https://www.anthropic.com/engineering/building-effective-agents) trennt ebenfalls vordefinierte Workflows von Agenten, die ihren Prozess und Werkzeugeinsatz selbst steuern, und empfiehlt den am wenigsten komplexen Entwurf, der zur Aufgabe passt. Das sind Entscheidungshilfen, keine festen technischen Gesetze.

Verwenden Sie ein deterministisches Programm oder einen vordefinierten Workflow, wenn Regeln, Reihenfolge der Schritte, Eingaben und erwartetes Ergebnis stabil und prüfbar sind. Nutzen Sie Informationsabruf, wenn die Aufgabe darin besteht, belegte Informationen aus einem bekannten Dokumentenbestand zu finden, ohne Werkzeuge dynamisch anzuordnen. Lassen Sie den Workflow in menschlicher Verantwortung, wenn es im Kern um Richtlinien, Rechenschaft, Urteilsvermögen oder Abnahme geht und eine dynamische Ausführung wenig beiträgt.

Ein Agent kommt sinnvoll infrage, wenn die Arbeit kontextbezogene Entscheidungen über unstrukturierte Eingaben, wechselnde Werkzeugfolgen oder Ausnahmen erfordert und die Organisation dennoch Folgendes festlegen kann:

- das Ergebnis und die dafür verantwortliche Person;
- zulässige Eingaben, Werkzeuge, Daten und Ziele;
- verbotene Handlungen und Freigabepunkte;
- Evidenz, die eine andere prüfende Person einsehen kann;
- eine für die Wiederherstellung verantwortliche Person und einen sicheren Stoppzustand;
- einen Abnahmetest für das endgültige Artefakt.

Wenn sich diese Felder nicht ausfüllen lassen, macht ein Agent die Unsicherheit schwerer erkennbar.

## Verwenden Sie fünf Evidenzkategorien

Diese Bezeichnungen verhindern, dass die Darstellung eines Agenten als Beweis behandelt wird. Sie bilden das redaktionelle Modell dieses Leitfadens.

| Evidenzkategorie | Bedeutung | Was sie belegen kann | Was sie nicht belegen kann |
|---|---|---|---|
| **Quellenfakt** | Ein mit Zeitstempel versehenes Primärdokument, eine Antwort des verantwortlichen Systems oder eine unabhängig beobachtete Wirkung. | Der genannte Sachverhalt wurde innerhalb des dokumentierten Umfangs der Quelle beobachtet. | Vollständigkeit über diesen Umfang hinaus oder eine nicht beobachtete Nebenwirkung. |
| **Dokumentierte Gestaltungsregel** | Ein versionierter Betriebsvertrag legt fest, dass eine Rolle, Etappe, Freigabe, ein Nachweis oder eine Wiederherstellungsregel bestehen soll. | Die Organisation hat die Regel entworfen und dokumentiert. | Dass Software sie durchgesetzt oder jeder Durchlauf sie befolgt hat. |
| **Agentenaussage** | Ein Agent nennt eine Absicht, Auslegung, ein Ergebnis oder eine Ursache. | Eine Hypothese oder ein vorgeschlagenes Ergebnis zur Prüfung. | Ausführung, Richtigkeit, Freigabe oder geschäftlichen Abschluss. |
| **Betreiberentscheidung** | Eine verantwortliche Person oder ein autorisiertes System genehmigt, lehnt ab, akzeptiert, stoppt oder wählt einen Wiederherstellungsweg. | Die Entscheidung ist bekannt, wenn verantwortliche Person, Umfang, Evidenz, Ziel und Zeitpunkt gebunden sind. | Dass die genehmigte Handlung stattgefunden hat oder erfolgreich war. |
| **Ungelöste Unbekannte** | Die verfügbare Evidenz kann nicht feststellen, was geschehen ist oder ob das Ergebnis gültig ist. | Einen Grund, anzuhalten, abzugleichen oder stärkere Evidenz einzuholen. | Die Erlaubnis, zu raten, einen neuen Versuch zu starten oder Erfolg zu erklären. |

Ein Ereignis kann mehrere Kategorien umfassen. Ein Agent kann vorschlagen, eine Datei zu schreiben, ein Betreiber kann ein Ziel und eine Prüfsumme genehmigen und das Zielsystem kann den Schreibvorgang später bestätigen. Das sind eine Agentenaussage, eine Betreiberentscheidung und ein Quellenfakt. Sie zu „Der Agent hat die Arbeit abgeschlossen“ zusammenzufassen, verdeckt die Unterschiede, die eine prüfende Person benötigt.

## Der operative Agentenablauf in acht Etappen

Jede Etappe sollte die dafür verantwortliche Person, Eingabe, den zulässigen Umfang, die Handlung, Entscheidung, Ausgabe, den Nachweis, Fehlerzustand, die für die Wiederherstellung verantwortliche Person und die an diesem Punkt maßgebliche Abschlussbedingung offenlegen. Die folgenden Felder bilden einen Betriebsvertrag. Sie behaupten nicht, dass jede Umsetzung dieselben Bezeichnungen verwendet.

| Etappe | Verantwortung und Entscheidung | Eingabe, Werkzeuge, Handlung und Übergabe | Ausgabe, Evidenz, Fehler, Wiederherstellung und Abschluss |
|---:|---|---|---|
| **1. Anfrage abgrenzen** | Die für das Ergebnis verantwortliche Person legt das Geschäftsergebnis fest und entscheidet, ob die Anfrage akzeptiert wird. | Erfassen Sie Arbeits-ID, Aufgabe, Zielgruppe, Nicht-Ziele, Risikogrenze und Abnahmekriterien. Ein Ausführungswerkzeug wird noch nicht benötigt. | Der Abschluss erfordert einen akzeptierten Umfang. Unklare Verantwortung oder widersprüchliche Ziele gehen an die für die Anfrage verantwortliche Person zurück. |
| **2. Eingaben registrieren** | Eine für die Quellen verantwortliche Person oder ein Betreiber bestätigt, welche Evidenz in die Arbeit einfließen darf. | Erfassen Sie Quellenidentitäten, Daten oder Versionen, bei Bedarf Prüfsummen, Aktualitätsgrenzen und Regeln für fehlende Daten. Übergeben Sie ein unveränderliches Eingabemanifest. | Der Abschluss erfordert einen Eingabenachweis und ausdrückliche Unbekannte. Fehlende tragende Evidenz stoppt oder begrenzt die Arbeit. |
| **3. Verantwortung zuweisen** | Die für das Ergebnis verantwortliche Person benennt den Agenten oder die Workflow-Rolle, den Betreiber, die prüfende Person, die für die Freigabe verantwortliche Person und die für die Wiederherstellung verantwortliche Person. | Ordnen Sie zu, wer vorschlagen, ausführen, genehmigen, prüfen, erneut versuchen und stoppen darf. Erfassen Sie Konflikte und nicht verfügbare Rollen. | Der Abschluss erfordert eine Verantwortungsmatrix. Eine Entscheidung ohne verantwortliche Person bleibt ein Hindernis. |
| **4. Innerhalb des Umfangs planen** | Der Betreiber oder die für Richtlinien verantwortliche Person entscheidet, ob der vorgeschlagene Weg innerhalb des Vertrags bleibt. | Erfassen Sie Schritte, zulässige Werkzeuge und Daten, Zielumfang, verbotene Handlungen, Freigabeauslöser, Budget und Grenzen für neue Versuche. Übergeben Sie einen prüfbaren Plan oder eine deterministische Anweisung. | Der Abschluss erfordert einen akzeptierten Plan. Eine Ausweitung des Umfangs geht an die für die Entscheidung verantwortliche Person zurück, statt stillschweigend angenommen zu werden. |
| **5. Ausführen und aufzeichnen** | Die ausführende Rolle nimmt nur zulässige Handlungen vor; die für die Freigabe verantwortliche Person entscheidet bei Bedarf über folgenreiche Handlungen. | Binden Sie die Handlung an ein Ziel und eine unveränderliche Nutzlastidentität. Erfassen Sie Zeitstempel, Werkzeugein- und -ausgaben, Zustandsänderungen, Fehler und Nachweise von Nebenwirkungen. | Der Abschluss erfordert ein beobachtbares Ergebnis oder bewahrte Unsicherheit. Ein Timeout nach einem möglichen Schreibvorgang führt zum Abgleich und nicht zu einem blinden neuen Versuch. |
| **6. Artefakt prüfen** | Eine benannte prüfende Person wendet schriftlich festgelegte Abnahmekriterien an. | Vergleichen Sie die Ausgabe mit Anfrage, Quellen, Richtlinien, Evidenz und verbotenen Ergebnissen. Erfassen Sie Identität und Typ der prüfenden Person, Unsicherheit und Grenzen. | Der Abschluss erfolgt mit `ACCEPT`, `REVISE` oder `HOLD`. Der technische Abschluss allein belegt weder Nutzen noch Richtigkeit. |
| **7. Wiederherstellen oder stoppen** | Die für die Wiederherstellung verantwortliche Person klassifiziert den Fehler und entscheidet über einen neuen Versuch, Reparatur, Ausgleich, Übergabe oder Stopp. | Gleichen Sie mögliche Nebenwirkungen ab, prüfen Sie das genaue Ziel, bewahren Sie den fehlgeschlagenen Versuch auf und binden Sie jeden Nachfolger an eine neue Versuchsidentität. | Der Abschluss erfolgt mit `RECOVERED`, einem genehmigten neuen Versuch oder einer endgültigen Unbekannten beziehungsweise einem Stopp. Löschen Sie niemals die Aufzeichnung des fehlgeschlagenen Versuchs. |
| **8. Abschließen und übergeben** | Die für das Ergebnis verantwortliche Person akzeptiert den Endzustand und weist die nächste Entscheidung zu. | Stellen Sie das akzeptierte Artefakt, die Evidenz, das Prüfresultat, verbleibende Unbekannte und die nächste verantwortliche Person zusammen. Bewahren Sie nur ordnungsgemäß verwaltete Evidenz auf. | Der Abschluss erfordert ein an einen Nachweis gebundenes Artefakt und einen ausdrücklichen nächsten Zustand. „Erledigt“ ohne Abnahmeprotokoll schließt die geschäftliche Aufgabe nicht ab. |

Als Verantwortungsmodell ist der Ablauf sequenziell, doch eine Umsetzung kann zu früheren Etappen zurückkehren. Neue Evidenz kann einen Entwurf zur Eingaberegistrierung zurückführen. Eine nicht bestandene Prüfung kann zur Planung zurückführen. Eine Wiederherstellung kann einen Nachfolgeversuch erzeugen. Die Aufzeichnung sollte diese Bewegung zeigen, statt den vorherigen Zustand umzuschreiben.

## Praxisbeispiel: ein Recherchepaket zu Anbietern

Dieses Beispiel ist hypothetisch. Es beschreibt weder Toone noch eine Kundenimplementierung oder einen getesteten Produktdurchlauf.

Ein Einkaufsteam benötigt ein Prüfpaket zu drei potenziellen Softwareanbietern. Die Anfrage ist auf öffentliche Primärquellen begrenzt. Der Agent darf einen internen Paketentwurf erstellen. Er darf weder Anbieter kontaktieren noch Konten anlegen, Bedingungen akzeptieren, Beschaffungsunterlagen ändern oder das Paket veröffentlichen.

### 1. Abgegrenzte Anfrage

Die Leitung des operativen Einkaufs ist für das Ergebnis verantwortlich. Das akzeptierte Ergebnis ist ein Paket mit der aktuellen öffentlichen Produktbeschreibung jedes Anbieters, der Preisquelle, sofern veröffentlicht, Dokumentation zum Umgang mit Daten, ungelösten Fragen und Quellenangaben. Eine Beschaffungsempfehlung liegt außerhalb des Umfangs.

Die Abnahmekriterien verlangen direkte Quellenlinks, Beobachtungsdaten, die Trennung von Quellenfakten und Analyse sowie einen sichtbaren unbekannten Zustand bei fehlender Evidenz.

### 2. Registrierte Eingaben

Der Betreiber erfasst die drei Anbieterdomains, ihre öffentlichen Dokumentationsbereiche, das Prüfdatum und die zugelassenen Quellentypen. Das Eingabemanifest schließt Nutzerbewertungen, generierte Zusammenfassungen ohne Primärlinks, private Dokumente und personenbezogene Daten aus.

Jeder Quellen-Snapshot erhält ein Datum und eine stabile Referenz. Eine nicht zugängliche Quelle bleibt eine ungelöste Unbekannte. Der Agent darf ihren Inhalt weder erfinden noch ableiten.

### 3. Verantwortungsmatrix

| Verantwortung | Hypothetisch verantwortliche Rolle |
|---|---|
| Geschäftsergebnis | Leitung des operativen Einkaufs |
| Quellengrenze | Einkaufsanalyst |
| Recherche und Entwurf | Agent für Anbieterrecherche, Version `example-v1` |
| Prüfung des Artefakts | Einkaufsanalyst |
| Freigabe externer Kommunikation | Leitung des operativen Einkaufs |
| Fehler und Wiederherstellung | Verantwortlicher für Einkaufssysteme |

Die Bezeichnungen beschreiben Rollen im fiktiven Beispiel. Sie sind weder Toone-Rollen noch Evidenz für eine menschliche Prüfung dieses Leitfadens.

### 4. Plan mit festgelegtem Umfang

Der Agent schlägt vier Schritte vor: zugelassene Quellen sammeln, datierte Fakten extrahieren, vergleichsneutrale Abschnitte zu den Anbietern entwerfen und das interne Paket zusammenstellen. Er darf öffentliche Webinhalte lesen und in ein internes Entwurfsziel schreiben. Jeder externe Schreibvorgang, jede Nachricht, Formularübermittlung, Kontohandlung oder Änderung von Datensätzen ist verboten.

Der Betreiber akzeptiert den Plan und bindet ein Ausgabeziel an die geplante Nutzlastidentität. Die Freigabe ist eine Betreiberentscheidung. Sie ist kein Beweis dafür, dass der Entwurf geschrieben wurde.

### 5. Ausführung und ungewisse Nebenwirkung

Die Quellensammlung wird abgeschlossen und erzeugt ein Quellenmanifest. Der Agent schlägt den Paketinhalt vor und gibt an, den Entwurf geschrieben zu haben. Diese Angabe ist eine **Agentenaussage**.

Das Entwurfswerkzeug meldet einen Timeout, nachdem der entfernte Dienst die Anfrage möglicherweise angenommen hat. Die Fehlermeldung ist ein **Quellenfakt**. Ob der Entwurf existiert, ist eine **ungelöste Unbekannte**. Ein sofortiger neuer Versuch könnte ein Duplikat erzeugen oder eine bereits vorhandene Datei überschreiben.

### 6. Prüfung kann noch nicht beginnen

Der prüfenden Person liegt kein stabiles Artefakt vor. Daher bleibt die Prüfung blockiert. Eine Agentenaussage und ein Timeout erfüllen den Artefaktnachweis nicht.

### 7. Wiederherstellungszweig

Der für die Einkaufssysteme Verantwortliche prüft das genaue Ziel und den erwarteten Nutzlast-Hash, bevor ein neuer Versuch genehmigt wird.

1. Wenn der erwartete Entwurf mit dem genehmigten Hash vorhanden ist, erfassen Sie `RECOVERED` und wiederholen Sie den Schreibvorgang nicht.
2. Wenn das Ziel prüfbar und der Entwurf nicht vorhanden ist, genehmigen Sie einen neuen Versuch unter einer neuen Versuchs-ID.
3. Wenn das Ziel nicht geprüft werden kann, erfassen Sie `WRITE_UNCERTAIN` und stoppen Sie. Fehlende Evidenz ist keine Erlaubnis für einen neuen Versuch.

Die Wahl des Wiederherstellungswegs ist eine **Betreiberentscheidung**. Die sie stützende Beobachtung des Ziels ist ein **Quellenfakt**. Die Regel, die vor einem neuen Versuch einen Abgleich verlangt, ist im Betriebsvertrag dieses Beispiels eine **dokumentierte Gestaltungsregel**.

### 8. Prüfung und Abschluss

Nehmen wir an, der passende Entwurf ist vorhanden und wird wiederhergestellt. Die prüfende Person gleicht jede wesentliche Aussage mit dem Quellenmanifest ab, markiert einen unbelegten Vergleich zur Entfernung und gibt `REVISE` zurück. Der Agent erstellt einen Nachfolgeentwurf mit einer neuen Artefaktprüfsumme. Die prüfende Person akzeptiert diese Version.

Der Abschlussnachweis erfasst die akzeptierte Prüfsumme, das Quellenmanifest, die entfernte Aussage, die Entscheidung der prüfenden Person, verbleibende Unbekannte und die Leitung des operativen Einkaufs als nächste verantwortliche Person. Er behauptet nicht, dass die Anbieter genehmigt oder kontaktiert wurden.

## Warum ungewisse Schreibvorgänge einen eigenen Wiederherstellungsweg benötigen

Ein neuer Versuch ist nur dann angemessen, wenn Fehler und Nebenwirkungen eine Wiederholung sicher machen. OpenAIs [Praxisleitfaden zum Aufbau von Agenten](https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/) empfiehlt, das Risiko eines Werkzeugs anhand von Faktoren wie Lese- gegenüber Schreibzugriff, Umkehrbarkeit, Berechtigungen und finanziellen Folgen zu bewerten. Er beschreibt auch menschliches Eingreifen bei Fehlerschwellen sowie risikoreichen oder unumkehrbaren Handlungen.

NIST AI 600-1 enthält Governance-Maßnahmen für definierte Rollen, menschliche Aufsicht, aufbewahrte Evaluationsverläufe, Deaktivierung, Reaktion auf Vorfälle und Ausweichoptionen bei Abhängigkeiten. [NIST beschreibt das Profil für generative KI als freiwillige branchenübergreifende Orientierungshilfe](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence). Diese Maßnahmen sind daher Orientierungshilfen und keine Zertifizierung, gesetzliche Vorgabe oder ein Produktnachweis.

Bei einem ungewissen Schreibvorgang lautet die betriebliche Frage nicht: „Kann der Agent es noch einmal versuchen?“ Sie lautet: „Kann die verantwortliche Person feststellen, ob die erste Wirkung eingetreten ist?“ Die Antwort bestimmt den Zweig:

| Beobachteter Zustand | Sichere Aufzeichnung | Nächste Handlung |
|---|---|---|
| Die erwartete Wirkung ist vorhanden und entspricht dem genehmigten Ziel und der genehmigten Nutzlast | `RECOVERED` | Wirkung beibehalten und ohne Wiederholung mit der Prüfung fortfahren. |
| Das Ziel ist prüfbar und die erwartete Wirkung ist nicht vorhanden | `RETRY_ELIGIBLE` | Einen neuen Versuch mit neuer Identität und demselben oder einem überarbeiteten Umfang genehmigen. |
| Die Wirkung ist eingetreten, weicht aber von der Freigabe ab | `REMEDIATION_REQUIRED` | Normale Arbeit stoppen, Evidenz bewahren und Reparatur oder Ausgleich zuweisen. |
| Das Ziel ist nicht prüfbar oder Evidenz widerspricht sich | `WRITE_UNCERTAIN` | Stoppen. Keinen neuen Versuch starten, bis stärkere Evidenz die Nebenwirkung klärt. |

Diese Unterscheidung ist auch dann wichtig, wenn ein Ausführungssystem einen Fehler meldet. Eine Fehlermeldung kann gleichzeitig mit einer abgeschlossenen externen Wirkung bestehen.

## Arbeitsblatt zum Betriebsvertrag

Verwenden Sie dieses Arbeitsblatt, bevor Sie einem Agenten wiederkehrende oder folgenreiche Arbeit zuweisen. Lassen Sie leere Felder als ungelöste Arbeit sichtbar.

| Feld | Eintrag |
|---|---|
| **1. Anfrage- oder Arbeits-ID** | Stabile Identität, die Anfrage, Versuche, Artefakte und Nachweise gemeinsam verwenden. |
| **2. Beabsichtigtes Ergebnis und verantwortliche Person** | Das Geschäftsergebnis, wer es abnimmt und wozu die Abnahme nicht berechtigt. |
| **3. Aufgabe und Nicht-Ziele** | Enthaltene Arbeit, ausgeschlossene Arbeit, verbotene Ergebnisse und vorhersehbarer Missbrauch. |
| **4. Eingaben und Quellenidentitäten** | Verantwortliche für Quellen, Versionen oder Daten, Aktualitätsgrenzen, bei Bedarf Prüfsummen und die Regel für fehlende Daten. |
| **5. Verantwortungsmatrix** | Agent oder Workflow-Rolle, Betreiber, für die Freigabe verantwortliche Person, prüfende Person, für die Wiederherstellung verantwortliche Person und nächste verantwortliche Person. |
| **6. Zulässige Werkzeuge und Daten** | Lese- und Schreibumfang, zulässige Ziele, Datenklassen, Berechtigungsgrenze und Aufbewahrungsregel. |
| **7. Verbotene Handlungen** | Externe Schreibvorgänge, Nachrichten, Käufe, Einreichungen, Änderungen von Berechtigungen, Veröffentlichungen oder andere ausgeschlossene Wirkungen. |
| **8. Eingangskriterien und Abschlussnachweis** | Was vor Beginn der Arbeit erfüllt sein muss und welcher Nachweis belegt, dass die Etappe abgeschlossen werden kann. |
| **9. Identität der folgenreichen Handlung** | Genaues Ziel, unveränderlicher Nutzlast-Hash, Handlungsklasse, Freigabeumfang und Gültigkeitsende der Freigabe. |
| **10. Freigabeauslöser und verantwortliche Person** | Welche Handlung eine Entscheidung benötigt, wer entscheidet, welche Evidenz geprüft wird und wie die Entscheidung erfasst wird. |
| **11. Nachweis der Ausführung und Nebenwirkung** | Versuchs-ID, Zeitstempel, Werkzeugergebnis, Beobachtung des Ziels, Artefaktprüfsumme und widersprüchliche Evidenz. |
| **12. Prüfprotokoll** | Abnahmekriterien, Identität und Typ der prüfenden Person, geprüfte Evidenz, Ergebnis, Unsicherheit und Grenzen. |
| **13. Fehler und Wiederherstellung** | Fehlerklassen, Berechtigung zu einem neuen Versuch, Höchstzahl der Versuche, Abgleichmethode, für die Wiederherstellung verantwortliche Person und Ausgleichsweg. |
| **14. Unbekannte und Außerdienststellung** | Ungelöste Fakten, aufbewahrte Evidenz, Stoppbedingung, Deaktivierungsregel und Prüfdatum. |
| **15. Nächste Handlung und Endzustand** | Akzeptiertes Artefakt, nächste verantwortliche Person, nächste Entscheidung und ob die Arbeit akzeptiert, zu überarbeiten, zurückgestellt, gestoppt oder außer Dienst gestellt ist. |

### Kompakte kopierbare Fassung

```text
Arbeits-ID:
Für das Ergebnis verantwortliche Person:
Ergebnis:
Aufgabengrenze:
Nicht-Ziele:
Eingaben und Quellenversionen:
Agent oder Workflow-Rolle:
Betreiber:
Prüfende Person und ihr Typ:
Für die Wiederherstellung verantwortliche Person:
Zulässige Werkzeuge und Daten:
Verbotene Handlungen:
Eingangskriterien:
Abschlussnachweis:
Ziel- und Nutzlastidentität:
Freigabeauslöser und verantwortliche Person:
Ausführungsnachweis:
Prüfkriterien und Ergebnis:
Fehlerklassen:
Abgleichmethode:
Höchstzahl der Versuche:
Unbekannte:
Stopp- oder Außerdienststellungsbedingung:
Nächste Handlung und verantwortliche Person:
```

## Stoppbedingungen

Stoppen oder übergeben Sie die Kontrolle, wenn eine dieser Bedingungen erfüllt ist:

- Eine risikoreiche, sensible oder unumkehrbare Handlung benötigt eine verantwortliche Freigabe.
- Die Aufgabe verlässt ihren akzeptierten Umfang oder benötigt ein nicht genehmigtes Werkzeug, eine nicht genehmigte Quelle, ein nicht genehmigtes Ziel oder eine nicht genehmigte Berechtigung.
- Die Fehlerschwelle oder Höchstzahl der Versuche ist erreicht.
- Eine mögliche externe Nebenwirkung kann nicht abgeglichen werden.
- Tragende Evidenz fehlt, ist veraltet, widersprüchlich oder lässt sich nicht mit dem Artefakt verbinden.
- Die prüfende oder die für die Wiederherstellung verantwortliche Person ist nicht verfügbar.
- Die Ausgabe erfüllt eine zwingende Abnahmebedingung nicht.
- Ein deterministischer Workflow kann die Aufgabe mit weniger Ermessensspielraum vorhersehbarer ausführen.
- Der erwartete Wert rechtfertigt Kosten, Verzögerung oder Risiko nicht mehr.
- Fragen zu Richtlinien, Recht, Datenschutz, Sicherheit oder dem Fachgebiet erfordern eine qualifizierte verantwortliche Person außerhalb der Befugnisse des Agenten.

Ein Stopp ist ein gültiges Ergebnis, wenn er Evidenz bewahrt und die nächste verantwortliche Person benennt. Ohne Befugnis fortzufahren ist kein Fortschritt.

## Ein dokumentierter Organisationsvertrag liefert Evidenz für den Betriebsentwurf

Die untersuchte SEO-Growth-Organisation liefert ein Beispiel für einen dokumentierten Betriebsentwurf. Ihr Handbuch und ihre Routineaufzeichnungen weisen Etappenverantwortliche, Eingaben, Entscheidungen, Ausgaben, Sperren, Callback-Zustände, Prüfsummen und Nachweise zu. Der dokumentierte Vertrag behält folgenreiche externe Handlungen außerdem einem aktiven Freigabeschritt vor.

Diese Aufzeichnungen zeigen, was die Organisation entworfen und dokumentiert hat. Sie belegen nicht, dass Toone Desktop den Vertrag durchgesetzt, jede Etappe ausgeführt, einen vollständigen Verlauf aufbewahrt, automatisch wiederhergestellt oder ein Geschäftsergebnis erzielt hat. Dieser Artikel verwendet sie ausschließlich, um den Unterschied zwischen einer **dokumentierten Gestaltungsregel** und einem **Quellenfakt** zu veranschaulichen.

## Wählen Sie die nächste verantwortliche Person anhand der offenen Frage

Wenn die offene Frage lautet, wer eine Handlung genehmigen oder ein verbleibendes Risiko akzeptieren darf, lesen Sie unter [Governance für KI-Agenten (Englisch)](/en/governance) weiter. Wenn das Team zuerst Kontext zur Kategorie benötigt, lesen Sie den [Leitfaden zum KI-nativen Unternehmen (Englisch)](/en/guides/ai-native-company). Nutzen Sie die [Fallbeispiele (Englisch)](/en/showcases) nur für Nachweise, die auf diesen Seiten dokumentiert sind.

Verwandte Referenzseiten für Organisationswissen, Agentenorganisationen, Routinen, Evaluation und Beobachtbarkeit sollten hier verlinkt werden, sobald ihre kanonischen Routen verfügbar sind. Dieser Entwurf behandelt geplante Routen nicht als aktuelle Nachweise.

## Über diesen Leitfaden

**Wer:** Toone Content ist der organisatorische Autor und Hexagonal.io der Herausgeber. Der Agent `Content Editor` trägt die Verantwortung für die redaktionelle Prüfung dieses Entwurfs. Es wird keine Prüfung durch einen Menschen, einen Verantwortlichen des Fachgebiets oder aus den Bereichen Produkt, Entwicklung, Sicherheit, Datenschutz oder Recht und auch keine Prüfung durch Fachleute behauptet.

**Wie:** Der Leitfaden wurde anhand eines bei G1 genehmigten Briefings und eines durch Prüfsumme festgeschriebenen Dossiers zu Aussagen und Quellen erstellt. Automatisierte Unterstützung half dabei, aktuelle Primärleitlinien von Microsoft, OpenAI, Anthropic und NIST zu sammeln, zu ordnen und zusammenzuführen. Die fünf Evidenzkategorien, der Ablauf in acht Etappen, das Fehlerbeispiel und das Arbeitsblatt sind redaktionelle Synthesen. Das Beispiel zur Anbieterrecherche ist fiktiv. In den Artikel flossen weder ein Toone-Produkttest noch eine Kundenimplementierung, Leistungsstudie oder Benchmark ein.

**Warum:** Der Leitfaden soll Betreibern und Teamleitungen helfen, Agentenarbeit von der Anfrage bis zur Prüfung nachvollziehbar zu machen, mit klaren Befugnissen, Evidenz, Fehler-, Wiederherstellungs- und Abschlusszuständen.

**Grenzen und Korrekturen:** Betriebliche Anforderungen unterscheiden sich je nach Aufgabe, Risiko, Rechtsraum und System. Rechtliche, regulierte, sicherheitskritische, datenschutz- und sicherheitsbezogene sowie andere folgenreiche Arbeit erfordert eine qualifizierte Prüfung über dieses redaktionelle Modell hinaus. Lesen Sie die [Richtlinie zu Redaktion, Quellen und Korrekturen (Englisch)](/en/editorial-policy). Nutzen Sie für allgemeine Fragen die [Kontaktseite von Toone (Englisch)](/en/contact). Senden Sie Korrekturen mit der betroffenen URL und stützender Evidenz an [hello@trytoone.com](mailto:hello@trytoone.com). Bei wesentlichen Korrekturen sollte das Quelldatum aktualisiert werden; abhängige Sprachfassungen sind bis zum Abschluss ihrer Prüfung ungültig.

## Primärquellen

- [Microsoft Learn: Geschäftsplan für KI-Agenten](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ai-agents/business-strategy-plan), aktualisiert am 10.04.2026.
- [OpenAI: Ein Praxisleitfaden zum Aufbau von Agenten](https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/), abgerufen am 13.08.2026.
- [Anthropic: Wirksame Agenten entwickeln](https://www.anthropic.com/engineering/building-effective-agents), veröffentlicht am 19.12.2024.
- [NIST AI 600-1: Rahmenwerk für das Risikomanagement künstlicher Intelligenz, Profil für generative künstliche Intelligenz](https://doi.org/10.6028/NIST.AI.600-1), veröffentlicht am 26.07.2024.
