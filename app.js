'use strict';

const $ = (id) => document.getElementById(id);
const canvas = $('renderCanvas');
const STORAGE_PREFIX = 'chroniclesOfDestinyWeb.slot.';
const DEVICE_MODE_STORAGE_KEY='chroniclesOfDestinyWeb.deviceMode';
const DEVICE_MODES=['pc','mobile','quest'];
let deviceMode='pc',xrExperience=null,xrControllerButtonStates=new Map(),xrControllerMotion=new Map(),xrLastHeadsetPosition=null,xrLastDiceGestureAt=0;
const LEGACY_SHORT_CAMPAIGN_CHAPTERS=[1,5,7,11,20,43,49,70,77,85,94,95];
const STARTER_FALLBACK = ['Soccorritore','Operatore sociale','Logista','Volontario di Protezione Civile'];
const RED_CROSS_LEGACY_CLASS_MAP={Spartano:'Soccorritore',Arciere:'Operatore sociale',Barbaro:'Logista',Ladro:'Volontario di Protezione Civile'};
const RED_CROSS_ROLE_DETAILS={
  Soccorritore:{focus:'Aiuta la squadra a preparare i servizi sanitari.',style:'sword'},
  'Operatore sociale':{focus:'Ascolta le persone e aiuta a trovare il servizio giusto.',style:'bow'},
  Logista:{focus:'Organizza materiali e pacchi di aiuto.',style:'axe'},
  'Volontario di Protezione Civile':{focus:'Collabora con la squadra nelle esercitazioni e nelle emergenze.',style:'daggers'}
};
const APPEARANCE_SKIN_TONES = ['#f0cfb3','#dfb394','#c98f78','#a97058','#704a3b'];
const APPEARANCE_HAIR_STYLES = ['short','long','braid','curls','shaved'];
const APPEARANCE_OUTFITS = ['class','traveler','robe','armor'];
const DEFAULT_APPEARANCE = {skin:'#c98f78',hairStyle:'short',hairColor:'#34252b',outfitStyle:'class',outfitColor:'#6f536e'};
const CLASS_UNLOCK_FALLBACKS={
  'Revenant Cronale':{level:40,mastery_class:'Necromante',mastery:10},
  'Predone del Tempo':{level:40,mastery_class:'Predone Etereo',mastery:10},
  'Arconte delle Anime':{level:40,mastery_class:"Tessitore d'Anime",mastery:10},
  'Templare Astrale':{level:30,mastery_class:'Paladino',mastery:10}
};
const RED_CROSS_SKILL_TREE={
  service_safety:{name:'Servizio in sicurezza',branch:'Soccorritore',role:'Soccorritore',max_rank:3,cost:1,desc:'Nelle simulazioni, aumenta la preparazione e la protezione della squadra.'},
  supportive_presence:{name:'Presenza di supporto',branch:'Soccorritore',role:'Soccorritore',max_rank:3,cost:1,requires:{service_safety:1},desc:'Rafforza la capacità della squadra di offrire sostegno rispettoso.'},
  team_wellbeing:{name:'Benessere della squadra',branch:'Soccorritore',role:'Soccorritore',max_rank:3,cost:1,requires:{supportive_presence:2},desc:'Aumenta l’energia di gioco e la collaborazione durante le attività.'},
  recovery_and_referral:{name:'Recupero e orientamento',branch:'Soccorritore',role:'Soccorritore',max_rank:2,cost:2,requires:{team_wellbeing:2},desc:'Migliora il recupero nelle simulazioni e l’orientamento verso il referente.'},
  active_listening:{name:'Ascolto attivo',branch:'Operatore sociale',role:'Operatore sociale',max_rank:3,cost:1,desc:'Aiuta a comprendere le richieste e a scegliere risposte rispettose.'},
  respectful_communication:{name:'Comunicazione rispettosa',branch:'Operatore sociale',role:'Operatore sociale',max_rank:3,cost:1,requires:{active_listening:1},desc:'Rafforza la comunicazione chiara e l’attenzione alla dignità delle persone.'},
  privacy_respect:{name:'Rispetto della riservatezza',branch:'Operatore sociale',role:'Operatore sociale',max_rank:2,cost:1,requires:{active_listening:2},desc:'Favorisce scelte prudenti nella gestione delle informazioni di gioco.'},
  service_orientation:{name:'Orientamento ai servizi',branch:'Operatore sociale',role:'Operatore sociale',max_rank:3,cost:2,requires:{respectful_communication:2},desc:'Migliora la capacità di individuare il servizio adatto insieme al referente.'},
  inventory_check:{name:'Controllo delle dotazioni',branch:'Logista',role:'Logista',max_rank:3,cost:1,desc:'Aumenta l’attenzione nel contare e preparare i materiali di gioco.'},
  stock_rotation:{name:'Ordine delle scorte',branch:'Logista',role:'Logista',max_rank:3,cost:1,requires:{inventory_check:1},desc:'Migliora la gestione simulata delle scorte e delle risorse.'},
  service_planning:{name:'Pianificazione del servizio',branch:'Logista',role:'Logista',max_rank:3,cost:1,desc:'Aiuta a preparare percorsi e materiali per il turno.'},
  resource_coordination:{name:'Coordinamento delle risorse',branch:'Logista',role:'Logista',max_rank:3,cost:2,requires:{service_planning:2},desc:'Migliora la distribuzione delle risorse tra i membri della squadra.'},
  preparedness:{name:'Preparazione condivisa',branch:'Volontario di Protezione Civile',role:'Volontario di Protezione Civile',max_rank:3,cost:1,desc:'Rafforza la preparazione della squadra nelle esercitazioni di gioco.'},
  information_verification:{name:'Informazioni verificate',branch:'Volontario di Protezione Civile',role:'Volontario di Protezione Civile',max_rank:3,cost:1,requires:{preparedness:1},desc:'Premia l’attenzione alle informazioni confermate e alle indicazioni del referente.'},
  team_coordination:{name:'Coordinamento di squadra',branch:'Volontario di Protezione Civile',role:'Volontario di Protezione Civile',max_rank:3,cost:1,requires:{information_verification:2},desc:'Rafforza la collaborazione e la pianificazione condivisa.'},
  local_knowledge:{name:'Conoscenza del quartiere',branch:'Volontario di Protezione Civile',role:'Volontario di Protezione Civile',max_rank:2,cost:2,requires:{team_coordination:2},desc:'Aiuta la squadra a orientarsi tra i luoghi e i servizi della comunità.'}
};
const LEGACY_SKILL_EFFECT_MAP={
  fleet_step:'service_planning',arcane_core:'service_orientation',fortune_thread:'active_listening',
  unbroken_will:'preparedness',destiny_reservoir:'team_coordination',loaded_fate:'team_coordination',
  hunter_instinct:'inventory_check',shadow_bond:'active_listening',ancient_vigor:'supportive_presence',
  fourfold_mastery:'team_coordination',fracture_control:'service_safety',umbra_resonance:'team_coordination',
  ancient_loot:'stock_rotation',destiny_overcharge:'resource_coordination',umbra_authority:'resource_coordination',
  soul_thread:'supportive_presence',black_flame:'information_verification',monarch_domain:'local_knowledge',
  self_anchor:'team_wellbeing',remnant_bond:'service_orientation',soul_dice:'information_verification',
  identity_luck:'active_listening',null_resistance:'preparedness',shadow_sovereignty:'resource_coordination',
  realm_forging:'service_planning'
};
const SKILL_TREE_VERSION=2;
let legacySkillTree={};
let content = null, engine = null, scene = null, camera = null, worldRoot = null, actorRoot = null;
let playerRoot = null, playerParts = [], playerModel = null, humanoidModels = [], titleDie = null, titleDieLabels = [], battleDie = null;
let interactables = [], exteriorInteractables = null, motes = [], currentSceneKey = '', currentStep = null, currentSlot = -1;
let houseEntrances=[],activeHouse=null,houseInteriorRoot=null,exteriorPlayerPosition=null,exteriorCameraState=null,contextualDialogue=false;
let game = null, route = [], stepIndex = 0, selectedClass = 'Soccorritore', selectedDifficulty = 'easy', slotMode = 'new';
let selectedAppearance = {...DEFAULT_APPEARANCE};
let characterSection='available',selectedCodexClass='';
let forgeTab='repair';
let dialogueIndex = 0, dialogueVisible = false, dialogueFinished = false, pendingChoice = false;
let currentBattle = null, defending = false, battleResolved = false, currentSideQuest = null;
let keys = Object.create(null), touchKeys = new Set(), touchPointerCodes = new Map(), lastToastTimer = null, curtainTimer = null, inputLocked = false;
let quickHelpWasInputLocked = false;
let introMode = 'new', introSection = 'lore', introIndex = 0;
let introGuideMode = 'controls';
let controlsGuideMode='keyboard',mapSelectedWorld=1;
let classArtCounter = 0;
let lastMoteUpdateAt=0,lastNpcAnimationAt=0,lastPromptUpdateAt=0,lastRadarUpdateAt=0,lastNearPromptText='',skySystemElapsed=0;
const MP_MAX_PLAYERS=12,mpConnections=new Map(),mpRemotePlayers=new Map();
let mpPeer=null,mpConnection=null,mpRole='offline',mpRoomCode='',mpPendingAction=null,mpPendingCode='',mpLastPositionSend=0,mpLastSnapshotSend=0,mpApplyingSnapshot=false,mpConnectionTimer=null;
const pavingMaterials = new Map();
let playerVerticalVelocity=0,jumpRequested=false,sprintFromDoubleTap=false,lastForwardTapAt=0;
let hubMode=false,hubReturnPosition=null,hubReturnCamera=null;

const COLORS = {
  gold: '#ffd43b', violet: '#2774d8', red: '#ef233c', cyan: '#20c9c3', white: '#fffdf8'
};
const WORLD_PALETTES = {
  1:{ground:'#62b56b',path:'#f4c96b',wall:'#f7e5b2',roof:'#ef6a4c',accent:'#ef233c',sky:'#61c9f4',glow:'#fff176'},
  2:{ground:'#62bd79',path:'#f5cf72',wall:'#fff0c2',roof:'#438bd1',accent:'#ef233c',sky:'#68d4f5',glow:'#fff176'},
  3:{ground:'#73c96e',path:'#ffdb77',wall:'#fff1d2',roof:'#ef7562',accent:'#ef233c',sky:'#75d8f6',glow:'#ffed62'},
  4:{ground:'#65bd80',path:'#f3ce78',wall:'#ffe7ad',roof:'#e85d57',accent:'#1877d2',sky:'#6bc9ee',glow:'#ffed62'},
  5:{ground:'#76c96e',path:'#f3d87a',wall:'#fff2c9',roof:'#4a8fcb',accent:'#ef233c',sky:'#78d7f0',glow:'#fff176'},
  6:{ground:'#65bd80',path:'#ffdc76',wall:'#ffefbe',roof:'#e56e55',accent:'#1574c8',sky:'#78d3f0',glow:'#fff176'},
  7:{ground:'#7acb72',path:'#f5d477',wall:'#fff0cc',roof:'#ec735f',accent:'#ef233c',sky:'#7dd7f1',glow:'#ffed62'},
  8:{ground:'#60bb83',path:'#f7d982',wall:'#fff4ce',roof:'#4d95cc',accent:'#ef233c',sky:'#75d6f4',glow:'#fff176'},
  9:{ground:'#8acb67',path:'#f3cf70',wall:'#fff0ba',roof:'#e96950',accent:'#1877d2',sky:'#73cfee',glow:'#fff176'},
  10:{ground:'#73c77c',path:'#f6d57b',wall:'#fff1cf',roof:'#eb735b',accent:'#ef233c',sky:'#74d7f3',glow:'#ffed62'},
  11:{ground:'#67bd8e',path:'#ffdc79',wall:'#fff0c4',roof:'#4c93d1',accent:'#ef233c',sky:'#65c8ee',glow:'#fff176'},
  12:{ground:'#83c96d',path:'#f5d77a',wall:'#fff2ca',roof:'#eb6b55',accent:'#1877d2',sky:'#79d8f4',glow:'#ffed62'},
  13:{ground:'#70c584',path:'#f6d97b',wall:'#fff2ca',roof:'#3985c8',accent:'#ef233c',sky:'#78d7f5',glow:'#fff176'},
  14:{ground:'#78c96e',path:'#ffdb72',wall:'#fff0c0',roof:'#ec7055',accent:'#1877d2',sky:'#73d2f3',glow:'#ffed62'},
  15:{ground:'#67c292',path:'#f5d878',wall:'#fff3d0',roof:'#458dc4',accent:'#ef233c',sky:'#76d4f2',glow:'#fff176'},
  16:{ground:'#8acb72',path:'#f6d77c',wall:'#fff1c8',roof:'#ed7056',accent:'#1877d2',sky:'#6dd0ef',glow:'#fff176'},
  17:{ground:'#6dc28a',path:'#f6d674',wall:'#fff3cb',roof:'#498fc9',accent:'#ef233c',sky:'#79d8f3',glow:'#ffed62'},
  18:{ground:'#78c96d',path:'#f7d97b',wall:'#fff1c4',roof:'#e96752',accent:'#1877d2',sky:'#6ccff1',glow:'#fff176'}
};
const WORLD_UNLOCK_CHAPTERS={1:1,2:6,3:14,4:25,5:33,6:36,7:43,8:49,9:56,10:62,11:66,12:70,13:77,14:78,15:85,16:90,17:93,18:96};
const DIFFICULTY_SETTINGS={easy:{label:'Tranquilla',challenge:.75,rewards:.75,loot:.75},normal:{label:'Equilibrata',challenge:1,rewards:1,loot:1},hard:{label:'Impegnativa',challenge:1.5,rewards:1.5,loot:1.5}};
const WORLD_SAFE_CHRONICLES={
  1:'Velmora è il punto di partenza del viaggio: terre abitate, strade di paese e antiche domande sul destino.',
  2:'Aetherion si apre sotto un cielo sconfinato. Le sue meraviglie invitano a interrogarsi sulle leggi che reggono il mondo.',
  3:'Nythera è una terra di città, nomi e storie custodite con cura. Ogni incontro aggiunge un tassello alla sua identità.',
  4:'Orphion è un reame di contrasti e prospettive mutevoli, dove osservare ciò che cambia conta quanto agire.',
  5:'Nerathis custodisce paesaggi severi e tradizioni antiche, in cui il potere e la memoria dei luoghi si intrecciano.',
  6:'Eidryon si distende tra orizzonti silenziosi e distese chiare: una regione che invita a riflettere su ciò che ci rende noi stessi.',
  7:'Nihyra è un mondo enigmatico, in cui il familiare può apparire diverso e ogni luogo sembra custodire più di una versione.',
  8:'Elyndra è un reame di cieli intensi e territori segnati dal tempo, dove bellezza e resilienza convivono.',
  9:'Aureth risplende di colori e contrasti: un mondo vivo, abitato da comunità con desideri e voci proprie.',
  10:'Khaelys è una terra di prove e ritorni, segnata da percorsi difficili e dalla tenacia di chi li attraversa.',
  11:'Vhalos è un reame vasto e quieto, dove gli spazi aperti lasciano emergere domande rimaste senza risposta.',
  12:'Eschara riunisce sentieri e presenze diverse. È un luogo di passaggio, confronto e decisioni condivise.',
  13:'Il primo reame dei Frammenti si lega al principio del Destino: possibilità diverse attendono ancora una scelta.',
  14:'Il reame della Legge esplora l’equilibrio tra ordine e libertà, attraverso architetture e regole fuori dall’ordinario.',
  15:'Il reame della Memoria custodisce tracce, racconti e immagini di ciò che è stato, o potrebbe essere stato.',
  16:'Il reame della Necessità segue percorsi rigorosi e inevitabili, dove ogni passo invita a interrogarsi sulle alternative.',
  17:'Il reame dell’Anima dà spazio a identità, legami e voci interiori che cercano di essere ascoltate.',
  18:'Il reame della Rinascita è una terra di trasformazioni continue, in cui le forme del mondo non restano mai del tutto ferme.'
};

function escapeHtml(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function roman(n) { const vals=[[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']]; let out=''; for(const [v,s] of vals) while(n>=v){out+=s;n-=v;} return out; }
function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
function safeHexColor(value,fallback){return /^#[0-9a-f]{6}$/i.test(String(value||''))?value:fallback;}
function normalizeAppearance(value={}){
  const appearance=value&&typeof value==='object'?value:{};
  return {
    skin:APPEARANCE_SKIN_TONES.includes(appearance.skin)?appearance.skin:DEFAULT_APPEARANCE.skin,
    hairStyle:APPEARANCE_HAIR_STYLES.includes(appearance.hairStyle)?appearance.hairStyle:DEFAULT_APPEARANCE.hairStyle,
    hairColor:safeHexColor(appearance.hairColor,DEFAULT_APPEARANCE.hairColor),
    outfitStyle:APPEARANCE_OUTFITS.includes(appearance.outfitStyle)?appearance.outfitStyle:DEFAULT_APPEARANCE.outfitStyle,
    outfitColor:safeHexColor(appearance.outfitColor,DEFAULT_APPEARANCE.outfitColor)
  };
}
function averageRep(){const r=game?.player?.reputations||{};const v=Object.values(r);return v.length?Math.round(v.reduce((a,b)=>a+(Number(b)||0),0)/v.length):0;}
function worldForStep(step){
  if(step?.world&&!content?.redCrossStory)return Number(step.world);
  const chapter=Number(step?.chapter_number||1);
  return Math.max(1,...Object.entries(WORLD_UNLOCK_CHAPTERS).filter(([,unlock])=>chapter>=unlock).map(([world])=>Number(world)));
}
function paletteFor(step){ const w=worldForStep(step); return WORLD_PALETTES[w]||WORLD_PALETTES[1]; }
function currentRouteStep(){return route[stepIndex]||null;}
function normalizedDifficulty(value){return DIFFICULTY_SETTINGS[value]?value:'normal';}
function difficultySettings(value=game?.difficulty){return DIFFICULTY_SETTINGS[normalizedDifficulty(value)];}
function slotKey(i){return STORAGE_PREFIX+i;}
function readSlot(i){try{return JSON.parse(localStorage.getItem(slotKey(i))||'null');}catch(e){return null;}}
function writeSlot(i,data){localStorage.setItem(slotKey(i),JSON.stringify(data));}
function allSlots(){return [0,1,2,3].map(i=>readSlot(i));}
function mappedSaveStepIndex(data,targetLength=content.playableChapters.length){
  const schema=Number(data.schema||1),oldIndex=Math.max(0,Number(data.stepIndex)||0);
  if(schema>=3)return clamp(oldIndex,0,targetLength);
  if(schema<2){
    const oldStep=content.chapters[clamp(oldIndex,0,content.chapters.length-1)];
    const oldChapter=Number(oldStep?.chapter_number||1);
    return oldChapter>=96?targetLength:Math.floor((oldChapter-1)/96*targetLength);
  }
  return Math.floor(clamp(oldIndex,0,LEGACY_SHORT_CAMPAIGN_CHAPTERS.length)/LEGACY_SHORT_CAMPAIGN_CHAPTERS.length*targetLength);
}
function refreshContinueButton(){const button=$('continueBtn');if(!button)return;button.disabled=!allSlots().some(Boolean);button.style.opacity=button.disabled?'.4':'1';}
function deleteSlot(i){
  if(!allSlots()[i])return;
  if(!confirm(`Eliminare definitivamente la cronaca nello slot ${i+1}? Questa azione non può essere annullata.`))return;
  localStorage.removeItem(slotKey(i));
  if(currentSlot===i)currentSlot=-1;
  refreshContinueButton();
  if($('slotScreen')&&!$('slotScreen').classList.contains('hidden'))populateSlotScreen();
  if($('panelContent')&&$('panelTitle')?.textContent==='Salvataggi'){$('panelContent').innerHTML='';renderSavePanel();}
  toast(`Cronaca eliminata dallo slot ${i+1}.`);
}
function showScreen(id){['deviceScreen','titleScreen','introScreen','settingsScreen','classScreen','difficultyScreen','slotScreen','archiveScreen','pauseScreen'].forEach(x=>$(x).classList.toggle('hidden',x!==id));}
function toast(message){const el=$('toast');el.textContent=message;el.classList.remove('hidden');clearTimeout(lastToastTimer);lastToastTimer=setTimeout(()=>el.classList.add('hidden'),2600);}
function setClassAccent(name){const d=content?.registries?.CLASS_DATA?.[name]||{};const a=d.accent||[185,145,220];return `rgb(${a[0]},${a[1]},${a[2]})`; }
function classHex(name){const d=content?.registries?.CLASS_DATA?.[name]||{};const a=d.accent||[185,145,220];return '#'+a.slice(0,3).map(v=>Math.max(0,Math.min(255,Number(v)||0)).toString(16).padStart(2,'0')).join('');}
function statsForClass(name){return content?.registries?.CLASS_DATA?.[name]||{hp:150,attack:18,defense:10,magic:8,speed:10,crit:.1,luck:5,accent:[190,160,220]};}
function migratedClassName(name){return RED_CROSS_LEGACY_CLASS_MAP[name]||name;}

const STARTER_CLASS_WEAPONS={'Soccorritore':'spada_rovinata','Operatore sociale':'arco_caccia',Logista:'ascia_ferro','Volontario di Protezione Civile':'pugnali_strada'};
const CLASS_WEAPON_STYLES={
  Soccorritore:'none','Operatore sociale':'none',Logista:'none','Volontario di Protezione Civile':'none',
  'Spartano':'sword','Arciere':'bow','Barbaro':'axe','Ladro':'daggers','Mago':'staff','Necromante':'scythe',
  'Paladino':'sword','Custode Astrale':'staff','Cronomante':'staff','Cavaliere Runico':'sword',"Tessitore d'Anime":'staff',
  'Predone Etereo':'daggers','Revenant Cronale':'scythe','Predone del Tempo':'daggers','Arconte delle Anime':'staff',
  'Templare Astrale':'sword','Mnemonista':'staff','Custode dei Nomi':'staff','Onironauta':'staff','Spezzaspecchi':'sword',
  'Araldo Antico':'sword','Causamante':'staff','Custode della Necessità':'sword','Errante Eonico':'sword','Monarca Umbra':'staff',
  'Custode Umbra':'axe','Revenant Sovrano':'scythe','Psicopompo Umbra':'scythe',"Araldo dell'Io":'sword'
};
const CLASS_PRESENTATION={
  Soccorritore:{weapon:'Kit di squadra',description:'Ti piace dare una mano e collaborare con la squadra.',focus:RED_CROSS_ROLE_DETAILS.Soccorritore.focus},
  'Operatore sociale':{weapon:'Kit di ascolto',description:'Sai ascoltare con gentilezza e aiutare a trovare le informazioni giuste.',focus:RED_CROSS_ROLE_DETAILS['Operatore sociale'].focus},
  Logista:{weapon:'Kit per i materiali',description:'Ti piace organizzare, contare e preparare i materiali per tutti.',focus:RED_CROSS_ROLE_DETAILS.Logista.focus},
  'Volontario di Protezione Civile':{weapon:'Kit di protezione',description:'Ti prepari con la squadra e segui le indicazioni durante le esercitazioni.',focus:RED_CROSS_ROLE_DETAILS['Volontario di Protezione Civile'].focus},
  Spartano:{weapon:'Spada corta',description:'Disciplina e resistenza: il guerriero da prima linea, pronto a reggere lo scontro.'},
  Arciere:{weapon:'Arco da caccia',description:'Precisione e mobilità: colpisce da lontano e sceglie quando entrare nello scontro.'},
  Barbaro:{weapon:'Ascia da guerra',description:'Forza brutale e vitalità: ogni colpo è pesante, diretto e difficile da ignorare.'},
  Ladro:{weapon:'Pugnali gemelli',description:'Rapidità e astuzia: si affida a movimenti scattanti e attacchi ravvicinati.'},
  Mago:{weapon:'Bastone arcano',description:'Canalizza la magia per dominare il campo di battaglia.'},
  Necromante:{weapon:'Falce rituale',description:'Piega le energie dei defunti e combatte al confine tra vita e ombra.'},
  Paladino:{weapon:'Spada consacrata',description:'Una linea difensiva solida, sostenuta da poteri sacri.'},
  'Custode Astrale':{weapon:'Bastone astrale',description:'Manipola le energie celesti e le fratture del destino.'},
  Cronomante:{weapon:'Bastone cronale',description:'Piega il ritmo dello scontro con energie temporali.'},
  'Cavaliere Runico':{weapon:'Spada runica',description:'Un combattente corazzato che incide potere nelle proprie armi.'},
  "Tessitore d'Anime":{weapon:'Bastone delle anime',description:'Intreccia legami spirituali e incantesimi.'},
  'Predone Etereo':{weapon:'Lame eteree',description:'Velocità elevata e colpi improvvisi da angoli inattesi.'},
  'Revenant Cronale':{weapon:'Falce cronale',description:'Un guerriero ritornato dalle fratture del tempo.'},
  'Predone del Tempo':{weapon:'Lame temporali',description:'Assalta con rapidità, sfruttando ogni apertura.'},
  'Arconte delle Anime':{weapon:'Scettro animico',description:'Concentra grandi quantità di energia spirituale.'},
  'Templare Astrale':{weapon:'Spada astrale',description:'Difesa pesante e potere celeste si fondono in un unico stile.'},
  Mnemonista:{weapon:'Bastone mnemonico',description:'Trasforma ricordi e conoscenza in potere arcano.'},
  'Custode dei Nomi':{weapon:'Verga dei nomi',description:'Custodisce le parole originarie che sostengono la realtà.'},
  Onironauta:{weapon:'Bastone onirico',description:'Si muove tra sogno e realtà, cambiando il ritmo del combattimento.'},
  Spezzaspecchi:{weapon:'Lama fratturata',description:'Combatte attraverso riflessi, deviazioni e fendenti improvvisi.'},
  'Araldo Antico':{weapon:'Spada ancestrale',description:"Una figura leggendaria, forte tanto nell'attacco quanto nella resistenza."},
  Causamante:{weapon:'Verga causale',description:'Altera le relazioni tra gli eventi per piegare lo scontro.'},
  'Custode della Necessità':{weapon:'Spada della necessità',description:'Una presenza imponente che impone ordine e stabilità.'},
  'Errante Eonico':{weapon:'Lama eonica',description:'Un viandante delle ere, rapido e letale.'},
  'Monarca Umbra':{weapon:'Scettro umbrale',description:"Domina le energie dell'ombra con una magia travolgente."},
  'Custode Umbra':{weapon:"Ascia d'ombra",description:'Un guardiano massiccio rivestito di potere oscuro.'},
  'Revenant Sovrano':{weapon:'Falce del sovrano',description:'Un revenant che porta in battaglia il peso di un regno perduto.'},
  'Psicopompo Umbra':{weapon:'Falce psicopompa',description:'Guida le anime attraverso il confine tra i mondi.'},
  "Araldo dell'Io":{weapon:"Lama dell'Io",description:'Un campione che plasma la propria identità in forza.'}
};
function classPresentation(name){
  return CLASS_PRESENTATION[name]||{weapon:({sword:'Spada',bow:'Arco',axe:'Ascia',daggers:'Pugnali',staff:'Bastone',scythe:'Falce',hammer:'Martello',spear:'Lancia'}[CLASS_WEAPON_STYLES[name]||'sword']),description:'Un ruolo di squadra nella cronaca della Croce Rossa.'};
}
function weaponStyleForId(id){
  const k=String(id||'').toLowerCase();
  if(/arco|bow/.test(k))return 'bow';
  if(/ascia|axe/.test(k))return 'axe';
  if(/pugnali|dagger|daga|coltello|lame_eteree|lama_doppia/.test(k))return 'daggers';
  if(/falce|scythe/.test(k))return 'scythe';
  if(/bastone|scettro|verga|staff|stocco_arcano/.test(k))return 'staff';
  if(/martello|mazza|hammer/.test(k))return 'hammer';
  if(/lancia|alabarda|spear/.test(k))return 'spear';
  if(/spada|spadone|lama|katana|sciabola|sword/.test(k))return 'sword';
  return null;
}
const TEREN_FORGE_WEAPONS={
  forged_spada_teren:{name:'Spada di Ferro di Teren',level:1,attack:12,magic:1,value:72,forgeStyle:'sword'},
  forged_arco_teren:{name:'Arco Rinforzato di Teren',level:1,attack:10,magic:2,value:72,forgeStyle:'bow'},
  forged_ascia_teren:{name:'Ascia da Guerra di Teren',level:1,attack:15,magic:0,value:78,forgeStyle:'axe'},
  forged_pugnali_teren:{name:'Pugnali Bilanciati di Teren',level:1,attack:10,magic:2,value:74,forgeStyle:'daggers'},
  forged_bastone_teren:{name:'Bastone Runico di Teren',level:1,attack:4,magic:12,value:78,forgeStyle:'staff'},
  forged_falce_teren:{name:'Falce Incisa di Teren',level:1,attack:8,magic:9,value:78,forgeStyle:'scythe'},
  forged_martello_teren:{name:'Martello da Battaglia di Teren',level:1,attack:15,magic:0,value:78,forgeStyle:'hammer'},
  forged_lancia_teren:{name:'Lancia di Ferro di Teren',level:1,attack:12,magic:3,value:76,forgeStyle:'spear'}
};
function registerForgeWeapons(){
  const weapons=content?.registries?.WEAPONS;if(!weapons)return;
  for(const [id,weapon] of Object.entries(TEREN_FORGE_WEAPONS))if(!weapons[id])weapons[id]={...weapon};
}
function classArtworkSvg(name,compact=false){
  if(content?.redCrossStory&&RED_CROSS_ROLE_DETAILS[name]){
    const accent=classHex(name),mark=name==='Soccorritore'
      ?'<rect x="106" y="126" width="36" height="36" rx="8" fill="#fff"/><path d="M121 131h7v10h10v7h-10v10h-7v-10h-10v-7h10z" fill="#ef233c"/>'
      :'<rect x="109" y="128" width="34" height="34" rx="7" fill="#fff"/><path d="M122 133h8v9h9v8h-9v9h-8v-9h-9v-8h9z" fill="#ef233c"/>';
    const accessory={
      Soccorritore:'<rect x="37" y="169" width="38" height="31" rx="6" fill="#fff" stroke="#ef233c" stroke-width="4"/><path d="M48 181h16m-8-8v16" stroke="#ef233c" stroke-width="5"/>',
      'Operatore sociale':'<rect x="173" y="142" width="28" height="39" rx="4" fill="#fff" stroke="#1877d2" stroke-width="4"/><path d="M180 154h14m-14 8h14" stroke="#1877d2" stroke-width="3"/>',
      Logista:'<rect x="171" y="158" width="36" height="29" rx="4" fill="#f3a528" stroke="#fff" stroke-width="3"/><path d="M179 158v-7h20v7" fill="none" stroke="#fff" stroke-width="3"/>',
      'Volontario di Protezione Civile':'<path d="M78 70q38-45 76 0v9H78z" fill="#ffb629" stroke="#fff" stroke-width="4"/><path d="M85 189h72v8H85z" fill="#ffcf32"/>'
    }[name];
    return `<svg class="class-art-svg red-cross-class-art${compact?' compact':''}" viewBox="0 0 240 270" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeHtml(name)}"><circle cx="120" cy="135" r="105" fill="${accent}" opacity=".18"/><ellipse cx="120" cy="239" rx="75" ry="12" fill="#163b58" opacity=".18"/><path d="M83 115l18-14h38l18 14 21 112H62z" fill="${name==='Volontario di Protezione Civile'?'#ff9f1c':'#ef233c'}" stroke="#fff" stroke-width="5"/><path d="M86 116h68l-8 39h-52z" fill="#fff" opacity=".28"/><ellipse cx="120" cy="79" rx="34" ry="39" fill="#d9a681" stroke="#fff" stroke-width="3"/><path d="M87 72q4-43 34-40 31 1 32 39l-15-13-18 6-16-5z" fill="#4a332d"/>${mark}<path d="M74 139l-19 45m111-45 20 45" stroke="#d9a681" stroke-width="16" stroke-linecap="round"/><path d="M92 225v18m55-18v18" stroke="#173b58" stroke-width="17" stroke-linecap="round"/><path d="M81 226h30m39 0h29" stroke="#fff" stroke-width="7" stroke-linecap="round"/>${accessory}</svg>`;
  }
  const key=String(name||'Spartano'),n=key.toLowerCase(),accent=classHex(key),uid='classart_'+(++classArtCounter);
  const style=CLASS_WEAPON_STYLES[key]||(/arciere|ranger|cacciatore/.test(n)?'bow':/barbaro|berserker|predone/.test(n)?'axe':/ladro|assassino|ombra/.test(n)?'daggers':/necromante|revenant|psicopompo/.test(n)?'scythe':/mago|custode astrale|cron|mnemon|arconte|causamante|monarca/.test(n)?'staff':'sword');
  const spartan=/spartano/.test(n),archer=/arciere/.test(n),barbarian=/barbaro/.test(n),rogue=/ladro/.test(n);
  let head='';
  if(spartan)head=`<path d="M81 94 Q79 54 118 48 Q157 54 155 94 L144 111 L92 111Z" fill="url(#${uid}_metal)" stroke="#e7c984" stroke-width="2"/><path d="M77 67 Q116 26 158 67 L151 76 Q118 55 84 77Z" fill="#b94c4c" stroke="#e6c47c" stroke-width="2"/><path d="M93 91 L143 91 L136 108 L100 108Z" fill="#171720"/><path d="M101 96H135" stroke="#f1d9a2" stroke-width="3"/>`;
  else if(archer)head=`<path d="M77 108 Q63 50 116 39 Q171 49 157 110 L140 91 L93 91Z" fill="#1b302e" stroke="${accent}" stroke-width="2.5"/><ellipse cx="117" cy="85" rx="24" ry="31" fill="#bd9277" stroke="#e4c7a6" stroke-width="1.5"/><path d="M92 87 Q111 70 143 87 L140 101 L96 101Z" fill="#172323"/><path d="M94 72 Q111 42 143 68" fill="none" stroke="#d4b18a" stroke-width="5"/>`;
  else if(barbarian)head=`<path d="M85 79 L76 58 L98 65 L108 43 L120 62 L140 43 L145 67 L160 58 L151 91 L145 108 L91 108Z" fill="#33201d" stroke="#d7a16d" stroke-width="2"/><ellipse cx="118" cy="88" rx="24" ry="29" fill="#b88368" stroke="#e7c4a0" stroke-width="1.5"/><path d="M94 96 Q116 113 142 96 L137 119 L119 131 L100 119Z" fill="#3b241e" stroke="#c68b5c" stroke-width="1.5"/><path d="M97 85H107 M128 85H138" stroke="#20191a" stroke-width="4"/>`;
  else if(rogue)head=`<path d="M75 111 Q60 45 117 39 Q175 47 159 111 L140 92 L94 92Z" fill="#171827" stroke="${accent}" stroke-width="2.5"/><ellipse cx="117" cy="86" rx="23" ry="29" fill="#a9857c" stroke="#d3b3a5" stroke-width="1.5"/><path d="M92 91 L143 91 L137 108 L98 108Z" fill="#1a1a27"/><path d="M98 82H109 M126 82H137" stroke="#e4d8c6" stroke-width="3"/>`;
  else if(/mago|necromante|arconte|monarca|cron|mnemon|causamante|tessitore|custode astrale|onironauta/.test(n))head=`<path d="M75 83 L116 35 L160 83 L146 77 L139 103 L96 103 L88 77Z" fill="#20182d" stroke="${accent}" stroke-width="2.5"/><ellipse cx="117" cy="87" rx="22" ry="26" fill="#b49aab" stroke="#e5d2e0" stroke-width="1.5"/><path d="M97 90H108 M127 90H138" stroke="${accent}" stroke-width="3"/>`;
  else head=`<path d="M80 91 Q73 48 116 43 Q160 48 154 91 L145 107 L90 107Z" fill="url(#${uid}_metal)" stroke="${accent}" stroke-width="2.5"/><path d="M96 89H139L133 104H102Z" fill="#14141b"/><path d="M117 45V78" stroke="#e8d5a0" stroke-width="3"/>`;

  let weapon='';
  if(style==='sword')weapon=`<g transform="translate(173 154) rotate(17)"><path d="M-4 2 L0 -50 L5 -57 L10 -50 L8 2Z" fill="url(#${uid}_blade)" stroke="#e8d8ad" stroke-width="1.5"/><path d="M-8 1H14L11 7H-6Z" fill="#d8bb78"/><path d="M1 7H7V27H1Z" fill="#6a4938" stroke="#d7bb83"/><path d="M-1 25H9L11 30H-3Z" fill="#d7bb83"/></g>`;
  else if(style==='bow')weapon=`<g transform="translate(0 58)" fill="none" stroke-linecap="round"><path d="M179 72 Q211 124 179 179" stroke="#b98753" stroke-width="8"/><path d="M179 72 Q188 124 179 179" stroke="#e5d9bd" stroke-width="1.8"/><path d="M168 120 L202 120 M194 113 L202 120 L194 127" stroke="#d7c79f" stroke-width="2.5"/></g>`;
  else if(style==='axe')weapon=`<g transform="translate(175 91) rotate(10)"><path d="M0 2 L3 111" stroke="#79553c" stroke-width="8"/><path d="M-1 8 Q-39 -8 -35 28 Q-21 38 -1 26Z" fill="url(#${uid}_metal)" stroke="#e0c78e" stroke-width="2"/><path d="M4 8 Q42 -8 37 28 Q22 38 4 26Z" fill="url(#${uid}_metal)" stroke="#e0c78e" stroke-width="2"/><path d="M-31 24L-10 25 M10 25L33 24" stroke="${accent}" stroke-width="2"/></g>`;
  else if(style==='daggers')weapon=`<g transform="translate(0 28)" fill="none" stroke-linejoin="round"><g transform="translate(66 135) rotate(-24)"><path d="M0 0 L-5 -43 L0 -54 L5 -43 L4 0Z" fill="url(#${uid}_blade)" stroke="#e3d5b7" stroke-width="1.4"/><path d="M-9 1H10" stroke="#c6a96e" stroke-width="4"/><path d="M0 4V17" stroke="#7a503a" stroke-width="5"/></g><g transform="translate(172 135) rotate(24)"><path d="M0 0 L-5 -43 L0 -54 L5 -43 L4 0Z" fill="url(#${uid}_blade)" stroke="#e3d5b7" stroke-width="1.4"/><path d="M-9 1H10" stroke="#c6a96e" stroke-width="4"/><path d="M0 4V17" stroke="#7a503a" stroke-width="5"/></g></g>`;
  else if(style==='scythe')weapon=`<g transform="translate(177 105) rotate(8)"><path d="M0 5L2 116" stroke="#79553c" stroke-width="7"/><path d="M0 9 Q-9 -22 21 -35 Q50 -43 45 -13 Q33 -28 18 -17 Q8 -8 9 11Z" fill="url(#${uid}_metal)" stroke="#e4d4a5" stroke-width="2"/><path d="M12 -7L38 -26" stroke="${accent}" stroke-width="2.5"/></g>`;
  else if(style==='staff')weapon=`<g transform="translate(176 83)"><path d="M0 8L0 128" stroke="#78563f" stroke-width="8"/><path d="M0 -7L12 7L0 21L-12 7Z" fill="${accent}" stroke="#e5d4a2" stroke-width="2"/><circle cx="0" cy="7" r="19" fill="none" stroke="#d8c18a" stroke-width="2"/><path d="M0 27V118" stroke="#c7a96e" stroke-width="2"/></g>`;
  else if(style==='hammer')weapon=`<g transform="translate(174 92) rotate(9)"><path d="M0 0L2 112" stroke="#79553c" stroke-width="8"/><rect x="-25" y="-9" width="52" height="27" rx="3" fill="url(#${uid}_metal)" stroke="#e3d1a3" stroke-width="2"/><path d="M-18 -2H19" stroke="${accent}" stroke-width="2"/></g>`;
  else weapon=`<g transform="translate(174 88) rotate(7)"><path d="M0 0L1 120" stroke="#79553c" stroke-width="7"/><path d="M-5 -32L1 -50L7 -32L5 4H-3Z" fill="url(#${uid}_metal)" stroke="#e3d1a3" stroke-width="2"/></g>`;

  const armor=spartan?'#674b3b':archer?'#315c56':barbarian?'#674238':rogue?'#292b40':'#343044';
  const cloak=spartan?'#7c3037':archer?'#193d39':barbarian?'#30201e':rogue?'#171723':'#211a2e';
  const shoulder=barbarian?`<path d="M73 137 L88 119 L100 139 L90 151Z" fill="#a87b52" stroke="${accent}" stroke-width="2"/><path d="M137 139L151 119L165 137L151 151Z" fill="#a87b52" stroke="${accent}" stroke-width="2"/>`:`<path d="M77 137L93 119L105 137L94 151Z" fill="url(#${uid}_metal)" stroke="${accent}" stroke-width="2"/><path d="M130 137L143 119L158 137L147 151Z" fill="url(#${uid}_metal)" stroke="${accent}" stroke-width="2"/>`;
  return `<svg class="class-art-svg${compact?' compact':''}" viewBox="0 0 240 270" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeHtml(key)} con ${escapeHtml(classPresentation(key).weapon)}">
  <defs><linearGradient id="${uid}_metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f1dfb0"/><stop offset=".38" stop-color="${accent}"/><stop offset="1" stop-color="#24202c"/></linearGradient><linearGradient id="${uid}_blade" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff7dd"/><stop offset=".45" stop-color="#c4c6cf"/><stop offset="1" stop-color="#65606d"/></linearGradient><linearGradient id="${uid}_armor" x1="0" y1="0" x2=".95" y2="1"><stop stop-color="#d8c49c"/><stop offset=".16" stop-color="${accent}"/><stop offset=".48" stop-color="${armor}"/><stop offset=".78" stop-color="#25202b"/><stop offset="1" stop-color="#12121b"/></linearGradient><linearGradient id="${uid}_cloak" x1=".1" y1="0" x2=".8" y2="1"><stop stop-color="${accent}" stop-opacity=".7"/><stop offset=".3" stop-color="${cloak}"/><stop offset="1" stop-color="#100f18"/></linearGradient><radialGradient id="${uid}_halo"><stop stop-color="${accent}" stop-opacity=".34"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient><filter id="${uid}_shadow" x="-35%" y="-20%" width="170%" height="150%"><feGaussianBlur in="SourceAlpha" stdDeviation="3"/><feOffset dy="3"/><feComponentTransfer><feFuncA type="linear" slope=".55"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
  <ellipse cx="119" cy="129" rx="94" ry="105" fill="url(#${uid}_halo)"/><circle cx="119" cy="128" r="82" fill="none" stroke="${accent}" stroke-opacity=".35" stroke-width="1.4"/><circle cx="119" cy="128" r="72" fill="none" stroke="#d9c28a" stroke-opacity=".22" stroke-dasharray="3 8"/>
  <g filter="url(#${uid}_shadow)">
  <path d="M83 129L62 155L57 228L78 251L100 204L137 204L159 251L181 228L175 155L153 129Z" fill="url(#${uid}_cloak)" stroke="${accent}" stroke-opacity=".75" stroke-width="2"/>
  <path d="M88 126L99 115L139 115L151 126L164 186L143 208L96 208L75 186Z" fill="url(#${uid}_armor)" stroke="#d4c095" stroke-width="1.6"/>
  ${shoulder}<path d="M101 129L117 142L134 129L140 184L97 184Z" fill="url(#${uid}_metal)" stroke="#e3d2a2" stroke-width="1.6"/><path d="M118 144V183 M99 163H138" stroke="${accent}" stroke-width="2" opacity=".9"/>
  <path d="M94 203L112 204L107 251L83 251Z" fill="url(#${uid}_armor)" stroke="${accent}" stroke-opacity=".58"/><path d="M126 204L145 203L157 251L133 251Z" fill="url(#${uid}_armor)" stroke="${accent}" stroke-opacity=".58"/>
  <ellipse cx="117" cy="87" rx="25" ry="31" fill="#b9917b" stroke="#ead0b5" stroke-width="1.4"/>${head}
  <path d="M95 86H108 M127 86H140" stroke="#201a20" stroke-width="3.5"/><path d="M108 105Q117 110 127 105" fill="none" stroke="#5d3937" stroke-width="1.5"/><path d="M95 93Q101 90 107 93 M128 93Q134 90 140 93" fill="none" stroke="#f0d7b8" stroke-opacity=".7" stroke-width="1.4"/>
  <path d="M91 125L101 120L111 124 M143 120L153 126" fill="none" stroke="#fff0cc" stroke-opacity=".65" stroke-width="2"/>
  <path d="M78 151L62 180 M157 151L169 181" stroke="#b9917b" stroke-width="12" stroke-linecap="round"/><path d="M72 154L59 180 M162 154L176 179" stroke="url(#${uid}_armor)" stroke-width="13" stroke-linecap="round"/>
  ${weapon}<path d="M94 252H111 M131 252H151" stroke="#d6bf88" stroke-width="4" stroke-linecap="round"/><path d="M35 228L46 217L46 239Z M201 228L190 217L190 239Z" fill="${accent}" opacity=".7"/>
  </g>
  </svg>`;
}

const FALLBACK_LORE=[
  {title:'Un turno in squadra',text:'Benvenuto al Comitato! In questa breve avventura aiuterai la squadra con attività di volontariato di oggi.',visual:'heart'},
  {title:'Tante attività, un obiettivo',text:'Preparerai materiali, darai una mano con i viveri, incontrerai la comunità e scoprirai i servizi di supporto.',visual:'volunteer'},
  {title:'Come si ottengono i distintivi',text:'Concludi ciascuna delle sei tappe principali per ricevere il suo distintivo. Li trovi nell’Album dei distintivi nel Diario.',visual:'badge'}
];
const CONTROL_GUIDE={title:'COMANDI DI VIAGGIO',text:'Scegli una scheda per vedere i comandi di tastiera e mouse oppure quelli del controller. I tasti mostrati tengono conto delle rimappature nelle Impostazioni.',visual:'controls'};
function introData(section){
  if(section==='lore')return content?.catalogs?.['story.WORLD_LORE']||FALLBACK_LORE;
  if(section==='die')return content?.cutscenes?.die_guide?.DIE_GUIDE||[];
  return [CONTROL_GUIDE];
}
function localizeStoryStrings(value){
  const accents={societa:'società',attivita:'attività',solidarieta:'solidarietà',umanita:'umanità',comunita:'comunità',dignita:'dignità',priorita:'priorità',responsabilita:'responsabilità',necessita:'necessità',continuita:'continuità',disponibilita:'disponibilità',unita:'unità',piu:'più',gia:'già',cosi:'così',cio:'ciò',qualita:'qualità',volonta:'volontà',autorita:'autorità'};
  if(typeof value==='string')return value.replace(/\b(societa|attivita|solidarieta|umanita|comunita|dignita|priorita|responsabilita|necessita|continuita|disponibilita|unita|piu|gia|cosi|cio|qualita|volonta|autorita)\b/gi,word=>{
    const localized=accents[word.toLowerCase()];
    return word[0]===word[0].toUpperCase()?localized[0].toUpperCase()+localized.slice(1):localized;
  }).replace('non e solo','non è solo').replace('volontariato e un impegno','volontariato è un impegno');
  if(Array.isArray(value))return value.map(localizeStoryStrings);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,localizeStoryStrings(item)]));
  return value;
}
function applyRedCrossStory(source){
  const story=localizeStoryStrings(source);
  if(!Array.isArray(story.playableChapters)||story.playableChapters.length!==6)throw new Error('La campagna dei turni deve contenere sei tappe.');
  if(!Array.isArray(story.missions)||!story.missions.length)throw new Error('Il catalogo delle attività di volontariato è vuoto.');
  legacySkillTree={...(content.registries.SKILL_TREE||{})};
  content.registries.SKILL_TREE=RED_CROSS_SKILL_TREE;
  const sourceStep=content.chapters.find(step=>Number(step.chapter_number)===1);
  if(!sourceStep)throw new Error('Scena base del Comitato non disponibile.');
  content.playableChapters=story.playableChapters.map(([number,title,focus,task,missionIds])=>{
    if(!Number.isInteger(number)||number<1||number>6||!Array.isArray(missionIds))throw new Error(`Dati non validi per la tappa ${number}.`);
    const missions=missionIds.map(id=>story.missions.find(mission=>mission.id===id));
    if(missions.some(mission=>!mission))throw new Error(`Attività collegata non trovata nella tappa ${number}.`);
    return {
      ...sourceStep,
      id:`cri_turn_${number}`,
      chapter_number:number,
      chapter_arc:'Turni di volontariato',
      title,
      objective:task,
      dialogue:[
        ['Coordinatrice/Coordinatore',`${title}: ${focus}`],
        ['Volontaria/volontario',`${task} Le attività reali si svolgono con formazione e indicazioni del Comitato.`]
      ],
      serviceCategory:[...new Set(missions.map(mission=>mission.category))].join(' · '),
      missionIds,
      exercise:false
    };
  });
  if(new Set(content.playableChapters.map(step=>step.chapter_number)).size!==content.playableChapters.length)throw new Error('Ogni tappa deve avere un numero distinto.');
  content.historyArchive=story.missions.map((mission,index)=>({
    chapter_number:index+1,
    title:mission.title,
    chapter_arc:mission.category,
    objective:mission.desc,
    missionId:mission.id,
    dialogue:[['Attività di volontariato',mission.desc]]
  }));
  const classRows=Object.entries(RED_CROSS_LEGACY_CLASS_MAP).map(([legacyName,roleName])=>[
    roleName,{...content.registries.CLASS_DATA[legacyName],accent:({
      Soccorritore:[239,35,60],
      'Operatore sociale':[29,112,198],
      Logista:[255,164,28],
      'Volontario di Protezione Civile':[24,158,99]
    })[roleName]}
  ]);
  content.registries.CLASS_DATA=Object.fromEntries(classRows);
  content.registries.STARTER_CLASSES=classRows.map(([name])=>name);
  content.registries.ADVANCED_CLASSES=[];
  content.registries.SECRET_CLASSES=[];
  content.registries.CLASS_UNLOCK_QUESTS={};
  content.registries.CLASS_ORIGINS={
    Soccorritore:['Ti piace aiutare la squadra a preparare i servizi sanitari.','Nel gioco accompagni le persone e collabori con gli altri volontari.'],
    'Operatore sociale':['Sai ascoltare con gentilezza e rispetto.','Nel gioco aiuti le persone a trovare informazioni e servizi.'],
    Logista:['Sai mettere in ordine materiali e provviste.','Nel gioco prepari i pacchi e controlli le scorte insieme alla squadra.'],
    'Volontario di Protezione Civile':['Credi nella preparazione e nel lavoro di squadra.','Nel gioco partecipi a esercitazioni e attività di supporto alla comunità.']
  };
  content.worlds=story.worlds;
  content.volunteerMissions=story.missions;
  content.redCrossStory=story;
  content.catalogs['story.WORLD_LORE']=story.intro;
  content.catalogs['progression.WORLD_LORE_CODEX']=story.playableChapters.map(([stage,title,focus])=>({
    id:`cri_turn_${stage}`,world:story.worlds[stage]||'Turni di volontariato',chapter:stage,title,text:focus
  }));
  for(const key of Object.keys(content.catalogs)){
    if(/SIDE_QUESTS|MANDATORY|TIMED_POLITICAL_QUESTS|LEGACY_MANDATORY/.test(key))delete content.catalogs[key];
  }
  content.inline_dialogue=[];
  if(content.cutscenes?.die_guide){
    content.cutscenes.die_guide.DIE_GUIDE=[
      {title:'Il dado della missione',text:'Il dado aggiunge un po’ di sorpresa alle prove del gioco. Il risultato cambia l\'effetto dell\'azione, ma non rappresenta una procedura reale di soccorso.',visual:'die'},
      {title:'La riserva',text:'Le azioni di gioco ricaricano la riserva. Puoi lanciare il dado quando hai abbastanza energia; gli oggetti possono modificarne la capacità.',visual:'die'},
      {title:'Il risultato',text:'Il lancio restituisce un valore da uno a sei. Un risultato più alto migliora l’effetto dell’azione nel gioco.',visual:'die'},
      {title:'Giocare in sicurezza',text:'Il dado è solo una regola del videogioco: non sostituisce formazione, indicazioni del coordinamento o procedure del Comitato.',visual:'die'}
    ];
  }
  const choiceLabels={
    save_village:'Dai priorita alle persone e attiva il supporto coordinato.',
    chase_enemy:'Raccogli informazioni e chiedi indicazioni al coordinamento.',
    destroy_archive:'Condividi le informazioni necessarie tutelando i dati sensibili.',
    preserve_archive:'Conserva i registri e affidali ai referenti autorizzati.',
    rob_relic:'Richiedi un controllo aggiuntivo delle scorte prima della distribuzione.',
    return_relic:'Procedi con la distribuzione dopo la verifica del referente.'
  };
  for(const [key,text] of Object.entries(choiceLabels)){
    const effect=content.registries.CHOICE_EFFECTS?.[key];
    if(effect)effect.text=text;
  }
}
function introVisualMarkup(key){
  const markup={
    kingdoms:'<div class="lore-orbit"><i></i><i></i><i></i><b>✚</b></div><div class="lore-caption">UNA SQUADRA · TANTE PERSONE</div>',
    war:'<div class="lore-war"><i></i><i></i><i></i><b>◎</b></div><div class="lore-caption">ASCOLTO E COLLABORAZIONE</div>',
    heart:'<div class="lore-heart"><b>✚</b><i></i><i></i></div><div class="lore-caption">IL COMITATO · UNA SQUADRA INSIEME</div>',
    volunteer:'<div class="service-guide-emblem" aria-hidden="true"><span>✚</span><i>ASCOLTO</i><i>AIUTO</i><i>SQUADRA</i></div><div class="lore-caption">ATTIVITÀ DI VOLONTARIATO</div>',
    badge:'<div class="badge-guide-emblem" aria-hidden="true"><span>✚</span><strong>1 TAPPA</strong></div><div class="lore-caption">UN DISTINTIVO PER OGNI TAPPA CONCLUSA</div>',
    fracture:'<div class="lore-fracture"><i></i><i></i><i></i><b>✓</b></div><div class="lore-caption">PRONTI INSIEME</div>',
    die:'<div class="lore-die"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span></div><div class="lore-caption">UNA PROVA DI GIOCO</div>',
    controls:controlsGuideMarkup(controlsGuideMode)
  };
  return markup[key]||markup.die;
}
function controlGuideKey(action){return (keyboardBindings[action]||[]).map(keyLabel).join(' / ')||'—';}
function controlGuideButton(action){return gamepadBindingLabel(action);}
function controlGuideRows(mode){
  if(mode==='touch')return [
    ['▲','Vai avanti'],['◀','Vai a sinistra'],['▼','Vai indietro'],['▶','Vai a destra'],
    ['Parla','Interagisci'],['Continua','Leggi la storia'],['Aiuto','Apri la guida rapida'],['Diario','Scopri le missioni']
  ].map(([bind,label])=>`<div class="control-guide-row"><span class="control-guide-bind">${escapeHtml(bind)}</span><span>${escapeHtml(label)}</span></div>`).join('');
  if(mode==='quest')return [
    ['Stick sinistro','Muovi il volontario'],['Grilletto destro','Parla / interagisci'],['Punta e premi','Scegli un pulsante'],['Ruota la testa','Guarda intorno'],['Menu sullo schermo','Leggi storia e missioni']
  ].map(([bind,label])=>`<div class="control-guide-row"><span class="control-guide-bind">${escapeHtml(bind)}</span><span>${escapeHtml(label)}</span></div>`).join('');
  const rows=mode==='keyboard'?[
    ['moveForward','Avanti · doppio tocco per sprint'],['moveLeft','Sinistra'],['moveBackward','Indietro'],['moveRight','Destra'],
    ['interact','Interagisci / conferma'],['journal','Quest e diario'],['inventory','Inventario'],['character','Personaggio'],
    ['cameraReset','Ricentra visuale'],['pause','Pausa / indietro'],['attack','Attacco in combattimento'],['skill','Tecnica in combattimento'],
    ['die','Lancia il Dado'],['potion','Pozione'],['defend','Difesa in combattimento']
  ]:[
    ['moveForward','Avanti'],['moveLeft','Sinistra'],['moveBackward','Indietro'],['moveRight','Destra'],
    ['cameraReset','Stick destro · Telecamera · L3 ricentra'],['interact','Interagisci / conferma'],['journal','Quest e diario'],['inventory','Inventario'],['character','Personaggio'],['pause','Pausa / indietro'],
    ['attack','Attacco in combattimento'],['skill','Tecnica in combattimento'],['die','Lancia il Dado'],['potion','Pozione'],['defend','Difesa in combattimento']
  ];
  rows.push(['map',mode==='keyboard'?'Mappa · pulsante HUD':'Pulsante Mappa nell’HUD']);
  const movementBindings={moveForward:'Stick sx / Croce ↑',moveLeft:'Stick sx / Croce ←',moveBackward:'Stick sx / Croce ↓',moveRight:'Stick sx / Croce →'};
  return rows.map(([action,label])=>`<div class="control-guide-row"><span class="control-guide-bind">${escapeHtml(action==='map'?(mode==='keyboard'?'M':'HUD'):mode==='keyboard'?controlGuideKey(action):movementBindings[action]||controlGuideButton(action))}</span><span>${escapeHtml(label)}</span></div>`).join('');
}
function controlsGuideMarkup(mode){
  if(mode==='touch'||mode==='quest'){
    const isTouch=mode==='touch';
    const diagram=isTouch
      ?'<div class="guide-touch-controls"><span>▲</span><div><span>◀</span><span>▼</span><span>▶</span></div><b>PARLA / INTERAGISCI</b></div>'
      :'<div class="guide-vr-controls"><span class="vr-goggles">◉</span><strong>Meta Quest</strong><small>Controller, sguardo e pulsanti sullo schermo</small></div>';
    return `<div class="controls-guide"><div class="controls-guide-diagram">${diagram}</div><div class="lore-caption">${isTouch?'COMANDI TOUCH SEMPLICI':'GIOCA IN VR CON I CONTROLLER'}</div></div>`;
  }
  const keyboard=mode==='keyboard';
  const diagram=keyboard
    ?`<div class="guide-keyboard" aria-label="Tastiera con tasti utili evidenziati"><div class="guide-key-row offset"><kbd class="guide-key active">${escapeHtml(controlGuideKey('moveForward').split(' / ')[0])}</kbd></div><div class="guide-key-row"><kbd class="guide-key active">${escapeHtml(controlGuideKey('moveLeft').split(' / ')[0])}</kbd><kbd class="guide-key active">${escapeHtml(controlGuideKey('moveBackward').split(' / ')[0])}</kbd><kbd class="guide-key active">${escapeHtml(controlGuideKey('moveRight').split(' / ')[0])}</kbd></div><div class="guide-key-row guide-key-utilities">${['interact','journal','inventory','character','cameraReset','attack','skill','die','potion','defend','pause'].map(action=>`<kbd class="guide-key active">${escapeHtml(controlGuideKey(action).split(' / ')[0].replace(/^Maiusc (sinistro|destro)$/,'SHIFT'))}</kbd>`).join('')}<kbd class="guide-key active">M</kbd></div><div class="guide-key-row"><kbd class="guide-key active wide">SPAZIO · SALTO</kbd><kbd class="guide-key active wide">SHIFT · SPRINT / DIFESA</kbd></div><div class="guide-arrow-note">Sono attive anche le frecce direzionali.</div></div><div class="guide-mouse" aria-label="Mouse per la visuale"><div class="guide-mouse-buttons"><span>SINISTRO</span><span>DESTRO</span></div><i class="guide-wheel"></i><small>ROTELLINA</small></div>`
    :`<div class="guide-controller dualshock"><div class="guide-shoulders"><span>L1 · L2</span><span>R1 · R2</span></div><div class="guide-pad"><div class="guide-dpad"><i>↑</i><i>←</i><i>↓</i><i>→</i></div><div class="guide-stick left">L</div><div class="guide-stick right">R</div><div class="guide-touchpad"><span></span></div><div class="guide-center-buttons"><i>SHARE</i><b></b><i>OPTIONS</i></div><div class="guide-lightbar"></div><div class="guide-face-buttons"><i class="face-y" aria-label="${escapeHtml(controlGuideButton('inventory'))} · Inventario">△</i><i class="face-x" aria-label="${escapeHtml(controlGuideButton('attack'))} · Attacco">□</i><i class="face-b" aria-label="${escapeHtml(controlGuideButton('die'))} · Dado">○</i><i class="face-a" aria-label="${escapeHtml(controlGuideButton('interact'))} · Interagisci">×</i></div><div class="guide-pad-label">DUALSHOCK 4</div></div><div class="guide-shoulders lower"><span>${escapeHtml(controlGuideButton('journal'))} · QUEST</span><span>${escapeHtml(controlGuideButton('defend'))} · DIFESA</span></div></div>`;
  return `<div class="controls-guide"><div class="controls-guide-tabs" role="tablist" aria-label="Tipo di comandi"><button type="button" role="tab" data-controls-mode="keyboard" aria-selected="${keyboard}">Mouse e tastiera</button><button type="button" role="tab" data-controls-mode="controller" aria-selected="${!keyboard}">Controller</button></div><div class="controls-guide-diagram">${diagram}</div><div class="lore-caption">${keyboard?'TASTI E PULSANTI ILLUMINATI SONO QUELLI UTILI':'COMANDI DEL CONTROLLER · RIMAPPABILI DALLE IMPOSTAZIONI'}</div></div>`;
}
function renderControlsGuide(){
  const visual=$('introVisual');
  const activeMode=deviceMode==='mobile'?'touch':deviceMode==='quest'?'quest':controlsGuideMode;
  visual.innerHTML=controlsGuideMarkup(activeMode);
  $('introGuideTabs').classList.toggle('hidden',activeMode==='touch'||activeMode==='quest');
  $('introText').innerHTML=`<div class="control-guide-heading">${activeMode==='touch'?'TOCCA PER GIOCARE':activeMode==='quest'?'CONTROLLI DEL VISORE':controlsGuideMode==='keyboard'?'MOUSE E TASTIERA':'CONTROLLER'}</div><div class="control-guide-list">${controlGuideRows(activeMode)}</div>${activeMode==='keyboard'?'<p class="control-guide-note">Trascina il mouse per guardarti intorno. <strong>Salto:</strong> Spazio · <strong>Sprint:</strong> doppio tocco avanti o Shift.</p>':activeMode==='touch'?'<p class="control-guide-note">Tieni premuta una freccia per camminare. Avvicinati alle persone e tocca “Parla / interagisci”.</p>':activeMode==='quest'?'<p class="control-guide-note">Usa il controller sinistro per camminare e il grilletto destro per interagire. Muovi la testa per guardarti intorno; punta e premi per scegliere. Chiedi a un adulto di preparare il visore e l’area di gioco.</p>':'<p class="control-guide-note">Gli stick analogici e la croce direzionale muovono il volontario. I tasti frontali cambiano funzione in base alla schermata.</p>'}`;
  visual.querySelectorAll('[data-controls-mode]').forEach(button=>button.addEventListener('click',()=>{
    controlsGuideMode=button.dataset.controlsMode;
    renderControlsGuide();
  }));
}
function renderGameFunctionsGuide(){
  const features=[
    ['☷','Diario e distintivi','Consulta l’attività del turno e le missioni. Concludi una tappa principale per ottenere il suo distintivo; li trovi tutti nell’Album dei distintivi.'],
    ['◇','Inventario','Controlla armi, armature, accessori e consumabili. Da qui gestisci l’equipaggiamento e usi gli oggetti disponibili.'],
    ['▣','Salvataggi','Salva la cronaca nello slot corrente e gestisci le linee temporali. Ci sono quattro slot separati: scegli con attenzione quale salvare o caricare.'],
    ['⌂','Comitato locale','Raggiungi il punto di ritrovo per recuperare risorse, riposare e prepararti al turno; usa il pulsante di ritorno per riprendere la cronaca.'],
    ['⌖','Mappa','Mostra la posizione nell’area attuale e le tappe del turno già raggiunte.'],
    ['♙','Personaggio','Rivedi statistiche e classi, controlla i requisiti per sbloccare nuove classi e investi i punti talento nell’albero delle abilità.'],
    ['⚔','Prove di gioco','Le prove sono simulazioni facoltative: non insegnano procedure di soccorso.'],
    ['✧','Esplorazione e dialoghi','Avvicinati ai personaggi e agli elementi luminosi e interagisci. Parlare, esplorare e completare gli obiettivi fa avanzare le scene della cronaca.']
  ];
  $('introVisual').innerHTML='<div class="functions-guide-emblem" aria-hidden="true">✦<span>✧</span></div><div class="lore-caption">STRUMENTI DEL PORTATORE · LA CRONACA È TUA</div>';
  $('introText').innerHTML=`<div class="basic-guide-list">${features.map(([icon,title,description])=>`<article class="basic-guide-card"><span class="basic-guide-icon" aria-hidden="true">${icon}</span><div><h3>${title}</h3><p>${description}</p></div></article>`).join('')}</div>`;
}
function startIntro(mode='new',section='lore'){introMode=mode;introSection=section;introIndex=0;introGuideMode='controls';if(section==='controls')controlsGuideMode=deviceMode==='quest'?'controller':'keyboard';renderIntro();showScreen('introScreen');}
function renderIntro(){
  const data=introData(introSection),item=data[introIndex]||data[0];if(!item)return;
  const label=introSection==='lore'?'IL PROLOGO':introSection==='die'?'MANUALE DEL DADO':introGuideMode==='functions'?'FUNZIONI DI GIOCO':'COMANDI';
  $('introKicker').textContent=label;
  $('introTitle').textContent=introSection==='controls'&&introGuideMode==='functions'?'Cosa puoi fare nel viaggio':item.title||label;
  $('introGuideTabs').classList.toggle('hidden',introSection!=='controls');
  document.querySelectorAll('[data-intro-guide-mode]').forEach(button=>{
    const active=button.dataset.introGuideMode===introGuideMode;
    button.classList.toggle('active',active);
    button.setAttribute('aria-selected',String(active));
  });
  document.querySelector('.intro-layout').classList.toggle('controls-layout',introSection==='controls');
  $('introVisual').className='intro-visual visual-'+(introSection==='controls'?(introGuideMode==='functions'?'functions':'controls'):item.visual||'die');
  if(introSection==='controls'&&introGuideMode==='functions')renderGameFunctionsGuide();
  else if(introSection==='controls')renderControlsGuide();
  else{$('introText').textContent=item.text||'';$('introVisual').innerHTML=introVisualMarkup(item.visual||(introSection==='die'?'die':'kingdoms'));}
  $('introCount').textContent=`${introIndex+1} / ${data.length}`;
  $('introBackBtn').disabled=false;
  $('introBackBtn').textContent=introIndex===0&&introSection==='lore'?'Titolo':'Indietro';
  $('introSkipBtn').textContent=introMode==='new'?'Salta il racconto':'Chiudi';
  const last=introIndex>=data.length-1;
  $('introNextBtn').textContent=!last?'Continua →':introMode!=='new'?'Torna al titolo':'Scegli il personaggio →';
  const total=introMode==='new'?(introData('lore').length||3):data.length;
  const offset=0;
  const progress=introMode==='new'?((offset+introIndex+1)/total):(introIndex+1)/data.length;
  $('introProgressFill').style.width=(progress*100)+'%';
}
function nextIntro(){
  const data=introData(introSection);
  if(introIndex<data.length-1){introIndex++;renderIntro();return;}
  if(introMode!=='new'){showScreen('titleScreen');return;}
  if(introSection==='lore'){showScreen('classScreen');$('heroName').focus();return;}
  if(introSection==='die'){introSection='controls';introIndex=0;renderIntro();return;}
  showScreen('classScreen');$('heroName').focus();
}
function previousIntro(){
  if(introIndex>0){introIndex--;renderIntro();return;}
  if(introMode==='new'&&introSection==='controls'){introSection='die';introIndex=introData('die').length-1;renderIntro();return;}
  if(introMode==='new'&&introSection==='die'){introSection='lore';introIndex=introData('lore').length-1;renderIntro();return;}
  showScreen('titleScreen');
}
function skipIntro(){showScreen(introMode==='new'?'classScreen':'titleScreen');if(introMode==='new')$('heroName').focus();}

function applyDeviceMode(mode){
  if(!DEVICE_MODES.includes(mode))throw new Error('Modalità di gioco non riconosciuta.');
  deviceMode=mode;document.body.dataset.deviceMode=mode;
  document.querySelectorAll('[data-device-mode]').forEach(button=>{
    const selected=button.dataset.deviceMode===mode;
    button.classList.toggle('selected',selected);
    button.setAttribute('aria-pressed',String(selected));
  });
  $('xrLaunch').classList.toggle('hidden',mode!=='quest');
  $('touchControls').setAttribute('aria-hidden',String(mode!=='mobile'));
  controlsGuideMode=mode==='quest'?'controller':'keyboard';
  refreshControlsHint();
}
function isXRActive(){return !!xrExperience&&xrExperience.baseExperience.state===BABYLON.WebXRState.IN_XR;}
function syncXRRoomScale(vrCamera){
  if(!vrCamera||!playerRoot){xrLastHeadsetPosition=null;return BABYLON.Vector3.Zero();}
  const tracked=vrCamera.getAbsolutePosition().clone(),previous=xrLastHeadsetPosition?.clone()||null;
  xrLastHeadsetPosition.copyFrom(tracked);
  if(!previous||!game||inputLocked||!$('pauseScreen').classList.contains('hidden')||!$('sidePanel').classList.contains('hidden')||!$('localMap').classList.contains('hidden')||dialogueVisible||currentBattle||pendingChoice)return BABYLON.Vector3.Zero();
  const delta=tracked.subtract(previous);delta.y=0;
  if(delta.lengthSquared()<.000001||delta.lengthSquared()>2.25)return BABYLON.Vector3.Zero();
  const before=playerRoot.position.clone();
  playerRoot.moveWithCollisions(delta);
  const moved=playerRoot.position.subtract(before);moved.y=0;
  if(camera?.target)camera.target.addInPlace(moved);
  return moved;
}
function chooseDeviceMode(mode){
  applyDeviceMode(mode);
  try{localStorage.setItem(DEVICE_MODE_STORAGE_KEY,mode);}catch(error){console.warn('Preferenza dispositivo non salvata:',error);}
  showScreen('titleScreen');
  if(mode==='quest')refreshXRStatus();
}
function showDeviceSelection(){showScreen('deviceScreen');}
function refreshXRStatus(message=''){
  const status=$('xrStatus'),button=$('enterXRBtn');
  if(message){status.textContent=message;button.disabled=true;return;}
  if(!window.isSecureContext){status.textContent='Apri il gioco da un indirizzo HTTPS sicuro sul visore.';button.disabled=true;}
  else if(!navigator.xr){status.textContent='Questo browser non offre WebXR. Prova il browser Meta Quest.';button.disabled=true;}
  else if(!xrExperience?.baseExperience){status.textContent='Sto preparando il supporto per il visore…';button.disabled=true;}
  else{status.textContent='Indossa il visore e seleziona “Entra nel visore”.';button.disabled=false;}
}
function xrFailureMessage(error){
  if(error?.name==='SecurityError')return 'WebXR è stato bloccato per motivi di sicurezza. Apri il gioco via HTTPS nel browser del visore.';
  if(error?.name==='NotAllowedError')return 'Il browser o il visore ha negato l’accesso WebXR. Riprova dal pulsante nel browser del visore e consenti l’avvio.';
  if(error?.name==='NotSupportedError')return 'Il browser non supporta la sessione o una funzione WebXR richiesta (immersive-vr, local-floor o dom-overlay). Prova il browser Meta Quest aggiornato.';
  const details=error?.name||error?.message?` (${error.name||'errore'}${error.message?`: ${error.message}`:''})`:'';
  return `Avvio WebXR non riuscito.${details} Controlla il browser e riprova.`;
}
async function prepareXRExperience(){
  if(!navigator.xr||!window.isSecureContext){refreshXRStatus();return;}
  try{
    refreshXRStatus('Controllo il browser e preparo il visore…');
    const supported=await navigator.xr.isSessionSupported('immersive-vr');
    if(!supported){refreshXRStatus('Modalità VR non disponibile in questo browser. Prova il browser Meta Quest.');return;}
    xrExperience=await scene.createDefaultXRExperienceAsync({
      disableDefaultUI:true,disableTeleportation:true,
      inputOptions:{doNotLoadControllerMeshes:true}
    });
    if(!xrExperience.baseExperience)throw new Error('Il browser non ha creato una sessione WebXR.');
    xrExperience.baseExperience.onInitialXRPoseSetObservable.add(xrCamera=>{
      if(!game||!playerRoot)return;
      const direction=xrCamera.getDirection(BABYLON.Axis.Z).clone();direction.y=0;
      if(direction.lengthSquared()>0)direction.normalize();
      const start=playerRoot.position.subtract(direction.scale(2.6));
      xrCamera.position.set(start.x,0,start.z);
      xrLastHeadsetPosition=xrCamera.getAbsolutePosition().clone();
    });
    xrExperience.baseExperience.onStateChangedObservable.add(()=>{xrLastHeadsetPosition=null;xrControllerButtonStates.clear();xrControllerMotion.clear();if(game&&currentBattle)updateCombatHUD();});
    refreshXRStatus();
  }catch(error){
    console.error('Inizializzazione WebXR non riuscita:',error);
    refreshXRStatus(xrFailureMessage(error));
  }
}
async function enterQuestVR(){
  if(!xrExperience){refreshXRStatus();return;}
  try{
    await xrExperience.baseExperience.enterXRAsync('immersive-vr','local-floor',undefined,{
      requiredFeatures:['dom-overlay'],
      optionalFeatures:['hand-tracking'],
      domOverlay:{root:document.body}
    });
  }catch(error){
    console.error('Avvio della sessione VR non riuscito:',error);
    $('xrStatus').textContent=xrFailureMessage(error);
    $('enterXRBtn').disabled=false;
  }
}

async function boot(){
  let savedDeviceMode='pc';
  try{const saved=localStorage.getItem(DEVICE_MODE_STORAGE_KEY);if(DEVICE_MODES.includes(saved))savedDeviceMode=saved;}catch(error){console.warn('Preferenza dispositivo non leggibile:',error);}
  applyDeviceMode(savedDeviceMode);
  try {
    const [archiveResponse,storyResponse]=await Promise.all([
      fetch('data/chronicles_content.json'),fetch('data/red_cross_story.json')
    ]);
    if(!archiveResponse.ok)throw new Error('Archivio: HTTP '+archiveResponse.status);
    if(!storyResponse.ok)throw new Error('Cronaca Croce Rossa: HTTP '+storyResponse.status);
    content=await archiveResponse.json();
    applyRedCrossStory(await storyResponse.json());
    registerForgeWeapons();
  }
  catch(err){ console.error(err); $('deviceScreen').innerHTML='<div class="setup-card"><h2>Storia non disponibile</h2><p>Avvia il gioco con AVVIA_WEB.bat e verifica che la cartella data sia presente.</p><p class="device-note">Dettaglio: '+escapeHtml(err.message)+'</p></div>'; return; }
  if(!window.BABYLON){$('deviceScreen').innerHTML='<div class="setup-card"><h2>Motore 3D non caricato</h2><p>Controlla la connessione Internet e ricarica il gioco.</p><p class="device-note">La storia è stata caricata, ma il renderer 3D non è disponibile.</p></div>';return;}
  loadControlSettings();init3D();populateClassScreen();populateArchive();refreshControlsHint();showScreen('deviceScreen');prepareXRExperience();
  refreshContinueButton();
}

function init3D(){
  engine=new BABYLON.Engine(canvas,true,{preserveDrawingBuffer:false,stencil:false,adaptToDeviceRatio:true});
  engine.setHardwareScalingLevel(Math.max(1,Math.min(1.6,(window.devicePixelRatio||1)/1.25)));
  scene=new BABYLON.Scene(engine); scene.collisionsEnabled=true;scene.skipPointerMovePicking=true;
  scene.clearColor=new BABYLON.Color4(.025,.028,.055,1);
  camera=new BABYLON.ArcRotateCamera('camera',-Math.PI/2,1.15,17,new BABYLON.Vector3(0,1,0),scene);
  camera.lowerRadiusLimit=5;camera.upperRadiusLimit=32;camera.lowerBetaLimit=.34;camera.upperBetaLimit=1.56;camera.wheelDeltaPercentage=.012;camera.panningSensibility=85;camera.useCtrlForPanning=false;camera.inertia=.78;camera.angularSensibilityX=720;camera.angularSensibilityY=720;camera.attachControl(canvas,true);if(camera.inputs?.attached?.pointers){camera.inputs.attached.pointers.panningMouseButton=2;camera.inputs.attached.pointers.buttons=[0,1,2];}
  ambientLight=new BABYLON.HemisphericLight('ambient',new BABYLON.Vector3(0,1,0),scene);ambientLight.intensity=.52;ambientLight.groundColor=new BABYLON.Color3(.12,.1,.17);
  sunLight=new BABYLON.DirectionalLight('sun_light',new BABYLON.Vector3(-.45,-1,.3),scene);sunLight.position=new BABYLON.Vector3(-30,55,-25);sunLight.intensity=0;sunLight.diffuse=new BABYLON.Color3(1,.91,.76);
  moonLight=new BABYLON.DirectionalLight('moon_light',new BABYLON.Vector3(.45,-.7,-.3),scene);moonLight.position=new BABYLON.Vector3(30,45,25);moonLight.intensity=.14;moonLight.diffuse=new BABYLON.Color3(.48,.58,.82);
  if(BABYLON.ShadowGenerator){shadowGenerator=new BABYLON.ShadowGenerator(1024,sunLight);shadowGenerator.useBlurExponentialShadowMap=true;shadowGenerator.blurKernel=12;shadowGenerator.bias=.0005;shadowGenerator.normalBias=.025;shadowGenerator.setDarkness(.32);}
  scene.fogMode=BABYLON.Scene.FOGMODE_EXP2;scene.fogDensity=.0048;scene.fogColor=new BABYLON.Color3(.04,.045,.08);
  createSkySystem();
  buildTitleWorld();refreshShadowList();
  scene.onBeforeRenderObservable.add(()=>updateWorld());
  engine.runRenderLoop(()=>{if(scene&&!document.hidden)scene.render();});
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  window.addEventListener('resize',()=>engine.resize());
}

function mat(name,hex,emissive=null,alpha=1){const m=new BABYLON.StandardMaterial(name,scene);m.diffuseColor=BABYLON.Color3.FromHexString(hex);m.specularColor=new BABYLON.Color3(.1,.09,.11);if(emissive)m.emissiveColor=BABYLON.Color3.FromHexString(emissive);m.alpha=alpha;return m;}
function makeBox(name,pos,size,material,parent=worldRoot,rotation=null,collide=true){const m=BABYLON.MeshBuilder.CreateBox(name,{width:size[0],height:size[1],depth:size[2]},scene);m.position.set(pos[0],pos[1],pos[2]);m.material=material;if(parent)m.parent=parent;if(rotation)m.rotation.set(rotation[0],rotation[1],rotation[2]);m.checkCollisions=collide;return m;}
function makeCylinder(name,pos,diameter,height,material,parent=worldRoot,tess=12){const m=BABYLON.MeshBuilder.CreateCylinder(name,{diameter,height,tessellation:tess},scene);m.position.set(pos[0],pos[1],pos[2]);m.material=material;if(parent)m.parent=parent;m.checkCollisions=true;return m;}
function makeSphere(name,pos,diameter,material,parent=worldRoot,segments=12){const m=BABYLON.MeshBuilder.CreateSphere(name,{diameter,segments},scene);m.position.set(pos[0],pos[1],pos[2]);m.material=material;if(parent)m.parent=parent;return m;}
function makePavingMaterial(name,baseHex){
  if(pavingMaterials.has(baseHex))return pavingMaterials.get(baseHex);
  const texture=new BABYLON.DynamicTexture(name+'_texture',{width:512,height:512},scene,false),ctx=texture.getContext();
  ctx.fillStyle=baseHex;ctx.fillRect(0,0,512,512);
  const shades=[mixHex(baseHex,'#17151a',.16),mixHex(baseHex,'#d4c2a0',.1),mixHex(baseHex,'#17151a',.08)];
  const cellW=64,cellH=40;
  for(let row=0;row<13;row++)for(let col=-1;col<9;col++){
    const x=col*cellW+(row%2)*cellW/2,y=row*cellH,index=(row*7+col*3+30)%shades.length;
    ctx.fillStyle=shades[index];ctx.fillRect(x+2,y+2,cellW-4,cellH-4);
    ctx.strokeStyle=mixHex(baseHex,'#08080c',.34);ctx.lineWidth=2;ctx.strokeRect(x+2,y+2,cellW-4,cellH-4);
    ctx.fillStyle='rgba(255,255,255,.07)';ctx.fillRect(x+5,y+4,cellW-10,2);
  }
  texture.update(false);texture.wrapU=BABYLON.Texture.WRAP_ADDRESSMODE;texture.wrapV=BABYLON.Texture.WRAP_ADDRESSMODE;texture.uScale=1.5;texture.vScale=8;
  const material=mat(name,'#ffffff');material.diffuseTexture=texture;material.specularColor=new BABYLON.Color3(.035,.03,.025);pavingMaterials.set(baseHex,material);return material;
}
function makeRoof(name,x,y,z,w,d,material,parent=worldRoot){
  const a=makeBox(name+'_left',[x-w*.25,y,z],[w*.58,.34,d*1.12],material,parent,[0,0,-.62],false);
  const b=makeBox(name+'_right',[x+w*.25,y,z],[w*.58,.34,d*1.12],material,parent,[0,0,.62],false);
  return [a,b];
}
function makeHouse(name,x,z,wallHex,roofHex,opts={}){
  const wall=mat(name+'_wall',wallHex),roof=mat(name+'_roof',roofHex),wood=mat(name+'_wood','#392a29'),door=mat(name+'_door','#241a1b'),glass=mat(name+'_glass','#e6ba75','#e6a75d');
  const scale=opts.home?1.22:1,w=(opts.w||5.4)*scale,d=(opts.d||4.6)*scale,h=(opts.h||3.0)*(opts.home?1.1:1);
  const frontZ=z+d/2,doorWidth=1.5,sideWidth=(w-doorWidth)/2;
  makeBox(name+'_back',[x,h/2,z-d/2],[w,h,.22],wall,worldRoot,null,true);
  for(const side of [-1,1])makeBox(name+'_side',[x+side*w/2,h/2,z],[.22,h,d],wall,worldRoot,null,true);
  for(const side of [-1,1])makeBox(name+'_front_wall',[x+side*(doorWidth/2+sideWidth/2),h/2,frontZ],[sideWidth,h,.22],wall,worldRoot,null,true);
  makeBox(name+'_door_header',[x,h-.48,frontZ],[doorWidth,.96,.22],wall,worldRoot,null,true);
  if(!opts.home)makeBox(name+'_door_blocker',[x,h/2,frontZ],[doorWidth,h,.22],wall,worldRoot,null,true);
  makeRoof(name+'_roof',x,h+.22,z,w,d,roof,worldRoot);
  makeBox(name+'_ridge',[x,h+.48,z],[.16,.22,d*1.18],wood,worldRoot,null,false);
  makeBox(name+'_eave',[x,h+.08,z+d*.52],[w+.28,.14,.18],wood,worldRoot,null,false);
  makeBox(name+'_door',[x,h*.36,frontZ+.025],[.85,1.5,.08],door,worldRoot,null,false);
  makeBox(name+'_doorframe',[x-doorWidth/2,h*.36,frontZ+.07],[.08,1.62,.07],wood,worldRoot,null,false);
  makeBox(name+'_doorframe_right',[x+doorWidth/2,h*.36,frontZ+.07],[.08,1.62,.07],wood,worldRoot,null,false);
  makeBox(name+'_door_lintel',[x,h*.36+.83,frontZ+.07],[doorWidth+.1,.09,.07],wood,worldRoot,null,false);
  makeBox(name+'_door_handle',[x+.27,h*.36,frontZ+.12],[.08,.08,.04],mat(name+'_brass','#c49b58','#8e6530'),worldRoot,null,false);
  makeBox(name+'_windowL',[x-w*.30,h*.62,frontZ+.04],[.62,.62,.08],glass,worldRoot,null,false);
  makeBox(name+'_windowR',[x+w*.30,h*.62,frontZ+.04],[.62,.62,.08],glass,worldRoot,null,false);
  makeBox(name+'_windowL_cross',[x-w*.30,h*.62,frontZ+.09],[.05,.7,.04],wood,worldRoot,null,false);
  makeBox(name+'_windowR_cross',[x+w*.30,h*.62,frontZ+.09],[.05,.7,.04],wood,worldRoot,null,false);
  for(const dx of [-w*.30,w*.30])for(const side of [-1,1])makeBox(name+'_shutter',[x+dx+side*.4,h*.62,frontZ+.055],[.16,.7,.08],wood,worldRoot,[0,0,side*.08],false);
  makeBox(name+'_window_sillL',[x-w*.30,h*.62-.37,frontZ+.08],[.9,.09,.16],wood,worldRoot,null,false);
  makeBox(name+'_window_sillR',[x+w*.30,h*.62-.37,frontZ+.08],[.9,.09,.16],wood,worldRoot,null,false);
  // Timber framing and stone footings make the buildings read as medieval rather than abstract blocks.
  for(const dx of [-w*.43,w*.43])makeBox(name+'_beam',[x+dx,h*.5,frontZ+.045],[.13,h,.1],wood,worldRoot,null,false);
  makeBox(name+'_lintel',[x,h*.82,frontZ+.06],[w*.88,.12,.1],wood,worldRoot,null,false);
  const stone=mat(name+'_stone','#514941');
  makeBox(name+'_foundation_back',[x,.14,z-d/2],[w+.15,.28,.32],stone,worldRoot,null,true);
  for(const side of [-1,1]){
    makeBox(name+'_foundation_side',[x+side*w/2,.14,z],[.32,.28,d],stone,worldRoot,null,true);
    makeBox(name+'_foundation_front',[x+side*(doorWidth/2+sideWidth/2),.14,frontZ],[sideWidth+.08,.28,.32],stone,worldRoot,null,true);
  }
  for(const dx of [-w*.48,w*.48])makeBox(name+'_stone_corner',[x+dx,.38,frontZ+.04],[.24,.42,.14],mat(name+'_cornerstone',mixHex(wallHex,'#d5c3a0',.18)),worldRoot,null,false);
  if(opts.chimney!==false){
    makeBox(name+'_chimney',[x+w*.29,h+.86,z-d*.2],[.62,1.32,.62],mat(name+'_chimney_stone',mixHex(wallHex,'#211d20',.26)),worldRoot,null,true);
    makeBox(name+'_chimney_cap',[x+w*.29,h+1.55,z-d*.2],[.82,.16,.82],wood,worldRoot,null,false);
  }
  if(opts.sign){makeBox(name+'_sign_bracket',[x,h+.25,z+d/2+.08],[.12,.42,.1],wood,worldRoot,null,false);makeBox(name+'_sign',[x,h+.48,z+d/2+.12],[1.35,.45,.1],mat(name+'_signmat','#302431',opts.signGlow||'#c69d58'),worldRoot,null,false);}
  if(opts.home){
    const root=new BABYLON.TransformNode(name+'_entrance',scene);root.position.set(x,.9,frontZ+1.25);root.parent=worldRoot;
    houseEntrances.push({kind:'house',root,name:'Entra: '+opts.home.label,position:root.position,home:opts.home});
  }
}
function createHouseInterior(home){
  if(houseInteriorRoot)houseInteriorRoot.dispose(false,true);
  houseInteriorRoot=new BABYLON.TransformNode('house_interior_'+home.id,scene);
  const empty=home.type==='empty',civicRoom=['committee','uds','warehouse','clinic'].includes(home.type),w=12,d=11,h=3.8,front=5.5;
  const civicWall=home.type==='committee'||home.type==='clinic'?'#e4ece9':home.type==='uds'?'#dce8e4':'#e5e0d4';
  const wall=mat('interior_wall_'+home.id,empty?'#4b4743':civicRoom?civicWall:home.type==='forge'?'#51433d':'#796958');
  const wood=mat('interior_wood_'+home.id,empty?'#352c28':'#51392d');
  const floor=mat('interior_floor_'+home.id,empty?'#534b43':civicRoom?'#c9d4d1':'#78583e');
  const trim=mat('interior_trim_'+home.id,empty?'#302a28':'#382a28');
  const plaster=mat('interior_plaster_'+home.id,empty?'#5b554f':civicRoom?'#f4f6f2':'#a08a6b');
  const floorMesh=BABYLON.MeshBuilder.CreateGround('interior_floor',{width:w,height:d},scene);floorMesh.material=floor;floorMesh.parent=houseInteriorRoot;floorMesh.checkCollisions=true;
  for(let z=-d/2+.3;z<d/2;z+=.75){
    makeBox('interior_floor_seam',[0,.018,z],[w-.12,.025,.025],mat('interior_floor_seam_mat_'+home.id,empty?'#332c29':'#513a30'),houseInteriorRoot,null,false);
  }
  makeBox('interior_back_wall',[0,h/2,-d/2],[w,h,.22],wall,houseInteriorRoot,null,true);
  for(const x of [-w/2,w/2])makeBox('interior_side_wall',[x,h/2,0],[.22,h,d],wall,houseInteriorRoot,null,true);
  for(const x of [-2.8,2.8])makeBox('interior_front_wall',[x,h/2,front],[6.4,h,.22],wall,houseInteriorRoot,null,true);
  makeBox('interior_front_header',[0,h-.68,front],[2.4,1.36,.22],wall,houseInteriorRoot,null,true);
  makeBox('interior_door_trim_left',[-1.22,1.1,front-.08],[.16,2.2,.14],wood,houseInteriorRoot,null,false);
  makeBox('interior_door_trim_right',[1.22,1.1,front-.08],[.16,2.2,.14],wood,houseInteriorRoot,null,false);
  makeBox('interior_door_lintel',[0,2.24,front-.08],[2.55,.18,.14],wood,houseInteriorRoot,null,false);
  for(const x of [-w/2+.15,w/2-.15]){
    makeBox('interior_wainscot',[x,.72,0],[.08,1.35,d-.5],plaster,houseInteriorRoot,null,false);
    makeBox('interior_wainscot_rail',[x,1.42,0],[.12,.1,d-.5],wood,houseInteriorRoot,null,false);
    makeBox('interior_corner_beam',[x,h/2,-d/2+.18],[.16,h-.2,.16],wood,houseInteriorRoot,null,false);
  }
  for(const z of [-3.8,-1.3,1.2,3.7])makeBox('interior_ceiling_beam',[0,h-.12,z],[w-.5,.12,.1],mat('interior_ceiling_beam_mat_'+home.id,empty?'#493d35':'#74543a'),houseInteriorRoot,null,false);
  for(const side of [-1,1]){
    const x=side*4.25;
    makeBox('interior_window_glow',[x,2.55,-.25],[.08,1.35,1.7],mat('interior_window_light_'+home.id,'#d7ad72','#d19658',.72),houseInteriorRoot,null,false);
    makeBox('interior_window_frame_h',[x,1.82,-.25],[.16,.12,1.9],wood,houseInteriorRoot,null,false);
    makeBox('interior_window_frame_h',[x,3.28,-.25],[.16,.12,1.9],wood,houseInteriorRoot,null,false);
    makeBox('interior_window_frame_v',[x,2.55,-1.15],[.16,1.55,.12],wood,houseInteriorRoot,null,false);
    makeBox('interior_window_frame_v',[x,2.55,.65],[.16,1.55,.12],wood,houseInteriorRoot,null,false);
  }
  if(!civicRoom){
    makeBox('interior_rug',[0,.035,.15],[4.2,.05,2.8],mat('interior_rug_mat_'+home.id,empty?'#5b5148':home.type==='inn'?'#75506a':home.type==='forge'?'#66534b':'#78504a'),houseInteriorRoot,null,false);
    makeBox('interior_rug_border',[0,.064,.15],[3.9,.018,2.5],mat('interior_rug_border_mat_'+home.id,empty?'#777064':'#c3a16b'),houseInteriorRoot,null,false);
    makeBox('interior_table',[-2.2,.88,-.35],[2.5,.2,1.45],wood,houseInteriorRoot,null,true);
    for(const x of [-3.15,-1.25])for(const z of [-.8,.1])makeBox('interior_table_leg',[x,.44,z],[.16,.88,.16],wood,houseInteriorRoot,null,true);
    makeBox('interior_table_top',[-2.2,1.01,-.35],[2.65,.08,1.55],mat('interior_table_top_'+home.id,empty?'#6b6053':'#694a35'),houseInteriorRoot,null,false);
  }
  if(!empty&&!civicRoom){
    for(const x of [-3.1,-1.25])makeBox('interior_chair_seat',[x,.48,1.15],[.85,.14,.8],wood,houseInteriorRoot,null,true);
    for(const x of [-3.42,-2.78,-1.57,-.93])makeBox('interior_chair_leg',[x,.24,1.15],[.09,.48,.09],wood,houseInteriorRoot,null,true);
    for(const x of [-3.1,-1.25])makeBox('interior_chair_back',[x,1.02,1.52],[.82,1,.12],wood,houseInteriorRoot,null,true);
  }
  if(!empty&&!civicRoom){
    makeBox('interior_bed_frame',[3.5,.42,-2.5],[2.5,.48,3.35],wood,houseInteriorRoot,null,true);
    makeBox('interior_bed_mattress',[3.5,.72,-2.5],[2.32,.22,3.12],mat('interior_bed_mattress_'+home.id,'#bdad91'),houseInteriorRoot,null,false);
    makeBox('interior_bed_cover',[3.5,.86,-2.05],[2.2,.14,2.05],mat('interior_bed_cover_'+home.id,'#74636a'),houseInteriorRoot,null,false);
    makeBox('interior_pillow',[3.5,.89,-3.55],[1.25,.18,.65],mat('interior_pillow_'+home.id,'#d4c6a9'),houseInteriorRoot,null,false);
  }else{
    makeBox('empty_house_crate',[3.1,.42,-2.35],[1.35,.8,1.2],wood,houseInteriorRoot,null,true);
    makeBox('empty_house_dust',[3.1,.84,-2.35],[1.4,.06,1.25],mat('empty_house_dust_mat','#928574','#675c50'),houseInteriorRoot,null,false);
  }
  if(!civicRoom){
    makeBox('interior_hearth',[0,.42,-4.55],[2.8,.84,.6],trim,houseInteriorRoot,null,true);
    makeBox('interior_hearth_shelf',[0,.92,-4.24],[3.1,.14,.5],wood,houseInteriorRoot,null,false);
    makeBox('interior_fire',[0,.82,-4.2],[.52,.62,.12],mat('interior_fire_'+home.id,'#c46e3a','#d76232'),houseInteriorRoot,null,false);
    makeBox('interior_chimney_niche',[0,1.65,-5.22],[2.1,1.2,.12],trim,houseInteriorRoot,null,false);
  }
  if(home.type==='bakery'){
    makeBox('bakery_oven_base',[-4.25,.62,-3.25],[2.2,1.24,2.1],trim,houseInteriorRoot,null,true);
    makeBox('bakery_oven_arch',[-4.25,1.25,-2.15],[1.55,1.2,.14],mat('bakery_oven_glow','#8f4833','#d9763e'),houseInteriorRoot,null,false);
    makeBox('bakery_loaf_shelf',[4.15,1.55,2.1],[2.3,.18,1.05],wood,houseInteriorRoot,null,true);
    for(const x of [3.45,4.1,4.75])makeSphere('bakery_loaf',[x,1.9,2.1],.48,mat('bakery_loaf_mat','#bd8b52'),houseInteriorRoot,8);
  }else if(home.type==='forge'){
    makeBox('forge_workbench',[4.2,.72,1.7],[2.3,.18,2.4],wood,houseInteriorRoot,null,true);
    makeBox('forge_anvil_block',[4.2,1.08,1.7],[1.2,.52,.9],mat('forge_anvil_mat','#55545a','#373741'),houseInteriorRoot,null,true);
    makeBox('forge_anvil_face',[4.2,1.38,1.7],[1.8,.16,.75],mat('forge_anvil_face_mat','#aaa5a1','#5d5552'),houseInteriorRoot,null,false);
    for(const x of [3.3,3.8,4.7,5.1])makeBox('forge_tool_rack',[x,2.05,-5.2],[.12,1.3,.12],mat('forge_tool_rack_mat','#8f8170'),houseInteriorRoot,[0,0,x<4.2?-.18:.18],false);
  }else if(home.type==='inn'){
    makeBox('inn_serving_counter',[4.2,.85,-2.3],[2.2,1.7,1],wood,houseInteriorRoot,null,true);
    makeBox('inn_counter_top',[4.2,1.75,-2.3],[2.45,.14,1.2],mat('inn_counter_top_mat','#916b45'),houseInteriorRoot,null,false);
    makeCylinder('inn_soup_pot',[4.2,1.98,-2.3],.8,.44,mat('inn_soup_pot_mat','#4c4542'),houseInteriorRoot,10);
    makeCylinder('inn_soup_surface',[4.2,2.22,-2.3],.62,.04,mat('inn_soup_surface_mat','#a45a36','#d67b37'),houseInteriorRoot,10);
  }else if(home.type==='home'){
    makeBox('home_wall_shelf',[4.45,2.3,-4.9],[1.8,.16,.75],wood,houseInteriorRoot,null,true);
    for(const x of [3.85,4.45,5.05])makeCylinder('home_shelf_pot',[x,2.62,-4.9],.36,.48,mat('home_shelf_pot_mat','#9a765c'),houseInteriorRoot,8);
  }else if(home.type==='committee'||home.type==='clinic'){
    const clinical=home.type==='clinic',bedX=3.25;
    makeBox('care_couch_frame_'+home.id,[bedX,.42,-1.8],[2.25,.42,3.2],mat('care_couch_frame_mat_'+home.id,'#e7e9e5'),houseInteriorRoot,null,true);
    makeBox('care_couch_mattress_'+home.id,[bedX,.68,-1.8],[2.08,.18,2.95],mat('care_couch_mattress_mat_'+home.id,'#f8f8f3'),houseInteriorRoot,null,false);
    makeBox('care_couch_pillow_'+home.id,[bedX,.81,-3.02],[1.1,.16,.55],mat('care_couch_pillow_mat_'+home.id,'#d7e8e4'),houseInteriorRoot,null,false);
    makeBox('care_privacy_screen_'+home.id,[.9,1.45,-1.55],[.12,2.5,3.4],mat('care_privacy_screen_mat_'+home.id,'#e9efed'),houseInteriorRoot,null,false);
    makeBox('care_supply_cabinet_'+home.id,[-4.55,1.05,-3.5],[1.55,2.1,.9],mat('care_supply_cabinet_mat_'+home.id,'#f3f4ef'),houseInteriorRoot,null,true);
    makeBox('care_cross_vertical_'+home.id,[-4.55,1.75,-3.02],[.13,.58,.035],mat('care_cross_mat_'+home.id,'#d92332'),houseInteriorRoot,null,false);
    makeBox('care_cross_horizontal_'+home.id,[-4.55,1.75,-3.0],[.58,.13,.035],mat('care_cross_mat_'+home.id,'#d92332'),houseInteriorRoot,null,false);
    makeBox('care_chair_'+home.id,[-1.8,.46,2.05],[1.35,.15,1],mat('care_chair_mat_'+home.id,'#d7e2de'),houseInteriorRoot,null,true);
    if(clinical)makeBox('care_information_board_'+home.id,[-.3,2.2,-5.25],[2.8,1.2,.12],mat('care_information_board_mat_'+home.id,'#f8f8f3'),houseInteriorRoot,null,false);
  }else if(home.type==='uds'){
    const table=mat('uds_table_mat','#88775c'),steel=mat('uds_fridge_mat','#dbe4e3'),crates=mat('uds_crate_mat','#c5aa78');
    for(const [x,z] of [[-1.3,-.25],[1.8,1.65]]){
      makeBox('uds_prep_table',[x,.88,z],[3.1,.16,1.45],table,houseInteriorRoot,null,true);
      for(const dx of [-1.25,1.25])for(const dz of [-.48,.48])makeBox('uds_prep_table_leg',[x+dx,.44,z+dz],[.12,.88,.12],table,houseInteriorRoot,null,true);
      for(const dx of [-.7,.45])makeBox('uds_supply_box',[x+dx,1.2,z],[.68,.46,.58],crates,houseInteriorRoot,null,false);
    }
    for(const x of [4.1,5.15]){
      makeBox('uds_refrigerator',[x,1.35,-3.25],[.82,2.7,1.15],steel,houseInteriorRoot,null,true);
      makeBox('uds_refrigerator_door',[x,1.35,-2.65],[.72,2.55,.08],mat('uds_refrigerator_door_mat','#edf2f0'),houseInteriorRoot,null,false);
      makeBox('uds_refrigerator_handle',[x+.24,1.35,-2.58],[.045,.65,.045],mat('uds_refrigerator_handle_mat','#75878a'),houseInteriorRoot,null,false);
    }
    for(const x of [-4.6,-3.55])makeBox('uds_insulated_bag',[x,.55,2.5],[.82,.86,.82],mat('uds_insulated_bag_mat','#557d89'),houseInteriorRoot,null,true);
  }else if(home.type==='warehouse'){
    for(const x of [-4.55,4.55]){
      makeBox('warehouse_shelf_frame',[x,1.35,-1.8],[.18,2.7,5.2],mat('warehouse_shelf_frame_mat','#687572'),houseInteriorRoot,null,true);
      for(const y of [.55,1.45,2.35])makeBox('warehouse_shelf',[x, y,-1.8],[1.7,.14,5.2],mat('warehouse_shelf_mat','#9b8b73'),houseInteriorRoot,null,true);
      for(const z of [-3.3,-1.8,-.3])makeBox('warehouse_stored_box',[x,1.88,z],[1.05,.72,.92],mat('warehouse_stored_box_mat',z< -2?'#b49a6c':'#8c9d8b'),houseInteriorRoot,null,false);
    }
    makeBox('warehouse_sorting_table',[0,.88,1.7],[3.2,.16,1.5],mat('warehouse_sorting_table_mat','#88775c'),houseInteriorRoot,null,true);
    makeBox('warehouse_handcart_base',[1.9,.34,-3.7],[1.5,.16,1.05],mat('warehouse_handcart_mat','#697876'),houseInteriorRoot,null,true);
    for(const x of [1.25,2.55])makeCylinder('warehouse_handcart_wheel',[x,.25,-3.7],.48,.13,mat('warehouse_handcart_wheel_mat','#343b3c'),houseInteriorRoot,10).rotation.x=Math.PI/2;
  }
  if(!empty&&!civicRoom){
    makeBox('interior_storage_shelf',[-4.25,1.35,2.45],[2,.14,1.2],wood,houseInteriorRoot,null,true);
    for(const x of [-4.8,-4.25,-3.7])makeBox('interior_storage_goods',[x,1.75,2.45],[.42,.65,.48],mat('interior_goods_'+home.id,x<-4.3?'#947052':'#75604f'),houseInteriorRoot,null,false);
  }
  if(home.resident){
    const residentRoot=new BABYLON.TransformNode('resident_'+home.id,scene),residentPosition=home.residentPosition||[-4.3,.5];residentRoot.position.set(residentPosition[0],0,residentPosition[1]);residentRoot.parent=houseInteriorRoot;
    buildHumanoid(residentRoot,home.resident,characterProfile(home.resident,home.color||'#7b6d5f',false),0);
    const isTeren=home.type==='forge'&&(!content?.redCrossStory||home.id==='teren');
    interactables.push({kind:isTeren?'blacksmith':'flavor',root:residentRoot,name:home.resident,speaker:home.resident,position:residentRoot.position,text:`${home.resident} sistema con cura le cose di ogni giorno. La casa sembra viva anche nei piccoli gesti.`});
  }
  for(const staff of home.staff||[]){
    const staffRoot=new BABYLON.TransformNode('facility_staff_'+home.id+'_'+staff.name.replace(/\W/g,''),scene);staffRoot.position.set(staff.position[0],0,staff.position[1]);staffRoot.parent=houseInteriorRoot;
    const model=buildHumanoid(staffRoot,staff.name,characterProfile(staff.name,staff.color||'#3d7d87',false),0);
    if(model?.metadata?.animation)Object.assign(model.metadata.animation,{roaming:true,roamIntensity:.38});
  }
  for(const feature of home.features||[]){
    const root=new BABYLON.TransformNode('feature_'+home.id+'_'+feature.id,scene);root.position.set(feature.position[0],0,feature.position[1]);root.parent=houseInteriorRoot;
    const featureMat=mat('feature_mat_'+home.id+'_'+feature.id,feature.color||'#a77b54',feature.glow||null);
    if(feature.shape==='round')makeCylinder('feature_shape',[0,.42,0],.9,.84,featureMat,root,10).parent=root;
    else if(feature.shape==='tall')makeBox('feature_shape',[0,.72,0],[.65,1.45,.65],featureMat,root,null,true).parent=root;
    else makeBox('feature_shape',[0,.38,0],[1.15,.72,.72],featureMat,root,null,true).parent=root;
    interactables.push({kind:'flavor',root,name:feature.label,speaker:feature.speaker||home.resident||'Appunti',text:feature.text,gift:feature.gift||null,claimedText:feature.claimedText||null,action:feature.action||null});
  }
  const exitRoot=new BABYLON.TransformNode('house_exit_'+home.id,scene);exitRoot.position.set(0,.9,4.35);exitRoot.parent=houseInteriorRoot;
  interactables.push({kind:'houseExit',root:exitRoot,name:'Esci dalla casa'});
  const light=new BABYLON.PointLight('interior_light_'+home.id,new BABYLON.Vector3(0,2.8,-.5),scene);light.parent=houseInteriorRoot;light.diffuse=BABYLON.Color3.FromHexString(home.light||'#e4b47a');light.intensity=1.35;light.range=17;
  for(const [x,z] of [[-4,-3],[4,-3],[-4,3],[4,3]]){
    const lamp=new BABYLON.PointLight('interior_lamp_'+home.id,new BABYLON.Vector3(x,2.15,z),scene);lamp.parent=houseInteriorRoot;lamp.diffuse=BABYLON.Color3.FromHexString(home.light||'#e4b47a');lamp.intensity=.24;lamp.range=8;
    makeSphere('interior_lamp_glow',[x,2.15,z],.28,mat('interior_lamp_glow_mat_'+home.id,home.light||'#e4b47a',home.light||'#e4b47a'),houseInteriorRoot,8);
  }
  freezeStaticMeshes(houseInteriorRoot);
}
function enterHouse(item){
  if(!worldRoot||!item?.home)return;
  exteriorPlayerPosition=playerRoot.position.clone();exteriorCameraState=camera?{alpha:camera.alpha,beta:camera.beta,radius:camera.radius}:null;
  exteriorInteractables=interactables.filter(entry=>entry.root&&!entry.root.isDisposed());
  activeHouse=item.home;worldRoot.setEnabled(false);interactables=[];
  createHouseInterior(activeHouse);playerRoot.position.set(0,.9,2.25);playerVerticalVelocity=0;
  if(camera){camera.setTarget(new BABYLON.Vector3(0,1.5,0));camera.alpha=Math.PI/2;camera.beta=.9;camera.radius=15;}
  toast('Sei entrato in: '+activeHouse.label+'. Avvicinati agli oggetti e premi E.');
}
function leaveHouse(){
  if(!houseInteriorRoot)return;
  houseInteriorRoot.dispose(false,true);houseInteriorRoot=null;activeHouse=null;
  interactables=(exteriorInteractables||houseEntrances).filter(entry=>entry.root&&!entry.root.isDisposed());exteriorInteractables=null;
  if(worldRoot)worldRoot.setEnabled(true);
  if(playerRoot&&exteriorPlayerPosition)playerRoot.position.copyFrom(exteriorPlayerPosition);
  exteriorPlayerPosition=null;playerVerticalVelocity=0;
  if(camera&&playerRoot){camera.setTarget(playerRoot.position.add(new BABYLON.Vector3(0,1,0)));if(exteriorCameraState){camera.alpha=exteriorCameraState.alpha;camera.beta=exteriorCameraState.beta;camera.radius=exteriorCameraState.radius;}}
  exteriorCameraState=null;
}
function makeTower(name,x,z,height,baseHex,roofHex){const body=mat(name+'_body',baseHex),roof=mat(name+'_top',roofHex);makeCylinder(name+'_tower',[x,height/2,z],3.1,height,body,worldRoot,12);const cap=BABYLON.MeshBuilder.CreateCylinder(name+'_cap',{diameterTop:.1,diameterBottom:3.6,height:2.1,tessellation:12},scene);cap.position.set(x,height+1,z);cap.material=roof;cap.parent=worldRoot;cap.checkCollisions=true;for(let i=0;i<4;i++){let a=i*Math.PI/2;makeBox(name+'_window',[x+Math.cos(a)*1.52,height*.55,z+Math.sin(a)*1.52],[.18,.8,.18],mat(name+'_light','#e9c17d','#e9ad60'),worldRoot,null,false);}}
function makeTree(x,z,leafHex='#415744'){const trunk=mat('tree_trunk','#49352a'),leaf=mat('tree_leaf',leafHex);makeCylinder('tree_trunk',[x,1.1,z],.45,2.2,trunk,worldRoot,7);makeSphere('tree_canopy',[x,2.7,z],2.2,leaf,worldRoot,7);makeSphere('tree_canopy2',[x-.55,2.9,z+.1],1.5,leaf,worldRoot,7);}
function makeGardenShrub(x,z,leafHex='#42583f',scale=1){
  const leaves=mat('garden_shrub_leaf',leafHex);
  for(const [dx,dz,size] of [[0,0,.9],[-.34,.08,.68],[.34,-.06,.7],[.02,-.3,.62]]){
    const leaf=makeSphere('garden_shrub',[x+dx*scale,.48*scale,z+dz*scale],size*scale,leaves,worldRoot,6);leaf.isPickable=false;leaf.checkCollisions=false;
  }
}
function makeWildflower(x,z,petalHex='#d7b56d',scale=1){
  const stem=makeCylinder('wildflower_stem',[x,.23*scale,z],.055*scale,.46*scale,mat('wildflower_stem_mat','#52684b'),worldRoot,5);stem.isPickable=false;stem.checkCollisions=false;
  const flower=makeSphere('wildflower_bloom',[x,.52*scale,z],.26*scale,mat('wildflower_petal_mat',petalHex),worldRoot,6);flower.isPickable=false;flower.checkCollisions=false;
}
function makeLamp(x,z,glow){const iron=mat('lamp_iron','#3d3942'),light=mat('lamp_glow',glow,glow);makeCylinder('lamp_post',[x,1.55,z],.13,3.1,iron,worldRoot,7);makeBox('lamp_cross',[x,3.1,z],[.85,.12,.12],iron,worldRoot,null,false);makeSphere('lamp_bulb',[x,2.75,z],.42,light,worldRoot,8);const point=new BABYLON.PointLight('lamp_point_light',new BABYLON.Vector3(x,2.7,z),scene);point.diffuse=BABYLON.Color3.FromHexString(glow);point.intensity=.42;point.range=13;point.parent=worldRoot;}
function makePillar(x,z,h,hex){const stone=mat('pillar_stone',hex);makeCylinder('pillar',[x,h/2,z],.85,h,stone,worldRoot,8);makeBox('pillar_cap',[x,h+.12,z],[1.25,.24,1.25],stone,worldRoot,null,true);}
function freezeStaticMeshes(root){
  if(!root||!scene)return;
  for(const mesh of scene.meshes){
    let node=mesh.parent,inside=false,dynamic=false;
    while(node){if(node===actorRoot)dynamic=true;if(node===root){inside=true;break;}node=node.parent;}
    if(!inside||dynamic||mesh.metadata?.phase!==undefined||mesh.metadata?.baseY!==undefined)continue;
    mesh.freezeWorldMatrix();
  }
}
function addAmbientMotes(palette){motes=[];const moteMat=mat('ambient_motes',palette.glow,palette.glow,.65);for(let i=0;i<30;i++){const m=makeSphere('mote',[Math.random()*90-45,Math.random()*9+1,Math.random()*90-45],.06+Math.random()*.08,moteMat,worldRoot,5);m.metadata={phase:Math.random()*10,speed:.15+Math.random()*.35,baseY:m.position.y};motes.push(m);}}
function buildTitleWorld(){
  if(worldRoot)worldRoot.dispose(false,true);worldRoot=new BABYLON.TransformNode('titleWorld',scene);actorRoot=new BABYLON.TransformNode('titleActors',scene);actorRoot.parent=worldRoot;currentSceneKey='__title__';motes=[];
  const p=WORLD_PALETTES[1];scene.clearColor=BABYLON.Color4.FromHexString('#77d5f5ff');scene.fogColor=BABYLON.Color3.FromHexString('#83d9f4');
  const ground= BABYLON.MeshBuilder.CreateGround('title_ground',{width:100,height:100,subdivisions:2},scene);ground.material=mat('title_ground_mat','#75c96f');ground.parent=worldRoot;ground.checkCollisions=true;
  makeBox('title_plaza',[0,.12,0],[17,.22,14],mat('title_plaza_mat','#f4d982'),worldRoot,null,false);
  makeBox('title_emblem_back',[0,2.45,0],[3.3,3.3,.38],mat('title_emblem_white','#fffdf8'),worldRoot,null,false);
  makeBox('title_emblem_vertical',[0,2.45,.23],[.78,2.5,.12],mat('title_emblem_red','#ef233c','#ed5263'),worldRoot,null,false);
  makeBox('title_emblem_horizontal',[0,2.45,.24],[2.5,.78,.13],mat('title_emblem_red_detail','#ef233c','#ed5263'),worldRoot,null,false);
  for(let i=0;i<8;i++){const a=i*Math.PI/4,x=Math.cos(a)*14,z=Math.sin(a)*12;makeTree(x,z,['#43a85a','#65bb4c','#2e9c70','#81c94b'][i%4]);}
  for(const [x,z,color] of [[-8,-2,'#ef6a4c'],[8,-2,'#438bd1'],[-8,4,'#ffb629'],[8,4,'#23a66c']]){
    makeBox('title_bench_seat',[x,.65,z],[2.4,.2,.7],mat('title_bench_mat',color),worldRoot,null,false);
  }
  titleDie=null;
  addAmbientMotes(p);
  camera.alpha=-Math.PI/2;camera.beta=1.1;camera.radius=22;camera.setTarget(new BABYLON.Vector3(0,2.3,0));
  if(playerRoot){playerRoot.dispose(false,true);playerRoot=null;}
  freezeStaticMeshes(worldRoot);
  refreshShadowList();
}
function dieSymbolsVisible(){
  if(game)return game.player?.flags?.dieSymbolsRevealed===true;
  return allSlots().some(slot=>slot?.player?.flags?.dieSymbolsRevealed===true);
}
function createDie(pos,parent,ornate=false){
  const root=new BABYLON.TransformNode('destiny_die',scene);root.position.copyFrom(pos);if(parent)root.parent=parent;
  const cube=BABYLON.MeshBuilder.CreateBox('die_core',{size:1.52},scene);cube.material=mat('die_material','#050609','#08090d');cube.parent=root;
  const edge=BABYLON.MeshBuilder.CreateBox('die_edge',{size:1.62},scene);edge.material=mat('die_edge_mat','#24252a','#34363d');edge.parent=root;edge.isPickable=false;
  const faceInfo=[['運命',0,0,.825,0,0,0],['法則',0,0,-.825,0,Math.PI,0],['記憶',.825,0,0,0,Math.PI/2,0],['必然',-.825,0,0,0,-Math.PI/2,0],['魂',0,.825,0,-Math.PI/2,0,0],['再生',0,-.825,0,Math.PI/2,0,0]];
  const labels=[];
  faceInfo.forEach((f,i)=>{
    const tex=new BABYLON.DynamicTexture('die_text_'+i,{width:512,height:512},scene,false),ctx=tex.getContext();
    const bg=ctx.createLinearGradient(36,36,476,476);bg.addColorStop(0,'#191a1f');bg.addColorStop(.48,'#090a0d');bg.addColorStop(1,'#030406');
    ctx.fillStyle=bg;ctx.fillRect(0,0,512,512);ctx.strokeStyle='#aeb0b8';ctx.lineWidth=12;ctx.strokeRect(22,22,468,468);
    ctx.strokeStyle='rgba(234,236,243,.58)';ctx.lineWidth=3;ctx.strokeRect(43,43,426,426);
    ctx.beginPath();ctx.moveTo(256,72);ctx.lineTo(440,256);ctx.lineTo(256,440);ctx.lineTo(72,256);ctx.closePath();ctx.strokeStyle='rgba(220,224,234,.42)';ctx.lineWidth=4;ctx.stroke();
    ctx.beginPath();ctx.arc(256,256,152,0,Math.PI*2);ctx.strokeStyle='rgba(225,229,238,.64)';ctx.lineWidth=5;ctx.stroke();
    ctx.beginPath();ctx.arc(256,256,132,0,Math.PI*2);ctx.strokeStyle='rgba(196,201,213,.38)';ctx.lineWidth=2;ctx.stroke();
    const crackPaths=[
      [[109,105],[147,145],[136,184],[185,212],[165,251],[207,277]],
      [[402,116],[361,156],[375,191],[331,224],[350,259],[307,289]],
      [[115,398],[158,355],[147,321],[195,292],[181,265]],
      [[397,399],[353,360],[366,325],[326,300],[340,267]]
    ];
    for(const points of crackPaths){
      ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let point=1;point<points.length;point++)ctx.lineTo(points[point][0],points[point][1]);
      ctx.strokeStyle='rgba(244,246,251,.9)';ctx.lineWidth=3.5;ctx.shadowColor='#dfe6f5';ctx.shadowBlur=9;ctx.stroke();
      ctx.shadowBlur=0;
    }
    if(dieSymbolsVisible()){ctx.fillStyle='#fff';ctx.font='bold 182px "Yu Mincho", "Noto Serif JP", "MS Mincho", serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowColor='#fff';ctx.shadowBlur=22;ctx.fillText(f[0],256,265);ctx.shadowBlur=0;}
    else{
      const positions={1:[[.5,.5]],2:[[.3,.3],[.7,.7]],3:[[.3,.3],[.5,.5],[.7,.7]],4:[[.3,.3],[.7,.3],[.3,.7],[.7,.7]],5:[[.3,.3],[.7,.3],[.5,.5],[.3,.7],[.7,.7]],6:[[.3,.28],[.7,.28],[.3,.5],[.7,.5],[.3,.72],[.7,.72]]}[i+1];
      ctx.fillStyle='#fff';ctx.shadowColor='#fff';ctx.shadowBlur=14;for(const [x,y] of positions){ctx.beginPath();ctx.arc(x*512,y*512,25,0,Math.PI*2);ctx.fill();}ctx.shadowBlur=0;
    }
    tex.update(false);
    const fm=new BABYLON.StandardMaterial('die_face_'+i,scene);fm.diffuseTexture=tex;fm.emissiveTexture=tex;fm.emissiveColor=new BABYLON.Color3(1,1,1);fm.backFaceCulling=false;
    const pl=BABYLON.MeshBuilder.CreatePlane('die_face_plane_'+i,{size:1.32},scene);pl.position.set(f[1],f[2],f[3]);pl.rotation.set(f[4],f[5],f[6]);pl.material=fm;pl.parent=root;pl.isPickable=false;labels.push(pl);
  });
  let orbit=null;
  if(ornate){
    orbit=BABYLON.MeshBuilder.CreateTorus('title_die_orbit',{diameter:2.55,thickness:.025,tessellation:48},scene);orbit.material=mat('title_die_orbit_mat','#d8bc79','#9174b7');orbit.rotation.x=.82;orbit.parent=root;orbit.isPickable=false;
    const orbit2=BABYLON.MeshBuilder.CreateTorus('title_die_orbit_secondary',{diameter:2.85,thickness:.018,tessellation:48},scene);orbit2.material=mat('title_die_orbit_secondary_mat','#9f82c2','#665182');orbit2.rotation.set(1.18,.4,.55);orbit2.parent=root;orbit2.isPickable=false;
    const light=new BABYLON.PointLight('title_die_light',new BABYLON.Vector3(0,0,0),scene);light.parent=root;light.diffuse=new BABYLON.Color3(.72,.55,1);light.intensity=.48;light.range=13;
  }
  root.metadata={cube,edge,labels,orbit,ornate};return root;
}
function characterMaterial(prefix,key,color,emissive=null){return mat(prefix+'_'+key,color,emissive);}
function characterBox(prefix,parent,pos,size,material,rotation=[0,0,0]){
  const m=BABYLON.MeshBuilder.CreateBox(prefix,{width:size[0],height:size[1],depth:size[2]},scene);m.position.set(pos[0],pos[1],pos[2]);m.rotation.set(rotation[0],rotation[1],rotation[2]);m.material=material;m.parent=parent;m.checkCollisions=false;m.isPickable=false;return m;
}
function characterSphere(prefix,parent,pos,diameter,material,scale=null,segments=12){
  const m=BABYLON.MeshBuilder.CreateSphere(prefix,{diameter,segments},scene);m.position.set(pos[0],pos[1],pos[2]);if(scale)m.scaling.set(scale[0],scale[1],scale[2]);m.material=material;m.parent=parent;m.checkCollisions=false;m.isPickable=false;return m;
}
function characterCylinder(prefix,parent,pos,diameter,height,material,opts={}){
  const m=BABYLON.MeshBuilder.CreateCylinder(prefix,{diameter,height,tessellation:opts.tessellation||10,diameterTop:opts.diameterTop??diameter,diameterBottom:opts.diameterBottom??diameter},scene);m.position.set(pos[0],pos[1],pos[2]);m.rotation.set(...(opts.rotation||[0,0,0]));m.material=material;m.parent=parent;m.checkCollisions=false;m.isPickable=false;return m;
}
function characterProfile(name,baseColor='#79618e',isPlayer=false,equippedWeaponId=null,appearance=null){
  const n=String(name||'').toLowerCase();let hash=0;for(const c of String(name||''))hash=(hash*31+c.charCodeAt(0))>>>0;
  const p={cloth:baseColor,armor:mixHex(baseColor,'#16141e',.35),hair:['#2b2027','#43303a','#6b5545','#202637'][hash%4],skin:['#c9a58e','#b98d78','#dfbca5','#a98476'][hash%4],accent:mixHex(baseColor,'#d7b56d',.35),cape:mixHex(baseColor,'#090b13',.6),hairStyle:hash%3===0?'long':'short',hood:false,crown:false,robe:false,aura:false,weapon:'sword',eye:'#28212a',beard:false};
  if(isPlayer){
    if(content?.redCrossStory){
      const uniform={Soccorritore:'#ef233c','Operatore sociale':'#1877d2',Logista:'#ef233c','Volontario di Protezione Civile':'#ff9f1c'}[game?.player?.playerClass]||'#ef233c';
      Object.assign(p,{redCross:true,cloth:uniform,armor:'#173b58',hair:'#44332b',accent:'#fffdf8',cape:null,weapon:'none',robe:false,aura:false,hood:false,crown:false});
    }else if(/arciere/i.test(name))Object.assign(p,{cloth:'#315c56',armor:'#527c73',hair:'#4a352a',accent:'#9cd9bd',cape:'#1b3435',weapon:'bow',hairStyle:'long'});
    else if(/barbaro/i.test(name))Object.assign(p,{cloth:'#5a3432',armor:'#755044',hair:'#30201c',accent:'#d68d58',cape:'#302126',weapon:'axe',hairStyle:'long',beard:true});
    else if(/ladro|predone etereo|predone del tempo|spezzaspecchi/i.test(name))Object.assign(p,{cloth:'#252b43',armor:'#3b425b',hair:'#171722',accent:'#9d83d7',cape:'#151521',weapon:'daggers',hood:true});
    else if(/mago|custode astrale|cronomante|tessitore d'anime|arconte delle anime|mnemonista|custode dei nomi|onironauta|causamante|monarca umbra/i.test(name))Object.assign(p,{cloth:'#30243f',armor:'#554267',hair:'#21192b',accent:classHex(name),cape:'#171321',weapon:'staff',robe:true,aura:true});
    else if(/necromante|revenant cronale|revenant sovrano|psicopompo umbra/i.test(name))Object.assign(p,{cloth:'#251d31',armor:'#49354e',hair:'#211722',accent:classHex(name),cape:'#100c18',weapon:'scythe',hood:true,aura:true});
    else if(/barbaro|custode umbra/i.test(name))Object.assign(p,{cloth:'#4d302b',armor:'#755044',hair:'#251918',accent:classHex(name),cape:'#211719',weapon:'axe',hairStyle:'long',beard:true});
    else Object.assign(p,{cloth:'#4b3039',armor:'#876247',hair:'#30202a',accent:classHex(name),cape:'#29212d',weapon:CLASS_WEAPON_STYLES[name]||'sword'});
    const equippedStyle=weaponStyleForId(equippedWeaponId);if(equippedStyle&&!p.redCross)p.weapon=equippedStyle;
  }
  if(/lyra/i.test(n))Object.assign(p,{cloth:'#29485d',armor:'#b4a06d',hair:'#d7d8e4',skin:'#e5c9b7',accent:'#7bd4e6',cape:'#1b3349',hairStyle:'long',weapon:'sword'});
  if(/kharon/i.test(n))Object.assign(p,{cloth:'#201b2b',armor:'#494052',hair:'#17131f',skin:'#a68d91',accent:'#c55c85',cape:'#0e0c17',hood:true,weapon:'staff',aura:true});
  if(/selene/i.test(n))Object.assign(p,{cloth:'#d8d1c4',armor:'#bca76e',hair:'#e8e0cf',skin:'#edd5c4',accent:'#8edcf0',cape:'#a9b8c9',hairStyle:'long',robe:true,crown:true,weapon:'staff'});
  if(/aion/i.test(n))Object.assign(p,{cloth:'#2a3b52',armor:'#91b8c9',hair:'#cfd8e6',skin:'#c6c9d6',accent:'#83e1f0',cape:'#18263b',hairStyle:'long',robe:true,weapon:'staff',aura:true});
  if(/asterion|governatore/i.test(n))Object.assign(p,{cloth:'#211925',armor:'#49314e',hair:'#261b2c',skin:'#b99aa7',accent:'#d65bd7',cape:'#100d18',hairStyle:'long',crown:true,weapon:'staff',aura:true});
  if(/colui che rimane|fine dei tempi/i.test(n))Object.assign(p,{cloth:'#151e2c',armor:'#35485d',hair:'#d2e0ec',skin:'#aebdca',accent:'#75e5e2',cape:'#0a101b',hood:true,crown:true,weapon:'staff',aura:true});
  if(/orion/i.test(n))Object.assign(p,{cloth:'#29405b',armor:'#6c88a6',hair:'#9eafc6',accent:'#82d8ed',cape:'#1a2b43',weapon:'sword'});
  if(/elya|maera|mira|serapha|ir(i|ia)|faye|mara|selene|thera|ena/i.test(n))Object.assign(p,{hairStyle:'long'});
  if(/darian|teren|ser kaelion|vael/i.test(n))Object.assign(p,{beard:true,hairStyle:'short'});
  if(/mara|fornaia/i.test(n))Object.assign(p,{cloth:'#804d4a',armor:'#a16d55',hair:'#58352f',accent:'#e0a16d',cape:'#573237',weapon:'none'});
  if(/teren|fabbro/i.test(n))Object.assign(p,{cloth:'#51403a',armor:'#7b5c47',hair:'#32231e',accent:'#e4a05e',cape:'#342824',beard:true,weapon:'hammer'});
  if(/faye|locandiera/i.test(n))Object.assign(p,{cloth:'#56446d',armor:'#92769c',hair:'#523b4d',accent:'#d5b0e7',weapon:'none'});
  if(/nilo/i.test(n))Object.assign(p,{cloth:'#48616a',armor:'#78949a',hair:'#4a413b',accent:'#8dd5d1',weapon:'none'});
  if(/antico|archivio nero|notaio del vuoto|paradosso|giudice/i.test(n))Object.assign(p,{cloth:'#28213b',armor:'#51416b',hair:'#b9b4ce',accent:'#c7a0f5',cape:'#161020',robe:true,weapon:'staff',aura:true});
  if(/regina abissale|re senza corona|architetto zero|veyra|arbitro/i.test(n))Object.assign(p,{cloth:'#291b31',armor:'#5b344e',hair:'#241622',accent:'#df5b9d',cape:'#110b17',crown:true,aura:true,weapon:'staff'});
  if(/hexa|costrutto|autom[aà]ta|golem/i.test(n))Object.assign(p,{cloth:'#26323b',armor:'#596874',accent:'#77dce8',cape:'#17232a',hood:false,crown:false,aura:true,weapon:'hammer'});
  if(/frattura|vestigio|nullombra|spettro|revenant/i.test(n))Object.assign(p,{cloth:'#211b31',armor:'#45334f',accent:'#c477ee',cape:'#100c1e',hood:true,robe:true,aura:true,weapon:'scythe'});
  if(/regina|regn|monarca/i.test(n))Object.assign(p,{cloth:'#392133',armor:'#775057',accent:'#f1ba79',cape:'#281522',crown:true,aura:true,weapon:'spear'});
  if(/guardiano|custode|cavaliere|sentinella/i.test(n))Object.assign(p,{cloth:'#33303a',armor:'#74695c',accent:'#e3c47c',cape:'#24212a',crown:false,weapon:'sword'});
  if(content?.redCrossStory&&!isPlayer){
    const uniform=/logist|magazzin/i.test(n)?'#ff9f1c':/coordin|accoglienza|social/i.test(n)?'#1877d2':'#ef233c';
    Object.assign(p,{redCross:true,cloth:uniform,armor:'#173b58',accent:'#fffdf8',cape:null,weapon:'none',robe:false,aura:false,hood:false,crown:false});
  }
  if(isPlayer&&appearance){
    const look=normalizeAppearance(appearance);
    p.skin=look.skin;p.hair=look.hairColor;p.hairStyle=look.hairStyle;p.hood=false;
    if(p.redCross){
      const uniform={Soccorritore:'#ef233c','Operatore sociale':'#1877d2',Logista:'#ef233c','Volontario di Protezione Civile':'#ff9f1c'};
      p.cloth=look.outfitStyle==='class'?(uniform[game?.player?.playerClass]||'#ef233c'):({traveler:'#1877d2',robe:'#fffdf8',armor:'#ff9f1c'}[look.outfitStyle]||'#ef233c');
      Object.assign(p,{armor:'#173b58',accent:'#fffdf8',cape:null,weapon:'none',robe:false});
    }else if(look.outfitStyle==='traveler')Object.assign(p,{cloth:look.outfitColor,armor:mixHex(look.outfitColor,'#d7c7a2',.24),cape:mixHex(look.outfitColor,'#111018',.58),robe:false});
    else if(look.outfitStyle==='robe')Object.assign(p,{cloth:look.outfitColor,armor:mixHex(look.outfitColor,'#e1d3b3',.28),cape:mixHex(look.outfitColor,'#111018',.42),robe:true});
    else if(look.outfitStyle==='armor')Object.assign(p,{cloth:mixHex(look.outfitColor,'#14131b',.42),armor:look.outfitColor,cape:false,robe:false});
  }
  return p;
}
function buildHumanoid(parent,name,profile,baseY=0){
  const tag=String(name||'character').replace(/[^a-z0-9]/gi,'_').slice(0,28)+'_'+Math.floor(Math.random()*100000);
  const c={cloth:characterMaterial(tag,'cloth',profile.cloth),armor:characterMaterial(tag,'armor',profile.armor),hair:characterMaterial(tag,'hair',profile.hair),skin:characterMaterial(tag,'skin',profile.skin),accent:characterMaterial(tag,'accent',profile.accent,profile.aura?profile.accent:null),cape:characterMaterial(tag,'cape',profile.cape||profile.cloth),dark:characterMaterial(tag,'dark','#1b1721'),metal:characterMaterial(tag,'metal',mixHex(profile.armor,'#d8c8a0',.45),'#6c5b73'),eye:characterMaterial(tag,'eye',profile.eye||'#201b25'),leather:characterMaterial(tag,'leather',mixHex(profile.cloth,'#161219',.35))};
  const g=new BABYLON.TransformNode(tag+'_model',scene);g.parent=parent;g.position.y=baseY;
  const joints={leftLeg:null,rightLeg:null,leftKnee:null,rightKnee:null,leftArm:null,rightArm:null,leftElbow:null,rightElbow:null,torso:null,head:null,cape:null,baseY,phaseOffset:Math.random()*Math.PI*2};
  // Mantello, busto e collo: il busto resta separato dagli arti per non deformare l'armatura durante il passo.
  if(profile.cape)joints.cape=characterBox(tag+'_cape',g,[0,1.05,-.19],[.62,1.08,.11],c.cape,[.08,0,0]);
  characterCylinder(tag+'_pelvis',g,[0,.78,0],.56,.28,c.leather,{diameterTop:.48,diameterBottom:.58});
  joints.torso=characterCylinder(tag+'_torso',g,[0,1.18,0],.68,.82,c.cloth,{diameterTop:.48,diameterBottom:.64,tessellation:12});
  characterCylinder(tag+'_neck',g,[0,1.62,.01],.18,.19,c.skin);
  // Ogni gamba ha un perno all'anca e uno al ginocchio: il movimento è articolato, non una traslazione dell'intero modello.
  for(const side of [-1,1]){
    const sideName=side<0?'left':'right';
    const hip=new BABYLON.TransformNode(tag+'_'+sideName+'_hip_pivot',scene);hip.position.set(side*.18,.68,0);hip.parent=g;joints[sideName+'Leg']=hip;
    characterCylinder(tag+'_'+sideName+'_thigh',hip,[0,-.20,0],.22,.5,c.cloth,{diameterTop:.2,diameterBottom:.24});
    characterBox(tag+'_'+sideName+'_tasset',hip,[0,.01,.14],[.22,.31,.09],profile.redCross?c.cloth:c.armor,[0,0,side*.04]);
    const knee=new BABYLON.TransformNode(tag+'_'+sideName+'_knee_pivot',scene);knee.position.set(0,-.43,.02);knee.parent=hip;joints[sideName+'Knee']=knee;
    characterSphere(tag+'_'+sideName+'_knee',knee,[0,0,0],.2,c.armor,[.9,1,.9],8);
    characterCylinder(tag+'_'+sideName+'_shin',knee,[0,-.10,0],.17,.32,c.armor,{diameterTop:.14,diameterBottom:.19});
    characterBox(tag+'_'+sideName+'_boot',knee,[0,-.175,.07],[.23,.15,.36],c.dark,[0,side*.03,0]);
    characterBox(tag+'_'+sideName+'_shin_guard',knee,[0,.03,.10],[.13,.28,.055],c.metal);
    // Braccia articolate a spalla e gomito. Le armi vengono agganciate al relativo braccio.
    const arm=new BABYLON.TransformNode(tag+'_'+sideName+'_shoulder_pivot',scene);arm.position.set(side*.42,1.46,0);arm.parent=g;joints[sideName+'Arm']=arm;
    characterSphere(tag+'_'+sideName+'_shoulder',arm,[0,0,0],.34,profile.redCross?c.cloth:c.armor,[1,.8,1],10);
    characterCylinder(tag+'_'+sideName+'_upper_arm',arm,[side*.01,-.23,.015],.19,.42,c.cloth,{diameterTop:.16,diameterBottom:.2,rotation:[0,0,side*.09]});
    const elbow=new BABYLON.TransformNode(tag+'_'+sideName+'_elbow_pivot',scene);elbow.position.set(side*.05,-.43,.045);elbow.parent=arm;joints[sideName+'Elbow']=elbow;
    characterCylinder(tag+'_'+sideName+'_forearm',elbow,[0,-.12,0],.16,.31,c.armor,{diameterTop:.13,diameterBottom:.17,rotation:[0,0,side*.04]});
    characterSphere(tag+'_'+sideName+'_hand',elbow,[side*.01,-.31,.035],.16,c.skin,[.9,1,1],8);
  }
  // Corazza, fibbie, emblema e rune sul petto.
  if(profile.redCross){
    characterBox(tag+'_uniform_badge',g,[0,1.24,.23],[.31,.37,.045],c.accent);
    characterBox(tag+'_red_cross_vertical',g,[0,1.24,.26],[.075,.25,.018],characterMaterial(tag,'cross_red','#ef233c'));
    characterBox(tag+'_red_cross_horizontal',g,[0,1.24,.27],[.25,.075,.018],characterMaterial(tag,'cross_red_detail','#ef233c'));
    characterBox(tag+'_uniform_reflective_band',g,[0,.98,.18],[.5,.07,.025],characterMaterial(tag,'reflective','#ffdf36'));
  }else{
    characterBox(tag+'_breastplate',g,[0,1.24,.16],[.48,.51,.16],c.armor);
    characterBox(tag+'_chest_trim',g,[0,1.48,.245],[.42,.055,.035],c.metal);
    characterBox(tag+'_strap',g,[-.07,1.2,.255],[.075,.54,.035],c.leather,[0,0,-.22]);
  }
  characterBox(tag+'_belt',g,[0,.82,.17],[.58,.12,.1],c.leather);
  characterBox(tag+'_buckle',g,[0,.82,.235],[.12,.12,.035],c.accent);
  if(!profile.redCross)characterSphere(tag+'_crest',g,[0,1.28,.255],.14,c.accent,[.65,1.25,.45],8);
  characterBox(tag+'_collar',g,[0,1.57,.11],[.36,.1,.24],profile.redCross?c.cloth:c.armor);
  // Volto, occhi, sopracciglia e capelli.
  joints.head=characterSphere(tag+'_head',g,[0,1.84,.005],.45,c.skin,[.86,1.08,.83],12);
  characterSphere(tag+'_earL',g,[-.205,1.84,.005],.11,c.skin,[.7,1.1,.7],8);characterSphere(tag+'_earR',g,[.205,1.84,.005],.11,c.skin,[.7,1.1,.7],8);
  characterSphere(tag+'_eyeL',g,[-.082,1.88,.19],.052,c.eye,[1,.8,.55],8);characterSphere(tag+'_eyeR',g,[.082,1.88,.19],.052,c.eye,[1,.8,.55],8);
  characterBox(tag+'_browL',g,[-.083,1.94,.194],[.075,.022,.025],c.hair,[0,0,-.08]);characterBox(tag+'_browR',g,[.083,1.94,.194],[.075,.022,.025],c.hair,[0,0,.08]);
  characterSphere(tag+'_nose',g,[0,1.82,.215],.06,c.skin,[.7,1.2,.7],8);characterBox(tag+'_mouth',g,[0,1.755,.197],[.07,.018,.015],c.dark);
  if(profile.hood){characterSphere(tag+'_hood',g,[0,1.95,-.045],.54,c.cloth,[1,1.08,.85],10);characterBox(tag+'_hood_rim',g,[0,1.82,.19],[.36,.075,.055],c.accent);}
  else if(profile.hairStyle==='braid'){
    characterSphere(tag+'_hair_cap',g,[0,2.015,-.035],.48,c.hair,[1,.7,.95],10);
    characterBox(tag+'_hair_back',g,[0,1.72,-.16],[.34,.58,.13],c.hair);
    for(const side of [-1,1])characterBox(tag+'_hair_lock_'+side,g,[side*.19,1.78,-.005],[.11,.43,.12],c.hair,[0,0,side*.08]);
    characterCylinder(tag+'_hair_braid',g,[0,1.4,-.17],.12,.42,c.hair,{tessellation:7});
    for(let i=0;i<4;i++)characterSphere(tag+'_hair_braid_knot_'+i,g,[i%2?.035:-.035,1.56-i*.1,-.17],.13,c.hair,[.75,1,.75],7);
  } else if(profile.hairStyle==='curls'){
    for(let i=0;i<7;i++){const angle=i*Math.PI*2/7;characterSphere(tag+'_hair_curl_'+i,g,[Math.cos(angle)*.18,1.98+(i%2)*.07,Math.sin(angle)*.15],.22,c.hair,[1,.9,1],8);}
  } else if(profile.hairStyle==='shaved'){
    characterSphere(tag+'_hair_cap',g,[0,2.015,-.035],.46,c.hair,[1,.48,.95],10);
  } else {
    characterSphere(tag+'_hair_cap',g,[0,2.015,-.035],.48,c.hair,[1,.7,.95],10);
    if(profile.hairStyle==='long'){
      characterBox(tag+'_hair_back',g,[0,1.72,-.16],[.34,.58,.13],c.hair);
      for(const side of [-1,1])characterBox(tag+'_hair_lock_'+side,g,[side*.19,1.78,-.005],[.11,.43,.12],c.hair,[0,0,side*.08]);
    } else {
      characterSphere(tag+'_hair_sweep',g,[.06,2.035,.045],.28,c.hair,[1,.45,.9],8);
      for(const side of [-1,1])characterSphere(tag+'_hair_side_'+side,g,[side*.18,1.9,-.01],.2,c.hair,[.8,1.2,.9],8);
    }
  }
  if(profile.beard){characterSphere(tag+'_beard',g,[0,1.72,.13],.23,c.hair,[.78,.8,.65],8);characterBox(tag+'_moustache',g,[0,1.78,.19],[.2,.055,.045],c.hair);}
  if(profile.crown){characterCylinder(tag+'_crown_ring',g,[0,2.08,0],.48,.07,c.metal,{diameterTop:.48,diameterBottom:.48,tessellation:12});for(let i=0;i<5;i++){const x=(i-2)*.095;characterCylinder(tag+'_crown_spike_'+i,g,[x,2.2,0],.09,.22,c.accent,{diameterTop:.015,diameterBottom:.09,tessellation:5});}}
  if(profile.robe){characterCylinder(tag+'_robe',g,[0,.66,-.2],.78,.76,c.cloth,{diameterTop:.48,diameterBottom:.9,tessellation:12});characterBox(tag+'_robe_front',g,[0,.68,.17],[.12,.58,.035],c.accent);}
  // Ogni impugnatura coincide con il centro della mano e segue avambraccio e animazione.
  const weaponGrip=(side=1)=>{
    const grip=new BABYLON.TransformNode(tag+'_weapon_grip_'+side,scene);
    grip.position.set(side*.01,-.31,.075);
    grip.parent=side<0?joints.leftElbow:joints.rightElbow;
    return grip;
  };
  if(profile.weapon==='sword'){
    const grip=weaponGrip();
    characterBox(tag+'_weapon_handle',grip,[0,0,0],[.075,.2,.075],c.leather);
    characterBox(tag+'_weapon_pommel',grip,[0,-.115,0],[.11,.055,.095],c.accent);
    characterBox(tag+'_weapon_guard',grip,[0,.15,0],[.27,.065,.1],c.accent);
    characterBox(tag+'_weapon_blade',grip,[0,.57,0],[.075,.78,.045],c.metal,[0,0,-.025]);
    characterBox(tag+'_weapon_blade_tip',grip,[0,.99,0],[.025,.12,.035],c.metal);
  } else if(profile.weapon==='daggers'){
    for(const side of [-1,1]){
      const grip=weaponGrip(side);
      characterBox(tag+'_dagger_handle_'+side,grip,[0,0,0],[.065,.16,.065],c.leather);
      characterBox(tag+'_dagger_pommel_'+side,grip,[0,-.09,0],[.09,.045,.08],c.accent);
      characterBox(tag+'_dagger_guard_'+side,grip,[0,.12,0],[.18,.05,.075],c.accent);
      characterBox(tag+'_dagger_blade_'+side,grip,[0,.4,0],[.055,.52,.04],c.metal,[0,0,-side*.08]);
    }
  } else if(profile.weapon==='staff'){
    const grip=weaponGrip();
    characterCylinder(tag+'_staff',grip,[0,.35,0],.07,1.65,c.leather,{tessellation:8});
    characterSphere(tag+'_staff_orb',grip,[0,1.2,0],.23,c.accent,[.9,1.05,.9],10);
    characterCylinder(tag+'_staff_ring',grip,[0,1.19,0],.34,.045,c.metal,{diameterTop:.34,diameterBottom:.34,tessellation:12});
  } else if(profile.weapon==='axe'||profile.weapon==='hammer'){
    const grip=weaponGrip();
    characterCylinder(tag+'_haft',grip,[0,.28,0],.075,1.05,c.leather,{tessellation:8});
    characterBox(tag+'_axe_head',grip,[0,.78,.02],[.34,.28,.12],profile.weapon==='hammer'?c.metal:c.accent,[0,0,-.08]);
    characterBox(tag+'_axe_edge',grip,[.17,.78,.02],[.1,.3,.13],c.metal);
  } else if(profile.weapon==='bow'){
    const grip=weaponGrip();
    characterCylinder(tag+'_bow_arc',grip,[0,.08,0],.78,.055,c.accent,{diameterTop:.78,diameterBottom:.78,rotation:[0,0,Math.PI/2],tessellation:16});
    characterBox(tag+'_bow_string',grip,[0,.08,.035],[.018,.74,.018],c.metal);
  } else if(profile.weapon==='spear'){
    const grip=weaponGrip();
    characterCylinder(tag+'_spear_shaft',grip,[0,.5,0],.055,1.42,c.leather,{tessellation:8});
    characterCylinder(tag+'_spear_tip',grip,[0,1.27,0],.02,.36,c.metal,{diameterTop:.008,diameterBottom:.13,tessellation:6});
    characterBox(tag+'_spear_collar',grip,[0,1.05,.01],[.13,.06,.06],c.accent);
  } else if(profile.weapon==='scythe'){
    const grip=weaponGrip();
    characterCylinder(tag+'_scythe_shaft',grip,[0,.5,0],.06,1.42,c.leather,{tessellation:8});
    characterBox(tag+'_scythe_blade_base',grip,[.08,1.17,.015],[.35,.09,.06],c.metal,[0,0,-.35]);
    characterBox(tag+'_scythe_blade_tip',grip,[.23,1.27,.015],[.27,.075,.06],c.metal,[0,0,-.75]);
    characterBox(tag+'_scythe_rune',grip,[.09,1.11,.055],[.13,.035,.015],c.accent,[0,0,-.35]);
  }
  if(profile.miniBoss||profile.boss){
    const armorTrim=characterMaterial(tag,'boss_trim',mixHex(profile.accent,'#f3d9a1',.38),profile.accent);
    for(const side of [-1,1]){
      const shoulder=characterSphere(tag+'_pauldron_'+side,g,[side*.48,1.48,-.005],profile.boss ? .64 : .48,c.armor,[1,.82,1],10);
      shoulder.rotation.z=side*-.12;
      characterBox(tag+'_pauldron_trim_'+side,g,[side*.49,1.46,.17],[profile.boss ? .48 : .34,.09,.08],armorTrim,[0,0,side*.12]);
      if(profile.boss)for(let spike=0;spike<2;spike++)characterCylinder(tag+'_shoulder_spike_'+side+'_'+spike,g,[side*(.57+spike*.1),1.76+spike*.08,-.02],.22,.48,armorTrim,{diameterTop:.015,diameterBottom:.22,tessellation:5,rotation:[0,0,side*-.25]});
    }
    characterBox(tag+'_boss_chest_crest',g,[0,1.3,.275],[.2,.34,.07],armorTrim,[0,0,.05]);
    for(let i=0;i<3;i++)characterCylinder(tag+'_armor_ridge_'+i,g,[0,1.5+i*.12,-.2],.16,.27,c.armor,{diameterTop:.025,diameterBottom:.16,tessellation:5,rotation:[Math.PI/2,0,0]});
    if(profile.boss&&!profile.crown)for(const side of [-1,1])characterCylinder(tag+'_war_horn_'+side,g,[side*.17,2.2,-.03],.15,.58,armorTrim,{diameterTop:.025,diameterBottom:.15,tessellation:6,rotation:[0,0,side*-.42]});
    if(profile.creatureTail){const tail=characterCylinder(tag+'_tail',g,[0,.7,-.5],.19,.9,c.cloth,{diameterTop:.06,diameterBottom:.22,tessellation:8,rotation:[.9,0,0]});tail.rotation.x=.85;}
  }
  if(profile.aura){const aura=BABYLON.MeshBuilder.CreateTorus(tag+'_aura',{diameter:profile.boss?1.5:1.0,thickness:.035,tessellation:28},scene);aura.position.set(0,.12,0);aura.material=c.accent;aura.parent=g;aura.isPickable=false;const halo=BABYLON.MeshBuilder.CreateTorus(tag+'_halo',{diameter:profile.boss?1.05:.68,thickness:.025,tessellation:24},scene);halo.position.set(0,2.31,0);halo.material=c.accent;halo.parent=g;halo.isPickable=false;}
  g.metadata={...(g.metadata||{}),animation:{...joints,boss:!!profile.boss,miniBoss:!!profile.miniBoss}};humanoidModels.push(g);return g;
}
function animateHumanoid(model,dt,now,moving=false,intensity=1){
  if(!model||model.isDisposed?.())return;const a=model.metadata?.animation;if(!a)return;
  const base=a.baseY||0,t=now*.95+(a.phaseOffset||0);
  a.walkBlend=clamp((a.walkBlend||0)+(moving?dt*7.5:-dt*6.2),0,1);
  if(moving)a.phase=(a.phase||0)+dt*(8.8+Math.max(0,Math.min(1,intensity))*1.6);
  const blend=a.walkBlend,phase=a.phase||0,s=Math.sin(phase),c=Math.cos(phase),idle=Math.sin(t);
  const mix=(rest,walk)=>rest+(walk-rest)*blend;
  a.leftLeg.rotation.x=mix(idle*.012,s*.53);a.rightLeg.rotation.x=mix(-idle*.012,-s*.53);
  a.leftKnee.rotation.x=Math.max(0,-s)*.58*blend;a.rightKnee.rotation.x=Math.max(0,s)*.58*blend;
  a.leftArm.rotation.x=mix(idle*.022,-s*.34);a.rightArm.rotation.x=mix(-idle*.022,s*.34);
  a.leftElbow.rotation.x=mix(.025,.06+Math.max(0,s)*.16);a.rightElbow.rotation.x=mix(.025,.06+Math.max(0,-s)*.16);
  model.position.y=base+Math.abs(Math.sin(phase*2))*.006*blend+Math.sin(t*1.35)*.002*(1-blend);
  model.rotation.z=c*.012*blend+idle*.004*(1-blend);
  if(a.torso)a.torso.scaling.y=1+Math.abs(s)*.008*blend+Math.sin(t*1.7)*.012*(1-blend);
  if(a.head)a.head.rotation.x=Math.sin(t*.8)*.012+Math.sin(phase*2)*.018*blend;
  if(a.cape){a.cape.rotation.x=.08+Math.abs(s)*.045*blend+idle*.018*(1-blend);a.cape.rotation.z=c*.018*blend+Math.cos(t)*.008*(1-blend);}
  if(a.boss||a.miniBoss){
    const action=a.action||'idle',pulse=Math.sin(now*(a.boss?2.3:1.7)+(a.phaseOffset||0));
    model.position.y=base+Math.sin(now*1.25+(a.phaseOffset||0))*(a.boss ? .055 : .035);
    model.rotation.y=(a.baseRotationY||0)+Math.sin(now*.55+(a.phaseOffset||0))*(a.boss ? .045 : .025);
    if(action==='attack'){a.rightArm.rotation.x=-1.05+Math.sin(now*12)*.18;a.torso.rotation.x=-.12;}
    else if(action==='guard'){a.leftArm.rotation.x=-.72;a.rightArm.rotation.x=-.72;a.torso.rotation.x=.06;}
    else {a.rightArm.rotation.x+=Math.sin(now*1.6)*.035;a.leftArm.rotation.x-=Math.sin(now*1.4)*.025;a.torso.rotation.x=Math.sin(now*1.1)*.025;}
    if(a.head)a.head.rotation.z=Math.sin(now*.8+(a.phaseOffset||0))*.045;
    if(a.torso)a.torso.scaling.y=1+pulse*.018;
  }
}
function createPlayerVisual(){
  const previousPosition=playerRoot?.position?.clone?.()||null;
  if(playerRoot)playerRoot.dispose(false,true);playerParts=[];playerModel=null;
  playerRoot=BABYLON.MeshBuilder.CreateBox('player_collision',{width:.65,height:1.8,depth:.65},scene);playerRoot.visibility=0;playerRoot.isVisible=true;playerRoot.isPickable=false;playerRoot.checkCollisions=true;playerRoot.ellipsoid=new BABYLON.Vector3(.4,.9,.4);playerRoot.ellipsoidOffset=new BABYLON.Vector3(0,0,0);playerRoot.position.copyFrom(previousPosition||new BABYLON.Vector3(0,.9,-8));
  const visual=new BABYLON.TransformNode('player_visual_root',scene);visual.parent=playerRoot;visual.position.y=-.9;
  if(game?.player)game.player.appearance=normalizeAppearance(game.player.appearance);
  const profile=characterProfile(game?.player?.playerClass||'Spartano',classHex(game?.player?.playerClass||'Spartano'),true,game?.player?.weapon,game?.player?.appearance);playerModel=buildHumanoid(visual,game?.player?.name||'Portatore',profile,0);
  if(camera){camera.setTarget(playerRoot.position.add(new BABYLON.Vector3(0,1,0)));camera.alpha=-Math.PI/2;camera.beta=1.12;camera.radius=13;}
}
function sceneWorldTitle(step){return step?.chapter_arc||'Velmora';}
function buildWorld(step){
  if(houseInteriorRoot)leaveHouse();
  const key=String(step.scene||'erenfall')+'|'+worldForStep(step);
  if(key===currentSceneKey && worldRoot){rebuildActors(step);return;}
  if(houseInteriorRoot){houseInteriorRoot.dispose(false,true);houseInteriorRoot=null;activeHouse=null;exteriorPlayerPosition=null;}
  if(worldRoot)worldRoot.dispose(false,true);worldRoot=new BABYLON.TransformNode('world_'+key.replace(/[^a-z0-9]/gi,'_'),scene);currentSceneKey=key;motes=[];houseEntrances=[];
  const p=paletteFor(step);scene.clearColor=BABYLON.Color4.FromHexString(p.sky+'ff');scene.fogColor=BABYLON.Color3.FromHexString(p.sky);scene.fogDensity=.0052;
  const ground=BABYLON.MeshBuilder.CreateGround('terrain',{width:150,height:150,subdivisions:2},scene);ground.material=mat('terrain_mat',p.ground);ground.parent=worldRoot;ground.checkCollisions=true;ground.receiveShadows=true;
  const path=BABYLON.MeshBuilder.CreateGround('main_path',{width:8,height:100,subdivisions:2},scene);path.position.y=.008;path.material=makePavingMaterial('path_mat',p.path);path.parent=worldRoot;path.checkCollisions=false;path.receiveShadows=true;
  const sceneName=String(step.scene||'erenfall').toLowerCase();
  if(content?.redCrossStory)buildRedCrossWorld();
  else if(sceneName==='erenfall'||sceneName==='porter_home') buildErenfall(p,sceneName);
  else if(sceneName.includes('forge')||sceneName.includes('runeforge')||sceneName.includes('crownforge')) buildForge(p);
  else if(sceneName.includes('sky')||sceneName.includes('caelora')||sceneName.includes('meridian')||sceneName.includes('falling_sea')) buildSkyCity(p);
  else if(sceneName.includes('temple')||sceneName.includes('sanctum')||sceneName.includes('shrine')) buildTemple(p);
  else if(sceneName.includes('citadel')||sceneName.includes('tower')||sceneName.includes('prison')||sceneName.includes('archive')) buildCitadel(p);
  else if(sceneName.includes('city')||sceneName.includes('gate')||sceneName.includes('village')||sceneName.includes('shadow')) buildCity(p,sceneName);
  else if(sceneName.includes('forest')||sceneName.includes('wood')||sceneName.includes('garden')) buildForest(p);
  else if(sceneName.includes('sea')||sceneName.includes('coast')||sceneName.includes('marsh')||sceneName.includes('lake')) buildWaterland(p);
  else if(sceneName.includes('throne')||sceneName.includes('heart')||sceneName.includes('core')||sceneName.includes('horizon')||sceneName.includes('cradle')) buildBossArena(p);
  else buildRuins(p,sceneName);
  if(!content?.redCrossStory){
    for(const x of [-34,34])for(const z of [-24,0,24])makePillar(x,z,4,mixHex(p.wall,'#11121b',.22));
    addAmbientMotes(p);
  }
  if(!playerRoot)createPlayerVisual();else {playerRoot.position.set(0,.9,-8);}
  if(camera)camera.setTarget(playerRoot.position.add(new BABYLON.Vector3(0,1,0)));
  rebuildActors(step);freezeStaticMeshes(worldRoot);refreshShadowList();
}
function enterTownHub(){
  if(!game||hubMode)return;
  if(houseInteriorRoot)leaveHouse();
  hubReturnPosition=playerRoot?.position?.clone?.()||new BABYLON.Vector3(0,.9,-8);
  hubReturnCamera=camera?{alpha:camera.alpha,beta:camera.beta,radius:camera.radius}:null;
  hubMode=true;
  const hubStep={...currentStep,scene:'erenfall',chapter_number:1,chapter_arc:content.worlds?.[worldForStep(currentStep)]||'Comitato locale',title:'Comitato locale'};
  buildWorld(hubStep);
  if(playerRoot)playerRoot.position.set(0,.9,-8);
  if(camera&&playerRoot)camera.setTarget(playerRoot.position.add(new BABYLON.Vector3(0,1,0)));
  $('objectiveText').textContent='Riposo e preparativi per il turno';
  $('hubToggleBtn').innerHTML='↩ <span>Torna alla storia</span>';
  saveGame(false);
  toast('Sei tornato al Comitato. I servizi di preparazione sono disponibili.');
}
function leaveTownHub(){
  if(!game||!hubMode)return;
  hubMode=false;
  buildWorld(currentStep);
  if(playerRoot&&hubReturnPosition)playerRoot.position.copyFrom(hubReturnPosition);
  if(camera&&playerRoot){
    camera.setTarget(playerRoot.position.add(new BABYLON.Vector3(0,1,0)));
    if(hubReturnCamera){camera.alpha=hubReturnCamera.alpha;camera.beta=hubReturnCamera.beta;camera.radius=hubReturnCamera.radius;}
  }
  hubReturnPosition=null;hubReturnCamera=null;
  $('objectiveText').textContent=currentStep?.objective||currentStep?.title||'Esplora l’area';
  $('hubToggleBtn').innerHTML=content?.redCrossStory?'⌂ <span>Comitato</span>':'⌂ <span>Rifugio</span>';
  toast('Sei tornato al luogo della cronaca.');
}
function toggleTownHub(){if(currentBattle){toast('Per tornare al rifugio durante uno scontro, usa Abbandona: potrai riprenderlo o ricominciarlo.');return;}if(hubMode)leaveTownHub();else enterTownHub();}
function mixHex(a,b,t){const ca=BABYLON.Color3.FromHexString(a),cb=BABYLON.Color3.FromHexString(b);return ca.multiplyByFloats(1-t,1-t,1-t).add(cb.multiplyByFloats(t,t,t)).toHexString();}
const RED_CROSS_DISCOVERIES=[
  {id:'turn-board',name:'Bacheca dei turni',text:'Qui la squadra trova le informazioni utili per organizzare il servizio. I turni si preparano insieme e si seguono le indicazioni del Comitato.',position:[3,-10]},
  {id:'food-stock',name:'Area di preparazione viveri',text:'Prima della distribuzione, le derrate ricevute tramite le filiere solidali e i programmi di aiuto alimentare vengono controllate e sistemate con ordine. Una buona organizzazione aiuta a consegnare gli alimenti in modo attento e rispettoso.',position:[14,16]},
  {id:'uds-welcome',name:'Punto di ascolto',text:'Nel servizio di Unità di Strada si incontrano persone e si offre ascolto, rispettando la dignità e i tempi di ognuno. I volontari operano in squadra e secondo la propria formazione.',position:[-14,11]},
  {id:'ambulance',name:'Area mezzi e trasporti',text:'I mezzi vengono preparati e controllati dal personale incaricato. Il trasporto di una persona si svolge con una squadra formata e seguendo le procedure del servizio.',position:[14,-10]},
  {id:'community-tent',name:'Punto di distribuzione',text:'Il punto viene allestito per accogliere le persone e distribuire i beni con cura. Collaborazione, ordine e rispetto della riservatezza fanno parte del servizio.',position:[2,21]},
  {id:'bus-stop',name:'Fermata del quartiere',text:'Anche una fermata può diventare un punto di incontro: conoscere il quartiere aiuta la squadra a orientarsi e a raggiungere i luoghi del servizio.',position:[-21,-11]},
  {id:'community-garden',name:'Giardino della comunità',text:'Gli spazi condivisi diventano più accoglienti quando le persone se ne prendono cura insieme. La solidarietà si costruisce anche con piccoli gesti quotidiani.',position:[-23,21]}
];
function makeCivicBuilding(name,x,z,w,d,h,color,accent='#ef233c',label=name,showEmblem=false,home=null){
  const wall=mat(name+'_wall',color),roof=mat(name+'_roof','#d8e0e2'),glass=mat(name+'_glass','#8fbac5','#568b9b',.35),trim=mat(name+'_trim','#f2f4ef'),door=mat(name+'_door','#516b73');
  const front=z+d/2,windowY=h*.62;
  makeBox(name+'_foundation',[x,.22,z],[w+.4,.44,d+.4],mat(name+'_foundation_mat','#858b88'),worldRoot,null,true);
  makeBox(name+'_body',[x,h/2+.4,z],[w,h,d],wall,worldRoot,null,true);
  makeBox(name+'_roof',[x,h+.47,z],[w+.65,.28,d+.65],roof,worldRoot,null,true);
  makeBox(name+'_roof_edge',[x,h+.65,front],[w+.3,.12,.16],trim,worldRoot,null,false);
  makeBox(name+'_entrance_canopy',[x,h*.76,front+.7],[w*.48,.18,1.35],trim,worldRoot,null,false);
  makeBox(name+'_door_visual',[x,h*.35,front+.53],[1.35,h*.7,.1],door,worldRoot,null,false);
  makeBox(name+'_door_glass',[x,h*.36,front+.6],[.55,h*.52,.025],glass,worldRoot,null,false);
  for(const side of [-1,1]){
    const wx=x+side*w*.29;
    makeBox(name+'_window_'+side,[wx,windowY+.4,front+.53],[w*.23,h*.36,.08],glass,worldRoot,null,false);
    makeBox(name+'_window_top_'+side,[wx,windowY+.61,front+.58],[w*.23,.08,.08],trim,worldRoot,null,false);
    makeBox(name+'_window_sill_'+side,[wx,windowY+.19,front+.58],[w*.25,.08,.14],trim,worldRoot,null,false);
  }
  const signWidth=Math.min(5,w*.55);makeBox(name+'_sign',[x,h+.13,front+.8],[signWidth,.62,.12],mat(name+'_sign_mat',accent),worldRoot,null,false);
  const signTexture=new BABYLON.DynamicTexture(name+'_sign_texture',{width:512,height:96},scene,false),ctx=signTexture.getContext();
  ctx.fillStyle=accent;ctx.fillRect(0,0,512,96);ctx.fillStyle='#ffffff';ctx.font='bold 34px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(label).toUpperCase(),showEmblem?220:256,48,showEmblem?400:480);signTexture.update();
  const signMaterial=new BABYLON.StandardMaterial(name+'_sign_material',scene);signMaterial.diffuseTexture=signTexture;signMaterial.emissiveTexture=signTexture;
  const signText=BABYLON.MeshBuilder.CreatePlane(name+'_sign_text',{width:signWidth-.12,height:.5},scene);signText.position.set(x,h+.13,front+.92);signText.rotation.y=Math.PI;signText.material=signMaterial;signText.isPickable=false;
  if(showEmblem){
    const emblemX=x+signWidth*.39;
    makeBox(name+'_sign_cross_v',[emblemX,h+.13,front+.94],[.1,.3,.025],mat(name+'_sign_cross','#fffdf8'),worldRoot,null,false);
    makeBox(name+'_sign_cross_h',[emblemX,h+.13,front+.95],[.3,.1,.025],mat(name+'_sign_cross','#fffdf8'),worldRoot,null,false);
  }
  if(home){
    const entrance=new BABYLON.TransformNode(name+'_entrance',scene);entrance.position.set(x,.9,front+1.8);entrance.parent=worldRoot;
    houseEntrances.push({kind:'house',root:entrance,name:'Entra: '+home.label,position:entrance.position,home});
  }
}
function redCrossPersonName(name){
  const role=String(name||'');
  if(!content?.redCrossStory)return role;
  if(/\bcoordinatrice\b|\bcoordinatore\b|\breferente uds\b/i.test(role))return 'Angela';
  if(/\breferente logistico\b/i.test(role))return 'Sara';
  if(/\breferente (?:della )?distribuzione\b/i.test(role))return 'Antonella';
  return role;
}
function buildRedCrossWorld(){
  const asphalt=mat('community_asphalt','#6a7473'),paint=mat('road_marking','#f2e7c7');
  const road=BABYLON.MeshBuilder.CreateGround('community_cross_road',{width:78,height:7,subdivisions:2},scene);road.position.set(0,.018,1);road.material=asphalt;road.parent=worldRoot;
  const plaza=BABYLON.MeshBuilder.CreateGround('committee_plaza',{width:44,height:17,subdivisions:2},scene);plaza.position.set(0,.025,-4);plaza.material=makePavingMaterial('committee_plaza_mat','#b3b0a5');plaza.parent=worldRoot;
  for(const z of [-2.4,4.4])makeBox('road_curb',[0,.12,z],[78,.24,.22],mat('road_curb_mat','#858a85'),worldRoot,null,false);
  for(let x=-3;x<=3;x++)makeBox('crosswalk_stripe',[x*1.1,.035,1],[.62,.025,4.4],paint,worldRoot,null,false);
  for(const z of [-14,14,24]){const lane=BABYLON.MeshBuilder.CreateGround('neighborhood_walkway',{width:5,height:26,subdivisions:2},scene);lane.position.set(0,.03,z);lane.material=makePavingMaterial('neighborhood_walkway_mat','#c5c2b8');lane.parent=worldRoot;}
  makeCivicBuilding('committee_hq',0,-20,15,9,4.6,'#e5e6df','#ef233c','COMITATO',true,{
    id:'committee',label:'Comitato · area di recupero',type:'committee',resident:'Referente del Comitato',color:'#376b75',light:'#d9eee8',
    features:[{id:'recovery-area',label:'Area di recupero',speaker:'Referente del Comitato',text:'Qui il personaggio può recuperare energia nel gioco. È una funzione di gioco: non rappresenta una prestazione sanitaria reale.',position:[3,-2.2],shape:'tall',color:'#d8e6e3',action:'recover'}],
    staff:[{name:'Volontaria di Comitato',position:[-1.6,1.1],color:'#2374a4'}]
  });
  makeCivicBuilding('community_center',-20,8,10,8,3.8,'#d7e1dc','#238c85','PREPARAZIONE UDS',false,{
    id:'uds',label:'Unità di Strada · preparazione',type:'uds',resident:'Angela',color:'#238c85',light:'#d9eee8',
    features:[
      {id:'uds-prep-table',label:'Tavoli di preparazione',speaker:'Angela',text:'La squadra organizza qui i materiali da portare al turno. Puoi ripetere l’attività di preparazione della missione UDS.',position:[0,1.2],shape:'box',action:'uds-replay'},
      {id:'uds-fridge',label:'Frigorifero delle scorte',speaker:'Angela',text:'Il frigorifero contiene viveri e bevande destinati alle attività di supporto. Nel gioco le scorte si preparano con attenzione e si seguono le indicazioni del referente.',position:[4,-2.4],shape:'tall'}
    ],
    staff:[{name:'Angela',position:[-1.7,-1.2],color:'#287d83'},{name:'Volontario UDS',position:[1.5,-1.4],color:'#438765'}]
  });
  makeCivicBuilding('logistics_depot',19,8,11,9,4.2,'#d9d4c8','#d18a16','MAGAZZINO',false,{
    id:'warehouse',label:'Magazzino delle dotazioni',type:'warehouse',resident:'Sara',color:'#96621c',light:'#efdbb4',
    features:[{id:'warehouse-inventory',label:'Scaffali delle dotazioni',speaker:'Sara',text:'Le dotazioni di gioco sono inventariate e preparate per i servizi. Apri l’inventario per controllare i materiali del personaggio.',position:[-4,2.4],shape:'box',action:'inventory'}],
    staff:[{name:'Volontario logistico',position:[1.7,-1.2],color:'#d18a16'}]
  });
  makeCivicBuilding('health_station',20,-17,11,8,4,'#e5e8e5','#d92332','SOCCORSO',true,{
    id:'health-station',label:'Punto di supporto',type:'clinic',resident:'Referente del punto di supporto',color:'#b4484a',light:'#f1d8d6',
    features:[{id:'support-recovery',label:'Spazio tranquillo',speaker:'Referente del punto di supporto',text:'In questa scena il personaggio può recuperare energia. È una meccanica di gioco e non insegna né sostituisce cure reali.',position:[3,-2.1],shape:'tall',color:'#f0dddd',action:'recover'}],
    staff:[{name:'Volontaria di supporto',position:[-1.7,1.2],color:'#d92332'}]
  });
  makeCivicBuilding('neighborhood_home_west',-30,-2,7,7,5,'#d6c6ae','#6e8791','ABITAZIONI');
  makeCivicBuilding('neighborhood_home_east',30,18,7,7,5,'#d7d0bc','#6e8791','QUARTIERE');
  for(const x of [2.2,3.8])makeBox('turn_board_post',[x,1.05,-10.5],[.12,2.1,.12],mat('turn_board_post_mat','#56605f'),worldRoot,null,true);
  makeBox('turn_board_panel',[3,1.65,-10.5],[1.8,1.15,.16],mat('turn_board_panel_mat','#e8e3d3'),worldRoot,null,true);
  makeBox('turn_board_header',[3,2.1,-10.39],[1.65,.18,.04],mat('turn_board_header_mat','#d92332'),worldRoot,null,false);
  makeBox('uds_info_table',[-14,.72,11],[2.5,.14,1.2],mat('uds_info_table_mat','#88775c'),worldRoot,null,true);
  for(const x of [-14.8,-13.2])makeBox('uds_info_leaflet',[x,.82,11],[.38,.05,.28],mat('uds_info_leaflet_mat',x<-14?'#82aab0':'#e5d7b4'),worldRoot,[0,0,x<-14?-.08:.08],false);
  for(const [x,z] of [[-25,-18],[-13,-18],[13,-18],[25,-18],[-25,19],[-13,19],[13,19],[25,19]]){
    makeBox('street_tree_planter',[x,.2,z],[2.5,.4,2.5],mat('street_tree_planter_mat','#a69b85'),worldRoot,null,true);
    makeTree(x,z,'#577b54');
  }
  for(const [x,z] of [[-10,-9],[10,-9],[-10,9],[10,9],[-25,0],[25,0],[-8,22],[8,22]]){
    makeBox('public_bench',[x,.48,z],[2.3,.16,.58],mat('public_bench_mat','#725843'),worldRoot,null,true);
    for(const dx of [-.8,.8])makeBox('public_bench_leg',[x+dx,.23,z],[.12,.46,.48],mat('public_bench_leg_mat','#525c5a'),worldRoot,null,true);
    makeBox('public_bench_back',[x,.96,z-.22],[2.3,.72,.12],mat('public_bench_back_mat','#725843'),worldRoot,null,true);
  }
  for(const [x,z] of [[-17,-10],[17,-10],[-28,12],[28,-8],[-8,27],[8,27]]){
    const pole=makeCylinder('street_light_pole',[x,2.3,z],.085,4.6,mat('street_light_metal','#56605f'),worldRoot,8);
    pole.checkCollisions=true;
    makeBox('street_light_arm',[x+.42,4.45,z],[.9,.09,.09],mat('street_light_arm_mat','#56605f'),worldRoot,null,false);
    makeBox('street_light_lamp',[x+.82,4.32,z],[.42,.16,.28],mat('street_light_lamp_mat','#fff3c9','#f3d982',.42),worldRoot,null,false);
  }
  for(const x of [-3.2,0,3.2]){
    makeBox('food_crate',[14+x,.5,15],[1.3,1,.95],mat('food_crate_mat',x===0?'#c5aa78':'#9d8764'),worldRoot,null,true);
  }
  makeBox('supply_shelter_roof',[2,3,21],[9,.3,5],mat('supply_shelter_roof_mat','#e8e8df'),worldRoot,null,true);
  for(const x of [-2,6])for(const z of [19,23])makeBox('supply_shelter_post',[x,1.5,z],[.16,3,.16],mat('supply_shelter_post_mat','#66716d'),worldRoot,null,true);
  makeBox('supply_table',[2,.8,21],[5,.18,1.2],mat('supply_table_mat','#88775c'),worldRoot,null,true);
  const distributionStation=new BABYLON.TransformNode('distribution_station',scene);distributionStation.position.set(2,0,21);distributionStation.parent=worldRoot;
  houseEntrances.push({kind:'flavor',root:distributionStation,name:'Punto di preparazione della distribuzione',position:distributionStation.position,speaker:'Antonella',text:'La squadra prepara i pacchi e controlla le richieste in un’attività simulata. Avvicinati per ripetere la prova di distribuzione.',action:'distribution-replay'});
  makeBox('bus_stop_panel',[-21,1.65,-11],[1.25,2.4,.15],mat('bus_stop_panel_mat','#39798a'),worldRoot,null,true);
  makeBox('bus_stop_roof',[-21,2.95,-11],[3.5,.16,1.5],mat('bus_stop_roof_mat','#647a7b'),worldRoot,null,true);
  for(const x of [-22.5,-19.5])makeBox('bus_stop_post',[x,1.45,-11],[.12,2.8,.12],mat('bus_stop_post_mat','#596461'),worldRoot,null,true);
  makeBox('ambulance_body',[14,.95,-10],[5.8,1.7,2.5],mat('ambulance_body_mat','#f5f5f0'),worldRoot,null,true);
  makeBox('ambulance_red_band',[14,1.02,-8.72],[5.5,.42,.04],mat('ambulance_red_mat','#d92332'),worldRoot,null,false);
  makeBox('ambulance_window',[14,1.45,-8.68],[1.2,.55,.04],mat('ambulance_window_mat','#7ca4ad'),worldRoot,null,false);
  makeBox('ambulance_cross_v',[14,1.05,-8.64],[.18,.72,.035],mat('ambulance_cross_mat','#d92332'),worldRoot,null,false);
  makeBox('ambulance_cross_h',[14,1.05,-8.62],[.62,.18,.035],mat('ambulance_cross_mat','#d92332'),worldRoot,null,false);
  for(const x of [12,16])for(const z of [-11.2,-8.8]){
    const wheel=makeCylinder('ambulance_wheel',[x,.48,z],.48,.22,mat('ambulance_tire_mat','#303537'),worldRoot,10);
    wheel.rotation.x=Math.PI/2;
  }
  makeBox('ambulance_beacon',[14,1.9,-10],[.8,.18,.35],mat('ambulance_beacon_mat','#d92332','#d92332',.45),worldRoot,null,false);
  for(const [x,z] of [[-27,19],[-19,24],[-14,20],[-25,27]])makeGardenShrub(x,z,'#527354',.95);
  for(const [x,z] of [[-25,18],[-20,20],[-15,18],[-23,25],[-17,26]])makeWildflower(x,z,['#ebc65f','#e27672','#f2eee2'][Math.abs(Math.floor(x+z))%3],.9);
}
function buildErenfall(p,sceneName){
  const wall=mixHex(p.wall,'#c5b08a',.23),roof=mixHex(p.roof,'#251d26',.35);
  const serviceRoles={
    mara:{label:'Punto di coordinamento',resident:'Coordinatrice',features:['Bacheca dei turni','Registro del servizio'],texts:['La bacheca riporta turni e indicazioni condivise dal coordinamento.','Il registro viene custodito e aggiornato secondo le procedure del Comitato.']},
    teren:{label:'Deposito materiali',resident:'Referente logistico',features:['Dotazioni inventariate','Banco di preparazione'],texts:['Le dotazioni sono ordinate e controllate prima della consegna.','Il materiale viene preparato per il servizio assegnato.']},
    faye:{label:'Punto accoglienza',resident:'Referente accoglienza',features:['Spazio di ristoro','Registro delle presenze'],texts:['Il punto accoglienza offre uno spazio per orientamento e ascolto.','Le informazioni vengono trattate con riservatezza.']},
    nilo:{label:'Sala volontari',resident:'Volontario di Comitato',features:['Materiale informativo','Taccuino di servizio'],texts:['I materiali informativi si condividono solo quando sono aggiornati.','Ogni turno lascia appunti utili alla squadra.']}
  };
  const home=(id,label,type,resident,color,features,light)=>{
    const role=content?.redCrossStory?serviceRoles[id]:null;
    return {id,label:role?.label||label,type,resident:role?.resident||resident,color,features:role?features.map((feature,index)=>({...feature,label:role.features[index]||feature.label,speaker:role.resident,text:role.texts[index]||feature.text})):features,light};
  };
  makeHouse('Mara_bakery',-11,-12,wall,'#67464a',{sign:true,signGlow:'#df9d65',home:home('mara','Forno di Mara','bakery','Mara','#a76353',[{id:'oven',label:'Forno a legna',speaker:'Mara',text:'Il pane deve lievitare con calma. È il profumo del mattino che sveglia la via.',position:[-3.1,-2.8],shape:'tall',color:'#9b5038',glow:'#d47742'},{id:'dough',label:'Impasto sul tavolo',speaker:'Mara',text:'Farina sulle mani, legna nel forno: il lavoro di ogni giorno tiene in piedi il villaggio.',position:[-1.6,.1],shape:'box',color:'#c6a36f'}],'#e9a365')});
  makeHouse('Teren_forge',11,-11,'#887665','#3c3034',{sign:true,signGlow:'#ed9a52',w:6,d:5.3,home:home('teren','Fucina di Teren','forge','Teren','#79564c',[{id:'anvil',label:'Incudine di Teren',speaker:'Teren',text:'Un colpo alla volta. Teren controlla il metallo e tiene vicino il martello che gli è stato affidato.',position:[-3.15,-2.6],shape:'box',color:'#55535b',glow:'#a57952'},{id:'tools',label:'Banco degli attrezzi',speaker:'Teren',text:'Gli attrezzi sono allineati con cura: qui ogni lama comincia come un pezzo di ferro.',position:[-1.7,-.2],shape:'tall',color:'#73634e'}],'#ee9958')});
  makeHouse('Faye_inn',-12,4,'#a58f72','#57434a',{sign:true,signGlow:'#d9b56d',w:6.4,d:5.6,home:home('faye','Locanda di Faye','inn','Faye','#76608b',[{id:'soup',label:'Pentola della zuppa',speaker:'Faye',text:'La zuppa sobbolle piano. Faye dice che una ciotola calda riesce a far parlare anche chi è arrivato da lontano.',position:[-3.1,-2.5],shape:'round',color:'#a65f3f',glow:'#e39a56'},{id:'guestbook',label:'Registro degli ospiti',speaker:'Faye',text:'Tra i nomi e le date c’è spazio per chiunque abbia bisogno di una notte tranquilla.',position:[-1.8,.1],shape:'box',color:'#785641',gift:{type:'consumable',id:'pozione',quantity:1,flag:'houseGift_faye_guestbook'},claimedText:'Il registro è ancora aperto sul tavolo. Faye ha già lasciato una pozione per il viaggio: non ce ne sono altre qui.'}],'#e8c17b')});
  makeHouse('Nilo_home',12,5,'#948a75','#4e4044',{w:5,d:4.8,home:home('nilo','Casa di Nilo','home','Nilo','#71858c',[{id:'sun',label:'Sole di legno',speaker:'Nilo',text:'Il piccolo sole è intagliato nel legno. Nilo lo ha levigato finché non è diventato liscio come una promessa.',position:[-3.05,-2.5],shape:'round',color:'#d2a84f',glow:'#efc85e'},{id:'sketches',label:'Disegni sul tavolo',speaker:'Nilo',text:'Nei disegni il sole sorge sempre sopra case diverse, ma illumina tutte le finestre.',position:[-1.6,.1],shape:'box',color:'#9f8061'}],'#d9b66d')});
  makeHouse('Old_house',-19,16,'#756c5f',roof,{w:4.7,d:4.2,home:home('empty_west','Casa vuota','empty',null,'#777168',[{id:'cup',label:'Ciotola sul tavolo',text:'La polvere si è posata ovunque, tranne che attorno a una ciotola appena lavata.',position:[-1.7,.1],shape:'round',color:'#a49a88',gift:{type:'gold',amount:6,flag:'houseGift_empty_west_cup'},claimedText:'La ciotola è vuota. Sul tavolo non è rimasta altra moneta.'}],'#9c8b78')});
  makeHouse('Traveler_house',19,17,'#817868','#4a3c42',{w:4.7,d:4.2,home:home('empty_east','Casa del viandante','empty',null,'#756b63',[{id:'map',label:'Mappa lasciata sul tavolo',text:'Una mappa incompleta mostra sentieri che partono dal villaggio e si perdono ai margini della carta.',position:[-1.7,.1],shape:'box',color:'#aa946d'}],'#a38c77')});
  makeHouse('South_cottage',-25,-8,'#827765','#4c3b3e',{w:4.8,d:4.1,home:home('empty_south','Casetta disabitata','empty',null,'#716960',[],'#958779')});
  makeHouse('East_cottage',25,-6,'#8e806b','#514047',{w:4.8,d:4.1,home:home('empty_east2','Casa con le imposte chiuse','empty',null,'#726960',[],'#9b8876')});
  // Market square, fountain/well, barrels and timber awnings.
  makeCylinder('village_well_base',[0,.35,9],2.5,.7,mat('well_stone','#65594c'),worldRoot,10);makeCylinder('village_well_hole',[0,.72,9],1.55,.08,mat('well_water','#202b36','#2f6470'),worldRoot,10);
  makeBox('well_beamL',[-1.2,1.65,9],[.16,2,.16],mat('well_wood','#44332b'),worldRoot,null,true);makeBox('well_beamR',[1.2,1.65,9],[.16,2,.16],mat('well_wood','#44332b'),worldRoot,null,true);makeBox('well_roof',[0,2.7,9],[3,.16,1.8],mat('well_roof','#49343b'),worldRoot,[0,0,.12],false);
  for(const [x,z] of [[-5,-3],[5,-3],[-5,15],[5,15]]){makeBox('market_table',[x,.65,z],[2.8,.18,1.1],mat('market_wood','#624333'),worldRoot,null,true);makeBox('market_cloth',[x,1.2,z],[3,.08,1.35],mat('market_cloth',x<0?'#9c574d':'#b29a5f'),worldRoot,[0,0,.05],false);}
  const crossStreet=BABYLON.MeshBuilder.CreateGround('village_cross_street',{width:52,height:6,subdivisions:2},scene);crossStreet.position.set(0,.012,1);crossStreet.material=makePavingMaterial('village_cross_street_mat',mixHex(p.path,'#38343a',.08));crossStreet.parent=worldRoot;
  for(const z of [-2.4,4.4])makeBox('street_curb',[0,.12,z],[52,.24,.22],mat('street_curb_mat','#655a50'),worldRoot,null,true);
  for(const [x,z] of [[-15,-1],[-15,7],[15,-1],[15,7]])makeBox('village_bench',[x,.46,z],[2.2,.14,.55],mat('village_bench_mat','#654735'),worldRoot,null,true);
  for(const [x,z] of [[-7,1],[7,1],[-17,2],[17,2]]){makeBox('planter',[x,.25,z],[1.3,.5,1.3],mat('planter_stone','#65574b'),worldRoot,null,true);for(const dx of [-.3,.3])makeSphere('planter_flower',[x+dx,.65,z],.35,mat('planter_flower_mat',dx<0?'#bd786c':'#d0b46f'),worldRoot,7);}
  for(const x of [-10,-6,6,10])makeBox('street_banner',[x,3,1],[.55,1.1,.12],mat('street_banner_mat',x<0?'#86535a':'#82704c'),worldRoot,[0,0,x<0?.08:-.08],false);
  for(const [x,z] of [[-22,-4],[22,-3],[-23,9],[23,9],[-22,24],[22,24]])makeTree(x,z,'#435440');
  for(const [x,z] of [[-29,-17],[-27,-12],[-29,1],[-28,14],[-29,21],[29,-17],[27,-12],[29,1],[28,14],[29,21],[-18,-20],[18,-20],[-18,23],[18,23]])makeGardenShrub(x,z,'#40563e',.9);
  for(const [x,z] of [[-8.5,-18],[8.5,-18],[-8.5,-7],[8.5,-7],[-8.5,10],[8.5,10],[-8.5,21],[8.5,21]])makeGardenShrub(x,z,'#526747',.82);
  for(const [x,z] of [[-16,-5],[-18,5],[-16,12],[-8,-5],[8,-5],[16,-5],[18,5],[16,12],[8,12],[-8,12]])makeWildflower(x,z,z%2?'#c98682':'#d7b56d',.9);
  for(const [x,z] of [[-6,-17],[6,-17],[-7,19],[7,19]])makeLamp(x,z,p.glow);
  // Wooden fence sections and stone kerbs frame the road and square.
  for(let z=-26;z<28;z+=3){for(const x of [-5.2,5.2]){makeBox('road_stone',[x,.14,z],[.3,.28,2.7],mat('road_stone_mat','#635b52'),worldRoot,null,true);}}
  makeBox('town_gate_left',[-17,2,-25],[1,4,1],mat('gate_stone','#5b514b'),worldRoot,null,true);makeBox('town_gate_right',[17,2,-25],[1,4,1],mat('gate_stone','#5b514b'),worldRoot,null,true);makeBox('town_gate_lintel',[0,4,-25],[35,1,1.4],mat('gate_stone','#5b514b'),worldRoot,null,true);
  makeBox('gate_bannerL',[-12,2.5,-24],[1.1,2.2,.15],mat('bannerL','#69404a','#9b4c58'),worldRoot,null,false);makeBox('gate_bannerR',[12,2.5,-24],[1.1,2.2,.15],mat('bannerR','#4b3b64','#8266b4'),worldRoot,null,false);
  if(sceneName==='porter_home'){makeHouse('porter_home',0,19,'#9a896f','#4b3d45',{w:6.5,d:5.4,sign:true,signGlow:'#d9b56d',home:home('porter','Casa del Portatore','home','Viandante','#788092',[],'#d9b56d')});}
}
function buildForge(p){
  buildCityBase(p);makeHouse('foundry_hall',-12,3,'#655951','#30282d',{w:8,d:7,sign:true,signGlow:p.glow});makeHouse('smiths_quarters',13,5,'#76665b','#423237',{w:6,d:5});
  makeBox('anvil_base',[0,.45,5],[4,.9,2.5],mat('anvil_stone','#3d3b40'),worldRoot,null,true);makeBox('anvil_top',[0,1.05,5],[4.8,.25,2.8],mat('anvil_iron','#a0a0a8','#4d4654'),worldRoot,null,true);
  makeCylinder('forge_hearth',[0,.65,10],3.3,1.3,mat('forge_brick','#633d36'),worldRoot,10);makeSphere('forge_fire',[0,1.45,10],1.35,mat('forge_fire_mat','#f39b45','#ff5a20'),worldRoot,8);
  for(const x of [-8,-4,4,8]){makeBox('workbench',[x,.65,9],[2.6,.18,1.2],mat('workbench_mat','#604535'),worldRoot,null,true);makeBox('forge_tool',[x+.3,1.1,9],[.12,.9,.12],mat('forge_tool_mat','#b6b0b8'),worldRoot,[0,0,.4],false);}
  for(const x of [-17,17])makeTower('forge_stack',x,12,9,'#51474b','#30272d');for(const x of [-8,8])makeLamp(x,-2,p.glow);
}
function buildSkyCity(p){
  buildCityBase(p);for(let i=0;i<7;i++){let x=-27+i*9;makeTower('sky_tower',x,7+(i%2)*7,10+(i%3)*5,'#536c7c','#34475d');}
  for(const [x,z,w] of [[-15,-2,13],[4,4,17],[19,14,12]]){makeBox('sky_bridge',[x,3.4,z],[w,.38,2.2],mat('sky_bridge_mat','#839eac','#3f728c'),worldRoot,null,true);for(let j=0;j<Math.floor(w/2);j++)makeBox('bridge_rail',[x-w/2+j*2,4,z-1],[.1,1,.1],mat('bridge_rail_mat','#a5b7c2'),worldRoot,null,true);}
  for(const [x,z] of [[-20,-18],[20,-15],[-26,20],[25,22]]){const island=makeSphere('floating_island',[x,2,z],7,mat('floating_island_mat','#3d4d5b'),worldRoot,6);island.scaling.set(1,.25,1);makeBox('floating_grass',[x,2.5,z],[5,.2,5],mat('floating_grass_mat','#5f7e79'),worldRoot,null,true);}
  makeTower('meridian_spire',0,16,24,'#607889','#d0b980');
}
function buildTemple(p){
  buildCityBase(p);for(let i=0;i<8;i++){const x=-14+i*4;makePillar(x,5,7,mixHex(p.wall,'#c9b5b4',.2));}
  makeBox('temple_roof',[0,7,5],[35,.8,6],mat('temple_roof_mat',p.roof),worldRoot,[0,0,.02],true);makeBox('temple_altar',[0,1.1,11],[6,2,2.5],mat('temple_altar_mat',mixHex(p.wall,'#d9c9b0',.15),p.glow),worldRoot,null,true);
  makeCylinder('temple_seal',[0,3.1,11],2.6,.2,mat('temple_seal_mat',p.accent,p.glow),worldRoot,6);
  for(const x of [-21,21])makeTower('temple_tower',x,10,15,p.wall,p.roof);
}
function buildCitadel(p){
  buildCityBase(p);for(const x of [-18,-9,0,9,18])makeTower('citadel_tower',x,8,12+(Math.abs(x)%3)*2,p.wall,p.roof);
  makeBox('citadel_wall',[0,3,11],[38,6,2],mat('citadel_wall_mat',mixHex(p.wall,'#20202a',.25)),worldRoot,null,true);makeBox('citadel_gate',[0,2,12.1],[5,4,.3],mat('citadel_gate_mat','#17151e',p.glow),worldRoot,null,false);
  for(const x of [-12,12])makeBox('banner',[x,4,10],[1.3,2.5,.1],mat('citadel_banner',p.roof,p.glow),worldRoot,null,false);
}
function buildCityBase(p){
  for(let i=0;i<11;i++){const x=-27+i*5.4,z=8+(i%3)*6;makeHouse('district_house',x,z,mixHex(p.wall,'#25242d',.16),mixHex(p.roof,'#0d0d14',.18),{w:3.8+(i%2)*.8,d:3.8,h:2.8+(i%3)*.6});}
  for(let i=0;i<5;i++)makeLamp(-18+i*9,-9,p.glow);
  makeCylinder('plaza_fountain',[0,.35,7],3.4,.7,mat('plaza_stone','#5a555e'),worldRoot,10);makeCylinder('plaza_water',[0,.73,7],2.5,.1,mat('plaza_water','#1e3746','#387c8a'),worldRoot,10);
}
function buildCity(p,name){buildCityBase(p);if(name.includes('shadow')||name.includes('black')){for(let i=0;i<4;i++)makeTower('shadow_spire',-18+i*12,14,16+(i%2)*7,'#302536','#17131f');}else{for(let i=0;i<3;i++)makeTower('district_tower',-17+i*17,15,10+i*3,p.wall,p.roof);}for(let i=0;i<6;i++){const x=-22+i*9;makeBox('city_bridge',[x,2.5,-2],[6,.25,1.5],mat('city_bridge_mat',mixHex(p.path,'#292735',.3)),worldRoot,null,true);}}
function buildForest(p){
  for(let i=0;i<34;i++){let x=Math.sin(i*12.37)*29,z=Math.cos(i*8.31)*28;if(Math.abs(x)<8&&z<5&&z>-20)continue;makeTree(x,z,i%3===0?'#304b3d':mixHex(p.ground,'#4d7356',.35));}
  for(let i=0;i<28;i++){const x=Math.sin(i*7.13)*31,z=Math.cos(i*8.17)*29;if((Math.abs(x)<8&&z<15&&z>-23)||(Math.abs(x)<6&&Math.abs(z-10)<5))continue;makeGardenShrub(x,z,i%3===0?'#526747':'#40583f',.65+(i%3)*.12);}
  for(let i=0;i<18;i++){const x=Math.sin(i*5.31)*27,z=Math.cos(i*6.79)*26;if((Math.abs(x)<8&&z<15&&z>-23)||(Math.abs(x)<6&&Math.abs(z-10)<5))continue;makeWildflower(x,z,['#c98682','#d7b56d','#a98bc8'][i%3],.65+(i%2)*.2);}
  makeBox('forest_shrine',[0,1,10],[5,2,3],mat('forest_shrine_mat',p.wall),worldRoot,null,true);makeBox('shrine_top',[0,2.2,10],[6,.3,3.6],mat('forest_roof',p.roof),worldRoot,[0,0,.05],true);
}
function buildWaterland(p){
  const water=makeBox('water_plane',[0,-.12,16],[130,.15,42],mat('water_mat','#183a4a','#1b596b',.86),worldRoot,null,false);water.isPickable=false;
  for(let i=0;i<7;i++){let x=-27+i*9;makeBox('dock',[x,.12,0],[7,.22,3],mat('dock_mat','#604a3c'),worldRoot,[0,0,.02],true);makeBox('dock_post',[x-3,.75,-1],[.2,1.5,.2],mat('dock_post_mat','#4d3a30'),worldRoot,null,true);}
  for(let i=0;i<8;i++){let x=-28+i*8;const rock=makeSphere('sea_rock',[x,.1,32+(i%3)*2],5,mat('sea_rock_mat',p.ground),worldRoot,6);rock.checkCollisions=true;}
  makeTower('lighthouse',20,3,15,p.wall,p.roof);makeSphere('lighthouse_light',[20,15,3],.8,mat('lighthouse_glow',p.glow,p.glow),worldRoot,8);
}
function buildBossArena(p){
  makeCylinder('arena_outer',[0,-.05,4],38,.35,mat('arena_outer_mat',mixHex(p.ground,'#0b0b12',.25)),worldRoot,12);
  makeCylinder('arena_inner',[0,.12,4],28,.2,mat('arena_inner_mat',p.path),worldRoot,12);
  for(let i=0;i<12;i++){let a=i*Math.PI/6;makePillar(Math.cos(a)*17,4+Math.sin(a)*17,3+(i%3),p.wall);}
  makeCylinder('arena_seal',[0,.3,4],8,.12,mat('arena_seal_mat',p.accent,p.glow,.8),worldRoot,6);
  for(let i=0;i<8;i++){let a=i*Math.PI/4;makeBox('arena_rune',[Math.cos(a)*11,.35,4+Math.sin(a)*11],[1.4,.12,.4],mat('arena_rune_mat',p.glow,p.glow),worldRoot,[0,-a,0],false);}
}
function buildRuins(p,name){
  buildBossArena(p);for(let i=0;i<7;i++){let x=-27+i*9;makeBox('ruin_wall',[x,1.4,15+(i%2)*4],[4,2.8,1.3],mat('ruin_wall_mat',mixHex(p.wall,'#14141d',.28)),worldRoot,[0,0,(i%2?.1:-.1)],true);}
  if(name.includes('null')||name.includes('fracture')||name.includes('scar')){for(let i=0;i<7;i++){let x=-25+i*8;const crack=makeBox('nullombra_crack',[x,.18,5+(i%3)*4],[.25,.06,12],mat('nullombra_crack_mat','#bb3d9b','#d63cbe'),worldRoot,[0,0,(i%2?.08:-.08)],false);}}
}

function addNpc(name,pos,colorHex,kind='npc'){
  name=redCrossPersonName(name);
  const root=new BABYLON.TransformNode('npc_'+name.replace(/\W/g,'_'),scene);root.position.set(pos[0],0,pos[1]);root.parent=actorRoot;
  const profile=characterProfile(name,colorHex,false),model=buildHumanoid(root,name,profile,0);
  if(kind==='npc'&&content?.redCrossStory)root.metadata={roaming:{home:root.position.clone(),target:null,wait:Math.random()*1.2,speed:.8+Math.random()*.35},model};
  const labelPlane=BABYLON.MeshBuilder.CreatePlane('npc_label_'+name,{width:3.7,height:.48},scene);labelPlane.position.set(0,3.05,0);labelPlane.parent=root;labelPlane.billboardMode=BABYLON.Mesh.BILLBOARDMODE_ALL;labelPlane.isPickable=false;
  const tex=new BABYLON.DynamicTexture('npc_label_tex_'+name,{width:512,height:96},scene,false);const ctx=tex.getContext();ctx.clearRect(0,0,512,96);ctx.fillStyle=content?.redCrossStory?'rgba(255,255,255,.94)':'rgba(7,7,13,.82)';ctx.fillRect(0,0,512,96);ctx.strokeStyle=profile.redCross?'#ef233c':profile.accent;ctx.lineWidth=3;ctx.strokeRect(2,2,508,92);ctx.fillStyle=content?.redCrossStory?'#173b58':'#f0dfb9';ctx.font=content?.redCrossStory?'bold 30px Arial':'bold 30px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(name,256,48);tex.update();const lm=new BABYLON.StandardMaterial('npc_label_mat_'+name,scene);lm.diffuseTexture=tex;lm.emissiveTexture=tex;lm.opacityTexture=tex;lm.backFaceCulling=false;labelPlane.material=lm;
  interactables.push({kind,root,name,position:root.position});return root;
}
function addWorldDiscoveries(){
  for(const discovery of RED_CROSS_DISCOVERIES){
    const root=new BABYLON.TransformNode('discovery_'+discovery.id,scene);root.position.set(discovery.position[0],0,discovery.position[1]);root.parent=actorRoot;
    const badge=BABYLON.MeshBuilder.CreatePlane('discovery_badge_'+discovery.id,{width:.62,height:.62},scene);
    badge.position.y=2.25;badge.parent=root;badge.billboardMode=BABYLON.Mesh.BILLBOARDMODE_ALL;badge.isPickable=false;
    const found=!!game?.player?.flags?.['worldDiscovery_'+discovery.id],texture=new BABYLON.DynamicTexture('discovery_badge_texture_'+discovery.id,{width:128,height:128},scene,false),ctx=texture.getContext();
    ctx.clearRect(0,0,128,128);ctx.beginPath();ctx.arc(64,64,58,0,Math.PI*2);ctx.fillStyle=found?'#2d8a56':'#1677c8';ctx.fill();ctx.strokeStyle='#ffffff';ctx.lineWidth=7;ctx.stroke();
    ctx.fillStyle='#ffffff';ctx.font='bold 82px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(found?'✓':'i',64,65);texture.update();
    const markerMat=new BABYLON.StandardMaterial('discovery_badge_mat_'+discovery.id,scene);markerMat.diffuseTexture=texture;markerMat.emissiveTexture=texture;markerMat.opacityTexture=texture;markerMat.useAlphaFromDiffuseTexture=true;markerMat.backFaceCulling=false;badge.material=markerMat;
    interactables.push({kind:'flavor',root,name:discovery.name,position:root.position,text:discovery.text,discoveryId:discovery.id});
  }
}
function addObjective(step){
  const definition=content?.redCrossStory?missionDefinition(step.chapter_number):null;
  const pos=definition?new BABYLON.Vector3(definition.coords[0],0,definition.coords[1]):new BABYLON.Vector3(0,0,5.5);
  const root=new BABYLON.TransformNode('objective_marker',scene);root.position.copyFrom(pos);root.parent=actorRoot;
  if(content?.redCrossStory){
    const stationNames=['PREPARAZIONE','REGISTRO LOTTI','DISTRIBUZIONE','ASCOLTO','COORDINAMENTO','CONSEGNE'];
    const stationName=stationNames[Number(step.chapter_number)-1]||'PUNTO SERVIZIO';
    const accent=Number(step.chapter_number)===4?'#238c85':'#ef233c';
    makeCylinder('service_station_base',[0,.12,0],1.6,.24,mat('service_station_base_mat','#d5d0c3'),root,16).checkCollisions=false;
    if(step.chapter_number===1||step.chapter_number===3||step.chapter_number===6){
      makeBox('service_station_table',[0,.86,0],[2.5,.18,1.25],mat('service_station_table_mat','#88775c'),root,null,false);
      for(const x of [-.9,.9])for(const z of [-.42,.42])makeBox('service_station_table_leg',[x,.44,z],[.12,.84,.12],mat('service_station_leg_mat','#685a48'),root,null,false);
      const crateColor=step.chapter_number===3?'#d3bd8f':'#a78e69';
      for(const x of [-.65,.65])makeBox('service_station_crate',[x,1.22,-.12],[.72,.52,.62],mat('service_station_crate_mat',crateColor),root,null,false);
    }else if(step.chapter_number===2){
      for(const x of [-.6,.6])makeBox('service_station_food_crate',[x,.58,0],[.9,.85,.85],mat('service_station_crate_mat',x<0?'#c5aa78':'#9d8764'),root,null,false);
      makeBox('service_station_register',[0,1.15,.42],[1.35,.2,.3],mat('service_station_register_mat','#5b8792'),root,null,false);
    }else if(step.chapter_number===4){
      makeBox('service_station_bench',[0,.53,0],[2.15,.14,.58],mat('service_station_bench_mat','#725843'),root,null,false);
      makeBox('service_station_bench_back',[0,.98,-.2],[2.15,.72,.12],mat('service_station_bench_back_mat','#725843'),root,null,false);
    }else{
      makeBox('service_station_route_map',[0,1.2,0],[1.8,1.25,.12],mat('service_station_map_mat','#fffdf8'),root,null,false);
      makeBox('service_station_route_line',[0,1.2,.08],[1.3,.07,.025],mat('service_station_route_line_mat','#1877d2'),root,null,false);
      for(const x of [-.48,0,.48])makeSphere('service_station_route_point',[x,1.2,.12],.13,mat('service_station_route_point_mat','#ef233c'),root,8);
    }
    const post=makeCylinder('service_objective_post',[0,1.7,0],.08,1.25,mat('service_objective_post_mat','#56605f'),root,8);post.checkCollisions=false;
    const board=makeBox('service_objective_board',[0,2.42,0],[2.25,.56,.14],mat('service_objective_board_mat','#fffdf8'),root,null,false);
    const texture=new BABYLON.DynamicTexture('service_objective_texture',{width:512,height:128},scene,false),ctx=texture.getContext();
    ctx.fillStyle='#fffdf8';ctx.fillRect(0,0,512,128);ctx.fillStyle=accent;ctx.fillRect(0,0,512,19);ctx.fillStyle='#173b58';ctx.font='bold 44px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(stationName,256,77);texture.update();
    const signMat=new BABYLON.StandardMaterial('service_objective_sign_mat',scene);signMat.diffuseTexture=texture;signMat.emissiveTexture=texture;signMat.backFaceCulling=false;board.material=signMat;
    interactables.push({kind:'goal',root,name:definition?.station||'Punto del servizio',position:root.position});
    return;
  }
  const ring=BABYLON.MeshBuilder.CreateTorus('objective_ring',{diameter:2.1,thickness:.09,tessellation:32},scene);ring.position.y=1.35;ring.material=mat('objective_ring_mat',stepNeedsCombat(step)?'#bd5368':'#d7b56d',stepNeedsCombat(step)?'#a12e48':'#c8a55f');ring.parent=root;
  const crystal=BABYLON.MeshBuilder.CreatePolyhedron('objective_crystal',{type:1,size:.72},scene);crystal.position.y=1.6;crystal.material=mat('objective_crystal_mat',stepNeedsCombat(step)?'#8d344c':'#7f5ca9',stepNeedsCombat(step)?'#e14f6a':'#c59aff');crystal.parent=root;
  const base=makeCylinder('objective_base',[0,.15,0],1.4,.25,mat('objective_base_mat','#292431'),root,8);base.parent=root;
  interactables.push({kind:stepNeedsCombat(step)?'enemy':'goal',root,name:stepNeedsCombat(step)?'Punto di esercitazione':'Punto della tappa',position:root.position});
}
function rebuildActors(step){
  humanoidModels=humanoidModels.filter(model=>model&&!model.isDisposed?.());
  if(actorRoot)actorRoot.dispose(false,true);actorRoot=new BABYLON.TransformNode('worldActors',scene);actorRoot.parent=worldRoot;interactables=[];
  interactables.push(...houseEntrances);
  if(hubMode){
    addNpc(content?.redCrossStory?'Angela':'Mara, Fornaia',content?.redCrossStory?[-20,14]:[-8,-7],'#8d5554');
    addNpc(content?.redCrossStory?'Sara':'Teren, Fabbro',content?.redCrossStory?[19,14]:[8,-6],'#76524a',content?.redCrossStory?'npc':'blacksmith');
    if(content?.redCrossStory)addNpc('Antonella',[2,24],'#9b6150');
    addNpc(content?.redCrossStory?'Volontario di Comitato':'Nilo',[8,10],'#6b7d83');
    addNpc(content?.redCrossStory?'Referente accoglienza':'Faye, Locandiera',content?.redCrossStory?[-14,12]:[-9,8],'#66517d',content?.redCrossStory?'npc':'innkeeper');
    if(!content?.redCrossStory)addNpc('Bren, Mercante',[0,13],'#a47a51','merchant');
    if(content?.redCrossStory)addWorldDiscoveries();
    return;
  }
  const palette=paletteFor(step);const dialogue=Array.isArray(step.dialogue)?step.dialogue:[];const names=[];
  for(const line of dialogue){const s=Array.isArray(line)?line[0]:'Narratore';if(!s||/^(Narratore|Protagonista|Portatore|Eroe|Sistema)$/i.test(s))continue;if(!names.includes(s))names.push(s);}
  if(String(step.scene)==='erenfall'||step.chapter_number<=3){
    const known=content?.redCrossStory?[['Coordinatrice',-7,-7,'#8d5554'],['Referente logistico',14,14,'#76524a'],['Volontario di Comitato',0,16,'#6b7d83'],['Referente accoglienza',-14,12,'#66517d'],['Volontario',15,-6,'#777b87']]:[['Mara, Fornaia',-8,-7,'#8d5554'],['Teren, Fabbro',8,-6,'#76524a','blacksmith'],['Nilo',8,10,'#6b7d83'],['Faye, Locandiera',-9,8,'#66517d','innkeeper'],['Iven',0,16,'#777b87']];
    for(let i=0;i<Math.min(known.length,Math.max(3,names.length));i++){const k=known[i],position=content?.redCrossStory&&Number(step.chapter_number)===2&&k[0]==='Referente logistico'?[24,17]:[k[1],k[2]];addNpc(k[0],position,k[3],k[4]||'npc');}
    if(step.chapter_number<=3&&!content?.redCrossStory)addNpc('Bren, Mercante',[0,13],'#a47a51','merchant');
    const extraNames=names.filter(n=>!known.some(k=>redCrossPersonName(k[0])===redCrossPersonName(n))).slice(0,3);
    if(content?.redCrossStory){
      const positions=[[-12,-1],[12,-2],[0,26]];
      extraNames.forEach((name,index)=>addNpc(name,positions[index],speakerColor(name)));
    }else extraNames.forEach((name,index)=>addNpc(name,[-6+index*6,2+index*3],speakerColor(name)));
  } else {
    names.slice(0,5).forEach((n,i)=>{const a=i*Math.PI*2/Math.max(1,Math.min(5,names.length));addNpc(n,[Math.cos(a)*5,Math.sin(a)*5+1],speakerColor(n));});
  }
  if(content?.redCrossStory&&Number(step.chapter_number)===3&&!interactables.some(item=>item.name==='Antonella'))addNpc('Antonella',[2,22],'#9b6150');
  if(content?.redCrossStory&&Number(step.chapter_number)===4&&!interactables.some(item=>item.name==='Angela'))addNpc('Angela',[-14,11],'#238c85');
  if(content?.redCrossStory)addWorldDiscoveries();
  addObjective(step);
  if(playerRoot){playerRoot.position.y=.9;playerVerticalVelocity=0;jumpRequested=false;sprintFromDoubleTap=false;}
}
function speakerColor(name){const colors=['#79618e','#8a6555','#567e82','#7b6d52','#5e6286','#87566d'];let n=0;for(let i=0;i<name.length;i++)n+=name.charCodeAt(i);return colors[n%colors.length];}

function npcPathBlocked(root,from,to){
  const direction=to.subtract(from),distance=direction.length();
  if(distance<.01)return false;
  direction.normalize();
  const ray=new BABYLON.Ray(new BABYLON.Vector3(from.x,.72,from.z),direction,distance+.35);
  const hit=scene.pickWithRay(ray,mesh=>mesh.checkCollisions&&!mesh.isDisposed?.()&&!mesh.isDescendantOf(actorRoot));
  return !!hit?.hit;
}
function updateRoamingNPCs(dt,now){
  if(!content?.redCrossStory||!actorRoot)return;
  for(const item of interactables){
    if(item.kind!=='npc'||!item.root?.metadata?.roaming)continue;
    const root=item.root,state=root.metadata.roaming,model=root.metadata.model;
    if(root.isDisposed()||!model||model.isDisposed?.())continue;
    state.wait=Math.max(0,state.wait-dt);
    if(!state.target&&state.wait===0){
      const angle=Math.random()*Math.PI*2,radius=1.2+Math.random()*1.8;
      const target=new BABYLON.Vector3(state.home.x+Math.cos(angle)*radius,0,state.home.z+Math.sin(angle)*radius);
      if(npcPathBlocked(root,root.position,target))state.wait=1+Math.random()*2;
      else state.target=target;
    }
    let walking=false,intensity=0;
    if(state.target){
      const offset=state.target.subtract(root.position);offset.y=0;
      const distance=offset.length(),step=Math.min(distance,state.speed*dt);
      if(distance<.18){
        state.target=null;state.wait=1+Math.random()*2;
      }else{
        offset.scaleInPlace(step/distance);
        const next=root.position.add(offset);
        if(Math.hypot(next.x-state.home.x,next.z-state.home.z)<=3.25){
          root.position.x=next.x;root.position.z=next.z;
          root.rotation.y=Math.atan2(offset.x,offset.z);
          walking=true;intensity=clamp(state.speed/1.2,0,1);
        }else{state.target=null;state.wait=1;}
      }
    }
    const distanceToPlayer=playerRoot?BABYLON.Vector3.Distance(root.position,playerRoot.position):Infinity;
    if(distanceToPlayer<5){
      const toward=playerRoot.position.subtract(root.position);
      const desired=Math.atan2(toward.x,toward.z),difference=Math.atan2(Math.sin(desired-root.rotation.y),Math.cos(desired-root.rotation.y));
      root.rotation.y+=clamp(difference,-dt*2.2,dt*2.2);
    }
    model.metadata.animation.roaming=walking;
    model.metadata.animation.roamIntensity=intensity;
  }
}

function updateWorld(){
  mpTick();
  const dt=Math.min(.05,(engine?.getDeltaTime?.()||16)/1000);const now=performance.now()/1000;
  const vrCamera=isXRActive()?xrExperience.baseExperience.camera:null,roomScaleMovement=syncXRRoomScale(vrCamera);
  if(now-lastMoteUpdateAt>.033){lastMoteUpdateAt=now;for(const m of motes){if(!m||m.isDisposed())continue;m.position.y=m.metadata.baseY+Math.sin(now*m.metadata.speed+m.metadata.phase)*.65;m.position.x+=Math.sin(now*.25+m.metadata.phase)*dt*.08;}}
  if(titleDie&&!game){titleDie.rotation.x=now*.32;titleDie.rotation.y=now*.5;titleDie.position.y=2.5+Math.sin(now*1.4)*.25;if(titleDie.metadata?.orbit)titleDie.metadata.orbit.rotation.y=now*.42;}
  let playerMoving=false,playerMoveIntensity=0;
  if(playerRoot&&game&&!inputLocked&&$('pauseScreen').classList.contains('hidden')&&$('sidePanel').classList.contains('hidden')&&$('localMap').classList.contains('hidden')&&!dialogueVisible&&!currentBattle&&!pendingChoice){
    const before=playerRoot.position.clone();
    if(jumpRequested&&playerRoot.position.y<=.96&&playerVerticalVelocity<=0)playerVerticalVelocity=6.4;
    jumpRequested=false;playerVerticalVelocity=Math.max(-18,playerVerticalVelocity-18*dt);
    const forward=vrCamera?vrCamera.getDirection(BABYLON.Axis.Z).clone():camera.getTarget().subtract(camera.position);forward.y=0;if(forward.lengthSquared()>0)forward.normalize();
    // Movimento relativo alla visuale: destra e sinistra restano coerenti anche ruotando la telecamera.
    const right=BABYLON.Vector3.Cross(BABYLON.Vector3.Up(),forward).normalize();
    let move=BABYLON.Vector3.Zero();if(isActionKeyDown('moveForward')||gamepadAxes.y<-.22)move.addInPlace(forward);if(isActionKeyDown('moveBackward')||gamepadAxes.y>.22)move.subtractInPlace(forward);if(isActionKeyDown('moveRight')||gamepadAxes.x>.22)move.addInPlace(right);if(isActionKeyDown('moveLeft')||gamepadAxes.x<-.22)move.subtractInPlace(right);
    const movingForward=isActionKeyDown('moveForward')||gamepadAxes.y<-.22;
    const sprinting=movingForward&&(keys.ShiftLeft||keys.ShiftRight||sprintFromDoubleTap);
    const walkSpeed=(game.player.speed||10)*.5*(1+skillRank('fleet_step')*.06)*(sprinting?1.75:1),verticalStep=playerVerticalVelocity*dt;
    if(move.lengthSquared()>0)move.normalize().scaleInPlace(walkSpeed*dt);
    move.y=verticalStep;
    playerRoot.moveWithCollisions(move);
    if(vrCamera){
      const travelled=playerRoot.position.subtract(before);
      vrCamera.position.x+=travelled.x;vrCamera.position.z+=travelled.z;
    }
    if(Math.abs(playerRoot.position.y-before.y-verticalStep)>.001)playerVerticalVelocity=0;
    if(playerRoot.position.y<=.92&&playerVerticalVelocity<0)playerVerticalVelocity=0;
    const actual=playerRoot.position.subtract(before);actual.y=0;playerMoving=actual.lengthSquared()>.000001||roomScaleMovement.lengthSquared()>.000001;playerMoveIntensity=clamp(Math.max(actual.length(),roomScaleMovement.length())/Math.max(dt,.001)/Math.max(1,walkSpeed),0,1);if(actual.lengthSquared()>.000001)playerRoot.rotation.y=Math.atan2(move.x,move.z);
    // Segue lo spostamento senza annullare le regolazioni manuali della telecamera.
    camera.target.addInPlace(playerRoot.position.subtract(before));
  }
  if(vrCamera&&xrLastHeadsetPosition)xrLastHeadsetPosition.copyFrom(vrCamera.getAbsolutePosition());
  updateRoamingNPCs(dt,now);
  if(playerModel)animateHumanoid(playerModel,dt,now,playerMoving,playerMoveIntensity);
  if(now-lastNpcAnimationAt>.033){lastNpcAnimationAt=now;for(const model of humanoidModels){if(model!==playerModel&&!model.isDisposed?.()){const animation=model.metadata?.animation;animateHumanoid(model,dt,now,!!animation?.roaming,animation?.roamIntensity||0);}}}
  if(currentBattle?.mesh&&!currentBattle.mesh.isDisposed()){
    const enemy=currentBattle.mesh,meta=enemy.metadata,action=meta?.action||'idle';
    if(meta){meta.phase+=dt;if(action==='attack'){meta.actionElapsed+=dt;enemy.position.z=5-Math.sin(Math.min(1,meta.actionElapsed/.42)*Math.PI)*.72;}else enemy.position.z=5;
      if(meta.model?.metadata?.animation){meta.model.metadata.animation.action=action;}
      if(meta.aura){meta.aura.rotation.y+=dt*(currentBattle.isBoss ? .8 : 1.1);meta.aura.scaling.setAll(1+Math.sin(meta.phase*2.2)*.07);}
      if(meta.ring)meta.ring.rotation.z+=dt*(currentBattle.isBoss?-.35:.5);
    }
  }
  if(now-lastPromptUpdateAt>.1){
    lastPromptUpdateAt=now;
    if(interactables.length&&playerRoot&&game){const near=nearestInteractable(4.4),text=near?.name||'',prompt=$('nearPrompt');prompt.classList.toggle('hidden',!near||dialogueVisible||currentBattle||pendingChoice);if(text!==lastNearPromptText){if(near){prompt.textContent=`Parla / interagisci: ${text} · ${keyboardBindingLabel('interact')}`;prompt.setAttribute('aria-label',`Parla o interagisci: ${text}`);}lastNearPromptText=text;}}
  }
  if(titleDie&&game&&titleDie.isDisposed())titleDie=null;
}
function nearestInteractable(maxDist=4.4){if(!playerRoot)return null;let best=null,bd=maxDist;for(const item of interactables){if(!item.root||item.root.isDisposed())continue;const d=BABYLON.Vector3.Distance(playerRoot.position,item.root.position);if(d<bd){best=item;bd=d;}}return best;}
function toggleQuickHelp(open){
  const help=$('quickHelp'),show=typeof open==='boolean'?open:help.classList.contains('hidden');
  if(show===!help.classList.contains('hidden'))return;
  if(show){quickHelpWasInputLocked=inputLocked;inputLocked=true;help.classList.remove('hidden');$('quickHelpCloseBtn').focus();}
  else{help.classList.add('hidden');inputLocked=quickHelpWasInputLocked;$('quickHelpBtn').focus();}
}
function stepNeedsCombat(step){if(!step)return false;if(content?.redCrossStory)return step.exercise===true;if(step.combat===true||step.boss||step.miniboss)return true;const text=(String(step.objective||'')+' '+String(step.title||'')).toLowerCase();return /(sconfigg|affronta|combatt|abbatt|duella|boss|miniboss|frattura minore|regina abissale|architetto veyra|re senza corona|guardiano.*(sconfig|ferma)|ferma il.*(custode|re|guardiano|nemico)|uccidi)/i.test(text);}
function interact(){if(!game||inputLocked||currentBattle||pendingChoice)return;if(dialogueVisible){advanceDialogue();return;}const item=nearestInteractable(4.6);if(!item){toast('Avvicinati a una persona o al sigillo luminoso.');return;}if(item.kind==='house'){enterHouse(item);return;}if(item.kind==='houseExit'){leaveHouse();return;}if(item.kind==='flavor'){interactWithHouseFeature(item);return;}if(item.kind==='blacksmith'){openPanel('forge');return;}if(item.kind==='innkeeper'){openPanel('inn');return;}if(item.kind==='merchant'){openPanel('shop');return;}if(item.kind==='npc'){if(!dialogueFinished){advanceDialogue();}else toast(item.name+' non ha altro da aggiungere per ora.');return;}if(item.kind==='enemy'){startCombat();return;}if(item.kind==='goal'){if(game.suspendedBattle?.stepIndex===stepIndex){showBattleResumeOptions();return;}if(!dialogueFinished&&Array.isArray(currentStep.dialogue)&&currentStep.dialogue.length){advanceDialogue();return;}if(content?.redCrossStory){if(game.missionActivities?.[missionChapter()]?.complete)showQuestComplete();else openMissionActivity();return;}if(stepNeedsCombat(currentStep)&&!battleResolved){startCombat();return;}showQuestComplete();return;}if(item.kind==='sidequest'){completeSideQuest();}}
function interactWithHouseFeature(item){
  let text=item.text||'La casa conserva i segni di chi la abita.';
  if(item.discoveryId){
    game.player.flags=game.player.flags||{};
    const flag='worldDiscovery_'+item.discoveryId;
    if(game.player.flags[flag])text=`Hai già scoperto questo luogo.\n\n${text}`;
    else{
      game.player.flags[flag]=true;
      text=`Hai scoperto: ${item.name}.\n\n${text}`;
      toast(`Luogo scoperto: ${item.name}`);
      saveGame(false);
    }
  }
  if(item.gift){
    const gift=item.gift,claimed=game.player.flags[gift.flag]===true;
    if(claimed)text=item.claimedText||'Non è rimasto altro da raccogliere qui.';
    else if(gift.type==='gold'){
      const amount=Math.max(1,Math.floor(Number(gift.amount)||0));
      game.player.gold=(Number(game.player.gold)||0)+amount;game.player.flags[gift.flag]=true;
      text+=`\\n\\nHai trovato ${amount} monete d’oro.`;
      saveGame(false);toast(`Hai trovato ${amount} monete d’oro.`);
    }else if(gift.type==='consumable'){
      const quantity=Math.max(1,Math.floor(Number(gift.quantity)||1));
      game.player.flags[gift.flag]=true;
      if(!grantInventoryItem(gift.id,'consumable',quantity)){
        delete game.player.flags[gift.flag];
        console.error('Ricompensa domestica non valida:',gift.id);
        toast('Non è stato possibile raccogliere questo oggetto.');
      }else{
        const name=content.registries.CONSUMABLES[gift.id]?.name||humanize(gift.id);
        text+=`\\n\\nHai ricevuto ${quantity} ${name.toLowerCase()}.`;
        toast(`Hai ricevuto ${quantity} ${name.toLowerCase()}.`);
      }
    }
  }
  if(item.action==='recover'){
    const player=game.player,hpBefore=Number(player.hp||0),destinyBefore=Number(player.destiny||0);
    player.hp=player.maxHp;player.destiny=destinyCapacity(player);
    if(player.hp!==hpBefore||player.destiny!==destinyBefore){
      text+='\n\nIl personaggio ha recuperato energia e Destino nel gioco.';
      saveGame(false);updateHUD();toast('Recupero di gioco completato.');
    }else text+='\n\nIl personaggio è già al massimo dell’energia.';
  }else if(item.action==='uds-replay'){
    openMissionActivity(true,4);return;
  }else if(item.action==='distribution-replay'){
    openMissionActivity(true,3);return;
  }else if(item.action==='inventory'){
    openPanel('inventory');return;
  }
  showContextualDialogue(item.speaker,text);
}
function showContextualDialogue(speaker,text){
  contextualDialogue=true;dialogueVisible=true;
  $('dialogueSpeaker').textContent=redCrossPersonName(speaker||'Appunti');$('dialogueText').textContent=text||'La casa conserva i segni di chi la abita.';
  $('dialogueCount').textContent='Vita quotidiana';$('dialogueHint').textContent='Premi E o clicca continua';$('dialogueNext').textContent='Chiudi ↗';
  $('dialogueBox').classList.remove('hidden');$('questCompleteBar').classList.add('hidden');
}
function advanceDialogue(){
  if(contextualDialogue){contextualDialogue=false;dialogueVisible=false;$('dialogueBox').classList.add('hidden');return;}
  if(!currentStep)return;const lines=Array.isArray(currentStep.dialogue)?currentStep.dialogue:[];
  if(dialogueIndex>=lines.length){$('dialogueBox').classList.add('hidden');dialogueVisible=false;dialogueFinished=true;afterNarrative();return;}
  const raw=lines[dialogueIndex];const speaker=redCrossPersonName(Array.isArray(raw)?raw[0]:(raw.speaker||'Narratore'));const text=Array.isArray(raw)?raw[1]:(raw.text||raw.line||String(raw));
  $('dialogueSpeaker').textContent=speaker;$('dialogueText').textContent=text;$('dialogueCount').textContent=`${dialogueIndex+1} / ${lines.length}`;$('dialogueHint').textContent='Premi E o clicca continua';$('dialogueNext').textContent=dialogueIndex===lines.length-1?'Concludi dialogo ↗':'Continua ↗';
  dialogueIndex++;dialogueVisible=true;$('dialogueBox').classList.remove('hidden');$('questCompleteBar').classList.add('hidden');
}
function afterNarrative(){
  const choices=Array.isArray(currentStep?.choice)?currentStep.choice:(Array.isArray(currentStep?.choices)?currentStep.choices:[]);
  if(choices.length&&!game.choices[currentStep.id]){showChoices(choices);return;}
  if(stepNeedsCombat(currentStep)&&!battleResolved){$('questCompleteBar').classList.add('hidden');toast('Raggiungi il punto di esercitazione per proseguire.');return;}
  showQuestComplete();
}
function showChoices(choices){pendingChoice=true;$('choiceButtons').innerHTML='';$('choiceBox').classList.remove('hidden');$('questCompleteBar').classList.add('hidden');for(const key of choices){const effects=content.registries.CHOICE_EFFECTS?.[key];const label=effects?.text||humanize(key);const b=document.createElement('button');b.textContent=label;b.addEventListener('click',()=>selectChoice(key));$('choiceButtons').appendChild(b);}}
function selectChoice(key){
  const effect=content.registries.CHOICE_EFFECTS?.[key];game.choices[currentStep.id]=key;game.player.flags[key]=true;
  if(effect){for(const [f,v] of Object.entries(effect.reputation||{}))game.player.reputations[f]=(game.player.reputations[f]||0)+v;for(const [c,v] of Object.entries(effect.affinity||{}))game.player.affinity[c]=(game.player.affinity[c]||0)+v;Object.assign(game.player.flags,effect.flags||{});}
  pendingChoice=false;$('choiceBox').classList.add('hidden');toast('Scelta registrata: '+(effect?.text||humanize(key)));afterNarrative();saveGame(false);unlockClassesByRequirements();
}
const MISSION_GEAR=[
  {id:'checklist',name:'Lista del servizio',detail:'Indicazioni e recapiti del referente',bin:'coordination'},
  {id:'gloves',name:'Guanti da lavoro',detail:'Materiale di protezione previsto dal turno',bin:'materials'},
  {id:'water',name:'Acqua e bicchieri',detail:'Piccola dotazione di ristoro',bin:'welcome'},
  {id:'torch',name:'Torcia',detail:'Attrezzatura da controllare prima di uscire',bin:'materials'}
];
const MISSION_BINS=[['coordination','Tavolo di coordinamento'],['materials','Cassa materiali'],['welcome','Cassa accoglienza']];
const MISSION_CREW=[
  {task:'Controllo delle dotazioni',person:'Sara'},
  {task:'Accoglienza e ascolto',person:'Referente accoglienza'},
  {task:'Indicazioni del turno',person:'Angela'}
];
const MISSION_FOOD=[
  {name:'Pasta',detail:'Etichetta leggibile · quantità sul cartellino: 6',shelf:'dry',count:6},
  {name:'Passata di pomodoro',detail:'Etichetta leggibile · quantità sul cartellino: 4',shelf:'dry',count:4},
  {name:'Acqua',detail:'Etichetta leggibile · quantità sul cartellino: 8',shelf:'drinks',count:8},
  {name:'Succo di frutta',detail:'Etichetta leggibile · quantità sul cartellino: 5',shelf:'drinks',count:5},
  {name:'Confezione ammaccata',detail:'La scatola è aperta: chiedi al referente come registrarla.',shelf:'report',count:0},
  {name:'Etichetta rovinata',detail:'Non si leggono le informazioni: segnala il prodotto al referente.',shelf:'report',count:0}
];
const MISSION_PRODUCTS=[
  {id:'pasta',name:'Pasta'},{id:'legumi',name:'Legumi'},{id:'frutta',name:'Frutta'},
  {id:'riso',name:'Riso'},{id:'verdure',name:'Verdure'},{id:'alternativa',name:'Alimento alternativo concordato'}
];
const MISSION_PACKAGES=[
  {name:'Pacco per la famiglia A',need:['pasta','legumi','frutta'],note:'La richiesta indica pasta, legumi e frutta.'},
  {name:'Pacco per la famiglia B',need:['riso','verdure','alternativa'],note:'La famiglia ha chiesto un’alternativa al prodotto inizialmente previsto.'}
];
const MISSION_UDS=[
  {prompt:'Una persona si avvicina al punto informativo e chiede di conoscere i servizi del quartiere. Da dove cominci?',options:[
    {label:'Chiedo cosa le sarebbe utile sapere e ascolto senza fretta.',trust:2,feedback:'Hai lasciato alla persona la scelta di cosa condividere.'},
    {label:'Spiego con calma le informazioni verificate che abbiamo.',trust:1,feedback:'Hai offerto informazioni; puoi prima chiedere quale sia la priorità.'},
    {label:'Decido io quali informazioni servono e chiudo subito.',trust:0,feedback:'Prova a lasciare spazio alle priorità della persona.'}
  ]},
  {prompt:'La persona preferisce non raccontare dettagli personali. Come prosegue l’incontro?',options:[
    {label:'Rispetto la scelta e ricordo che può parlare con il referente quando vuole.',trust:2,feedback:'Hai rispettato riservatezza e tempi.'},
    {label:'Condivido solo le informazioni generali sui servizi.',trust:1,feedback:'Un’informazione generale può aiutare, mantenendo libertà di scelta.'},
    {label:'Insisto per avere più dettagli prima di ascoltare.',trust:0,feedback:'Non servono dettagli personali per offrire ascolto.'}
  ]},
  {prompt:'La persona chiede quale supporto sia disponibile. Qual è il passo più attento?',options:[
    {label:'Verifico con il referente e condivido solo indicazioni confermate.',trust:2,feedback:'Hai coinvolto la squadra e scelto informazioni affidabili.'},
    {label:'Ascolto la richiesta e cerco insieme il punto informativo.',trust:1,feedback:'Hai accompagnato la persona; il referente può confermare i prossimi passi.'},
    {label:'Prometto una soluzione senza averla verificata.',trust:0,feedback:'Meglio non promettere: confrontati con il referente.'}
  ]}
];
const MISSION_MEDICAL_TASKS=[
  {task:'Preparare il materiale non sanitario',person:'Sara'},
  {task:'Accogliere e condividere le informazioni',person:'Referente accoglienza'},
  {task:'Confermare le indicazioni del servizio',person:'Angela'}
];
const MISSION_ROUTE=['Comitato','Punto di accoglienza','Destinazione indicata dal referente'];
const MISSION_HANDOVER=[
  {text:'Il conteggio dei prodotti è stato registrato.',category:'service'},
  {text:'Due confezioni sono state segnalate al referente.',category:'followup'},
  {text:'I pacchi previsti sono stati consegnati.',category:'service'},
  {text:'La cassa materiali va ricontrollata nel prossimo turno.',category:'supplies'}
];
const MISSION_RETURN=[
  {name:'Pettorina di squadra',bin:'safety'},{name:'Torcia',bin:'equipment'},{name:'Cartelline',bin:'desk'}
];
const MISSION_RETURN_BINS=[['safety','Armadio dotazioni'],['equipment','Scaffale attrezzatura'],['desk','Cassetto del tavolo']];
const MISSION_REPLAY={active:false,chapter:0,state:null};
function missionChapter(){return Number(currentStep?.chapter_number||stepIndex+1);}
function missionDefinition(chapter){
  return [
    {chapter:1,title:'Preparare il turno',intro:'Prepara le dotazioni e assegna i compiti: puoi selezionare un oggetto e poi toccare la cassa corretta.',coords:[19,13],station:'Magazzino · tavolo di preparazione'},
    {chapter:2,title:'Eccedenze e scarico AGEA',intro:'Registra ogni lotto: controlla le etichette, conta e scegli lo scaffale oppure chiedi al referente.',coords:[24,17],station:'Magazzino · registro lotti'},
    {chapter:3,title:'Preparare e distribuire i viveri',intro:'Componi i pacchi richiesti, verifica il contenuto e scegli come rispondere a una richiesta.',coords:[2,25],station:'Punto di distribuzione'},
    {chapter:4,title:'Unità di Strada · ascolto',intro:'Leggi la situazione e scegli come ascoltare. Non chiedere dettagli personali: puoi confrontarti con il referente.',coords:[-14,11],station:'Punto di ascolto'},
    {chapter:5,title:'Accoglienza e trasporto simulato',intro:'Assegna i compiti e segui il percorso indicato dal referente. Non si svolgono manovre né valutazioni sanitarie.',coords:[17,-9],station:'Punto di coordinamento del servizio'},
    {chapter:6,title:'Passaggio di consegne',intro:'Organizza le informazioni del turno e rimetti le dotazioni nelle postazioni corrette.',coords:[0,-14],station:'Comitato · tavolo consegne'}
  ].find(definition=>definition.chapter===Number(chapter));
}
function missionRole(){return String(game?.player?.playerClass||'');}
function missionRoleNote(chapter){
  const role=missionRole();
  const notes={
    'Logista':{1:'Il tuo ruolo ti aiuta a leggere l’inventario e scegliere le casse.',2:'Il tuo ruolo ti aiuta a confrontare conteggi e scaffali.',6:'Il tuo ruolo ti aiuta a controllare le postazioni delle dotazioni.'},
    'Operatore sociale':{3:'Il tuo ruolo ti aiuta a raccogliere con rispetto le preferenze prima di preparare un pacco.',4:'Il tuo ruolo valorizza ascolto, riservatezza e orientamento con il referente.'},
    'Soccorritore':{5:'Il tuo ruolo contribuisce all’accoglienza; gli aspetti sanitari restano al personale formato e autorizzato.'},
    'Volontario di Protezione Civile':{1:'Il tuo ruolo aiuta a preparare dotazioni e organizzare la squadra.',5:'Il tuo ruolo aiuta a seguire le indicazioni e coordinare un percorso simulato.'}
  };
  return notes[role]?.[chapter]||'Segui le indicazioni del referente e collabora entro il ruolo assegnato.';
}
function missionState(){
  if(MISSION_REPLAY.active)return MISSION_REPLAY.state;
  const chapter=missionChapter();
  game.missionActivities=game.missionActivities||{};
  if(!game.missionActivities[chapter])game.missionActivities[chapter]={errors:0,attention:0,collaboration:0};
  return game.missionActivities[chapter];
}
function missionButton(label,action,index=-1,value=''){
  return `<button type="button" class="mission-button" data-mission-action="${action}" data-index="${index}" data-value="${escapeHtml(value)}">${escapeHtml(label)}</button>`;
}
function missionSelect(task,options,value){
  return `<label class="mission-assignment"><strong>${escapeHtml(task)}</strong><select class="mission-select" data-mission-select="${escapeHtml(task)}"><option value="">Scegli una persona</option>${options.map(option=>`<option value="${escapeHtml(option)}"${value===option?' selected':''}>${escapeHtml(option)}</option>`).join('')}</select></label>`;
}
function missionHint(chapter,state){
  if(state.hintUsed)return 'Il suggerimento del tuo ruolo è già stato usato in questa tappa.';
  state.hintUsed=true;
  const role=missionRole();
  const roleHints={
    1:{'Logista':'Il Logista aiuta a controllare le dotazioni: torcia e guanti vanno nella cassa materiali.','Volontario di Protezione Civile':'Prepara prima le dotazioni e poi conferma i compiti con il coordinamento.'},
    2:{'Logista':'Confronta etichette e conteggi; le confezioni da segnalare non occupano spazio sugli scaffali.'},
    3:{'Operatore sociale':'Ascoltare la richiesta prima di scegliere un’alternativa aiuta a preparare un pacco adatto.'},
    4:{'Operatore sociale':'Lascia che la persona scelga cosa raccontare; per indicazioni specifiche confrontati con il referente.'},
    5:{'Soccorritore':'Il gioco si limita all’accoglienza e all’organizzazione: per gli aspetti sanitari decide il personale autorizzato.','Volontario di Protezione Civile':'Segui l’itinerario ricevuto dal referente; non serve improvvisare deviazioni.'},
    6:{'Logista':'Ogni oggetto torna a una postazione precisa; le informazioni utili al prossimo turno vanno nel rapporto.'}
  };
  const specific=roleHints[chapter]?.[role];
  if(specific)state.roleBonus=true;
  return specific||({
    1:'La lista indica una cassa per coordinamento, una per le dotazioni e una per l’accoglienza.',
    2:'Un’etichetta rovinata o una confezione aperta va segnalata al referente, non inserita in uno scaffale.',
    3:'Confronta ogni pacco con la richiesta e verifica il contenuto prima della consegna.',
    4:'Ascolta senza giudicare; chiedi il permesso prima di offrire informazioni o coinvolgere la squadra.',
    5:'Prima le informazioni e i ruoli; poi segui i tre punti nell’ordine fornito dal referente.',
    6:'Il rapporto distingue attività svolte, segnalazioni e materiali da ricontrollare.'
  })[chapter];
}
function openMissionActivity(replay=false,chapter=missionChapter()){
  if(!game||!content?.redCrossStory)return;
  const definition=missionDefinition(chapter);if(!definition)return;
  if(replay){
    MISSION_REPLAY.active=true;MISSION_REPLAY.chapter=chapter;MISSION_REPLAY.state={errors:0,attention:0,collaboration:0,replay:true};
  }else{
    MISSION_REPLAY.active=false;MISSION_REPLAY.chapter=0;MISSION_REPLAY.state=null;
  }
  const previous=game.missionActivities?.[chapter];
  if(!replay&&previous?.complete){showQuestComplete();return;}
  $('missionKicker').textContent=`TAPPA ${chapter} · ${definition.station}`;
  $('missionTitle').textContent=definition.title;
  $('missionIntro').textContent=`${definition.intro} ${missionRoleNote(chapter)}`;
  $('missionOverlay').classList.remove('hidden');
  $('questCompleteBar').classList.add('hidden');
  inputLocked=true;
  renderMissionActivity();
}
function closeMissionActivity(){
  if($('missionOverlay').classList.contains('hidden'))return;
  $('missionOverlay').classList.add('hidden');inputLocked=false;
  if(MISSION_REPLAY.active){
    MISSION_REPLAY.active=false;MISSION_REPLAY.state=null;
    if(game)openPanel('journal');
  }else if(game){
    if(!game.missionActivities?.[missionChapter()]?.complete)saveGame(false);
    showQuestComplete();
  }
}
function missionAssignmentsMarkup(tasks,state,expected){
  const options=expected.map(item=>item.person);
  return `<div class="mission-assignment-list">${tasks.map(item=>missionSelect(item.task,options,state.assignments?.[item.task])).join('')}</div>`;
}
function renderMissionActivity(){
  if($('missionOverlay').classList.contains('hidden'))return;
  const chapter=MISSION_REPLAY.active?MISSION_REPLAY.chapter:missionChapter(),state=missionState();
  if(state.complete&&!MISSION_REPLAY.active){renderMissionSummary(state);return;}
  $('missionFeedback').textContent=state.feedback||'';
  const body=$('missionBody');
  if(chapter===1)body.innerHTML=renderKitMission(state);
  else if(chapter===2)body.innerHTML=renderFoodMission(state);
  else if(chapter===3)body.innerHTML=renderDistributionMission(state);
  else if(chapter===4)body.innerHTML=renderUdsMission(state);
  else if(chapter===5)body.innerHTML=renderTransportMission(state);
  else if(chapter===6)body.innerHTML=renderHandoverMission(state);
  body.querySelector('button:not(:disabled),select')?.focus();
}
function renderKitMission(state){
  state.placed=state.placed||{};state.assignments=state.assignments||{};
  const selected=MISSION_GEAR.find(item=>item.id===state.selected),placedCount=Object.keys(state.placed).length;
  return `<div class="mission-progress"><span>Materiali · ${placedCount}/${MISSION_GEAR.length}</span><span>Compiti · ${Object.keys(state.assignments).length}/${MISSION_CREW.length}</span></div>
    <h3 class="mission-section-title">1. Sistema il materiale</h3><div class="mission-grid">${MISSION_GEAR.map(item=>`<button type="button" class="mission-card-item${state.selected===item.id?' selected':''}${state.placed[item.id]===item.bin?' correct':''}" data-mission-action="select-gear" data-value="${item.id}"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.detail)}</small><small>${state.placed[item.id]?`Sistemato: ${escapeHtml(MISSION_BINS.find(bin=>bin[0]===state.placed[item.id])?.[1]||'')}`:'Tocca per selezionare'}</small></button>`).join('')}</div>
    ${selected?`<p class="mission-instruction">In quale contenitore metti <strong>${escapeHtml(selected.name)}</strong>?</p><div class="mission-actions">${MISSION_BINS.map(bin=>missionButton(bin[1],'place-gear',-1,bin[0])).join('')}</div>`:''}
    <h3 class="mission-section-title">2. Affida i compiti</h3><p class="mission-instruction">Abbina ciascun compito al membro della squadra indicato dal suo ruolo.</p>
    ${missionAssignmentsMarkup(MISSION_CREW,state,MISSION_CREW)}
    <div class="mission-actions">${missionButton('Controlla la preparazione','check-kit')}${missionButton('Suggerimento del ruolo','hint',-1,'',)}</div>`;
}
function renderFoodMission(state){
  const index=Math.min(Number(state.itemIndex||0),MISSION_FOOD.length-1),item=MISSION_FOOD[index];
  if(!item)return '';
  state.shelfChoice=state.shelfChoice||'';
  const count=Number(state.currentCount??(item.shelf==='report'?0:1));
  const choices=[['dry','Scaffale prodotti secchi'],['drinks','Scaffale bevande'],['report','Segnala al referente']];
  return `<div class="mission-progress"><span>Lotto ${index+1}/${MISSION_FOOD.length}</span><span>Conteggi registrati: ${state.records?.length||0}</span></div>
    <article class="mission-card-item selected"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.detail)}</small></article>
    <p class="mission-instruction">Scegli la destinazione e registra la quantità indicata. Non collocare prodotti danneggiati: segnalali al referente.</p>
    <div class="mission-grid">${choices.map(([id,label])=>`<button type="button" class="mission-card-item${state.shelfChoice===id?' selected':''}" data-mission-action="choose-shelf" data-value="${id}"><strong>${label}</strong></button>`).join('')}</div>
    ${item.shelf!=='report'?`<div class="mission-stepper"><button type="button" aria-label="Diminuisci quantità" data-mission-action="count-down">−</button><strong>${count}</strong><button type="button" aria-label="Aumenta quantità" data-mission-action="count-up">+</button><span>unità</span></div>`:'<p class="mission-note">Il conteggio non è verificabile: scegli “Segnala al referente”.</p>'}
    <div class="mission-actions">${missionButton('Registra lotto','record-food')}${missionButton('Suggerimento del ruolo','hint',-1,'')}</div>`;
}
function renderDistributionMission(state){
  const index=Number(state.packageIndex||0);
  if(index<MISSION_PACKAGES.length){
    const pack=MISSION_PACKAGES[index],selected=new Set(state.selectedProducts||[]);
    return `<div class="mission-progress"><span>Pacco ${index+1}/${MISSION_PACKAGES.length}</span><span>Consegne: ${state.delivered||0}/${MISSION_PACKAGES.length}</span></div>
      <h3 class="mission-section-title">${escapeHtml(pack.name)}</h3><p class="mission-note">${escapeHtml(pack.note)}</p>
      <p class="mission-instruction">Tocca i prodotti richiesti per aggiungerli al pacco. Poi controlla il contenuto.</p>
      <div class="mission-grid">${MISSION_PRODUCTS.map(item=>`<button type="button" class="mission-card-item${selected.has(item.id)?' selected':''}" data-mission-action="toggle-product" data-value="${item.id}"><strong>${escapeHtml(item.name)}</strong><small>${selected.has(item.id)?'Nel pacco':'Aggiungi al pacco'}</small></button>`).join('')}</div>
      <div class="mission-actions">${missionButton('Controlla e consegna','check-package')}${missionButton('Suggerimento del ruolo','hint',-1,'')}</div>`;
  }
  return `<h3 class="mission-section-title">Una richiesta da ascoltare</h3><p class="mission-note">Prima della consegna, una persona chiede un’alternativa a un prodotto previsto. Come procedi?</p>
    <div class="mission-actions mission-choice-list">
      ${missionButton('Ascolto, verifico le alternative con la persona e con il referente.','distribution-choice',-1,'ask')}
      ${missionButton('Scelgo io una sostituzione senza chiedere.','distribution-choice',-1,'replace')}
      ${missionButton('Consegno il pacco com’è, senza parlarne.','distribution-choice',-1,'ignore')}
    </div>`;
}
function renderUdsMission(state){
  const index=Number(state.dialogueIndex||0),situation=MISSION_UDS[index];
  if(!situation)return `<div class="mission-progress"><span>Incontri ascoltati · ${MISSION_UDS.length}/${MISSION_UDS.length}</span><span>Fiducia · ${state.trust||0}/6</span></div><p class="mission-note">Hai ascoltato, rispettato i tempi e condiviso le richieste con la squadra.</p>${missionButton('Concludi il confronto','finish-uds')}`;
  return `<div class="mission-progress"><span>Incontro ${index+1}/${MISSION_UDS.length}</span><span>Fiducia · ${state.trust||0}/6</span></div>
    <p class="mission-note">Persona del quartiere · Non occorre raccogliere dati personali.</p><h3 class="mission-section-title">${escapeHtml(situation.prompt)}</h3>
    ${situation.options.map((option,i)=>`<button type="button" class="mission-choice" data-mission-action="uds-choice" data-index="${i}">${escapeHtml(option.label)}</button>`).join('')}
    ${missionButton('Suggerimento del ruolo','hint',-1,'')}`;
}
function renderTransportMission(state){
  state.assignments=state.assignments||{};state.route=state.route||[];
  const route=state.route,done=route.length>=MISSION_ROUTE.length;
  return `<div class="mission-progress"><span>Preparazione e accoglienza</span><span>Percorso · ${route.length}/${MISSION_ROUTE.length}</span></div>
    <h3 class="mission-section-title">1. Coordina i compiti</h3><p class="mission-instruction">Un servizio ha bisogno di squadra e ruoli chiari. Il personale formato e autorizzato gestisce ogni aspetto sanitario.</p>
    ${missionAssignmentsMarkup(MISSION_MEDICAL_TASKS,state,MISSION_MEDICAL_TASKS)}
    <h3 class="mission-section-title">2. Segui il percorso del referente</h3><p class="mission-instruction">Tocca i punti sulla mappa nell’ordine indicato. È una pianificazione di gioco, non una scelta clinica o di emergenza.</p>
    <div class="mission-map">${MISSION_ROUTE.map((stop,index)=>`<div class="mission-stop${route.includes(stop)?' visited':''}${!done&&route.length===index?' current':''}">${index+1}. ${escapeHtml(stop)}</div>`).join('')}</div>
    ${!done?`<div class="mission-grid">${MISSION_ROUTE.filter(stop=>!route.includes(stop)).map(stop=>`<button type="button" class="mission-card-item" data-mission-action="route-stop" data-value="${escapeHtml(stop)}"><strong>${escapeHtml(stop)}</strong><small>Aggiungi al percorso</small></button>`).join('')}</div>`:''}
    <div class="mission-actions">${missionButton('Suggerimento del ruolo','hint',-1,'')}${done?missionButton('Verifica il coordinamento','check-transport'):''}</div>`;
}
function renderHandoverMission(state){
  state.report=state.report||{};state.returned=state.returned||{};
  if(state.phase!=='return'){
    const index=Number(state.reportIndex||0),note=MISSION_HANDOVER[index];
    if(!note)return `<h3 class="mission-section-title">Riorganizza le dotazioni</h3><p class="mission-instruction">Associa ogni materiale alla sua postazione prima del prossimo turno.</p>${renderReturnChoices(state)}`;
    const categories=[['service','Attività svolte'],['followup','Da verificare col referente'],['supplies','Scorte e materiali']];
    return `<div class="mission-progress"><span>Rapporto di consegne</span><span>${index+1}/${MISSION_HANDOVER.length}</span></div>
      <article class="mission-card-item selected"><strong>Informazione da inserire</strong><small>${escapeHtml(note.text)}</small></article>
      <p class="mission-instruction">In quale sezione la riporti?</p><div class="mission-grid">${categories.map(([id,label])=>missionButton(label,'report-note',-1,id)).join('')}</div>
      ${missionButton('Suggerimento del ruolo','hint',-1,'')}`;
  }
  return `<h3 class="mission-section-title">Riorganizza le dotazioni</h3><p class="mission-instruction">Associa ogni materiale alla sua postazione prima del prossimo turno.</p>${renderReturnChoices(state)}`;
}
function renderReturnChoices(state){
  return `<div class="mission-grid">${MISSION_RETURN.map((item,index)=>`<article class="mission-card-item${state.returned[item.name]?' correct':''}"><strong>${escapeHtml(item.name)}</strong><small>${state.returned[item.name]?`Riposto: ${escapeHtml(MISSION_RETURN_BINS.find(bin=>bin[0]===state.returned[item.name])?.[1]||'')}`:'Scegli la postazione'}</small>${MISSION_RETURN_BINS.map(bin=>`<button type="button" class="mission-button secondary" data-mission-action="return-item" data-index="${index}" data-value="${bin[0]}">${bin[1]}</button>`).join('')}</article>`).join('')}</div>
  ${missionButton('Controlla il passaggio di consegne','check-handover')}`;
}
function missionRegisterError(state,message){
  state.errors=Number(state.errors||0)+1;state.feedback=message;saveMissionState();renderMissionActivity();
}
function saveMissionState(){
  if(!game||MISSION_REPLAY.active)return;
  saveGame(false);mpSendMissionProgress(missionChapter(),game.missionActivities?.[missionChapter()]);
}
function missionAssignmentsCorrect(state,tasks){
  return tasks.every(task=>state.assignments?.[task.task]===task.person)&&new Set(tasks.map(task=>state.assignments?.[task.task])).size===tasks.length;
}
function finishMissionActivity(state){
  const chapter=MISSION_REPLAY.active?MISSION_REPLAY.chapter:missionChapter();
  state.complete=true;
  state.result={
    precision:clamp(3-Math.min(2,Number(state.errors||0)),1,3),
    attention:clamp(1+Number(state.attention||0)+(state.roleBonus?1:0),1,3),
    collaboration:clamp(1+Number(state.collaboration||0)+(state.roleBonus?1:0),1,3)
  };
  if(MISSION_REPLAY.active){state.feedback='Ripetizione completata: il risultato non modifica la cronaca.';renderMissionSummary(state);return;}
  const badges=game.earnedActivityBadges||(game.earnedActivityBadges=[]);
  for(const [key,label] of [['precision','Occhio attento'],['attention','Ascolto e cura'],['collaboration','Forza di squadra']]){
    const id=`${chapter}:${key}`;
    if(state.result[key]===3&&!badges.some(badge=>badge.id===id))badges.push({id,title:label,chapter});
  }
  if(chapter===4)game.communityTrust=Number(game.communityTrust||0)+Number(state.trust||0);
  saveGame(false);mpSendMissionProgress(chapter,state);renderMissionSummary(state);
}
function renderMissionSummary(state){
  const result=state.result||{precision:1,attention:1,collaboration:1};
  const replay=MISSION_REPLAY.active;
  $('missionFeedback').textContent='';
  $('missionBody').innerHTML=`<div class="mission-progress"><span>${replay?'Attività ripetuta':'Attività completata'}</span><span>${state.errors?`Tentativi: ${state.errors}`:'Nessun errore al primo controllo!'}</span></div>
    <p class="mission-note">${state.summary||'Hai partecipato al turno con attenzione. Ogni prova si può rifare: l’obiettivo è imparare insieme, non essere perfetti.'}</p>
    <div class="mission-score-grid"><div class="mission-score"><strong>Precisione</strong><span>${result.precision}/3</span></div><div class="mission-score"><strong>Attenzione</strong><span>${result.attention}/3</span></div><div class="mission-score"><strong>Collaborazione</strong><span>${result.collaboration}/3</span></div></div>
    ${state.result?.precision===3||state.result?.attention===3||state.result?.collaboration===3?'<p class="mission-note">Hai ottenuto un distintivo facoltativo: cercalo nell’Album del Diario.</p>':''}
    <div class="mission-actions">${missionButton(replay?'Torna al Diario':'Torna alla tappa','finish-activity')}</div>`;
}
function handleMissionAction(button){
  const chapter=MISSION_REPLAY.active?MISSION_REPLAY.chapter:missionChapter(),state=missionState(),action=button.dataset.missionAction,index=Number(button.dataset.index||0),value=button.dataset.value||'';
  state.feedback='';
  if(action==='hint'){state.feedback=missionHint(chapter,state);saveMissionState();renderMissionActivity();return;}
  if(action==='select-gear'){state.selected=value;saveMissionState();renderMissionActivity();return;}
  if(action==='place-gear'){
    const item=MISSION_GEAR.find(gear=>gear.id===state.selected);if(!item)return;
    if(item.bin===value){state.placed=state.placed||{};state.placed[item.id]=value;state.feedback=`${item.name}: sistemato nel contenitore corretto.`;state.attention=Math.max(Number(state.attention||0),1);}
    else{missionRegisterError(state,'Contenitore non adatto: controlla la lista e prova di nuovo.');return;}
    state.selected='';saveMissionState();renderMissionActivity();return;
  }
  if(action==='choose-shelf'){state.shelfChoice=value;saveMissionState();renderMissionActivity();return;}
  if(action==='count-up'||action==='count-down'){
    const item=MISSION_FOOD[Number(state.itemIndex||0)];if(!item||item.shelf==='report')return;
    const current=Number(state.currentCount??1);state.currentCount=clamp(current+(action==='count-up'?1:-1),0,20);saveMissionState();renderMissionActivity();return;
  }
  if(action==='record-food'){
    const item=MISSION_FOOD[Number(state.itemIndex||0)];if(!item)return;
    const correct=state.shelfChoice===item.shelf&&Number(state.currentCount??(item.shelf==='report'?0:1))===item.count;
    if(!correct){missionRegisterError(state,'Ricontrolla etichetta, quantità e destinazione; puoi correggere senza perdere il lotto.');return;}
    state.records=state.records||[];state.records.push({name:item.name,count:item.count,shelf:item.shelf});state.feedback=item.shelf==='report'?'Segnalazione annotata per il referente.':'Lotto contato e registrato.';
    state.attention=Math.min(2,Number(state.attention||0)+1);
    state.itemIndex=Number(state.itemIndex||0)+1;state.currentCount=null;state.shelfChoice='';saveMissionState();
    if(state.itemIndex>=MISSION_FOOD.length){state.collaboration=1;state.summary='Hai contato i lotti, rispettato lo spazio sugli scaffali e segnalato le confezioni da verificare al referente.';finishMissionActivity(state);}else renderMissionActivity();
    return;
  }
  if(action==='toggle-product'){
    const selected=new Set(state.selectedProducts||[]);if(selected.has(value))selected.delete(value);else selected.add(value);state.selectedProducts=[...selected];saveMissionState();renderMissionActivity();return;
  }
  if(action==='check-package'){
    const pack=MISSION_PACKAGES[Number(state.packageIndex||0)],selected=(state.selectedProducts||[]).slice().sort(),needed=pack.need.slice().sort();
    if(selected.length!==needed.length||selected.some((product,i)=>product!==needed[i])){missionRegisterError(state,'Confronta la lista con il pacco e correggi i prodotti prima della consegna.');return;}
    state.delivered=Number(state.delivered||0)+1;state.packageIndex=Number(state.packageIndex||0)+1;state.selectedProducts=[];state.feedback='Pacco verificato e affidato alla squadra.';state.attention=Math.min(2,Number(state.attention||0)+1);saveMissionState();renderMissionActivity();return;
  }
  if(action==='distribution-choice'){
    state.attention=value==='ask'?2:value==='replace'?0:0;
    state.collaboration=value==='ask'?1:0;
    state.summary=value==='ask'?'Hai ascoltato la richiesta e concordato con la squadra prima di modificare il pacco.':value==='replace'?'Hai provato a risolvere subito; la prossima volta puoi chiedere prima alla persona e al referente.':'Hai consegnato il pacco senza chiarire la richiesta; ascoltare permette di rispettare meglio le preferenze.';
    finishMissionActivity(state);return;
  }
  if(action==='uds-choice'){
    const option=MISSION_UDS[Number(state.dialogueIndex||0)]?.options[index];if(!option)return;
    state.trust=Number(state.trust||0)+option.trust;state.attention=clamp(Math.floor(Number(state.trust||0)/3),0,2);state.feedback=option.feedback;
    state.dialogueIndex=Number(state.dialogueIndex||0)+1;state.collaboration=state.dialogueIndex>=2?1:0;saveMissionState();renderMissionActivity();return;
  }
  if(action==='finish-uds'){
    state.summary=`La fiducia costruita nel gioco è ${Number(state.trust||0)}/6. Le richieste restano affidate alla squadra e ai referenti competenti.`;finishMissionActivity(state);return;
  }
  if(action==='route-stop'){
    const next=MISSION_ROUTE[(state.route||[]).length];if(value!==next){missionRegisterError(state,'Il referente indica un ordine diverso. Controlla le tappe e riprova.');return;}
    state.route=state.route||[];state.route.push(value);state.feedback=`Tappa ${state.route.length} aggiunta seguendo le indicazioni.`;saveMissionState();renderMissionActivity();return;
  }
  if(action==='check-transport'){
    if(!missionAssignmentsCorrect(state,MISSION_MEDICAL_TASKS)){missionRegisterError(state,'Controlla gli incarichi: ogni compito va assegnato alla persona con il ruolo adatto.');return;}
    state.attention=1;state.collaboration=2;state.summary='Hai assegnato i compiti e seguito la destinazione indicata dal referente. Gli aspetti sanitari restano al personale formato e autorizzato.';finishMissionActivity(state);return;
  }
  if(action==='report-note'){
    const note=MISSION_HANDOVER[Number(state.reportIndex||0)];if(!note)return;
    if(value!==note.category){missionRegisterError(state,'Questa informazione va in un’altra sezione. Rileggi la nota e scegli di nuovo.');return;}
    state.report=state.report||{};state.report[note.text]=value;state.reportIndex=Number(state.reportIndex||0)+1;state.attention=Math.min(2,Number(state.attention||0)+1);state.feedback='Nota inserita nel rapporto.';
    if(state.reportIndex>=MISSION_HANDOVER.length)state.phase='return';
    saveMissionState();renderMissionActivity();return;
  }
  if(action==='return-item'){
    const item=MISSION_RETURN[index];if(!item)return;
    if(value!==item.bin){missionRegisterError(state,'Quella postazione non corrisponde: controlla l’etichetta e riprova.');return;}
    state.returned=state.returned||{};state.returned[item.name]=value;state.feedback='Materiale riposto nella sua postazione.';state.attention=Math.min(2,Number(state.attention||0)+1);saveMissionState();renderMissionActivity();return;
  }
  if(action==='check-handover'){
    if(!MISSION_RETURN.every(item=>state.returned?.[item.name]===item.bin)){missionRegisterError(state,'Manca ancora una dotazione o una postazione non è corretta.');return;}
    state.collaboration=2;state.summary='Hai organizzato il rapporto, segnalato ciò che va ricontrollato e preparato le dotazioni per il prossimo turno.';finishMissionActivity(state);return;
  }
  if(action==='check-kit'){
    if(MISSION_GEAR.some(item=>state.placed?.[item.id]!==item.bin)){missionRegisterError(state,'C’è ancora materiale da sistemare o una cassa da correggere.');return;}
    if(!missionAssignmentsCorrect(state,MISSION_CREW)){missionRegisterError(state,'Completa gli incarichi con la persona più adatta a ciascun compito.');return;}
    state.attention=2;state.collaboration=2;state.summary='Hai sistemato il materiale e organizzato la squadra prima della partenza.';finishMissionActivity(state);return;
  }
  if(action==='finish-activity'){
    if(MISSION_REPLAY.active){closeMissionActivity();return;}
    $('missionOverlay').classList.add('hidden');inputLocked=false;showQuestComplete();return;
  }
}
function handleMissionSelect(select){
  if(!game)return;
  const state=missionState();state.assignments=state.assignments||{};state.assignments[select.dataset.missionSelect]=select.value;state.feedback='';
  saveMissionState();
}
function showQuestComplete(){
  if(content?.redCrossStory){
    const done=!!game?.missionActivities?.[missionChapter()]?.complete;
    $('questCompleteBar').querySelector('span').textContent=done?'Attività completata. Rivedi il risultato o prosegui alla tappa successiva.':'Il dialogo è solo l’inizio: prepara la squadra con l’attività interattiva.';
    $('completeStepBtn').textContent=done?'Concludi tappa':'Inizia l’attività';
  }
  $('questCompleteBar').classList.remove('hidden');$('nearPrompt').classList.add('hidden');
}
function humanize(s){return String(s||'').replace(/[_-]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase());}
function completeStep(){
  if(!game||!currentStep)return;
  if(content?.redCrossStory&&!game.missionActivities?.[missionChapter()]?.complete){openMissionActivity();return;}
  const s=currentStep;game.completedSteps=game.completedSteps||[];if(s.id&&!game.completedSteps.includes(s.id))game.completedSteps.push(s.id);if(s.award)game.player.flags[s.award]=true;
  const badge=route[stepIndex],earnedBadges=game.earnedBadges||(game.earnedBadges=[]);
  const badgeEarned=!!badge&&!earnedBadges.includes(badge.chapter_number);
  if(badgeEarned)earnedBadges.push(badge.chapter_number);
  const rewardMultiplier=difficultySettings().rewards,chapterProgress=stepIndex+1;game.player.xp+=Math.round((22+chapterProgress*4)*rewardMultiplier);game.player.gold+=Math.round((5+chapterProgress*2)*rewardMultiplier);const nextChapter=route[stepIndex+1]?.chapter_number;
  let levelMessage='';
  if(nextChapter&&nextChapter!==s.chapter_number){const previousLevel=Number(game.player.level||1),accountedLevel=Number(game.player.skillPointsThroughLevel||previousLevel),target=Math.min(60,Math.floor((stepIndex+2)*2.5));if(target>previousLevel){game.player.level=target;const points=Math.max(0,Math.floor(target/5)-Math.floor(accountedLevel/5));game.player.skillPointsThroughLevel=target;if(points>0)game.player.skillPoints=(Number(game.player.skillPoints)||0)+points;levelMessage=points>0?`Livello ${target}: +${points} ${points===1?'punto talento':'punti talento'}.`:`Livello raggiunto: ${target}.`;}if(nextChapter>=3)game.player.flags.dieSymbolsRevealed=true;recalculateEquipmentStats(game.player);game.player.hp=Math.min(game.player.maxHp,game.player.hp+Math.round(game.player.maxHp*.25));}
  $('questCompleteBar').classList.add('hidden');$('dialogueBox').classList.add('hidden');$('choiceBox').classList.add('hidden');$('combatBox').classList.add('hidden');dialogueVisible=false;dialogueFinished=false;pendingChoice=false;currentBattle=null;battleResolved=false;stepIndex++;
  if(stepIndex>=route.length){if(badgeEarned)toast(`Distintivo raccolto: ${badge.title}.`);game.endingReached=true;saveGame(false);showEnding();return;}
  // Chapter VI chooses the variant based on the reputation/shadow path established by prior decisions.
  if(!content.redCrossStory&&route[stepIndex]?.chapter_number===6&&route[stepIndex-1]?.chapter_number===5)selectChapter6Variant();
  if(badgeEarned)toast(`Distintivo raccolto: ${badge.title}.${levelMessage?` ${levelMessage}`:''}`);
  else if(levelMessage)toast(levelMessage);
  game.stepIndex=stepIndex;saveGame(false);startStep(true);
}
function selectChapter6Variant(){
  const avg=averageRep();const shadows=(game.player.shadows||[]).length;const loyal=(game.player.companions||[]).length;let variant='respected';if(shadows>=6&&shadows>=loyal+2)variant='shadow';else if(avg<0)variant='wanted';
  const replacement=(content.chapter6_variants?.[variant]||[]).map(s=>({...s,chapter_number:6,source_module:'chapter6',route_variant:variant,scene:s.scene||'aether_gate',dialogue:s.dialogue||[]}));
  route=route.filter(s=>s.chapter_number!==6);const idx=route.findIndex(s=>s.chapter_number>6);if(idx<0)route.push(...replacement);else route.splice(idx,0,...replacement);game.chapter6Variant=variant;
  // Preserve the step after Chapter V as the entry point into the chosen route.
  stepIndex=route.findIndex(s=>s.chapter_number===6);if(stepIndex<0)stepIndex=route.findIndex(s=>s.chapter_number>5);
  toast('Il tuo percorso nella cronaca sarà: '+({respected:'dialogo e fiducia',wanted:'ricostruire la fiducia',shadow:'coordinamento di squadra'}[variant]));
}
function showEnding(){currentStep=null;game=null;titleDie=null;inputLocked=true;$('chapterCurtain').classList.remove('hidden');$('curtainArc').textContent='CROCE ROSSA';$('curtainTitle').textContent='6 TAPPE · UNA SQUADRA';$('curtainSubtitle').textContent='Il prossimo turno comincia insieme.';setTimeout(()=>{ $('chapterCurtain').classList.add('hidden');$('dialogueBox').classList.remove('hidden');$('dialogueSpeaker').textContent=redCrossPersonName('Coordinatrice/Coordinatore');$('dialogueText').textContent='Hai concluso tutte le tappe e raccolto i distintivi! Le attività della Croce Rossa continuano ogni giorno nelle comunità. Quelle reali richiedono formazione, autorizzazione e indicazioni del Comitato.';$('dialogueCount').textContent='FINE DEL TURNO';$('dialogueHint').textContent='Bravissima/o!';$('dialogueNext').textContent='Torna al titolo';inputLocked=false;},1800);}
function startStep(showCurtain=false){
  currentStep=currentRouteStep();if(!currentStep){showEnding();return;}game.player.flags=game.player.flags||{};game.stepIndex=stepIndex;dialogueIndex=0;dialogueVisible=false;dialogueFinished=false;contextualDialogue=false;pendingChoice=false;battleResolved=false;currentBattle=null;currentSideQuest=null;
  if(Number(currentStep.chapter_number||1)>=3)game.player.flags.dieSymbolsRevealed=true;
  $('hubToggleBtn').innerHTML=hubMode?'↩ <span>Torna alla cronaca</span>':content?.redCrossStory?'⌂ <span>Comitato</span>':'⌂ <span>Rifugio</span>';
  $('dialogueBox').classList.add('hidden');$('choiceBox').classList.add('hidden');$('combatBox').classList.add('hidden');$('questCompleteBar').classList.add('hidden');$('objectiveText').textContent=currentStep.objective||currentStep.title||'Esplora l’area';
  $('hudName').textContent=game.player.name;$('hudClass').textContent=`${game.player.playerClass} · Lv ${game.player.level}`;$('hudArc').textContent=String(currentStep.chapter_arc||'Turni di volontariato').toUpperCase();$('hudChapter').textContent='TAPPA '+(stepIndex+1);$('hudStep').textContent=currentStep.title||'';updateHUD();
  updateLocalMapHeading();
  buildWorld(currentStep);
  if(showCurtain){inputLocked=true;$('curtainArc').textContent=String(currentStep.chapter_arc||'Turni di volontariato').toUpperCase();$('curtainTitle').textContent='TAPPA '+(stepIndex+1);$('curtainSubtitle').textContent=currentStep.title||'';$('chapterCurtain').classList.remove('hidden');clearTimeout(curtainTimer);curtainTimer=setTimeout(()=>{$('chapterCurtain').classList.add('hidden');inputLocked=false;},1800);}
  if(!Array.isArray(currentStep.dialogue)||!currentStep.dialogue.length){dialogueFinished=true;afterNarrative();}
}
function updateHUD(){if(!game)return;const p=game.player;$('hpText').textContent=`Energia ${Math.round(p.hp)} / ${Math.round(p.maxHp)}`;$('hpFill').style.width=`${clamp(p.hp/p.maxHp*100,0,100)}%`;$('hudClass').textContent=`${p.playerClass} · Livello ${p.level}`;}
function baseStat(stat){const s=statsForClass(game.player.playerClass);return Number(s[stat]||0);}
function skillRank(id,p=game?.player){const skillId=LEGACY_SKILL_EFFECT_MAP[id]||id;return Math.max(0,Number(p?.skillRanks?.[skillId]||0));}
function migrateSkillTree(player){
  if(Number(player.skillTreeVersion)>=SKILL_TREE_VERSION)return;
  const tree=content.registries.SKILL_TREE||{},previousRanks=player.skillRanks||{};
  let refunded=0;
  for(const [id,value] of Object.entries(previousRanks)){
    if(tree[id])continue;
    const rank=Math.max(0,Math.floor(Number(value)||0)),skill=legacySkillTree[id];
    if(rank&&skill)refunded+=rank*Math.max(1,Number(skill.cost)||1);
  }
  player.skillRanks=Object.fromEntries(Object.entries(previousRanks).filter(([id])=>!!tree[id]));
  player.skillPoints=Math.max(0,Number(player.skillPoints)||0)+refunded;
  player.skillTreeVersion=SKILL_TREE_VERSION;
}
function skillStatBonuses(p=game?.player){
  if(!p)return {};
  const rank=id=>skillRank(id,p);
  return {
    hp:rank('supportive_presence')*15+rank('team_wellbeing')*30+rank('recovery_and_referral')*25,
    attack:rank('team_coordination')*3+rank('resource_coordination')*2,
    defense:rank('service_safety')*3+rank('preparedness')*3+rank('privacy_respect')*2,
    magic:rank('service_orientation')*5+rank('information_verification')*4+rank('resource_coordination')*4,
    speed:rank('service_planning'),
    luck:rank('active_listening')*2+rank('local_knowledge')*2,
    crit:rank('information_verification')*.02
  };
}
function destinyCapacity(p=game?.player){return 100+skillRank('destiny_reservoir',p)*20+skillRank('destiny_overcharge',p)*10;}
function gainDestiny(amount){
  if(!game)return;
  game.player.destiny=clamp(Number(game.player.destiny||0)+amount,0,destinyCapacity());
}
function mpSetStatus(message){const el=$('mpStatus');if(el)el.textContent=message;}
function mpClearConnectionTimer(){if(mpConnectionTimer){clearTimeout(mpConnectionTimer);mpConnectionTimer=null;}}
function mpConnectionTimeout(message){
  mpClearConnectionTimer();const peer=mpPeer,conn=mpConnection,role=mpRole;
  mpConnectionTimer=setTimeout(()=>{
    if(mpPeer!==peer||mpRole!==role||conn?.open)return;
    console.warn('PeerJS timeout:',message);
    mpDisconnect(false);
    mpSetStatus(message);
  },20000);
}
function mpOpen(){ $('multiplayerOverlay').classList.remove('hidden'); $('mpHostActions').classList.remove('hidden'); $('mpCodeWrap').classList.add('hidden'); $('mpRoomDisplay').classList.toggle('hidden',mpRole!=='host'); if(mpRole==='host')mpSetStatus(`Sei l’host: ${mpConnectedClientCount()+1}/${MP_MAX_PLAYERS} giocatori. Il salvataggio principale resta su questo dispositivo.`);else if(mpRole==='guest')mpSetStatus('Sei connesso alla cronaca online. Il tuo personaggio e il tuo inventario restano indipendenti.');else mpSetStatus('Crea una nuova cronaca oppure entra usando il codice dell’host.'); }
function mpClose(){ $('multiplayerOverlay').classList.add('hidden'); }
function mpSetPending(action){mpPendingAction=action;mpClose();startIntro('new','lore');}
function mpCreateNew(){if(!window.Peer){mpSetStatus('Libreria di rete non disponibile. Controlla la connessione Internet e ricarica il gioco.');return;}mpSetPending('host-new');}
function mpShowJoin(){ $('mpHostActions').classList.add('hidden');$('mpCodeWrap').classList.remove('hidden');$('mpRoomCode').focus();mpSetStatus('Inserisci il codice di 6 caratteri condiviso dall’host. Poi scegli il tuo nome e la tua classe.'); }
function mpConnectedClientCount(){return [...mpConnections.values()].filter(conn=>conn.open).length;}
function mpRefreshLobbyStatus(){if(mpRole==='host')mpSetStatus(`Stanza pronta · ${mpConnectedClientCount()+1}/${MP_MAX_PLAYERS} giocatori. Condividi il codice con la squadra.`);}
function mpBroadcast(message,excludePeer=''){
  for(const [peerId,conn] of mpConnections){
    if(peerId===excludePeer||!conn.open)continue;
    try{conn.send(message);}catch(error){console.warn('Messaggio multiplayer non inviato a '+peerId+':',error);}
  }
}
function mpStartHost(){
  if(!window.Peer){$('multiplayerOverlay').classList.remove('hidden');mpSetStatus('Libreria PeerJS non disponibile. Ricarica il gioco e verifica l’accesso a Internet.');toast('PeerJS non è disponibile: controlla Internet.');return;}
  mpDisconnect(false);mpRole='host';mpRadarVisibility();mpRoomCode=Math.random().toString(36).slice(2,8).padEnd(6,'x').toLowerCase();const peerId='cod-'+mpRoomCode+'-host';
  mpSetStatus('Apertura della stanza online…');$('mpRoomCodeValue').textContent=mpRoomCode.toUpperCase();$('mpRoomDisplay').classList.remove('hidden');$('mpHostActions').classList.add('hidden');$('mpCodeWrap').classList.add('hidden');$('multiplayerOverlay').classList.remove('hidden');
  try{
    mpPeer=new Peer(peerId);
    mpConnectionTimeout('Il server PeerJS non ha risposto entro 20 secondi. Verifica Internet e riprova a creare la stanza.');
    mpPeer.on('open',()=>{mpClearConnectionTimer();mpRefreshLobbyStatus();toast('Stanza online pronta: '+mpRoomCode.toUpperCase());});
    mpPeer.on('connection',conn=>{
      const peerId=conn.peer;
      if(mpConnections.has(peerId)){conn.close();return;}
      if(mpConnections.size>=MP_MAX_PLAYERS-1){
        conn.on('open',()=>{if(conn.open){try{conn.send({type:'roomFull',maxPlayers:MP_MAX_PLAYERS});}catch(error){console.warn('Avviso stanza piena non inviato:',error);}setTimeout(()=>conn.close(),250);}});
        return;
      }
      mpConnections.set(peerId,conn);mpWireConnection(conn,peerId);
    });
    mpPeer.on('error',err=>{mpClearConnectionTimer();console.error('PeerJS host:',err);mpSetStatus('Connessione non riuscita ('+(err.type||'errore')+'). Verifica Internet e riprova.');});
  }catch(e){mpClearConnectionTimer();console.error('Avvio PeerJS host non riuscito:',e);mpSetStatus('Impossibile avviare la stanza: '+e.message);}
}
function mpStartGuest(code){
  if(!window.Peer){$('multiplayerOverlay').classList.remove('hidden');mpSetStatus('Libreria PeerJS non disponibile. Ricarica il gioco e verifica l’accesso a Internet.');toast('PeerJS non è disponibile: controlla Internet.');return;}code=String(code||'').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,6);if(code.length!==6){mpOpen();mpShowJoin();mpSetStatus('Il codice deve contenere 6 caratteri.');return;}
  mpDisconnect(false);mpRole='guest';mpRadarVisibility();mpRoomCode=code;$('multiplayerOverlay').classList.remove('hidden');$('mpHostActions').classList.add('hidden');$('mpCodeWrap').classList.add('hidden');mpSetStatus('Connessione all’host…');
  try{mpPeer=new Peer();mpConnectionTimeout('Il servizio PeerJS non ha risposto entro 20 secondi. Controlla la connessione Internet e riprova.');mpPeer.on('open',()=>{mpClearConnectionTimer();mpSetStatus('Host trovato sul servizio di segnalazione; attendo la connessione diretta…');mpConnection=mpPeer.connect('cod-'+code+'-host',{reliable:true});mpConnectionTimeout('Nessuna risposta dall’host dopo 20 secondi. Verificate codice, rete e firewall; poi riprovate.');mpWireConnection(mpConnection);});mpPeer.on('error',err=>{mpClearConnectionTimer();console.error('PeerJS guest:',err);mpSetStatus('Connessione non riuscita ('+(err.type||'errore')+'). Controlla il codice e che l’host sia online.');});}catch(e){mpClearConnectionTimer();console.error('Avvio PeerJS guest non riuscito:',e);mpSetStatus('Impossibile collegarsi: '+e.message);}
}
function mpWireConnection(conn,peerId=''){
  conn.on('open',()=>{
    mpClearConnectionTimer();
    if(mpRole==='host'){mpRefreshLobbyStatus();mpSendSnapshot(conn);}
    else{mpSetStatus('Connesso! Sincronizzazione della cronaca in corso…');toast('Connesso alla cronaca online.');}
  });
  conn.on('data',msg=>{
    if(!msg||typeof msg!=='object')return;
    if(msg.type==='roomFull'&&mpRole==='guest'){
      const rejected=mpConnection;mpConnection=null;mpRole='offline';mpPeer?.destroy();mpPeer=null;
      mpSetStatus(`La stanza è piena: il limite è ${Number(msg.maxPlayers)||MP_MAX_PLAYERS} giocatori totali.`);rejected?.close();return;
    }
    if(msg.type==='snapshot'&&mpRole==='guest')mpApplySnapshot(msg);
    if(msg.type==='missionProgress'&&mpRole==='host')mpApplyMissionProgress(msg);
    if(msg.type==='position'&&msg.position){
      const playerId=mpRole==='host'?peerId:String(msg.playerId||'host');
      const playerName=String(msg.playerName||'Portatore');
      mpMoveRemote(msg.position,playerName,playerId);
      if(mpRole==='host')mpBroadcast({type:'position',playerId,playerName,position:msg.position},peerId);
    }
    if(msg.type==='peerLeft'&&mpRole==='guest')mpRemoveRemote(String(msg.playerId||''));
    if(msg.type==='hello'&&mpRole==='host'){
      const remote=mpRemotePlayers.get(peerId);
      if(remote)remote.name=String(msg.playerName||'Portatore');
      mpRefreshLobbyStatus();mpSendSnapshot(conn);
    }
  });
  conn.on('close',()=>{
    mpClearConnectionTimer();
    if(mpRole==='host'&&mpConnections.get(peerId)===conn){
      mpConnections.delete(peerId);mpRemoveRemote(peerId);mpBroadcast({type:'peerLeft',playerId:peerId});mpRefreshLobbyStatus();
    }else if(mpConnection===conn){
      mpConnection=null;mpRole='offline';mpRemoveAllRemotes();mpSetStatus('Connessione terminata. Il salvataggio locale è conservato.');toast('La connessione multiplayer è terminata. Il salvataggio locale è conservato.');
    }
  });
  conn.on('error',err=>{
    mpClearConnectionTimer();console.error('PeerJS connection:',err);
    mpSetStatus('Connessione diretta non riuscita ('+(err.type||'errore')+'). Verificate firewall/rete e riprovate.');
  });
  if(mpRole==='guest')conn.on('open',()=>{conn.send({type:'hello',playerName:game?.player?.name||'Portatore'});});
}
function mpSharedSnapshot(){if(!game)return null;const shared=JSON.parse(JSON.stringify(game));return {type:'snapshot',game:shared,stepIndex,hubMode,position:playerRoot?{x:playerRoot.position.x,y:playerRoot.position.y,z:playerRoot.position.z,rotationY:playerRoot.rotation.y}:null,playerName:game.player?.name||'Portatore',sentAt:Date.now()};}
function mpSendSnapshot(target=null){
  if(mpRole!=='host'||!game)return;
  const snapshot=mpSharedSnapshot();
  if(target?.open){try{target.send(snapshot);}catch(error){console.warn('Snapshot multiplayer non inviato:',error);}return;}
  mpBroadcast(snapshot);
}
function mpSendMissionProgress(chapter,state){
  if(mpRole!=='guest'||!mpConnection?.open)return;
  try{mpConnection.send({type:'missionProgress',chapter,state,playerName:game?.player?.name||'Portatore'});}
  catch(error){console.error('Progresso attività multiplayer non inviato:',error);mpSetStatus('La connessione non ha sincronizzato l’attività. Controlla la rete e riprova.');}
}
function mpApplyMissionProgress(message){
  const chapter=Number(message.chapter),state=message.state;
  if(!game||!Number.isInteger(chapter)||chapter<1||chapter>6||chapter!==Number(route[stepIndex]?.chapter_number)||!state||typeof state!=='object'||Array.isArray(state))return;
  const previous=game.missionActivities?.[chapter];
  if(previous?.complete&&!state.complete)return;
  game.missionActivities=game.missionActivities||{};
  game.missionActivities[chapter]=state;
  if(!previous?.complete&&state.complete){
    const badges=game.earnedActivityBadges||(game.earnedActivityBadges=[]);
    for(const [key,title] of [['precision','Occhio attento'],['attention','Ascolto e cura'],['collaboration','Forza di squadra']]){
      const id=`${chapter}:${key}`;
      if(state.result?.[key]===3&&!badges.some(badge=>badge.id===id))badges.push({id,title,chapter});
    }
    if(chapter===4)game.communityTrust=Number(game.communityTrust||0)+Number(state.trust||0);
  }
  saveGame(false);
  if(!MISSION_REPLAY.active&&!$('missionOverlay').classList.contains('hidden')&&missionChapter()===chapter)renderMissionActivity();
  else if(state.complete&&missionChapter()===chapter)showQuestComplete();
}
function mpApplySnapshot(msg){if(!msg.game||!game||mpApplyingSnapshot)return;mpApplyingSnapshot=true;try{const localPlayer=game.player,oldStep=stepIndex,oldScene=currentStep?.scene;const incoming=msg.game;game={...incoming,player:localPlayer,slot:currentSlot};stepIndex=clamp(Number(msg.stepIndex??incoming.stepIndex??0),0,route.length-1);if(game.chapter6Variant&&game.chapter6Variant!=='respected'){const replacement=(content.chapter6_variants?.[game.chapter6Variant]||[]).map(s=>({...s,chapter_number:6,source_module:'chapter6',route_variant:game.chapter6Variant,scene:s.scene||'aether_gate',dialogue:s.dialogue||[]}));route=route.filter(s=>s.chapter_number!==6);const idx=route.findIndex(s=>s.chapter_number>5);route.splice(Math.max(0,idx),0,...replacement);}if(oldStep!==stepIndex||oldScene!==route[stepIndex]?.scene){startStep(false);}else{updateHUD();}if(msg.position)mpMoveRemote(msg.position,msg.playerName||'Host','host');writeSlot(currentSlot,game);}catch(e){console.error('Sincronizzazione cronaca fallita',e);}finally{mpApplyingSnapshot=false;}}
const _mpApplySnapshot014=mpApplySnapshot;
mpApplySnapshot=function(msg){const wasHub=hubMode,oldStep=stepIndex,chapter=missionChapter(),before=JSON.stringify(game?.missionActivities?.[chapter]||null);_mpApplySnapshot014(msg);if(msg.hubMode===true&&!wasHub)enterTownHub();else if(msg.hubMode===false&&wasHub)leaveTownHub();if(!$('missionOverlay').classList.contains('hidden')&&!MISSION_REPLAY.active){if(oldStep!==stepIndex){$('missionOverlay').classList.add('hidden');inputLocked=false;}else if(before!==JSON.stringify(game?.missionActivities?.[chapter]||null))renderMissionActivity();}};
function mapMarkerPosition(marker,position){
  if(!marker||!position)return;
  marker.style.left=clamp(50+Number(position.x||0)*.9,4,96)+'%';
  marker.style.top=clamp(50-Number(position.z||0)*.9,4,96)+'%';
}
function updateLocalMapHeading(){
  const heading=$('localMapHeading');if(!heading||!currentStep)return;
  heading.textContent=hubMode?'COMITATO LOCALE':`TAPPA ${stepIndex+1} · ${currentStep.title||'Area attuale'}`;
}
function setMapTab(tab){
  const worldTab=tab==='worlds';
  $('areaMapTab').classList.toggle('active',!worldTab);$('worldMapTab').classList.toggle('active',worldTab);
  $('areaMapTab').setAttribute('aria-selected',String(!worldTab));$('worldMapTab').setAttribute('aria-selected',String(worldTab));
  $('areaMapView').classList.toggle('hidden',worldTab);$('worldMapView').classList.toggle('hidden',!worldTab);
  if(worldTab)renderWorldMap();
}
function renderWorldMap(){
  const root=$('worldMapContent');if(!root||!currentStep)return;
  if(content.redCrossStory){
    const list=document.createElement('div');list.className='world-map-list';list.setAttribute('aria-label','Tappe del turno');
    const selectedIndex=clamp(Number(mapSelectedWorld||stepIndex+1),1,route.length);
    route.forEach((step,index)=>{
      const unlocked=index<=stepIndex,button=document.createElement('button');button.type='button';
      button.className='world-map-item'+(unlocked&&index+1===selectedIndex?' selected':'')+(index===stepIndex?' current':'')+(!unlocked?' locked':'');
      button.innerHTML=unlocked
        ?`<span class="world-map-item-number">${String(index+1).padStart(2,'0')}</span><span class="world-map-item-name">${escapeHtml(step.title)}</span>${index===stepIndex?'<span class="world-map-current-mark">ORA</span>':''}`
        :'<span class="world-map-question">?</span><span class="world-map-item-name">Tappa da scoprire</span>';
      button.disabled=!unlocked;
      if(unlocked)button.addEventListener('click',()=>{mapSelectedWorld=index+1;renderWorldMap();});
      list.appendChild(button);
    });
    const selected=route[selectedIndex-1],isCurrent=selectedIndex===stepIndex+1,done=selectedIndex<=stepIndex;
    const detail=document.createElement('article');detail.className='world-map-detail';
    detail.innerHTML=`<div class="world-map-detail-kicker">${isCurrent?'TURNO IN CORSO':done?'TAPPA COMPLETATA':'TAPPA DA SCOPRIRE'} · ${selectedIndex} / ${route.length}</div><h3>${escapeHtml(selected.title)}</h3><small>${escapeHtml(selected.serviceCategory||'Attività di volontariato')}</small><p>${escapeHtml(selected.objective||'')}</p>`;
    root.replaceChildren(list,detail);return;
  }
  const chapter=Number(currentStep.chapter_number||1),currentWorld=worldForStep(currentStep);
  const unlocked=Object.keys(content.worlds||{}).map(Number).filter(id=>(WORLD_UNLOCK_CHAPTERS[id]||Infinity)<=chapter);
  if(!unlocked.includes(mapSelectedWorld))mapSelectedWorld=currentWorld;
  const names=content.worlds||{},list=document.createElement('div');list.className='world-map-list';list.setAttribute('aria-label','Tappe cronologiche raggiunte e future');
  for(const id of Object.keys(names).map(Number)){
    const worldUnlocked=unlocked.includes(id),button=document.createElement('button');button.type='button';button.className='world-map-item'+(worldUnlocked&&id===mapSelectedWorld?' selected':'')+(worldUnlocked&&id===currentWorld?' current':'')+(!worldUnlocked?' locked':'');
    if(worldUnlocked){
      button.innerHTML=`<span class="world-map-item-number">${String(id).padStart(2,'0')}</span><span class="world-map-item-name">${escapeHtml(names[id])}</span>${id===currentWorld?'<span class="world-map-current-mark">QUI</span>':''}`;
      button.setAttribute('aria-label',`${names[id]}${id===currentWorld?' · mondo attuale':''}`);
      button.addEventListener('click',()=>{mapSelectedWorld=id;renderWorldMap();});
    }else{
      const unlockChapter=WORLD_UNLOCK_CHAPTERS[id]||1;
      button.innerHTML=`<span class="world-map-question">?</span><span class="world-map-item-name">Tappa futura</span><small>Si sblocca al capitolo ${roman(unlockChapter)}</small>`;
      button.disabled=true;button.setAttribute('aria-label',`Tappa futura, si sblocca al capitolo ${roman(unlockChapter)}`);
    }
    list.appendChild(button);
  }
  const detail=document.createElement('article');detail.className='world-map-detail';
  const selectedName=names[mapSelectedWorld]||'Mondo attuale';
  const isCurrent=mapSelectedWorld===currentWorld;
  const chronicle=content.redCrossStory?.worldChronicles?.[mapSelectedWorld-1]||WORLD_SAFE_CHRONICLES[mapSelectedWorld]||'La cronaca di questo luogo si chiarirà durante il viaggio.';
  detail.innerHTML=`<div class="world-map-detail-kicker">${isCurrent?'TI TROVI QUI':'CRONACA SCOPERTA'} · TAPPA ${roman(mapSelectedWorld)}</div><h3>${escapeHtml(selectedName)}</h3><p>${escapeHtml(chronicle)}</p><small>${isCurrent?`Capitolo attuale: ${roman(chapter)}`:`Scoperto dal capitolo ${roman(WORLD_UNLOCK_CHAPTERS[mapSelectedWorld]||1)}`}</small>`;
  root.replaceChildren(list,detail);
}
function toggleLocalMap(force){
  if(!game)return;
  const map=$('localMap'),button=$('mapToggleBtn');if(!map||!button)return;
  const open=force??map.classList.contains('hidden');
  map.classList.toggle('hidden',!open);$('mapBackdrop').classList.toggle('hidden',!open);button.setAttribute('aria-expanded',String(open));
  if(open){mapSelectedWorld=content?.redCrossStory?stepIndex+1:worldForStep(currentStep);setMapTab('area');updateLocalMapHeading();mpUpdateRadar();$('closeMapBtn').focus();}
  else button.focus();
}
function mpRadarVisibility(){
  const status=$('mpRadarDistance');
  const connected=mpRole==='host'?!!mpPeer:mpRole==='guest'&&!!mpConnection?.open;
  if(status&&!connected)status.textContent=mpRole==='offline'?'Modalità solo · area corrente':'In attesa della squadra…';
}
function mpUpdateRadar(){
  const field=document.querySelector('.local-map-field'),distance=$('mpRadarDistance');
  if(!field||!distance)return;mpRadarVisibility();
  if(playerRoot)mapMarkerPosition($('mapPlayerSelf'),playerRoot.position);
  const active=new Set();
  if(mpRole!=='offline'&&game&&playerRoot){
    for(const [id,remote] of mpRemotePlayers){
      if(!remote.mesh||remote.mesh.isDisposed())continue;
      active.add(id);
      if(!remote.radar){remote.radar=document.createElement('span');remote.radar.className='local-map-player local-map-other';remote.radar.textContent='◆';field.appendChild(remote.radar);}
      remote.radar.title=remote.name||'Portatore';remote.radar.style.color=remote.color;mapMarkerPosition(remote.radar,remote.mesh.position);
    }
  }
  for(const [id,remote] of mpRemotePlayers)if(!active.has(id)&&remote.radar){remote.radar.remove();remote.radar=null;}
  if(mpRole==='offline'||!game||!playerRoot){mpRadarVisibility();return;}
  if(!active.size){distance.textContent=`Giocatori connessi: ${mpRole==='host'?mpConnectedClientCount()+1:mpRemotePlayers.size+1}/${MP_MAX_PLAYERS}`;return;}
  const nearest=[...mpRemotePlayers.entries()].filter(([id,remote])=>active.has(id)).map(([id,remote])=>({id,name:remote.name||'Portatore',meters:Math.round(BABYLON.Vector3.Distance(playerRoot.position,remote.mesh.position))})).sort((a,b)=>a.meters-b.meters)[0];
  distance.textContent=`${mpRole==='host'?mpConnectedClientCount()+1:mpRemotePlayers.size+1}/${MP_MAX_PLAYERS} giocatori · più vicino: ${nearest.name} (${nearest.meters} m)`;
}
function mpMoveRemote(pos,name,id='host'){
  if(!scene||!worldRoot||!pos)return;
  const position={x:Number(pos.x),y:Number(pos.y),z:Number(pos.z)};
  if(!Object.values(position).every(Number.isFinite))return;
  let remote=mpRemotePlayers.get(id);
  if(!remote||remote.mesh.isDisposed()){
    const palette=['#73d7d9','#e7b45b','#a98bd9','#70bf83','#e57a75','#588cce'];
    const colorIndex=Math.abs([...String(id)].reduce((sum,char)=>sum+char.charCodeAt(0),0))%palette.length;
    const safeId=String(id).replace(/\W/g,'_');
    const mesh=BABYLON.MeshBuilder.CreateSphere('online_player_'+safeId,{diameter:1.15,segments:8},scene);
    mesh.material=mat('online_player_mat_'+safeId,palette[colorIndex],palette[colorIndex],.8);mesh.isPickable=false;
    remote={mesh,name:String(name||'Portatore'),color:palette[colorIndex],radar:null};mpRemotePlayers.set(id,remote);
  }
  remote.name=String(name||remote.name||'Portatore');
  remote.mesh.position.set(position.x,Math.max(.7,position.y||.9),position.z);
  remote.mesh.rotation.y=Number(pos.rotationY)||0;
  remote.mesh.metadata={...(remote.mesh.metadata||{}),remoteName:remote.name};
  mpUpdateRadar();
}
function mpRemoveRemote(id){
  const remote=mpRemotePlayers.get(id);if(!remote)return;
  if(remote.mesh&&!remote.mesh.isDisposed())remote.mesh.dispose();
  remote.radar?.remove();mpRemotePlayers.delete(id);mpUpdateRadar();
}
function mpRemoveAllRemotes(){for(const id of [...mpRemotePlayers.keys()])mpRemoveRemote(id);}
function mpDisconnect(show=true){
  mpClearConnectionTimer();
  const connections=[...mpConnections.values()],connection=mpConnection,peer=mpPeer;
  mpConnections.clear();mpConnection=null;mpPeer=null;mpRole='offline';mpRoomCode='';
  try{connection?.close();for(const conn of connections)conn.close();peer?.destroy();}
  catch(error){console.warn('Chiusura PeerJS non riuscita:',error);}
  mpRemoveAllRemotes();mpRadarVisibility();if(show)toast('Multiplayer disconnesso.');
}
function mpTick(){
  const now=Date.now();if(now-lastRadarUpdateAt>250){lastRadarUpdateAt=now;mpUpdateRadar();}
  if(!game||!playerRoot)return;
  if(now-mpLastPositionSend>300){
    mpLastPositionSend=now;
    const message={type:'position',playerId:mpRole==='host'?'host':String(mpPeer?.id||'guest'),position:{x:playerRoot.position.x,y:playerRoot.position.y,z:playerRoot.position.z,rotationY:playerRoot.rotation.y},playerName:game.player?.name||'Portatore'};
    if(mpRole==='host')mpBroadcast(message);else if(mpRole==='guest'&&mpConnection?.open){try{mpConnection.send(message);}catch(error){console.warn('Posizione multiplayer non inviata:',error);}}
  }
  if(mpRole==='host'&&now-mpLastSnapshotSend>1700){mpLastSnapshotSend=now;mpSendSnapshot();}
}

function createNewGame(slot){
  const cls=selectedClass,stats=statsForClass(cls),starterWeapon=STARTER_CLASS_WEAPONS[cls]||'spada_rovinata';currentSlot=slot;stepIndex=0;hubMode=false;hubReturnPosition=null;route=content.playableChapters.map(s=>({...s}));
  game={schema:3,slot,difficulty:normalizedDifficulty(selectedDifficulty),player:{name:$('heroName').value.trim()||'Volontario',playerClass:cls,appearance:normalizeAppearance(readAppearanceControls()),level:1,skillPointsThroughLevel:1,skillTreeVersion:SKILL_TREE_VERSION,xp:0,xpNext:90,maxHp:stats.hp,hp:stats.hp,attack:stats.attack,defense:stats.defense,magic:stats.magic,speed:stats.speed,crit:stats.crit,luck:stats.luck,gold:80,skillPoints:0,skillRanks:{},classMastery:{},titles:[],destiny:100,reputations:Object.fromEntries((content.registries.FACTIONS||[]).map(f=>[f,0])),affinity:{},companions:[],shadows:[],unlockedClasses:[...(content.registries.STARTER_CLASSES||STARTER_FALLBACK)],flags:{},inventory:{potions:5,largePotions:0,antidotes:1,smallShields:2,materials:{polvere_runica:3,nucleo_braci:1,scheggia_gelo:1,cristallo_tuono:1,sigillo_sacro:1,essenza_ombra:2}},weapon:starterWeapon,armor:'cuoio_viandante',shield:'buckler_legno',ring:null},stepIndex:0,completedSteps:[],earnedBadges:[],earnedActivityBadges:[],missionActivities:{},communityTrust:0,activeSideQuests:[],completedSideQuests:[],choices:{},chapter6Variant:'respected',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
  ensurePlayerInventory(game.player);ensureEquipmentDurability(game.player);  showScreen(null);$('gameUI').classList.remove('hidden');$('pauseScreen').classList.add('hidden');createPlayerVisual();stepIndex=0;startStep(true);saveGame(false);toast('Un nuovo turno è stato avviato nello slot '+(slot+1)+'.');if(mpPendingAction==='host-new'){mpPendingAction=null;mpStartHost();}else if(mpPendingAction==='join-new'){const code=mpPendingCode;mpPendingAction=null;mpPendingCode='';mpStartGuest(code);}
}
function loadGame(slot){
  const data=readSlot(slot);if(!data){toast('Questo slot è vuoto.');return;}
  const oldSchema=Number(data.schema||1),migratedStepIndex=mappedSaveStepIndex(data);
  game=data;game.schema=3;game.difficulty=normalizedDifficulty(game.difficulty);game.missionActivities=game.missionActivities||{};game.earnedActivityBadges=Array.isArray(game.earnedActivityBadges)?game.earnedActivityBadges:[];game.communityTrust=Number(game.communityTrust||0);hubMode=false;hubReturnPosition=null;currentSlot=slot;
  game.player.playerClass=migratedClassName(game.player.playerClass);
  if(!content.registries.CLASS_DATA[game.player.playerClass])game.player.playerClass=STARTER_FALLBACK[0];
  game.player.unlockedClasses=(game.player.unlockedClasses||[]).map(migratedClassName).filter(name=>content.registries.CLASS_DATA[name]);
  if(!game.player.unlockedClasses.length)game.player.unlockedClasses=[...(content.registries.STARTER_CLASSES||STARTER_FALLBACK)];
  ensurePlayerInventory(game.player);ensureEquipmentDurability(game.player);game.player.skillRanks=game.player.skillRanks||{};migrateSkillTree(game.player);game.player.classMastery=game.player.classMastery||{};game.player.titles=game.player.titles||[];game.earnedBadges=Array.isArray(game.earnedBadges)?game.earnedBadges:[];
  if(!Number.isFinite(Number(game.player.skillPointsThroughLevel))){const level=Math.max(1,Number(game.player.level||1));game.player.skillPoints=(Number(game.player.skillPoints)||0)+Math.floor(level/5);game.player.skillPointsThroughLevel=level;}
  game.player.destiny=clamp(Number(game.player.destiny||0),0,destinyCapacity(game.player));route=content.playableChapters.map(s=>({...s}));
  stepIndex=clamp(migratedStepIndex,0,route.length);
  if(oldSchema<3){
    game.completedSteps=route.slice(0,stepIndex).map(step=>step.id);
    game.earnedBadges=route.slice(0,stepIndex).map(step=>step.chapter_number);
  }
  showScreen(null);$('gameUI').classList.remove('hidden');game.player.maxHp=game.player.maxHp||statsForClass(game.player.playerClass).hp;game.player.hp=clamp(Number(game.player.hp??game.player.maxHp),0,game.player.maxHp);createPlayerVisual();startStep(false);saveGame(false);toast('Turno caricato: sei tappe di volontariato.');
}
function saveGame(show=true){if(!game||currentSlot<0)return;game.stepIndex=stepIndex;game.slot=currentSlot;game.updatedAt=new Date().toISOString();writeSlot(currentSlot,game);if(mpRole==='host'&&!mpApplyingSnapshot)mpSendSnapshot();refreshContinueButton();if(show)toast('Partita salvata nello slot '+(currentSlot+1)+'.');}
function populateSlotScreen(){const root=$('slotList');root.innerHTML='';const slots=allSlots();slots.forEach((s,i)=>{const row=document.createElement('div');row.className='slot-row';const info=document.createElement('div');if(s){const savedStep=mappedSaveStepIndex(s),st=content.playableChapters[savedStep];info.innerHTML=`<strong>Slot ${i+1} · ${escapeHtml(s.player?.name||'Volontario')}</strong><small>${escapeHtml(migratedClassName(s.player?.playerClass||'Ruolo non disponibile'))} · ${escapeHtml(st?.title||'Turno completato')} · ${st?`Tappa ${savedStep+1}`:'Turno completato'}</small>`;}else info.innerHTML=`<strong>Slot ${i+1} · Vuoto</strong><small>Un nuovo turno può iniziare qui.</small>`;
    const actions=document.createElement('div');actions.className='slot-actions';
    const btn=document.createElement('button');btn.textContent=slotMode==='new'?(s?'Sovrascrivi':'Crea'):slotMode==='save'?'Salva':s?'Carica':'Vuoto';btn.disabled=slotMode==='load'&&!s;btn.addEventListener('click',()=>{if(slotMode==='new'){if(s&&!confirm('Sovrascrivere lo slot '+(i+1)+'? La cronaca precedente verrà sostituita.'))return;createNewGame(i);}else if(slotMode==='load'){loadGame(i);}else if(slotMode==='save'){if(s&&i!==currentSlot&&!confirm('Sovrascrivere lo slot '+(i+1)+'?'))return;currentSlot=i;saveGame(true);populateSlotScreen();}});
    actions.appendChild(btn);
    if(s){const del=document.createElement('button');del.type='button';del.className='slot-delete';del.textContent='Elimina';del.setAttribute('aria-label',`Elimina slot ${i+1}`);del.addEventListener('click',()=>deleteSlot(i));actions.appendChild(del);}
    row.append(info,actions);root.appendChild(row);});}
function populateClassScreen(){
  const list=$('classList');list.innerHTML='';const starters=content.registries.STARTER_CLASSES||STARTER_FALLBACK;
  selectedAppearance=readAppearanceControls();
  if(!starters.includes(selectedClass))selectedClass=starters[0]||'Spartano';
  for(const name of starters){
    const presentation=classPresentation(name);
    const btn=document.createElement('button');btn.className='class-option'+(name===selectedClass?' active':'');btn.style.setProperty('--class-accent',setClassAccent(name));
    btn.setAttribute('aria-label',name+': '+presentation.focus);
    btn.innerHTML=`<span class="class-option-art">${classArtworkSvg(name,true)}</span><span class="class-option-copy"><strong>${escapeHtml(name)}</strong><span class="class-option-weapon">${escapeHtml(presentation.weapon)}</span><span class="class-option-stats">${escapeHtml(presentation.focus)}</span></span>`;
    btn.addEventListener('click',()=>{selectedClass=name;populateClassScreen();});list.appendChild(btn);
  }
  updateClassPreview();
}
function readAppearanceControls(){
  return normalizeAppearance({
    skin:$('appearanceSkin')?.value,
    hairStyle:$('appearanceHairStyle')?.value,
    hairColor:$('appearanceHairColor')?.value,
    outfitStyle:$('appearanceOutfit')?.value,
    outfitColor:$('appearanceOutfitColor')?.value
  });
}
function customizedCharacterSvg(appearance,accent){
  const look=normalizeAppearance(appearance),skin=look.skin,hair=look.hairColor;
  const uniformColor={
    Soccorritore:'#ef233c','Operatore sociale':'#1877d2',Logista:'#ef233c','Volontario di Protezione Civile':'#ff9f1c'
  }[selectedClass]||'#ef233c';
  const outfit=look.outfitStyle==='class'?uniformColor:look.outfitStyle==='traveler'?'#1877d2':look.outfitStyle==='robe'?'#fffdf8':look.outfitStyle==='armor'?'#ff9f1c':look.outfitColor;
  const hairShapes={
    short:`<path d="M66 79Q64 34 100 34Q137 35 135 80L121 69L111 58L90 67L77 80Z" fill="${hair}"/>`,
    long:`<path d="M65 82Q63 34 100 34Q137 35 135 82L127 145L113 135L111 66L88 67L84 137L71 145Z" fill="${hair}"/>`,
    braid:`<path d="M65 82Q63 34 100 34Q137 35 135 82L124 74L111 58L89 65L76 81Z" fill="${hair}"/><path d="M126 75Q143 99 129 127Q141 140 128 153" fill="none" stroke="${hair}" stroke-width="10" stroke-linecap="round"/><path d="M123 101L136 106M123 119L135 124M125 137L135 141" stroke="#d7b56d" stroke-width="2"/>`,
    curls:Array.from({length:9},(_,i)=>{const a=i*Math.PI*2/9;return `<circle cx="${(100+Math.cos(a)*25).toFixed(1)}" cy="${(55+Math.sin(a)*17).toFixed(1)}" r="13" fill="${hair}"/>`;}).join(''),
    shaved:`<path d="M69 77Q68 39 100 38Q132 39 131 77L119 66L111 59L89 65L78 78Z" fill="${hair}"/>`
  }[look.hairStyle];
  const garments={
    class:`<path d="M64 112L80 99H120L136 112L151 210H49Z" fill="${outfit}" stroke="${accent}" stroke-width="3"/><path d="M80 105L100 123L120 105L128 151H72Z" fill="#34303a" stroke="#c7a96e" stroke-width="2"/>`,
    traveler:`<path d="M64 112L80 99H120L136 112L158 215H42Z" fill="${outfit}" stroke="#c5a873" stroke-width="3"/><path d="M80 104L100 124L120 104L127 157H73Z" fill="#332b31"/><path d="M100 124V204" stroke="#d3bd8f" stroke-width="3"/>`,
    robe:`<path d="M67 111L80 99H120L133 111L155 218H45Z" fill="${outfit}" stroke="#d7c18a" stroke-width="3"/><path d="M80 103L100 123L120 103L113 216H87Z" fill="#252132"/><path d="M100 128V199" stroke="#d7b56d" stroke-width="3"/>`,
    armor:`<path d="M64 112L80 99H120L136 112L151 210H49Z" fill="${outfit}" stroke="#d7c18a" stroke-width="3"/><path d="M77 106L100 120L123 106L127 151H73Z" fill="#302b34" stroke="#eee0bf" stroke-width="2"/><path d="M76 155H124L130 207H70Z" fill="${outfit}" stroke="#b7a16e" stroke-width="2"/>`
  }[look.outfitStyle];
  return `<svg class="custom-hero-svg" viewBox="0 0 200 250" role="img" aria-label="Anteprima del volontario"><path d="M65 109L78 94H122L135 109L151 219H49Z" fill="${outfit}" opacity=".28"/><path d="M81 91L67 108L56 158M119 91L133 108L144 158" fill="none" stroke="${outfit}" stroke-width="15" stroke-linecap="round"/>${garments}<ellipse cx="100" cy="68" rx="29" ry="35" fill="${skin}" stroke="#e1c8a4" stroke-width="2"/>${hairShapes}<path d="M87 73H94M106 73H113" stroke="#29212a" stroke-width="3" stroke-linecap="round"/><path d="M96 88Q100 91 104 88" fill="none" stroke="#7d4d47" stroke-width="2"/><rect x="86" y="137" width="28" height="28" rx="5" fill="#fff"/><path d="M97 141h7v8h8v7h-8v8h-7v-8h-8v-7h8z" fill="#ef233c"/></svg>`;
}
function updateClassPreview(){
  selectedAppearance=readAppearanceControls();
  const presentation=classPresentation(selectedClass);
  $('previewClassName').textContent=selectedClass;
  $('previewStats').textContent=presentation.focus;
  $('classPreviewArt').innerHTML=customizedCharacterSvg(selectedAppearance,classHex(selectedClass));
  $('previewWeapon').textContent='RUOLO NELLA SQUADRA';
  $('previewDescription').textContent=presentation.description;
  $('classPreview').style.setProperty('--class-accent',setClassAccent(selectedClass));
  $('appearanceOutfitColor').disabled=selectedAppearance.outfitStyle==='class';
}
function populateArchive(){const arc=$('arcFilter');const arcs=[...new Set(content.historyArchive.map(s=>s.chapter_arc))];arc.innerHTML='<option value="all">Tutte le attività</option>'+arcs.map(a=>`<option value="${escapeHtml(a)}">${escapeHtml(a)}</option>`).join('');renderArchive();}
function renderArchive(){
  const search=$('archiveSearch').value.trim().toLowerCase(),arc=$('arcFilter').value;
  const root=$('archiveList');root.innerHTML='';let shown=0;
  const filtered=content.historyArchive.filter(s=>(arc==='all'||s.chapter_arc===arc)&&(!search||`${s.title} ${s.objective} ${s.chapter_arc} ${(s.dialogue||[]).map(x=>x.join?.(' ')||'').join(' ')}`.toLowerCase().includes(search)));
  for(const s of filtered){
    const el=document.createElement('div');el.className='archive-item';
    el.innerHTML=`<strong>ATTIVITÀ · ${escapeHtml(s.title)}</strong><small>${escapeHtml(s.chapter_arc)}</small><p>${escapeHtml(s.objective||'Attività della comunità')}</p>`;
    el.addEventListener('click',()=>toast(`Attività di volontariato: ${s.title}`));root.appendChild(el);shown++;
  }
  if(!shown)root.innerHTML='<p class="muted">Nessuna attività corrisponde alla ricerca.</p>';
}
function openPanel(kind){if(!game)return;$('sidePanel').classList.remove('hidden');$('panelShade').classList.remove('hidden');$('panelEyebrow').textContent=kind==='forge'?'COMITATO LOCALE':game.player.name.toUpperCase();$('panelContent').innerHTML='';const titles={journal:'Diario del turno',inventory:'Inventario',character:'Personaggio',save:'Salvataggi',forge:'Materiali e attrezzatura'};$('panelTitle').textContent=titles[kind]||'Menu';if(kind==='journal')renderJournal();else if(kind==='inventory')renderInventory();else if(kind==='character')renderCharacter();else if(kind==='save')renderSavePanel();else if(kind==='forge')renderForge();}
function closePanel(){$('sidePanel').classList.add('hidden');$('panelShade').classList.add('hidden');}
function panelEntry(title,sub,desc,buttonText,action){const el=document.createElement('div');el.className='panel-entry';el.innerHTML=`<strong>${escapeHtml(title)}</strong>${sub?`<small>${escapeHtml(sub)}</small>`:''}${desc?`<p>${escapeHtml(desc)}</p>`:''}`;if(buttonText){const b=document.createElement('button');b.textContent=buttonText;b.addEventListener('click',action);el.appendChild(b);}return el;}
function getQuestList(){
  return (content.volunteerMissions||[]).map(mission=>({
    key:`volunteer:${mission.id}`,id:mission.id,catalog:mission.category,
    title:mission.title,desc:mission.desc,reward:mission.reward,rep:{},hidden:false,raw:mission
  }));
}
function renderJournal(){const root=$('panelContent');const s=currentStep||{};root.appendChild(panelEntry('Attività del turno',`Tappa ${stepIndex+1} di ${route.length} · ${s.serviceCategory||s.chapter_arc||''}`,s.objective||s.title));root.appendChild(panelEntry('Il tuo turno',`${Math.min(game.completedSteps.length,route.length)} / ${route.length} tappe completate`,'Aiuta la squadra, scopri i servizi e raccogli i distintivi.'));
  const badgeTitle=document.createElement('h3');badgeTitle.textContent='Album dei distintivi';badgeTitle.className='panel-section-title';root.appendChild(badgeTitle);
  const earned=new Set(game.earnedBadges||[]),album=document.createElement('div');album.className='badge-album';
  for(const [index,step] of route.entries()){
    const tile=document.createElement('div');tile.className='badge-tile'+(earned.has(step.chapter_number)?' earned':'');
    tile.innerHTML=`<span aria-hidden="true">${earned.has(step.chapter_number)?'✚':'?'}</span><strong>${escapeHtml(step.title)}</strong><small>${earned.has(step.chapter_number)?'Raccolto':'Da scoprire'}</small>`;
    tile.setAttribute('aria-label',`${step.title}: ${earned.has(step.chapter_number)?'distintivo raccolto':'ancora da scoprire'}`);album.appendChild(tile);
  }
  root.appendChild(panelEntry('La tua collezione',`${earned.size} / ${route.length} distintivi`,`Concludi la tappa principale per ottenere il distintivo corrispondente.`));root.appendChild(album);
  if(content?.redCrossStory){
    const activityTitle=document.createElement('h3');activityTitle.textContent='Prove e valutazioni';activityTitle.className='panel-section-title';root.appendChild(activityTitle);
    for(const step of route){
      const chapter=Number(step.chapter_number),result=game.missionActivities?.[chapter]?.result,done=!!game.missionActivities?.[chapter]?.complete;
      const summary=done?`Precisione ${result?.precision||1}/3 · Attenzione ${result?.attention||1}/3 · Squadra ${result?.collaboration||1}/3`:'Completa la tappa per sbloccare la ripetizione.';
      root.appendChild(panelEntry(`Tappa ${chapter} · ${step.title}`,done?'Attività completata':'Attività da scoprire',summary,done?'Ripeti attività':null,done?()=>{closePanel();openMissionActivity(true,chapter);}:null));
    }
    const activityBadges=game.earnedActivityBadges||[];
    root.appendChild(panelEntry('Distintivi facoltativi',`${activityBadges.length} ottenuti`,'Raggiungi il punteggio massimo in uno o più criteri per ottenere un distintivo aggiuntivo.'));
    if(activityBadges.length){
      const extras=document.createElement('div');extras.className='badge-album';
      for(const badge of activityBadges){const tile=document.createElement('div');tile.className='badge-tile earned';tile.innerHTML=`<span aria-hidden="true">✦</span><strong>${escapeHtml(badge.title)}</strong><small>Tappa ${escapeHtml(badge.chapter)}</small>`;extras.appendChild(tile);}
      root.appendChild(extras);
    }
    const found=RED_CROSS_DISCOVERIES.filter(place=>game.player.flags?.['worldDiscovery_'+place.id]).length;
    root.appendChild(panelEntry('Esplorazioni del quartiere',`${found} / ${RED_CROSS_DISCOVERIES.length} luoghi scoperti`,'Cerca i simboli blu con la lettera “i” e avvicinati per leggere le curiosità del luogo.'));
  }
  const qlist=getQuestList();const active=new Set(game.activeSideQuests||[]),done=new Set(game.completedSideQuests||[]);const h=document.createElement('h3');h.textContent='Turni e attività di volontariato';h.className='panel-section-title';root.appendChild(h);const search=document.createElement('input');search.placeholder='Filtra turni e attività…';search.className='panel-search';search.style.cssText='width:100%;padding:9px;background:#080910;border:1px solid rgba(215,181,109,.25);color:#eee;margin-bottom:12px';root.appendChild(search);const list=document.createElement('div');root.appendChild(list);
  const draw=()=>{list.innerHTML='';const term=search.value.toLowerCase();for(const q of qlist.filter(q=>!term||`${q.title} ${q.desc} ${q.catalog}`.toLowerCase().includes(term)).slice(0,180)){const isDone=done.has(q.key),isActive=active.has(q.key);list.appendChild(panelEntry(q.title,q.catalog,q.desc,isDone?'Completata':isActive?'Raggiungi obiettivo':'Attiva',()=>{if(isDone)return;if(!isActive){game.activeSideQuests.push(q.key);currentSideQuest=q;closePanel();toast('Attività attivata: '+q.title);createSideQuestMarker(q);}else{currentSideQuest=q;closePanel();toast('Raggiungi il punto attività per completare: '+q.title);createSideQuestMarker(q);}}));}};search.addEventListener('input',draw);draw();
}
function createSideQuestMarker(q){if(!actorRoot||!playerRoot)return;if(currentSideQuest?.markerRoot&&!currentSideQuest.markerRoot.isDisposed())currentSideQuest.markerRoot.dispose(false,true);const root=new BABYLON.TransformNode('sidequest_marker',scene);if(currentSideQuest)currentSideQuest.markerRoot=root;root.position.set(playerRoot.position.x+4,0,playerRoot.position.z+4);root.parent=actorRoot;const ring=BABYLON.MeshBuilder.CreateTorus('sidequest_ring',{diameter:1.8,thickness:.09,tessellation:24},scene);ring.position.y=1.2;ring.material=mat('sidequest_ring_mat','#72c9e0','#5bd6f3');ring.parent=root;const gem=BABYLON.MeshBuilder.CreatePolyhedron('sidequest_gem',{type:1,size:.5},scene);gem.position.y=1.5;gem.material=mat('sidequest_gem_mat','#397e9a','#6ce1ff');gem.parent=root;interactables.push({kind:'sidequest',root,name:'Quest: '+q.title,position:root.position,quest:q});}
function completeSideQuest(){const q=currentSideQuest;if(!q)return;if(q.markerRoot&&!q.markerRoot.isDisposed())q.markerRoot.dispose(false,true);game.completedSideQuests.push(q.key);game.activeSideQuests=game.activeSideQuests.filter(x=>x!==q.key);game.player.gold+=Math.round((Number(q.reward||0)||50)*difficultySettings().rewards);for(const [f,v] of Object.entries(q.rep||{}))game.player.reputations[f]=(game.player.reputations[f]||0)+Number(v||0);toast('Attività completata: '+q.title);currentSideQuest=null;saveGame(false);unlockClassesByRequirements();}
function classUnlockStatus(name,p=game?.player){
  const registry=content.registries,req=registry.CLASS_UNLOCK_QUESTS?.[name]||CLASS_UNLOCK_FALLBACKS[name],starters=registry.STARTER_CLASSES||STARTER_FALLBACK;
  if(starters.includes(name)||(p?.unlockedClasses||[]).includes(name))return {unlocked:true,conditions:[]};
  if(!req)return {unlocked:false,conditions:[{label:'Requisiti di sblocco non configurati',met:false}]};
  const conditions=[],add=(label,met)=>conditions.push({label,met:!!met});
  if(req.level)add(`Livello ${req.level} · attuale ${Number(p?.level||1)}`,Number(p?.level||1)>=Number(req.level));
  if(req.faction){const rep=Number(p?.reputations?.[req.faction]||0);add(`Reputazione ${req.faction} · ${rep}/${req.rep||0}`,rep>=Number(req.rep||0));}
  if(req.material){const amount=Number(req.amount||1),held=Number(p?.inventory?.materials?.[req.material]||0),material=registry.MATERIALS?.[req.material]?.name||humanize(req.material);add(`${material} · ${held}/${amount}`,held>=amount);}
  if(req.flag){const narrative=(req.requirements||[]).find(text=>/completa|sconfiggi|prova|sentiero|principio/i.test(text))||`Impresa: ${req.name||humanize(req.flag)}`;add(narrative,!!p?.flags?.[req.flag]);}
  if(Array.isArray(req.flags_all)){const narrative=(req.requirements||[]).filter(text=>!/^livello\s|reputazione|^\d+\s/i.test(text));req.flags_all.forEach((flag,index)=>add(narrative[index]||humanize(flag),!!p?.flags?.[flag]));}
  if(req.mastery_class){const mastery=Number(p?.classMastery?.[req.mastery_class]||0);add(`Maestria ${req.mastery_class} · ${mastery}/${req.mastery}`,mastery>=Number(req.mastery||0));}
  if(Array.isArray(req.mastery_any)){const current=Math.max(0,...req.mastery_any.map(([className])=>Number(p?.classMastery?.[className]||0)));const required=Number(req.mastery_any[0]?.[1]||0);add(`Maestria ${req.mastery_any.map(([className])=>className).join(' o ')} · ${current}/${required}`,req.mastery_any.some(([className,value])=>Number(p?.classMastery?.[className]||0)>=Number(value)));}
  if(req.title){const titleOwned=(p?.titles||[]).includes(req.title)||p?.title===req.title||!!p?.flags?.[`title:${req.title}`];add(`Titolo ${req.title} · conferito completando gli altri requisiti`,titleOwned||conditions.every(condition=>condition.met));}
  return {unlocked:conditions.every(condition=>condition.met),conditions};
}
function renderClassCatalog(root,locked){
  const p=game.player,all=Object.keys(content.registries.CLASS_DATA||{}),classes=all.filter(name=>classUnlockStatus(name,p).unlocked!==locked),layout=document.createElement('div');layout.className='class-catalog-layout';root.appendChild(layout);
  const list=document.createElement('div');list.className='class-catalog-list';layout.appendChild(list);
  if(!classes.includes(selectedCodexClass))selectedCodexClass=classes[0]||'';
  if(!classes.length){list.innerHTML=`<p class="muted">${locked?'Hai sbloccato tutte le classi.':'Non ci sono classi utilizzabili.'}</p>`;return;}
  for(const name of classes){const state=classUnlockStatus(name,p),presentation=classPresentation(name),button=document.createElement('button');button.type='button';button.className='class-catalog-option'+(name===selectedCodexClass?' selected':'')+(state.unlocked?'':' locked');button.style.setProperty('--class-accent',setClassAccent(name));button.innerHTML=`<span class="class-catalog-art">${classArtworkSvg(name,true)}</span><span class="class-catalog-copy"><strong>${escapeHtml(name)}</strong><small>${escapeHtml(presentation.weapon)}</small><small>${state.unlocked?'Disponibile':`${state.conditions.filter(condition=>condition.met).length}/${state.conditions.length} condizioni`}</small></span>`;button.addEventListener('click',()=>{selectedCodexClass=name;renderCharacter();});list.appendChild(button);}
  const name=selectedCodexClass,presentation=classPresentation(name),stats=statsForClass(name),state=classUnlockStatus(name,p),detail=document.createElement('article');detail.className='class-catalog-detail';detail.style.setProperty('--class-accent',setClassAccent(name));
  const origin=content.registries.CLASS_ORIGINS?.[name]||[];
  detail.innerHTML=`<div class="class-detail-heading"><div class="class-detail-art">${classArtworkSvg(name)}</div><div><p class="eyebrow">${state.unlocked?'CLASSE DISPONIBILE':'PERCORSO DI SBLOCCO'}</p><h3>${escapeHtml(name)}</h3><span>${escapeHtml(presentation.weapon)}</span></div></div><p class="class-detail-description">${escapeHtml(presentation.description)}</p><div class="class-detail-stats">HP ${stats.hp} · ATK ${stats.attack} · DIF ${stats.defense} · MAG ${stats.magic} · VEL ${stats.speed}</div><h4>Lore</h4><div class="class-lore">${origin.map(line=>`<p>${escapeHtml(line)}</p>`).join('')||'<p>La cronaca di questa classe non è ancora disponibile.</p>'}</div><h4>Tecniche</h4><div class="class-techniques"><p><strong>Attacco · ${escapeHtml(presentation.weapon)}</strong><span>Colpo base, potenziato da Attacco e dall’arma equipaggiata.</span></p><p><strong>Tecnica</strong><span>Attacco magico: usa Magia e cresce con il livello.</span></p><p><strong>Dado del Destino</strong><span>Consuma 35 punti Destino; il risultato dipende dalla faccia ottenuta.</span></p></div>`;
  if(!state.unlocked){const requirements=document.createElement('div');requirements.className='class-unlock-conditions';requirements.innerHTML='<h4>Condizioni di sblocco</h4>'+state.conditions.map(condition=>`<p class="${condition.met?'met':'pending'}"><span>${condition.met?'✓':'○'}</span>${escapeHtml(condition.label)}</p>`).join('');detail.appendChild(requirements);}
  else if(name!==p.playerClass){const change=document.createElement('button');change.type='button';change.className='class-roster-change';change.textContent='Usa questa classe';change.addEventListener('click',()=>{p.playerClass=name;const nextStats=statsForClass(name);p.maxHp=nextStats.hp+p.level*18;p.attack=nextStats.attack+p.level*3;p.defense=nextStats.defense+p.level*1.5;p.magic=nextStats.magic+p.level*2.2;p.hp=Math.min(p.maxHp,p.hp);createPlayerVisual();startStep(false);saveGame(false);openPanel('character');});detail.appendChild(change);}
  layout.appendChild(detail);
}
function renderSkillTree(root,p){
  const tree=content.registries.SKILL_TREE||{},branches=new Map();
  for(const [id,skill] of Object.entries(tree)){const branch=skill.branch||'Abilità';if(!branches.has(branch))branches.set(branch,[]);branches.get(branch).push([id,skill]);}
  const note=document.createElement('p');note.className='skill-tree-note';note.textContent=`Punti talento: ${Number(p.skillPoints||0)} · Si ottengono salendo di livello. Sblocca i nodi collegati e investi i punti nei rami che preferisci.`;root.appendChild(note);
  const map=document.createElement('div');map.className='skill-tree-map';root.appendChild(map);
  for(const [branch,skills] of branches){const column=document.createElement('section');column.className='skill-tree-branch';column.innerHTML=`<h3>${escapeHtml(branch)}</h3>`;map.appendChild(column);
    for(const [id,skill] of skills){const rank=skillRank(id,p),maxRank=Number(skill.max_rank||1),cost=Math.max(1,Number(skill.cost)||1),requires=skill.requires||{},missing=Object.entries(requires).filter(([required,value])=>skillRank(required,p)<Number(value)),roleAvailable=skill.role===p.playerClass,canBuy=roleAvailable&&rank<maxRank&&Number(p.skillPoints||0)>=cost&&!missing.length,node=document.createElement('button');node.type='button';node.className='skill-tree-node'+(rank>=maxRank?' mastered':canBuy?' ready':' locked');node.disabled=!canBuy;const requirement=!roleAvailable?`Ruolo richiesto: ${skill.role}`:missing.length?'Richiede: '+missing.map(([key,value])=>`${tree[key]?.name||humanize(key)} ${value}`).join(', '):`Costo: ${cost} ${cost===1?'punto':'punti talento'}`;node.innerHTML=`<span class="skill-node-rank">${rank>=maxRank?'COMPLETA':`GRADO ${rank}/${maxRank}`}</span><strong>${escapeHtml(skill.name)}</strong><span class="skill-node-description">${escapeHtml(skill.desc||'')}</span><span class="skill-node-requirement">${escapeHtml(requirement)}</span>`;node.addEventListener('click',()=>purchaseSkill(id));column.appendChild(node);}
  }
}
function renderCharacter(){
  const root=$('panelContent'),p=game.player;root.innerHTML='';unlockClassesByRequirements(false);
  root.appendChild(panelEntry(p.name,`${p.playerClass} · Livello ${p.level}`,`HP ${Math.round(p.hp)}/${Math.round(p.maxHp)} · ATK ${Math.round(p.attack)} · DIF ${Math.round(p.defense)} · MAG ${Math.round(p.magic)} · VEL ${p.speed}`));
  root.appendChild(panelEntry('Destino',`Oro ${p.gold} · Destino ${p.destiny||0} · Punti talento ${p.skillPoints||0}`,`La reputazione media è ${averageRep()}.`));
  const tabs=document.createElement('div');tabs.className='character-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Progressione del personaggio');root.appendChild(tabs);
  const views=[['available','Classi utilizzabili'],['locked','Classi bloccate'],['skills','Albero skill']];
  for(const [key,label] of views){const button=document.createElement('button');button.type='button';button.setAttribute('role','tab');button.setAttribute('aria-selected',String(characterSection===key));button.className='character-tab'+(characterSection===key?' active':'');button.textContent=label;button.addEventListener('click',()=>{characterSection=key;renderCharacter();});tabs.appendChild(button);}
  const view=document.createElement('section');view.className='character-view';root.appendChild(view);
  if(characterSection==='skills')renderSkillTree(view,p);else renderClassCatalog(view,characterSection==='locked');
}
function purchaseSkill(id){
  if(!game)return;
  const p=game.player,skill=content.registries.SKILL_TREE?.[id];if(!skill||skill.role!==p.playerClass)return;
  const rank=skillRank(id,p),cost=Math.max(1,Number(skill.cost)||1);
  if(rank>=Number(skill.max_rank||1)||Number(p.skillPoints||0)<cost)return;
  if(Object.entries(skill.requires||{}).some(([required,value])=>skillRank(required,p)<Number(value)))return;
  p.skillPoints-=cost;p.skillRanks=p.skillRanks||{};p.skillRanks[id]=rank+1;
  recalculateEquipmentStats(p);p.destiny=clamp(Number(p.destiny||0),0,destinyCapacity(p));characterSection='skills';
  updateHUD();saveGame(false);openPanel('character');toast(skill.name+' migliorata al grado '+(rank+1)+'.');
}
function renderInn(){
  const root=$('panelContent'),p=game.player,chapter=Number(currentStep?.chapter_number||1),cost=20+Math.min(60,Math.floor(Math.max(0,chapter-1)*1.5)),heal=Math.min(Math.max(0,p.maxHp-p.hp),Math.round(p.maxHp*.7));root.innerHTML='';
  root.appendChild(panelEntry('Una stanza tranquilla',`Faye · Capitolo ${roman(chapter)} · ${cost} oro`,`La zuppa e il riposo recuperano fino al 70% degli HP massimi. La locanda è un luogo sicuro tra una scena e l’altra.`));
  const button=document.createElement('button');button.className='inn-heal-button';button.textContent=heal?`Riposa · recupera ${heal} HP (${cost} oro)`:'Sei già in piena salute';button.disabled=!heal||Number(p.gold||0)<cost;
  button.addEventListener('click',()=>{if(Number(p.gold||0)<cost||p.hp>=p.maxHp)return;p.gold-=cost;p.hp=Math.min(p.maxHp,p.hp+Math.round(p.maxHp*.7));saveGame(false);updateHUD();renderInn();toast(`Hai riposato da Faye: −${cost} oro, salute ripristinata.`);});
  root.appendChild(button);if(Number(p.gold||0)<cost){const note=document.createElement('p');note.className='muted';note.textContent='Non hai abbastanza oro per pagare il riposo.';root.appendChild(note);}
}
function shopStock(){
  const chapter=Number(currentStep?.chapter_number||1),stock=[['pozione',10,'Sempre disponibile'],['antidoto',12,'Sempre disponibile'],['scudo_piccolo',18,'Sempre disponibile']];
  if(chapter>=4)stock.push(['pozione_grande',28,'Disponibile dal capitolo IV']);
  if(chapter>=10)stock.push(['pozione_eonica',65,'Disponibile dal capitolo X']);
  if(chapter>=20)stock.push(['elisir_quattro_simboli',95,'Disponibile dal capitolo XX']);
  return stock;
}
function renderShop(){
  const root=$('panelContent'),p=game.player;root.innerHTML='';root.appendChild(panelEntry('Banco del mercante',`Bren · ${Number(p.gold||0)} oro`,`Le scorte iniziano con i rimedi essenziali e si ampliano con il progredire della cronaca.`));
  for(const [id,price,unlock] of shopStock()){
    const item=content.registries.CONSUMABLES?.[id];if(!item)continue;
    const entry=panelEntry(item.name,`${price} oro · ${unlock}`,item.desc,`Compra · ${consumableCount(id,p)} possedute`,()=>{
      if(Number(p.gold||0)<price){toast('Oro insufficiente.');return;}
      p.gold-=price;if(!grantInventoryItem(id,'consumable',1)){p.gold+=price;console.error('Oggetto negozio non valido:',id);toast('Acquisto non riuscito: oggetto non disponibile.');return;}
      saveGame(false);renderShop();toast(`${item.name} acquistata.`);
    });
    const button=entry.querySelector('button');if(button)button.disabled=Number(p.gold||0)<price;
    entry.classList.add('shop-entry');root.appendChild(entry);
  }
}
function ensureEquipmentDurability(p=game?.player){
  if(!p)return {};
  if(!p.equipmentDurability||typeof p.equipmentDurability!=='object')p.equipmentDurability={};
  for(const slot of ['weapon','armor','shield']){
    const id=p[slot];if(!id)continue;
    const record=p.equipmentDurability[id];
    if(!record||typeof record!=='object')p.equipmentDurability[id]={current:100,max:100};
    else {record.max=100;record.current=clamp(Number(record.current??100),0,100);}
  }
  return p.equipmentDurability;
}
function equipmentCondition(slot,id=game?.player?.[slot],p=game?.player){
  if(!id)return null;const all=ensureEquipmentDurability(p),record=all[id]||{current:100,max:100};
  return {current:clamp(Number(record.current??100),0,100),max:100};
}
function wearEquipment(slot,amount){
  if(!game)return;const id=game.player[slot];if(!id)return;
  const all=ensureEquipmentDurability(game.player),record=all[id]||(all[id]={current:100,max:100});
  record.current=Math.max(0,Number(record.current??100)-amount);
  recalculateEquipmentStats(game.player);saveGame(false);
}
function repairForgeItem(slot,id){
  if(!game)return;
  const p=game.player,group=({weapon:'weapons',armor:'armors',shield:'shields'})[slot],owned=ensurePlayerInventory(p).equipment[group]||[];
  if(!group||!owned.includes(id)){toast('Questo oggetto non è più nella tua collezione.');return;}
  const records=ensureEquipmentDurability(p),record=records[id]||(records[id]={current:100,max:100});
  const missing=100-clamp(Number(record.current??100),0,100),cost=Math.ceil(missing*.18);
  if(!missing){toast('Questo oggetto è già in perfette condizioni.');return;}
  if(Number(p.gold||0)<cost){toast(`Servono ${cost} oro per la riparazione.`);return;}
  p.gold-=cost;record.current=100;recalculateEquipmentStats(p);updateHUD();saveGame(false);renderForge();toast(`Teren ha riparato l’oggetto: −${cost} oro.`);
}
function repairAllForgeEquipment(){
  if(!game)return;
  const p=game.player,records=ensureEquipmentDurability(p),slots=['weapon','armor','shield'],repairs=[];
  for(const slot of slots){const id=p[slot];if(!id)continue;const record=records[id]||(records[id]={current:100,max:100}),missing=100-clamp(Number(record.current??100),0,100);if(missing)repairs.push({slot,id,record,cost:Math.ceil(missing*.18)});}
  const total=repairs.reduce((sum,item)=>sum+item.cost,0);
  if(!repairs.length){toast('L’equipaggiamento è già in perfette condizioni.');return;}
  if(Number(p.gold||0)<total){toast(`Servono ${total} oro per riparare tutto l’equipaggiamento.`);return;}
  p.gold-=total;for(const item of repairs)item.record.current=100;
  recalculateEquipmentStats(p);updateHUD();saveGame(false);renderForge();toast(`Teren ha riparato l’equipaggiamento: −${total} oro.`);
}
function forgeWeaponStock(){
  if(!game)return [];
  const p=game.player,style=weaponStyleForId(p.weapon)||CLASS_WEAPON_STYLES[p.playerClass]||'sword';
  const list=Object.entries(content.registries.WEAPONS||{}).filter(([id,item])=>{
    const itemStyle=item.forgeStyle||weaponStyleForId(id);
    if(itemStyle!==style||id===p.weapon||Number(item.level||1)>Number(p.level||1))return false;
    return !ensurePlayerInventory(p).equipment.weapons.includes(id);
  }).map(([id,item])=>({id,item,price:Math.max(30,Math.round(Number(item.value||60)*.85))}));
  const chapter=Number(currentStep?.chapter_number||1);
  if(chapter>=4){
    for(const [id,item] of Object.entries(content.registries.WEAPONS||{})){
      const itemStyle=item.forgeStyle||weaponStyleForId(id),isOwned=ensurePlayerInventory(p).equipment.weapons.includes(id);
      if(itemStyle===style&&!isOwned&&Number(item.level||1)<=Number(p.level||1)&&!list.some(entry=>entry.id===id))list.push({id,item,price:Math.max(40,Math.round(Number(item.value||80)*.8))});
    }
  }
  return list.sort((a,b)=>Number(a.item.level||1)-Number(b.item.level||1)||Number(a.item.attack||0)+Number(a.item.magic||0)-Number(b.item.attack||0)-Number(b.item.magic||0));
}
function buyForgeWeapon(id,price){
  if(!game)return;const p=game.player,item=content.registries.WEAPONS?.[id];
  if(!item||Number(item.level||1)>Number(p.level||1)){toast('Non possiedi ancora il livello necessario per questa arma.');return;}
  if(ensurePlayerInventory(p).equipment.weapons.includes(id)){toast('Questa arma è già nella tua collezione.');return;}
  if(Number(p.gold||0)<price){toast('Oro insufficiente.');return;}
  p.gold-=price;if(!grantInventoryItem(id,'weapon')){p.gold+=price;console.error('Arma della forgia non valida:',id);toast('Acquisto non riuscito: arma non disponibile.');return;}
  saveGame(false);renderForge();toast(`${item.name} aggiunta alla collezione. Equipaggiala dall’inventario.`);
}
const FORGE_RUNES=[
  {id:'nucleo_braci',label:'Runa delle Braci',attack:7,magic:1},
  {id:'scheggia_gelo',label:'Runa del Gelo',attack:3,magic:5},
  {id:'cristallo_tuono',label:'Runa del Tuono',attack:5,magic:3},
  {id:'sigillo_sacro',label:'Runa Sacra',attack:2,magic:7},
  {id:'essenza_ombra',label:'Runa d’Ombra',attack:6,magic:4}
];
function inscribeForgeRune(rune){
  if(!game)return;
  const p=game.player,id=p.weapon,weapon=content.registries.WEAPONS?.[id],inv=ensurePlayerInventory(p);
  if(!weapon){toast('Equipaggia un’arma prima di inciderla.');return;}
  p.weaponRunes=p.weaponRunes||{};const upgrade=p.weaponRunes[id]||(p.weaponRunes[id]={level:0,attack:0,magic:0,inscription:''});
  const next=Number(upgrade.level||0)+1,costPowder=1+next;
  if(next>3){toast('Quest’arma ha raggiunto il limite di tre incisioni.');return;}
  if(Number(inv.materials?.polvere_runica||0)<costPowder||Number(inv.materials?.[rune.id]||0)<1){toast(`Servono ${costPowder} Polveri Runiche e una ${rune.label.toLowerCase()}.`);return;}
  inv.materials.polvere_runica-=costPowder;inv.materials[rune.id]--;
  upgrade.level=next;upgrade.attack=Number(upgrade.attack||0)+rune.attack;upgrade.magic=Number(upgrade.magic||0)+rune.magic;upgrade.inscription=rune.id;
  recalculateEquipmentStats(p);updateHUD();saveGame(false);renderForge();toast(`${weapon.name} incisa con ${rune.label}: +${rune.attack} ATK, +${rune.magic} MAG.`);
}
function renderForge(){
  const root=$('panelContent');if(!root||!game)return;const p=game.player;ensureEquipmentDurability(p);
  root.innerHTML='';const layout=document.createElement('div');layout.className='forge-layout';
  const smith=document.createElement('aside');smith.className='forge-smith';smith.innerHTML=`<div class="forge-smith-art" role="img" aria-label="Ritratto di Teren, il fabbro"><svg viewBox="0 0 180 230" aria-hidden="true"><defs><linearGradient id="terenApron" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#745343"/><stop offset="1" stop-color="#2b2223"/></linearGradient><radialGradient id="terenGlow"><stop stop-color="#ffc46f" stop-opacity=".85"/><stop offset="1" stop-color="#dc572e" stop-opacity="0"/></radialGradient></defs><circle cx="128" cy="50" r="44" fill="url(#terenGlow)"/><path d="M37 213Q42 132 66 112L57 95Q51 72 67 46Q82 22 107 34Q129 43 124 76L115 112Q145 139 150 213Z" fill="url(#terenApron)" stroke="#b48a58" stroke-width="3"/><ellipse cx="91" cy="72" rx="31" ry="38" fill="#c29476"/><path d="M59 66Q57 25 94 27Q128 28 123 67L111 51L93 47L72 57Z" fill="#392923"/><path d="M66 91Q88 116 113 91L109 115L70 116Z" fill="#49352c"/><path d="M73 73H82M101 73H110" stroke="#291f20" stroke-width="4" stroke-linecap="round"/><path d="M74 139L91 154L107 139" fill="none" stroke="#d0aa72" stroke-width="4"/><path d="M22 170L53 139L67 153L37 184Z" fill="#73777c" stroke="#d1ba8b" stroke-width="3"/><path d="M18 185L31 198" stroke="#4d3525" stroke-width="8" stroke-linecap="round"/><circle cx="143" cy="187" r="18" fill="#f2a64e" opacity=".8"/></svg></div><strong>Teren, Fabbro</strong><p>«Portami una lama consumata o una runa degna. Il metallo ricorda ogni colpo.»</p><div class="forge-wallet">✦ ${Number(p.gold||0).toLocaleString('it-IT')} oro</div>`;
  const main=document.createElement('section');main.className='forge-main';
  const tabs=document.createElement('div');tabs.className='forge-tabs';for(const [id,label] of [['repair','Riparazioni'],['weapons','Armeria'],['runes','Incisione runica']]){const tab=document.createElement('button');tab.type='button';tab.className='forge-tab'+(forgeTab===id?' active':'');tab.textContent=label;tab.setAttribute('aria-pressed',String(forgeTab===id));tab.addEventListener('click',()=>{forgeTab=id;renderForge();});tabs.appendChild(tab);}
  const workspace=document.createElement('div');workspace.className='forge-workspace';
  main.append(tabs,workspace);layout.append(smith,main);root.appendChild(layout);
  if(forgeTab==='repair')renderForgeRepairs(workspace);
  else if(forgeTab==='weapons')renderForgeWeapons(workspace);
  else renderForgeRunes(workspace);
}
function renderForgeRepairs(root){
  const p=game.player;root.innerHTML='<h3>Riparazione degli oggetti</h3><p class="forge-note">Le armi si consumano quando colpisci; armatura e scudo perdono integrità quando subisci un attacco. Un oggetto integro mantiene tutta la sua efficacia.</p>';
  const owned=ensurePlayerInventory(p).equipment;
  for(const [slot,group,label] of [['weapon','weapons','Arma'],['armor','armors','Armatura'],['shield','shields','Scudo']]){
    const table=content.registries[({weapon:'WEAPONS',armor:'ARMORS',shield:'SHIELDS'})[slot]]||{};
    for(const id of owned[group]||[]){
      const item=table[id];if(!item)continue;const condition=equipmentCondition(slot,id),missing=100-condition.current,cost=Math.ceil(missing*.18);
      const entry=document.createElement('div');entry.className='forge-item';
      entry.innerHTML=`<div class="forge-item-copy"><small>${label} · ${id===p[slot]?'EQUIPAGGIATO':'IN COLLEZIONE'}</small><strong>${escapeHtml(item.name||humanize(id))}</strong><div class="forge-condition"><i style="width:${condition.current}%"></i></div><span>Integrità ${Math.round(condition.current)}%</span></div>`;
      const button=document.createElement('button');button.type='button';button.className='forge-action';button.textContent=missing?`Ripara · ${cost} oro`:'Integro';button.disabled=!missing||Number(p.gold||0)<cost;button.addEventListener('click',()=>repairForgeItem(slot,id));entry.appendChild(button);root.appendChild(entry);
    }
  }
  const records=ensureEquipmentDurability(p),total=['weapon','armor','shield'].reduce((sum,slot)=>{const id=p[slot],missing=id?100-Number(records[id]?.current??100):0;return sum+(missing?Math.ceil(missing*.18):0);},0);
  const all=document.createElement('button');all.type='button';all.className='forge-action forge-repair-all';all.textContent=total?`Ripara tutto · ${total} oro`:'Equipaggiamento integro';all.disabled=!total||Number(p.gold||0)<total;all.addEventListener('click',repairAllForgeEquipment);root.appendChild(all);
}
function renderForgeWeapons(root){
  const p=game.player;root.innerHTML=`<h3>Armeria di Teren</h3><p class="forge-note">Armi rinforzate costruite per il tuo stile (${escapeHtml(p.playerClass)}). Le armi acquistate entrano nell’inventario: potrai equipaggiarle quando vuoi.</p>`;
  const stock=forgeWeaponStock();if(!stock.length){root.insertAdjacentHTML('beforeend','<div class="forge-empty">Hai già raccolto tutte le armi disponibili per il tuo livello.</div>');return;}
  for(const {id,item,price} of stock){
    const current=content.registries.WEAPONS?.[p.weapon]||{},power=Number(item.attack||0)+Number(item.magic||0),currentPower=Number(current.attack||0)+Number(current.magic||0);
    const entry=document.createElement('div');entry.className='forge-item';
    entry.innerHTML=`<div class="forge-item-copy"><small>ARMA · LIVELLO ${Number(item.level||1)} · ${power>=currentPower?'POTENZIAMENTO':'ALTERNATIVA'}</small><strong>${escapeHtml(item.name||humanize(id))}</strong><span>ATK ${Number(item.attack||0)} · MAG ${Number(item.magic||0)} · ${price} oro</span></div>`;
    const button=document.createElement('button');button.type='button';button.className='forge-action';button.textContent='Acquista';button.disabled=Number(p.gold||0)<price;button.addEventListener('click',()=>buyForgeWeapon(id,price));entry.appendChild(button);root.appendChild(entry);
  }
}
function renderForgeRunes(root){
  const p=game.player,inv=ensurePlayerInventory(p),weapon=content.registries.WEAPONS?.[p.weapon],record=(p.weaponRunes||{})[p.weapon]||{level:0,attack:0,magic:0};
  root.innerHTML=`<h3>Incisione runica</h3><p class="forge-note">${weapon?`Arma selezionata: <strong>${escapeHtml(weapon.name)}</strong> · incisioni ${Number(record.level||0)}/3 · bonus runico +${Number(record.attack||0)} ATK / +${Number(record.magic||0)} MAG.`:'Equipaggia un’arma per poter incidere le rune.'} Ogni incisione consuma Polvere Runica e una runa del tipo scelto.</p>`;
  if(!weapon)return;
  const next=Number(record.level||0)+1,powderCost=1+next,materials=Number(inv.materials?.polvere_runica||0);
  const note=document.createElement('div');note.className='forge-material-stock';note.textContent=`Polvere Runica: ${materials} · richiesta per la prossima incisione: ${powderCost}`;root.appendChild(note);
  if(next>3){root.insertAdjacentHTML('beforeend','<div class="forge-empty">Quest’arma ha raggiunto il limite di tre incisioni.</div>');return;}
  for(const rune of FORGE_RUNES){
    const quantity=Number(inv.materials?.[rune.id]||0),entry=document.createElement('div');entry.className='forge-item';
    entry.innerHTML=`<div class="forge-item-copy"><small>RUNA · POSSEDUTE ${quantity}</small><strong>${rune.label}</strong><span>+${rune.attack} ATK · +${rune.magic} MAG</span></div>`;
    const button=document.createElement('button');button.type='button';button.className='forge-action';button.textContent='Incidi';button.disabled=next>3||materials<powderCost||quantity<1;button.addEventListener('click',()=>inscribeForgeRune(rune));entry.appendChild(button);root.appendChild(entry);
  }
}
function renderSavePanel(){
  const root=$('panelContent');
  root.appendChild(panelEntry('Slot attuale',currentSlot>=0?`Slot ${currentSlot+1}`:'Nessuno',currentSlot>=0?'Salva la linea temporale attuale nello slot selezionato.':'Scegli uno slot per salvare questa cronaca.','Salva qui',()=>{if(currentSlot>=0)saveGame(true);else toast('Scegli uno slot disponibile qui sotto.');}));
  allSlots().forEach((s,i)=>{
    const st=s?content.chapters[clamp(s.stepIndex||0,0,content.chapters.length-1)]:null;
    const entry=panelEntry(`Slot ${i+1}`,s?`${s.player?.name||'Portatore'} · Lv ${s.player?.level||1}`:'Vuoto',s?`Cap. ${roman(st?.chapter_number||1)} · ${st?.title||''}`:'Nessuna cronaca salvata');
    const actions=document.createElement('div');actions.className='slot-actions';
    const load=document.createElement('button');load.textContent=s?'Carica':'Salva qui';load.disabled=!s;load.addEventListener('click',()=>{if(!s)return;if(!confirm('Caricare lo slot '+(i+1)+'? La sessione corrente resterà salvata nel suo slot.'))return;closePanel();loadGame(i);});actions.appendChild(load);
    if(game){const save=document.createElement('button');save.className='slot-overwrite';save.textContent=s?'Sovrascrivi':'Salva qui';save.addEventListener('click',()=>{if(s&&i!==currentSlot&&!confirm('Sovrascrivere lo slot '+(i+1)+'? La cronaca esistente verrà sostituita.'))return;currentSlot=i;saveGame(true);root.innerHTML='';renderSavePanel();});actions.appendChild(save);}
    if(s){const del=document.createElement('button');del.type='button';del.className='slot-delete';del.textContent='Elimina';del.addEventListener('click',()=>deleteSlot(i));actions.appendChild(del);}
    entry.querySelector('.panel-entry-body').appendChild(actions);root.appendChild(entry);
  });
}

function bossCatalog(){const out=[];for(const [catalog,table] of Object.entries(content.catalogs||{})){if(!/(BOSSES|MINIBOSSES|_BOSS$)/.test(catalog)||!table||typeof table!=='object'||Array.isArray(table))continue;for(const [id,b] of Object.entries(table)){if(b&&typeof b==='object'&&b.name&&Number(b.hp)>0)out.push({...b,id,catalog});}}return out;}
function findBossForStep(step){if(content?.redCrossStory)return null;const all=bossCatalog();const text=(step.title+' '+step.objective+' '+(step.dialogue||[]).map(x=>Array.isArray(x)?x.join(' '):'').join(' ')).toLowerCase();let best=all.find(b=>text.includes(String(b.name).toLowerCase()));if(best)return best;best=all.find(b=>b.scene&&b.scene===step.scene);if(best)return best;const ch=Number(step.chapter_number||1);const approx=all.filter(b=>{const m=b.catalog.match(/WORLD(\d+)/i);if(!m)return false;const w=Number(m[1]);return w===worldForStep(step);});return approx[0]||null;}
function startCombat(forceNew=false,savedBattle=null){
  if(currentBattle||!game)return;
  if(!savedBattle&&!forceNew&&game.suspendedBattle?.stepIndex===stepIndex){showBattleResumeOptions();return;}
  if(savedBattle){
    const raw=findBossForStep(currentStep);
    currentBattle={...savedBattle,source:raw,mesh:null};game.suspendedBattle=null;
  }else{
    const raw=findBossForStep(currentStep),baseLevel=game.player.level||1,settings=difficultySettings(),hpRaw=Number(raw?.hp||220+baseLevel*90),baseHp=hpRaw>20000?Math.min(18000,Math.round(1200+Math.log10(hpRaw)*1000)):hpRaw,attackRaw=Number(raw?.attack||12+baseLevel*5),baseAttack=Math.min(attackRaw,baseLevel*5+40),baseDefense=Math.min(Number(raw?.defense||baseLevel*1.8),baseLevel*2.5+12),hp=Math.max(1,settings.challenge===1?baseHp:Math.round(baseHp*settings.challenge)),attack=Math.max(1,settings.challenge===1?baseAttack:Math.round(baseAttack*settings.challenge)),defense=Math.max(0,settings.challenge===1?baseDefense:Math.round(baseDefense*settings.challenge));
    currentBattle={name:raw?.name||enemyNameForStep(currentStep),source:raw,hp,maxHp:hp,attack,defense,xp:Number(raw?.xp||100+baseLevel*25),gold:Number(raw?.gold||25+baseLevel*5),level:Number(raw?.level||baseLevel),turn:0,guarding:false,isBoss:/BOSS/.test(raw?.catalog||''),isMiniBoss:/MINIBOSS/.test(raw?.catalog||'')};
  }
  defending=false;battleResolved=false;spawnBattleEnemy();$('enemyName').textContent=currentBattle.name;$('combatLog').textContent=content.redCrossStory?'La simulazione è pronta. Coordina le azioni per completare la prova.':currentBattle.isBoss?'Il boss ti studia e prepara la sua strategia.':'Il nemico ti osserva. Scegli con attenzione la prossima azione.';$('combatActions').classList.remove('hidden');$('battleDecision').classList.add('hidden');$('combatBox').classList.remove('hidden');$('questCompleteBar').classList.add('hidden');updateCombatHUD();toast(content.redCrossStory?'Esercitazione avviata: '+currentBattle.name:'Incontro iniziato: '+currentBattle.name);
}
function showBattleResumeOptions(){
  const saved=game?.suspendedBattle;if(!saved)return;
  currentBattle={...saved,mesh:null};$('enemyName').textContent=saved.name;$('combatLog').textContent=`Nemico al ${Math.ceil(saved.hp)} / ${Math.ceil(saved.maxHp)} HP. Puoi riprendere lo scontro o affrontarlo da capo.`;$('combatActions').classList.add('hidden');$('battleDecision').classList.remove('hidden');$('combatBox').classList.remove('hidden');updateCombatHUD();inputLocked=true;
}
function resolveSuspendedBattle(restart){
  const saved=game?.suspendedBattle;if(!saved)return;
  $('battleDecision').classList.add('hidden');$('combatActions').classList.remove('hidden');$('combatBox').classList.add('hidden');inputLocked=false;currentBattle=null;
  if(restart){game.suspendedBattle=null;startCombat(true);}
  else startCombat(true,saved);
  saveGame(false);
}
function abandonBattle(){
  if(!currentBattle||!game||inputLocked)return;
  const b=currentBattle;
  game.suspendedBattle={stepIndex,name:b.name,hp:b.hp,maxHp:b.maxHp,attack:b.attack,defense:b.defense,xp:b.xp,gold:b.gold,level:b.level,turn:b.turn||0,guarding:!!b.guarding,isBoss:!!b.isBoss,isMiniBoss:!!b.isMiniBoss};
  if(b.mesh&&!b.mesh.isDisposed())b.mesh.dispose(false,true);
  currentBattle=null;$('combatBox').classList.add('hidden');$('combatActions').classList.remove('hidden');$('battleDecision').classList.add('hidden');inputLocked=false;saveGame(false);enterTownHub();toast('Scontro sospeso. Potrai riprenderlo o ricominciarlo tornando al sigillo.');
}
function enemyNameForStep(step){if(content?.redCrossStory)return 'Simulazione di soccorso';const t=(step.title+' '+step.objective).toLowerCase();if(t.includes('asterion'))return 'Asterion';if(t.includes('hexa'))return 'HEXA-0';if(t.includes('frattura'))return 'Frattura Minore';if(t.includes('null'))return 'Vestigio del Nulla';return 'Guardiano di '+(step.chapter_arc||'questa regione');}
function spawnBattleEnemy(){
  if(!actorRoot)return;
  const root=new BABYLON.TransformNode('battle_enemy',scene);root.position.set(0,0,5);root.parent=actorRoot;
  const palette=paletteFor(currentStep),isBoss=!!currentBattle.isBoss,isMiniBoss=!!currentBattle.isMiniBoss;
  const profile=characterProfile(currentBattle.name,palette.accent,false);
  profile.boss=isBoss;profile.miniBoss=isMiniBoss;profile.aura=isBoss||isMiniBoss||profile.aura;
  profile.creatureTail=/abiss|ombra|frattura|null|bestia|drago/i.test(currentBattle.name);
  if(/hexa|costrutto|golem/i.test(currentBattle.name)){profile.cloth='#29353d';profile.armor='#607682';profile.accent='#72e4ed';profile.weapon='hammer';profile.hood=false;}
  else if(/spettro|revenant|frattura|null/i.test(currentBattle.name)){profile.cloth='#211b31';profile.armor='#49324f';profile.accent='#cb75eb';profile.weapon='scythe';profile.hood=true;profile.robe=true;}
  else if(/regina|regn|monarca/i.test(currentBattle.name)){profile.cloth='#3c2334';profile.armor='#81545c';profile.accent='#f0bd77';profile.weapon='spear';profile.crown=true;}
  else if(/guardiano|custode|cavaliere|sentinella/i.test(currentBattle.name)){profile.cloth='#39343b';profile.armor='#786c5e';profile.accent='#e1c47d';profile.weapon='sword';}
  const model=buildHumanoid(root,currentBattle.name,profile,0);
  const scale=isBoss?1.62:isMiniBoss?1.32:1.08;model.scaling.set(scale,scale,scale);model.rotation.y=Math.PI;
  if(model.metadata?.animation)model.metadata.animation.baseRotationY=model.rotation.y;
  const glowMat=mat('enemy_aura_'+currentBattle.name.replace(/\W/g,''),profile.accent,profile.accent,.7);
  const aura=BABYLON.MeshBuilder.CreateTorus('enemy_aura',{diameter:isBoss ? 4.7 : isMiniBoss ? 3.7 : 2.8,thickness:isBoss ? .075 : .05,tessellation:40},scene);
  aura.position.y=.12;aura.rotation.x=Math.PI/2;aura.material=glowMat;aura.parent=root;aura.isPickable=false;
  const ring=BABYLON.MeshBuilder.CreateTorus('enemy_ring',{diameter:isBoss?3.3:2.4,thickness:.04,tessellation:32},scene);
  ring.position.y=isBoss?3.8:3.1;ring.rotation.x=Math.PI/2;ring.material=glowMat;ring.parent=root;ring.isPickable=false;
  root.metadata={model,aura,ring,phase:Math.random()*Math.PI*2,action:'idle',actionElapsed:0};
  currentBattle.mesh=root;
}
function setBattleEnemyAction(action){
  if(!currentBattle?.mesh||currentBattle.mesh.isDisposed())return;
  currentBattle.mesh.metadata.action=action;currentBattle.mesh.metadata.actionElapsed=0;
  const animation=currentBattle.mesh.metadata.model?.metadata?.animation;if(animation)animation.action=action;
}
function updateCombatHUD(){const b=currentBattle,p=game?.player,dieButton=document.querySelector('[data-action="die"]'),xrHint=$('xrDiceHint');if(xrHint)xrHint.classList.toggle('hidden',!isXRActive()||!b);$('enemyHpText').textContent=`${Math.max(0,Math.ceil(b?.hp||0)).toLocaleString('it-IT')} / ${Math.ceil(b?.maxHp||0).toLocaleString('it-IT')} HP`;$('enemyHpFill').style.width=`${clamp((b?.hp||0)/(b?.maxHp||1)*100,0,100)}%`;if(p){const cap=destinyCapacity(p);$('destinyText').textContent=`${Math.round(p.destiny||0)} / ${cap}`;$('destinyFill').style.width=`${clamp(Number(p.destiny||0)/cap*100,0,100)}%`;if(dieButton){dieButton.disabled=Number(p.destiny||0)<35;dieButton.title=Number(p.destiny||0)<35?'Servono 35 punti Destino per lanciare il Dado.':isXRActive()?'Muovi rapidamente la mano destra o il controller per lanciare il Dado; puoi anche selezionare questo comando.':'';dieButton.textContent=`${isXRActive()?'Gesto del Dado':'Lancia il Dado'} · 35`;}}updateHUD();}
function combatAction(action){if(!currentBattle||!game||inputLocked)return;const p=game.player;let dmg=0,log='';
  if(action==='potion'){if((p.inventory?.potions||0)<=0){$('combatLog').textContent='Non hai più pozioni.';return;}if(p.hp>=p.maxHp){$('combatLog').textContent='La tua salute è già al massimo.';return;}p.inventory.potions--;const heal=Number((content.registries.CONSUMABLES?.pozione?.desc||'').match(/(\d+)\s*HP/i)?.[1]||70);p.hp=Math.min(p.maxHp,p.hp+heal);log=`Bevi una pozione e recuperi ${Math.min(heal,p.maxHp-(p.hp-heal))} HP.`;}
  else if(action==='defend'){defending=true;log='Ti metti in guardia. Il prossimo colpo sarà ridotto.';}
  else if(action==='attack'){dmg=Math.max(10,Math.round((p.attack+p.level*2.4-currentBattle.defense*.65)*equippedDamageMultiplier()));const critical=Math.random()<clamp(Number(p.crit||0),0,.75);if(critical)dmg=Math.round(dmg*1.5);if(currentBattle.guarding){dmg=Math.round(dmg*.55);currentBattle.guarding=false;log=`${currentBattle.name} para parte del colpo. `;}currentBattle.hp-=dmg;log+=`${critical?'Colpo critico! ':''}Colpisci ${currentBattle.name} per ${dmg.toLocaleString('it-IT')} danni.`;gainDestiny(8);}
  else if(action==='skill'){dmg=Math.max(16,Math.round((p.magic*1.65+p.level*3-currentBattle.defense*.3)*equippedDamageMultiplier()));const critical=Math.random()<clamp(Number(p.crit||0),0,.75);if(critical)dmg=Math.round(dmg*1.5);if(currentBattle.guarding){dmg=Math.round(dmg*.55);currentBattle.guarding=false;log=`${currentBattle.name} para parte della tecnica. `;}currentBattle.hp-=dmg;log+=`${critical?'Colpo critico! ':''}La tua tecnica colpisce per ${dmg.toLocaleString('it-IT')} danni.`;spawnCombatFlash('#a77aff');}
  else if(action==='die'){rollCombatDie();return;}
  else if(action==='retreat'){abandonBattle();return;}
  if(action==='attack')wearEquipment('weapon',1);
  if(action==='defend')gainDestiny(10);
  $('combatLog').textContent=log;updateCombatHUD();if(currentBattle.hp<=0){winCombat();return;}enemyTurn();}
function rollCombatDie(){if(!currentBattle||!game)return;const cost=35;if(Number(game.player.destiny||0)<cost){$('combatLog').textContent=`Il Dado richiede ${cost} punti Destino. Attacca o difenditi per recuperarli.`;updateCombatHUD();return;}game.player.destiny-=cost;saveGame(false);inputLocked=true;updateCombatHUD();const die=createDie(playerRoot.position.add(new BABYLON.Vector3(1.8,2,0)),actorRoot);battleDie=die;let elapsed=0;const ob=scene.onBeforeRenderObservable.add(()=>{elapsed+=engine.getDeltaTime()/1000;die.rotation.x+=.28;die.rotation.y+=.37;die.position.y+=Math.sin(elapsed*16)*.025;if(elapsed>.95){scene.onBeforeRenderObservable.remove(ob);if(!currentBattle){die.dispose(false,true);battleDie=null;inputLocked=false;return;}const face=1+Math.floor(Math.random()*6),skillBonus=1+skillRank('loaded_fate')*.12+skillRank('destiny_overcharge')*.07+skillRank('fracture_control')*.04+(face===5?skillRank('soul_dice')*.1:0);let dmg=Math.round((game.player.attack+game.player.magic*.7+game.player.level*2)*(1+face*.43)*equippedDamageMultiplier()*skillBonus);if(currentBattle.guarding){dmg=Math.round(dmg*.55);currentBattle.guarding=false;}$('combatLog').textContent=`Il Dado ruota, si ferma sulla faccia ${face}: ${dmg.toLocaleString('it-IT')} danni. −${cost} Destino.`;currentBattle.hp-=dmg;die.dispose(false,true);battleDie=null;inputLocked=false;updateCombatHUD();if(currentBattle.hp<=0)winCombat();else enemyTurn();}});}
function spawnCombatFlash(hex){const flash=makeSphere('combat_flash',playerRoot.position.add(new BABYLON.Vector3(0,1,1.5)),1.8,mat('combat_flash_mat',hex,hex,.55),actorRoot,8);setTimeout(()=>{if(flash&&!flash.isDisposed())flash.dispose();},360);}
function handlePlayerDefeat(battle){
  if(currentBattle!==battle||!game)return;
  if(battle.mesh&&!battle.mesh.isDisposed())battle.mesh.dispose(false,true);
  currentBattle=null;game.suspendedBattle=null;game.defeats=(Number(game.defeats)||0)+1;
  const chapter=Number(currentStep?.chapter_number||1),start=route.findIndex(step=>Number(step.chapter_number||1)===chapter);
  stepIndex=start>=0?start:0;game.stepIndex=stepIndex;game.player.hp=Math.max(1,Math.round(game.player.maxHp*.5));battleResolved=false;inputLocked=false;
  $('combatBox').classList.add('hidden');$('combatActions').classList.remove('hidden');$('battleDecision').classList.add('hidden');
  saveGame(false);startStep(false);if(playerRoot){playerRoot.position.set(0,.9,-8);if(camera)camera.setTarget(playerRoot.position.add(new BABYLON.Vector3(0,1,0)));}toast(`Sei stato sconfitto. Torni all’inizio del capitolo ${roman(chapter)} con metà dei tuoi HP: puoi rifornirti, riposare o riprovare.`);
}
function enemyTurn(){
  if(!currentBattle)return;const battle=currentBattle;inputLocked=true;
  setBattleEnemyAction('attack');
  setTimeout(()=>{
    if(currentBattle!==battle||!game){inputLocked=false;return;}
    const p=game.player,isElite=battle.isBoss||battle.isMiniBoss;battle.turn=(battle.turn||0)+1;
    if(isElite&&battle.turn%3===0){battle.guarding=true;setBattleEnemyAction('guard');$('combatLog').textContent=`${battle.name} si chiude in difesa, preparandosi al prossimo colpo.`;updateCombatHUD();inputLocked=false;return;}
    setBattleEnemyAction('idle');
    let dmg=Math.max(5,Math.round((battle.attack-p.defense*.42)*(isElite&&battle.turn%4===0?1.5:1)));
    if(/null|nullombra/i.test(battle.name))dmg=Math.round(dmg*(1-skillRank('null_resistance')*.03));
    if(defending){dmg=Math.round(dmg*.45);defending=false;}
    const shieldItem=content.registries.SHIELDS?.[p.shield],block=clamp(Number(shieldItem?.block||0),0,.9);
    if(block>0&&Math.random()<block){wearEquipment('shield',1);$('combatLog').textContent=`${battle.name} attacca, ma ${shieldItem?.name||'lo scudo'} annulla il colpo.`;updateCombatHUD();inputLocked=false;return;}
    const absorbed=Math.min(Math.max(0,Number(p.tempShield||0)),dmg);if(absorbed){p.tempShield=Math.max(0,Number(p.tempShield||0)-absorbed);dmg-=absorbed;}
    p.hp-=dmg;
    const quote=isElite&&battle.turn%2===0?' «La tua prossima scelta non cambierà il mio destino.»':'';
    $('combatLog').textContent=`${battle.name}${quote} ti infligge ${dmg.toLocaleString('it-IT')} danni.${absorbed?' La barriera assorbe '+absorbed+' danni.':''}${isElite&&battle.turn%4===0?' È un attacco devastante!':''}`;
    if(p.hp<=0){handlePlayerDefeat(battle);return;}
    wearEquipment('armor',2);wearEquipment('shield',1);
    updateCombatHUD();inputLocked=false;
  },430);
}
function winCombat(){
  if(!currentBattle)return;
  const b=currentBattle,p=game.player,settings=difficultySettings(),xpReward=Math.round(b.xp*settings.rewards),goldReward=Math.round(b.gold*settings.rewards);
  p.xp+=xpReward;p.gold+=goldReward;
  if(b.source?.flag)p.flags[b.source.flag]=true;
  p.hp=Math.min(p.maxHp,p.hp+Math.round(p.maxHp*.2));
  let loot='';
  const materials=Object.keys(content.registries.MATERIALS||{}),baseChance=.06+skillRank('hunter_instinct')*.08+skillRank('ancient_loot')*.1+Math.max(0,Number(p.luck||0))*.001,chance=Math.min(.75,baseChance*settings.loot);
  if(materials.length&&Math.random()<chance){const material=materials[Math.floor(Math.random()*materials.length)];if(grantInventoryItem(material,'material',1))loot=' · materiale bonus';}
  if(b.mesh&&!b.mesh.isDisposed())b.mesh.dispose(false,true);
  currentBattle=null;game.suspendedBattle=null;battleResolved=true;inputLocked=false;$('combatBox').classList.add('hidden');
  toast('Vittoria: '+b.name+' · +'+xpReward+' XP · +'+goldReward+' oro'+loot);
  afterNarrative();updateHUD();saveGame(false);unlockClassesByRequirements();
}

function pauseGame(){if(!game)return;$('pauseScreen').classList.remove('hidden');inputLocked=true;}
function resumeGame(){$('pauseScreen').classList.add('hidden');inputLocked=false;}
function handleKeyDown(e){if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;if(!$('introScreen').classList.contains('hidden')){if(['ArrowRight','ArrowLeft','Enter','Space','Backspace','Escape'].includes(e.code))e.preventDefault();if(e.repeat)return;if(['ArrowRight','Enter','Space','KeyE'].includes(e.code))nextIntro();else if(['ArrowLeft','Backspace'].includes(e.code))previousIntro();else if(e.code==='Escape')skipIntro();return;}if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();keys[e.code]=true;if(e.repeat)return;if(e.code==='KeyE')interact();if(e.code==='KeyJ'&&game)openPanel('journal');if(e.code==='KeyI'&&game)openPanel('inventory');if(e.code==='KeyC'&&game)openPanel('character');if(e.code==='KeyV'&&game&&playerRoot&&camera){camera.setTarget(playerRoot.position.add(new BABYLON.Vector3(0,1.05,0)));camera.alpha=-Math.PI/2;camera.beta=1.12;camera.radius=13;toast('Visuale ricentrata.');}if(e.code==='Escape'){if(game&&!$('pauseScreen').classList.contains('hidden'))resumeGame();else if(game&&$('sidePanel').classList.contains('hidden'))pauseGame();else if(game)closePanel();}}
function handleKeyUp(e){keys[e.code]=false;}

// UI wiring
$('newGameBtn').addEventListener('click',()=>startIntro('new','lore'));
$('changeDeviceBtn').addEventListener('click',showDeviceSelection);
document.querySelectorAll('[data-device-mode]').forEach(button=>button.addEventListener('click',()=>chooseDeviceMode(button.dataset.deviceMode)));
$('enterXRBtn').addEventListener('click',enterQuestVR);
$('guideLoreBtn').addEventListener('click',()=>startIntro('guide','lore'));$('guideDieBtn').addEventListener('click',()=>startIntro('guide','die'));$('guideControlsBtn').addEventListener('click',()=>startIntro('guide','controls'));
$('introGuideTabs').addEventListener('click',event=>{const button=event.target.closest('[data-intro-guide-mode]');if(!button)return;introGuideMode=button.dataset.introGuideMode;renderIntro();});
$('introBackBtn').addEventListener('click',previousIntro);$('introSkipBtn').addEventListener('click',skipIntro);$('introNextBtn').addEventListener('click',nextIntro);
$('nearPrompt').addEventListener('click',interact);
$('touchInteractBtn').addEventListener('click',interact);
let touchLookPointer=null,touchLookLast=null;
$('touchLookPad').addEventListener('pointerdown',event=>{
  event.preventDefault();event.stopPropagation();
  if(deviceMode!=='mobile'||!game||!camera||inputLocked||dialogueVisible||currentBattle||pendingChoice||!$('sidePanel').classList.contains('hidden')||!$('pauseScreen').classList.contains('hidden'))return;
  touchLookPointer=event.pointerId;touchLookLast={x:event.clientX,y:event.clientY};
  $('touchLookPad').classList.add('active');$('touchLookPad').setPointerCapture(event.pointerId);
});
$('touchLookPad').addEventListener('pointermove',event=>{
  if(event.pointerId!==touchLookPointer||!camera||!touchLookLast)return;
  event.preventDefault();
  const dx=event.clientX-touchLookLast.x,dy=event.clientY-touchLookLast.y;
  camera.alpha-=dx*.008;camera.beta=clamp(camera.beta+dy*.006,.48,1.42);
  touchLookLast={x:event.clientX,y:event.clientY};
});
const releaseTouchLook=event=>{
  if(event.pointerId!==touchLookPointer)return;
  touchLookPointer=null;touchLookLast=null;$('touchLookPad').classList.remove('active');
};
$('touchLookPad').addEventListener('pointerup',releaseTouchLook);
$('touchLookPad').addEventListener('pointercancel',releaseTouchLook);
$('touchLookPad').addEventListener('lostpointercapture',releaseTouchLook);
$('quickHelpBtn').addEventListener('click',()=>toggleQuickHelp());
$('quickHelpCloseBtn').addEventListener('click',()=>toggleQuickHelp(false));
$('quickHelpDoneBtn').addEventListener('click',()=>toggleQuickHelp(false));
document.querySelectorAll('[data-touch-action]').forEach(button=>{
  button.addEventListener('pointerdown',event=>{
    event.preventDefault();
    if(!game||inputLocked||currentBattle||pendingChoice||dialogueVisible)return;
    const codes=keyboardBindings[button.dataset.touchAction]||[];
    touchPointerCodes.set(event.pointerId,codes);
    for(const code of codes)touchKeys.add(code);
    button.classList.add('pressed');
    button.setPointerCapture(event.pointerId);
  });
  const release=event=>{
    const codes=touchPointerCodes.get(event.pointerId);
    if(!codes)return;
    touchPointerCodes.delete(event.pointerId);
    for(const code of codes){
      if(![...touchPointerCodes.values()].some(active=>active.includes(code)))touchKeys.delete(code);
    }
    button.classList.remove('pressed');
  };
  button.addEventListener('pointerup',release);
  button.addEventListener('pointercancel',release);
  button.addEventListener('lostpointercapture',release);
});
$('continueBtn').addEventListener('click',()=>{slotMode='load';populateSlotScreen();showScreen('slotScreen');});
$('archiveBtn').addEventListener('click',()=>{renderArchive();showScreen('archiveScreen');});
$('backTitleBtn').addEventListener('click',()=>showScreen('titleScreen'));
$('beginBtn').addEventListener('click',()=>{slotMode='new';showScreen('difficultyScreen');});
$('difficultyScreen').querySelectorAll('[data-difficulty]').forEach(button=>button.addEventListener('click',()=>{
  selectedDifficulty=normalizedDifficulty(button.dataset.difficulty);
  $('difficultyScreen').querySelectorAll('[data-difficulty]').forEach(option=>{
    const active=option.dataset.difficulty===selectedDifficulty;
    option.classList.toggle('selected',active);
    option.setAttribute('aria-pressed',String(active));
  });
}));
$('difficultyBackBtn').addEventListener('click',()=>showScreen('classScreen'));
$('difficultyContinueBtn').addEventListener('click',()=>{populateSlotScreen();showScreen('slotScreen');});
$('appearanceSkin').addEventListener('input',updateClassPreview);
$('appearanceHairStyle').addEventListener('input',updateClassPreview);
$('appearanceHairColor').addEventListener('input',updateClassPreview);
$('appearanceOutfit').addEventListener('input',updateClassPreview);
$('appearanceOutfitColor').addEventListener('input',updateClassPreview);
$('backSlotBtn').addEventListener('click',()=>showScreen(slotMode==='new'?'difficultyScreen':'titleScreen'));
$('closeArchiveBtn').addEventListener('click',()=>showScreen('titleScreen'));
$('archiveSearch').addEventListener('input',renderArchive);$('arcFilter').addEventListener('change',renderArchive);
$('dialogueNext').addEventListener('click',()=>{if(game&&currentStep)advanceDialogue();else{game=null;$('gameUI').classList.add('hidden');showScreen('titleScreen');buildTitleWorld();}});
$('completeStepBtn').addEventListener('click',completeStep);
$('missionCloseBtn').addEventListener('click',closeMissionActivity);
$('missionBody').addEventListener('click',event=>{const button=event.target.closest('[data-mission-action]');if(button)handleMissionAction(button);});
$('missionBody').addEventListener('change',event=>{const select=event.target.closest('[data-mission-select]');if(select)handleMissionSelect(select);});
$('closePanelBtn').addEventListener('click',closePanel);$('panelShade').addEventListener('click',closePanel);
$('mapToggleBtn').addEventListener('click',()=>toggleLocalMap());$('closeMapBtn').addEventListener('click',()=>toggleLocalMap(false));$('mapBackdrop').addEventListener('click',()=>toggleLocalMap(false));
$('areaMapTab').addEventListener('click',()=>setMapTab('area'));$('worldMapTab').addEventListener('click',()=>setMapTab('worlds'));
$('hubToggleBtn').addEventListener('click',toggleTownHub);
$('resumeBattleBtn').addEventListener('click',()=>resolveSuspendedBattle(false));$('restartBattleBtn').addEventListener('click',()=>resolveSuspendedBattle(true));
$('laterBattleBtn').addEventListener('click',()=>{$('battleDecision').classList.add('hidden');$('combatBox').classList.add('hidden');currentBattle=null;inputLocked=false;});
document.querySelectorAll('[data-panel]').forEach(b=>b.addEventListener('click',()=>openPanel(b.dataset.panel)));
document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>combatAction(b.dataset.action)));
$('resumeBtn').addEventListener('click',resumeGame);$('pauseSaveBtn').addEventListener('click',()=>{saveGame(true);resumeGame();});$('pauseHubBtn').addEventListener('click',()=>{$('pauseScreen').classList.add('hidden');inputLocked=false;if(currentBattle)abandonBattle();else toggleTownHub();});$('pauseTitleBtn').addEventListener('click',()=>{saveGame(false);if(mpRole!=='offline')mpDisconnect(false);game=null;hubMode=false;hubReturnPosition=null;inputLocked=false;$('gameUI').classList.add('hidden');$('pauseScreen').classList.add('hidden');showScreen('titleScreen');buildTitleWorld();});
$('multiplayerTitleBtn')?.addEventListener('click',mpOpen);$('pauseMultiplayerBtn')?.addEventListener('click',()=>{mpOpen();if(game&&mpRole==='offline'){$('mpHostActions').classList.add('hidden');$('mpCodeWrap').classList.add('hidden');$('mpRoomDisplay').classList.add('hidden');mpSetStatus('Puoi ospitare questa partita: il salvataggio principale rimarrà su questo dispositivo.');const b=document.createElement('button');b.id='mpHostCurrentBtn';b.className='gold-button';b.textContent='Ospita questa cronaca';b.addEventListener('click',()=>{b.remove();mpClose();mpStartHost();});$('mpHostActions').classList.remove('hidden');$('mpHostActions').prepend(b);}});$('mpCreateBtn')?.addEventListener('click',mpCreateNew);$('mpJoinShowBtn')?.addEventListener('click',mpShowJoin);$('mpJoinBtn')?.addEventListener('click',()=>{const code=$('mpRoomCode').value.trim();mpPendingCode=code;mpPendingAction='join-new';mpClose();startIntro('new','lore');});$('mpCopyCodeBtn')?.addEventListener('click',()=>{const code=mpRoomCode.toUpperCase();if(navigator.clipboard?.writeText)navigator.clipboard.writeText(code).then(()=>toast('Codice copiato: '+code)).catch(()=>toast('Codice stanza: '+code));else toast('Codice stanza: '+code);});$('mpCloseBtn')?.addEventListener('click',mpClose);
$('dialogueNext').addEventListener('dblclick',()=>{});
window.addEventListener('keydown',handleKeyDown);window.addEventListener('keyup',handleKeyUp);
window.addEventListener('blur',()=>{touchKeys.clear();touchPointerCodes.clear();document.querySelectorAll('[data-touch-action].pressed').forEach(button=>button.classList.remove('pressed'));});
window.addEventListener('beforeunload',()=>{if(game)saveGame(false);});

function unlockClassesByRequirements(notify=true){
  if(!game)return [];const p=game.player;p.unlockedClasses=Array.isArray(p.unlockedClasses)?p.unlockedClasses:[];p.classMastery=p.classMastery||{};p.titles=p.titles||[];const starters=content.registries.STARTER_CLASSES||STARTER_FALLBACK,newlyUnlocked=[];
  for(const name of Object.keys(content.registries.CLASS_DATA||{})){const req=content.registries.CLASS_UNLOCK_QUESTS?.[name]||CLASS_UNLOCK_FALLBACKS[name];if(!req||starters.includes(name)||p.unlockedClasses.includes(name))continue;const state=classUnlockStatus(name,p);if(!state.unlocked)continue;p.unlockedClasses.push(name);if(req.material){p.inventory.materials[req.material]=Math.max(0,Number(p.inventory.materials[req.material]||0)-Number(req.amount||1));}if(req.title&&!p.titles.includes(req.title))p.titles.push(req.title);newlyUnlocked.push(name);}
  if(newlyUnlocked.length){saveGame(false);if(notify)toast(`Nuove classi sbloccate: ${newlyUnlocked.join(', ')}.`);}return newlyUnlocked;
}
const _oldCompleteStep=completeStep;
completeStep=function(){const player=game?.player,finished=currentStep,next=route[stepIndex+1];if(player&&finished&&(!next||next.chapter_number!==finished.chapter_number)){player.classMastery=player.classMastery||{};player.classMastery[player.playerClass]=Number(player.classMastery[player.playerClass]||0)+1;}
  _oldCompleteStep();unlockClassesByRequirements();};



// ===== Web Edition alpha 0.1.5 visual overhaul =====
let ambientLight=null,sunLight=null,moonLight=null,shadowGenerator=null;
let skyDome=null,skyMaterial=null,skyTexture=null,celestialRoot=null,starRoot=null,cloudRoot=null,rainRoot=null;
let sunOrb=null,moonOrb=null,starMeshes=[],cloudMeshes=[],rainDrops=[],weatherMaterial=null;
let currentWeather='sereno',nextWeatherChange=Date.now()+240000,lastSkyTextureUpdate=0,lastClockMinute='',settingsFromPause=false;
let realWeatherEnabled=false,weatherCoordinates=null,weatherCloudCover=0,realSunriseMinutes=null,realSunsetMinutes=null,weatherLocalMinutes=null,weatherTimeUpdatedAt=0,weatherRequestInProgress=false,lastRealWeatherFetch=0;
let inventoryCategory='weapon',selectedInventoryItem=null,pendingRebind=null,connectedGamepadIndex=-1,itemIconCounter=0;
let gamepadAxes={x:0,y:0},gamepadButtonStates=Object.create(null);
const CONTROL_SETTINGS_KEY='chroniclesOfDestinyWeb.settings';
const DEFAULT_KEYBOARD_BINDINGS={moveForward:['KeyW','ArrowUp'],moveBackward:['KeyS','ArrowDown'],moveLeft:['KeyA','ArrowLeft'],moveRight:['KeyD','ArrowRight'],interact:['KeyE'],journal:['KeyJ'],inventory:['KeyI'],character:['KeyC'],pause:['Escape'],cameraReset:['KeyV'],attack:['KeyX'],skill:['KeyQ'],die:['KeyR'],potion:['KeyF'],defend:['ShiftLeft']};
const DEFAULT_GAMEPAD_BINDINGS={interact:0,journal:8,inventory:3,character:4,pause:9,cameraReset:10,attack:2,skill:5,die:1,potion:4,defend:7};
let keyboardBindings=JSON.parse(JSON.stringify(DEFAULT_KEYBOARD_BINDINGS));
let gamepadBindings={...DEFAULT_GAMEPAD_BINDINGS};
const CONTROL_LABELS={moveForward:'Muovi avanti',moveBackward:'Muovi indietro',moveLeft:'Muovi a sinistra',moveRight:'Muovi a destra',interact:'Interagisci / Conferma',journal:'Missioni e diario',inventory:'Inventario',character:'Personaggio',pause:'Pausa / Indietro',cameraReset:'Ricentra telecamera',attack:'Attività',skill:'Tecnica',die:'Dado della missione',potion:'Kit di aiuto',defend:'Difendi'};
const CONTROL_GROUPS={movement:['moveForward','moveBackward','moveLeft','moveRight'],general:['interact','journal','inventory','character','cameraReset','pause'],combat:['attack','skill','die','potion','defend']};
const GAMEPAD_BUTTON_LABELS=['A / Croce','B / Cerchio','X / Quadrato','Y / Triangolo','LB / L1','RB / R1','LT / L2','RT / R2','View / Share','Start / Options','L3','R3','D-pad ↑','D-pad ↓','D-pad ←','D-pad →'];
const WEATHER_LABELS={sereno:'Cielo sereno',nuvoloso:'Cielo nuvoloso',pioggia:'Pioggia',nebbia:'Nebbia'};
const RARITY_COLORS={'comune':'#aaa49b','non comune':'#79b7a7','raro':'#79a9e8','epico':'#b78be4','leggendario':'#d6ad63','mitico':'#e68a83','trascendente':'#9be4df','reliquia':'#e6c77c','primordiale':'#ed9de2','ancestrale':'#e5a86f'};

function loadControlSettings(){
  try{const saved=JSON.parse(localStorage.getItem(CONTROL_SETTINGS_KEY)||'null');if(saved?.keyboard){for(const [k,v] of Object.entries(saved.keyboard))if(Array.isArray(v)&&v.every(x=>typeof x==='string'))keyboardBindings[k]=v;}if(keyboardBindings.attack.length===1&&keyboardBindings.attack[0]==='Space')keyboardBindings.attack=['KeyX'];if(saved?.gamepad){for(const [k,v] of Object.entries(saved.gamepad))if(Number.isInteger(v)&&v>=0&&v<32)gamepadBindings[k]=v;}}catch(e){console.warn('Impostazioni controlli non leggibili',e);}
}
function saveControlSettings(){try{localStorage.setItem(CONTROL_SETTINGS_KEY,JSON.stringify({keyboard:keyboardBindings,gamepad:gamepadBindings}));}catch(e){console.warn('Impossibile salvare le impostazioni dei controlli',e);}refreshControlsHint();}
function isActionKeyDown(action){const codes=keyboardBindings[action]||[];return codes.some(code=>!!keys[code]||touchKeys.has(code));}
function isCodeBound(action,code){return (keyboardBindings[action]||[]).includes(code);}
function keyLabel(code){const names={Space:'Spazio',Escape:'Esc',ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→',ShiftLeft:'Maiusc sinistro',ShiftRight:'Maiusc destro',ControlLeft:'Ctrl',AltLeft:'Alt',Enter:'Invio',Backspace:'Backspace',Tab:'Tab'};if(names[code])return names[code];if(/^Key[A-Z]$/.test(code))return code.slice(3);if(/^Digit\d$/.test(code))return code.slice(5);if(/^Numpad/.test(code))return 'Num '+code.slice(6);return code;}
function keyboardBindingLabel(action){return (keyboardBindings[action]||[]).map(keyLabel).join(' / ')||'Non assegnato';}
function gamepadBindingLabel(action){const n=gamepadBindings[action];return GAMEPAD_BUTTON_LABELS[n]||('Pulsante '+(n+1));}
function refreshControlsHint(){
  const el=$('controlsHint');if(!el)return;
  if(deviceMode==='mobile'){el.textContent='Muovi le frecce a sinistra e trascina Guarda intorno per ruotare la visuale. Tocca Parla per interagire.';return;}
  if(deviceMode==='quest'){el.textContent='Stick sinistro: muovi · Grilletto destro: interagisci · Muovi la testa per guardarti intorno.';return;}
  el.innerHTML=`<span>${escapeHtml(keyboardBindingLabel('moveForward'))} / ${escapeHtml(keyboardBindingLabel('moveLeft'))}…</span> Muovi <span>${escapeHtml(keyboardBindingLabel('interact'))}</span> Parla <span>M</span> Mappa <span>${escapeHtml(keyboardBindingLabel('pause'))}</span> Pausa`;
}
function beginRebind(kind,action){pendingRebind={kind,action};if(game&&$('sidePanel')&&!$('sidePanel').classList.contains('hidden'))renderSettings($('panelContent'));else if($('settingsScreenContent'))renderSettings($('settingsScreenContent'));toast(kind==='keyboard'?'Premi il nuovo tasto per “'+(CONTROL_LABELS[action]||action)+'”. Premi Esc per annullare.':'Premi il pulsante del controller da assegnare a “'+(CONTROL_LABELS[action]||action)+'”.');}
function finishKeyboardRebind(code){if(!pendingRebind||pendingRebind.kind!=='keyboard')return;const action=pendingRebind.action;if(code==='Escape'){pendingRebind=null;renderSettings($('sidePanel')&&!$('sidePanel').classList.contains('hidden')?$('panelContent'):$('settingsScreenContent'));toast('Rimappatura annullata.');return;}keyboardBindings[action]=[code];pendingRebind=null;saveControlSettings();renderSettings($('sidePanel')&&!$('sidePanel').classList.contains('hidden')?$('panelContent'):$('settingsScreenContent'));toast('Tasto aggiornato: '+(CONTROL_LABELS[action]||action)+' → '+keyLabel(code));}
function beginGamepadRebind(action){pendingRebind={kind:'gamepad',action};renderSettings($('sidePanel')&&!$('sidePanel').classList.contains('hidden')?$('panelContent'):$('settingsScreenContent'));toast('Premi ora il pulsante desiderato sul controller.');}
function finishGamepadRebind(buttonIndex){if(!pendingRebind||pendingRebind.kind!=='gamepad')return;const action=pendingRebind.action;gamepadBindings[action]=buttonIndex;pendingRebind=null;saveControlSettings();renderSettings($('sidePanel')&&!$('sidePanel').classList.contains('hidden')?$('panelContent'):$('settingsScreenContent'));toast('Pulsante aggiornato: '+(CONTROL_LABELS[action]||action)+' → '+gamepadBindingLabel(action));}
function resetControlSettings(){keyboardBindings=JSON.parse(JSON.stringify(DEFAULT_KEYBOARD_BINDINGS));gamepadBindings={...DEFAULT_GAMEPAD_BINDINGS};pendingRebind=null;saveControlSettings();renderSettings($('sidePanel')&&!$('sidePanel').classList.contains('hidden')?$('panelContent'):$('settingsScreenContent'));toast('Configurazione dei comandi ripristinata.');}

function createSkySystem(){
  if(!scene)return;
  skyTexture=new BABYLON.DynamicTexture('real_time_sky_texture',{width:512,height:256},scene,false);skyTexture.hasAlpha=false;
  skyMaterial=new BABYLON.StandardMaterial('real_time_sky_material',scene);skyMaterial.backFaceCulling=false;skyMaterial.disableLighting=true;skyMaterial.emissiveColor=new BABYLON.Color3(1,1,1);skyMaterial.diffuseColor=new BABYLON.Color3(1,1,1);skyMaterial.emissiveTexture=skyTexture;skyMaterial.diffuseTexture=skyTexture;skyMaterial.specularColor=new BABYLON.Color3(0,0,0);skyMaterial.fogEnabled=false;
  skyDome=BABYLON.MeshBuilder.CreateSphere('real_time_sky_dome',{diameter:500,segments:24},scene);skyDome.material=skyMaterial;skyDome.infiniteDistance=true;skyDome.isPickable=false;skyDome.applyFog=false;skyDome.renderingGroupId=0;
  celestialRoot=new BABYLON.TransformNode('celestial_root',scene);starRoot=new BABYLON.TransformNode('star_root',scene);cloudRoot=new BABYLON.TransformNode('weather_cloud_root',scene);rainRoot=new BABYLON.TransformNode('weather_rain_root',scene);
  const sunMat=new BABYLON.StandardMaterial('sun_orb_material',scene);sunMat.disableLighting=true;sunMat.emissiveColor=new BABYLON.Color3(1,.78,.43);sunMat.diffuseColor=new BABYLON.Color3(1,.78,.43);
  sunOrb=BABYLON.MeshBuilder.CreateSphere('sun_orb',{diameter:7,segments:20},scene);sunOrb.material=sunMat;sunOrb.parent=celestialRoot;sunOrb.isPickable=false;sunOrb.renderingGroupId=1;
  const moonMat=new BABYLON.StandardMaterial('moon_orb_material',scene);moonMat.disableLighting=true;moonMat.emissiveColor=new BABYLON.Color3(.58,.68,.9);moonMat.diffuseColor=new BABYLON.Color3(.64,.7,.85);
  moonOrb=BABYLON.MeshBuilder.CreateSphere('moon_orb',{diameter:4.7,segments:18},scene);moonOrb.material=moonMat;moonOrb.parent=celestialRoot;moonOrb.isPickable=false;moonOrb.renderingGroupId=1;
  const starMat=new BABYLON.StandardMaterial('star_material',scene);starMat.disableLighting=true;starMat.emissiveColor=new BABYLON.Color3(.82,.88,1);starMat.diffuseColor=new BABYLON.Color3(.82,.88,1);
  for(let i=0;i<160;i++){const y=Math.random()*2-1,theta=Math.random()*Math.PI*2,r=Math.sqrt(1-y*y),rad=220;const s=BABYLON.MeshBuilder.CreateSphere('sky_star_'+i,{diameter:.22+Math.random()*.38,segments:4},scene);s.position.set(Math.cos(theta)*r*rad,y*rad,Math.sin(theta)*r*rad);s.material=starMat;s.parent=starRoot;s.isPickable=false;s.renderingGroupId=1;s.metadata={twinkle:Math.random()*6};starMeshes.push(s);}
  weatherMaterial=new BABYLON.StandardMaterial('cloud_material',scene);weatherMaterial.diffuseColor=new BABYLON.Color3(.55,.59,.68);weatherMaterial.emissiveColor=new BABYLON.Color3(.11,.13,.18);weatherMaterial.alpha=.22;weatherMaterial.backFaceCulling=false;
  for(let i=0;i<8;i++){const cluster=new BABYLON.TransformNode('cloud_cluster_'+i,scene);cluster.parent=cloudRoot;cluster.position.set((Math.random()-.5)*180,38+Math.random()*18,(Math.random()-.5)*180);cluster.metadata={speed:.4+Math.random()*.9,phase:Math.random()*6};for(let j=0;j<4;j++){const c=BABYLON.MeshBuilder.CreateSphere('cloud_puff_'+i+'_'+j,{diameter:10+Math.random()*12,segments:7},scene);c.scaling.set(1.4,.32,.9);c.position.set((j-1.5)*6,Math.random()*2,(Math.random()-.5)*8);c.material=weatherMaterial;c.parent=cluster;c.isPickable=false;}cloudMeshes.push(cluster);}
  const rainMat=new BABYLON.StandardMaterial('rain_material',scene);rainMat.disableLighting=true;rainMat.emissiveColor=new BABYLON.Color3(.34,.49,.69);rainMat.diffuseColor=new BABYLON.Color3(.34,.49,.69);rainMat.alpha=.62;
  for(let i=0;i<90;i++){const d=BABYLON.MeshBuilder.CreateBox('rain_drop_'+i,{width:.018,height:.7+Math.random()*.4,depth:.018},scene);d.material=rainMat;d.parent=rainRoot;d.position.set((Math.random()-.5)*48,Math.random()*34+2,(Math.random()-.5)*48);d.rotation.z=-.16;d.isPickable=false;rainDrops.push(d);}
  setWeather('sereno',false);nextWeatherChange=Date.now()+240000;
}
function refreshShadowList(){
  if(!shadowGenerator||!scene||!worldRoot)return;
  const map=shadowGenerator.getShadowMap?.();if(!map)return;map.renderList=[];
  const casters=/(?:_back|_side|_front_wall|_body|_roof_(?:left|right)|_ridge|_chimney|tree_trunk|tree_canopy|_tower|_pillar|town_gate_|village_well_base|village_bench|market_table)/i;
  const receivers=/(?:terrain|main_path|_back|_side|_front_wall|_body|_roof_|tree_|_pillar|tower|market_|village_|town_gate_)/i;
  for(const mesh of scene.meshes){
    let node=mesh.parent,attached=false,dynamic=false;
    while(node){if(node===actorRoot)dynamic=true;if(node===worldRoot){attached=true;break;}node=node.parent;}
    if(!attached||dynamic||mesh.visibility===0||!mesh.isVisible)continue;
    mesh.receiveShadows=receivers.test(mesh.name);
    if(casters.test(mesh.name))map.renderList.push(mesh);
  }
}
function setWeather(type,notify=true){if(!WEATHER_LABELS[type])type='sereno';const changed=currentWeather!==type;currentWeather=type;const coverAlpha=realWeatherEnabled?weatherCloudCover/100*.42:0;cloudRoot?.setEnabled(type!=='sereno'||(realWeatherEnabled&&weatherCloudCover>12));rainRoot?.setEnabled(type==='pioggia');if(weatherMaterial)weatherMaterial.alpha=type==='nebbia'?.36:type==='pioggia'?Math.max(.22,coverAlpha):type==='nuvoloso'?Math.max(.16,coverAlpha):coverAlpha;if(notify&&changed&&game)toast('Il tempo cambia: '+WEATHER_LABELS[type].toLowerCase()+'.');const weather=$('worldWeather');if(weather)weather.textContent=WEATHER_LABELS[type]+(realWeatherEnabled?' · reale':'');if(changed)updateWeatherSettingsStatus();}
function chooseWeather(){const r=Math.random();if(r<.43)return'sereno';if(r<.70)return'nuvoloso';if(r<.88)return'nebbia';return'pioggia';}
function weatherTypeForCode(code){
  if([45,48].includes(code))return'nebbia';
  if([0,1].includes(code))return'sereno';
  if([2,3].includes(code))return'nuvoloso';
  return'pioggia';
}
function weatherTimeMinutes(value){
  const match=String(value||'').match(/T(\d{2}):(\d{2})/);
  return match?Number(match[1])*60+Number(match[2]):null;
}
function updateWeatherSettingsStatus(message=''){
  const status=$('weatherSettingsStatus');if(!status)return;
  status.textContent=message||(realWeatherEnabled?'Meteo locale attivo · '+WEATHER_LABELS[currentWeather].toLowerCase():'Meteo simulato. La posizione viene richiesta solo se attivi il meteo locale.');
  const button=$('realWeatherToggle');if(button){button.textContent=realWeatherEnabled?'Disattiva meteo locale':'Attiva meteo locale';button.disabled=weatherRequestInProgress;}
}
function toggleRealWeather(){
  if(realWeatherEnabled){realWeatherEnabled=false;weatherCoordinates=null;realSunriseMinutes=null;realSunsetMinutes=null;weatherLocalMinutes=null;weatherCloudCover=0;setWeather(chooseWeather(),false);nextWeatherChange=Date.now()+240000;updateWeatherSettingsStatus();toast('Meteo locale disattivato.');return;}
  if(!navigator.geolocation){toast('Questo browser non supporta la geolocalizzazione. Rimane attivo il meteo simulato.');return;}
  weatherRequestInProgress=true;updateWeatherSettingsStatus('Richiesta autorizzazione alla posizione…');
  navigator.geolocation.getCurrentPosition(async({coords})=>{
    weatherCoordinates={latitude:coords.latitude,longitude:coords.longitude};weatherRequestInProgress=false;
    await fetchLocalWeather(true);
    updateWeatherSettingsStatus();
  },error=>{
    weatherRequestInProgress=false;
    const reason=error.code===1?'Autorizzazione alla posizione negata.':error.code===2?'Posizione non disponibile.':'Richiesta posizione scaduta.';
    console.warn('Geolocalizzazione meteo non disponibile:',error.message||reason);updateWeatherSettingsStatus(reason+' Rimane attivo il meteo simulato.');toast(reason+' Rimane attivo il meteo simulato.');
  },{enableHighAccuracy:false,timeout:12000,maximumAge:15*60*1000});
}
async function fetchLocalWeather(showError=false){
  if(!weatherCoordinates||weatherRequestInProgress)return false;
  weatherRequestInProgress=true;updateWeatherSettingsStatus('Aggiornamento delle condizioni meteo locali…');
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
  try{
    const params=new URLSearchParams({latitude:weatherCoordinates.latitude.toFixed(2),longitude:weatherCoordinates.longitude.toFixed(2),current:'weather_code,cloud_cover,is_day',daily:'sunrise,sunset',forecast_days:'1',timezone:'auto'});
    const response=await fetch('https://api.open-meteo.com/v1/forecast?'+params.toString(),{signal:controller.signal});
    if(!response.ok)throw new Error('HTTP '+response.status);
    const data=await response.json(),current=data.current,day=data.daily;
    if(!Number.isFinite(Number(current?.weather_code))||!Number.isFinite(Number(current?.cloud_cover))||!Array.isArray(day?.sunrise)||!Array.isArray(day?.sunset))throw new Error('Risposta meteo incompleta');
    weatherCloudCover=clamp(Number(current.cloud_cover),0,100);weatherLocalMinutes=weatherTimeMinutes(current.time);weatherTimeUpdatedAt=Date.now();
    realSunriseMinutes=weatherTimeMinutes(day.sunrise[0]);realSunsetMinutes=weatherTimeMinutes(day.sunset[0]);
    realWeatherEnabled=true;setWeather(weatherTypeForCode(Number(current.weather_code)),false);lastRealWeatherFetch=Date.now();weatherRequestInProgress=false;updateWeatherSettingsStatus();
    return true;
  }catch(error){
    clearTimeout(timeout);weatherRequestInProgress=false;
    console.warn('Aggiornamento meteo locale non riuscito:',error);
    if(showError){realWeatherEnabled=false;weatherCoordinates=null;updateWeatherSettingsStatus('Servizio meteo non raggiungibile. Rimane attivo il meteo simulato.');toast('Meteo locale non disponibile. Rimane attivo il meteo simulato.');}
    else updateWeatherSettingsStatus('Aggiornamento fallito; verrà mantenuto il meteo locale precedente.');
    return false;
  }finally{clearTimeout(timeout);}
}
function hexColor(hex){return BABYLON.Color3.FromHexString(hex);}
function lerpHex(a,b,t){return BABYLON.Color3.Lerp(hexColor(a),hexColor(b),clamp(t,0,1)).toHexString();}
function updateSkySystem(dt=.016){
  if(!scene||!skyDome)return;
  for(const c of cloudMeshes){c.position.x+=c.metadata.speed*dt;if(c.position.x>105)c.position.x=-105;}
  if(currentWeather==='pioggia'){for(const d of rainDrops){d.position.y-=dt*24;d.position.x+=dt*3;if(d.position.y<.5){d.position.y=18+Math.random()*24;d.position.x=(Math.random()-.5)*48;d.position.z=(Math.random()-.5)*48;}}}
  skySystemElapsed+=dt;if(skySystemElapsed<.12)return;dt=skySystemElapsed;skySystemElapsed=0;
  const date=new Date(),deviceMinutes=date.getHours()*60+date.getMinutes()+date.getSeconds()/60,minute=content?.redCrossStory?630:realWeatherEnabled&&weatherLocalMinutes!==null?(weatherLocalMinutes+(Date.now()-weatherTimeUpdatedAt)/60000)%1440:deviceMinutes,hour=minute/60;
  const start=new Date(date.getFullYear(),0,0),day=Math.floor((date-start)/86400000),season=2*Math.PI*(day-80)/365.2425;
  const daylightHours=clamp(12+4.15*Math.sin(season),8.5,16.2),sunrise=realWeatherEnabled&&realSunriseMinutes!==null?realSunriseMinutes/60:12-daylightHours/2,sunset=realWeatherEnabled&&realSunsetMinutes!==null?realSunsetMinutes/60:12+daylightHours/2;
  const activeDaylightHours=Math.max(.1,sunset-sunrise),activeNightHours=Math.max(.1,24-activeDaylightHours);
  let solarAngle;if(hour>=sunrise&&hour<=sunset)solarAngle=Math.PI*(hour-sunrise)/activeDaylightHours;else solarAngle=Math.PI+Math.PI*(((hour-sunset+24)%24)/activeNightHours);
  const sunDir=new BABYLON.Vector3(-Math.cos(solarAngle),Math.sin(solarAngle)*.92,Math.sin(season)*Math.cos(solarAngle)*.24).normalize();const moonDir=sunDir.scale(-1);
  const target=camera?.getTarget?.()||new BABYLON.Vector3(0,0,0);celestialRoot.position.copyFrom(target);starRoot.position.copyFrom(target);cloudRoot.position.set(target.x,0,target.z);rainRoot.position.set(target.x,0,target.z);
  const lunarPhase=((day%29.53)/29.53),moonIllumination=(1-Math.cos(lunarPhase*Math.PI*2))*.5;
  sunOrb.position.copyFrom(sunDir.scale(190));moonOrb.position.copyFrom(moonDir.scale(188));sunOrb.setEnabled(sunDir.y>-.07);moonOrb.setEnabled(moonDir.y>-.04&&moonIllumination>.04);moonOrb.scaling.set(.72+.28*moonIllumination,.72+.28*moonIllumination,.72+.28*moonIllumination);
  if(sunLight){sunLight.direction.copyFrom(sunDir.scale(-1));sunLight.position.copyFrom(target.add(sunDir.scale(155)));}
  if(moonLight){moonLight.direction.copyFrom(moonDir.scale(-1));moonLight.position.copyFrom(target.add(moonDir.scale(145)));}
  const daylight=clamp((sunDir.y+.03)*2.5,0,1),moonrise=clamp((moonDir.y+.02)*1.7,0,1),cloudCover=realWeatherEnabled?weatherCloudCover/100:currentWeather==='sereno'?0:currentWeather==='nuvoloso'?.5:currentWeather==='pioggia'?.78:.68,weatherSun=1-cloudCover*.62;
  if(sunLight)sunLight.intensity=Math.pow(daylight,.72)*1.48*weatherSun;
  if(moonLight)moonLight.intensity=Math.pow(moonrise,.7)*.3*moonIllumination*(1-cloudCover*.72);
  if(ambientLight){const indoors=Boolean(houseInteriorRoot&&houseInteriorRoot.isEnabled());ambientLight.intensity=indoors?0.92:.38+daylight*.32;ambientLight.groundColor=indoors?new BABYLON.Color3(.24,.19,.14):BABYLON.Color3.Lerp(new BABYLON.Color3(.16,.25,.3),new BABYLON.Color3(.38,.43,.32),daylight);}
  let top=lerpHex('#030611','#579bd1',daylight),mid=lerpHex('#10192d','#85b5dc',daylight),horizon=lerpHex('#17192b','#d9c7ac',daylight);
  const dawnDistance=Math.min(Math.abs(hour-sunrise),Math.abs(hour-sunset)),twilight=clamp(1-dawnDistance/1.75,0,1);top=lerpHex(top,'#b76f83',twilight*.48);mid=lerpHex(mid,'#d58c85',twilight*.66);horizon=lerpHex(horizon,'#e9a17b',twilight*.82);
  if(currentWeather==='nuvoloso'||currentWeather==='pioggia'){top=lerpHex(top,'#394552',currentWeather==='pioggia'?.72:.48);mid=lerpHex(mid,'#606c78',.42);horizon=lerpHex(horizon,'#777b82',.35);}else if(currentWeather==='nebbia'){mid=lerpHex(mid,'#96969b',.42);horizon=lerpHex(horizon,'#a8a4a2',.6);}
  const sky=hexColor(mid);scene.clearColor=new BABYLON.Color4(sky.r,sky.g,sky.b,1);scene.fogColor=sky;
  const fogBase=currentWeather==='nebbia'?.018:currentWeather==='pioggia'?.008:currentWeather==='nuvoloso'?.006:.0044;scene.fogDensity=fogBase;
  if(realWeatherEnabled&&Date.now()-lastRealWeatherFetch>20*60*1000&&!weatherRequestInProgress)fetchLocalWeather();
  if(!realWeatherEnabled&&Date.now()>nextWeatherChange){setWeather(chooseWeather(),true);nextWeatherChange=Date.now()+240000+Math.random()*240000;}
  if(Date.now()-lastSkyTextureUpdate>1800){lastSkyTextureUpdate=Date.now();const ctx=skyTexture.getContext(),grad=ctx.createLinearGradient(0,0,0,256);grad.addColorStop(0,top);grad.addColorStop(.52,mid);grad.addColorStop(1,horizon);ctx.fillStyle=grad;ctx.fillRect(0,0,512,256);skyTexture.update(false);}
  starRoot.rotation.y=hour/24*Math.PI*2;const night=1-daylight,starVisibility=night>.3?clamp((night-.25)*1.6,0,1)*(1-cloudCover*.82):0;for(const s of starMeshes)s.visibility=starVisibility*(.74+.26*Math.sin(Date.now()/700+s.metadata.twinkle));
  const clockMinute=Math.floor(minute),phase=hour<sunrise?'Notte':hour<sunrise+1?'Alba':hour<sunset-1?'Giorno':hour<sunset?'Tramonto':'Notte';if(clockMinute!==lastClockMinute){lastClockMinute=clockMinute;const t=$('worldTime'),ph=$('worldPhase'),w=$('worldWeather');if(t)t.textContent=String(Math.floor(minute/60)).padStart(2,'0')+':'+String(clockMinute%60).padStart(2,'0');if(ph)ph.textContent=phase;if(w)w.textContent=WEATHER_LABELS[currentWeather]+(realWeatherEnabled?' · reale':'');}
}

// Replace the scene update with a wrapper so gamepad polling and the real-time sky stay in sync.
const _baseUpdateWorld013=updateWorld;
updateWorld=function(){const dt=Math.min(.05,(engine?.getDeltaTime?.()||16)/1000);pollGamepad(dt);pollXRControllers();_baseUpdateWorld013();updateSkySystem(dt);};

function rarityForItem(item){if(item?.rarity)return String(item.rarity).toLowerCase();const lv=Number(item?.level||1);return lv<=1?'comune':lv<=8?'non comune':lv<=16?'raro':lv<=28?'epico':lv<=40?'leggendario':lv<=52?'mitico':'trascendente';}
function itemRarityColor(item){return RARITY_COLORS[rarityForItem(item)]||'#cbb47a';}
function itemIconSvg(id,kind='material',rarity='raro'){
  const c=RARITY_COLORS[String(rarity).toLowerCase()]||'#cbb47a',gold='#e8d3a0',dark='#15131d',key=String(id||'oggetto').toLowerCase(),uid='item_'+String(id||'icon').replace(/[^a-z0-9]/gi,'_')+'_'+(++itemIconCounter);
  let art='',localGlow=c;
  if(kind==='weapon'){
    const style=weaponStyleForId(key)||'sword';
    if(style==='bow')art=`<path d="M34 16 Q4 50 34 84" fill="none" stroke="#936b48" stroke-width="8" stroke-linecap="round"/><path d="M34 16 Q25 50 34 84" fill="none" stroke="${gold}" stroke-width="1.5"/><path d="M34 16L34 84" stroke="#e4d8bd" stroke-width="1.5"/><path d="M40 50H77L69 43 M77 50L69 57" fill="none" stroke="${gold}" stroke-width="2.5"/><path d="M48 42L57 50L48 58" fill="none" stroke="${c}" stroke-width="2"/>`;
    else if(style==='axe')art=`<path d="M49 27L53 87" stroke="#79553c" stroke-width="8" stroke-linecap="round"/><path d="M49 31Q18 7 17 34Q18 53 49 49Z" fill="url(#${uid}_metal)" stroke="${gold}" stroke-width="2"/><path d="M53 31Q83 7 84 34Q82 53 53 49Z" fill="url(#${uid}_metal)" stroke="${gold}" stroke-width="2"/><path d="M21 37L43 43 M80 37L58 43" stroke="${c}" stroke-width="2"/>`;
    else if(style==='daggers')art=`<g transform="translate(30 14) rotate(-12)"><path d="M0 0L7 42L0 52L-7 42Z" fill="url(#${uid}_blade)" stroke="${gold}" stroke-width="1.5"/><path d="M-12 53H12" stroke="${gold}" stroke-width="4"/><path d="M0 55V76" stroke="#79553c" stroke-width="6"/></g><g transform="translate(69 15) rotate(12)"><path d="M0 0L7 42L0 52L-7 42Z" fill="url(#${uid}_blade)" stroke="${gold}" stroke-width="1.5"/><path d="M-12 53H12" stroke="${gold}" stroke-width="4"/><path d="M0 55V76" stroke="#79553c" stroke-width="6"/></g>`;
    else if(style==='staff')art=`<path d="M40 87L60 18" stroke="#78563f" stroke-width="8" stroke-linecap="round"/><path d="M42 87L62 18" stroke="${gold}" stroke-width="1.5"/><circle cx="65" cy="18" r="13" fill="url(#${uid}_gem)" stroke="${gold}" stroke-width="2.5"/><path d="M65 1V35 M48 18H82 M53 6L77 30 M77 6L53 30" stroke="${gold}" stroke-width="1.5" opacity=".8"/>`;
    else if(style==='scythe')art=`<path d="M40 88L47 18" stroke="#79553c" stroke-width="7" stroke-linecap="round"/><path d="M46 24Q40 4 65 8Q88 12 83 31Q70 19 61 23Q54 26 53 36Z" fill="url(#${uid}_metal)" stroke="${gold}" stroke-width="2"/><path d="M52 25L76 13" stroke="${c}" stroke-width="2.5"/>`;
    else if(style==='hammer')art=`<path d="M50 35L52 88" stroke="#79553c" stroke-width="8" stroke-linecap="round"/><path d="M19 22L79 22L84 46L14 46Z" fill="url(#${uid}_metal)" stroke="${gold}" stroke-width="2.5"/><path d="M25 29H73 M25 39H73" stroke="${c}" stroke-width="2"/>`;
    else if(style==='spear')art=`<path d="M49 90L51 26" stroke="#79553c" stroke-width="7"/><path d="M50 8L65 29L50 47L35 29Z" fill="url(#${uid}_blade)" stroke="${gold}" stroke-width="2"/><path d="M38 34H62" stroke="${c}" stroke-width="2"/>`;
    else art=`<path d="M50 8L62 23L56 57L64 68L50 75L36 68L44 57L38 23Z" fill="url(#${uid}_blade)" stroke="${gold}" stroke-width="2"/><path d="M27 63L73 63L68 70L32 70Z" fill="${gold}"/><path d="M45 70H55L58 89H42Z" fill="#6b4b3c" stroke="${gold}" stroke-width="1.5"/><path d="M41 86H59L62 92H38Z" fill="${gold}"/>`;
  }else if(kind==='armor'){
    if(/veste|manto|tunica|mantello|robe/.test(key))art=`<path d="M35 20L43 12L50 19L57 12L65 20L79 32L69 46L63 39L72 84L28 84L37 39L31 46L21 32Z" fill="url(#${uid}_plate)" stroke="${gold}" stroke-width="2"/><path d="M50 22L59 36L55 76L45 76L41 36Z" fill="${c}" opacity=".8"/><path d="M37 48L63 48" stroke="${gold}" stroke-width="2"/>`;
    else art=`<path d="M30 22L41 13L50 20L59 13L70 22L84 31L73 50L65 42L69 82L31 82L35 42L27 50L16 31Z" fill="url(#${uid}_plate)" stroke="${gold}" stroke-width="2"/><path d="M42 23L50 33L58 23L62 67L38 67Z" fill="${c}" opacity=".72"/><path d="M31 44H69 M35 56H65 M40 68H60" stroke="${gold}" stroke-width="2"/><circle cx="50" cy="43" r="4" fill="${gold}"/>`;
  }else if(kind==='shield'){
    art=`<path d="M50 10L79 21L75 53Q69 76 50 90Q31 76 25 53L21 21Z" fill="url(#${uid}_plate)" stroke="${gold}" stroke-width="2.5"/><path d="M50 20V77 M31 33H69" stroke="${gold}" stroke-width="2"/><path d="M50 29L64 44L50 63L36 44Z" fill="${c}" stroke="${gold}" stroke-width="1.5"/><path d="M50 34L55 44L50 55L45 44Z" fill="${gold}"/>`;
  }else if(kind==='ring'){
    art=`<ellipse cx="50" cy="60" rx="25" ry="22" fill="none" stroke="#7b664b" stroke-width="12"/><ellipse cx="50" cy="58" rx="25" ry="22" fill="none" stroke="${gold}" stroke-width="5"/><ellipse cx="50" cy="57" rx="17" ry="14" fill="#17131e" stroke="${c}" stroke-width="2"/><path d="M50 9L63 27L50 42L37 27Z" fill="url(#${uid}_gem)" stroke="${gold}" stroke-width="2"/><path d="M50 13V35 M40 27H60" stroke="${gold}" stroke-width="1.5"/>`;
  }else if(kind==='consumable'){
    localGlow=/antidoto|verde|erba/.test(key)?'#84d59a':/scudo|gelo|azzur/.test(key)?'#81d7f0':/ombra|sangue|demoni/.test(key)?'#bd5b8d':/eon|destino|io|nulla|quattro/.test(key)?'#c4a2ff':'#dc675d';
    art=`<path d="M40 10H60V24L68 33V80Q68 88 59 88H41Q32 88 32 80V33L40 24Z" fill="url(#${uid}_plate)" stroke="${gold}" stroke-width="2"/><path d="M36 51Q50 44 64 51V78Q64 83 58 83H42Q36 83 36 78Z" fill="${localGlow}" opacity=".88"/><path d="M40 10H60V19H40Z" fill="${gold}"/><path d="M42 33L50 27L58 33" fill="none" stroke="${gold}" stroke-width="2"/><path d="M50 48L57 60L50 72L43 60Z" fill="#fff0ce" opacity=".82"/><circle cx="50" cy="60" r="25" fill="none" stroke="${localGlow}" stroke-opacity=".32" stroke-width="3"/>`;
  }else{
    if(/cristallo|scheggia|vetro|gemma|lacrima/.test(key)){
      art=`<path d="M50 8L72 28L65 63L50 91L35 63L28 28Z" fill="url(#${uid}_gem)" stroke="${gold}" stroke-width="2"/><path d="M50 8V91 M28 28L65 63 M72 28L35 63 M28 28H72" stroke="${gold}" stroke-width="1.5" opacity=".9"/><path d="M50 17L62 31L50 51L38 31Z" fill="${c}" opacity=".72"/>`;
    }else if(/polvere|inchiostro|filo/.test(key)){
      art=`<path d="M31 29L69 29L75 78L25 78Z" fill="url(#${uid}_plate)" stroke="${gold}" stroke-width="2"/><path d="M27 40H73 M29 68H71" stroke="${gold}" stroke-width="2"/><path d="M37 50Q50 38 63 50Q50 65 37 50Z" fill="${c}" stroke="${gold}" stroke-width="1.5"/><path d="M50 42V59" stroke="${gold}" stroke-width="1.5"/>`;
    }else if(/nucleo|cuore|essenza|frammento|runa|sigillo|ombra|anima|destino|cronale|eonica/.test(key)){
      art=`<path d="M50 10L72 28L67 60L50 88L33 60L28 28Z" fill="url(#${uid}_gem)" stroke="${gold}" stroke-width="2"/><path d="M50 18L62 33L50 59L38 33Z" fill="${c}" stroke="${gold}" stroke-width="1.5"/><path d="M50 20V80 M32 38H68 M39 66H61" stroke="${gold}" stroke-width="1.5"/><circle cx="50" cy="47" r="7" fill="#fff0ca" opacity=".7"/>`;
    }else{
      art=`<path d="M50 10L72 34L61 72L50 90L39 72L28 34Z" fill="url(#${uid}_gem)" stroke="${gold}" stroke-width="2"/><path d="M50 10V90 M28 34H72 M39 72H61" stroke="${gold}" stroke-width="1.5" opacity=".85"/><path d="M50 21L64 37L50 60L36 37Z" fill="${c}" opacity=".75"/>`;
    }
  }
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="${uid}_blade" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff4d1"/><stop offset=".42" stop-color="${c}"/><stop offset="1" stop-color="#554d65"/></linearGradient><linearGradient id="${uid}_plate" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${c}"/><stop offset=".5" stop-color="#494251"/><stop offset="1" stop-color="#15131c"/></linearGradient><linearGradient id="${uid}_gem" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff0c6"/><stop offset=".38" stop-color="${c}"/><stop offset="1" stop-color="#342b42"/></linearGradient><radialGradient id="${uid}_back"><stop stop-color="${c}" stop-opacity=".32"/><stop offset="1" stop-color="#080910" stop-opacity="0"/></radialGradient></defs><rect width="100" height="100" fill="url(#${uid}_back)"/><path d="M8 22V8H22 M78 8H92V22 M8 78V92H22 M78 92H92V78" fill="none" stroke="${gold}" stroke-opacity=".62" stroke-width="1.5"/><circle cx="50" cy="50" r="43" fill="none" stroke="${c}" stroke-opacity=".25" stroke-width=".9"/>${art}</svg>`;
}
function statLabel(key){return ({hp:'Vita',attack:'Attacco',defense:'Difesa',magic:'Magia',speed:'Velocità',luck:'Fortuna',crit:'Critico',block:'Probabilità di blocco',durability:'Durabilità',value:'Valore',all_damage:'Danno totale',destiny_gain:'Destino per attacco',shadow_extract:'Estrazione Ombra',fracture:'Risonanza Frattura',damage_reduction:'Riduzione danni',regen:'Rigenerazione',reflect:'Danno riflesso'})[key]||humanize(key);}
function formatItemStat(key,value){if(typeof value==='number'&&['block','crit','all_damage','shadow_extract','fracture','damage_reduction','reflect'].includes(key))return Math.round(value*100)+'%';return (Number(value)>0?'+':'')+String(value);}
function itemStatLines(item,kind){const lines=[];if(item.level)lines.push(['Livello richiesto',String(item.level)]);for(const k of ['attack','defense','magic','hp','speed','luck','crit','block','durability'])if(item[k]!==undefined&&Number(item[k])!==0)lines.push([statLabel(k),formatItemStat(k,item[k])]);if(item.bonus&&typeof item.bonus==='object')for(const [k,v] of Object.entries(item.bonus))if(Number(v)!==0)lines.push([statLabel(k),formatItemStat(k,v)]);if(item.penalty&&typeof item.penalty==='object')for(const [k,v] of Object.entries(item.penalty))if(Number(v)!==0)lines.push([statLabel(k),'−'+formatItemStat(k,Math.abs(Number(v))).replace(/^\+/,'')]);if(item.value!==undefined)lines.push(['Valore',Number(item.value).toLocaleString('it-IT')+' oro']);if(kind==='consumable')lines.push(['Quantità',String(item.quantity||0)]);if(kind==='material')lines.push(['Quantità',String(item.quantity||0)]);return lines;}
function itemDescription(item,id,kind){if(item?.desc||item?.description)return String(item.desc||item.description);const name=String(item?.name||humanize(id));if(kind==='weapon')return Number(item.magic||0)>Number(item.attack||0)?`${name}: un catalizzatore arcano che canalizza energia attraverso la volontà del Portatore.`:`${name}: un'arma forgiata per affrontare le creature che minacciano la linea temporale.`;if(kind==='armor')return `${name}: una protezione da viaggio pensata per resistere ai colpi e alle fratture del mondo.`;if(kind==='shield')return `${name}: una difesa da frapporre tra il Portatore e ciò che cerca di spezzarlo.`;if(kind==='ring')return `${name}: un artefatto minore la cui influenza dipende dai bonus e dai malus riportati qui sotto.`;if(kind==='material')return `${name}: una risorsa utilizzata nelle lavorazioni e nei rituali di forgia.`;return `${name}: un consumabile con l'effetto indicato nel registro degli oggetti.`;}
function inventoryCategories(){return [{key:'weapon',label:'Armi',slot:'weapon',items:content.registries.WEAPONS||{}},{key:'armor',label:'Armature',slot:'armor',items:content.registries.ARMORS||{}},{key:'shield',label:'Scudi',slot:'shield',items:content.registries.SHIELDS||{}},{key:'ring',label:'Anelli',slot:'ring',items:content.registries.RINGS||{}},{key:'consumable',label:'Consumabili',items:content.registries.CONSUMABLES||{}},{key:'material',label:'Materiali',items:content.registries.MATERIALS||{}}];}
const INVENTORY_EQUIPMENT_GROUPS={weapon:'weapons',armor:'armors',shield:'shields',ring:'rings'};
function ensurePlayerInventory(p=game?.player){
  if(!p)return null;
  if(!p.inventory||typeof p.inventory!=='object'||Array.isArray(p.inventory))p.inventory={};
  const inv=p.inventory,regs=content?.registries||{};
  if(!inv.materials||typeof inv.materials!=='object'||Array.isArray(inv.materials))inv.materials={};
  if(!inv.equipment||typeof inv.equipment!=='object'||Array.isArray(inv.equipment))inv.equipment={};
  const tables={weapon:regs.WEAPONS||{},armor:regs.ARMORS||{},shield:regs.SHIELDS||{},ring:regs.RINGS||{}};
  for(const [slot,group] of Object.entries(INVENTORY_EQUIPMENT_GROUPS)){
    const table=tables[slot],current=Array.isArray(inv.equipment[group])?inv.equipment[group]:[];
    const owned=[...new Set(current.filter(id=>typeof id==='string'&&Object.prototype.hasOwnProperty.call(table,id)))];
    const equipped=p[slot];
    if(equipped&&Object.prototype.hasOwnProperty.call(table,equipped)&&!owned.includes(equipped))owned.unshift(equipped);
    inv.equipment[group]=owned;
  }
  return inv;
}
function grantInventoryItem(id,category,quantity=1,p=game?.player){
  const inv=ensurePlayerInventory(p);if(!inv||!content)return false;
  const amount=Math.max(1,Math.floor(Number(quantity)||1)),regs=content.registries||{};
  const equipmentTables={weapon:{group:'weapons',table:regs.WEAPONS||{}},armor:{group:'armors',table:regs.ARMORS||{}},shield:{group:'shields',table:regs.SHIELDS||{}},ring:{group:'rings',table:regs.RINGS||{}}};
  if(equipmentTables[category]){
    const entry=equipmentTables[category];if(!Object.prototype.hasOwnProperty.call(entry.table,id))return false;
    if(!inv.equipment[entry.group].includes(id))inv.equipment[entry.group].push(id);
  }else if(category==='consumable'){
    if(!Object.prototype.hasOwnProperty.call(regs.CONSUMABLES||{},id))return false;
    const aliases={pozione:'potions',pozione_grande:'largePotions',antidoto:'antidotes',scudo_piccolo:'smallShields'},key=aliases[id]||id;
    inv[key]=Math.max(0,Number(inv[key]||0))+amount;
  }else if(category==='material'){
    if(!Object.prototype.hasOwnProperty.call(regs.MATERIALS||{},id))return false;
    inv.materials[id]=Math.max(0,Number(inv.materials[id]||0))+amount;
  }else return false;
  if(p===game?.player){saveGame(false);if(category==='material')unlockClassesByRequirements();}
  return true;
}
function consumableCount(id,p=game?.player){if(!p)return 0;const inv=p.inventory||{};const aliases={pozione:'potions',pozione_grande:'largePotions',antidoto:'antidotes',scudo_piccolo:'smallShields'};return Math.max(0,Number(inv[aliases[id]||id]||0));}
function makeInventoryEntries(category){
  const p=game?.player,meta=inventoryCategories().find(c=>c.key===category),out=[];
  if(!p||!meta)return out;
  const inv=ensurePlayerInventory(p),group=meta.slot?INVENTORY_EQUIPMENT_GROUPS[meta.slot]:null,owned=group?(inv.equipment[group]||[]):null;
  for(const [id,raw] of Object.entries(meta.items||{})){
    if(meta.slot&&!owned.includes(id))continue;
    let item=typeof raw==='string'?{name:raw}:raw||{},qty=0;
    if(category==='consumable')qty=consumableCount(id,p);
    if(category==='material')qty=Number(inv.materials?.[id]||0);
    if((category==='consumable'||category==='material')&&(!Number.isFinite(qty)||qty<=0))continue;
    if(category==='consumable'||category==='material')item={...item,quantity:qty};
    out.push({id,category,kind:category,item,name:item.name||item.title||humanize(id),slot:meta.slot,quantity:qty,rarity:rarityForItem(item)});
  }
  out.sort((a,b)=>(Number(a.item.level||0)-Number(b.item.level||0))||a.name.localeCompare(b.name,'it'));
  return out;
}
function equippedName(slot){const p=game?.player,regs=content?.registries||{},table=({weapon:regs.WEAPONS,armor:regs.ARMORS,shield:regs.SHIELDS,ring:regs.RINGS})[slot]||{};const id=p?.[slot];return id?(table[id]?.name||humanize(id)):'Nessuno';}
function renderInventory(){
  const root=$('panelContent'),p=game.player;root.innerHTML='';
  const summary=document.createElement('div');summary.className='inventory-summary';summary.innerHTML=[['ARMA',equippedName('weapon')],['ARMATURA',equippedName('armor')],['SCUDO',equippedName('shield')],['ANELLO',equippedName('ring')]].map(([a,b])=>`<div class="inventory-summary-slot"><small>${a}</small><strong>${escapeHtml(b)}</strong></div>`).join('');root.appendChild(summary);
  const tabs=document.createElement('div');tabs.className='inventory-tabs';for(const cat of inventoryCategories()){const b=document.createElement('button');b.className='inventory-tab'+(inventoryCategory===cat.key?' active':'');b.textContent=cat.label;b.addEventListener('click',()=>{inventoryCategory=cat.key;selectedInventoryItem=null;renderInventory();});tabs.appendChild(b);}root.appendChild(tabs);
  const shell=document.createElement('div');shell.className='inventory-layout';const list=document.createElement('div');list.className='inventory-list';const detail=document.createElement('div');detail.className='item-inspector';shell.append(list,detail);root.appendChild(shell);
  const entries=makeInventoryEntries(inventoryCategory);if(!entries.length){list.innerHTML='<div class="inventory-empty">Nessun oggetto in questa categoria.</div>';detail.innerHTML='<div class="inventory-empty">Nessun oggetto selezionato.</div>';return;}
  let chosen=entries.find(e=>selectedInventoryItem?.category===inventoryCategory&&e.id===selectedInventoryItem.id);if(!chosen){const slot=inventoryCategories().find(c=>c.key===inventoryCategory)?.slot;chosen=(slot&&entries.find(e=>e.id===p[slot]))||entries[0];selectedInventoryItem={category:inventoryCategory,id:chosen.id};}
  for(const e of entries){const b=document.createElement('button');b.className='inventory-item-row'+(e.id===chosen.id?' selected':'')+(e.slot&&p[e.slot]===e.id?' equipped':'');b.style.setProperty('--rarity',itemRarityColor(e.item));const icon=document.createElement('span');icon.className='item-icon';icon.innerHTML=itemIconSvg(e.id,e.kind,e.rarity);const info=document.createElement('span');info.innerHTML=`<span class="item-row-name">${escapeHtml(e.name)}</span><span class="item-row-meta">${escapeHtml(e.item.level?'Liv. '+e.item.level+' · ':'')}${escapeHtml(e.rarity)}</span>`;const qty=document.createElement('span');qty.className='item-row-qty';qty.textContent=e.slot&&p[e.slot]===e.id?'EQUIP.':(e.kind==='consumable'||e.kind==='material'?'×'+e.quantity:'');b.append(icon,info,qty);b.addEventListener('click',()=>{selectedInventoryItem={category:inventoryCategory,id:e.id};renderInventory();const selectedRow=[...$('panelContent').querySelectorAll('.inventory-item-row')].find(row=>row.classList.contains('selected'));selectedRow?.focus();});list.appendChild(b);}
  const item=chosen.item,kind=chosen.kind,rarity=chosen.rarity,color=itemRarityColor(item),equipped=chosen.slot&&p[chosen.slot]===chosen.id,canEquip=!item.level||Number(item.level)<=Number(p.level||1),desc=itemDescription(item,chosen.id,kind),stats=itemStatLines({...item,quantity:chosen.quantity},kind);
  detail.style.setProperty('--rarity',color);detail.innerHTML=`<div class="item-inspector-top"><div class="item-portrait">${itemIconSvg(chosen.id,kind,rarity)}</div><div><div class="item-rarity">${escapeHtml(rarity)}</div><h3>${escapeHtml(chosen.name)}</h3><div class="item-level">${item.level?'Richiede livello '+Number(item.level):kind==='material'?'Risorsa di forgia':kind==='consumable'?'Oggetto consumabile':'Equipaggiamento'}</div></div></div><div class="item-inspector-body"><div class="item-section-label">Descrizione</div><p class="item-description">${escapeHtml(desc)}</p>${stats.length?`<div class="item-section-label">Statistiche</div><div class="item-stat-grid">${stats.map(([k,v])=>`<div class="item-stat"><span>${escapeHtml(k)}</span><strong>${escapeHtml(v)}</strong></div>`).join('')}</div>`:''}<div class="item-section-label">Effetti e note</div><div class="item-effects">${buildItemEffects(item,kind,chosen.quantity).map(t=>`<div class="item-effect">${escapeHtml(t)}</div>`).join('')}</div><div class="item-inspector-actions" id="itemActions"></div></div>`;
  const actions=detail.querySelector('#itemActions');if(chosen.slot){const b=document.createElement('button');b.className='item-action';b.textContent=equipped?'Equipaggiato':'Equipaggia';b.disabled=!!equipped||!canEquip;b.addEventListener('click',()=>{if(!canEquip){toast('Serve il livello '+item.level+' per equipaggiare questo oggetto.');return;}p[chosen.slot]=chosen.id;recalculateEquipmentStats(p);if(chosen.slot==='weapon')createPlayerVisual();updateHUD();saveGame(false);renderInventory();toast(chosen.name+' equipaggiato.');});actions.appendChild(b);if(!canEquip){const note=document.createElement('span');note.className='item-level';note.textContent='Livello insufficiente';actions.appendChild(note);}}
  else if(kind==='consumable'){const b=document.createElement('button');b.className='item-action';b.textContent='Usa oggetto';b.disabled=chosen.quantity<=0||!isConsumableUsable(chosen.id);b.addEventListener('click',()=>{useInventoryConsumable(chosen.id);renderInventory();});actions.appendChild(b);}
  else if(kind==='material'){const b=document.createElement('button');b.className='item-action secondary';b.textContent='Materiale da forgia';b.disabled=true;actions.appendChild(b);}
  root.insertAdjacentHTML('beforeend','<p class="inventory-footer-note">Le illustrazioni sono emblemi stilizzati originali della Web Edition. I bonus numerici provengono dal catalogo equipaggiamento; gli effetti non ancora implementati nel motore sono descritti come note e non vengono simulati automaticamente.</p>');
}
function buildItemEffects(item,kind,quantity=0){const out=[];if(item.level)out.push('Richiede livello '+item.level+'.');if(item.desc||item.description)out.push(String(item.desc||item.description));if(item.bonus&&Object.keys(item.bonus).length)out.push('Bonus: '+Object.entries(item.bonus).map(([k,v])=>statLabel(k)+' '+formatItemStat(k,v)).join(', ')+'.');if(item.penalty&&Object.keys(item.penalty).length)out.push('Malus: '+Object.entries(item.penalty).map(([k,v])=>statLabel(k)+' '+formatItemStat(k,v)).join(', ')+'.');if(kind==='shield'&&item.block)out.push('Probabilità di annullare un colpo: '+Math.round(item.block*100)+'%.');if(kind==='consumable')out.push('Disponibili: '+quantity+'.');if(kind==='material')out.push('Posseduti: '+quantity+'.');if(!out.length)out.push('Nessun effetto speciale registrato oltre alle statistiche mostrate.');return [...new Set(out)];}
function isConsumableUsable(id){return ['pozione','pozione_grande','pozione_eonica','elisir_quattro_simboli','tonico_ombra','pozione_nerathis','scudo_piccolo','antidoto'].includes(id);}
function useInventoryConsumable(id){if(!game)return;const p=game.player,inv=p.inventory||(p.inventory={}),qty=consumableCount(id,p);if(qty<=0){toast('Non possiedi questo consumabile.');return;}let heal=0,shield=0,destiny=0;if(id==='pozione')heal=70;else if(id==='pozione_grande')heal=180;else if(id==='pozione_eonica'){heal=420;destiny=25;}else if(id==='elisir_quattro_simboli'){heal=650;shield=40;destiny=35;}else if(id==='tonico_ombra'){heal=260;p.shadowResonanceUntil=Date.now()+60000;}else if(id==='pozione_nerathis'){heal=900;destiny=45;}else if(id==='scudo_piccolo')shield=60;else if(id==='antidoto'){if(!(p.statusEffects||[]).length){toast('Non hai status negativi da rimuovere.');return;}p.statusEffects=[];}
  if(heal>0&&p.hp>=p.maxHp){toast('La tua salute è già al massimo.');return;}
  const aliases={pozione:'potions',pozione_grande:'largePotions',antidoto:'antidotes',scudo_piccolo:'smallShields'},key=aliases[id]||id;inv[key]=Math.max(0,Number(inv[key]||0)-1);if(heal)p.hp=Math.min(p.maxHp,p.hp+heal);if(shield)p.tempShield=(p.tempShield||0)+shield;if(destiny)p.destiny=clamp(Number(p.destiny||0)+destiny,0,destinyCapacity(p));saveGame(false);updateHUD();toast((content.registries.CONSUMABLES?.[id]?.name||humanize(id))+' utilizzato'+(heal?' · +'+Math.min(heal,p.maxHp-p.hp+heal)+' HP':'')+(shield?' · barriera +'+shield:'')+(destiny?' · Destino +'+destiny:''));}
function recalculateEquipmentStats(p=game?.player){
  if(!p||!content)return;
  p.skillRanks=p.skillRanks||{};ensureEquipmentDurability(p);
  const oldMax=Math.max(1,Number(p.maxHp||statsForClass(p.playerClass).hp)),oldHp=Number(p.hp??oldMax),ratio=clamp(oldHp/oldMax,0,1),reg=content.registries||{},cls=statsForClass(p.playerClass),weapon=reg.WEAPONS?.[p.weapon]||{},armor=reg.ARMORS?.[p.armor]||{},shield=reg.SHIELDS?.[p.shield]||{},ring=reg.RINGS?.[p.ring]||{},skills=skillStatBonuses(p);
  const conditionFactor=slot=>{const condition=equipmentCondition(slot,p[slot],p);return condition?.current===undefined?1:.55+.45*condition.current/100;};
  const weaponFactor=conditionFactor('weapon'),armorFactor=conditionFactor('armor'),shieldFactor=conditionFactor('shield'),rune=p.weaponRunes?.[p.weapon]||{};
  const bonus=ring.bonus||{},penalty=ring.penalty||{},lv=Number(p.level||1),hpGain=lv>1?lv*18:0,atkGain=lv>1?lv*3:0,defGain=lv>1?lv*1.5:0,magGain=lv>1?lv*2.2:0;
  const equipmentStat=(slot,key,item,factor)=>{const base=Number(item[key]||0);if(slot==='weapon'&&(key==='attack'||key==='magic'))return (base+Number(rune[key]||0))*factor;if(slot==='armor'&&key==='defense')return base*factor;if(slot==='shield'&&key==='defense')return base*factor;return base;};
  const stat=(key,base,levelGain=0)=>Number(base||0)+Number(levelGain||0)+Number(skills[key]||0)+equipmentStat('weapon',key,weapon,weaponFactor)+equipmentStat('armor',key,armor,armorFactor)+equipmentStat('shield',key,shield,shieldFactor)+Number(bonus[key]||0)+Number(penalty[key]||0);
  p.maxHp=Math.max(1,stat('hp',cls.hp,hpGain));p.attack=Math.max(1,stat('attack',cls.attack,atkGain));p.defense=Math.max(0,stat('defense',cls.defense,defGain));p.magic=Math.max(0,stat('magic',cls.magic,magGain));p.speed=Math.max(1,stat('speed',cls.speed,0));p.luck=stat('luck',cls.luck,0);p.crit=stat('crit',cls.crit,0);p.hp=clamp(Math.round(p.maxHp*ratio),1,p.maxHp);p.destiny=clamp(Number(p.destiny||0),0,destinyCapacity(p));
}
function equippedShieldBlock(){const it=content?.registries?.SHIELDS?.[game?.player?.shield];return clamp(Number(it?.block||0),0,.9);}
function equippedDamageMultiplier(){const p=game?.player,ring=content?.registries?.RINGS?.[p?.ring];let bonus=Number(ring?.bonus?.all_damage||0)+skillRank('black_flame')*.05;if((p?.shadows||[]).length)bonus+=skillRank('umbra_resonance')*.05+skillRank('umbra_authority')*.06+skillRank('monarch_domain')*.1+skillRank('remnant_bond')*.07+skillRank('shadow_sovereignty')*.08;return Math.max(.1,1+bonus);}

function renderSettings(root=$('panelContent')){
  if(!root)return;root.innerHTML='';if(root.id==='settingsScreenContent')root.classList.add('settings-content');else root.classList.remove('settings-content');
  const connected=connectedGamepadIndex>=0;const status=document.createElement('div');status.className='settings-status'+(connected?'':' disconnected');status.innerHTML=`<span class="status-dot"></span><span>${connected?'Controller rilevato · slot '+(connectedGamepadIndex+1):'Nessun controller rilevato. Collega un gamepad e premi un tasto per farlo riconoscere.'}</span>`;root.appendChild(status);
  const section=(title,description)=>{const s=document.createElement('section');s.className='settings-section';const h=document.createElement('h3');h.textContent=title;s.appendChild(h);const p=document.createElement('p');p.textContent=description;s.appendChild(p);root.appendChild(s);return s;};
  const row=(parent,label,current,buttonText,onClick,pending=false)=>{const r=document.createElement('div');r.className='settings-bind-row';const l=document.createElement('span');l.className='settings-bind-label';l.textContent=label;const c=document.createElement('span');c.className='settings-bind-current';c.textContent=current;const b=document.createElement('button');b.textContent=buttonText;b.classList.toggle('pending',pending);b.addEventListener('click',onClick);r.append(l,c,b);parent.appendChild(r);};
  const k=section('Tastiera','Seleziona “Rimappa”, poi premi il nuovo tasto. WASD e frecce funzionano entrambi finché non rimappi un’azione.');
  for(const group of [CONTROL_GROUPS.movement,CONTROL_GROUPS.general,CONTROL_GROUPS.combat])for(const action of group){const pend=pendingRebind?.kind==='keyboard'&&pendingRebind.action===action;row(k,CONTROL_LABELS[action],keyboardBindingLabel(action),pend?'Premi un tasto…':'Rimappa',()=>beginRebind('keyboard',action),pend);}
  const gp=section('Controller','Usa stick sinistro per muoverti, stick destro per la telecamera e D-pad per navigare i menu. Rimappa un’azione, poi premi il pulsante desiderato.');
  for(const group of [CONTROL_GROUPS.general,CONTROL_GROUPS.combat])for(const action of group){const pend=pendingRebind?.kind==='gamepad'&&pendingRebind.action===action;row(gp,CONTROL_LABELS[action],gamepadBindingLabel(action),pend?'Premi un pulsante…':'Rimappa',()=>beginGamepadRebind(action),pend);}
  const weather=section('Cielo e meteo','Il meteo locale usa la posizione solo dopo la tua autorizzazione e invia coordinate arrotondate a Open-Meteo. Se non disponibile, il gioco usa condizioni simulate.');
  const weatherStatus=document.createElement('p');weatherStatus.id='weatherSettingsStatus';weather.appendChild(weatherStatus);
  const weatherButton=document.createElement('button');weatherButton.id='realWeatherToggle';weatherButton.className='settings-reset';weatherButton.addEventListener('click',toggleRealWeather);weather.appendChild(weatherButton);updateWeatherSettingsStatus();
  const reset=document.createElement('button');reset.className='settings-reset';reset.textContent='Ripristina configurazione predefinita';reset.addEventListener('click',resetControlSettings);root.appendChild(reset);
}

function openPanel(kind){if(!game)return;if(kind!=='settings')$('panelContent').classList.remove('settings-content');if(kind==='settings'&&!settingsFromPause)settingsFromPause=$('pauseScreen')&&!$('pauseScreen').classList.contains('hidden');$('sidePanel').classList.remove('hidden');$('panelShade').classList.remove('hidden');$('panelEyebrow').textContent=kind==='forge'?'COMITATO LOCALE':game.player.name.toUpperCase();$('panelContent').innerHTML='';const titles={journal:'Diario del turno',inventory:'Inventario',character:'Personaggio',save:'Salvataggi',settings:'Impostazioni',inn:'Pausa e ristoro',shop:'Materiali e supporti',forge:'Attrezzatura'};$('panelTitle').textContent=titles[kind]||'Menu';if(kind==='journal')renderJournal();else if(kind==='inventory')renderInventory();else if(kind==='character')renderCharacter();else if(kind==='save')renderSavePanel();else if(kind==='settings')renderSettings($('panelContent'));else if(kind==='inn')renderInn();else if(kind==='shop')renderShop();else if(kind==='forge')renderForge();const first=$('sidePanel').querySelector('button:not(:disabled)');if(first)first.focus();}
function closePanel(){if($('sidePanel'))$('sidePanel').classList.add('hidden');if($('panelShade'))$('panelShade').classList.add('hidden');if(settingsFromPause){$('pauseScreen').classList.remove('hidden');inputLocked=true;settingsFromPause=false;}else if(game&&!currentBattle)inputLocked=false;}
function panelEntry(title,sub,desc,buttonText,action){const el=document.createElement('div');el.className='panel-entry';const mark=document.createElement('span');mark.className='panel-entry-mark';mark.textContent='✧';const body=document.createElement('div');body.className='panel-entry-body';body.innerHTML=`<strong>${escapeHtml(title)}</strong>${sub?`<small>${escapeHtml(sub)}</small>`:''}${desc?`<p>${escapeHtml(desc)}</p>`:''}`;el.append(mark,body);if(buttonText){const b=document.createElement('button');b.textContent=buttonText;b.addEventListener('click',action||(()=>{}));body.appendChild(b);}return el;}

function handleKeyDown(e){
  if(pendingRebind?.kind==='gamepad'&&e.code==='Escape'){pendingRebind=null;renderSettings($('sidePanel')&&!$('sidePanel').classList.contains('hidden')?$('panelContent'):$('settingsScreenContent'));toast('Rimappatura controller annullata.');return;}
  if(pendingRebind?.kind==='keyboard'){e.preventDefault();if(e.repeat)return;finishKeyboardRebind(e.code);return;}
  if(e.code==='Escape'&&!$('missionOverlay').classList.contains('hidden')){e.preventDefault();closeMissionActivity();return;}
  if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
  if(e.code==='Escape'&&!$('quickHelp').classList.contains('hidden')){e.preventDefault();toggleQuickHelp(false);return;}
  if(!$('introScreen').classList.contains('hidden')){if(['ArrowRight','ArrowLeft','Enter','Space','Backspace','Escape'].includes(e.code))e.preventDefault();if(e.repeat)return;if(['ArrowRight','Enter','Space'].includes(e.code)||isCodeBound('interact',e.code))nextIntro();else if(['ArrowLeft','Backspace'].includes(e.code))previousIntro();else if(e.code==='Escape')skipIntro();return;}
  if(Object.keys(keyboardBindings).some(a=>isCodeBound(a,e.code))||e.code==='Space'||isCodeBound('moveForward',e.code))e.preventDefault();keys[e.code]=true;if(e.repeat)return;
  if(isCodeBound('moveForward',e.code)){const now=performance.now();if(lastForwardTapAt&&now-lastForwardTapAt<320)sprintFromDoubleTap=true;lastForwardTapAt=now;}
  if(e.code==='KeyM'&&game){toggleLocalMap();return;}
  if(game&&currentBattle){for(const action of ['attack','skill','die','potion','defend'])if(isCodeBound(action,e.code)){combatAction(action);return;}}
  if(e.code==='Space'&&game){jumpRequested=!inputLocked&&$('sidePanel').classList.contains('hidden')&&$('pauseScreen').classList.contains('hidden')&&!dialogueVisible&&!pendingChoice;return;}
  if(isCodeBound('interact',e.code))interact();if(isCodeBound('journal',e.code)&&game)openPanel('journal');if(isCodeBound('inventory',e.code)&&game)openPanel('inventory');if(isCodeBound('character',e.code)&&game)openPanel('character');if(isCodeBound('cameraReset',e.code)&&game&&playerRoot&&camera){camera.setTarget(playerRoot.position.add(new BABYLON.Vector3(0,1.05,0)));camera.alpha=-Math.PI/2;camera.beta=1.12;camera.radius=13;toast('Visuale ricentrata.');}
  if(!$('settingsScreen').classList.contains('hidden')&&e.code==='Escape'&&!pendingRebind){showScreen('titleScreen');return;}
  if(!$('difficultyScreen').classList.contains('hidden')&&e.code==='Escape'){showScreen('classScreen');return;}
  if(isCodeBound('pause',e.code)){if(game&&!$('localMap').classList.contains('hidden'))toggleLocalMap(false);else if(game&&!$('pauseScreen').classList.contains('hidden'))resumeGame();else if(game&&!$('sidePanel').classList.contains('hidden'))closePanel();else if(game)pauseGame();}
}
function handleKeyUp(e){keys[e.code]=false;if(isCodeBound('moveForward',e.code))sprintFromDoubleTap=false;}
function visibleFocusContainer(){if(!$('missionOverlay').classList.contains('hidden'))return $('missionOverlay');if(!$('sidePanel').classList.contains('hidden'))return $('sidePanel');if(!$('pauseScreen').classList.contains('hidden'))return $('pauseScreen');for(const id of ['deviceScreen','settingsScreen','introScreen','classScreen','difficultyScreen','slotScreen','archiveScreen','titleScreen'])if($(id)&&!$(id).classList.contains('hidden'))return $(id);return $('gameUI');}
function cycleGamepadFocus(delta){const container=visibleFocusContainer();if(!container)return;const els=[...container.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),[tabindex="0"]')].filter(el=>el.getClientRects().length>0);if(!els.length)return;let i=els.indexOf(document.activeElement);i=(i+delta+els.length)%els.length;els[i].focus();}
function activateFocusedControl(){const container=visibleFocusContainer();if(!container)return;let el=document.activeElement;const selector='button:not(:disabled),select:not(:disabled)';if(!container.contains(el)||!el.matches(selector)){el=container.querySelector(selector);if(el)el.focus();}if(el?.classList?.contains('inventory-item-row')&&el.classList.contains('selected')){const action=$('itemActions')?.querySelector('button:not(:disabled)');if(action){action.click();return;}}if(el&&el.matches(selector))el.click();}
function handleGamepadAction(action){
  if(!$('missionOverlay').classList.contains('hidden')){if(action==='interact')activateFocusedControl();else if(action==='pause')closeMissionActivity();return;}
  if(action==='attack'||action==='skill'||action==='die'||action==='potion'||action==='defend'){if(currentBattle){combatAction(action);return;}}
  if(!$('introScreen').classList.contains('hidden')){if(action==='interact')nextIntro();else if(action==='pause')skipIntro();return;}
  if(!$('deviceScreen').classList.contains('hidden')||!$('settingsScreen').classList.contains('hidden')||!$('titleScreen').classList.contains('hidden')||!$('classScreen').classList.contains('hidden')||!$('difficultyScreen').classList.contains('hidden')||!$('slotScreen').classList.contains('hidden')||!$('archiveScreen').classList.contains('hidden')){if(action==='interact')activateFocusedControl();else if(action==='pause'&&$('settingsScreen')&&!$('settingsScreen').classList.contains('hidden'))$('settingsBackBtn').click();else if(action==='pause'&&$('difficultyScreen')&&!$('difficultyScreen').classList.contains('hidden'))$('difficultyBackBtn').click();return;}
  if(!$('sidePanel').classList.contains('hidden')){if(action==='interact')activateFocusedControl();else if(action==='pause')closePanel();else if(action==='inventory')openPanel('inventory');else if(action==='journal')openPanel('journal');else if(action==='character')openPanel('character');return;}
  if(!$('pauseScreen').classList.contains('hidden')){if(action==='interact')activateFocusedControl();else if(action==='pause')resumeGame();return;}
  if(!game)return;if(currentBattle){if(action==='pause')pauseGame();else if(action==='inventory')openPanel('inventory');return;}
  if(action==='interact')interact();else if(action==='journal')openPanel('journal');else if(action==='inventory')openPanel('inventory');else if(action==='character')openPanel('character');else if(action==='cameraReset'&&playerRoot&&camera){camera.setTarget(playerRoot.position.add(new BABYLON.Vector3(0,1.05,0)));camera.alpha=-Math.PI/2;camera.beta=1.12;camera.radius=13;toast('Visuale ricentrata.');}else if(action==='pause')pauseGame();
}
function xrControllerPosition(controller,source,frame,referenceSpace){
  let pose=null;
  if(source.gripSpace&&frame?.getPose&&referenceSpace)pose=frame.getPose(source.gripSpace,referenceSpace);
  if(!pose&&source.hand?.get&&frame?.getJointPose&&referenceSpace){
    const wrist=source.hand.get('wrist');
    if(wrist)pose=frame.getJointPose(wrist,referenceSpace);
  }
  if(pose?.transform?.position){const p=pose.transform.position;return new BABYLON.Vector3(p.x,p.y,p.z);}
  const gripPosition=controller.grip?.getAbsolutePosition?.();
  return gripPosition?.clone()||null;
}
function pollXRControllers(){
  if(!isXRActive())return;
  const sessionManager=xrExperience.baseExperience.sessionManager,frame=sessionManager.currentFrame,referenceSpace=sessionManager.referenceSpace,controllers=xrExperience.input.controllers||[];let leftStick={x:0,y:0};
  for(const controller of controllers){
    const source=controller.inputSource,gamepad=source?.gamepad;
    const axes=gamepad?.axes||[],offset=axes.length>=4?2:0;
    if(source?.handedness==='left'&&gamepad){
      leftStick={x:clamp(Number(axes[offset]||0),-1,1),y:clamp(Number(axes[offset+1]||0),-1,1)};
    }
    const id=controller.uniqueId||source?.handedness||'xr-controller',previous=xrControllerButtonStates.get(id)||[],pressed=(gamepad?.buttons||[]).map(button=>!!(button?.pressed||Number(button?.value||0)>.65));
    const justPressed=pressed.map((value,index)=>value&&!previous[index]);xrControllerButtonStates.set(id,pressed);
    if(source?.handedness==='right'&&justPressed[5])handleGamepadAction('pause');
    const position=source?xrControllerPosition(controller,source,frame,referenceSpace):null,now=performance.now(),prior=xrControllerMotion.get(id);
    if(position&&prior&&now>prior.at){
      const speed=BABYLON.Vector3.Distance(position,prior.position)/((now-prior.at)/1000);
      if(source?.handedness==='right'&&currentBattle&&!inputLocked&&speed>1.8&&now-xrLastDiceGestureAt>1200){
        xrLastDiceGestureAt=now;handleGamepadAction('die');
      }
    }
    if(position)xrControllerMotion.set(id,{position,at:now});else xrControllerMotion.delete(id);
    const hasDomControls=!$('missionOverlay').classList.contains('hidden')||!$('sidePanel').classList.contains('hidden')||!$('pauseScreen').classList.contains('hidden')||!$('localMap').classList.contains('hidden');
    if(source?.handedness==='right'&&justPressed[0]&&!currentBattle&&!hasDomControls)handleGamepadAction('interact');
  }
  gamepadAxes=leftStick;
}
function pollGamepad(dt=.016){
  let pads=[];try{pads=Array.from(navigator.getGamepads?.()||[]).filter(Boolean);}catch(e){}
  const pad=pads.find(g=>g.connected)||null;const previousIndex=connectedGamepadIndex;connectedGamepadIndex=pad?pad.index:-1;if(previousIndex!==connectedGamepadIndex){gamepadAxes={x:0,y:0};if(pad)toast('Controller collegato: '+(pad.id||'Gamepad'));refreshControlsHint();const status=document.querySelector('.settings-status');if(status){status.classList.toggle('disconnected',!pad);status.querySelector('span:last-child').textContent=pad?'Controller rilevato · slot '+(pad.index+1):'Nessun controller rilevato. Collega un gamepad e premi un tasto per farlo riconoscere.';}}
  if(!pad){gamepadAxes={x:0,y:0};return;}
  const prev=gamepadButtonStates[pad.index]||[],now=pad.buttons.map(b=>!!(b?.pressed||Number(b?.value||0)>.55)),just=now.map((v,i)=>v&&!prev[i]);gamepadButtonStates[pad.index]=now;
  let x=Number(pad.axes?.[0]||0),y=Number(pad.axes?.[1]||0);if(Math.abs(x)<.2)x=0;if(Math.abs(y)<.2)y=0;if(Math.abs(x)<.2){if(now[14])x=-1;else if(now[15])x=1;}if(Math.abs(y)<.2){if(now[12])y=-1;else if(now[13])y=1;}gamepadAxes={x:clamp(x,-1,1),y:clamp(y,-1,1)};
  if(game&&!inputLocked&&$('sidePanel').classList.contains('hidden')&&$('pauseScreen').classList.contains('hidden')&&currentBattle===null&&camera){const rx=Number(pad.axes?.[2]||0),ry=Number(pad.axes?.[3]||0);if(Math.abs(rx)>.16)camera.alpha-=rx*dt*2.4;if(Math.abs(ry)>.16)camera.beta=clamp(camera.beta+ry*dt*1.6,.34,1.56);}
  if(pendingRebind?.kind==='gamepad'){const idx=just.findIndex(Boolean);if(idx>=0)finishGamepadRebind(idx);return;}
  const modalOpen=!$('missionOverlay').classList.contains('hidden')||!$('deviceScreen').classList.contains('hidden')||!$('sidePanel').classList.contains('hidden')||!$('pauseScreen').classList.contains('hidden')||!$('introScreen').classList.contains('hidden')||!$('settingsScreen').classList.contains('hidden')||!$('titleScreen').classList.contains('hidden')||!$('classScreen').classList.contains('hidden')||!$('difficultyScreen').classList.contains('hidden')||!$('slotScreen').classList.contains('hidden')||!$('archiveScreen').classList.contains('hidden');
  if(modalOpen&&just[12])cycleGamepadFocus(-1);if(modalOpen&&just[13])cycleGamepadFocus(1);if(modalOpen&&just[14]&&!$('introScreen').classList.contains('hidden'))previousIntro();if(modalOpen&&just[15]&&!$('introScreen').classList.contains('hidden'))nextIntro();
  const context=currentBattle&&!modalOpen?['attack','skill','die','potion','defend','inventory','pause']:['interact','journal','inventory','character','cameraReset','pause'];for(const action of context){const idx=gamepadBindings[action];if(Number.isInteger(idx)&&just[idx])handleGamepadAction(action);}
}
window.addEventListener('gamepadconnected',e=>{connectedGamepadIndex=e.gamepad.index;refreshControlsHint();const status=document.querySelector('.settings-status');if(status){status.classList.remove('disconnected');status.querySelector('span:last-child').textContent='Controller rilevato · '+(e.gamepad.id||'Gamepad');}toast('Controller collegato.');});
window.addEventListener('gamepaddisconnected',()=>{connectedGamepadIndex=-1;gamepadAxes={x:0,y:0};refreshControlsHint();const status=document.querySelector('.settings-status');if(status){status.classList.add('disconnected');status.querySelector('span:last-child').textContent='Controller scollegato.';}});

// Recalculate equipment effects before each scene HUD refresh; this also normalizes loaded saves.
const _baseStartStep013=startStep;
startStep=function(showCurtain=false){if(game?.player)recalculateEquipmentStats(game.player);_baseStartStep013(showCurtain);};
const _baseCombatAction013=combatAction;
combatAction=function(action){if(!currentBattle||!game||inputLocked)return;const p=game.player,ring=content.registries.RINGS?.[p.ring],gain=Number(ring?.bonus?.destiny_gain||0);if(['attack','skill'].includes(action)&&gain>0)p.destiny=(p.destiny||0)+gain;_baseCombatAction013(action);if(['attack','skill'].includes(action)&&gain>0)saveGame(false);}


$('titleSettingsBtn')?.addEventListener('click',()=>{pendingRebind=null;renderSettings($('settingsScreenContent'));showScreen('settingsScreen');});
$('settingsBackBtn')?.addEventListener('click',()=>{pendingRebind=null;showScreen('titleScreen');});
$('pauseSettingsBtn')?.addEventListener('click',()=>{settingsFromPause=true;$('pauseScreen').classList.add('hidden');openPanel('settings');});
// A controller can also open settings from the in-game pause panel.
$('titleSettingsBtn')?.setAttribute('aria-label','Apri le impostazioni di gioco');


boot();
