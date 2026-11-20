# Chronicles of Destiny — Web Edition alpha 0.1.3

Aggiornamenti:
- Inventario e pannelli in stile dark fantasy/soulslike, con schede oggetto, emblemi SVG originali, descrizioni, rarità, requisiti, statistiche, bonus e malus.
- Equipaggiamento con bonus numerici applicati a HP, attacco, difesa, magia, velocità, fortuna e critico; gli scudi possono annullare colpi e gli anelli con bonus al danno influenzano gli attacchi.
- Cielo procedurale con Sole e Luna visibili, illuminazione direzionale variabile, ombre, alba/tramonto/notte in base all’ora locale del PC e al giorno dell’anno.
- Meteo simulato dinamico: sereno, nuvoloso, pioggia e nebbia, con nuvole, precipitazioni e variazioni di foschia/illuminazione. Non usa dati meteorologici reali online.
- Supporto Gamepad API: stick sinistro per movimento, stick destro per telecamera, pulsanti per interazione, menu e combattimento; D-pad per navigare i controlli dell’interfaccia.
- Nuova schermata Impostazioni accessibile dal titolo e dalla pausa, con rimappatura dei tasti e dei pulsanti del controller salvata in localStorage.
- La guida dei comandi e l’HUD mostrano anche i controlli del gamepad.

Nota tecnica: il cielo segue l’orologio locale del browser e una stima stagionale della durata del giorno per latitudini temperate dell’emisfero nord; non è una simulazione astronomica geolocalizzata. Il rendering Babylon.js richiede connessione Internet al CDN come nelle versioni precedenti.
