# Croce Rossa: Il nostro turno

La partita è una breve avventura in sei tappe dedicata alle attività attuali dei turni di volontariato: preparazione, eccedenze solidali e scarico AGEA, distribuzione viveri, Unità di Strada, assistenza sanitaria e trasporto infermi, passaggio di consegne. Non include una cronologia storica. Il catalogo facoltativo raccoglie altre attività della comunità.

Il personaggio sceglie un ruolo di squadra: Soccorritore, Operatore sociale, Logista o Volontario di Protezione Civile. Concludendo ciascuna tappa principale si ottiene il distintivo corrispondente, visibile nell'Album dei distintivi del Diario.

All'avvio scegli Computer, Telefono o tablet, oppure Meta Quest 3. I comandi e la guida si adattano alla scelta; su Quest il pulsante **Entra nel visore** avvia una sessione WebXR immersiva con supporto ai controller.

Le uniformi e gli ambienti usano colori ispirati alla Croce Rossa e alla vita di comunità. La partita è un'avventura interattiva per bambini, non materiale formativo o operativo: le attività reali richiedono formazione, autorizzazione e procedure del Comitato di appartenenza. La build 2D originale resta conservata nell'archivio `SOURCE_2D_REFERENCE.zip`.

## Avvio su Windows

1. Estrai tutto lo ZIP in una cartella.
2. Fai doppio clic su `AVVIA_WEB.bat`.
3. Si aprirà il browser. Lascia aperta la finestra nera del server finché giochi.

Serve Python 3 per avviare il piccolo server locale e una connessione Internet per caricare Babylon.js e i font dal CDN la prima volta. Non serve installare Pygame, Ursina, Node o Gradle. Non aprire `index.html` direttamente: i contenuti del gioco vengono caricati dal server locale.

### Dispositivi

- **Computer:** apri il gioco con `AVVIA_WEB.bat`; usa tastiera e mouse oppure un controller compatibile.
- **Telefono o tablet:** collega PC e dispositivo alla stessa rete Wi-Fi, avvia `AVVIA_WEB.bat` sul PC e apri sul telefono uno degli indirizzi LAN stampati nella finestra del server (per esempio `http://192.168.1.20:8765/index.html`). Se Windows chiede il permesso per Python, consentilo solo sulle reti private di fiducia. Poi scegli la modalità telefono/tablet. Il server condivide solo i file necessari al gioco.
- **Meta Quest 3:** per la modalità VR, pubblica la cartella web su un indirizzo **HTTPS** raggiungibile dal browser Meta Quest, aprilo nel visore e scegli Meta Quest 3. Il server locale stampa un link HTTP per la rete Wi-Fi, ma quel link non abilita WebXR: la VR richiede HTTPS, un browser compatibile e il consenso dopo aver premuto **Entra nel visore**. Chiedere a un adulto di preparare il visore e l'area di gioco.

## Funzioni mantenute

- Sei tappe giocabili brevi e un catalogo facoltativo di attività attuali.
- Quattro ruoli di volontariato con divise e illustrazioni dedicate. I vecchi salvataggi vengono adattati ai nuovi ruoli e alle sei tappe.
- Scelta iniziale del dispositivo, comandi contestuali per PC e mobile e modalità immersiva WebXR con controller per Quest.
- Album di sei distintivi, uno per ogni tappa completata; la guida spiega come ottenerli.
- Turni secondari su raccolta, distribuzione alimentare, UDS, assistenza, trasporto, accoglienza, salute e protezione civile.
- Esplorazione 3D, dialoghi, scelte, inventario, scheda, equipaggiamento, multiplayer e quattro slot locali.
- Quartiere contemporaneo con Comitato, magazzino, punto di ascolto, area mezzi, distribuzione e giardino; sette luoghi interattivi si raccolgono nel Diario.
- Le prove sono simulazioni di gioco e non descrivono procedure di soccorso reali.

La cronaca sostitutiva e i dati delle missioni sono in `data/red_cross_story.json`; l'archivio di supporto alle meccaniche resta in `data/chronicles_content.json`.

## Novità della alpha 0.1.2

- Ciclo di camminata articolato: le gambe alternano il passo, le ginocchia si piegano e le braccia oscillano in opposizione.
- Le armi sono agganciate alle braccia e seguono il movimento, invece di restare sospese accanto al personaggio.
- La transizione tra camminata e riposo è graduale: quando smetti di muoverti, gli arti tornano naturalmente alla posizione neutra.
- I personaggi secondari hanno una lieve animazione di riposo, con respiro, piccoli movimenti della testa e mantello.

## Novità della alpha 0.1.1

- Corretta la direzione destra/sinistra del movimento.
- Telecamera orbitale più libera: trascinamento sinistro per ruotare, rotellina per lo zoom, trascinamento destro per spostare l'inquadratura e `V` per ricentrarla. La telecamera segue gli spostamenti del Portatore senza annullare il pan scelto dal giocatore.
- Personaggi 3D procedurali più articolati: volto, occhi, capelli, armatura a strati, cintura, bracciali, gambali, mantello e armi. Lyra, Kharon, Selene, Aion, Asterion e Colui che Rimane hanno dettagli e palette dedicati.
- Ripristinata la sequenza introduttiva: riassunto della storia, guida sul Dado del Destino e comandi di gioco. Le tre guide sono anche riapribili dal menu iniziale.
- La selezione della classe mostra una sagoma più dettagliata e colorata in base alla classe.
- Il server preferisce una porta locale stabile, così gli slot in `localStorage` rimangono disponibili tra un avvio e l'altro.

## Controlli

- `W A S D` oppure frecce: movimento relativo alla visuale.
- Su tablet e schermi touch usa le frecce e il pulsante **Parla / interagisci** sullo schermo; tieni premuta una freccia per camminare.
- `Shift + W` oppure doppio tocco su `W`: sprint; `Spazio`: salto.
- `X`: attacco predefinito in combattimento.
- Mouse sinistro trascinato: ruota la telecamera.
- Rotellina: avvicina/allontana la visuale.
- Tasto destro trascinato: sposta l'inquadratura.
- `V`: ricentra la telecamera sul Portatore.
- `M` oppure il pulsante **Mappa** nell'HUD: apre/chiude la mappa dell'area attuale; `Esc` la chiude.
- `E`: interagisci / continua il dialogo.
- `J`: quest e diario; `I`: inventario; `C`: scheda personaggio.
- `Esc`: pausa.
- In combattimento usa i pulsanti a schermo per attacco, tecnica, Dado, pozione e difesa.
- Il pulsante **Aiuto** durante la partita riapre le istruzioni; l'obiettivo attuale resta sempre visibile. La storia introduttiva si può saltare e rileggere dal menu iniziale.
- La difficoltà **Tranquilla** è preselezionata per chi gioca per la prima volta; prima di iniziare si può scegliere anche un livello diverso.

## Mappa, mondo e collisioni

La mappa mostra soltanto la scena e il capitolo in corso: non anticipa le aree successive. In cooperativa le posizioni di entrambi i Portatori si aggiornano in tempo reale; in solitaria mostra la posizione del giocatore nell'area locale. Il personaggio applica la gravità e collide con il terreno e le strutture solide. Strade, tetti e facciate hanno dettagli e materiali procedurali più ricchi, con illuminazione ambientale per le lanterne. Le grandi formazioni rocciose sferiche decorative sono state rimosse.

## Novità alpha 0.1.8

- Salto con `Spazio`, sprint con `Shift + W` o doppio tocco del tasto avanti. `X` è il nuovo attacco predefinito per lasciare libero il salto.
- Cielo più ricco con stelle scintillanti, Luna a fase variabile e Sole; illuminazione e ombre seguono il ciclo giorno/notte e la copertura nuvolosa.
- Dalle **Impostazioni** si può attivare il meteo locale. Solo dopo il clic il browser chiede il permesso di geolocalizzazione; le coordinate sono arrotondate e inviate a Open-Meteo per ottenere condizioni, copertura nuvolosa e orari di alba/tramonto. La posizione non viene salvata. Se la richiesta è rifiutata o il servizio non è raggiungibile, resta attivo il meteo simulato.

## Novità alpha 0.1.9

- Erenfall ha una piazza più leggibile, una strada trasversale, panchine, fioriere e altre decorazioni da villaggio.
- Le case di Mara, Teren, Faye e Nilo hanno interni distinti con arredi legati al loro lavoro e alla loro storia; sono esplorabili interagendo con la porta. Premi `E` vicino agli oggetti o a chi abita la casa per ascoltare brevi osservazioni, poi premi di nuovo `E` per chiudere.
- Sono state aggiunte abitazioni disabitate con tracce di chi potrebbe averle lasciate. Usa l'interazione **Esci dalla casa** accanto alla porta interna per tornare alla strada.
- Gli ingressi e gli arredi hanno collisioni; gli altri edifici restano inaccessibili, senza aperture che conducano a stanze vuote.

## Novità alpha 0.1.10

- Le abitazioni esplorabili di Erenfall sono più ampie e alte, mantenendo spazio tra le case e gli ingressi.
- Interni rinnovati con pavimenti ad assi, travi, pannelli, finestre illuminate, tappeti, mobili e dettagli diversi per forno, fucina, locanda e casa di Nilo. Le case vuote hanno arredi essenziali e segni di abbandono.
- Alcuni oggetti nascondono piccoli doni facoltativi: una pozione nella locanda e 6 monete nella casa vuota. Ogni dono si raccoglie una sola volta e il salvataggio ne conserva lo stato.

## Novità alpha 0.1.11

- Gli slot occupati si possono eliminare dalla schermata di scelta o dal pannello **Salva**; il gioco chiede conferma prima della cancellazione. Gli slot vuoti restano disponibili per nuove cronache e Continua si aggiorna subito.
- Dado del titolo più ricco, con facce incise e anelli ornamentali. Le illustrazioni delle classi hanno materiali sfumati, ombre e dettagli di armatura più definiti.
- Ottimizzato il rendering sui display ad alta densità, ridotti gli aggiornamenti ripetitivi di NPC, prompt, cielo e radar e limitate le ombre agli elementi architettonici. Il rendering si sospende quando la scheda del browser è nascosta.

## Novità alpha 0.1.12

- La guida dei comandi presenta due schede selezionabili: **Mouse e tastiera** e **Controller**. I comandi sono evidenziati su una tastiera, un mouse o un controller illustrato e affiancati dalle relative funzioni; la guida riflette anche le rimappature salvate.
- Il Dado del titolo ora è un cubo a sei facce allineate, con i sei kanji della storia — 運命, 法則, 記憶, 必然, 魂 e 再生 — incisi sulle facce. Gli anelli ornamentali e la rotazione restano attivi.

## Novità alpha 0.1.13

- La mappa si apre al centro dello schermo, più grande e con sfondo oscurato; la visuale dell’area e dei compagni resta nella scheda **Mappa area**.
- La scheda **Mondi e cronache** permette di consultare una breve introduzione senza anticipazioni per ogni mondo già raggiunto. I mondi futuri sono mostrati come ignoti e indicano il capitolo in cui si sbloccano.
- L’illustrazione del controller nella guida richiama il DualShock 4, con touchpad, stick, croce, tasti frontali e barra luminosa.
- Il Dado del titolo ha corpo nero, kanji bianchi e fratture luminose sulle facce; gli anelli e la rotazione sono mantenuti.

## Novità alpha 0.1.14

- La cooperativa mostra stati di connessione distinti e termina l’attesa dopo 20 secondi se il server PeerJS o l’host non risponde. Gli errori indicano di controllare codice, rete e firewall; alcune reti richiedono comunque un servizio TURN. Anche il viaggio tra Erenfall e la scena narrativa segue lo stato dell’host.
- Il pannello **Personaggio** include di nuovo tutti i talenti della cronaca. I passaggi di livello tra capitoli assegnano punti talento ogni cinque livelli; i salvataggi precedenti ricevono i punti relativi ai livelli già raggiunti. Prerequisiti e costi sono verificati prima dell’acquisto e i bonus vengono salvati.
- È possibile raggiungere Erenfall in qualunque momento dal pulsante **Rifugio**. Faye ripristina fino al 70% degli HP massimi pagando 20 monete nel primo capitolo (il costo aumenta gradualmente); Bren vende da subito rimedi essenziali e sblocca oggetti più potenti con la storia.
- La nuova cronaca inizia con 5 pozioni. Il Dado mostra i normali pallini all’inizio e le facce con kanji si rivelano dal Capitolo III; ogni lancio in combattimento consuma 35 punti Destino, recuperabili attaccando o difendendosi.
- Boss e miniboss alternano attacchi, guardia e colpi più intensi, con brevi battute durante lo scontro. La sconfitta riporta all’inizio del capitolo con metà HP e rimuove l’incontro bloccato.
- **Abbandona** sospende il combattimento: tornati al sigillo si può riprendere dal punto raggiunto oppure ricominciare con il nemico al massimo della salute.

## Novità alpha 0.1.15

- Uscendo da una casa vengono ripristinati tutti gli interagibili esterni ancora validi, inclusi NPC, obiettivi e ingressi. Parlare con i personaggi dopo aver esplorato un interno non richiede più di ricaricare la scena.
- Boss e miniboss usano ora modelli umanoidi articolati con armature, spallacci, armi e dettagli emissivi; silhouette, scala e palette cambiano in base al nome e al tipo di avversario. Aggiunti movimento d’attesa, pulsazione delle aure e animazioni di attacco e guardia.

## Novità alpha 0.1.16

- Teren apre la **Forgia** quando gli parli in città o all’interno della sua fucina. Una scheda laterale con il suo ritratto e il denaro disponibile offre tre sezioni: riparazioni, armeria e incisioni runiche.
- Armi, armature e scudi si consumano durante i combattimenti. Le riparazioni ripristinano l’integrità e l’efficacia dell’equipaggiamento in cambio di oro; è possibile riparare singoli oggetti o tutto l’equipaggiamento attualmente indossato.
- L’armeria propone armi rinforzate adatte allo stile dell’arma equipaggiata e, con i progressi, altre armi del catalogo compatibili con il livello del personaggio.
- Le rune consumano Polvere Runica e una runa scelta tra i materiali posseduti; ciascuna arma può ricevere fino a tre incisioni, con bonus persistenti ad attacco e magia.

## Novità alpha 0.1.17

- In questa versione la campagna giocabile era stata ridotta a 12 tappe brevi; la successiva alpha 0.1.19 l'ha sostituita con il percorso sui turni attuali.
- Le quattro classi iniziali sono ora ruoli volontari: Soccorritore, Operatore sociale, Logista e Volontario di Protezione Civile. I vecchi salvataggi vengono adattati ai nuovi nomi e al percorso breve.
- La creazione del personaggio permette di scegliere tonalità della pelle, acconciatura, colore dei capelli e divisa, con anteprima immediata.
- Il modello del volontario indossa la divisa del ruolo, senza armi; colori, HUD e istruzioni sono stati resi più vivaci e adatti ai bambini.
- L'aspetto scelto viene conservato nel salvataggio e non modifica il ruolo o le sue statistiche.

## Novità alpha 0.1.18

- Schermata iniziale per scegliere PC, telefono/tablet o Meta Quest 3; la selezione viene ricordata e può essere cambiata dal menu.
- Comandi, suggerimenti e guida adattati al dispositivo. La modalità Quest prepara l'esperienza WebXR immersiva, l'interazione con il controller e un overlay per i menu del browser compatibile.
- Nuovo album dei distintivi: ogni tappa completata aggiunge una ricompensa visibile al diario.
- Testi del prologo e delle spiegazioni con colore più scuro e maggiore contrasto.
- La VR richiede HTTPS, un browser con WebXR e un visore disponibile; la verifica fisica sul Quest deve essere fatta sul dispositivo.

## Novità alpha 0.1.19

- La campagna è stata riscritta in sei tappe sui turni di oggi; la cronologia storica non appare più nel gioco.
- Le tappe e il catalogo facoltativo coprono preparazione, eccedenze solidali, scarico AGEA, distribuzione viveri, UDS, assistenza sanitaria, trasporto infermi e altre attività.
- La guida spiega che concludendo ogni tappa principale si riceve un distintivo, raccolto nell'album del Diario.
- I salvataggi precedenti vengono convertiti alla nuova campagna di sei tappe senza eliminare gli slot.
- Il server locale stampa un indirizzo per telefono/tablet sulla stessa rete Wi-Fi. Il server è limitato ai file web necessari; per WebXR su Quest resta necessario HTTPS.

## Novità alpha 0.1.20

- La città medievale è stata sostituita, nella campagna Croce Rossa, da un quartiere contemporaneo con edifici e spazi riconoscibili.
- Strade, attraversamenti, fermata, mezzi, area viveri, punto di distribuzione e giardino rendono l'area più ampia e percorribile.
- Sette punti informativi interattivi raccontano i servizi e le attenzioni della squadra; le scoperte restano salvate e il Diario ne mostra il totale.
- Il punto della tappa ora è segnalato con un cartello di servizio; persone e indicazioni visive sono state adattate all'ambientazione.
- L'area Croce Rossa si svolge in luce diurna per mantenere chiari il percorso e i punti di interesse.

## Stato e limiti trasparenti

Questa è una **prima conversione web giocabile**, non ancora una trasposizione 1:1 di ogni singola regola della versione Pygame. I testi e i cataloghi sono importati integralmente nei dati web; la logica browser attuale offre un percorso narrativo completo e un motore generico per interazione, scelte e combattimenti. Le condizioni specialistiche di ogni quest, i puzzle unici, le animazioni uniche dei singoli personaggi, tutte le formule di progressione e ogni singola sequenza di cutscene devono ancora essere portati e verificati individualmente. Boss e miniboss dispongono di animazioni procedurali di attesa, attacco e guardia. I personaggi sono modelli low-poly procedurali costruiti nel codice, non ancora modelli artistici professionali importati.

La build originale 2D non viene modificata e i salvataggi web sono separati da quelli Pygame. I salvataggi web risiedono nel `localStorage` del browser e non vengono scritti nei vecchi file 2D.

## Verifiche eseguite in fase di creazione

- JSON valido e controllato: 96/96 numeri di capitolo presenti, 285 scene narrative, 18 mondi.
- Verificati i cataloghi principali: 29 classi, 68 armi, 39 armature, 34 scudi, 27 anelli.
- Sintassi JavaScript e Python verificata; i file vengono serviti correttamente dal server locale.
- Test browser: ingresso/uscita da una casa con successiva apertura del dialogo NPC; caricamento della Forgia di Teren da città e fucina; verifica delle tre sezioni, acquisto di un’arma, consumo di materiali per una runa, bonus alle statistiche e riparazione persistente dell’integrità.
- Test browser alpha 0.1.15: creazione del modello articolato di un boss e verifica delle animazioni di attacco.

## Dati e provenienza

`data/chronicles_content.json` contiene la storia e i cataloghi esportati dalla Definitive Edition 2D v1.2.2, l'ultima sorgente completa leggibile in questo ambiente. `SOURCE_2D_REFERENCE.zip` conserva quell'archivio originale senza modificarlo.


## Novità alpha 0.1.7

- Restyling illustrato delle classi, con armi distintive già nella schermata iniziale.
- Lo Spartano parte con la spada, l'Arciere con l'arco, il Barbaro con l'ascia e il Ladro con i pugnali.
- Icone SVG più varie per armi, armature, consumabili, anelli, scudi e materiali; mini-illustrazioni anche nel roster delle classi.
- Il modello 3D segue l'arma effettivamente equipaggiata e si aggiorna quando viene cambiata.

## Novità alpha 0.1.4

- L'inventario mostra soltanto l'equipaggiamento posseduto, i consumabili con quantità positiva e i materiali effettivamente presenti.
- Una nuova partita registra come posseduti soltanto l'arma, l'armatura e lo scudo iniziali; gli anelli restano vuoti finché non vengono ottenuti.
- Consumare l'ultima unità di un oggetto lo rimuove subito dalla lista.
- I salvataggi precedenti vengono migrati senza perdere l'equipaggiamento attualmente indossato. È stato aggiunto anche il supporto interno per registrare futuri oggetti ottenuti come ricompensa o raccolta.

## Novità alpha 0.1.3

- Inventario e pannelli rinnovati in stile dark fantasy, con icone vettoriali stilizzate, rarità, descrizioni, statistiche, requisiti e bonus/malus.
- Cielo e illuminazione seguono l’ora, la stagione e le condizioni meteo. Il meteo simulato resta disponibile come alternativa al meteo locale.
- Controller compatibili con la Gamepad API del browser: stick sinistro movimento, stick destro telecamera, D-pad navigazione, pulsanti configurabili.
- Le impostazioni sono accessibili dal titolo o dalla pausa; i controlli rimappati vengono salvati nel browser.
- Il ciclo solare usa un modello stagionale approssimato per latitudini temperate dell’emisfero nord, non una posizione GPS.


## Multiplayer online alpha 0.1.7
La modalità sperimentale supporta due giocatori via PeerJS/WebRTC: l’host crea una stanza e condivide il codice, mentre l’altro giocatore si unisce con il codice. L’host conserva il salvataggio principale in locale. Consulta `NOTE_VERSIONE_0.1.6.md` per i limiti e i requisiti di rete.
