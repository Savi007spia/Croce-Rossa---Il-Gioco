from pathlib import Path
import json, re, subprocess, shutil, sys
ROOT=Path(__file__).resolve().parent
DATA=json.loads((ROOT/'data'/'chronicles_content.json').read_text(encoding='utf-8'))
STORY=json.loads((ROOT/'data'/'red_cross_story.json').read_text(encoding='utf-8'))
assert DATA['meta']['chapter_count']==96
assert DATA['meta']['step_count']==285
assert {x['chapter_number'] for x in DATA['chapters']}==set(range(1,97))
assert DATA['chapters'][0]['title']=='Una Mattina Qualunque'
assert DATA['chapters'][-1]['title']=='Colui che Rimane'
assert len(DATA['worlds'])==18
assert len(STORY['playableChapters'])==6
assert len({stage[0] for stage in STORY['playableChapters']})==6
assert len(STORY['missions'])>=15
mission_ids={mission['id'] for mission in STORY['missions']}
assert all(set(stage[4])<=mission_ids for stage in STORY['playableChapters'])
for key in ['CLASS_DATA','SKILL_TREE','WEAPONS','ARMORS','SHIELDS','RINGS','TIMED_POLITICAL_QUESTS','AFTERLIGHT_CHAPTERS','REMAINING_CHAPTERS','REMAINING_BOSS','DIE_GUIDE']:
    assert key in DATA['registries'],f'Missing registry {key}'
html=(ROOT/'index.html').read_text(encoding='utf-8')
js=(ROOT/'app.js').read_text(encoding='utf-8')
ids=set(re.findall(r"\$\('([^']+)'\)",js))
htmlids=set(re.findall(r'\bid="([^"]+)"',html))
dynamic_ids={'itemActions','weatherSettingsStatus','realWeatherToggle'}
assert not (ids-htmlids-dynamic_ids), f'Missing HTML ids: {sorted(ids-htmlids-dynamic_ids)}'
assert (ROOT/'AVVIA_WEB.bat').exists() and (ROOT/'SOURCE_2D_REFERENCE.zip').exists()
for required_id in ['introScreen','introTitle','introText','introVisual','introBackBtn','introSkipBtn','introNextBtn','guideLoreBtn','guideDieBtn','guideControlsBtn']:
    assert required_id in htmlids, f'Missing onboarding UI id {required_id}'
for required_id in ['deviceScreen','deviceTitle','titleScreen','changeDeviceBtn','xrLaunch','enterXRBtn','xrStatus']:
    assert required_id in htmlids, f'Missing device selection or XR UI id {required_id}'
assert len(re.findall(r'data-device-mode="(?:pc|mobile|quest)"',html))==3, 'PC, mobile, and Quest device choices must be present'
for token in ["function chooseDeviceMode(","function prepareXRExperience(","enterXRAsync('immersive-vr'",'domOverlay:{root:document.body}','function pollXRControllers(','earnedBadges','Album dei distintivi']:
    assert token in js, f'Missing device or child-engagement feature {token}'
assert '#143b58' in (ROOT/'styles.css').read_text(encoding='utf-8'), 'Intro and explanation text must use the high-contrast dark color'
for required_id in ['mapBackdrop','areaMapTab','worldMapTab','areaMapView','worldMapView','worldMapContent']:
    assert required_id in htmlids, f'Missing map UI id {required_id}'
for required_id in ['hubToggleBtn','pauseHubBtn','destinyFill','destinyText','combatActions','battleDecision','resumeBattleBtn','restartBattleBtn','laterBattleBtn']:
    assert required_id in htmlids, f'Missing travel or combat recovery UI id {required_id}'
assert "BABYLON.Vector3.Cross(BABYLON.Vector3.Up(),forward)" in js, 'Sideways movement vector must point right'
assert "camera.inputs.attached.pointers.panningMouseButton=2" in js, 'Free camera panning must be enabled'
assert "function startIntro(mode='new',section='lore')" in js, 'Restored intro sequence missing'
assert 'function renderWorldMap()' in js and 'WORLD_UNLOCK_CHAPTERS' in js and 'WORLD_SAFE_CHRONICLES' in js, 'Spoiler-safe world atlas missing'
assert 'function controlsGuideMarkup(mode)' in js and 'DUALSHOCK 4' in js and 'guide-touchpad' in js, 'Controller guide missing'
assert "die_material','#050609'" in js and "ctx.fillStyle='#fff'" in js, 'Black-and-white fractured Destiny Die styling missing'
assert 'function controlsGuideMarkup(mode)' in js and 'data-controls-mode="keyboard"' in js and 'data-controls-mode="controller"' in js, 'Switchable input guide missing'
for symbol in ['運命','法則','記憶','必然','魂','再生']:
    assert symbol in js, f'Missing Destiny Die face symbol {symbol}'
assert "cube.rotation.set(.22,.4,.16)" not in js, 'Destiny Die face alignment regression'
assert '/lyra/i' in js and '/asterion|governatore/i' in js and '/kharon/i' in js, 'Character profiles missing'
assert 'function animateHumanoid(model,dt,now,moving=false,intensity=1)' in js, 'Character animation controller missing'
assert 'walkBlend' in js and 'leftKnee.rotation.x' in js and 'rightArm.rotation.x' in js, 'Walk cycle articulation missing'
assert 'playerVerticalVelocity' in js and 'jumpRequested' in js and "e.code==='Space'&&game" in js, 'Jump physics and input missing'
assert 'sprintFromDoubleTap' in js and 'keys.ShiftLeft||keys.ShiftRight' in js, 'Sprint controls missing'
assert 'function deleteSlot(i)' in js and 'localStorage.removeItem(slotKey(i))' in js, 'Slot deletion missing'
assert "className='slot-delete'" in js and 'skySystemElapsed=0' in js, 'Slot controls or sky update throttle missing'
assert 'engine.setHardwareScalingLevel' in js and 'scene.skipPointerMovePicking=true' in js, 'Browser rendering optimizations missing'
assert 'if(scene&&!document.hidden)scene.render()' in js and 'function freezeStaticMeshes(root)' in js, 'Render-loop or static mesh optimization missing'
assert "'KeyX'" in js and "attack:['KeyX']" in js, 'Default attack key must not conflict with jump'
assert 'api.open-meteo.com/v1/forecast' in js and 'navigator.geolocation.getCurrentPosition' in js, 'Opt-in local weather integration missing'
assert "for(let i=0;i<160;i++)" in js and 'horizon_rock' not in js, 'Updated sky or rock cleanup missing'
for token in ['function createHouseInterior(home)','function enterHouse(item)','function leaveHouse()','function interactWithHouseFeature(item)','opts.home?1.22:1','interior_floor_seam','interior_ceiling_beam',"gift:{type:'consumable',id:'pozione',quantity:1","gift:{type:'gold',amount:6","kind:'houseExit'","kind:'flavor'","home:home('mara'","home:home('teren'","home:home('faye'","home:home('nilo'","home:home('empty_west'"]:
    assert token in js, f'Missing explorable village feature {token}'
for token in ['function buildRedCrossWorld()','function makeCivicBuilding(','const RED_CROSS_DISCOVERIES=','function addWorldDiscoveries()','worldDiscovery_','Esplorazioni del quartiere','PUNTO SERVIZIO','content?.redCrossStory?630','content?.redCrossStory&&!isPlayer']:
    assert token in js, f'Missing alpha 0.1.20 Red Cross world feature {token}'
assert 'exteriorInteractables=interactables.filter' in js and 'interactables=(exteriorInteractables||houseEntrances).filter' in js, 'Leaving a house must restore exterior NPCs and objectives'
for token in ['profile.boss=isBoss','profile.miniBoss=isMiniBoss','function setBattleEnemyAction(action)','action===\'attack\'','action===\'guard\'','enemy_aura','enemy_ring']:
    assert token in js, f'Missing alpha 0.1.15 boss visuals or animations: {token}'
for token in ["kind==='blacksmith'","function renderForge()","function renderForgeRepairs(root)","function renderForgeWeapons(root)","function renderForgeRunes(root)","function wearEquipment(slot,amount)","function inscribeForgeRune(rune)","equipmentDurability","weaponRunes","registerForgeWeapons()","function repairAllForgeEquipment()","FORGE_RUNES"]:
    assert token in js, f'Missing alpha 0.1.16 forge feature {token}'
css=(ROOT/'styles.css').read_text(encoding='utf-8')
for token in ['.forge-layout','.forge-smith-art','.forge-tabs','.forge-item','.forge-condition']:
    assert token in css, f'Missing forge layout style {token}'
for required_id in ['settingsScreen','settingsScreenContent','titleSettingsBtn','pauseSettingsBtn','worldTime','worldPhase','worldWeather','controlsHint']:
    assert required_id in htmlids, f'Missing alpha 0.1.5 UI id {required_id}'
for token in ['function classArtworkSvg(','function weaponStyleForId(','function ensurePlayerInventory(','function makeInventoryEntries(category)','function grantInventoryItem(','function renderInventory()','function itemIconSvg(','function renderSettings(','function createSkySystem()','function updateSkySystem(','navigator.getGamepads','function finishKeyboardRebind(','function finishGamepadRebind(','ShadowGenerator','currentWeather']:
    assert token in js, f'Missing alpha 0.1.5 feature {token}'
assert "_hip_pivot" in js and "_knee_pivot" in js, 'Articulated limb pivots missing'
for token in ['function renderInn()','function renderShop()','function purchaseSkill(id)','function enterTownHub()','function leaveTownHub()','function showBattleResumeOptions()','function abandonBattle()','function handlePlayerDefeat(battle)','function enemyTurn()','function mpConnectionTimeout(message)','function dieSymbolsVisible()','function destinyCapacity(','game.player.destiny-=cost','if(dieSymbolsVisible())','dieSymbolsRevealed','skillPoints=(Number(game.player.skillPoints)||0)+points','skillPointsThroughLevel=level','stepIndex,hubMode,position']:
    assert token in js, f'Missing alpha 0.1.14 gameplay feature {token}'
assert "potions:5" in js and "action==='retreat'" in js, 'Starting supplies or battle retreat missing'
assert 'alpha 0.1.16' in (ROOT/'README_WEB_EDITION.md').read_text(encoding='utf-8'), 'Alpha 0.1.16 release notes missing'
for required_id in ['appearanceSkin','appearanceHairStyle','appearanceHairColor','appearanceOutfit','appearanceOutfitColor']:
    assert required_id in htmlids, f'Missing character customization control {required_id}'
for token in ['function makeGardenShrub(','function makeWildflower(','function customizedCharacterSvg(','appearance:normalizeAppearance(readAppearanceControls())','game.player.appearance=normalizeAppearance(game.player.appearance)']:
    assert token in js, f'Missing alpha 0.1.17 feature {token}'
assert 'alpha 0.1.20' in html and '## Novità alpha 0.1.20' in (ROOT/'README_WEB_EDITION.md').read_text(encoding='utf-8'), 'Web Edition version labels are inconsistent'
assert 'function mappedSaveStepIndex(' in js and 'game.schema=3' in js, 'Save migration to the six-stage campaign is missing'
assert 'Come si ottengono i distintivi' in json.dumps(STORY['intro'],ensure_ascii=False), 'Badge instructions missing from the intro'
assert 'def lan_addresses():' in (ROOT/'launch_web.py').read_text(encoding='utf-8'), 'LAN address display missing from the web launcher'
if shutil.which('node'):
    subprocess.run(['node','--check',str(ROOT/'app.js')],check=True)
print('WEB BUILD OK')
print('Capitoli:',DATA['meta']['chapter_count'],'| Scene narrative:',DATA['meta']['step_count'],'| Mondi:',len(DATA['worlds']))
print('Classi:',len(DATA['registries']['CLASS_DATA']),'| Armi:',len(DATA['registries']['WEAPONS']),'| Armature:',len(DATA['registries']['ARMORS']),'| Scudi:',len(DATA['registries']['SHIELDS']),'| Anelli:',len(DATA['registries']['RINGS']))
print('Dialoghi inline:',len(DATA.get('inline_dialogue',[])),'| Cataloghi:',len(DATA.get('catalogs',{})))
