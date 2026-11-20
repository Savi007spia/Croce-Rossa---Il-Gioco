# Chronicles of Destiny — Web Edition alpha 0.1.7

Aggiunta la mini-mappa cooperativa:
- Durante una sessione multiplayer compare un radar sempre visibile nella schermata di gioco.
- Mostra il Portatore locale al centro e il compagno con un indicatore distinto.
- La posizione del compagno si aggiorna in tempo reale usando i pacchetti di posizione già scambiati tramite PeerJS.
- La distanza relativa è indicata in unità del mondo; se il compagno supera il raggio del radar, l'indicatore resta sul bordo.
- In single player il radar rimane nascosto. Nessuna modifica ai salvataggi o agli inventari.

Nota: è una mini-mappa relativa (non una cartografia completa del mondo); rappresenta la direzione e la distanza del compagno rispetto al giocatore locale.
