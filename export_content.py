from __future__ import annotations
import ast, importlib, json, math, sys, types
from pathlib import Path
import zipfile

BASE = Path(__file__).resolve().parent
ROOT = BASE / 'source_2d' / 'chronicles_of_destiny_definitive_v1_1'
if not ROOT.exists():
    ROOT = BASE.parent / 'source_2d' / 'chronicles_of_destiny_definitive_v1_1'
if not ROOT.exists() and (BASE / 'SOURCE_2D_REFERENCE.zip').exists():
    extracted = BASE / '.source_2d_extracted'
    extracted.mkdir(exist_ok=True)
    with zipfile.ZipFile(BASE / 'SOURCE_2D_REFERENCE.zip') as zf:
        zf.extractall(extracted)
    candidates = list(extracted.glob('**/main.py'))
    if candidates: ROOT = candidates[0].parent
OUT = BASE / 'data'
OUT.mkdir(parents=True, exist_ok=True)
sys.path.insert(0, str(ROOT))

# Content/cutscene modules only use pygame in drawing functions. A stub allows
# importing their static narrative tables without installing the 2D renderer.
pygame_stub = types.ModuleType('pygame')
pygame_stub.SRCALPHA = 0
pygame_stub.Rect = lambda *args, **kwargs: None
sys.modules.setdefault('pygame', pygame_stub)

MODULES = [
    'data','story','systems','chapter5','chapter6','progression','equipment',
    'chapters7_10','save_system','legacy_content','world3','rings','world4',
    'ancient_saga','world5','world6','world_atlas','world7','world7_systems',
    'world8','world8_systems','world9','world9_systems','world10','world10_systems',
    'world10_cutscenes','world11','world12','finale_systems','finale_cutscenes',
    'realm8_cutscenes','remembrance','die_guide','shard_era','shard_systems',
    'afterlight','afterlight_systems','the_one_who_remains'
]
loaded = {}
for name in MODULES:
    try:
        loaded[name] = importlib.import_module(name)
    except Exception as e:
        print(f'WARN: could not import {name}: {type(e).__name__}: {e}')


def names_assigned(stmts):
    out=set()
    for node in stmts:
        if isinstance(node, (ast.Assign, ast.AnnAssign, ast.AugAssign)):
            targets = node.targets if isinstance(node, ast.Assign) else [node.target]
            for target in targets:
                for n in ast.walk(target):
                    if isinstance(n, ast.Name): out.add(n.id)
        elif isinstance(node, (ast.For, ast.AsyncFor)):
            for n in ast.walk(node.target):
                if isinstance(n, ast.Name): out.add(n.id)
            out |= names_assigned(node.body); out |= names_assigned(node.orelse)
        elif isinstance(node, ast.If):
            out |= names_assigned(node.body); out |= names_assigned(node.orelse)
        elif isinstance(node, (ast.With, ast.AsyncWith, ast.While)):
            out |= names_assigned(node.body); out |= names_assigned(node.orelse)
        elif isinstance(node, ast.Try):
            out |= names_assigned(node.body); out |= names_assigned(node.orelse); out |= names_assigned(node.finalbody)
            for h in node.handlers: out |= names_assigned(h.body)
    return out


def clean(v, depth=0):
    if depth > 30: return '[depth-limit]'
    if v is None or isinstance(v, (str, bool, int)): return v
    if isinstance(v, float): return v if math.isfinite(v) else None
    if isinstance(v, dict):
        return {str(k): clean(val, depth+1) for k,val in v.items()}
    if isinstance(v, (list, tuple, set, frozenset)):
        return [clean(x, depth+1) for x in v]
    if isinstance(v, types.ModuleType) or callable(v): return None
    if hasattr(v, '__dict__'):
        return {k:clean(val,depth+1) for k,val in vars(v).items() if not k.startswith('_')}
    return str(v)

# Extract each module's own top-level data declarations, avoiding thousands of
# redundant imported symbols from `from data import *`.
module_data = {}
for name in MODULES:
    mod=loaded.get(name)
    if mod is None: continue
    try:
        tree=ast.parse((ROOT/f'{name}.py').read_text(encoding='utf-8'))
        assigned=names_assigned(tree.body)
    except Exception:
        assigned=set()
    own={}
    for key in sorted(assigned):
        if key.startswith('_') or not key.isupper() or key not in vars(mod): continue
        val=vars(mod)[key]
        if callable(val) or isinstance(val, types.ModuleType): continue
        if isinstance(val,(dict,list,tuple,set,str,int,float,bool)) or val is None:
            try: own[key]=clean(val)
            except Exception as e: print('skip',name,key,e)
    if own: module_data[name]=own


def extract_main_dialogues():
    """Keep inline dialog calls from the original Pygame controller searchable."""
    source=(ROOT/'main.py').read_text(encoding='utf-8')
    tree=ast.parse(source)
    records=[]
    def node_text(node):
        if isinstance(node, ast.Constant) and isinstance(node.value, str): return node.value
        if isinstance(node, ast.JoinedStr):
            bits=[]
            for val in node.values:
                if isinstance(val,ast.Constant): bits.append(str(val.value))
                elif isinstance(val,ast.FormattedValue): bits.append('{'+ast.unparse(val.value)+'}')
            return ''.join(bits)
        if isinstance(node,(ast.List,ast.Tuple)):
            return [node_text(x) for x in node.elts]
        return {'expression':ast.unparse(node)}
    def literal_fragments(node):
        out=[]
        for child in ast.walk(node):
            if isinstance(child,ast.Constant) and isinstance(child.value,str) and child.value.strip(): out.append(child.value)
            elif isinstance(child,ast.JoinedStr):
                t=node_text(child)
                if isinstance(t,str) and t.strip(): out.append(t)
        # stable de-duplication while preserving source order
        seen=set(); result=[]
        for x in out:
            if x not in seen: seen.add(x); result.append(x)
        return result
    for node in ast.walk(tree):
        if not isinstance(node,ast.Call) or not isinstance(node.func,ast.Attribute) or node.func.attr!='start': continue
        owner=node.func.value
        if not (isinstance(owner,ast.Attribute) and owner.attr=='dialog'): continue
        speaker=node_text(node.args[0]) if node.args else 'Narratore'
        lines=node_text(node.args[1]) if len(node.args)>1 else []
        fragments=literal_fragments(node)
        if not fragments and not isinstance(lines,list):
            continue
        records.append({
            'source_line':node.lineno,
            'speaker':speaker if isinstance(speaker,str) else '',
            'speaker_expression':speaker if isinstance(speaker,dict) else None,
            'lines':lines if isinstance(lines,list) else [],
            'lines_expression':lines if isinstance(lines,dict) else None,
            'fragments':fragments,
        })
    records.sort(key=lambda r:r['source_line'])
    return records

# Canonical chapter route: every chapter has the original step/dialogue data.
chapters=[]
def add_group(number, group_name, steps, source, variant=None):
    for step in steps:
        item=clean(step)
        if not isinstance(item,dict): continue
        item['chapter_number']=number
        item['chapter_arc']=group_name
        item['source_module']=source
        if variant: item['route_variant']=variant
        # Normalise the two narrative schemas used by older/newer chapters.
        if 'dialogue' not in item and 'lines' in item:
            speaker=item.get('speaker','Narratore')
            item['dialogue']=[[speaker,line] for line in item.get('lines',[])]
        item.setdefault('objective', item.get('desc', 'Esplora l’area e scopri cosa è cambiato.'))
        item.setdefault('scene','erenfall')
        item.setdefault('dialogue',[])
        item.setdefault('title', item.get('name', f'Capitolo {number}'))
        chapters.append(item)

# I-III
add_group(1,'Velmora — Le origini',loaded['remembrance'].EARLY_QUESTS[:3],'remembrance')
add_group(2,'Velmora — Le origini',loaded['remembrance'].EARLY_QUESTS[3:6],'remembrance')
add_group(3,'Velmora — Le origini',loaded['remembrance'].EARLY_QUESTS[6:],'remembrance')
# IV-VI
add_group(4,'Convergenza',loaded['story'].CHAPTER_4,'story')
add_group(5,'Il mondo delle conseguenze',loaded['chapter5'].CHAPTER_5,'chapter5')
ch6=loaded['chapter6']
chapter6_variants={k:clean(v+ch6.CH6_COMMON) for k,v in ch6.CH6_VARIANTS.items()}
add_group(6,'Aetherion',ch6.CH6_VARIANTS.get('respected',[])+ch6.CH6_COMMON,'chapter6','respected')
# VII-X
for num,steps in loaded['chapters7_10'].CHAPTERS_7_10.items(): add_group(int(num),'Aetherion — Empyrean',steps,'chapters7_10')
# XI-XIV
for num,steps in loaded['world3'].WORLD3_CHAPTERS.items(): add_group(int(num),'Nythera',steps,'world3')
# XV-XX
for num,steps in loaded['world4'].WORLD4_CHAPTERS.items(): add_group(int(num),'Orphion',steps,'world4')
# XXI-XXV
for num,steps in loaded['ancient_saga'].ANCIENT_SAGA_CHAPTERS.items(): add_group(int(num),'Saga degli Antichi',steps,'ancient_saga')
# XXVI-XXXI
for num,steps in loaded['world5'].WORLD5_CHAPTERS.items(): add_group(int(num),'Nerathis',steps,'world5')
# XXXII-XXXVIII
for num,steps in loaded['world6'].WORLD6_CHAPTERS.items(): add_group(int(num),'Eidryon',steps,'world6')
# XXXIX-XLV
for num,steps in loaded['world7'].WORLD7_CHAPTERS.items(): add_group(int(num),'Nihyra',steps,'world7')
# XLVI-LII
for num,steps in loaded['world8'].WORLD8_CHAPTERS.items(): add_group(int(num),'Elyndra',steps,'world8')
# LIII-LVIII
for num,steps in loaded['world9'].WORLD9_CHAPTERS.items(): add_group(int(num),'Aureth',steps,'world9')
# LIX-LXIII
for num,steps in loaded['world10'].WORLD10_CHAPTERS.items(): add_group(int(num),'Khaelys',steps,'world10')
# LXIV-LXV
for num,steps in loaded['world11'].WORLD11_CHAPTERS.items(): add_group(int(num),'Vhalos',steps,'world11')
# LXVI-LXX
for num,steps in loaded['world12'].WORLD12_CHAPTERS.items(): add_group(int(num),'Eschara',steps,'world12')
# LXXI-LXXXII
for num,steps in loaded['shard_era'].SHARD_CHAPTERS.items(): add_group(int(num),'Era Senza Dado — Shards',steps,'shard_era')
# LXXXIII-LXXXV
for num,steps in loaded['shard_era'].POST_SHARD_CHAPTERS.items(): add_group(int(num),'HEXA e Risoluzione',steps,'shard_era')
# LXXXVI-XCIV
for num,steps in loaded['afterlight'].AFTERLIGHT_CHAPTERS.items(): add_group(int(num),'Afterlight — Era delle conseguenze',steps,'afterlight')
# XCV-XCVI
for num,steps in loaded['the_one_who_remains'].REMAINING_CHAPTERS.items(): add_group(int(num),'Colui che Rimane',steps,'the_one_who_remains')

chapters.sort(key=lambda x:(x['chapter_number'],x.get('id','')))

# World labels are canonical, including the six secret Shards.
world_names = clean(loaded['world_atlas'].WORLD_NAMES) if 'world_atlas' in loaded else {
    1:'Velmora',2:'Aetherion',3:'Nythera',4:'Orphion',5:'Nerathis',6:'Eidryon',7:'Nihyra',8:'Elyndra',9:'Aureth',10:'Khaelys',11:'Vhalos',12:'Eschara',13:'Veyra',14:'Lexaris',15:'Mnemos',16:'Anankhe',17:'Psykara',18:'Saiseion'}

# Final registries after all content modules have extended them.
latest=loaded['afterlight']
registries={}
for key in ['CLASS_DATA','STARTER_CLASSES','ADVANCED_CLASSES','SECRET_CLASSES','CLASS_ORIGINS','FACTIONS','REPUTATION_TIERS','TITLE_DATA','COMPANIONS','SHADOW_TEMPLATES','WEAPONS','MATERIALS','ENCHANTMENTS','CLASS_UNLOCK_QUESTS','CHOICE_EFFECTS','SKILL_TREE','ARMORS','SHIELDS','ARMOR_ENCHANTMENTS','SHIELD_ENCHANTMENTS','CONSUMABLES','RINGS','WORLD_LORE_CODEX','WORLD_NAMES_MEMORY','MEMENTOS','EARLY_NPCS','EARLY_QUESTS','NG_BLESSINGS','NG_ECHO_TRIALS','WORLD_MEMORY_SCENES','SHARD_REALMS','SHARD_ZONES','SHARD_MOBS','SHARD_HOLDER_DATA','SHARD_CHAPTERS','SHARD_RESOLUTION','ARTIFICIAL_DIE_PROJECT','SHARD_SIDE_QUESTS','POST_SHARD_CHAPTERS','HEXA_BOSS','DERIVED_TECHNIQUES','NG_SHARD_ECHOES','AFTERLIGHT_CHAPTERS','TIMED_POLITICAL_QUESTS','ASTERION_BOOK_PAGES','SHADOW_CITY_MODELS','HEXA_CHILDREN_POLICIES','AFTERLIGHT_BOSSES','BOOK_THEFT_CLUES','HEXA_CIVIC_SYSTEMS','REMAINING_CHAPTERS','REMAINING_BOSS','TEMPORAL_SCARS','DIE_GUIDE','WORLD_LORE','MANDATORY_QUESTS','CHAPTER_2_SIDE','CHAPTER_3_SIDE','CHAPTER_4','CHAPTER_5','CHAPTERS_7_10','WORLD3_CHAPTERS','WORLD4_CHAPTERS','ANCIENT_SAGA_CHAPTERS','WORLD5_CHAPTERS','WORLD6_CHAPTERS','WORLD7_CHAPTERS','WORLD8_CHAPTERS','WORLD9_CHAPTERS','WORLD10_CHAPTERS','WORLD11_CHAPTERS','WORLD12_CHAPTERS','WORLD2_ZONES','EMPYREAN_ZONES','WORLD3_ZONES','ANCIENT_SAGA_ZONES','WORLD5_ZONES','WORLD6_ZONES','WORLD7_ZONES','WORLD8_ZONES','WORLD9_ZONES','WORLD10_ZONES','WORLD11_BOSS','WORLD12_ZONES','TIMED_POLITICAL_QUESTS']:
    if hasattr(latest,key): registries[key]=clean(getattr(latest,key))
# Override the registries most recently expanded by other modules.
for key in ['CLASS_DATA','STARTER_CLASSES','ADVANCED_CLASSES','SECRET_CLASSES','CLASS_ORIGINS','FACTIONS','REPUTATION_TIERS','TITLE_DATA','COMPANIONS','SHADOW_TEMPLATES','WEAPONS','MATERIALS','ENCHANTMENTS','CLASS_UNLOCK_QUESTS','CHOICE_EFFECTS']:
    for mn in ['world12','afterlight']:
        if hasattr(loaded[mn],key): registries[key]=clean(getattr(loaded[mn],key))
# Tables that are intentionally defined in later/parallel modules rather than afterlight.py.
for mn, keys in {
    'world_atlas':['WORLD_NAMES'], 'progression':['SKILL_TREE'], 'equipment':['ARMORS','SHIELDS','ARMOR_ENCHANTMENTS','SHIELD_ENCHANTMENTS','CONSUMABLES','RARITY_ORDER'], 'rings':['RINGS'], 'story':['WORLD_LORE','MANDATORY_QUESTS','CHAPTER_2_SIDE','CHAPTER_3_SIDE','CHAPTER_4'],
    'chapter5':['CHAPTER_5','CHAPTER5_MANDATORY','CHAPTER5_SIDE_QUESTS','CHAPTER5_BOSSES','CHAPTER5_MINIBOSSES'],
    'chapters7_10':['CHAPTERS_7_10','EMPYREAN_BOSSES','EMPYREAN_MINIBOSSES','EMPYREAN_SIDE_QUESTS'],
    'world3':['WORLD3_CHAPTERS','WORLD3_BOSSES','WORLD3_MINIBOSSES','WORLD3_SIDE_QUESTS'],
    'world4':['WORLD4_CHAPTERS','WORLD4_BOSSES','WORLD4_MINIBOSSES','WORLD4_SIDE_QUESTS'],
    'ancient_saga':['ANCIENT_SAGA_CHAPTERS','ANCIENT_SAGA_BOSSES','ANCIENT_SAGA_MINIBOSSES','ANCIENT_SAGA_SIDE_QUESTS'],
    'world5':['WORLD5_CHAPTERS','WORLD5_SIDE_QUESTS','WORLD5_BOSSES','WORLD5_MINIBOSSES'],
    'world6':['WORLD6_CHAPTERS','WORLD6_SIDE_QUESTS','WORLD6_BOSSES','WORLD6_MINIBOSSES'],
    'world7':['WORLD7_CHAPTERS','WORLD7_SIDE_QUESTS','WORLD7_BOSSES','WORLD7_MINIBOSSES'],
    'world8':['WORLD8_CHAPTERS','WORLD8_SIDE_QUESTS','WORLD8_BOSSES','WORLD8_MINIBOSSES'],
    'world9':['WORLD9_CHAPTERS','WORLD9_SIDE_QUESTS','WORLD9_BOSSES','WORLD9_MINIBOSSES'],
    'world10':['WORLD10_CHAPTERS','WORLD10_SIDE_QUESTS','WORLD10_BOSSES','WORLD10_MINIBOSSES'],
    'world11':['WORLD11_CHAPTERS','WORLD11_BOSS'], 'world12':['WORLD12_CHAPTERS'],
    'die_guide':['DIE_GUIDE'], 'the_one_who_remains':['REMAINING_CHAPTERS','REMAINING_BOSS','TEMPORAL_SCARS','THRESHOLD_DANGEROUS','THRESHOLD_TRUSTED'],
}.items():
    if mn in module_data:
        for key in keys:
            if key in module_data[mn]: registries.setdefault(key,module_data[mn][key])

# Include all cutscene scripts and die guide pages as data, not just their first chapter references.
cutscenes={}
for mn, vals in module_data.items():
    selected={k:v for k,v in vals.items() if 'CUTSCENE' in k or k=='DIE_GUIDE' or k.startswith('REMAINING_') or k=='TEMPORAL_SCARS'}
    if selected: cutscenes[mn]=selected

# Aggregate all quest/boss/zone catalogs so browser menus can inspect them.
catalogs={}
for mn,vals in module_data.items():
    for k,v in vals.items():
        if any(token in k for token in ['QUEST','BOSS','MINIBOSS','MOB','ZONE','FACTION','CUTSCENE','SHARD','REMAINING','DIE_GUIDE','LORE','MEMENTO','COMPANION','SHADOW','ENCHANT','WEAPON','ARMOR','SHIELD','RING','MATERIAL','CLASS']):
            catalogs[f'{mn}.{k}']=v

payload={
  'meta': {'title':'Chronicles of Destiny — Web Edition','source':'Definitive Edition v1.2.2','chapter_count':len(set(x['chapter_number'] for x in chapters)),'step_count':len(chapters),'world_count':18,'note':'Narrative data exported from the original Python modules; gameplay rendering is handled by the browser engine.'},
  'worlds': world_names,
  'chapters': chapters,
  'inline_dialogue': extract_main_dialogues(),
  'chapter6_variants': chapter6_variants,
  'registries': registries,
  'catalogs': catalogs,
  'modules': module_data,
  'cutscenes': cutscenes,
}
path=OUT/'chronicles_content.json'
path.write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print('Wrote',path,'bytes',path.stat().st_size)
print('Chapters:',len(set(x['chapter_number'] for x in chapters)),'steps:',len(chapters),'ranges:',min(x['chapter_number'] for x in chapters),max(x['chapter_number'] for x in chapters))
missing=sorted(set(range(1,97))-set(x['chapter_number'] for x in chapters))
print('Missing chapter numbers:',missing)
print('Registries:',len(registries),'catalogs:',len(catalogs),'modules:',len(module_data),'inline dialogue calls:',len(payload['inline_dialogue']),'cutscene groups:',list(cutscenes))
