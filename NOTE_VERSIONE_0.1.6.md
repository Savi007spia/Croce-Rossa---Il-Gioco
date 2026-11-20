# Chronicles of Destiny — Web Edition alpha 0.1.6

Prima implementazione sperimentale della cooperativa online (massimo 2 giocatori):
- Nuova voce Cooperativa online dal titolo e possibilità di ospitare la partita corrente dal menu pausa.
- L’host apre una stanza con codice di 6 caratteri; il secondo giocatore inserisce il codice e crea il proprio personaggio.
- Il salvataggio principale resta nello slot locale dell’host. Il client mantiene un salvataggio locale con personaggio e inventario propri.
- Sincronizzazione sperimentale dello stato della cronaca e della posizione dell’altro Portatore.
- Il single player e i suoi slot restano disponibili.

**Limiti alpha:** la rete usa PeerJS/WebRTC con servizio di segnalazione pubblico; non è un server di gioco dedicato. Alcune combinazioni di router/firewall/NAT possono impedire la connessione diretta e richiedere un servizio TURN. La cooperativa sincronizza la progressione della cronaca, ma non rende ancora tutti gli eventi di combattimento e tutte le interazioni pienamente autoritativi e simultanei: è un prototipo da testare su due dispositivi reali. Serve Internet per caricare PeerJS e per collegare i due giocatori.
