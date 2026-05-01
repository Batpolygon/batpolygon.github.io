// --- CONFIGURATION DES ASSETS ---
const ASSETS = {
    elements: 'assets/elements/',
    moutonmons: 'assets/moutonmons/',
    musics: 'assets/musics/',
    sounds: 'assets/sounds/'
};

const TYPE_CONFIG = {
    FIRE: { file: 'Feu.png', name: 'Feu' },
    WATER: { file: 'Eau.png', name: 'Eau' },
    PLANT: { file: 'Herbe.png', name: 'Herbe' },
    ELEC: { file: 'Electrique.png', name: 'Électrique' },
    ICE: { file: 'Glace.png', name: 'Glace' },
    GROUND: { file: 'Sol.png', name: 'Sol' },
    ROCK: { file: 'Roche.png', name: 'Roche' },
    PSY: { file: 'Psychique.png', name: 'Psychique' },
    DARK: { file: 'Sombre.png', name: 'Sombre' },
    LIGHT: { file: 'Lumiere.png', name: 'Lumière' },
    RADIO: { file: 'Radioactif.png', name: 'Radioactif' }
};

const MOUTON_DATA = [
    { id: 'FIRE',   hp: 110, atk: 35, spd: 25, res: 20 }, 
    { id: 'WATER',  hp: 120, atk: 25, spd: 20, res: 35 }, 
    { id: 'PLANT',  hp: 135, atk: 25, spd: 25, res: 20 }, 
    { id: 'ELEC',   hp: 100, atk: 35, spd: 45, res: 15 }, 
    { id: 'ICE',    hp: 160, atk: 30, spd: 15, res: 25 }, 
    { id: 'GROUND', hp: 180, atk: 25, spd: 10, res: 35 }, 
    { id: 'ROCK',   hp: 200, atk: 20, spd: 10, res: 40 }, 
    { id: 'PSY',    hp: 110, atk: 38, spd: 30, res: 50 }, 
    { id: 'DARK',   hp: 105, atk: 50, spd: 35, res: 10 }, 
    { id: 'LIGHT',  hp: 115, atk: 30, spd: 50, res: 25 }, 
    { id: 'RADIO',  hp: 195, atk: 48, spd: 48, res: 48, secret: true }
];

const TYPE_CHART = {
    FIRE: { strong: ['PLANT', 'ICE'], weak: ['WATER', 'ROCK'] },
    WATER: { strong: ['FIRE', 'ROCK'], weak: ['ELEC', 'PLANT'] },
    PLANT: { strong: ['WATER', 'GROUND'], weak: ['FIRE', 'ICE'] },
    ELEC: { strong: ['WATER', 'ICE'], weak: ['GROUND', 'ROCK'] },
    ICE: { strong: ['PLANT', 'GROUND'], weak: ['FIRE', 'ELEC'] },
    GROUND: { strong: ['ELEC', 'FIRE'], weak: ['WATER', 'ICE'] },
    ROCK: { strong: ['FIRE', 'ELEC'], weak: ['WATER', 'GROUND'] },
    PSY: { strong: ['DARK', 'RADIO'], weak: ['LIGHT'] },
    DARK: { strong: ['PSY', 'LIGHT'], weak: ['RADIO'] },
    LIGHT: { strong: ['DARK', 'RADIO'], weak: ['PSY'] },
    RADIO: { strong: ['FIRE', 'WATER', 'PLANT', 'ELEC', 'ICE', 'GROUND', 'ROCK'], weak: ['PSY', 'LIGHT'] }
};

// --- SYSTÈME AUDIO ---
const audio = {
    ost: new Audio(ASSETS.musics + 'MoutonmonFastFightOST.mp3'),
    click: new Audio(ASSETS.sounds + 'Click.wav'),
    hit: new Audio(ASSETS.sounds + 'Hit.wav'),
    dodge: new Audio(ASSETS.sounds + 'Dodge.wav')
};
audio.ost.loop = true;

let state = {
    playerTeam: [], enemyTeam: [],
    currentPlayer: null, currentEnemy: null,
    selectedStyle: 'normal', isBusy: false,
    tournamentIndex: 0, isKOReplacement: false,
    isRadioUnlocked: localStorage.getItem('radioUnlocked') === 'true',
    musicMuted: false, soundsMuted: false,
    firstInteract: false
};

function playSound(sound) {
    if (state.soundsMuted) return;
    sound.currentTime = 0;
    sound.play().catch(() => {});
}

function toggleMusic() {
    state.musicMuted = !state.musicMuted;
    const btn = document.getElementById('btn-music');
    if (state.musicMuted) {
        audio.ost.pause();
        btn.innerText = '🔇';
        btn.classList.add('muted');
    } else {
        audio.ost.play();
        btn.innerText = '🎵';
        btn.classList.remove('muted');
    }
    playSound(audio.click);
}

function toggleSound() {
    state.soundsMuted = !state.soundsMuted;
    const btn = document.getElementById('btn-sound');
    btn.innerText = state.soundsMuted ? '🔈' : '🔊';
    if (state.soundsMuted) btn.classList.add('muted'); else btn.classList.remove('muted');
    playSound(audio.click);
}

// --- INITIALISATION ---
function initSelection() {
    const grid = document.getElementById('selection-grid');
    grid.innerHTML = '';
    MOUTON_DATA.forEach(m => {
        if (m.secret && !state.isRadioUnlocked) return;
        const config = TYPE_CONFIG[m.id];
        const strongIcons = TYPE_CHART[m.id].strong.map(t => `<img src="${ASSETS.elements}${TYPE_CONFIG[t].file}" class="tooltip-icon">`).join('');
        const weakIcons = TYPE_CHART[m.id].weak.map(t => `<img src="${ASSETS.elements}${TYPE_CONFIG[t].file}" class="tooltip-icon">`).join('');

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="tooltip">
                <div class="tooltip-stats"><span>PV: ${m.hp}</span><span>ATK: ${m.atk}</span><span>VIT: ${m.spd}</span><span>RES: ${m.res}</span></div>
                <div style="border-top:1px solid #ddd;margin:5px 0"></div>
                <div class="tooltip-row"><span class="up">↑</span><div class="tooltip-icons">${strongIcons}</div></div>
                <div class="tooltip-row"><span class="down">↓</span><div class="tooltip-icons">${weakIcons}</div></div>
            </div>
            <img class="mouton-img" src="${ASSETS.moutonmons}${config.file}">
            <div class="card-footer"><img class="type-mini-icon" src="${ASSETS.elements}${config.file}"><span>${config.name}</span></div>
        `;
        card.onclick = () => {
            if(!state.firstInteract) { audio.ost.play(); state.firstInteract = true; }
            playSound(audio.click);
            selectMouton(m, card);
        };
        grid.appendChild(card);
    });
}

function selectMouton(m, el) {
    const idx = state.playerTeam.findIndex(item => item.id === m.id);
    if (idx > -1) { state.playerTeam.splice(idx, 1); el.classList.remove('selected'); }
    else if (state.playerTeam.length < 3) {
        state.playerTeam.push({ ...m, curHP: m.hp, ppW: 15, ppS: 3, nextPrio: false, isDodging: false, hasDodged: false, hasHealed: false });
        el.classList.add('selected');
    }
    updateSelectionUI();
}

function updateSelectionUI() {
    const wrapper = document.getElementById('start-button-wrapper');
    for (let i = 0; i < 3; i++) {
        const slot = document.getElementById(`slot-${i}`);
        if (state.playerTeam[i]) { 
            slot.innerHTML = `<img src="${ASSETS.moutonmons}${TYPE_CONFIG[state.playerTeam[i].id].file}">`; 
            slot.classList.add('filled'); 
        } else { slot.innerHTML = ''; slot.classList.remove('filled'); }
    }
    if (state.playerTeam.length === 3) { 
        wrapper.classList.remove('hidden'); 
        document.getElementById('btn-start-tournament').disabled = false; 
    } else { 
        wrapper.classList.add('hidden'); 
    }
}

// --- IA STRATÉGIQUE ---
function getSmartAIAction() {
    const e = state.currentEnemy;
    const p = state.currentPlayer;
    if (e.curHP / e.hp < 0.3 && !e.hasHealed) return { action: 'heal', style: 'normal' };
    const styles = ['strong', 'normal', 'fast'];
    for (let s of styles) {
        let potentialDmg = calculatePotentialDmg(e, p, 'strong', s);
        if (potentialDmg >= p.curHP && e.ppS > 0) return { action: 'strong', style: s };
    }
    if (!e.hasDodged && Math.random() < 0.15) return { action: 'dodge', style: 'fast' };
    return { action: (e.ppS > 0 && Math.random() > 0.5) ? 'strong' : 'weak', style: ['fast', 'normal', 'strong'][Math.floor(Math.random() * 3)] };
}

function calculatePotentialDmg(atk, def, type, style) {
    let base = type === 'weak' ? 22 : 48;
    if (style === 'fast') base /= 1.5;
    if (style === 'strong') base *= 1.5;
    const mult = getMultiplier(atk.id, def.id);
    return Math.max(8, Math.floor(((base + atk.atk) * mult) - (def.res / 2)));
}

// --- COMBAT ---
async function handleAction(actionType) {
    if (state.isBusy) return;
    const p = state.currentPlayer;
    const e = state.currentEnemy;

    if (actionType === 'weak' && p.ppW <= 0) return;
    if (actionType === 'strong' && p.ppS <= 0) return;
    if (actionType === 'dodge' && p.hasDodged) return;
    if (actionType === 'heal' && p.hasHealed) return;

    playSound(audio.click);
    state.isBusy = true;
    const ai = getSmartAIAction();

    // Calcul de l'ordre INITIAL basé sur nextPrio du tour d'avant
    const order = calculateTurnOrder(state.selectedStyle, ai.style, actionType, ai.action);
    
    // Consommation des flags de priorité
    p.nextPrio = false;
    e.nextPrio = false;

    // Activation des nouveaux effets d'esquive
    if (actionType === 'dodge') { p.isDodging = true; p.hasDodged = true; p.nextPrio = true; }
    if (ai.action === 'dodge') { e.isDodging = true; e.hasDodged = true; e.nextPrio = true; }

    updateTurnOrderSidebar(order);

    const names = { weak: 'Attaque Faible', strong: 'Attaque Forte', heal: 'Soin Urgent', dodge: 'Esquive' };
    const styleLabels = { fast: 'Rapide', normal: 'Normal', strong: 'Fort' };

    for (const actor of order) {
        if (state.currentPlayer.curHP <= 0 || state.currentEnemy.curHP <= 0) break;
        const isP = actor === 'player';
        const curM = isP ? state.currentPlayer : state.currentEnemy;
        const curS = isP ? state.selectedStyle : ai.style;
        const curA = isP ? actionType : ai.action;

        let label = (curA === 'heal' || curA === 'dodge') ? names[curA] : `Style ${styleLabels[curS]} : ${names[curA]}`;
        await showStyleNotif(isP, label);

        if (curA === 'heal') {
            curM.hasHealed = true;
            const amt = Math.floor(curM.hp * 0.75);
            curM.curHP = Math.min(curM.hp, curM.curHP + amt);
            document.getElementById('battle-log').innerText = `${TYPE_CONFIG[curM.id].name} se soigne !`;
            updateArenaUI();
        } else if (curA === 'dodge') {
            playSound(audio.dodge);
            const id = isP ? 'wrapper-player' : 'wrapper-enemy';
            document.getElementById(id).classList.add('dodge-jump');
            await new Promise(r => setTimeout(r, 400));
            document.getElementById(id).classList.remove('dodge-jump');
        } else {
            await executeMove(curM, isP ? state.currentEnemy : state.currentPlayer, curA, curS, isP);
        }
        await new Promise(r => setTimeout(r, 600));
    }

    state.currentPlayer.isDodging = false;
    state.currentEnemy.isDodging = false;
    state.isBusy = false;
    updateArenaUI();
    updateTurnOrderSidebar(calculateTurnOrder(state.selectedStyle, 'normal', 'weak', 'weak'));
    checkBattleEnd();
}

async function executeMove(atk, def, type, style, isP) {
    if (isP) { if (type === 'weak') atk.ppW--; else atk.ppS--; }
    else { if (type === 'strong') atk.ppS--; }

    if (def.isDodging) {
        document.getElementById('battle-log').innerText = "C'est esquivé !";
        updateArenaUI();
        return;
    }

    const wrapperId = isP ? 'wrapper-player' : 'wrapper-enemy';
    const targetId = isP ? 'wrapper-enemy' : 'wrapper-player';
    document.getElementById(wrapperId).classList.add(isP ? 'attack-p' : 'attack-e');

    let dmg = calculatePotentialDmg(atk, def, type, style);
    def.curHP = Math.max(0, def.curHP - dmg);

    setTimeout(() => {
        playSound(audio.hit);
        document.getElementById(targetId).classList.add('hit-shake');
        document.getElementById('battle-log').innerHTML = `Dégâts : <b>${dmg}</b> !`;
        updateArenaUI();
    }, 250);

    await new Promise(r => setTimeout(r, 600));
    document.getElementById(wrapperId).classList.remove('attack-p', 'attack-e');
    document.getElementById(targetId).classList.remove('hit-shake');
}

// --- SYSTÈMES ---
function getPrioValue(m, s, action) {
    let p = 0;
    if (m.nextPrio) p += 10000;
    if (action === 'dodge' || action === 'heal') p += 1000;
    if (s === 'fast') p += 100; if (s === 'strong') p -= 100;
    return p + m.spd;
}

function calculateTurnOrder(pS, eS, pA, eA) {
    const pV = getPrioValue(state.currentPlayer, pS, pA);
    const eV = getPrioValue(state.currentEnemy, eS, eA);
    return pV >= eV ? ['player', 'enemy'] : ['enemy', 'player'];
}

function updateTurnOrderSidebar(order) {
    const list = document.getElementById('turn-list');
    list.innerHTML = '';
    order.forEach(actor => {
        const div = document.createElement('div');
        div.className = 'turn-item';
        const isP = actor === 'player';
        const m = isP ? state.currentPlayer : state.currentEnemy;
        let label = isP ? 'JOUEUR' : 'ENNEMI';
        if (m.nextPrio) { label = "PRIORITÉ ESQUIVE"; div.classList.add('priority'); }
        div.innerHTML = `<img src="${ASSETS.moutonmons}${TYPE_CONFIG[m.id].file}"><small>${label}</small>`;
        list.appendChild(div);
    });
}

function selectStyle(s) {
    playSound(audio.click);
    state.selectedStyle = s;
    document.querySelectorAll('.btn-style').forEach(b => b.classList.remove('active'));
    document.getElementById('style-' + s).classList.add('active');
    if (!state.isBusy && state.currentPlayer) updateTurnOrderSidebar(calculateTurnOrder(state.selectedStyle, 'normal', 'weak', 'weak'));
}

function getMultiplier(atkId, defId) {
    if (TYPE_CHART[atkId].strong.includes(defId)) return 2;
    if (TYPE_CHART[atkId].weak.includes(defId)) return 0.5;
    return 1;
}

async function showStyleNotif(isP, text) {
    const el = document.getElementById(isP ? 'style-notif-player' : 'style-notif-enemy');
    el.innerText = text; el.classList.add('show');
    await new Promise(r => setTimeout(r, 800));
    el.classList.remove('show');
}

function updateArenaUI() {
    const p = state.currentPlayer, e = state.currentEnemy;
    document.getElementById('player-hp-fill').style.width = (p.curHP/p.hp*100) + '%';
    document.getElementById('enemy-hp-fill').style.width = (e.curHP/e.hp*100) + '%';
    document.getElementById('pp-weak').innerText = `PA ${p.ppW}`;
    document.getElementById('pp-strong').innerText = `PA ${p.ppS}`;
    document.getElementById('heal-status').innerText = p.hasHealed ? "Utilisé" : "1/1";
    document.getElementById('dodge-status').innerText = p.hasDodged ? "Utilisée" : "Prête";
    document.getElementById('btn-weak').disabled = (p.ppW <= 0);
    document.getElementById('btn-strong').disabled = (p.ppS <= 0);
    document.getElementById('btn-dodge').disabled = p.hasDodged;
    document.getElementById('btn-heal').disabled = p.hasHealed;

    const pM = getMultiplier(p.id, e.id), eM = getMultiplier(e.id, p.id);
    const pArr = document.getElementById('player-matchup');
    pArr.innerText = pM > 1 ? '↑' : (pM < 1 ? '↓' : '▬');
    pArr.className = `matchup-arrow ${pM > 1 ? 'up' : (pM < 1 ? 'down' : 'neut')}`;
    const eArr = document.getElementById('enemy-matchup');
    eArr.innerText = eM > 1 ? '↑' : (eM < 1 ? '↓' : '▬');
    eArr.className = `matchup-arrow ${eM > 1 ? 'up' : (eM < 1 ? 'down' : 'neut')}`;
}

// --- NAVIGATION ---
document.getElementById('btn-start-tournament').onclick = () => {
    playSound(audio.click);
    const pool = MOUTON_DATA.filter(m => !m.secret).sort(() => 0.5 - Math.random());
    state.enemyTeam = pool.map(m => ({ ...m, curHP: m.hp, ppW: 15, ppS: 3, isDodging: false, hasDodged: false, hasHealed: false, nextPrio: false, name: TYPE_CONFIG[m.id].name }));
    const radio = MOUTON_DATA.find(m => m.id === 'RADIO');
    state.enemyTeam.push({ ...radio, curHP: radio.hp, ppW: 15, ppS: 3, isDodging: false, hasDodged: false, hasHealed: false, nextPrio: false, name: "Radioactif" });
    state.tournamentIndex = 0;
    state.isKOReplacement = false;
    renderOrderOptions(); showScreen('screen-order');
};

function renderOrderOptions() {
    const grid = document.getElementById('order-options'); grid.innerHTML = '';
    const enemy = state.enemyTeam[state.tournamentIndex];
    document.getElementById('tournament-progress').innerText = `COMBAT ${state.tournamentIndex + 1} / 11`;
    document.getElementById('order-instruction').innerText = state.isKOReplacement ? "Vengez votre Moutonmon !" : "Choisissez votre leader :";
    
    state.playerTeam.forEach(m => {
        const card = document.createElement('div');
        card.className = 'card' + (m.curHP <= 0 ? ' locked' : '');
        let arrowHtml = "";
        const config = TYPE_CONFIG[m.id];
        if (state.isKOReplacement && m.curHP > 0) {
            const mult = getMultiplier(m.id, enemy.id);
            arrowHtml = `<span class="matchup-arrow ${mult > 1 ? 'up' : (mult < 1 ? 'down' : 'neut')}">${mult > 1 ? '↑' : (mult < 1 ? '↓' : '▬')}</span>`;
        }
        card.innerHTML = `
            <img src="${ASSETS.moutonmons}${config.file}">
            <div style="font-size:12px; font-weight:bold;">${config.name} ${arrowHtml}</div>
            <div class="card-footer" style="margin-top:2px;">
                <img class="type-mini-icon" src="${ASSETS.elements}${config.file}">
                <span style="font-size:10px; color:#7bed9f">PV: ${Math.floor(m.curHP)}</span>
            </div>
        `;
        if (m.curHP > 0) card.onclick = () => { playSound(audio.click); state.currentPlayer = m; state.currentEnemy = enemy; setupBattle(); showScreen('screen-battle'); };
        grid.appendChild(card);
    });
}

function setupBattle() {
    const p = state.currentPlayer, e = state.currentEnemy;
    document.getElementById('player-name').innerText = TYPE_CONFIG[p.id].name;
    document.getElementById('player-sprite').src = `${ASSETS.moutonmons}${TYPE_CONFIG[p.id].file}`;
    document.getElementById('player-type-icon').src = `${ASSETS.elements}${TYPE_CONFIG[p.id].file}`;
    document.getElementById('enemy-name').innerText = e.name;
    document.getElementById('enemy-sprite').src = `${ASSETS.moutonmons}${TYPE_CONFIG[e.id].file}`;
    document.getElementById('enemy-type-icon').src = `${ASSETS.elements}${TYPE_CONFIG[e.id].file}`;
    document.getElementById('battle-log').innerText = "Au combat !";
    p.isDodging = false; selectStyle('normal'); updateArenaUI();
}

function openSwitchMenu() {
    if (state.isBusy) return;
    playSound(audio.click);
    const overlay = document.getElementById('switch-menu'), list = document.getElementById('switch-list');
    list.innerHTML = '';
    state.playerTeam.forEach(m => {
        if (m.curHP > 0 && m.id !== state.currentPlayer.id) {
            const mult = getMultiplier(m.id, state.currentEnemy.id);
            const config = TYPE_CONFIG[m.id];
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <img src="${ASSETS.moutonmons}${config.file}">
                <div style="font-size:12px; font-weight:bold;">${config.name}</div>
                <div class="card-footer" style="margin-top:2px;">
                   <img class="type-mini-icon" src="${ASSETS.elements}${config.file}">
                   <span class="matchup-arrow ${mult > 1 ? 'up' : (mult < 1 ? 'down' : 'neut')}">${mult > 1 ? '↑' : (mult < 1 ? '↓' : '▬')}</span>
                </div>
            `;
            card.onclick = () => { playSound(audio.click); confirmSwitch(m); };
            list.appendChild(card);
        }
    });
    overlay.style.display = 'flex';
}

function closeSwitchMenu() { playSound(audio.click); document.getElementById('switch-menu').style.display = 'none'; }

async function confirmSwitch(newM) {
    closeSwitchMenu(); state.isBusy = true;
    document.getElementById('wrapper-player').style.opacity = '0.3';
    await new Promise(r => setTimeout(r, 400));
    state.currentPlayer = newM; setupBattle();
    document.getElementById('wrapper-player').style.opacity = '1';
    await executeMove(state.currentEnemy, state.currentPlayer, 'weak', 'normal', false);
    state.isBusy = false; updateArenaUI(); checkBattleEnd();
}

function checkBattleEnd() {
    if (state.currentEnemy.curHP <= 0) {
        state.tournamentIndex++;
        if (state.tournamentIndex >= 11) {
            // On change le titre de l'écran de fin
            document.getElementById('end-title').innerText = "BRAVO !";

            // Message de base
            let msg = "Tu as terminé le tournoi et vaincu tous les Moutonmons !";

            // Vérifier si c'est le premier déblocage du Radioactif
            if (!state.isRadioUnlocked) {
                msg += "<br><br><span style='color: var(--accent-yellow)'>Tu as débloqué le Moutonmon RADIOACTIF !</span>";
                localStorage.setItem('radioUnlocked', 'true');
                state.isRadioUnlocked = true;
            }

            document.getElementById('end-message').innerHTML = msg;
            showScreen('screen-end');
        }
        else {
            state.playerTeam.forEach(m => {
                m.curHP = Math.min(m.hp, Math.max(m.curHP, 0) + m.hp * 0.25);
                if (m.curHP <= 0) m.curHP = Math.floor(m.hp * 0.25);
                m.ppW = Math.min(15, m.ppW + 1); m.ppS = Math.min(3, m.ppS + 1);
                m.hasDodged = false; m.hasHealed = false;
            });
            state.isKOReplacement = false;
            const recoveryMsg = document.getElementById('recovery-msg');
            recoveryMsg.innerText = "Victoire ! Équipe soignée : +25% PV et +1 PA.";
            renderOrderOptions();
            showScreen('screen-order');
        }
    } else if (state.currentPlayer.curHP <= 0) {
        if (state.playerTeam.every(m => m.curHP <= 0)) { showScreen('screen-end'); document.getElementById('end-message').innerText = "Défaite totale..."; }
        else { 
            state.isKOReplacement = true;
            document.getElementById('recovery-msg').innerText = "";  
            renderOrderOptions(); 
            showScreen('screen-order'); }
    }
}

function showScreen(id) { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); document.getElementById(id).classList.add('active'); }

initSelection();
