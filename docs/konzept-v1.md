# Konzept Version 1: Nachhol-App Englisch 6 („Auffrischen mit Mr. Alex“)

Stand: 10.10.2026. Abgesegnet von Mr. Alex, außer den Abschnitten mit **[ENTWURF – noch abzusegnen]**.
Grundprinzip: **Vor jedem Bauschritt wird Mr. Alex gefragt und segnet ab.**

Hintergrund: siehe `docs/briefing.md`.

---

## 1. Rahmen

- **Zielgruppe:** Adrian, Abdul A. und Mirhat (fehlen freitags). Arbeit zu Hause, allein oder zu zweit.
- **Ausgabe:** Mr. Alex gibt das Paket am Mittwoch aus, Bearbeitung bis zur nächsten Woche.
- **Version 1 = reines Nacharbeiten / Auffrischen** nach den Herbstferien. Noch **kein** Inhalt der kommenden Freitagsstunde (die erstellt Mr. Alex zuerst selbst).
- **Keine Stillarbeit** als eigener Teil (das ist ein Element für den Unterricht in der Klasse).
- **Reihenfolge in jeder Station:** erst Listen and Repeat (Assimil), dann die Erklärung auf Deutsch, dann eine kleine Übung.
- **Geräte:** Hauptgerät ist der Windows-Laptop mit Touchscreen. Handy muss ebenfalls funktionieren.
  - große Schaltflächen (fingerbreit), nichts funktioniert nur per Mauszeiger-Hover
  - Laptop-Tasten: Leertaste = Abspielen, Pfeil rechts = Weiter
  - Laptop: Englisch links, Deutsch rechts. Handy: Englisch oben, Deutsch darunter.
- **Datenschutz:** keine Konten, keine Namen. Fortschritt und notierte Fragen nur im Gerät (lokal).
- **Eigene Texte** im Assimil-Stil, kein Cornelsen-Material.
- **Spracheingabe (Win+H) vorerst weggelassen**, bis die IT-Frage geklärt ist.

## 2. Ansprache und Feedback

- In allen Texten an die Kinder steht immer „du“ oder „wir“, nie „man“. Beispiele: „Lernen wir jetzt die Uhrzeiten!“, „Hören wir zu.“, „Sprich nach!“
- Die App spricht als **Mr. Alex**.
- **Lob** (zufällig wechselnd):
  - „Du bist ein Superstar!“
  - „Wahnsinn!“
  - „Superpower!“
  - „Ich kann es nicht glauben, wie krass du bist!“
- **Bei Fehlern:** immer „Ich helfe dir:“ und danach ein konkreter Hinweis, dann ein neuer Versuch. Kein rotes X, keine Punktabzüge.
  - Beispiel: „Ich helfe dir: Bei he, she, it braucht das Verb ein -s. Probier's nochmal!“
- **Ende jeder Station:** „Station 2 geschafft! Du bist ein Superstar bei he/she/it!“
- **Ende des Pakets:** „Wahnsinn, du hast alles geschafft! Wenn etwas unklar ist, frag mich am Mittwoch – ich helfe dir gern. Dein Mr. Alex“

## 3. Aufbau

**Startseite:** Begrüßung, fünf große Kacheln mit Symbol und einem Häkchen, wenn die Station erledigt ist. Dazu der Knopf **„✏️ Frage für Mr. Alex notieren“**.
- Die Frage wird getippt und nur im Gerät gespeichert.
- Das Kind zeigt die Fragen am Mittwoch.
- Es gibt keine KI-Antwort und keine Diktieranleitung.

| Station | Inhalt |
|---|---|
| 1 Wege zur Schule | Listen and Repeat, Hörverstehen |
| 2 he / she / it + s | Teil A regelmäßig, Übersicht, Teil B Ausnahmen, Ausnahmen-Übersicht |
| 3 Uhrzeiten | Listen and Repeat, Erklärung a.m./p.m., Uhr → Sprechweise wählen |
| 4 Aufgaben verstehen | true / false / not in the text; cycle vs. circle |
| 5 Spiele | Memory (Symbol ↔ Wort), -s-Detektiv |
| 6 Hörverstehen | Hörübungen (true/false oder Weg zuordnen), jede Woche erweiterbar über `inhalte/hoeren/` |

**Listen and Repeat (Assimil):**
- **Stufe 1:** Englisch hören und nachsprechen. Das Deutsche ist ausgeblendet und lässt sich antippen.
- **Stufe 2:** Englisch links, Deutsch rechts.
- **Stufe 3:** Deutsch links (wird gesprochen), Englisch rechts mit Lücke (Zielwort). Danach „Lösung“: der ganze Satz wird gezeigt und gesprochen.
- **Stufe 4:** Nur der deutsche Satz (wird gesprochen). Das Kind sagt den ganzen englischen Satz. Danach „Lösung“: der Satz wird gezeigt und gesprochen.
- **Grundsatz:** Wird eine Lösung gezeigt, wird sie immer auch abgespielt.
- Nach jedem Satz erscheint der Balken **„Jetzt du!“** mit einer Pause zum Nachsprechen.
- Jedes Schlüsselwort hat ein festes, schlichtes Symbol, das überall gleich bleibt.

**Bonus (Weg A: großer Satzvorrat):** Nach dem Kernstoff jeder Station gibt es ⭐ **Bonus** und 🚀 **Superpower-Bonus**.
- Der Knopf **„Mehr Sätze, bitte!“** zieht immer neue Sätze in zufälliger Reihenfolge.
- Der Vorrat steht in Textdateien und lässt sich jederzeit erweitern.

## 4. Stimmen

- Jeder englische Satz wird zweimal gesprochen: erst von einer britischen Männerstimme, dann von einer britischen Frauenstimme. Für das Deutsche gibt es eine deutsche Stimme.
- **Festgelegt nach der Hörprobe (10.10.2026):** junge britische Männerstimme „Elrond“, britische Frauenstimme „Alice“, deutsche Stimme „Daniel“. Tempo 0,9. Uhrzeiten werden ausgeschrieben an die Stimme gegeben.
- Die Audios werden einmal vorab mit **ElevenLabs** erzeugt und liegen fest in der App. Google Cloud bleibt die Alternative.
- **Erster Schritt:** eine Hörprobe mit 3 Sätzen zur Qualitätsprüfung (erledigt, siehe `hoerprobe/`).
- **Backup:** Mr. Alex bekommt eine Liste aller Sprechtexte mit Dateinamen und kann selbst aufnehmen (gleiche Dateinamen ersetzen die KI-Audios).

---

## 5. Kernsätze (abgesegnet)

Schreibweise: Das Wort in `[eckigen Klammern]` ist in Stufe 3 die Lücke.

### Station 1 – Wege zur Schule
Die Fußballer-Sätze werden mit „Stell dir vor …“ eingeleitet, weil sie spielerisch gemeint sind.

| Englisch | Deutsch |
|---|---|
| I go to school by [bus]. | Ich fahre mit dem Bus zur Schule. |
| Harry Kane goes to training by [car]. | Harry Kane fährt mit dem Auto zum Training. |
| Jude Bellingham goes to the stadium by [bus]. | Jude Bellingham fährt mit dem Bus zum Stadion. |
| Bukayo Saka goes to training by [bike]. | Bukayo Saka fährt mit dem Fahrrad zum Training. |
| Mia goes to school by [train]. | Mia fährt mit dem Zug zur Schule. |
| I [walk] to school. | Ich gehe zu Fuß zur Schule. |
| It's a [short] journey. | Es ist eine kurze Fahrt. |
| It's a [long] way. | Es ist ein weiter Weg. |
| I'm [stressed]. | Ich bin gestresst. |
| That's [great]! | Das ist toll! |

### Station 2 – he / she / it + s
Lücke in Stufe 3: das Verb mit -s. Deutsche Übersetzungen siehe `inhalte/kernsaetze.tsv` (abgesegnet nach dem Abhören).

**Teil A: regelmäßig (nur -s)**

| I … | he / she … |
|---|---|
| I play football. | Ben play**s** football. |
| I like music. | Mia like**s** music. |
| I walk to school. | She walk**s** to school. |
| I get up at 7 o'clock. | He get**s** up at 7 o'clock. |
| I read a book. | Mia read**s** a book. |
| I eat breakfast at 7.30. | Ben eat**s** breakfast at 7.30. |

**Übersicht:**

| | |
|---|---|
| I | walk to school. |
| you | walk to school. |
| he / she / it | walk**s** to school. |
| we | walk to school. |
| you | walk to school. |
| they | walk to school. |

Merksatz: **„he, she, it – das s muss mit!“**

**Teil B: Ausnahmen (zuerst die Sätze)**

| I … | he / she … |
|---|---|
| I go to school. | He go**es** to school. |
| I do my homework. | She do**es** her homework. |
| I watch TV. | Ben watch**es** TV. |
| I wash my face. | Mia wash**es** her face. |
| I have breakfast. | He **has** breakfast. |

**Ausnahmen-Übersicht:**
- Verben auf **-o** bekommen **-es**: go → goes, do → does
- Verben auf **-sh, -ch, -s, -x** bekommen **-es**: wash → washes, watch → watches, kiss → kisses, mix → mixes
- **Ganz besonders:** have → **has**
- Bewusst weggelassen, weil noch nicht dran: study → studies und Ähnliches.

### Station 3 – Uhrzeiten
| Englisch | gesprochen | Deutsch |
|---|---|---|
| I get up at 6.45 a.m. | six forty-five a.m. | Ich stehe um 6.45 Uhr auf. |
| She gets up at 7 o'clock. | seven o'clock | Sie steht um 7 Uhr auf. |
| He has breakfast at 7.15 a.m. | seven fifteen a.m. | Er frühstückt um 7.15 Uhr. |
| School starts at 8 a.m. | eight a.m. | Die Schule beginnt um 8 Uhr. |
| Mia meets Ben at 3.20 p.m. | three twenty p.m. | Mia trifft Ben um 15.20 Uhr. |
| He goes to bed at 9 p.m. | nine p.m. | Er geht um 21 Uhr ins Bett. |

Erklärung danach:
- a.m. gilt von Mitternacht bis Mittag, p.m. von Mittag bis Mitternacht.
- Aus 13.15 Uhr wird „one fifteen p.m.“, weil wir 12 abziehen.

### Station 4 – Aufgaben verstehen
- Mini-Text „Ben's Saturday“ mit Aussagen zu true / false / not in the text. Der Hinweis dazu: „Steht das wirklich im Text? Wenn nicht: not in the text!“
- Hörpaar: *I cycle to school.* (Rad fahren) und *Draw a circle.* (Kreis). Danach hört das Kind ein Wort und wählt das richtige Bild.

### Station 5 – Spiele
- **Memory:** Symbol und englisches Wort finden zusammen. Beim Aufdecken wird das Wort gesprochen.
- **-s-Detektiv:** In manchen Sätzen fehlt das -s (*Emily get up at 7.*). Das Kind tippt das Verb an und repariert es. Die Sätze werden aus festen Bausteinen zusammengesetzt und nur gelesen, nicht gesprochen.

---

## 6. [ENTWURF – noch abzusegnen] Hörtext Station 1: „How do you get there?“

> **Mia:** Hi, I'm Mia. I go to school by train. It's a long way, but I love it! I read on the train.
> **Ben:** Hi, I'm Ben. I walk to school. It's a short journey. That's great!
> **Harry Kane:** Hello, I'm Harry. I go to training by car. There's a lot of traffic. I'm stressed!
> **Declan Rice:** Hi, I'm Declan. I go to training by bike. I cycle every day. I love it!

Aufgabe: Wer kommt wie? (Symbol zuordnen.) Ist es für die Person gut 😊 oder nicht gut 😟?
(Mia 🚆 😊, Ben 🚶 😊, Harry 🚗 😟, Declan 🚲 😊)

## 7. [ENTWURF – noch abzusegnen] Mini-Text Station 4: „Ben's Saturday“

> On Saturday, Ben gets up at 8 o'clock. He has breakfast with his mum. At 10 a.m. he cycles to the park. He plays football with his friends. In the evening he watches TV.

| Aussage | Lösung |
|---|---|
| Ben gets up at 8 o'clock. | true |
| Ben has breakfast with his dad. | false (with his mum) |
| Ben goes to the park by bus. | false (he cycles) |
| Ben's friends are eleven years old. | not in the text |
| Ben watches TV in the evening. | true |
| Ben likes chess. | not in the text |

---

## 8. [ENTWURF – noch abzusegnen] Bonus-Satzvorrat

### Station 1 – Wege zur Schule

**⭐ Bonus**

| Englisch | Deutsch |
|---|---|
| My dad takes me to school by [car]. | Mein Papa bringt mich mit dem Auto zur Schule. |
| The bus is [late]. That's horrible! | Der Bus ist spät dran. Das ist schrecklich! |
| Phil Foden goes to training by [train]. | Phil Foden fährt mit dem Zug zum Training. |
| Cole Palmer [walks] to the stadium. | Cole Palmer geht zu Fuß zum Stadion. |
| Declan Rice goes to training by [bike]. | Declan Rice fährt mit dem Fahrrad zum Training. |
| Ben walks to school with his [sister]. | Ben geht mit seiner Schwester zu Fuß zur Schule. |
| I go to school by [tram]. | Ich fahre mit der Straßenbahn zur Schule. |
| My friend goes to school by [bus]. | Mein Freund fährt mit dem Bus zur Schule. |
| It's a short journey. I [love] it! | Es ist eine kurze Fahrt. Ich liebe es! |
| It's a long way. I'm [tired]. | Es ist ein weiter Weg. Ich bin müde. |
| I go to school [on foot]. | Ich gehe zu Fuß zur Schule. |
| Mia goes to school by bike. She's [happy]. | Mia fährt mit dem Fahrrad zur Schule. Sie ist glücklich. |
| The train is [fast]. | Der Zug ist schnell. |
| The bus is [full]. | Der Bus ist voll. |
| I meet my friends on the [bus]. | Ich treffe meine Freunde im Bus. |
| Harry Kane's bus is [late]. | Harry Kanes Bus ist spät dran. |
| Jude Bellingham [loves] his bike. | Jude Bellingham liebt sein Fahrrad. |
| I go to the club by [bike]. | Ich fahre mit dem Fahrrad zum Verein. |
| It's [raining]. I go by bus. | Es regnet. Ich fahre mit dem Bus. |
| That's [great]! | Das ist toll! |

**🚀 Superpower-Bonus**

| Englisch | Deutsch |
|---|---|
| It takes twenty [minutes]. | Es dauert zwanzig Minuten. |
| I love the train because I can [read]. | Ich liebe den Zug, weil ich lesen kann. |
| How do you get to [school]? | Wie kommst du zur Schule? |
| I go by bus, but sometimes I [walk]. | Ich fahre mit dem Bus, aber manchmal gehe ich zu Fuß. |
| Bukayo Saka goes to training by bike because it's [fast]. | Bukayo Saka fährt mit dem Fahrrad zum Training, weil es schnell ist. |
| My mum takes me to school by car when it [rains]. | Meine Mama bringt mich mit dem Auto zur Schule, wenn es regnet. |
| The bus is late again. I'm so [stressed]! | Der Bus ist schon wieder spät dran. Ich bin so gestresst! |
| Harry Kane and Jude Bellingham go to the stadium [together]. | Harry Kane und Jude Bellingham fahren zusammen zum Stadion. |
| It's a long way, but I [like] it. | Es ist ein weiter Weg, aber ich mag es. |
| I listen to [music] on the bus. | Ich höre im Bus Musik. |
| My school is near my [house]. | Meine Schule ist in der Nähe meines Hauses. |
| My school is far [away]. | Meine Schule ist weit weg. |
| I cycle to school every [day]. | Ich fahre jeden Tag mit dem Rad zur Schule. |
| Do you go to school by [bus]? | Fährst du mit dem Bus zur Schule? |
| Phil Foden walks to training with his [dog]. | Phil Foden geht mit seinem Hund zu Fuß zum Training. |

### Station 2 – he / she / it + s

**⭐ Bonus (regelmäßig)**

| Englisch | Deutsch |
|---|---|
| Jude Bellingham [trains] every day. | Jude Bellingham trainiert jeden Tag. |
| He [plays] for England. | Er spielt für England. |
| Harry Kane [scores] a goal. | Harry Kane schießt ein Tor. |
| Bukayo Saka [runs] very fast. | Bukayo Saka läuft sehr schnell. |
| Mia [likes] chess. | Mia mag Schach. |
| She [plays] chess with her grandpa. | Sie spielt Schach mit ihrem Opa. |
| Ben [gets] up at 7 o'clock. | Ben steht um 7 Uhr auf. |
| He [eats] an apple. | Er isst einen Apfel. |
| My sister [reads] a book. | Meine Schwester liest ein Buch. |
| My brother [listens] to music. | Mein Bruder hört Musik. |
| The dog [sleeps] in the kitchen. | Der Hund schläft in der Küche. |
| It [rains] a lot in England. | In England regnet es viel. |
| Mia [helps] her mum. | Mia hilft ihrer Mama. |
| Ben [meets] his friends at the club. | Ben trifft seine Freunde im Verein. |
| Declan Rice [drinks] water. | Declan Rice trinkt Wasser. |
| Phil Foden [likes] pizza. | Phil Foden mag Pizza. |
| She [walks] to school. | Sie geht zu Fuß zur Schule. |
| He [cycles] to the park. | Er fährt mit dem Rad zum Park. |
| My dad [cooks] dinner. | Mein Papa kocht das Abendessen. |
| My grandma [makes] a cake. | Meine Oma backt einen Kuchen. |

**⭐ Bonus (Ausnahmen)**

| Englisch | Deutsch |
|---|---|
| Harry Kane [goes] to training. | Harry Kane geht zum Training. |
| Mia [does] her homework. | Mia macht ihre Hausaufgaben. |
| Ben [watches] football on TV. | Ben schaut Fußball im Fernsehen. |
| She [has] a cat. | Sie hat eine Katze. |
| My mum [washes] the car. | Meine Mama wäscht das Auto. |
| He [has] breakfast at 7.30. | Er frühstückt um 7.30 Uhr. |
| Jude Bellingham [goes] to bed at 10 p.m. | Jude Bellingham geht um 22 Uhr ins Bett. |
| My grandpa [watches] the news. | Mein Opa schaut die Nachrichten. |
| The baby [kisses] her mum. | Das Baby küsst seine Mama. |
| Mia [mixes] the colours. | Mia mischt die Farben. |
| Ben [does] his homework after school. | Ben macht seine Hausaufgaben nach der Schule. |
| My sister [goes] to school by bus. | Meine Schwester fährt mit dem Bus zur Schule. |

**🚀 Superpower-Bonus**

| Englisch | Deutsch |
|---|---|
| My sister [watches] TV, and my brother [does] his homework. | Meine Schwester schaut fern, und mein Bruder macht seine Hausaufgaben. |
| Harry Kane [gets] up early and [goes] to training. | Harry Kane steht früh auf und geht zum Training. |
| Mia [has] breakfast, then she [goes] to school. | Mia frühstückt, dann geht sie zur Schule. |
| Ben [plays] football, but his sister [plays] chess. | Ben spielt Fußball, aber seine Schwester spielt Schach. |
| Bukayo Saka [trains] in the morning and [rests] in the afternoon. | Bukayo Saka trainiert morgens und ruht sich nachmittags aus. |
| My dad [goes] to work by train. | Mein Papa fährt mit dem Zug zur Arbeit. |
| Every Saturday, Mia [visits] her grandma. | Jeden Samstag besucht Mia ihre Oma. |
| He [watches] the match and [shouts] "Goal!" | Er schaut das Spiel und ruft „Tor!“ |
| She [washes] her hands before dinner. | Sie wäscht sich vor dem Abendessen die Hände. |
| Jude Bellingham [has] a lot of fans. | Jude Bellingham hat viele Fans. |

### Station 3 – Uhrzeiten

**⭐ Bonus**

| Englisch | gesprochen | Deutsch |
|---|---|---|
| What time is it? – It's [eight] p.m. | eight p.m. | Wie spät ist es? – Es ist 20 Uhr. |
| It's 7.30 a.m. | seven thirty a.m. | Es ist 7.30 Uhr. |
| Ben gets up at 6.30 a.m. | six thirty a.m. | Ben steht um 6.30 Uhr auf. |
| Mia has lunch at 1 p.m. | one p.m. | Mia isst um 13 Uhr zu Mittag. |
| School ends at 1.15 p.m. | one fifteen p.m. | Die Schule endet um 13.15 Uhr. |
| Harry Kane trains at 10 a.m. | ten a.m. | Harry Kane trainiert um 10 Uhr. |
| The match starts at 3 p.m. | three p.m. | Das Spiel beginnt um 15 Uhr. |
| I do my homework at 4 p.m. | four p.m. | Ich mache um 16 Uhr meine Hausaufgaben. |
| Mia plays chess at 5.30 p.m. | five thirty p.m. | Mia spielt um 17.30 Uhr Schach. |
| We have dinner at 6 p.m. | six p.m. | Wir essen um 18 Uhr zu Abend. |
| The bus comes at 7.45 a.m. | seven forty-five a.m. | Der Bus kommt um 7.45 Uhr. |
| I go to bed at 8.30 p.m. | eight thirty p.m. | Ich gehe um 20.30 Uhr ins Bett. |
| It's 12 o'clock. | twelve o'clock | Es ist 12 Uhr. |
| The train leaves at 7.10 a.m. | seven ten a.m. | Der Zug fährt um 7.10 Uhr ab. |
| Ben meets his friends at 2 p.m. | two p.m. | Ben trifft seine Freunde um 14 Uhr. |

**🚀 Superpower-Bonus**

| Englisch | gesprochen | Deutsch |
|---|---|---|
| Jude Bellingham gets up at 7 a.m. and trains at 9 a.m. | seven a.m. … nine a.m. | Jude Bellingham steht um 7 Uhr auf und trainiert um 9 Uhr. |
| The film starts at 7.30 p.m. | seven thirty p.m. | Der Film beginnt um 19.30 Uhr. |
| My school starts at 7.55 a.m. | seven fifty-five a.m. | Meine Schule beginnt um 7.55 Uhr. |
| England plays at 8.45 p.m. | eight forty-five p.m. | England spielt um 20.45 Uhr. |
| I wake up at 6.20 a.m., but I get up at 6.30 a.m. | six twenty a.m. … six thirty a.m. | Ich wache um 6.20 Uhr auf, aber ich stehe um 6.30 Uhr auf. |
| On Saturday, Mia gets up at 9.15 a.m. | nine fifteen a.m. | Am Samstag steht Mia um 9.15 Uhr auf. |
| The club starts at 4.15 p.m. | four fifteen p.m. | Der Verein beginnt um 16.15 Uhr. |
| Ben goes to bed at 9 p.m., but he reads until 9.30 p.m. | nine p.m. … nine thirty p.m. | Ben geht um 21 Uhr ins Bett, aber er liest bis 21.30 Uhr. |

### Station 4 – Aufgaben verstehen

**⭐ Bonus: weitere Aussagen zu „Ben's Saturday“**

| Aussage | Lösung |
|---|---|
| Ben plays football with his friends. | true |
| Ben goes to the park at 11 a.m. | false (at 10 a.m.) |
| Ben's mum likes football. | not in the text |
| Ben gets up at 9 o'clock. | false (at 8 o'clock) |
| Ben has a dog. | not in the text |

**⭐ Bonus: weitere Hörpaare (Wörter, die ähnlich klingen)**

| Paar | Deutsch |
|---|---|
| cycle – circle | Rad fahren – Kreis |
| walk – work | gehen – arbeiten |
| three – tree | drei – Baum |
| thirteen – thirty | dreizehn – dreißig |
| fifteen – fifty | fünfzehn – fünfzig |

---

## 9. [ENTWURF – noch abzusegnen] Station 6: Hörverstehen

Festes Format, abgesegnet am 10.10.2026: eigene Station, jede Woche neue Übungen möglich. Jede Übung ist eine Textdatei in `inhalte/hoeren/` (Aufbau: `inhalte/hoeren/LIESMICH.md`). Ablauf: Text hören → Aufgaben → Text zum Mitlesen.

**Grundprinzip (abgesegnet):**
1. Überschrift, englische Anweisung (z. B. „Listen and tick: true or false?“), alle Aufgaben untereinander und der Hinweis „Lies dir zuerst alle Sätze durch, damit du weißt, worauf du beim Hören achten musst.“
2. Der ganze Text wird gehört; markiert wird währenddessen auf derselben Seite und bleibt änderbar. Die Aussagen haben dabei kein Audio.
3. Immer zwei Durchgänge. Keine Hörbegrenzung, aber nach zwei kompletten Durchgängen der Hinweis „Achtung: Im GLN gibt es nur zwei Hörversuche. Zum Üben darfst du gerne öfter hören.“ Erst dann erscheint „Lösung zeigen“.
4. Lösung mit Audio, danach Text zum Mitlesen.

Arten: **true-false** und **weg** (pro Person Verkehrsmittel und „gut / nicht gut / beides“), beide nach demselben Prinzip.

Entwürfe der Inhalte:
- `01-mias-monday.txt`: Mias Tagesablauf (true/false, 7 Aussagen)
- `02-how-do-you-get-there.txt`: Text aus Abschnitt 6 (Weg zuordnen)

## 10. Station 7: Vokabeln (Vorbereitung KLN)

- Wortschatz: komplette Unit 3 aus dem Vokabelteil des Buchs (S. 234–239), **in Buchreihenfolge**, gegliedert nach Unit-Start, Topic 1–3, Story, Study skills, Unit task (`inhalte/vokabeln.tsv`, 104 Einträge). Nur für den internen Gebrauch, nicht öffentlich.
- In der Station wird zuerst ein Abschnitt gewählt; lange Abschnitte sind in Teile mit höchstens 13 Wörtern geteilt. Jeder Abschnitt bekommt ein eigenes Häkchen.
- Ablauf je Abschnitt: Wörter (Bild, Englisch, Deutsch, „Jetzt du!“) → Lückensätze (nur wo es einen passenden Kernsatz gibt) → Englisch → Deutsch → Deutsch → Englisch. Bei der Lösung wird Englisch und Deutsch gesprochen; danach „Gewusst“ oder „Nochmal üben“.
- Stimme Englisch: **George** (britisch, männlich). Deutsch: Daniel.
- Bilder: vorerst feste Symbole (Emojis).
