// --- Avatar fallback (inline silhouette) ---
const SILHOUETTE_DATA = "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22256%22%20height%3D%22256%22%20viewBox%3D%220%200%20256%20256%22%3E%0A%3Crect%20width%3D%22256%22%20height%3D%22256%22%20fill%3D%22none%22/%3E%0A%3Ccircle%20cx%3D%22128%22%20cy%3D%2292%22%20r%3D%2254%22%20fill%3D%22%230b0b0f%22/%3E%0A%3Cpath%20d%3D%22M32%20240c6-60%2046-92%2096-92s90%2032%2096%2092%22%20fill%3D%22%230b0b0f%22/%3E%0A%3Cellipse%20cx%3D%22108%22%20cy%3D%2292%22%20rx%3D%2214%22%20ry%3D%2226%22%20fill%3D%22%23e6e6e6%22/%3E%0A%3Cellipse%20cx%3D%22148%22%20cy%3D%2292%22%20rx%3D%2214%22%20ry%3D%2226%22%20fill%3D%22%23e6e6e6%22/%3E%0A%3C/svg%3E";

/* CZĘŚĆ 2/4 będzie zawierała: dane gry, zapis, SFX oraz nowe systemy: Idle income i DMG upgrade */
(() => {

  // ----------------------------
  // Dungeon config (musi być zdefiniowane przed pierwszym renderem)
  const DUNGEON = {
  basePower: 100,
  growth: 1.05,        // ~11.5% per floor (realistycznie szybko rośnie)
  baseGold: 50,
  baseGems: 1,
};

  // ----------------------------

  // ----------------------------
  //  Logowanie ONLINE (bez lokalnych profili)
  // - Nie ma lokalnych kont ani haseł w localStorage.
  // - Dostęp do gry wymaga tokenu ONLINE_TOKEN_V2 (overlay w online_client.js).
  // - Zapis gry jest przypisany do konta online i synchronizowany z backendem (/api/save).
  // ----------------------------
  const getOnlineMe = () => (window.__MG_ONLINE_ME || null);

  // (compat) stałe klucze - nie używamy localStorage do zapisu postępu
  const SAVE_KEY = () => "MG_ONLINE_SAVE_DISABLED";
  const SAVE_BACKUP_KEY = () => "MG_ONLINE_SAVE_DISABLED_BACKUP";

  // ----------------------------
  // Data

  // ----------------------------
  const ELEMENTS = ["Ogień","Woda","Wiatr","Ziemia","Elektryczność","Lód","Legenda"];
  const units = {
    R: [
        {id:"r1",  name:"Mira",   stars:3,  element:"Woda",  basePower:8},
        {id:"r2",  name:"Kiro",   stars:3,  element:"Wiatr", basePower:8},
        {id:"r3",  name:"Tessa",  stars:3,  element:"Ogień", basePower:9},
        {id:"r4",  name:"Bran",   stars:3,  element:"Ziemia",basePower:9},
        {id:"r5",  name:"Lune",   stars:3,  element:"Lód",   basePower:8},
        {id:"r6",  name:"Vex",    stars:3,  element:"Elektryczność", basePower:9},
        {id:"r7",  name:"Suri",   stars:3,  element:"Woda",  basePower:8},
        {id:"r8",  name:"Pax",    stars:3,  element:"Wiatr", basePower:9},
        {id:"r9",  name:"Faro",   stars:3,  element:"Ogień", basePower:8},
        {id:"r10", name:"Dara",   stars:3,  element:"Ziemia",basePower:8},
        {id:"r11", name:"Iris",   stars:3,  element:"Lód",   basePower:9},
        {id:"r12", name:"Zed",    stars:3,  element:"Elektryczność", basePower:8},
        {id:"r13", name:"Nina",   stars:3,  element:"Woda",  basePower:9},
        {id:"r14", name:"Rook",   stars:3,  element:"Wiatr", basePower:8},
        {id:"r15", name:"Cora",   stars:3,  element:"Ogień", basePower:9},
        {id:"r16", name:"Oren",   stars:3,  element:"Ziemia",basePower:9},
        {id:"r17", name:"Miko",   stars:3,  element:"Lód",   basePower:8},
        {id:"r18", name:"Lyx",    stars:3,  element:"Elektryczność", basePower:9},
        {id:"r19", name:"Vala",   stars:3,  element:"Woda",  basePower:8},
        {id:"r20", name:"Rune",   stars:3,  element:"Wiatr", basePower:9},
        {id:"r21", name:"Bryn",   stars:3,  element:"Ogień", basePower:8},
        {id:"r22", name:"Kian",   stars:3,  element:"Ziemia",basePower:8},
        {id:"r23", name:"Ely",    stars:3,  element:"Lód",   basePower:9},
        {id:"r24", name:"Sio",    stars:3,  element:"Elektryczność", basePower:8}
    ],
    SR: [
        {id:"sr1", name:"Selene", stars:4, element:"Lód",   basePower:14},
        {id:"sr2", name:"Ronan",  stars:4, element:"Ziemia",basePower:15},
        {id:"sr3", name:"Nyra",   stars:4, element:"Woda",  basePower:14},
        {id:"sr4", name:"Kael",   stars:4, element:"Wiatr", basePower:15},
        {id:"sr5", name:"Aiden",  stars:4, element:"Ogień", basePower:15},
        {id:"sr6", name:"Mara",   stars:4, element:"Elektryczność", basePower:14},
        {id:"sr7", name:"Thorne", stars:4, element:"Ziemia",basePower:16},
        {id:"sr8", name:"Sable",  stars:4, element:"Wiatr", basePower:14},
        {id:"sr9", name:"Nerra",  stars:4, element:"Woda",  basePower:15},
        {id:"sr10",name:"Frost",  stars:4, element:"Lód",   basePower:15}
    ],
    SSR: [
        {id:"ssr1", name:"Astra", stars:5, element:"Ogień", basePower:30},
        {id:"ssr2", name:"Orion", stars:5, element:"Elektryczność", basePower:30},
        {id:"ssr3", name:"Eira",  stars:5, element:"Woda", basePower:30},
        {id:"ssr4", name:"Zephyr",stars:5, element:"Wiatr", basePower:30},
        {id:"ssr5", name:"Gaia",  stars:5, element:"Ziemia",basePower:30},
        {id:"ssr6", name:"Noctis",stars:5, element:"Lód",   basePower:30},
        {id:"ssr7",  name:"Pyra",    stars:5, element:"Ogień", basePower:30},
        {id:"ssr8",  name:"Blazeon", stars:5, element:"Ogień", basePower:30},
        {id:"ssr9",  name:"Ignis",   stars:5, element:"Ogień", basePower:30},
        {id:"ssr10", name:"Maris",   stars:5, element:"Woda", basePower:30},
        {id:"ssr11", name:"Nerida",  stars:5, element:"Woda", basePower:30},
        {id:"ssr12", name:"Aqualis", stars:5, element:"Woda", basePower:30},
        {id:"ssr13", name:"Aeris",   stars:5, element:"Wiatr", basePower:30},
        {id:"ssr14", name:"Sylphra", stars:5, element:"Wiatr", basePower:30},
        {id:"ssr15", name:"Gale",    stars:5, element:"Wiatr", basePower:30},
        {id:"ssr16", name:"Terran",  stars:5, element:"Ziemia", basePower:30},
        {id:"ssr17", name:"Obsidia", stars:5, element:"Ziemia", basePower:30},
        {id:"ssr18", name:"Gronn",   stars:5, element:"Ziemia", basePower:30},
        {id:"ssr19", name:"Voltus",  stars:5, element:"Elektryczność", basePower:30},
        {id:"ssr20", name:"Nyxcoil", stars:5, element:"Elektryczność", basePower:30},
        {id:"ssr21", name:"Arcana",  stars:5, element:"Elektryczność", basePower:30},
        {id:"ssr22", name:"Glacia",  stars:5, element:"Lód", basePower:30},
        {id:"ssr23", name:"Boreal",  stars:5, element:"Lód", basePower:30},
        {id:"ssr24", name:"Skadi",   stars:5, element:"Lód", basePower:30}
    ],
    UR: [
        {id:"ur1", name:"Gucio - Krakowski Krętacz", stars:6, element:"Legenda", basePower:45, class:"Tank"},
        {id:"ur2", name:"Arquel - Wódz Klubu", stars:6, element:"Legenda", basePower:45, class:"Support"},
        {id:"ur3", name:"Mammon - Legless z Płocka", stars:6, element:"Legenda", basePower:45, class:"Mage"},
        {id:"ur4", name:"KMNT - Terrorysta z Summoners Rift", stars:6, element:"Legenda", basePower:45},
        {id:"ur5",  name:"Bruno - Bestia z bojlera", stars:6, element:"Elo żelo", basePower:45, class:"Tank"},
        {id:"ur6",  name:"Anterias - Ta Rakieta", stars:6, element:"Elo żelo", basePower:45},
        {id:"ur7",  name:"OG Kubson - Mistrz Gragasa", stars:6, element:"Elo żelo", basePower:45},
        {id:"ur12", name:"Chciwy Benek - Chciwy zjebek", stars:6, element:"Elo żelo", basePower:45},
        {id:"ur8",  name:"Fredi Fnaf - Hor Hor Hor", stars:6, element:"FNAF", basePower:45, class:"DPS"},
        {id:"ur9",  name:"Eleven - Ten który nie słyszał oddechu", stars:6, element:"FNAF", basePower:45, class:"Support"},
        {id:"ur10", name:"Bonnie Fnaf - Nie oddychał przecież", stars:6, element:"FNAF", basePower:45, class:"Mage"},
        {id:"ur13", name:"William Afton - Mężczyzna za morderstwem", stars:6, element:"FNAF", basePower:45, class:"Tank"}
    ],
  };

  // UR LIMITED – do zdobycia tylko na banerze limitowanym
  const unitsLimited = [
    { id:"ur14", name:"Astra Prism", stars:6, element:"Limited", basePower:70, classTag:"Limited", desc:"Limitowana postać – pryzmatyczna moc." , class:"Mage"},
    { id:"ur15", name:"Nox Eclipse", stars:6, element:"Limited", basePower:70, classTag:"Limited", desc:"Limitowana postać – cień i blask." , class:"DPS"},
    { id:"ur16", name:"Vera Nova", stars:6, element:"Limited", basePower:70, classTag:"Limited", desc:"Limitowana postać – eksplozja gwiazd." , class:"Support"},
    { id:"ur17", name:"Lyra Halo", stars:6, element:"Limited", basePower:70, classTag:"Limited", desc:"Limitowana postać – świetlista aura." , class:"Tank"}
  ];

  const ALL_UNITS = [...units.R, ...units.SR, ...units.SSR, ...units.UR, ...unitsLimited];
  function starsToRarity(st){
    const s = Number(st)||0;
    if(s>=6) return "UR";
    if(s==5) return "SSR";
    if(s==4) return "SR";
    return "R";
  }
  function unitRarity(u){
    return u?.rarity || starsToRarity(u?.stars);
  }


  // ----------------------------
  // Classes + Talent tree (simple, single-player friendly)
  // - Class is cosmetic/strategic label
  // - Talents give small permanent bonuses (affect unitPower)
  // ----------------------------
  const CLASSES = ["DPS","Tank","Support","Mage"];
  function defaultClassFor(u){
    if(!u) return "DPS";
    if(u.element === "Woda" || u.element === "Lód") return "Mage";
    if(u.element === "Ziemia") return "Tank";
    if(u.element === "Wiatr") return "Support";
    if(u.element === "Elektryczność") return "DPS";
    if(u.element === "Limited") return "DPS";
    // Legenda / FNAF / Elo żelo
    return "DPS";
  }
  function bestTalentForClass(cls){
    const c = String(cls||"DPS").toLowerCase();
    if(c === "tank") return "guardian";
    if(c === "support") return "scholar";
    if(c === "mage") return "scholar";
    // default DPS
    return "striker";
  }
  function bestTalentLabelForClass(cls){
    const t = bestTalentForClass(cls);
    if(t==="guardian") return "Guardian";
    if(t==="scholar") return "Scholar";
    return "Striker";
  }

  // Talent scaling depends on class so the recommendation is actually optimal.
  // Values are per 1 talent point.
  function talentPctPerPointFor(cls, key){
    const c = String(cls||"DPS").toLowerCase();
    const k = String(key||"").toLowerCase();
    // Defaults (DPS): Striker best
    let map = { striker: 0.02, scholar: 0.015, guardian: 0.01 };
    if(c === "tank")     map = { guardian: 0.02, scholar: 0.015, striker: 0.01 };
    if(c === "support")  map = { scholar: 0.02, guardian: 0.015, striker: 0.01 };
    if(c === "mage")     map = { scholar: 0.02, striker: 0.015, guardian: 0.01 };
    return map[k] ?? 0.01;
  }

  for(const u of ALL_UNITS){
    if(!u.class) u.class = defaultClassFor(u);
  }

  function talentPointsTotalForUnitState(st){
    const lvl = Math.max(1, st?.level||1);
    const asc = Math.max(0, st?.ascTier||0);
    const bought = Math.max(0, st?.talentBought||0);
    return Math.floor(lvl/5) + asc + bought; // 1pt per 5 lvls + asc tier + bought pts
  }

  function talentBuyCost(st){
    // Koszt rośnie za każdy zakupiony punkt, żeby nie dało się "zalać" talentów za grosze.
    const bought = Math.max(0, st?.talentBought||0);
    return 1500 + bought * 1500; // 1500g, 3000g, 4500g, ...
  }
  function talentSpent(st){
    const t = st?.talents||{};
    return (t.striker|0) + (t.guardian|0) + (t.scholar|0);
  }
  function talentPointsFree(st){
    return Math.max(0, talentPointsTotalForUnitState(st) - talentSpent(st));
  }


  let BANNER = { name:"Banner Standard", rates:{UR:0.0025, SSR:0.02, SR:0.18, R:0.7975}, pitySoftStart:60, pityHard:90, urPitySoftStart:120, urPityHard:200, featuredURIds:null };
  // --- Multiple banners ---
  const BANNERS = {
    "default": { id:"default", ui:"Domyślny", name:"Domyślny • Wszystkie postacie", featuredURIds:null },
    "legenda": { id:"legenda", ui:"Legenda", name:"Legenda • Featured UR", featuredURIds:["ur1","ur2","ur3","ur4"] },
    "fnaf":    { id:"fnaf",    ui:"FNAF",    name:"FNAF • Featured UR",    featuredURIds:["ur8","ur9","ur10","ur13"] },
    "elo":     { id:"elo",     ui:"Elo żelo",name:"Elo żelo • Featured UR",featuredURIds:["ur5","ur6","ur7","ur12"] },
    "limited": { id:"limited", ui:"LIMITED", name:"LIMITED • 4 postacie (czasowo)", featuredURIds:["ur14","ur15","ur16","ur17"], expiresAt:"2026-01-01T00:00:00Z" },
  };

  // ----------------------------
  // Banner availability (LIMITED expiry)
  // ----------------------------
  function isBannerActive(id){
    const b = BANNERS[id];
    if(!b) return false;
    if(!b.expiresAt) return true;
    const t = Date.parse(b.expiresAt);
    if(!Number.isFinite(t)) return true; // jeśli zły format, nie blokuj
    return Date.now() < t;
  }

  // ----------------------------
  // Limited banner countdown UI
  // ----------------------------
  function limitedExpiryMs(){
    const b = BANNERS["limited"];
    const t = b && b.expiresAt ? Date.parse(b.expiresAt) : NaN;
    return Number.isFinite(t) ? t : NaN;
  }
  function formatRemaining(ms){
    ms = Math.max(0, ms|0);
    const s = Math.floor(ms/1000);
    const d = Math.floor(s/86400);
    const h = Math.floor((s%86400)/3600);
    const m = Math.floor((s%3600)/60);
    const ss = s%60;
    const parts = [];
    if(d) parts.push(d+"d");
    if(h || d) parts.push(String(h).padStart(2,"0")+"h");
    parts.push(String(m).padStart(2,"0")+"m");
    parts.push(String(ss).padStart(2,"0")+"s");
    return parts.join(" ");
  }
  function updateLimitedTimer(){
    const el = document.getElementById("limitedTimer");
    if(!el) return;
    const t = limitedExpiryMs();
    if(!Number.isFinite(t)){ el.textContent = "—"; return; }
    const ms = t - Date.now();
    if(ms <= 0){ el.textContent = "Zakończony"; return; }
    el.textContent = formatRemaining(ms);
  }

  // (NOTE) Stary timer "limitedTimer" był dublowany z nowszą implementacją i powodował miganie.
  // Aktualnie używamy wyłącznie updateLimitedTimerOnce()/startLimitedTimer() (sekcja ~2500).

  function setBanner(id){
    if(!isBannerActive(id)) id = "default";
    const b = BANNERS[id] || BANNERS["default"];
    BANNER.name = b.name;
    BANNER.featuredURIds = b.featuredURIds; // null => all UR allowed
    S.bannerId = b.id;

    
    BANNER.id = b.id;
// Banner-specific pity caps (LIMITED ma 500 pity na UR)
    if(b.id === "limited"){
      BANNER.urPitySoftStart = 450;
      BANNER.urPityHard = 500;
    } else {
      BANNER.urPitySoftStart = 120;
      BANNER.urPityHard = 200;
    }

    // ensure separate pity bucket exists for this banner
    // ❄️ Snow mode depends on banner (LIMITED => prism snow)
    if(window.__snow){ window.__snow.setMode(b.id === 'limited' ? 'prism' : 'white'); }

    getBannerPity(b.id);
  }

  const COST = { singleGem:160, tenGem:1600, singlePullTicket:1, tenPullTicket:10 };

  // C6 token sell prices (Gems per token)
  const C6_PRICES = { t3: 10, t4: 100, t5: 500, t6: 1000 };

  // Ascension
  const ASC = {
    maxTier: 10,
    baseMaxLevel: 10,
    perTierLevels: 10,
    cost: (rarity, tier) => {
      const rMult = rarity==="UR" ? 4 : (rarity==="SSR" ? 3 : (rarity==="SR" ? 2 : 1));
      return { gold: 2000 * rMult * (tier+1), essence: 10 * rMult * (tier+1),
        cores: (rarity==="SSR" ? 2 : rarity==="SR" ? 1 : 0) + (tier>=2 ? 1 : 0),
      };
    }
  };
  const maxLevelForTier = (tier) => ASC.baseMaxLevel + ASC.perTierLevels * tier;

  // Weekly
  const WEEKLY = {
    bossName: "Strażnik Szczeliny",
    basePower: 140,
    powerPerWeek: 10,
    rewards: { gold:5000, gems:160, essence:35, cores:2, bpXP:150 }
  };

  // Battle Pass
  const BP = {
    seasonDays: 28,
    xpPerLevel: 1000,
    maxLevel: 100,
    rewardForLevel: (lvl) => ({
      free:   (lvl%5===0) ? {type:"gems", amount:120} : {type:"gold", amount:1200},
      premium:(lvl%5===0) ? {type:"pulls", amount:1}  : {type:"essence", amount:10},
    })
  };

  // Constellations
  const CONST = { max:6, powerBonusPer:0.04, extraAt3:0.25, extraAt6:0.50 };

  // Arena
  const ARENA = {
    baseHP: 120, hpPerRank: 35,
    // mniejsze nagrody (zdrowsza ekonomia)
    baseGems: 2, gemsPerRank: 1,
    baseGold: 35, goldPerRank: 25
  };

  //  Upgrades (Gold)
  const UPG = {
    // nagrody: +10% per level
    rewardMult: (lvl) => 1 + 0.10*lvl,
    rewardCost: (lvl) => Math.floor(1200 * Math.pow(1.55, lvl)),
    // auto CPS: +0.5 hit/s per level
    cpsAdd: (lvl) => 0.5*lvl,
    cpsCost: (lvl) => Math.floor(900 * Math.pow(1.60, lvl)),
    //  dmg upgrade: +12% dmg per level
    dmgMult: (lvl) => 1 + 0.12*lvl,
    dmgCost: (lvl) => Math.floor(1400 * Math.pow(1.62, lvl)),

    tickMs: 500
  };

  //  Idle income
  const IDLE = {
    // co ile liczymy tick online
    tickMs: 2000,
    // max offline naliczany (żeby nie było 999 dni)
    maxOfflineSeconds: 8 * 3600, // 8 godzin
    // bazowe stawki / s (przed mnożnikami i teamem)
    baseGoldPerSec: 8,
    baseGemsPerSec: 0.08,
    // skalowanie od mocy teamu (logarytmiczne)
    powerFactor: (teamPower) => Math.log10(10 + teamPower) / 2.0, // ~0.5..~2+
    // bonus od posiadanych unikalnych
    ownedBonus: (owned) => 1 + Math.min(0.35, owned * 0.015),
  };

  // ----------------------------
  // Save
  // ----------------------------
  // Zapis jest przypisany do konta online (backend).
  const todayKey = () => new Date().toISOString().slice(0,10);
  function isoWeekKey(d = new Date()){
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
    const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1)/7);
    return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2,"0")}`;
  }

  const defaultSave = () => ({
    v: 5,
    gold: 5000, gems: 1600, pulls: 0, pity: 0, essence: 0, cores: 0, urPity: 0,
    tokensC6: { t3:0, t4:0, t5:0, t6:0 },
    seen: {}, // id -> { ownedCount, level, shards, ascTier, const }
    teamSlots: 4,
    team: [null,null,null,null],
	    settings: {
	      fastReveal:false,
	      animations:true,
	      sfx:true,
	      sfxVolume:0.45,
	      showAllDex:true,
	      // classic | portal2d | portal3d
	      wishFx: "classic",
	      theme: "midnight"
	    },
    lastReveal: null,
    // Historia poprzednich wishy (od najnowszego)
    // Każdy wpis: { at, bannerId, label, time, drops:[{id, rarity, element, name}] }
    wishHistory: [],

    daily: { lastLoginClaim:null, lastDailyReset:null, progress:{pulls:0, levelUps:0}, claimed:{p1:false,p5:false,lvl2:false} },
    weekly: { lastClaimWeek:null },

    dungeon: { floor: 1, best: 0, auto: false },

    bp: { seasonStart:null, premium:false, xp:0, level:0, claimedFree:{}, claimedPremium:{}, lastWeeklyBpReset:null, weeklyClaimed:{w1:false,wBoss:false} },

    arena: { rank:1, hp:120, maxHp:120, auto:false, totalKills:0 },

    upgrades: { rewardLvl:0, cpsLvl:0, dmgLvl:0 },

    //  rebirth (meta-progres)
    rebirth: {
      count: 0,
      essence: 0,
      perks: {
        gold: 0,      // +5% gold gain / lvl
        reward: 0,    // +4% reward mult / lvl
        dmg: 0,       // +3% dmg mult / lvl
        cps: 0,       // +0.2 hit/s / lvl
        start: 0      // +startowe zasoby / lvl
      }
    },

    //  idle
    idle: {
      lastTick: Date.now(),        // do online ticków
      lastOnlineAt: Date.now(),    // do offline naliczeń przy starcie
      pendingMsg: null
    },

    //  profil gracza (per konto)
    player: {
  username: (getOnlineMe()?.login || "offline"),
  displayName: (getOnlineMe()?.nick || getOnlineMe()?.login || "offline"),
  level: 1,
  xp: 0,
  avatar: { color: "#8fb3ff", icon: "⭐", motto: "" },
  claimedProfileRewards: {},
  achievementsClaimed: {},
  rewardsVersion: 1,
  createdAt: Date.now(),
  lastLoginAt: Date.now(),
},

    //  Kody (per profil) – NIE resetują się po rebirthie
    redeemedCodes: [],

    starterClaimed:false,
  });

  // Cloud save sync (online_client.js) needs access to the *live* game state.
  // The whole game runs inside an IIFE, so even `var S` would NOT attach to `window`.
  // We explicitly export getters/setters so cloud save can pull/push state reliably.
  let S = load();
  window.S = S;
  //  Permanent perks / flags (nie resetują się po rebirthie)
  S.perm ||= {};
  if(S.perm.limitBreakUnlocked == null) S.perm.limitBreakUnlocked = false;

  // settings defaults / migration
  S.settings ||= {};
  if(S.settings.fastReveal == null) S.settings.fastReveal = false;
  if(S.settings.animations == null) S.settings.animations = true;
  if(S.settings.sfx == null) S.settings.sfx = true;
  if(S.settings.sfxVolume == null) S.settings.sfxVolume = 0.45;
  if(S.settings.showAllDex == null) S.settings.showAllDex = true;
  if(!S.settings.wishFx) S.settings.wishFx = "classic";

  // UI state
  // (some builds missed this which caused: ReferenceError: currentTab is not defined)
  let currentTab = "banner";
  window.__MG_GET_STATE = () => S;

  // ----------------------------
  // Per-banner pity (oddzielne pity na każdy banner)
  // ----------------------------
  
function ensurePityStore(){
  if(!S.pityByBanner || typeof S.pityByBanner !== "object") S.pityByBanner = {};

  // migracja bardzo starych pól -> default banner (SSR/UR)
  if((typeof S.pity !== "undefined" || typeof S.urPity !== "undefined") && !S.__pityMigrated){
    const d = S.pityByBanner["default"] || (S.pityByBanner["default"] = { s5: 0, s6: 0, lost5050: false });
    if(typeof S.pity === "number" && (d.s5||0) === 0) d.s5 = S.pity;
    if(typeof S.urPity === "number" && (d.s6||0) === 0) d.s6 = S.urPity;
    delete S.pity;
    delete S.urPity;
    S.__pityMigrated = 1;
  }

  // migracja nowszych pól ssr/ur -> s5/s6
  if(!S.__pityStarsMigrated){
    for(const [bid, obj] of Object.entries(S.pityByBanner)){
      if(!obj || typeof obj !== "object") continue;
      if(typeof obj.ssr === "number" || typeof obj.ur === "number"){
        obj.s5 = (typeof obj.s5 === "number") ? obj.s5 : (obj.ssr||0);
        obj.s6 = (typeof obj.s6 === "number") ? obj.s6 : (obj.ur||0);
        delete obj.ssr;
        delete obj.ur;
      }
      if(obj.lost5050 == null) obj.lost5050 = false;
    }
    S.__pityStarsMigrated = 1;
  }

  const id = S.bannerId || "default";
  if(!S.pityByBanner[id]) S.pityByBanner[id] = { s5: 0, s6: 0, lost5050: false };
  if(S.pityByBanner[id].lost5050 == null) S.pityByBanner[id].lost5050 = false;
  if(S.pityByBanner[id].s5 == null) S.pityByBanner[id].s5 = 0;
  if(S.pityByBanner[id].s6 == null) S.pityByBanner[id].s6 = 0;
  return S.pityByBanner[id];
}
function getBannerPity(id){
  if(!S.pityByBanner || typeof S.pityByBanner !== "object") S.pityByBanner = {};
  if(!S.pityByBanner[id]) S.pityByBanner[id] = { s5: 0, s6: 0, lost5050: false };
  if(S.pityByBanner[id].lost5050 == null) S.pityByBanner[id].lost5050 = false;
  if(S.pityByBanner[id].s5 == null) S.pityByBanner[id].s5 = 0;
  if(S.pityByBanner[id].s6 == null) S.pityByBanner[id].s6 = 0;
  return S.pityByBanner[id];
}
function curPity(){ return ensurePityStore(); }

// Stars pity logic:
// - 6★ resetuje pity 5★ i 6★
// - 5★ resetuje pity 5★, a 6★ zwiększa (bo dalej "liczymy do 6★")
// - 3★/4★ zwiększają oba liczniki
function applyPityForStars(stars){
  const p = curPity();
  const s = Number(stars)||3;
  if(s >= 6){
    p.s5 = 0; p.s6 = 0;
  } else if(s === 5){
    p.s5 = 0; p.s6 = (p.s6||0) + 1;
  } else {
    p.s5 = (p.s5||0) + 1;
    p.s6 = (p.s6||0) + 1;
  }
}
  window.__MG_SET_STATE = (next) => {
    try {
      S = next;
      window.S = S;
      normalizeTeam();
    } catch (e) {
      console.warn("[MG] __MG_SET_STATE error", e);
    }
  };

  // --- team slots migration / normalization
  function normalizeTeam(){
    if(!S.teamSlots) S.teamSlots = 4;
    S.teamSlots = Math.max(4, Math.min(8, Math.floor(S.teamSlots)));
    if(!Array.isArray(S.team)) S.team = [];
    if(S.team.length < S.teamSlots){
      while(S.team.length < S.teamSlots) S.team.push(null);
    } else if(S.team.length > S.teamSlots){
      S.team = S.team.slice(0, S.teamSlots);
    }
  }
  normalizeTeam();

  function load(){
    // Online-only: start from defaults; online_client.js will pull cloud save and apply it to window.S.
    return defaultSave();
  }

  function save(){
    // Online-only: no localStorage persistence. online_client.js hooks save() and pushes window.S to cloud.
    try { window.S = S; } catch(e){}
    const st = document.querySelector("#saveState");
    if(st) st.textContent = "Zapis: w chmurze";
  }

  // ----------------------------
  //  Auto-save (bez ręcznego export/import)
  // ----------------------------
  const AUTOSAVE_INTERVAL_MS = 10000; // co 10 sekund
  let autosaveTimer = null;
  let limitedBannerTimer = null;

  function startAutoSave(){
    if(autosaveTimer) clearInterval(autosaveTimer);
    autosaveTimer = setInterval(() => {
      try{
        // odśwież znaczniki aktywności (ważne dla offline idle)
        if(S && S.idle){ S.idle.lastOnlineAt = Date.now(); S.idle.lastTick = Date.now(); }
        save();
        const st = document.querySelector("#saveState");
        if(st) st.textContent = "Zapis: Auto";
      }catch(e){
        console.warn("Autosave error", e);
      }
    }, AUTOSAVE_INTERVAL_MS);
    window.__autosaveTimer = autosaveTimer;
  }

  // zapis przy ukryciu karty / zamknięciu
  window.addEventListener("beforeunload", () => { try{ save(); }catch(e){} });
  window.addEventListener("pagehide", () => { try{ save(); }catch(e){} });
  document.addEventListener("visibilitychange", () => {
    if(document.visibilityState === "hidden"){
      try{ save(); }catch(e){}
    }
  });

  startAutoSave();

  // ----------------------------
  // Helpers
  // ----------------------------

  // ----------------------------
  //  deepMerge (bezpieczny merge save -> default)
  // - obiekty: merge rekursywny
  // - tablice: podmiana w całości (nie merge elementów)
  // - typy niezgodne: wartość z "source" jeśli nie jest undefined
  // ----------------------------
  function deepMerge(target, source){
    if(source == null) return target;
    if(typeof source !== "object") return (source === undefined ? target : source);

    // Arrays: replace completely
    if(Array.isArray(source)) return source.slice();

    // Objects
    const out = (target && typeof target === "object" && !Array.isArray(target)) ? {...target} : {};
    for(const k of Object.keys(source)){
      const sv = source[k];
      const tv = out[k];
      if(sv === undefined) continue;
      if(sv && typeof sv === "object"){
        out[k] = deepMerge(tv, sv);
      }else{
        out[k] = sv;
      }
    }
    return out;
  }
const $ = (q)=>document.querySelector(q);
  const $all = (q)=>[...document.querySelectorAll(q)];
  const clamp = (n,a,b)=>Math.max(a,Math.min(b,n));
  const fmt = (n)=>Math.floor(n).toLocaleString("pl-PL");
  const escapeHtml = (s)=>String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function fmtDateTime(ts){
    try{
      return new Date(ts).toLocaleString("pl-PL", { year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit" });
    }catch(e){
      return String(ts||"");
    }
  }

  function summarizeWishDrops(drops){
    try{
      const counts = {6:0,5:0,4:0,3:0};
      (drops||[]).forEach(d=>{ const s = rarityToStars(d?.rarity); if(counts[s]!=null) counts[s]++; });
      const parts = [];
      if(counts[6]) parts.push(`6★×${counts[6]}`);
      if(counts[5]) parts.push(`5★×${counts[5]}`);
      if(counts[4]) parts.push(`4★×${counts[4]}`);
      if(counts[3]) parts.push(`3★×${counts[3]}`);
      return parts.join(" • ") || `Pull x${(drops||[]).length}`;
    }catch(e){
      return `Pull x${(drops||[]).length}`;
    }
  }
  // Star rating helpers
  // Spec: R = 3★, SR = 4★, SSR = 5★, UR = 6★ (legacy rarity mapping kept only for old saves).
  function rarityToStars(r){
    const rr = String(r||"R").toUpperCase();
    if(rr === "UR") return 6;
    if(rr === "SSR") return 5;
    if(rr === "SR") return 4;
    return 3;
  }
  function unitStars(u){
    if(!u) return 3;
    const s = (u.stars!=null ? Number(u.stars) : null);
    if(s && isFinite(s)) return s;
    return rarityToStars(u.rarity);
  }
  // Star label helpers
  // NOTE: Many UI contexts (e.g. <option>, textContent) cannot render HTML.
  // - starLabelText: plain text (always safe)
  // - starLabelSpan: HTML span (for places using innerHTML)
  function starLabelText(stars){
    const s = Math.max(1, Math.min(6, Number(stars)||3));
    return `${s}★`;
  }
  function starLabelSpan(stars, isLimited){
    const s = Math.max(1, Math.min(6, Number(stars)||3));
    if(s === 6 && isLimited){
      return `<span class="prismaticText">6★</span>`;
    }
    return `${s}★`;
  }

  // RNG helpers (for leaderboard etc.)
  const randf = (a,b)=> (Math.random()*(b-a)+a);
  const randi = (a,b)=> Math.floor(randf(a, b+1));
  const pick = (arr)=> arr[Math.floor(Math.random()*arr.length)];
  const rarityClass = (r)=> r==="UR" ? "ur" : (r==="SSR" ? "ssr" : (r==="SR" ? "sr" : "r"));
  const rarSpan = (r)=> ""; // no rarity labels in UI
  const getUnitById = (id)=> ALL_UNITS.find(u=>u.id===id);
  const elementClass = (el)=> ({
    "Ogień":"el-fire",
    "Woda":"el-water",
    "Wiatr":"el-wind",
    "Ziemia":"el-earth",
    "Elektryczność":"el-electric",
    "Lód":"el-ice",
    "Legenda":"el-legend",
    "Elo żelo":"el-elo",
    "FNAF":"el-fnaf",
    "Limited":"el-limited"
  }[el] || "el-water");
  function hashInt(str){ let h=0; for(let i=0;i<str.length;i++){ h=((h<<5)-h)+str.charCodeAt(i); h|=0; } return Math.abs(h); }

  function toast(msg){
    const root = $("#toast");
    if(!root) return;

    // Keep the UI readable: at most 3 notifications visible.
    // Remove oldest first.
    try{
      while(root.children && root.children.length >= 3){
        root.removeChild(root.firstElementChild);
      }
    }catch(e){}
    const el = document.createElement("div");
    el.className = "t";
    const left = document.createElement("div");
    left.innerHTML = `<div><b>${escapeHtml(msg)}</b></div>`;
    const right = document.createElement("button");
    right.className = "btn";
    right.style.padding="6px 10px";
    right.textContent = "OK";
    right.onclick = () => el.remove();
    el.append(left, right);
    root.appendChild(el);
    setTimeout(() => el.remove(), 3800);
  }

  // ----------------------------
  //  Global visual FX helpers (LevelUp / Ascension / Artifact drop / Win / Lose)
  // ----------------------------
  function playGlobalFX(kind, opt={}){
    // respect animations toggle
    if(S.settings && S.settings.animations === false) return;
    const fx = document.createElement('div');
    fx.className = 'mg-fx';

    // base
    const center = document.createElement('div');
    center.className = 'mg-fxCenter';
    const burst = document.createElement('div');
    burst.className = 'mg-fxBurst';
    const ring = document.createElement('div');
    ring.className = 'mg-fxRing';
    const text = document.createElement('div');
    text.className = 'mg-fxText';

    const color = opt.color || '#ffffff';
    text.style.color = color;
    ring.style.borderColor = 'rgba(255,255,255,.55)';
    ring.style.boxShadow = `0 0 28px ${color}33`;
    burst.style.background = `radial-gradient(circle, ${color}33, rgba(255,255,255,0) 62%)`;

    const label = opt.label || (
      kind==='levelup' ? 'LEVEL UP' :
      kind==='ascend'  ? 'ASCENSION' :
      kind==='artifact'? 'DROP' :
      kind==='win'     ? 'WIN' :
      kind==='lose'    ? 'LOSE' :
      kind==='crit'    ? 'CRIT' :
      ''
    );
    text.textContent = label;

    center.appendChild(burst);
    center.appendChild(ring);
    center.appendChild(text);
    fx.appendChild(center);

    // win confetti
    if(kind==='win'){
      const conf = document.createElement('div');
      conf.className = 'mg-fxConfetti';
      const N = 26;
      for(let i=0;i<N;i++){
        const c = document.createElement('div');
        c.className = 'mg-conf';
        c.style.left = (Math.random()*100)+'%';
        c.style.top  = (-10 - Math.random()*30)+'px';
        c.style.transform = `rotate(${Math.random()*180}deg)`;
        c.style.background = i%3===0 ? '#ffd36a' : (i%3===1 ? '#c7a3ff' : '#3bb2ff');
        conf.appendChild(c);
      }
      fx.appendChild(conf);
      // animate each piece
      requestAnimationFrame(()=>{
        conf.querySelectorAll('.mg-conf').forEach((el, idx)=>{
          const dur = 900 + Math.random()*650;
          el.animate(
            [
              { transform: el.style.transform + ' translateY(0px)', opacity: 1 },
              { transform: el.style.transform + ` translateY(${340+Math.random()*220}px)`, opacity: 0.9 }
            ],
            { duration: dur, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards', delay: idx*10 }
          );
        });
      });
    }

    // lose glitch overlay
    if(kind==='lose'){
      const g = document.createElement('div');
      g.className = 'mg-fxGlitch';
      fx.appendChild(g);
      g.animate(
        [{opacity:0},{opacity:1, offset:0.2},{opacity:0.35, offset:0.7},{opacity:0}],
        {duration: 520, easing:'steps(2,end)', fill:'forwards'}
      );
    }

    document.body.appendChild(fx);

    // core animation
    const dur = opt.duration || (kind==='artifact' ? 780 : 980);
    try{
      burst.animate([
        { transform:'translate(-50%,-50%) scale(0.6)', opacity:0 },
        { transform:'translate(-50%,-50%) scale(1.05)', opacity:1, offset:0.28 },
        { transform:'translate(-50%,-50%) scale(1.2)', opacity:0 }
      ], {duration: dur, easing:'cubic-bezier(.14,.9,.22,1)', fill:'forwards'});
      ring.animate([
        { transform:'translate(-50%,-50%) scale(0.75)', opacity:0.2 },
        { transform:'translate(-50%,-50%) scale(1.8)', opacity:0 }
      ], {duration: dur, easing:'cubic-bezier(.16,.9,.22,1)', fill:'forwards'});
      text.animate([
        { transform:'translateY(10px) scale(0.98)', opacity:0 },
        { transform:'translateY(0px) scale(1.0)', opacity:1, offset:0.22 },
        { transform:'translateY(-6px) scale(1.02)', opacity:0 }
      ], {duration: dur, easing:'cubic-bezier(.16,.9,.22,1)', fill:'forwards'});
    }catch(e){}

    setTimeout(()=>{ try{ fx.remove(); }catch(e){} }, dur+120);
  }

  // ----------------------------
  //  SFX (WebAudio)
  // ----------------------------
  let AC = null;
  function ensureAudio(){
    if(!S.settings.sfx) return null;
    if(!AC){
      try{ AC = new (window.AudioContext || window.webkitAudioContext)(); }
      catch{ AC = null; }
    }
    if(AC && AC.state === "suspended") AC.resume().catch(()=>{});
    if(AC && !AC._mgMaster){
      try{
        const comp = AC.createDynamicsCompressor();
        comp.threshold.value = -18;
        comp.knee.value = 18;
        comp.ratio.value = 3.5;
        comp.attack.value = 0.004;
        comp.release.value = 0.12;
        comp.connect(AC.destination);
        AC._mgMaster = { comp };
      }catch(e){ AC._mgMaster = null; }
    }
    return AC;
  }
  function sfx(type){
    if(!S.settings.sfx) return;
    const ac = ensureAudio();
    if(!ac) return;

    const vol = clamp(S.settings.sfxVolume ?? 0.45, 0, 1);
    const t0 = ac.currentTime;

    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const filt = ac.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.setValueAtTime(12000, t0);
    filt.Q.setValueAtTime(0.7, t0);
    gain.gain.setValueAtTime(0.0001, t0);

    osc.connect(filt);
    filt.connect(gain);
    gain.connect((ac._mgMaster && ac._mgMaster.comp) ? ac._mgMaster.comp : ac.destination);

    const env = (a, d, peak) => {
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak*vol), t0 + a);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
    };

    if(type==="click"){
      osc.type="triangle";
      filt.frequency.setValueAtTime(12000, t0);
      osc.frequency.setValueAtTime(520, t0);
      osc.frequency.exponentialRampToValueAtTime(760, t0+0.07);
      env(0.003, 0.07, 0.07);
      osc.start(t0); osc.stop(t0+0.07+0.05);
      return;
    }
    if(type==="hover"){
      osc.type="sine";
      filt.frequency.setValueAtTime(11000, t0);
      osc.frequency.setValueAtTime(620, t0);
      osc.frequency.exponentialRampToValueAtTime(820, t0+0.06);
      env(0.003, 0.06, 0.06);
      osc.start(t0); osc.stop(t0+0.06+0.05);
      return;
    }
    if(type==="theme"){
      // soft "swoosh" for theme change
      osc.type="sine";
      filt.frequency.setValueAtTime(9000, t0);
      osc.frequency.setValueAtTime(240, t0);
      osc.frequency.exponentialRampToValueAtTime(680, t0+0.18);
      env(0.01, 0.22, 0.10);
      osc.start(t0); osc.stop(t0+0.28);
      return;
    }
    if(type==="success"){
      osc.type="triangle";
      filt.frequency.setValueAtTime(11000, t0);
      osc.frequency.setValueAtTime(520, t0);
      osc.frequency.exponentialRampToValueAtTime(1040, t0+0.12);
      osc.frequency.exponentialRampToValueAtTime(780, t0+0.22);
      env(0.01, 0.26, 0.14);
      osc.start(t0); osc.stop(t0+0.30);
      return;
    }
    if(type==="error"){
      osc.type="square";
      filt.frequency.setValueAtTime(6000, t0);
      osc.frequency.setValueAtTime(260, t0);
      osc.frequency.exponentialRampToValueAtTime(180, t0+0.10);
      env(0.005, 0.18, 0.10);
      osc.start(t0); osc.stop(t0+0.22);
      return;
    }
    if(type==="revealR"){
      osc.type="sine";
      filt.frequency.setValueAtTime(10000, t0);
      osc.frequency.setValueAtTime(420, t0);
      osc.frequency.exponentialRampToValueAtTime(520, t0+0.14);
      env(0.02, 0.14, 0.12);
      osc.start(t0); osc.stop(t0+0.14+0.05);
      return;
    }
    if(type==="revealSR"){
      osc.type="sawtooth";
      filt.frequency.setValueAtTime(9000, t0);
      osc.frequency.setValueAtTime(240, t0);
      osc.frequency.exponentialRampToValueAtTime(560, t0+0.18);
      env(0.01, 0.18, 0.16);
      osc.start(t0); osc.stop(t0+0.18+0.05);
      return;
    }
        if(type==="revealUR"){
      osc.type="sawtooth";
      filt.frequency.setValueAtTime(9500, t0);
      osc.frequency.setValueAtTime(180, t0);
      osc.frequency.exponentialRampToValueAtTime(1100, t0+0.28);
      env(0.008, 0.28, 0.22);
      osc.start(t0); osc.stop(t0+0.28+0.05);
      return;
    }
    if(type==="levelup" || type==="ascend"){
      osc.type="triangle";
      osc.frequency.setValueAtTime(type==="ascend"? 520: 460, t0);
      osc.frequency.exponentialRampToValueAtTime(type==="ascend"? 1240: 1040, t0+0.20);
      env(0.02, 0.28, 0.16);
      osc.start(t0); osc.stop(t0+0.34);
      return;
    }
    if(type==="artifact"){
      osc.type="sine";
      osc.frequency.setValueAtTime(620, t0);
      osc.frequency.exponentialRampToValueAtTime(980, t0+0.10);
      env(0.01, 0.16, 0.12);
      osc.start(t0); osc.stop(t0+0.20);
      return;
    }
    if(type==="crit"){
      osc.type="square";
      osc.frequency.setValueAtTime(880, t0);
      osc.frequency.exponentialRampToValueAtTime(1760, t0+0.08);
      env(0.005, 0.12, 0.14);
      osc.start(t0); osc.stop(t0+0.14);
      return;
    }
  }
  // --- Looping / layered SFX helpers (more "pro") ---
  // Returns a stop() function.
  function startTunnelSfx(bestRarity, isLimitedUR){
    if(!S.settings.sfx) return ()=>{};
    const ac = ensureAudio();
    if(!ac) return ()=>{};
    const vol = clamp(S.settings.sfxVolume ?? 0.45, 0, 1);

    
const stars = (typeof bestRarity === "number") ? bestRarity : rarityToStars(bestRarity);
const tier = (isLimitedUR && stars>=6) ? 4 : (stars>=6 ? 3 : (stars===5 ? 2 : (stars===4 ? 1 : 0)));
    const t0 = ac.currentTime;

    // Noise buffer (whoosh)
    const dur = 1.0;
    const sr = ac.sampleRate;
    const buf = ac.createBuffer(1, Math.floor(sr*dur), sr);
    const data = buf.getChannelData(0);
    for(let i=0;i<data.length;i++){
      // slightly shaped noise (more airy than harsh)
      const x = (Math.random()*2-1);
      data[i] = x * (0.35 + 0.65*Math.random());
    }
    const noise = ac.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;

    const bp = ac.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(520 + tier*180, t0);
    bp.Q.setValueAtTime(0.8 + tier*0.2, t0);

    const lp = ac.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(2500 + tier*450, t0);

    // Low hum layer
    const hum = ac.createOscillator();
    hum.type = "sine";
    hum.frequency.setValueAtTime(72 + tier*18, t0);

    // Gain + gentle tremolo
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t0);

    const trem = ac.createOscillator();
    trem.type = "sine";
    trem.frequency.setValueAtTime(5.5, t0);
    const tremG = ac.createGain();
    tremG.gain.setValueAtTime(0.10 + tier*0.02, t0);
    trem.connect(tremG);

    // tremolo applied to main gain
    tremG.connect(g.gain);

    // routing
    noise.connect(bp);
    bp.connect(lp);
    lp.connect(g);
    hum.connect(g);
    g.connect((ac._mgMaster && ac._mgMaster.comp) ? ac._mgMaster.comp : ac.destination);

    // envelope: quick in, then sustain, then stop() fades out
    const peak = (0.07 + tier*0.02) * vol;
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + 0.14);

    try{ noise.start(t0); }catch(e){}
    try{ hum.start(t0); }catch(e){}
    try{ trem.start(t0); }catch(e){}

    let stopped=false;
    return ()=>{
      if(stopped) return;
      stopped=true;
      const t = ac.currentTime;
      try{ g.gain.cancelScheduledValues(t); }catch(e){}
      try{ g.gain.setValueAtTime(Math.max(0.0002, g.gain.value), t); }catch(e){}
      try{ g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22); }catch(e){}
      setTimeout(()=>{
        try{ noise.stop(); }catch(e){}
        try{ hum.stop(); }catch(e){}
        try{ trem.stop(); }catch(e){}
        try{ noise.disconnect(); }catch(e){}
        try{ hum.disconnect(); }catch(e){}
        try{ trem.disconnect(); }catch(e){}
        try{ g.disconnect(); }catch(e){}
      }, 260);
    };
  }


  // UR reveal screen flash
  function flashUR(){
    const el = document.getElementById("urFlash");
    if(!el) return;
    el.classList.remove("pulse");
    void el.offsetWidth;
    el.classList.add("pulse");
  }

  // ----------------------------
  // Nowa animacja wishowania (bez crashy)
  // ----------------------------
  const sleep = (ms)=> new Promise(res=>setTimeout(res, ms));

  function ensureWishCanvas(){
    const ov = document.getElementById("wishOverlay");
    const cv = document.getElementById("wishCanvas");
    if(!ov || !cv) return null;
    const ctx = cv.getContext("2d");
    const resize = ()=>{
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      cv.width = Math.floor(window.innerWidth * dpr);
      cv.height = Math.floor(window.innerHeight * dpr);
      cv.style.width = "100%";
      cv.style.height = "100%";
      ctx.setTransform(dpr,0,0,dpr,0,0);
    };
    if(!cv.__wishBound){
      window.addEventListener("resize", resize, {passive:true});
      cv.__wishBound = true;
    }
    resize();
    return {ov, cv, ctx};
  }

	let activeWishAnimations = [];
	// Timers used to sync SFX with reveal animations. Must be cleared on cancel/close.
	let wishSfxTimers = [];
	// Looping tunnel SFX stop handle (prevents "stuck" sound when doing wishes back-to-back)
	let __wishTunnelStop = null;
  function stopWishFX(){
    // anuluje wszystkie trwające animacje wish FX i usuwa warstwę
    try{
      activeWishAnimations.forEach(a=>{ try{ a.cancel(); }catch(e){} });
    }catch(e){}
    activeWishAnimations = [];

	  // stop any looping wish audio (e.g. tunnel hum)
	  try{ if(__wishTunnelStop){ __wishTunnelStop(); } }catch(e){}
	  __wishTunnelStop = null;

    // clear scheduled wish SFX
    try{
      wishSfxTimers.forEach(t=>{ try{ clearTimeout(t); }catch(e){} });
    }catch(e){}
    wishSfxTimers = [];
    // if a Three.js loop exists, stop and dispose it
    try{ disposeWish3D(); }catch(e){}
    const ov = document.getElementById('wishOverlay');
    const layer = document.getElementById('wishFxLayer');
    if(layer && layer.parentNode) layer.parentNode.removeChild(layer);
    // canvas może istnieć w starym layoucie – czyścimy go defensywnie
    const cv = document.getElementById('wishCanvas');
    if(cv){ const ctx = cv.getContext('2d'); if(ctx) ctx.clearRect(0,0,cv.width,cv.height); }
  }

  function scheduleWishSfx(fn, delayMs){
    try{
      const t = setTimeout(()=>{
        // Only play while the overlay is still active.
        if(!document.body.classList.contains('wishing')) return;
        try{ fn(); }catch(e){}
      }, Math.max(0, delayMs|0));
      wishSfxTimers.push(t);
      return t;
    }catch(e){ return null; }
  }

  function bestUnitForPortal(units){
    if(!Array.isArray(units) || !units.length) return null;
    const score = (u)=>{
      const r = String(u?.rarity||"R").toUpperCase();
      const map = {R:1, SR:2, SSR:3, UR:4};
      let s = map[r] || 1;
      const isLimited = (u?.element==="Limited") || !!u?.limited;
      if(isLimited && r==="UR") s += 0.5;
      return s;
    };
    return units.slice().sort((a,b)=>score(b)-score(a))[0] || units[0];
  }

  function playWishPortalFX(elementName, mode){
    // Portal żywiołu: subtelny "portal" pod kartami, kolor wg elementu najlepszej postaci.
    const ov = document.getElementById("wishOverlay");
    if(!ov) return;
    stopWishFX();

    const layer = document.createElement("div");
    layer.id = "wishFxLayer";
    layer.className = "wishFxLayer";
    layer.style.position = "absolute";
    layer.style.inset = "0";
    layer.style.pointerEvents = "none";
    layer.style.zIndex = "1"; // pod kartami (karty mają swoje warstwy)
    ov.appendChild(layer);

    const elCls = elementClass(elementName||"Woda");

    const portal = document.createElement("div");
    portal.className = `wishPortal ${elCls} ${mode?('p-'+mode):''}`;
    layer.appendChild(portal);

    const rim = document.createElement("div");
    rim.className = "wishPortalRim";
    portal.appendChild(rim);

    const core = document.createElement("div");
    core.className = "wishPortalCore";
    portal.appendChild(core);

    const motes = document.createElement("div");
    motes.className = "wishPortalMotes";
    portal.appendChild(motes);
    const N = mode==="ur" ? 46 : (mode==="ssr" ? 34 : 24);
    for(let i=0;i<N;i++){
      const s = document.createElement("span");
      const ang = Math.random()*Math.PI*2;
      const r = 40 + Math.random()*220;
      s.style.setProperty("--x", (Math.cos(ang)*r).toFixed(1)+"px");
      s.style.setProperty("--y", (Math.sin(ang)*r).toFixed(1)+"px");
      s.style.setProperty("--d", (Math.random()*220).toFixed(0)+"ms");
      s.style.setProperty("--t", (520 + Math.random()*420).toFixed(0)+"ms");
      s.style.setProperty("--sz", (2.2 + Math.random()*3.8).toFixed(1)+"px");
      motes.appendChild(s);
    }

    // WAAPI animacje (do anulowania)
    try{
      activeWishAnimations.push(
        portal.animate(
          [
            {opacity:0, transform:"translate(-50%,-50%) scale(0.78)", filter:"blur(8px)"},
            {opacity:1, transform:"translate(-50%,-50%) scale(1.0)", filter:"blur(0px)", offset:0.25},
            {opacity:1, transform:"translate(-50%,-50%) scale(1.06)", filter:"blur(0px)", offset:0.75},
            {opacity:0, transform:"translate(-50%,-50%) scale(1.10)", filter:"blur(10px)"}
          ],
          {duration: 980, easing:"cubic-bezier(.12,.9,.2,1)", fill:"forwards"}
        )
      );
      activeWishAnimations.push(
        rim.animate(
          [{transform:"rotate(0deg)"},{transform:"rotate(240deg)"}],
          {duration: 980, easing:"linear", fill:"forwards"}
        )
      );
      activeWishAnimations.push(
        core.animate(
          [{opacity:0.65, transform:"scale(0.92)"},{opacity:1, transform:"scale(1.05)"}],
          {duration: 520, direction:"alternate", iterations: 2, easing:"ease-in-out"}
        )
      );
    }catch(e){}
  }

  // --- 3D Wish FX (Three.js): Portal + Tunnel ---
  // Uses CDN three.min.js (optional). If THREE isn't available, caller should fall back to 2D.
  let __wish3D = null;

  function elementColorHex(el){
    const e = String(el||"").toLowerCase();
    if(e.includes("ogie")) return 0xff4b4b;      // Ogień
    if(e.includes("wod"))  return 0x3bb2ff;      // Woda
    if(e.includes("wiat") || e.includes("air")) return 0x74ffd9; // Wiatr
    if(e.includes("ziem") || e.includes("geo")) return 0xffd83b; // Ziemia
    if(e.includes("elek") || e.includes("pior")) return 0xb06bff; // Elektryczność
    if(e.includes("mrok") || e.includes("dark")) return 0x7b7bff; // Mrok
    if(e.includes("light") || e.includes("swia")) return 0xffffff; // Światło
    if(e.includes("limited")) return 0xff66cc;
    return 0x8fb3ff;
  }

  
function rarityColorHex(rarityOrStars, isLimitedUR){
  if(isLimitedUR) return 0xffffff; // base, will be animated prismatic
  const stars = (typeof rarityOrStars === "number") ? rarityOrStars : rarityToStars(rarityOrStars);
  if(stars===4) return 0xc7a3ff;   // fiolet
  if(stars===5) return 0xffd36a;   // złoto
  if(stars>=6) return 0xff3b3b;    // czerwony
  return 0x3bb2ff;                 // niebieski (start)
}

  function disposeWish3D(){
    try{
      if(__wish3D?.raf) cancelAnimationFrame(__wish3D.raf);
    }catch(e){}
    try{
      if(__wish3D?.onResize) window.removeEventListener('resize', __wish3D.onResize);
    }catch(e){}
    try{
      if(__wish3D?.renderer){ __wish3D.renderer.dispose(); }
    }catch(e){}
    __wish3D = null;
  }

  // Fullscreen 3D tunnel sequence used for wish reveal.
  // Steps:
  // 1) show blue tunnel
  // 2) move "into" tunnel
  // 3) after 1s, recolor by best drop rarity (SR purple, SSR gold, UR red, Limited UR prismatic)
  // 4) reach the end, then resolve so caller can show cards
  function playWishTunnel3DSequence(bestRarity, isLimitedUR){
    const ov = document.getElementById("wishOverlay");
    if(!ov) return Promise.resolve();

    // If Three.js missing, just fallback to a short delay (caller will show cards)
    if(!window.THREE) return sleep(520);

    stopWishFX();

    const layer = document.createElement("div");
    layer.id = "wishFxLayer";
    layer.className = "wishFxLayer";
    layer.style.position = "absolute";
    layer.style.inset = "0";
    layer.style.pointerEvents = "none";
    layer.style.zIndex = "50"; // ABOVE cards (cards appear after this ends)
    ov.appendChild(layer);

    const canvas = document.createElement("canvas");
    canvas.className = "wishThreeCanvas";
    layer.appendChild(canvas);

    const THREE = window.THREE;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:true, powerPreference:'high-performance' });
    renderer.setPixelRatio(Math.min(1.25, window.devicePixelRatio || 1));
    renderer.setSize(window.innerWidth, window.innerHeight, false);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / Math.max(1, window.innerHeight), 0.1, 200);
    camera.position.set(0,0,6);

    const amb = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(amb);

    // Tunnel points
    const bestStars = (typeof bestRarity === "number") ? bestRarity : rarityToStars(bestRarity);
    const count = (bestStars>=6) ? 2200 : (bestStars===5 ? 1800 : 1400);
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count*3);
    for(let i=0;i<count;i++){
      const r = 0.2 + Math.random()*4.6;
      const ang = Math.random()*Math.PI*2;
      pos[i*3+0] = Math.cos(ang)*r;
      pos[i*3+1] = Math.sin(ang)*r;
      pos[i*3+2] = -Math.random()*120; // deep
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.028,
      color: new THREE.Color(rarityColorHex('R', false)), // start blue
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);

    // Manage resize
    const onResize = ()=>{
      try{
        const w = window.innerWidth, h = Math.max(1, window.innerHeight);
        renderer.setSize(w, h, false);
        camera.aspect = w/h;
        camera.updateProjectionMatrix();
      }catch(e){}
    };
    window.addEventListener('resize', onResize, {passive:true});

    // Animation timeline
    const t0 = performance.now();
    const COLOR_SWAP_MS = 1000;
    const COLOR_BLEND_MS = 520; // smooth transition window
    const TOTAL_MS = 1750;
    const startHex = rarityColorHex('R', false);
    const targetHex = rarityColorHex(bestRarity, isLimitedUR);
    let swapped = false;

    // Prismatic mode for limited UR
    const prism = !!isLimitedUR;
	    const stopTunnelSound = startTunnelSfx(bestRarity, isLimitedUR);
	    // Make sure we can stop looping audio if the overlay is closed or a new wish starts.
	    try{ __wishTunnelStop = stopTunnelSound; }catch(e){}

    return new Promise((resolve)=>{
      const tick = (now)=>{
        const dt = Math.min(40, now - (__wish3D?.last||now));
        const elapsed = now - t0;
        if(!__wish3D) __wish3D = {};
        __wish3D.last = now;
        __wish3D.renderer = renderer;
        __wish3D.onResize = onResize;

        // Move "into" tunnel: camera eases forward and points flow towards camera
        const p = Math.min(1, elapsed / TOTAL_MS);
        const ease = p<0.5 ? (2*p*p) : (1 - Math.pow(-2*p+2,2)/2);
        camera.position.z = 6 - ease*58; // ends around -52

        // Flow points
        const speed = 0.55 + ease*2.2;
        const arr = geo.attributes.position.array;
        for(let i=0;i<count;i++){
          const zi = i*3+2;
          arr[zi] += speed * (dt/16.67);
          if(arr[zi] > camera.position.z + 2){
            arr[zi] = -120 - Math.random()*40;
          }
        }
        geo.attributes.position.needsUpdate = true;

        // Smooth color transition: start blue -> (after 1s) blend to target over ~0.52s
        if(elapsed < COLOR_SWAP_MS){
          mat.color.copy(new THREE.Color(startHex));
        } else {
          if(!swapped){ swapped = true; }
          const blendP = clamp((elapsed - COLOR_SWAP_MS) / COLOR_BLEND_MS, 0, 1);
          if(!prism){
            const c0 = new THREE.Color(startHex);
            const c1 = new THREE.Color(targetHex);
            c0.lerp(c1, blendP);
            mat.color.copy(c0);
          } else {
            // Prism: blend from blue into a cycling hue
            const t = (elapsed - COLOR_SWAP_MS) / 1000;
            const hue = (t*0.35) % 1;
            const prismC = new THREE.Color().setHSL(hue, 0.85, 0.62);
            const c0 = new THREE.Color(startHex);
            c0.lerp(prismC, blendP);
            mat.color.copy(c0);
          }
        }

        renderer.render(scene, camera);

        if(elapsed >= TOTAL_MS){
          // fade out quickly
          try{
            layer.animate([{opacity:1},{opacity:0}], {duration: 220, easing:'ease-out', fill:'forwards'}).onfinish = ()=>{
	              try{ stopTunnelSound(); }catch(e){}
	              try{ __wishTunnelStop = null; }catch(e){}
            try{ window.removeEventListener('resize', onResize); }catch(e){}
              try{ disposeWish3D(); }catch(e){}
              try{ if(layer && layer.parentNode) layer.parentNode.removeChild(layer); }catch(e){}
              resolve();
            };
          }catch(e){
	            try{ stopTunnelSound(); }catch(e){}
	            try{ __wishTunnelStop = null; }catch(e){}
            try{ window.removeEventListener('resize', onResize); }catch(e){}
            try{ disposeWish3D(); }catch(e){}
            try{ if(layer && layer.parentNode) layer.parentNode.removeChild(layer); }catch(e){}
            resolve();
          }
          return;
        }

        __wish3D.raf = requestAnimationFrame(tick);
      };
      __wish3D = { raf: requestAnimationFrame(tick), renderer, onResize, last: performance.now() };
    });
  }

  function playWishPortal3DFX(elementName, mode){
    const ov = document.getElementById("wishOverlay");
    if(!ov) return;
    if(!window.THREE) { playWishPortalFX(elementName, mode); return; }

    stopWishFX();

    const layer = document.createElement("div");
    layer.id = "wishFxLayer";
    layer.className = "wishFxLayer";
    layer.style.position = "absolute";
    layer.style.inset = "0";
    layer.style.pointerEvents = "none";
    layer.style.zIndex = "1"; // pod kartami
    const vig = document.createElement("div");
    vig.className = "wishFxVignette";
    layer.appendChild(vig);
    ov.appendChild(layer);

    const canvas = document.createElement('canvas');
    canvas.className = 'wishThreeCanvas';
    layer.appendChild(canvas);

    const THREE = window.THREE;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:true, powerPreference:'high-performance' });
    renderer.setPixelRatio(Math.min(1.25, window.devicePixelRatio || 1));
    renderer.setSize(window.innerWidth, window.innerHeight, false);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / Math.max(1, window.innerHeight), 0.1, 120);
    camera.position.set(0,0,6);

    // Tunnel color sequence:
    // 0-1s: blue, then smooth blend to rarity color (or prismatic) while moving forward.
    const startCol = new THREE.Color("#3aa7ff"); // blue
    const targetCol = (()=>{
      if(mode==="ur") return new THREE.Color("#ff2b2b");      // red
      if(mode==="ssr") return new THREE.Color("#ffcc33");    // gold
      if(mode==="sr") return new THREE.Color("#a34cff");     // purple
      if(mode==="prism") return new THREE.Color("#ffffff");  // base, hue-rotated in tick
      return new THREE.Color("#5aa6ff");
    })();
    const blendStartMs = 1000;
    const blendDurMs = 650;


    // Subtelne światło (basic + additive więc i tak delikatnie)
    const amb = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(amb);

    // Tunnel: punkty lecące w stronę kamery
    const count = (mode === 'ur') ? 1800 : (mode === 'ssr' ? 1350 : 950);
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count*3);
    for(let i=0;i<count;i++){
      const r = 0.15 + Math.random()*4.5;
      const ang = Math.random()*Math.PI*2;
      pos[i*3+0] = Math.cos(ang)*r;
      pos[i*3+1] = Math.sin(ang)*r;
      pos[i*3+2] = -Math.random()*80; // w głąb
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      size: mode==='ur' ? 0.030 : 0.024,
      color: startCol,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);

    // A light fog feel
    scene.fog = new THREE.FogExp2(0x000000, 0.06);

    let t0 = performance.now();
    const startedAt = t0;
    let alive = true;

    const onResize = ()=>{
      try{
        renderer.setPixelRatio(Math.min(1.25, window.devicePixelRatio || 1));
        renderer.setSize(window.innerWidth, window.innerHeight, false);
        camera.aspect = window.innerWidth / Math.max(1, window.innerHeight);
        camera.updateProjectionMatrix();
      }catch(e){}
    };
    window.addEventListener('resize', onResize, {passive:true});

    const speed = mode==='ur' ? 1.35 : (mode==='ssr' ? 1.15 : 0.95);

    const tick = (now)=>{
      if(!alive) return;
      const dt = Math.min(40, now - t0);
      t0 = now;

      // move particles forward
      const a = geo.getAttribute('position');
      for(let i=0;i<count;i++){
        let z = a.array[i*3+2];
        z += (dt*0.02*speed);
        if(z > 0.5) z = -80;
        a.array[i*3+2] = z;
      }
         // smooth color transition (blue -> target) after 1s
      const elapsed = now - startedAt;
      if(elapsed < blendStartMs){
        mat.color.copy(startCol);
      }else{
        const t = Math.min(1, (elapsed - blendStartMs) / blendDurMs);
        // eased blend
        const te = t*t*(3-2*t);
        if(mode==="prism"){
          // prismatic: animate hue, but ease in from blue
          const h = ((now - startedAt) / 900) % 1;
          const prism = new THREE.Color().setHSL(h, 1, 0.60);
          mat.color.copy(startCol).lerp(prism, te);
        }else{
          mat.color.copy(startCol).lerp(targetCol, te);
        }
      }

   a.needsUpdate = true;

      // subtle camera breathing
      camera.position.z = 6 + Math.sin(now/620)*0.08;

      renderer.render(scene, camera);
      __wish3D.raf = requestAnimationFrame(tick);
    };

    __wish3D = { renderer, scene, camera, raf: null, onResize };
    activeWishAnimations.push({ cancel: ()=>{ alive=false; disposeWish3D(); } });
    __wish3D.raf = requestAnimationFrame(tick);
  }

  function wishOverlayOn(mode, label){
    const ov = document.getElementById("wishOverlay");
    const lab = document.getElementById("wishLabel");
    if(!ov) return;
    // usuń poprzedni tryb (kolor tła animacji)
    Array.from(ov.classList).forEach(c=>{ if(c && c.startsWith("mode-")) ov.classList.remove(c); });
    if(mode){
      const cls = mode.startsWith("mode-") ? mode : ("mode-"+mode);
      ov.classList.add(cls);
    }
    if(lab) lab.textContent = label || "Wish…";
    ov.classList.add("on");
    document.body.classList.add("wishing");
  }

  function wishOverlayOff(){
    const ov = document.getElementById("wishOverlay");
    if(!ov) return;
    // Always clear any FX layers/animations.
    try{ stopWishFX(); }catch(e){}
    // usuń tryb tła (mode-*)
    Array.from(ov.classList).forEach(c=>{ if(c && c.startsWith("mode-")) ov.classList.remove(c); });
const grid = ov.querySelector(".wishGrid");
    if(grid) grid.innerHTML = "";
ov.classList.remove("on","ur","ssr","sr","prism");
    document.body.classList.remove("wishing");
    const lab = document.getElementById("wishLabel");
    if(lab) lab.textContent = "";
    const cv = document.getElementById("wishCanvas");
    if(cv){
      const ctx = cv.getContext("2d");
      if(ctx) ctx.clearRect(0,0,cv.width,cv.height);
    }
  }

  async function playWishFX(kind, token){
    // Całkowicie nowa animacja: CSS + Web Animations API (bez canvas), z twardym anulowaniem.
    // kind: "ssr" | "ur" | null
    const ov = document.getElementById("wishOverlay");
    if(!ov){ return; }

    stopWishFX(); // usuń pozostałości po poprzedniej animacji

    const mode = kind === "ur" ? "ur" : (kind === "ssr" ? "ssr" : null);
    wishOverlayOn(mode, kind === "ur" ? "6★ REVEAL!" : (kind === "ssr" ? "5★ REVEAL!" : "Wish…"));

    // warstwa efektów
    const layer = document.createElement("div");
    layer.id = "wishFxLayer";
    layer.className = "wishFxLayer";
    layer.style.position="absolute";
    layer.style.inset="0";
    layer.style.pointerEvents="none";
    layer.style.zIndex="2";
    ov.appendChild(layer);

    // tło
    const bg = document.createElement("div");
    bg.className = "wishFxBg " + (mode || "");
    layer.appendChild(bg);

    // rozbłysk
    const burst = document.createElement("div");
    burst.className = "wishFxBurst " + (mode || "");
    layer.appendChild(burst);

    // pierścienie
    const rings = document.createElement("div");
    rings.className = "wishFxRings";
    layer.appendChild(rings);
    for(let i=0;i<3;i++){
      const r = document.createElement("div");
      r.className = "wishFxRing " + (mode || "");
      r.style.setProperty("--d", (i*120) + "ms");
      r.style.setProperty("--s", (0.85 + i*0.25).toFixed(2));
      rings.appendChild(r);
    }

    // cząsteczki
    const particles = document.createElement("div");
    particles.className = "wishFxParticles";
    layer.appendChild(particles);

    const N = kind === "ur" ? 46 : (kind === "ssr" ? 34 : 26);
    for(let i=0;i<N;i++){
      const p = document.createElement("span");
      p.className = "wishFxP " + (mode || "");
      const ang = Math.random()*Math.PI*2;
      const dist = (kind === "ur" ? 380 : 300) + Math.random()*140;
      const x = Math.cos(ang)*dist;
      const y = Math.sin(ang)*dist;
      p.style.setProperty("--x", x.toFixed(1)+"px");
      p.style.setProperty("--y", y.toFixed(1)+"px");
      p.style.setProperty("--t", (420 + Math.random()*420).toFixed(0)+"ms");
      p.style.setProperty("--d", (Math.random()*140).toFixed(0)+"ms");
      p.style.setProperty("--sz",(2+Math.random()*4).toFixed(1)+"px");
      particles.appendChild(p);
    }

    // Animacje WAAPI (każda zapisana do anulowania)
    const anims = [];
    const addAnim = (el, kf, opt) => {
      const a = el.animate(kf, opt);
      activeWishAnimations.push(a);
      anims.push(a);
      return a;
    };

    // bg fade + subtle zoom
    addAnim(bg,
      [{opacity:0, transform:"scale(1.02)"},
       {opacity:1, transform:"scale(1.00)", offset:0.35},
       {opacity:1, transform:"scale(1.03)", offset:0.75},
       {opacity:0, transform:"scale(1.05)"}],
      {duration: 900, easing:"cubic-bezier(.2,.9,.2,1)", fill:"forwards"}
    );

    // burst pop
    addAnim(burst,
      [{opacity:0, transform:"translate(-50%,-50%) scale(.25)"},
       {opacity:1, transform:"translate(-50%,-50%) scale(1.00)", offset:0.25},
       {opacity:.9, transform:"translate(-50%,-50%) scale(1.25)", offset:0.55},
       {opacity:0, transform:"translate(-50%,-50%) scale(1.6)"}],
      {duration: 720, easing:"cubic-bezier(.1,.9,.2,1)", fill:"forwards"}
    );

    // rings via CSS keyframes (z opóźnieniem), ale podbijamy opacity na starcie
    addAnim(rings,
      [{opacity:0},{opacity:1, offset:0.15},{opacity:1, offset:0.75},{opacity:0}],
      {duration: 900, easing:"linear", fill:"forwards"}
    );

    // particles (każda osobno)
    particles.querySelectorAll(".wishFxP").forEach((el)=>{
      addAnim(el,
        [{opacity:0, transform:"translate(0,0) scale(1)"},
         {opacity:1, transform:"translate(0,0) scale(1)", offset:0.15},
         {opacity:1, transform:"translate(var(--x), var(--y)) scale(.9)", offset:0.70},
         {opacity:0, transform:"translate(calc(var(--x)*1.1), calc(var(--y)*1.1)) scale(.7)"}],
        {duration: parseFloat(getComputedStyle(el).getPropertyValue("--t")) || 700,
         delay: parseFloat(getComputedStyle(el).getPropertyValue("--d")) || 0,
         easing:"cubic-bezier(.15,.85,.25,1)",
         fill:"forwards"}
      );
    });

    // twarde bezpieczeństwo: jeśli token się zmienił w trakcie, wyjdź od razu
    const waitAll = (list)=> Promise.allSettled(list.map(a=>a.finished.catch(()=>{})));
    await waitAll(anims);

    if(token !== revealToken){ return; }
    stopWishFX();
    wishOverlayOff();
  }
  // ----------------------------
  //  Wish Reveal Grid (PRO) – always 1 or 10 cards, no crashes
  // - flash color = best rarity in this pull
  // - UR: per-card audio placeholder map
  // - works with existing wishOverlayOn/off + stopWishFX
  // ----------------------------

  
const WISH_RAR_ORDER = [3,4,5,6];
const WISH_FLASH = {
  3:   "rgba(120,120,120,0.35)",
  4:   "rgba(160,80,255,0.45)",
  5:   "rgba(255,200,60,0.55)",
  6:   "rgba(255,40,40,0.65)",
  "6_L": "conic-gradient(from 0deg, rgba(255,70,200,0.75), rgba(120,240,255,0.75), rgba(255,220,90,0.75), rgba(255,70,200,0.75))"
};

  
function bestRarityFromUnits(units){
  let best = 3;
  for(const u of (units||[])){
    const s = unitStars(u);
    if(s > best) best = s;
  }
  return best;
}

  function ensureWishGridUI(){
  const ov = document.getElementById("wishOverlay");
  if(!ov) return null;

  // inject style once
  if(!document.getElementById("wishGridStyle")){
    const st = document.createElement("style");
    st.id = "wishGridStyle";
    st.textContent = `
      /* Wish overlay base (grid reveal) */
      #wishOverlay{ position:fixed; inset:0; z-index:9999; display:block; }
      #wishOverlay.on{ pointer-events:auto; }

      #wishOverlay.mode-r{  background: rgba(12,32,90,0.28); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); }
      #wishOverlay.mode-sr{ background: rgba(80,20,130,0.28); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); }
      #wishOverlay.mode-ssr{background: rgba(140,110,20,0.24); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); }
      #wishOverlay.mode-ur{ background: rgba(140,20,20,0.26); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); }
      #wishOverlay.mode-limited{ background: rgba(0,0,0,0.22); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); }
      #wishOverlay.mode-limited::before{
        content:""; position:absolute; inset:0; pointer-events:none; opacity:.85;
        background: conic-gradient(from 0deg,
          rgba(255,0,128,.22),
          rgba(120,80,255,.22),
          rgba(0,210,255,.22),
          rgba(0,255,170,.22),
          rgba(255,240,0,.22),
          rgba(255,0,128,.22));
        filter: blur(18px) saturate(1.25);
        animation: wishPrismSpin 3.6s linear infinite, wishPrismHue 4.8s ease-in-out infinite;
      }
      @keyframes wishPrismSpin{ from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
      @keyframes wishPrismHue{ 0%{ filter: blur(18px) saturate(1.25) hue-rotate(0deg); } 50%{ filter: blur(18px) saturate(1.45) hue-rotate(70deg); } 100%{ filter: blur(18px) saturate(1.25) hue-rotate(0deg);} }

      #wishOverlay .wishGridWrap{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center; }
      #wishOverlay .wishGridWrapInner{
        position:relative;
        transform: translateY(10px) scale(.98);
        opacity:0;
        transition: opacity .22s ease, transform .22s ease;
      }
      #wishOverlay .wishGridWrapInner.show{ opacity:1; transform: translateY(0) scale(1); }

      #wishOverlay .wishGrid{
        display:grid;
        grid-template-columns:repeat(5, 132px);
        grid-template-rows:repeat(2, 190px);
        gap:18px; padding:24px;
      }
      @media (max-width: 820px){
        #wishOverlay .wishGrid{ grid-template-columns:repeat(2, 140px); grid-template-rows:auto; }
      }

      #wishOverlay .wishFlash{
        position:absolute; inset:-40%;
        opacity:0;
        pointer-events:none;
        filter: blur(12px) saturate(1.15);
        mix-blend-mode: screen;
      }

      #wishOverlay .wishBottomBar{
  position:absolute;
  left:50%;
  bottom:18px;
  transform:translateX(-50%);
  z-index:6;
  display:flex;
  gap:10px;
  align-items:center;
  justify-content:center;
  padding:0 10px;
}
#wishOverlay .wishClose,
#wishOverlay .wishStopAuto{
  border:1px solid rgba(255,255,255,.14);
  background: rgba(10,12,18,.45);
  color: rgba(255,255,255,.92);
  border-radius:12px;
  padding:10px 12px;
  font-weight:900;
  cursor:pointer;
  min-width:120px;
}
#wishOverlay .wishStopAuto{
  background: rgba(255,107,138,.16);
  border-color: rgba(255,107,138,.35);
}

      /* Cards */
      #wishOverlay .wishCard{
width:132px; height:190px; border-radius:14px;
        background: linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
        border:1px solid rgba(255,255,255,0.10);
        box-shadow: 0 12px 28px rgba(0,0,0,0.45);
        overflow:hidden; position:relative;
        transform: translateY(14px) scale(0.92);
        opacity:0;
        transition: transform .22s ease, opacity .22s ease;
        contain: layout paint;
      }
      #wishOverlay .wishCard.in{ opacity:1; transform: translateY(0) scale(1); }
      #wishOverlay .wishCard .inner{ position:absolute; inset:0; padding:10px 10px 12px; display:flex; flex-direction:column; gap:4px; }
      #wishOverlay .wishCard .topRow{ display:flex; align-items:center; justify-content:space-between; gap:6px; }
      #wishOverlay .wishCard .rarTag{
        font-size:11px; font-weight:900; letter-spacing:.4px;
        padding:4px 7px; border-radius:999px;
        border:1px solid rgba(255,255,255,.14);
        background: rgba(0,0,0,.25);
      }
      #wishOverlay .wishCard .el{ font-size:11px; opacity:.9; }
      #wishOverlay .wishCard .avatarHost{ display:flex; align-items:center; justify-content:center; min-height:94px; margin-top:-4px; overflow:hidden; }
      #wishOverlay .wishCard .nm{ font-weight:900; font-size:12px; text-align:center; text-shadow: 0 2px 12px rgba(0,0,0,.7); line-height:1.05; margin-top:-4px; padding:0 6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

      #wishOverlay .wishCard .newBadge{ position:absolute; top:8px; right:10px; z-index:7; font-weight:1000; font-size:12px; letter-spacing:.3px; color: rgba(255,40,40,.98); text-shadow: 0 2px 10px rgba(0,0,0,.85); pointer-events:none; }


      #wishOverlay .wishCard .cover{
        position:absolute; inset:0;
        background: linear-gradient(135deg, rgba(0,0,0,.68), rgba(0,0,0,.25));
        backdrop-filter: blur(2px);
        -webkit-backdrop-filter: blur(2px);
        transition: opacity .25s ease;
        opacity:1;
      }
      #wishOverlay .wishCard.revealed .cover{ opacity:0; }

      #wishOverlay .wishCard .shineSweep{
        position:absolute; inset:-55% -55%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,.70), transparent);
        transform: translateX(-80%) rotate(18deg);
        opacity:0;
      }
      #wishOverlay .wishCard.revealFx .shineSweep{
        opacity:.85;
        animation: wishSweep 900ms cubic-bezier(.2,.8,.2,1) 1;
        mix-blend-mode: screen;
      }
      @keyframes wishSweep{
        0%{opacity:0; transform:translateX(-80%) rotate(18deg);}
        20%{opacity:1;}
        100%{opacity:0; transform:translateX(80%) rotate(18deg);}
      }

      /* Rarity tint */
      #wishOverlay .wishCard.r-r::before,
      #wishOverlay .wishCard.r-sr::before,
      #wishOverlay .wishCard.r-ssr::before,
      #wishOverlay .wishCard.r-ur::before{
        content:""; position:absolute; inset:-2px; z-index:0;
        opacity:.80;
      }
      #wishOverlay .wishCard.r-r::before{
        background: radial-gradient(circle at 50% 20%, rgba(130,170,255,.25), transparent 55%);
      }
      #wishOverlay .wishCard.r-sr::before{
        background: radial-gradient(circle at 50% 20%, rgba(200,120,255,.30), transparent 55%);
      }
      #wishOverlay .wishCard.r-ssr::before{
        background: radial-gradient(circle at 50% 20%, rgba(255,220,120,.28), transparent 55%);
      }
      #wishOverlay .wishCard.r-ur::before{
        background: radial-gradient(circle at 50% 20%, rgba(255,90,90,.30), transparent 55%);
      }
      #wishOverlay .wishCard.limited::before{
        background: conic-gradient(from 0deg,
          rgba(255,0,140,.20),
          rgba(120,80,255,.20),
          rgba(0,210,255,.20),
          rgba(0,255,170,.20),
          rgba(255,240,0,.20),
          rgba(255,0,140,.20));
        animation: wishPrismSpin 3.6s linear infinite, wishPrismHue 4.8s ease-in-out infinite;
        opacity:.9;
      }

      /* Make avatar inside cards bigger */
      #wishOverlay .wishCard .unitAvatar{ width:76px; height:96px; border-radius:22px; }
    `;
    document.head.appendChild(st);
  }

  // structure once
  let wrap = ov.querySelector(".wishGridWrap");
  let grid = ov.querySelector(".wishGrid");
  let inner = ov.querySelector(".wishGridWrapInner");
  let flash = ov.querySelector(".wishFlash");
  let btnClose = ov.querySelector(".wishClose");
  let bottomBar = ov.querySelector(".wishBottomBar");
  let btnStop = ov.querySelector(".wishStopAuto");

  if(!wrap){
    wrap = document.createElement("div");
    wrap.className = "wishGridWrap";
    ov.appendChild(wrap);
  }
  if(!flash){
    flash = document.createElement("div");
    flash.className = "wishFlash";
    ov.appendChild(flash);
  }
  if(!inner){
    inner = document.createElement("div");
    inner.className = "wishGridWrapInner";
    wrap.appendChild(inner);
  }
  if(!grid){
    grid = document.createElement("div");
    grid.className = "wishGrid";
    inner.appendChild(grid);
  }

if(!bottomBar){
  bottomBar = document.createElement("div");
  bottomBar.className = "wishBottomBar";
  ov.appendChild(bottomBar);
}

if(!btnStop){
  btnStop = document.createElement("button");
  btnStop.className = "wishStopAuto";
  btnStop.type = "button";
  btnStop.textContent = "Stop Auto";
  btnStop.addEventListener("click", ()=>{
    try{ stopAutoWishNow(true); }catch(e){}
  });
  bottomBar.appendChild(btnStop);
}

if(!btnClose){
  btnClose = document.createElement("button");
  btnClose.className = "wishClose";
  btnClose.type = "button";
  btnClose.textContent = "Zamknij";
  btnClose.addEventListener("click", ()=>{
    // allow closing even if reveal is in progress (skip)
    cancelReveal();
    try{ wishOverlayOff(); }catch(e){}
    try{ renderLastRevealToBanner(); }catch(e){}
  });
  bottomBar.appendChild(btnClose);
}

  // expose the correct element for show/hide animations
  return { ov, grid, wrap: inner, flash, btnClose, btnStop, bottomBar };
}

function startWishGridReveal(units, metas, token){
    const ui = ensureWishGridUI();
    if(!ui) return;

    // remove any leftover FX from previous reveal
    try{ stopWishFX(); }catch(e){}

    const {ov, grid, wrap, flash, btnClose, btnStop} = ui;

    // reset state
    grid.innerHTML = "";
    revealSkipping = false;

    try{ if(btnStop) btnStop.style.display = (S.autoWish ? "" : "none"); }catch(e){}

    // ukryj grid zanim pojawią się karty (usuwa "prostokąt" z tła)
    try{ if(wrap) wrap.classList.remove("show"); }catch(e){}
    try{ if(flash){ flash.style.opacity = "0"; flash.style.background = "transparent"; } }catch(e){}

    // Intro: zawsze startuje niebieskim blurem
    wishOverlayOn("r", "Wish…");

    // po 1s zmiana wg najlepszej postaci i dopiero wtedy pokaz kart
    const best = bestRarityFromUnits(units);
    const bestU = bestUnitForPortal(units);
    const bestEl = (bestU && (bestU.element||bestU.el)) ? (bestU.element||bestU.el) : "Woda";
    // NOTE: keep this file as plain JS (no escaped quotes). Escaped quotes here break parsing in browsers.
    const hasLimitedUR = units.some(u => u && (unitStars(u)===6) && (u.element==="Limited" || u.limited));
    const mode = hasLimitedUR ? "prism" : (best===6 ? "ur" : (best===5 ? "ssr" : (best===4 ? "sr" : "r")));

    const turbo = !!(S.settings && S.settings.turboAutoWish);

    const INTRO_MS = (turbo || (S.settings && (S.settings.fastReveal || S.settings.animations===false))) ? 0 : 420;

    setTimeout(async ()=>{
      if(token !== revealToken) return;

      const fx = "classic";

      //  SPEC: 3D tunnel sequence BEFORE showing cards
      if(fx === "portal3d"){
        // start in blue
        wishOverlayOn("r", "Wish…");

        // after 1s switch overlay label/mode; tunnel recolors inside its renderer
        const switchTimer = setTimeout(()=>{
          if(token !== revealToken) return;
          wishOverlayOn(mode, `Pull x${units.length}`);
        }, 1000);

        try{ await playWishTunnel3DSequence(best, hasLimitedUR); }catch(e){}
        try{ clearTimeout(switchTimer); }catch(e){}
      } else {
        // portal2d/classic: keep immediate mode switch
        wishOverlayOn(mode, `Pull x${units.length}`);
      }

      // 🌌 Background FX under cards (only for portal2d)
      try{
        const fxMode = (hasLimitedUR ? "ur" : (best===6 ? "ur" : (best===5 ? "ssr" : null)));
        if(fx === "portal3d"){
        const tunnelDelay = (turbo ? 0 : 1750);
        try{ playWishPortal3DFX(bestEl, mode); }catch(e){}
        if(tunnelDelay>0) await new Promise(r=>setTimeout(r, tunnelDelay));
      } else if(fx === "portal2d") {
        playWishPortalFX(bestEl, fxMode);
      }
      }catch(e){}

      // ✨ optional flash (kept, but only after tunnel / mode switch)
      try{
        if(flash){
          const key = hasLimitedUR ? "6_L" : (best===6 ? 6 : (best===5 ? 5 : (best===4 ? 4 : 3)));
          flash.style.background = WISH_FLASH[key] || "transparent";
          flash.style.opacity = "0";
          flash.animate(
            [{opacity:0, filter:"blur(0px)"},
             {opacity:1, filter:"blur(0px)", offset:0.18},
             {opacity:.55, filter:"blur(0px)", offset:0.45},
             {opacity:0, filter:"blur(0px)"}],
            {duration: 520, easing:"cubic-bezier(.1,.9,.2,1)", fill:"forwards"}
          );
        }
      }catch(e){}

      // NOW: renderuj karty dopiero po sekwencji tunelu
      const cards = units.map((u, i)=>{
        const el = document.createElement("div");
        const rar = String(u.rarity||"R").toLowerCase();
        const isLimited = (u.element==="Limited") || !!u.limited;
        el.className = "wishCard r-" + rar + (isLimited ? " limited" : "");
        el.innerHTML = `
          <div class="cover"></div>
          <div class="shineSweep"></div>
          <div class="embers"></div>
          <div class="inner">
            <div class="topRow">
              <span class="rarTag">${starLabelSpan((u.stars!=null?u.stars:(unitRarity(u)==="UR"?6:(unitRarity(u)==="SSR"?5:(unitRarity(u)==="SR"?4:3)))), (u.element==="Limited") || !!u.limited)}</span>
              <span class="el">${escapeHtml(u.element||"")}</span>
            </div>
            ${(metas && metas[i] && metas[i].isNew) ? '<div class="newBadge">NOWA</div>' : ''}
            <div class="avatarHost">${avatarHTML(u.id)}</div>
            <div class="nm">${escapeHtml(u.name||"")}</div>
          </div>
        `;
        grid.appendChild(el);
        setTimeout(()=>{ el.classList.add("in"); }, 20 + i*35);
        return el;
      });

      try{ if(wrap) wrap.classList.add("show"); }catch(e){}

      const revealOne = (i, silent=false)=>{
        if(token !== revealToken) return;
        const u = units[i];
        const el = cards[i];
        if(!el) return;

        el.classList.add("revealed","revealFx");
        setTimeout(()=>{ try{ el.classList.remove("revealFx"); }catch(e){} }, 900);

        if(silent) return;

        // SFX synced to the reveal (and cancelled when overlay closes)
        const st = (u && typeof u.stars === "number") ? u.stars : rarityToStars(u?.rarity);
        const baseDelay = (turbo || (S.settings && (S.settings.fastReveal || S.settings.animations===false))) ? 0 : 120;
        if(S.settings?.sfx !== false){
          scheduleWishSfx(()=>{
            if(token !== revealToken) return;
            if(st >= 6) playURCardAudio(u.id);
            else if(st === 5) sfx("revealSSR");
            else if(st === 4) sfx("revealSR");
            else sfx("revealR");
          }, baseDelay);
        }
      };

      const revealAll = ()=>{
        // Reveal visuals instantly, but stagger audio so it doesn't spill outside animation.
        for(let i=0;i<cards.length;i++){
          revealOne(i, true);
          const u = units[i];
          const st = (u && typeof u.stars === "number") ? u.stars : rarityToStars(u?.rarity);
          const extra = i*40;
          if(S.settings?.sfx !== false){
            scheduleWishSfx(()=>{
              if(token !== revealToken) return;
              if(st >= 6) playURCardAudio(u.id);
              else if(st === 5) sfx("revealSSR");
              else if(st === 4) sfx("revealSR");
              else sfx("revealR");
            }, extra);
          }
        }
      };

      // Zamknij
      btnClose.onclick = ()=>{
        if(token !== revealToken) return;
        cancelReveal();
        try{ wishOverlayOff(); }catch(e){}
        try{ renderLastRevealToBanner(); }catch(e){}
      };

      // auto reveal sequence
      const stepDelay = (turbo ? 0 : ((units.length===10) ? 140 : 0));
      (async ()=>{
        try{
          for(let i=0;i<units.length;i++){
            if(token !== revealToken) return;
            if(revealSkipping){ revealAll(); break; }
            revealOne(i);
            if(stepDelay) await sleep(stepDelay);
          }
        } finally {
          if(token !== revealToken) return;
          revealInProgress = false;
          try{ postPullToasts(units, metas||[]); }catch(e){}

          // Auto-close for AutoWish (no need to click "Zamknij")
          if(S.autoWish){
            const autoDelay = turbo ? 120 : 800;
            setTimeout(()=>{
              if(token !== revealToken) return;
              const wishingNow = document.body.classList.contains("wishing");
              if(!wishingNow) return;
              try{ cancelReveal(); }catch(e){}
              try{ wishOverlayOff(); }catch(e){}
              try{ renderLastRevealToBanner(); }catch(e){}
            }, autoDelay);
          }
        }
      })();

    }, INTRO_MS);
  }

  // click sfx for buttons
  document.addEventListener("pointerdown", (e)=>{
    const b = e.target.closest("button, .tab");
    if(b) sfx("click");
    ensureAudio();
  });

  // subtle hover sfx (throttled)
  let __hoverSfxT = 0;
  document.addEventListener("pointerover", (e)=>{
    const t = e.target.closest("button, .tab");
    if(!t) return;
    const now = performance.now();
    if(now - __hoverSfxT < 120) return;
    __hoverSfxT = now;
    sfx("hover");
  }, {passive:true});

  // ----------------------------
  // Unit state
  // ----------------------------
  function ensureUnitState(id){
    if(!S.seen[id]) S.seen[id] = { ownedCount:0, level:1, ascTier:0, const:0, talents:{ striker:0, guardian:0, scholar:0 } };
    const st = S.seen[id];
    if(st.ascTier == null) st.ascTier = 0;
    if(st.const == null) st.const = 0;
    if(st.level == null) st.level = 1;
    if(st.ownedCount == null) st.ownedCount = 0;
    if(!st.talents || typeof st.talents !== "object") st.talents = { striker:0, guardian:0, scholar:0 };
    if(st.talents.striker == null) st.talents.striker = 0;
    if(st.talents.guardian == null) st.talents.guardian = 0;
    if(st.talents.scholar == null) st.talents.scholar = 0;
    return st;
  }

  // Economy
  const GOLD_REWARD_MULT = 0.85;
  const goldReward = (n)=> Math.floor((Number(n)||0) * GOLD_REWARD_MULT);
  const addGold = (n)=> {
    S.gold += goldReward(n);
  };
  const addGems = (n)=> S.gems += n;
  const addPullTickets = (n)=> S.pulls += n;
  const addEssence = (n)=> S.essence += n;
  const addCores = (n)=> S.cores += n;

  const ownedUniqueCount = ()=> Object.keys(S.seen).filter(id => (S.seen[id]?.ownedCount ?? 0) > 0).length;
  // ----------------------------
  //  Profil: Level / XP
  // ----------------------------
  function ensurePlayer(){
    const me = getOnlineMe();
    if(!S.player) S.player = {
      username: (me?.login || "offline"),
      displayName: (me?.nick || me?.login || "offline"),
      level:1, xp:0,
      avatar:{ color:"#8fb3ff", icon:"⭐", motto:"", image:null },
      createdAt:Date.now(), lastLoginAt:Date.now()
    };

    if(!S.player.avatar) S.player.avatar = { color:"#8fb3ff", icon:"⭐", motto:"", image:null };
    if(S.player.avatar.image == null) S.player.avatar.image = null;
    if(!S.player.claimedProfileRewards) S.player.claimedProfileRewards = {};
    if(S.player.rewardsVersion == null) S.player.rewardsVersion = 1;
    if(S.player.level == null) S.player.level = 1;
    if(S.player.xp == null) S.player.xp = 0;

    //  Always bind visible nick/login to the currently logged-in ONLINE account.
    // This prevents "offline" showing up after reloads or sync operations.
    if(me){
      S.player.username = me.login || S.player.username || "offline";
      S.player.displayName = me.nick || me.login || S.player.displayName || "offline";
      S.player.boundUid = me.uid;
      S.player.lastLoginAt = Date.now();
    } else {
      if(!S.player.username) S.player.username = "offline";
      if(!S.player.displayName) S.player.displayName = S.player.username;
    }

    return S.player;
  }
  const xpNeed = (lvl)=> Math.floor(200 + (lvl*55) + (lvl*lvl*14)); // minimalnie szybsze wbijanie lvl profilu
  function addPlayerXP(x){
    const p = ensurePlayer();
    const add = Math.max(0, Math.floor(x||0));
    if(!add) return;
    p.xp += add;
    let leveled = 0;
    while(p.xp >= xpNeed(p.level)){
      p.xp -= xpNeed(p.level);
      p.level += 1;
      leveled += 1;
    }
    if(leveled){
      toast(`Profil: awans na poziom ${p.level}!`);
      try{ sfx("levelup"); }catch(e){}
      try{ playGlobalFX("levelup", { color: "#3bb2ff", label: "LEVEL UP" }); }catch(e){}
      try{ onProfileLevelChanged(); }catch(e){}
    }
  }

// ----------------------------
//  Nagrody za level profilu + Leaderboard (boty)
// ----------------------------

const PROFILE_REWARDS_VERSION = 1;
const PROFILE_LEVEL_REWARDS = [
  { level: 2,  rewards: [{ key: "gold", amount: 1200 }, { key: "gems", amount: 80 }] },
  { level: 3,  rewards: [{ key: "gold", amount: 1600 }] },
  { level: 4,  rewards: [{ key: "gems", amount: 60 }] },
  { level: 5,  rewards: [{ key: "gems", amount: 160 }, { key: "pulls", amount: 1 }] },
  { level: 6,  rewards: [{ key: "gold", amount: 2600 }] },
  { level: 7,  rewards: [{ key: "gold", amount: 3500 }, { key: "essence", amount: 10 }] },
  { level: 8,  rewards: [{ key: "gems", amount: 120 }] },
  { level: 9,  rewards: [{ key: "gold", amount: 5200 }] },
  { level: 10, rewards: [{ key: "gems", amount: 320 }, { key: "pulls", amount: 2 }, { key: "cores", amount: 1 }] },
  { level: 11, rewards: [{ key: "gold", amount: 9000 }] },
  { level: 12, rewards: [{ key: "essence", amount: 25 }] },
  { level: 13, rewards: [{ key: "gems", amount: 220 }] },
  { level: 14, rewards: [{ key: "gold", amount: 12000 }] },
  { level: 15, rewards: [{ key: "gems", amount: 500 }, { key: "pulls", amount: 3 }] },
  { level: 16, rewards: [{ key: "essence", amount: 40 }] },
  { level: 18, rewards: [{ key: "gems", amount: 600 }, { key: "cores", amount: 1 }] },
  { level: 20, rewards: [{ key: "gold", amount: 15000 }, { key: "pulls", amount: 6 }, { key: "cores", amount: 2 }] },
  { level: 22, rewards: [{ key: "gems", amount: 800 }] },
  { level: 25, rewards: [{ key: "gold", amount: 30000 }, { key: "pulls", amount: 8 }, { key: "cores", amount: 2 }] },
  { level: 30, rewards: [{ key: "gems", amount: 1500 }, { key: "pulls", amount: 10 }, { key: "cores", amount: 3 }] },
  { level: 35, rewards: [{ key: "gold", amount: 60000 }, { key: "gems", amount: 1200 }] },
  { level: 40, rewards: [{ key: "gems", amount: 2500 }, { key: "pulls", amount: 15 }, { key: "cores", amount: 5 }] },
  { level: 50, rewards: [{ key: "gold", amount: 150000 }, { key: "gems", amount: 5000 }, { key: "pulls", amount: 25 }, { key: "cores", amount: 10 }] },
];

function ensureProfileRewardsState(){
  const p = ensurePlayer();
  if(!p.claimedProfileRewards) p.claimedProfileRewards = {};
  if(p.rewardsVersion !== PROFILE_REWARDS_VERSION){
    p.rewardsVersion = PROFILE_REWARDS_VERSION;
    p.claimedProfileRewards ||= {};
  }
  return p;
}

function grantRewardItem(key, amount){
  amount = Math.floor(amount||0);
  if(amount<=0) return;
  if(key==="gold") addGold(amount);
  else if(key==="gems") addGems(amount);
  else if(key==="pulls") addPullTickets(amount);
  else if(key==="essence") addEssence(amount);
  else if(key==="cores") addCores(amount);
  else {
    // fallback: próbuj wrzucić do save jako licznik
    if(!S.misc) S.misc = {};
    S.misc[key] = (S.misc[key]||0) + amount;
  }
}

function grantProfileLevelRewardsUpTo(levelNow){
  const p = ensureProfileRewardsState();
  const granted = [];
  for(const entry of PROFILE_LEVEL_REWARDS){
    if(entry.level <= levelNow && !p.claimedProfileRewards[entry.level]){
      for(const r of entry.rewards) grantRewardItem(r.key, r.amount);
      p.claimedProfileRewards[entry.level] = true;
      granted.push(entry);
    }
  }
  if(granted.length){
    toast(`Nagrody profilu: odebrano ${granted.length} prog(ów).`);
    save();
  }
  return granted;
}

function claimProfileReward(level){
  const p = ensureProfileRewardsState();
  const entry = PROFILE_LEVEL_REWARDS.find(x=>x.level===level);
  if(!entry) return;
  if((p.level||1) < level) return;
  if(p.claimedProfileRewards[level]) return;

  for(const r of entry.rewards) grantRewardItem(r.key, r.amount);
  p.claimedProfileRewards[level] = true;
  toast(`Odebrano nagrodę za level ${level}.`);
  save();
  renderAll();
}

function renderProfileRewardsSection(){
  const p = ensureProfileRewardsState();
  const current = p.level || 1;

  const rows = PROFILE_LEVEL_REWARDS.map(entry => {
    const claimed = !!p.claimedProfileRewards[entry.level];
    const available = current >= entry.level && !claimed;
    const rewardsText = entry.rewards.map(r => `${r.amount} ${r.key}`).join(", ");
    return `
      <div class="prRow">
        <div class="prLeft">
          <div class="prLvl">Lv ${entry.level}</div>
          <div class="prRew">${escapeHtml(rewardsText)}</div>
        </div>
        <div class="prRight">
          ${claimed
            ? '<span class="tag tagOk">Odebrane</span>'
            : (available
                ? `<button class="btn primary" onclick="claimProfileReward(${entry.level})">Odbierz</button>`
                : '<span class="tag">Zablokowane</span>'
              )
          }
        </div>
      </div>`;
  }).join("");

  return `
    <div class="hr"></div>
    <div class="prHeader">
      <div><b>Nagrody profilu</b></div>
      <div class="prSub">Twój level: <b>${current}</b></div>
    </div>
    <div class="prBox">${rows}</div>
  `;
}

// expose for inline onclick
window.claimProfileReward = claimProfileReward;
window.claimAchievement = claimAchievement;

// ----------------------------
// Achievements (pod profilem)
// ----------------------------
const ACHIEVEMENTS = [
  // Wishowanie
  { id:"a_pull_10",    name:"Pierwsze losy",        desc:"Wykonaj 10 losowań.", reward:[{key:"gems",amount:100}], check:()=> (S.meta?.totalPulls||0) >= 10 },
  { id:"a_pull_100",   name:"Gacha enjoyer",       desc:"Wykonaj 100 losowań.", reward:[{key:"gold",amount:10000}], check:()=> (S.meta?.totalPulls||0) >= 100 },
  { id:"a_pull_250",   name:"Spinning machine",    desc:"Wykonaj 250 losowań.", reward:[{key:"pulls",amount:2},{key:"gems",amount:250}], check:()=> (S.meta?.totalPulls||0) >= 250 },
  { id:"a_pull_500",   name:"Nie zatrzymuj się",   desc:"Wykonaj 500 losowań.", reward:[{key:"gems",amount:750},{key:"cores",amount:1}], check:()=> (S.meta?.totalPulls||0) >= 500 },
  { id:"a_pull_1000",  name:"Gacha addicted",      desc:"Wykonaj 1000 losowań.", reward:[{key:"gems",amount:2000},{key:"pulls",amount:5}], check:()=> (S.meta?.totalPulls||0) >= 1000 },

  // UR / LIMITED
  { id:"a_ur_1",       name:"Czerwony błysk",      desc:"Zdobądź pierwszą postać UR.", reward:[{key:"gems",amount:500}], check:()=> (S.meta?.totalUR||0) >= 1 },
  { id:"a_ur_10",      name:"Kolekcjoner UR",      desc:"Zdobądź 10 postaci UR (łącznie z duplikatami).", reward:[{key:"cores",amount:2},{key:"gems",amount:1000}], check:()=> (S.meta?.totalUR||0) >= 10 },
  { id:"a_limited_1",  name:"Wybraniec bannera",   desc:"Zdobądź pierwszą UR LIMITED.", reward:[{key:"pulls",amount:3},{key:"gems",amount:1500}], check:()=> (S.meta?.totalLimitedUR||0) >= 1 },

  // Progres
  { id:"a_dng_10",     name:"Podziemia I",         desc:"Dojdź do 10. piętra w podziemiach.", reward:[{key:"gems",amount:200}], check:()=> (S.dungeon?.best||0) >= 10 },
  { id:"a_dng_25",     name:"Podziemia II",        desc:"Dojdź do 25. piętra w podziemiach.", reward:[{key:"cores",amount:1}], check:()=> (S.dungeon?.best||0) >= 25 },
  { id:"a_dng_50",     name:"Podziemia III",       desc:"Dojdź do 50. piętra w podziemiach.", reward:[{key:"cores",amount:3},{key:"gems",amount:750}], check:()=> (S.dungeon?.best||0) >= 50 },

  // Arena
  { id:"a_arena_5",    name:"Pierwsze zwycięstwa", desc:"Wygraj 5 walk na arenie.", reward:[{key:"gems",amount:250}], check:()=> (S.meta?.arenaWins||0) >= 5 },
  { id:"a_arena_25",   name:"Weteran Areny",       desc:"Wygraj 25 walk na arenie.", reward:[{key:"pulls",amount:2}], check:()=> (S.meta?.arenaWins||0) >= 25 },
  { id:"a_arena_100",  name:"Arena champion",      desc:"Wygraj 100 walk na arenie.", reward:[{key:"cores",amount:5},{key:"gems",amount:1500}], check:()=> (S.meta?.arenaWins||0) >= 100 },

  // Team / Profil / Meta
  { id:"a_team_1000",  name:"Zgrana ekipa",        desc:"Osiągnij Team Power ≥ 1000.", reward:[{key:"gold",amount:20000},{key:"gems",amount:500}], check:()=> teamPower() >= 1000 },
  { id:"a_team_5000",  name:"Maszyna do walki",    desc:"Osiągnij Team Power ≥ 5000.", reward:[{key:"cores",amount:3},{key:"gems",amount:1200}], check:()=> teamPower() >= 5000 },

  { id:"a_profile_10", name:"Rośnie w siłę",       desc:"Osiągnij level profilu 10.", reward:[{key:"gems",amount:300}], check:()=> (ensurePlayer().level||1) >= 10 },
  { id:"a_profile_25", name:"Weteran konta",       desc:"Osiągnij level profilu 25.", reward:[{key:"pulls",amount:3},{key:"gems",amount:800}], check:()=> (ensurePlayer().level||1) >= 25 },
  { id:"a_rb_1",       name:"Nowy start",          desc:"Wykonaj 1 rebirth.", reward:[{key:"essence",amount:50}], check:()=> (S.rebirth?.count||0) >= 1 },
  { id:"a_rb_5",       name:"Cykl powtórek",       desc:"Wykonaj 5 rebirthów.", reward:[{key:"essence",amount:200},{key:"cores",amount:2}], check:()=> (S.rebirth?.count||0) >= 5 },

  // Przebicie
  { id:"a_break_1",    name:"Przebicie limitów",   desc:"Odblokuj przebicie constelacji do C12 i ascension do 20.", reward:[{key:"gems",amount:1000},{key:"cores",amount:2}], check:()=> hasBreakthrough() },

  // Konstelacje ponad C6 (po przebiciu)
  { id:"a_c9",         name:"Gwiezdny rezonans",    desc:"Zdobądź dowolną postać na C9 (po przebiciu).",
    rewards:[{key:"gems",amount:2500},{key:"cores",amount:2}], check:()=> maxConstOwned() >= 9 },

  { id:"a_c12",        name:"Limit? Jaki limit?",  desc:"Zdobądź dowolną postać na C12 (maks).",
    rewards:[{key:"gems",amount:6000},{key:"tickets",amount:10},{key:"cores",amount:5}], check:()=> maxConstOwned() >= 12 },
];

function ensureMeta(){
  S.meta ||= { totalPulls:0, arenaWins:0, totalUR:0, totalLimitedUR:0, breakthrough:false };
  // backwards-compat
  if(S.meta.totalPulls==null) S.meta.totalPulls = 0;
  if(S.meta.arenaWins==null) S.meta.arenaWins = 0;
  if(S.meta.totalUR==null) S.meta.totalUR = 0;
  if(S.meta.totalLimitedUR==null) S.meta.totalLimitedUR = 0;
  if(S.meta.breakthrough==null) S.meta.breakthrough = false;
  return S.meta;
}

function hasBreakthrough(){ return !!ensureMeta().breakthrough; }
const constMax = ()=> hasBreakthrough() ? 12 : 6;
const ascMaxTier = ()=> hasBreakthrough() ? 20 : (ASC?.maxTier ?? 10);


// ----------------------------
// Titles (tytuły) – działają lokalnie (profil + leaderboard)
// ----------------------------
const TITLES = [
  { id:"t_none", name:"Brak tytułu", desc:"", unlock: ()=>true },
  { id:"t_newbie", name:"Nowicjusz", desc:"Osiągnij 10 losowań.", unlock: ()=> (S.meta?.totalPulls||0) >= 10 },
  { id:"t_gacha", name:"Gacha Enjoyer", desc:"Osiągnij 100 losowań.", unlock: ()=> (S.meta?.totalPulls||0) >= 100 },
  { id:"t_arena", name:"Weteran Areny", desc:"Wygraj 25 walk w Arenie.", unlock: ()=> (S.meta?.arenaWins||0) >= 25 },
  { id:"t_dungeon", name:"Pogromca Podziemi", desc:"Dojdź do 25. piętra w Dungeonie.", unlock: ()=> (S.dungeon?.best||0) >= 25 },
  { id:"t_limitbreak", name:"Limit Breaker", desc:"Odblokuj przebicie limitów.", unlock: ()=> hasBreakthrough() },
];

function getTitleById(id){
  return TITLES.find(t=>t.id===id) || TITLES[0];
}
function unlockedTitles(){
  return TITLES.filter(t=>{ try{ return !!t.unlock(); }catch(e){ return false; }});
}
function ensureTitleSelected(){
  const p = ensurePlayer();
  if(!p.titleId) p.titleId = "t_none";
  // jeżeli wybrany tytuł nie jest odblokowany, cofnij na t_none
  const ok = unlockedTitles().some(t=>t.id===p.titleId);
  if(!ok) p.titleId = "t_none";
  return p.titleId;
}


function maxConstOwned(){
  let best = 0;
  for(const u of (ALL_UNITS||[])){
    const st = ensureUnitState(u.id);
    if((st.ownedCount||0) > 0) best = Math.max(best, st.const||0);
  }
  return best;
}


function claimAchievement(id){
  const p = ensurePlayer();
  p.achievementsClaimed ||= {};
  const a = ACHIEVEMENTS.find(x=>x.id===id);
  if(!a) return;
  if(p.achievementsClaimed[id]) return;
  if(!a.check()) return;

  for(const r of (a.reward||[])) grantRewardItem(r.key, r.amount);
  p.achievementsClaimed[id] = true;
  try{ sfx("success"); }catch(e){}
  toast(`Achievement: ${a.name} (+${a.reward.map(r=>r.amount+' '+r.key).join(', ')})`);
  save();
  renderAll();
}

function renderAchievementsSection(){
  const p = ensurePlayer();
  p.achievementsClaimed ||= {};
  // pokazuj uporządkowane: nieodebrane najpierw
  const rows = ACHIEVEMENTS
    .slice()
    .sort((a,b)=> (p.achievementsClaimed[a.id]?1:0) - (p.achievementsClaimed[b.id]?1:0))
    .map(a=>{
      const done = !!p.achievementsClaimed[a.id];
      const ok = a.check();
      const rew = (a.reward||[]).map(r=>`${r.amount} ${r.key}`).join(", ");
      return `
        <div class="prRow">
          <div class="prLeft">
            <div class="prLvl">${escapeHtml(a.name)}</div>
            <div class="prRew">${escapeHtml(a.desc)} • <span class="muted">Nagroda: ${escapeHtml(rew)}</span></div>
          </div>
          <div class="prRight">
            ${done ? `<span class="tag tagOk">Odebrane</span>`
              : ok ? `<button class="btn primary" onclick="claimAchievement('${a.id}')">Odbierz</button>`
                   : `<span class="tag">W toku</span>`}
          </div>
        </div>
      `;
    }).join("");

  return `
    <div class="hr"></div>
    <div class="row" style="justify-content:space-between; align-items:center">
      <b>Achievements</b>
      <span class="muted small">Odblokowuj cele i odbieraj nagrody</span>
    </div>
    <div class="prBox" style="margin-top:8px">${rows}</div>
  `;
}

function onProfileLevelChanged(){
  const p = ensureProfileRewardsState();
  grantProfileLevelRewardsUpTo(p.level||1);
}

// ----------------------------
// Leaderboard: tylko online (bez botów)

function profileAvatarTinyHTML(){
  const p = ensurePlayer();
  if(p?.avatar?.image){
    return `<span class="lbAvWrap"><img src="${escapeHtml(p.avatar.image)}" alt="avatar"/></span>`;
  }
  const ico = escapeHtml(p?.avatar?.icon || "⭐");
  const col = escapeHtml(p?.avatar?.color || "#8fb3ff");
  return `<span class="lbAvWrap"><span class="lbAvEmoji" style="color:${col}">${ico}</span></span>`;
}


function rowAvatarTinyHTML(r){
  // Avatar sent from /api leaderboard should be in r.avatar
  const av = r && r.avatar ? r.avatar : null;
  if(av && av.image){
    return `<span class="lbAvWrap"><img src="${escapeHtml(av.image)}" alt="avatar"/></span>`;
  }
  const ico = escapeHtml((av && av.icon) || "👤");
  const col = escapeHtml((av && av.color) || "#8fb3ff");
  return `<span class="lbAvWrap"><span class="lbAvEmoji" style="color:${col}">${ico}</span></span>`;
}

function renderLeaderboard(){
  if(!S.ui) S.ui = {};
  const mode = S.ui.lbMode || "power";
  const token = localStorage.getItem("ONLINE_TOKEN_V2") || "";

  const findNick = (S.ui && S.ui.lbFindNick) ? String(S.ui.lbFindNick) : "";
  const findRes = (S.ui && S.ui.lbFindRes) ? S.ui.lbFindRes : null;
  const findMsg = (S.ui && S.ui.lbFindMsg) ? String(S.ui.lbFindMsg) : "";
  const searchBox = `
    <div class="row" style="gap:8px; margin:10px 0 6px 0; align-items:center;">
      <input id="lbFindNick" class="input" style="flex:1" placeholder="Wpisz nick gracza…" value="${escapeHtml(findNick)}"/>
      <button class="btn" id="lbFindBtn">Szukaj</button>
    </div>
    <div class="small muted" id="lbFindOut">${findMsg?escapeHtml(findMsg):""}${(findRes&&findRes.results&&findRes.results.length)?
      (`<div style="margin-top:6px;">` + findRes.results.map(r=>{
        const rk = (r.rank!=null) ? (`#${r.rank}${r.total?` / ${r.total}`:""}`) : "-";
        return `<div class="lbRow" style="padding:8px 10px; margin:6px 0;">
          <div class="lbLeft">${rowAvatarTinyHTML(r)}<div class="lbName"><b>${escapeHtml(r.nick||r.login||"?")}</b><div class="small muted">Miejsce: <b>${rk}</b> • Power: <b>${fmt(r.score||0)}</b></div></div></div>
        </div>`;
      }).join("") + `</div>`)
    : ""}</div>
  `;

  const renderRowsPower = (rows)=>{
    const row = (r,i)=>`<div class="lbRow ${((r.login||r.nick||"")===((ensurePlayer().username||"")))? "lbRowMe":""}"><div class="lbLeft"><span class="lbRank">#${i+1}</span> ${rowAvatarTinyHTML(r)} <span class="lbName"><span>${escapeHtml(r.nick||r.login||"?")}</span> <span class="muted">(@${escapeHtml(r.login||"?")})</span></span></div><div class="lbRight"><span class="lbVal">Team ${fmt(r.score||0)}</span></div></div>`;
    return rows.map(row).join("");
  };
  const renderRowsRebirth = (rows)=>{
    const row = (r,i)=>`<div class="lbRow ${((r.login||r.nick||"")===((ensurePlayer().username||"")))? "lbRowMe":""}"><div class="lbLeft"><span class="lbRank">#${i+1}</span> ${rowAvatarTinyHTML(r)} <span class="lbName"><span>${escapeHtml(r.nick||r.login||"?")}</span> <span class="muted">(@${escapeHtml(r.login||"?")})</span></span></div><div class="lbRight"><span class="lbVal">Rebirth ${fmt(r.rebirths||0)}</span></div></div>`;
    return rows.map(row).join("");
  };

  const renderRowsPvp = (rows)=>{
    const row = (r,i)=>{
      const av = rowAvatarTinyHTML(r);
      const rank = r.rank ? escapeHtml(r.rank.label || `${(r.rank.badge||"")} ${(r.rank.name||"")}`.trim()) : "";
      const wl = `${fmt(r.wins||0)}/${fmt(r.losses||0)}`;
      return `<div class="lbRow ${((r.login||r.nick||"").toLowerCase()===(S.onlineLogin||"").toLowerCase())?"me":""}">
        <div class="lbLeft">${av}<div class="lbName"><b>#${i+1} ${escapeHtml(r.nick||r.login||("User "+r.uid))}</b><div class="lbSub">Lv ${fmt(r.level||1)} • W/L ${wl} • Rating ${fmt(r.rating||0)} ${rank?("• "+rank):""}</div></div></div>
        <div class="lbRight"><span class="lbVal">${fmt(r.points||0)} pkt</span></div>
      </div>`;
    };
    return rows.map(row).join("");
  };

  const switcher = `
    <div style="display:flex; gap:10px; flex-wrap:wrap; margin:6px 0 14px;">
      <button class="btn ${mode==="power"?"primary":""}" id="lbModePower" data-lbmode="power">🏆 Team Power</button>
      <button class="btn ${mode==="rebirth"?"primary":""}" id="lbModeRebirth" data-lbmode="rebirth">♻️ Rebirthy</button>
      <button class="btn ${mode==="pvp"?"primary":""}" id="lbModePvp" data-lbmode="pvp">⚔️ PvP Punkty</button>
      <button class="btn ${mode==="masters"?"primary":""}" id="lbModeMasters" data-lbmode="masters">👑 Mistrzowie</button>
    </div>
  `;

  if(!token){
    return `
      <div class="card">
        <div class="h2">Leaderboard</div>
        <div class="sub">Tylko prawdziwi gracze (konto online)</div>
        ${switcher}
        <div class="small muted">Zaloguj się w panelu Online, aby zobaczyć ranking.</div>
      </div>
    `;
  }

  const cacheP = window.__MG_ONLINE_LB || { updatedAt:0, rows:[], error:null, loading:false };
  const cacheR = window.__MG_ONLINE_RB || { updatedAt:0, rows:[], error:null, loading:false };
  const cacheV = window.__MG_ONLINE_PVP_PTS || { updatedAt:0, rows:[], error:null, loading:false };
  const cacheM = window.__MG_ONLINE_MASTERS || { updatedAt:0, rows:[], error:null, loading:false, season_key:null };

  if(mode === "masters"){
    const rows = Array.isArray(cacheM.rows) ? cacheM.rows : [];
    const status = cacheM.loading ? "Ładowanie…" : (cacheM.error ? ("Błąd: " + escapeHtml(String(cacheM.error))) : "Brak danych");
    return `
      <div class="card">
        <div class="h2">Leaderboard</div>
        <div class="sub">Top 10 sezonu = <b>👑 Mistrz</b>${cacheM.season_key?` • Sezon: <b>${escapeHtml(cacheM.season_key)}</b>`:""}</div>
        ${switcher}
        ${searchBox}
        <div class="lbBox">${rows.length ? renderRowsPvp(rows) : `<div class="small muted">${status}</div>`}</div>
        <div class="small muted" style="margin-top:8px;">${cacheM.updatedAt ? ("Aktualizacja: " + new Date(cacheM.updatedAt).toLocaleString()) : ""}</div>
      </div>
    `;
  }
  if(mode === "pvp"){
    const rows = Array.isArray(cacheV.rows) ? cacheV.rows : [];
    const status = cacheV.loading ? "Ładowanie…" : (cacheV.error ? ("Błąd: " + escapeHtml(String(cacheV.error))) : "Brak danych");
    return `
      <div class="card">
        <div class="h2">Leaderboard</div>
        <div class="sub">Gracze + boty • <b>PvP punkty</b> (+10 + bonus za streak / - punkty za streak porażek)</div>
        ${switcher}
        ${searchBox}
        <div class="lbBox">${rows.length ? renderRowsPvp(rows) : `<div class="small muted">${status}</div>`}</div>
        <div class="small muted" style="margin-top:8px;">${cacheV.updatedAt ? ("Aktualizacja: " + new Date(cacheV.updatedAt).toLocaleString()) : ""}</div>
      </div>
    `;
  }

  if(mode === "rebirth"){
    const rows = Array.isArray(cacheR.rows) ? cacheR.rows : [];
    const status = cacheR.loading ? "Ładowanie…" : (cacheR.error ? ("Błąd: " + escapeHtml(String(cacheR.error))) : "Brak danych");
    return `
      <div class="card">
        <div class="h2">Leaderboard</div>
        <div class="sub">Gracze + boty • <b>Rebirthy</b></div>
        ${switcher}
        ${searchBox}
        <div class="lbBox">${rows.length ? renderRowsRebirth(rows) : `<div class="small muted">${status}</div>`}</div>
        <div class="small muted" style="margin-top:8px;">${cacheR.updatedAt ? ("Aktualizacja: " + new Date(cacheR.updatedAt).toLocaleString()) : ""}</div>
      </div>
    `;
  }

  // power
  const rows = Array.isArray(cacheP.rows) ? cacheP.rows : [];
  const status = cacheP.loading ? "Ładowanie…" : (cacheP.error ? ("Błąd: " + escapeHtml(String(cacheP.error))) : "Brak danych");
  return `
    <div class="card">
      <div class="h2">Leaderboard</div>
      <div class="sub">Gracze + boty • <b>Team Power</b></div>
      ${switcher}
      <div class="lbBox">${rows.length ? renderRowsPower(rows) : `<div class="small muted">${status}</div>`}</div>
      <div class="small muted" style="margin-top:8px;">${cacheP.updatedAt ? ("Aktualizacja: " + new Date(cacheP.updatedAt).toLocaleString()) : ""}</div>
    </div>
  `;
}

function wireLeaderboard(){
  // Re-renderowany widok -> przypinamy clicki po każdym renderze.
  const left = document.getElementById("leftBody") || document.body;

  const setMode = (mode)=>{
    if(!S.ui) S.ui = {};
    S.ui.lbMode = mode;
    save();
    renderAll();
  };

  // Najpierw bezpośrednio na przyciskach (jeśli są)
  const b1 = document.getElementById("lbModePower");
  const b2 = document.getElementById("lbModeRebirth");
  const b3 = document.getElementById("lbModePvp");

  // Search player position by nick
  const inp = document.getElementById("lbFindNick");
  const btn = document.getElementById("lbFindBtn");
  const doSearch = ()=>{
    const token = localStorage.getItem("ONLINE_TOKEN_V2") || "";
    const nick = (inp ? inp.value : ((S.ui&&S.ui.lbFindNick)||"")).trim();
    if(!S.ui) S.ui = {};
    S.ui.lbFindNick = nick;
    S.ui.lbFindRes = null;
    S.ui.lbFindMsg = nick ? "Szukam…" : "Wpisz nick, żeby wyszukać.";
    save();
    renderAll();
    if(!nick) return;

    fetch("/api/leaderboard/find?nick="+encodeURIComponent(nick), { headers:{ "Authorization":"Bearer "+token } })
      .then(async r=>({ ok:r.ok, status:r.status, body: await r.json().catch(()=>({})) }))
      .then(({ok, status, body})=>{
        if(!S.ui) S.ui = {};
        if(ok){
          S.ui.lbFindRes = body;
          S.ui.lbFindMsg = "";
        }else{
          S.ui.lbFindRes = null;
          S.ui.lbFindMsg = (body && body.error) ? body.error : ("Błąd ("+status+")");
        }
        save();
        renderAll();
      })
      .catch(()=>{
        if(!S.ui) S.ui = {};
        S.ui.lbFindRes = null;
        S.ui.lbFindMsg = "Błąd sieci";
        save();
        renderAll();
      });
  };

  if(inp){
    inp.oninput = ()=>{ if(!S.ui) S.ui = {}; S.ui.lbFindNick = inp.value; save(); };
    inp.onkeydown = (e)=>{ if(e.key==="Enter"){ e.preventDefault(); doSearch(); } };
  }
  if(btn) btn.onclick = (e)=>{ e.preventDefault(); e.stopPropagation(); doSearch(); };


  const b4 = document.getElementById("lbModeMasters");
  if(b1) b1.onclick = (e)=>{ e.preventDefault(); e.stopPropagation(); setMode("power"); };
  if(b2) b2.onclick = (e)=>{ e.preventDefault(); e.stopPropagation(); setMode("rebirth"); };
  if(b3) b3.onclick = (e)=>{ e.preventDefault(); e.stopPropagation(); setMode("pvp"); };
  if(b4) b4.onclick = (e)=>{ e.preventDefault(); e.stopPropagation(); setMode("masters"); };

  // Fallback: delegacja (gdyby ID było w innym miejscu / dynamicznie)
  if(!left._lbDelegated){
    left._lbDelegated = true;
    left.addEventListener("click", (e)=>{
      const t = e.target;
      const btn = t && (t.closest ? t.closest("#lbModePower, #lbModeRebirth, #lbModePvp, #lbModeMasters") : null);
      if(!btn) return;
      e.preventDefault();
      if(btn.id === "lbModePower") setMode("power");
      if(btn.id === "lbModeRebirth") setMode("rebirth");
      if(btn.id === "lbModePvp") setMode("pvp");
      if(btn.id === "lbModeMasters") setMode("masters");
    }, true);
  }

  // --- online leaderboard fetch + submit
  (function ensureOnlineLB(){
    try{
      const token = localStorage.getItem("ONLINE_TOKEN_V2") || "";

  const findNick = (S.ui && S.ui.lbFindNick) ? String(S.ui.lbFindNick) : "";
  const findRes = (S.ui && S.ui.lbFindRes) ? S.ui.lbFindRes : null;
  const findMsg = (S.ui && S.ui.lbFindMsg) ? String(S.ui.lbFindMsg) : "";
  const searchBox = `
    <div class="row" style="gap:8px; margin:10px 0 6px 0; align-items:center;">
      <input id="lbFindNick" class="input" style="flex:1" placeholder="Wpisz nick gracza…" value="${escapeHtml(findNick)}"/>
      <button class="btn" id="lbFindBtn">Szukaj</button>
    </div>
    <div class="small muted" id="lbFindOut">${findMsg?escapeHtml(findMsg):""}${(findRes&&findRes.results&&findRes.results.length)?
      (`<div style="margin-top:6px;">` + findRes.results.map(r=>{
        const rk = (r.rank!=null) ? (`#${r.rank}${r.total?` / ${r.total}`:""}`) : "-";
        return `<div class="lbRow" style="padding:8px 10px; margin:6px 0;">
          <div class="lbLeft">${rowAvatarTinyHTML(r)}<div class="lbName"><b>${escapeHtml(r.nick||r.login||"?")}</b><div class="small muted">Miejsce: <b>${rk}</b> • Power: <b>${fmt(r.score||0)}</b></div></div></div>
        </div>`;
      }).join("") + `</div>`)
    : ""}</div>
  `;
      if(!token) return;
      const mode = (S.ui && S.ui.lbMode) ? S.ui.lbMode : "power";
      const now = Date.now();

      // NOTE: Do NOT gate all leaderboards on the Team Power cache.
      // Each mode has its own cache + refresh timer, otherwise switching tabs looks "broken".
      const cache = window.__MG_ONLINE_LB || { updatedAt:0, rows:[], error:null, loading:false };
      window.__MG_ONLINE_LB = cache;

      // Team Power leaderboard + submit (refresh max once per minute)
      if(!cache.loading && (now - (cache.updatedAt||0) >= 60_000)){
        cache.loading = true;

        // submit current score (team power)
        const score = (typeof teamPower === "function") ? teamPower() : 0;
        fetch("/api/leaderboard/submit", {
          method:"POST",
          headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},
          body: JSON.stringify({ score, avatar: (ensurePlayer()?.avatar||null) })
        }).catch(()=>{});

        fetch("/api/leaderboard/top?limit=100", {
          headers:{"Authorization":"Bearer "+token}
        }).then(async r=>({ status:r.status, ok:r.ok, body: await r.json() })).then(({status, ok, body:d})=>{
          cache.rows = (d && d.top) ? d.top : [];
          cache.error = null;
          cache.updatedAt = Date.now();
        }).catch(e=>{
          cache.error = e && e.message ? e.message : String(e);
        }).finally(()=>{
          cache.loading = false;
          try{ renderAll(); }catch(e){}
        });
      }

      // rebirth + pvp leaderboards
      const cacheR = window.__MG_ONLINE_RB || { updatedAt:0, rows:[], error:null, loading:false };
      const cacheV = window.__MG_ONLINE_PVP_PTS || { updatedAt:0, rows:[], error:null, loading:false };
      const cacheM = window.__MG_ONLINE_MASTERS || { updatedAt:0, rows:[], error:null, loading:false, season_key:null };
      window.__MG_ONLINE_RB = cacheR;
      window.__MG_ONLINE_PVP_PTS = cacheV;
      window.__MG_ONLINE_MASTERS = cacheM;
      if(!cacheR.loading && (now - (cacheR.updatedAt||0) >= 60_000)) {
        cacheR.loading = true;
        const rebirths = (S.rebirth && S.rebirth.count) ? (S.rebirth.count|0) : 0;
        fetch("/api/leaderboard/rebirth/submit", {
          method:"POST",
          headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},
          body: JSON.stringify({ rebirths, avatar: (ensurePlayer()?.avatar||null) })
        }).catch(()=>{});

        fetch("/api/leaderboard/rebirth/top?limit=100", {
          headers:{"Authorization":"Bearer "+token}
        }).then(async r=>({ status:r.status, ok:r.ok, body: await r.json() })).then(({status, ok, body:d})=>{
          cacheR.rows = (d && d.top) ? d.top : [];
          cacheR.error = null;
          cacheR.updatedAt = Date.now();
        }).catch(e=>{
          cacheR.error = e && e.message ? e.message : String(e);
        }).finally(()=>{
          cacheR.loading = false;
          try{ renderAll(); }catch(e){}
        });
      }

      // pvp points leaderboard
      if(mode === "pvp" && !cacheV.loading && (now - (cacheV.updatedAt||0) >= 60_000)) {
        cacheV.loading = true;
        fetch("/api/arena/pvp/points_leaderboard?limit=100", {
          headers:{"Authorization":"Bearer "+token}
        }).then(async r=>({ status:r.status, ok:r.ok, body: await r.json() })).then(({status, ok, body:d})=>{
          if(!ok){
            cacheV.rows = [];
            cacheV.error = (d && d.error) ? d.error : ("HTTP " + status);
          } else {
            cacheV.rows = (d && d.leaderboard) ? d.leaderboard : [];
            cacheV.error = null;
          }
          cacheV.updatedAt = Date.now();
        }).catch(e=>{
          cacheV.error = e && e.message ? e.message : String(e);
        }).finally(()=>{
          cacheV.loading = false;
          try{ renderAll(); }catch(e){}
        });
      }

      // masters leaderboard (Top 10 sezonu)
      if(mode === "masters" && !cacheM.loading && (now - (cacheM.updatedAt||0) >= 60_000)) {
        cacheM.loading = true;
        fetch("/api/arena/pvp/masters_leaderboard", {
          headers:{"Authorization":"Bearer "+token}
        }).then(async r=>({ status:r.status, ok:r.ok, body: await r.json() })).then(({status, ok, body:d})=>{
          if(!ok){
            cacheM.rows = [];
            cacheM.error = (d && d.error) ? d.error : ("HTTP " + status);
            cacheM.season_key = null;
          } else {
            cacheM.rows = (d && (d.masters||d.leaderboard)) ? (d.masters||d.leaderboard) : [];
            cacheM.season_key = d && d.season_key ? d.season_key : null;
            cacheM.error = null;
          }
          cacheM.updatedAt = Date.now();
        }).catch(e=>{
          cacheM.error = e && e.message ? e.message : String(e);
        }).finally(()=>{
          cacheM.loading = false;
          try{ renderAll(); }catch(e){}
        });
      }
    }catch(e){}
  })();
}

// lekki refresh co minutę (zmiana tylko gdy wejdziemy w nowe okno 2h)
setInterval(()=>{ if(currentTab==="leaderboard") renderAll(); }, 60*1000);

// ----------------------------
  // Power / constellation / synergy
  // ----------------------------
  function constellationMult(c){
    let m = 1 + CONST.powerBonusPer * c;
    if(c >= 3) m += CONST.extraAt3;
    if(c >= 6) m += CONST.extraAt6;
    return m;
  }
  function unitPower(u){
    const st = ensureUnitState(u.id);
    const mult = unitRarity(u)==="UR" ? 4 : (unitRarity(u)==="SSR" ? 3 : (unitRarity(u)==="SR" ? 2 : 1));
    const ascBonus = 1 + 0.06 * st.ascTier;
    const constBonus = constellationMult(st.const);

    //  Domeny: 4 artefakty na postać (flat + set% do mocy)
    let artFlat = 0, artPct = 0;
    try{
      if(typeof unitArtifactBonuses === "function"){
        const b = unitArtifactBonuses(u.id);
        artFlat = b.flat || 0;
        artPct = b.pct || 0;
      }
    }catch(e){}

    const base = (u.basePower + (st.level-1) * mult) * ascBonus * constBonus;
    // Talents (small boosts)
    const t = st.talents || { striker:0, guardian:0, scholar:0 };
    const talentMult = 1
      + talentPctPerPointFor(u.class, "striker")  * (t.striker|0)
      + talentPctPerPointFor(u.class, "scholar")  * (t.scholar|0)
      + talentPctPerPointFor(u.class, "guardian") * (t.guardian|0);
    return Math.floor((base + artFlat) * (1 + artPct) * talentMult);
  }

  const teamUnits = ()=>{
    // hard guard: team may be missing in corrupted/old saves
    try{ normalizeTeam(); }catch(e){ if(!Array.isArray(S.team)) S.team = []; }
    const t = Array.isArray(S.team) ? S.team : [];
    const lvl = Number(S.player?.level)||1;
    const size = (function teamSizeForLevel(level){
      const L = Math.max(1, level|0);
      if(L >= 40) return 8;
      if(L >= 30) return 7;
      if(L >= 20) return 6;
      if(L >= 10) return 5;
      return 4;
    })(lvl);
    return t.slice(0, size).map(id => id ? getUnitById(id) : null).filter(Boolean);
  };
  function synergyBonus(units){
    // Synergie v1.1 (team wide, additive)
    // +5% za 2 postacie z jednego żywiołu
    // +15% za 4 postacie z jednego żywiołu
    // +25% za: 2x Legenda + 2x Elo żelo + 2x FNAF w teamie
    // +50% za: 4x Legenda / 4x Elo żelo / 4x FNAF / 2x Limited w teamie
    // +100% za 4x Limited w teamie
    if(!units || units.length===0) return 0;

    const cnt = {};
    for(const u of units){
      const el = (u && u.element) ? u.element : "—";
      cnt[el] = (cnt[el]||0) + 1;
    }
    const maxSame = Math.max(...Object.values(cnt));

    let bonus = 0;

    // mono-element
    if(maxSame >= 4) bonus += 0.15;
    else if(maxSame >= 2) bonus += 0.05;

    const legend = cnt["Legenda"] || 0;
    const elo    = cnt["Elo żelo"] || 0;
    const fnaf   = cnt["FNAF"] || 0;
    const limited= cnt["Limited"] || 0;

    // combo set 2/2/2
    if(legend >= 2 && elo >= 2 && fnaf >= 2) bonus += 0.25;

    // 4x category OR limited rules
    if(legend >= 4) bonus += 0.50;
    if(elo    >= 4) bonus += 0.50;
    if(fnaf   >= 4) bonus += 0.50;

    if(limited >= 4) bonus += 1.00;
    else if(limited >= 2) bonus += 0.50;

    return bonus;
  }
  function teamPower(){
    const units = teamUnits();
    if(units.length===0) return 0;
    const base = units.reduce((s,u)=>s+unitPower(u),0);
    return Math.floor(base * (1 + synergyBonus(units)));
  }

// ----------------------------
// Leaderboard helper: maksymalny możliwy Team Power (teoretyczny cap)
// - używane do wyznaczania top wyniku na leaderboardzie
// ----------------------------
function maxPossibleTeamPower(){
  try{
    const maxTier = ascMaxTier();
    const lvlCap = (typeof maxLevelForTier==="function") ? maxLevelForTier(maxTier) : 60;
    const constCap = (CONST && typeof CONST.max==="number") ? CONST.max : 6;

    const maxUnitPower = (u)=>{
      const mult = unitRarity(u)==="UR" ? 4 : (unitRarity(u)==="SSR" ? 3 : (unitRarity(u)==="SR" ? 2 : 1));
      const base = (u.basePower + (lvlCap-1) * mult);
      const ascBonus = 1 + 0.06 * maxTier;
      const constBonus = constellationMult(constCap);
      return Math.floor(base * ascBonus * constBonus);
    };

    const units = (ALL_UNITS).slice();
    if(units.length===0) return 0;

    // brute-force: najlepsza kombinacja 4 postaci (mało jednostek -> bezpieczne)
    const k = 4;
    let best = 0;

    for(let i=0;i<units.length;i++){
      for(let j=i+1;j<units.length;j++){
        for(let a=j+1;a<units.length;a++){
          for(let b=a+1;b<units.length;b++){
            const comb = [units[i],units[j],units[a],units[b]];
            const baseSum = comb.reduce((s,u)=>s+maxUnitPower(u),0);

            // synergy bonus przy maksymalnych konstelacjach
            let legendCount = 0;
            const cnt = {};
            for(const u of comb){
              if(u.element === "Legenda"){ legendCount++; continue; }
              cnt[u.element] = (cnt[u.element]||0)+1;
            }
            const values = Object.values(cnt);
            const maxSame = values.length ? Math.max(...values) : 0;

            let bonus = 0;
            if(maxSame>=2) bonus += 0.03*(maxSame-1);
            // combos pomijamy (cap i tak dają legendy + const)
            // constellation synergy: 4x constCap
            bonus += Math.min(0.08, (constCap*k) * 0.003);

            if(legendCount === 1) bonus += 0.18;
            else if(legendCount === 2) bonus += 0.10;
            else if(legendCount >= 4) bonus += 0.22;

            const tp = Math.floor(baseSum * (1 + bonus));
            if(tp > best) best = tp;
          }
        }
      }
    }
    return best;
  }catch(e){
    return 0;
  }
}

  function synergyText(){
    const units = teamUnits();
    if(units.length===0) return "Brak teamu.";

    const cnt = {};
    for(const u of units){
      const el = (u && u.element) ? u.element : "—";
      cnt[el] = (cnt[el]||0) + 1;
    }
    const values = Object.values(cnt);
    const maxSame = values.length ? Math.max(...values) : 0;

    const monoTxt = (maxSame>=4) ? `Mono-element x${maxSame}: +15%`
                   : (maxSame>=2) ? `Mono-element x${maxSame}: +5%`
                   : "Brak mono-elementu";

    const legend = cnt["Legenda"] || 0;
    const elo    = cnt["Elo żelo"] || 0;
    const fnaf   = cnt["FNAF"] || 0;
    const limited= cnt["Limited"] || 0;

    const extras = [];
    if(legend>=2 && elo>=2 && fnaf>=2) extras.push("2xLegenda+2xElo żelo+2xFNAF: +25%");
    if(legend>=4) extras.push("4xLegenda: +50%");
    if(elo>=4) extras.push("4xElo żelo: +50%");
    if(fnaf>=4) extras.push("4xFNAF: +50%");
    if(limited>=4) extras.push("4xLimited: +100%");
    else if(limited>=2) extras.push("2xLimited: +50%");

    const extraTxt = extras.length ? (" • " + extras.join(" • ")) : "";
    return `${monoTxt}${extraTxt} • Bonus: +${Math.round(synergyBonus(units)*100)}%`;
  }

  // ----------------------------
  //  Upgrades getters
  // ----------------------------
  function rewardMult(){ return UPG.rewardMult(S.upgrades.rewardLvl||0) * rbRewardMult(); }
  function autoHitsPerSecond(){
    const base = 1;
    return base + UPG.cpsAdd(S.upgrades.cpsLvl||0);
  }
  function dmgMult(){ return UPG.dmgMult(S.upgrades.dmgLvl||0) * rbDmgMult(); }

  function autoHitsPerTick(){
    return Math.max(1, Math.round(autoHitsPerSecond() * (UPG.tickMs/1000)));
  }
  // ----------------------------
  // Rebirth (meta-progres) – balans
  // ----------------------------
  function rb(){ return S.rebirth || {count:0, essence:0, perks:{gold:0,reward:0,dmg:0,cps:0,start:0,essence:0,pity:0}}; }
  function rbPerk(k){ return (rb().perks && rb().perks[k]) ? rb().perks[k] : 0; }

  // --- Pity tuning caps (visual + thresholds) ---
  function pityTuningLvl(){
    // Pity tuning NIE działa na banner LIMITED
    if((S.bannerId||"default")==="limited") return 0;
    return rbPerk("pity") || 0;
  }
  function ssrHardCap(){ const lvl=pityTuningLvl(); return Math.max(60, (BANNER.pityHard || 90) - lvl); }
  function urHardCap(){  const lvl=pityTuningLvl(); return Math.max(80, (BANNER.urPityHard || 200) - lvl*2); }
  function ssrSoftCap(){ const lvl=pityTuningLvl(); return Math.max(30, (BANNER.pitySoftStart || 60) - lvl); }
  function urSoftCap(){  const lvl=pityTuningLvl(); return Math.max(40, (BANNER.urPitySoftStart || 120) - lvl*2); }

  function rbGoldMult(){ return 1 + 0.05 * rbPerk("gold"); }     // +5%/lvl
  function rbRewardMult(){ return 1 + 0.04 * rbPerk("reward"); } // +4%/lvl
  function rbDmgMult(){ return 1 + 0.03 * rbPerk("dmg"); }       // +3%/lvl
  function rbCpsAdd(){ return 0.2 * rbPerk("cps"); }             // +0.2 hit/s

  function rbStartBonus(){
    const s = rbPerk("start");
    return {
      gold: 5000 * s,     // umiarkowane, żeby nie rozwalić early game
      gems: 150 * s,
      pulls: Math.floor(s/2),
      essence: 5 * s
    };
  }

  function rbPerkCost(key, nextLvl){
    // koszty rosną szybciej niż liniowo (balans)
    const base = ({gold:8, reward:10, dmg:10, cps:12, start:14, essence:16, pity:18}[key] || 10);
    return Math.floor(base * Math.pow(1.55, nextLvl) + nextLvl*2);
  }

  function rebirthCost(){
    const c = Math.max(0, S.rebirth?.count||0);
    const owned = Object.values(S.seen||{}).reduce((a,v)=>a + (v?.ownedCount||0), 0);
    const chars = Object.values(S.units||{}).reduce((a,u)=>a + (u?.count||0), 0);
    // Profile artifacts (meta) are stored separately from Domain/Unit artifacts.
    const arts  = Object.values((S.profileArtifacts||S.artifacts||{})||{}).reduce((a,v)=>a + (v?.count||0), 0);

    // koszt rośnie z rebirthami + lekko z „majątkiem” (kolekcja/artefakty/postacie)
    const wealth = (owned/220) + (chars/200) + (arts/120);
    const wealthF = 1 + Math.min(1.2, wealth*0.6); // max ~2.2
    const mult = Math.pow(1.28, c) * wealthF;
    return Math.floor(150000 * mult);
  }

  function rebirthReqLevel(){
    const c = Math.max(0, S.rebirth?.count||0);
    // 1. rebirth: 10 lvl, potem +5 lvl za każdy kolejny
    return 10 + c*5;
  }

  function canRebirth(){
    return (S.player?.level||1) >= rebirthReqLevel() && (S.gold||0) >= rebirthCost();
  }

  function rebirthGainBase(){
    // stabilny przyrost – oparty o realny progres + kolekcję
    const best = Math.max(0, S.dungeon?.best||0);
    const owned = Object.values(S.seen||{}).reduce((a,v)=>a + (v?.ownedCount||0), 0);
    const lvl = Math.max(1, S.player?.level||1);
    const rank = Math.max(1, S.arena?.rank||1);

    const chars = Object.values(S.units||{}).reduce((a,u)=>a + (u?.count||0), 0);
    const arts  = Object.values((S.profileArtifacts||S.artifacts||{})||{}).reduce((a,v)=>a + (v?.count||0), 0);

    // base
    const g = Math.floor(
      18 +
      Math.sqrt(best)*3 +
      owned*0.45 +
      (lvl-1)*0.9 +
      (rank-1)*1.2 +
      chars*0.25 +
      arts*0.35
    );

    return Math.min(450, Math.max(15, g));
  }

  function rebirthGain(){
    const base = rebirthGainBase();
    const mult = 1 + 0.08 * rbPerk("essence");
    return Math.floor(base * mult);
  }

  function rebirthGainDetailed(){
    const base = rebirthGainBase();
    const mult = 1 + 0.08 * rbPerk("essence");
    const total = Math.floor(base * mult);
    return { base, mult, total };
  }

  function doRebirth(){
    if(!canRebirth()){ toast(`Rebirth wymaga ${fmt(rebirthCost())} Gold.`); return; }
    if(!confirm("Rebirth = HARD reset (postacie, waluty, progres). Zachowujesz tylko Rebirth Essence i perki. Kontynuować?")) return;

    const gain = rebirthGainDetailed().total;

    //  Dodatkowe gemy za rebirth od progu 50 lvl (req): 1000 +250 za każdy kolejny
    const prevCount = Math.max(0, S.rebirth?.count||0);
    const reqLvlNow = 10 + prevCount*5;
    const gemReward = (reqLvlNow >= 50) ? (1000 + Math.max(0, prevCount-8)*250) : 0;
    //  Per-profile meta that must persist across rebirth
    const keepAchievements = JSON.parse(JSON.stringify(S.player?.achievementsClaimed || {}));
    const keepRedeemedCodes = JSON.parse(JSON.stringify(S.redeemedCodes || []));

    const keep = {
      user: S.player?.username || (getOnlineMe()?.login || "offline"),
      name: S.player?.displayName || (getOnlineMe()?.nick || getOnlineMe()?.login || "offline"),
	      settings: S.settings || { fastReveal:false, animations:true, sfx:true, sfxVolume:0.45, showAllDex:true, wishFx: "portal3d",
	      theme: "midnight" },
      rebirth: rb(),
      avatar: ensurePlayer().avatar ? JSON.parse(JSON.stringify(ensurePlayer().avatar)) : null,
      perm: S.perm ? JSON.parse(JSON.stringify(S.perm)) : null
      ,meta: JSON.parse(JSON.stringify(ensureMeta()))
    };
    //  Limited przenoszą się między rebirthami (tracą level i ascendy)
    const limitedKeep = {};
    try{
      for(const u of unitsLimited){
        const st = ensureUnitState(u.id);
        if((st.ownedCount||0) > 0){
          limitedKeep[u.id] = { ownedCount: st.ownedCount||0, const: st.const||0 };
        }
      }
    }catch(e){}
    keep.rebirth.count = (keep.rebirth.count||0) + 1;
    keep.rebirth.essence = (keep.rebirth.essence||0) + gain;

    // HARD RESET
S = defaultSave();

    // restore meta
    S.player.username = keep.user;
    S.player.displayName = keep.name;
    S.settings = keep.settings;
    S.rebirth = keep.rebirth;
    if(keep.perm) S.perm = keep.perm;
    // preserve global meta/stat counters (incl. breakthrough) across rebirth
    S.meta = keep.meta || S.meta;

    // preserve profile avatar (image/color/icon/motto) across rebirth
    if(keep.avatar) S.player.avatar = keep.avatar;

    //  Achievements + codes persist across rebirth (per profile)
    S.player.achievementsClaimed = keepAchievements || {};
    S.redeemedCodes = Array.isArray(keepRedeemedCodes) ? keepRedeemedCodes : [];

    // restore limited owned (reset lvl + ascTier)
    try{
      for(const [id,st] of Object.entries(limitedKeep||{})){
        if(!S.seen) S.seen = {};
        S.seen[id] = { ownedCount: st.ownedCount||0, level:1, ascTier:0, const: st.const||0 };
      }
    }catch(e){}

    // allow starter again (defaultSave already false, ale zostawiamy jawnie)
    S.starterClaimed = false;

    // start bonus z perków (raz na run – tu idealnie pasuje)
    const b = rbStartBonus();
    if(b.gold) addGold(b.gold);
    if(b.gems) addGems(b.gems);

    if(gemReward>0) addGems(gemReward);
    if(b.pulls) addPullTickets(b.pulls);
    if(b.essence) addEssence(b.essence);

    toast(`Rebirth +${gain} Essence (łącznie: ${S.rebirth.essence}).${gemReward>0 ? ` +${gemReward} Gems` : ""}`);
    save();
    applyOfflineEarnings();
    startIdleLoop();
    renderAll();
  }

  function buyRebirthPerk(key){
    const r = rb();
    if(!r.perks) r.perks = {gold:0,reward:0,dmg:0,cps:0,start:0,essence:0,pity:0};
    const nextLvl = (r.perks[key]||0) + 1;
    if(key==='pity' && nextLvl>10){ toast('Pity Tuning ma maksymalny level 10.'); return; }
    const cost = rbPerkCost(key, nextLvl);
    if((r.essence||0) < cost){ toast("Za mało Essence."); return; }
    r.essence -= cost;
    r.perks[key] = nextLvl;
    S.rebirth = r;
    toast(`Perk ${key} -> lvl ${nextLvl} (-${cost} Essence)`);
    save(); renderAll();
  }

  // ----------------------------
  //  Idle income math
  // ----------------------------
  function idleRatesPerSec(){
    const tp = teamPower();
    ensureTitleSelected();
    const owned = ownedUniqueCount();
    const teamF = IDLE.powerFactor(tp);       // 0.5..2+
    const ownedF = IDLE.ownedBonus(owned);    // 1.0..1.35
    const rewardF = rewardMult();             // reward upgrade wpływa też na idle

    // delikatny bonus jeśli masz pełny team
    const fullTeamF = (teamUnits().length>=4) ? 1.15 : (teamUnits().length>=2 ? 1.05 : 1.0);

    // final
    let goldPerSec = (IDLE.baseGoldPerSec * teamF * ownedF * fullTeamF * rewardF) * rbGoldMult();
    try{ const ab = artifactBonuses(); goldPerSec = goldPerSec * (ab.goldMult||1) + (ab.goldPS||0); }catch(e){}
    const gemsPerSec = IDLE.baseGemsPerSec * teamF * (0.85 + (owned*0.01)) * fullTeamF * (0.9 + (rewardF-1)*0.6);

    return {
      gold: Math.max(0, goldPerSec),
      gems: Math.max(0, gemsPerSec)
    };
  }

  function grantIdle(seconds, reason="idle"){
    if(seconds <= 0) return {g:0, m:0};
    const rates = idleRatesPerSec();
    const goldGain = Math.floor(rates.gold * seconds);
    const gemsGain = Math.floor(rates.gems * seconds);

    if(goldGain>0) addGold(goldGain);
    if(gemsGain>0) addGems(gemsGain);

    if(reason==="offline" && (goldGain>0 || gemsGain>0)){
      S.idle.pendingMsg = `Offline (${Math.floor(seconds)}s): +${goldGain} Gold, +${gemsGain} Gems`;
    }
    return {g:goldGain, m:gemsGain};
  }

  // nalicz offline przy starcie / reloadzie
  function applyOfflineEarnings(){
    const now = Date.now();
    const last = S.idle.lastOnlineAt || now;
    const diffSec = (now - last) / 1000;
    const sec = clamp(diffSec, 0, IDLE.maxOfflineSeconds);
    grantIdle(sec, "offline");
    S.idle.lastOnlineAt = now;
    S.idle.lastTick = now;
    save();
  }

  // online tick
  let idleTimer = null;
  function startIdleLoop(){
    if(idleTimer) clearInterval(idleTimer);
    idleTimer = setInterval(() => {
      const now = Date.now();
      const last = S.idle.lastTick || now;
      const diffSec = (now - last) / 1000;
      // zabezpieczenie
      const sec = clamp(diffSec, 0, 10);
      grantIdle(sec, "idle");
      S.idle.lastTick = now;
      S.idle.lastOnlineAt = now; // “jest aktywny”
      save();
      // odświeżamy tylko górę + status, nie cały UI (pełny render w części 4)
      renderTopLite();
    }, IDLE.tickMs);
    window.__idleTimer = idleTimer;
  }

  // ----------------------------
  // Lite render top (bez reszty UI)
  // (pełny render będzie w CZĘŚCI 4/4)
  // ----------------------------

  // ----------------------------
  // Timery resetów (Daily / Weekly)
  // ----------------------------
  function nextDailyResetTs(){
    const now = new Date();
    const nxt = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1, 0,0,0,0);
    return nxt.getTime();
  }
  function nextWeeklyResetTs(){
    // poniedziałek 00:00 lokalnie
    const now = new Date();
    const day = (now.getDay()+6)%7; // 0 = pon
    const daysToMon = 7 - day;
    const nxt = new Date(now.getFullYear(), now.getMonth(), now.getDate()+daysToMon, 0,0,0,0);
    return nxt.getTime();
  }
  function fmtHMS(ms){
    ms = Math.max(0, ms|0);
    const s = Math.floor(ms/1000);
    const hh = Math.floor(s/3600);
    const mm = Math.floor((s%3600)/60);
    const ss = s%60;
    return `${String(hh).padStart(2,"0")}:${String(mm).padStart(2,"0")}:${String(ss).padStart(2,"0")}`;
  }
  function updateResetTimers(){
    const dEl = $("#dailyReset"), wEl = $("#weeklyReset");
    if(dEl){
      dEl.textContent = fmtHMS(nextDailyResetTs()-Date.now());
      dEl.classList.add("timerMono");
    }
    if(wEl){
      wEl.textContent = fmtHMS(nextWeeklyResetTs()-Date.now());
      wEl.classList.add("timerMono");
    }
  }

function renderTopLite(){
    const goldEl = $("#gold"), gemsEl = $("#gems"), pullsEl = $("#pulls"), essEl = $("#essence"), coresEl = $("#cores");
    if(goldEl) goldEl.textContent = fmt(S.gold);
    if(gemsEl) gemsEl.textContent = fmt(S.gems);
    if(pullsEl) pullsEl.textContent = fmt(S.pulls);
    if(essEl) essEl.textContent = fmt(S.essence);
    if(coresEl) coresEl.textContent = fmt(S.cores);

    // profil
    const p = (S && S.player) ? ensurePlayer() : null;
    const pn = $("#playerName"), pl = $("#playerLevel");
    if(pn) pn.textContent = p ? (p.displayName || p.username || "Gość") : "Gość";
    if(pl) pl.textContent = p ? fmt(p.level||1) : "1";
    const pp = pn?.closest(".pill");
    if(pp && p?.avatar?.color){ pp.style.borderColor = p.avatar.color; }

    // profile tab label = player name
    const pTab = document.getElementById("profileTabName");
    if(pTab) pTab.textContent = p ? (p.displayName || p.username || "Gość") : "Gość";

    const pityEl = $("#kpiPity"), ownedEl = $("#kpiOwned"), powerEl = $("#kpiPower");
    if(pityEl){
      const lvl = pityTuningLvl();
      const ssrCls = lvl>0 ? "pityGoldText" : "";
      const urCls  = lvl>0 ? "pityRedText"  : "";
      pityEl.innerHTML = `<span class="${ssrCls}">5★ ${curPity().s5||0} / ${ssrHardCap()}</span> <br> <span class="${urCls}">6★ ${curPity().s6||0} / ${urHardCap()}</span>`;
    }
    if(ownedEl) ownedEl.textContent = fmt(ownedUniqueCount());
    if(powerEl) powerEl.textContent = fmt(teamPower());

    // PvP rank (online)
    const rankEl = $("#kpiPvpRank");
    if(rankEl){
      try{
        const token = localStorage.getItem("ONLINE_TOKEN_V2") || "";

  const findNick = (S.ui && S.ui.lbFindNick) ? String(S.ui.lbFindNick) : "";
  const findRes = (S.ui && S.ui.lbFindRes) ? S.ui.lbFindRes : null;
  const findMsg = (S.ui && S.ui.lbFindMsg) ? String(S.ui.lbFindMsg) : "";
  const searchBox = `
    <div class="row" style="gap:8px; margin:10px 0 6px 0; align-items:center;">
      <input id="lbFindNick" class="input" style="flex:1" placeholder="Wpisz nick gracza…" value="${escapeHtml(findNick)}"/>
      <button class="btn" id="lbFindBtn">Szukaj</button>
    </div>
    <div class="small muted" id="lbFindOut">${findMsg?escapeHtml(findMsg):""}${(findRes&&findRes.results&&findRes.results.length)?
      (`<div style="margin-top:6px;">` + findRes.results.map(r=>{
        const rk = (r.rank!=null) ? (`#${r.rank}${r.total?` / ${r.total}`:""}`) : "-";
        return `<div class="lbRow" style="padding:8px 10px; margin:6px 0;">
          <div class="lbLeft">${rowAvatarTinyHTML(r)}<div class="lbName"><b>${escapeHtml(r.nick||r.login||"?")}</b><div class="small muted">Miejsce: <b>${rk}</b> • Power: <b>${fmt(r.score||0)}</b></div></div></div>
        </div>`;
      }).join("") + `</div>`)
    : ""}</div>
  `;
        const pc = (typeof getPvpCache==="function") ? getPvpCache() : null;
        const me = pc && pc.me ? pc.me : null;
        if(me && me.rank){
          const label = me.rank.label || `${(me.rank.badge||"")} ${(me.rank.name||"Rank")}`.trim();
          rankEl.textContent = label;
        } else {
          rankEl.textContent = token ? "…" : "-";
          // lightweight refresh once in a while
          if(token && (!pc || !pc.me) && (!window.__MG_PVP_ME_FETCH_AT || Date.now()-window.__MG_PVP_ME_FETCH_AT>60_000)){
            window.__MG_PVP_ME_FETCH_AT = Date.now();
            fetch("/api/arena/pvp/me", { headers:{"Authorization":"Bearer "+token} })
              .then(async r=>({ok:r.ok,status:r.status,body: await r.json().catch(()=>null)}))
              .then(({ok,status,body})=>{
                if(ok && body){
                  const c = (typeof getPvpCache==="function") ? getPvpCache() : null;
                  if(c) c.me = body;
                  try{ renderAll(); }catch(e){}
                }
              }).catch(()=>{});
          }
        }
      }catch(e){ rankEl.textContent = "-"; }
    }

    const upg = $("#upgStatus");
    if(upg){
      upg.textContent = `Reward lvl ${S.upgrades.rewardLvl} (x${rewardMult().toFixed(2)}), CPS lvl ${S.upgrades.cpsLvl} (${autoHitsPerSecond().toFixed(1)}/s), DMG lvl ${S.upgrades.dmgLvl} (x${dmgMult().toFixed(2)})`;
    }
    const idleSt = $("#idleStatus");
    if(idleSt){
      const r = idleRatesPerSec();
      idleSt.textContent = `Idle: +${Math.floor(r.gold)}/s Gold, +${r.gems.toFixed(2)}/s Gems`;
    }

    // Starter button tylko jednorazowo per zapis/użytkownik
    const stBtn = $("#giveStarterBtn");
    if(stBtn) stBtn.style.display = S.starterClaimed ? "none" : "inline-flex";
  }

  // ----------------------------
  // Sanity / init idle
  // ----------------------------
  // popraw stare save’y: jeśli brak idle/upgrades
  if(!S.upgrades) S.upgrades = { rewardLvl:0, cpsLvl:0, dmgLvl:0 };
  if(S.urPity == null) S.urPity = 0;
  if(S.upgrades.dmgLvl == null) S.upgrades.dmgLvl = 0;
  if(!S.idle) S.idle = { lastTick: Date.now(), lastOnlineAt: Date.now(), pendingMsg:null };
  if(S.idle.lastOnlineAt == null) S.idle.lastOnlineAt = Date.now();
  if(S.idle.lastTick == null) S.idle.lastTick = Date.now();

  // zastosuj offline naliczenie i odpal pętlę
  applyOfflineEarnings();
  startIdleLoop();
  try{ ensureDomainHeartbeat(); }catch(e){}
  // jeśli był offline bonus - pokaż toast po załadowaniu UI (w części 4 też to dociągniemy)
  setTimeout(() => {
    if(S.idle.pendingMsg){ toast(S.idle.pendingMsg); S.idle.pendingMsg=null; save(); }
  }, 400);

  // ----------------------------
  // Dalej w CZĘŚCI 3/4: gacha, daily/bp/weekly, arena (z dmg upgrade)
  // ----------------------------
  // ----------------------------
  // Daily / BP helpers
  // ----------------------------
  function dailyResetIfNeeded(){
    const t = todayKey();
    if(S.daily.lastDailyReset !== t){
      S.daily.lastDailyReset = t;
      S.daily.progress = { pulls:0, levelUps:0 };
      S.daily.claimed = { p1:false, p5:false, lvl2:false };
      save();
    }
  }
  const incDailyProgress = (kind, amount=1)=>{ dailyResetIfNeeded(); S.daily.progress[kind] += amount; };

  function bpEnsureSeason(){
    const now = new Date();
    if(!S.bp.seasonStart){
      S.bp.seasonStart = todayKey();
      S.bp.xp = 0; S.bp.level = 0;
      S.bp.claimedFree = {}; S.bp.claimedPremium = {};
      S.bp.lastWeeklyBpReset = null;
      S.bp.weeklyClaimed = { w1:false, wBoss:false };
    }
    const start = new Date(S.bp.seasonStart+"T00:00:00Z");
    const diffDays = Math.floor((now - start) / 86400000);
    if(diffDays >= BP.seasonDays){
      S.bp.seasonStart = todayKey();
      S.bp.xp = 0; S.bp.level = 0;
      S.bp.claimedFree = {}; S.bp.claimedPremium = {};
      S.bp.lastWeeklyBpReset = null;
      S.bp.weeklyClaimed = { w1:false, wBoss:false };
      toast("Nowy sezon Battle Pass!");
      save();
    }
  }
  function bpWeeklyResetIfNeeded(){
    bpEnsureSeason();
    const wk = isoWeekKey();
    if(S.bp.lastWeeklyBpReset !== wk){
      S.bp.lastWeeklyBpReset = wk;
      S.bp.weeklyClaimed = { w1:false, wBoss:false };
      save();
    }
  }
  function bpAddXP(xp){
    bpEnsureSeason();
    if(S.bp.level >= BP.maxLevel) return;
    S.bp.xp += xp;
    while(S.bp.xp >= BP.xpPerLevel && S.bp.level < BP.maxLevel){
      S.bp.xp -= BP.xpPerLevel;
      S.bp.level += 1;
      toast(`Battle Pass: level ${S.bp.level}!`);
    }
  }
  function giveReward(rew){
    if(!rew) return;
    if(rew.type==="gold") addGold(rew.amount);
    if(rew.type==="gems") addGems(rew.amount);
    if(rew.type==="pulls") addPullTickets(rew.amount);
    if(rew.type==="essence") addEssence(rew.amount);
    if(rew.type==="cores") addCores(rew.amount);
  }

  // Login
  const canClaimDailyLogin = ()=> S.daily.lastLoginClaim !== todayKey();
  function claimDailyLogin(){
    if(!canClaimDailyLogin()){ toast("Daily login już odebrany dzisiaj."); return; }
    S.daily.lastLoginClaim = todayKey();
    addGold(1500);
    addGems(160);
    bpAddXP(30);
    addPlayerXP(12);
    toast("Odebrano daily login: +1500 Gold, +160 Gems, +30 BP XP");
    save();
    renderAll();
  }

  // ----------------------------

  function urIconClass(u){
    if(!u) return "";
    if(u.rarity !== "UR") return "";
    return (u.element === "Limited") ? " ur-limited" : " ur-black";
  }

// Avatar HTML helper
  // ----------------------------
  function avatarHTML(unitId){
  const u = getUnitById(unitId);
  if(!u) return "";

  const rarity = (u.rarity || "R").toUpperCase();
  const isLimited = !!(u.limited || (u.element==="Limited") || (u.tags && (""+u.tags).toLowerCase().includes("limited")));
  const isUR = rarity === "UR";
  const st = ensureUnitState(unitId);
  const limitBroken = hasBreakthrough() && (((st.const||0) > 6) || ((st.ascTier||0) > 10));

  // żywioł – tylko dla R/SR/SSR (UR zawsze ciemne)
  const el = (u.element || "Woda");
  const clsEl = elementClass(el);

  let cls = `avatar unitAvatar ${clsEl}`;
  if(isUR) cls = `avatar unitAvatar ur-black`;
  if(isUR && isLimited) cls = `avatar unitAvatar ur-black ur-limitedGlow`;
  if(limitBroken) cls += " limitBroken";

  // róg jakości (prawy górny)
  // UI uses ONLY star ratings. Legacy rarity is kept only as a fallback mapping.
  const stars = unitStars(u);
  // Corner color class stays star-based; limited 6★ gets prismatic corner.
  const cornerCls = (stars===6 && isLimited) ? "rar-prism" : (stars===6?"rar-ur":(stars===5?"rar-ssr":(stars===4?"rar-sr":"rar-r")));

  return `
    <div class="${cls}" title="${escapeHtml(u.name)} • ${escapeHtml(el)} • ${stars}★">
      <div class="uBg"></div>
      <div class="uPrism"></div>
      <div class="uScan"></div>

      <img class="uImg" src="/assets/units/${unitId}.png" alt="" onerror="this.onerror=null;this.src=\'/assets/units/placeholder.png\';"/>

      <div class="rarityCorner ${cornerCls}">${starLabelSpan(stars, isLimited)}</div>
    </div>
  `;
}

  // ----------------------------
  //  Limited banner timer (UI) (UI)
  // ----------------------------
  let __limitedTimerInt = null;
  function fmt2(n){ return String(n).padStart(2,"0"); }
  function updateLimitedTimerOnce(){
    const el = document.getElementById("limitedTimerText");
    const bar = document.getElementById("limitedTimerBar");
    if(!el) return;
    try{
      const exp = new Date(BANNERS?.limited?.expiresAt || "2026-01-01T00:00:00Z").getTime();
      const now = Date.now();
      let diff = exp - now;
      if(diff <= 0){
        el.textContent = "00:00:00:00";
        if(bar) bar.style.width = "100%";
        return;
      }

      // Pasek progresu LIMITED: stały okres 15 grudnia -> 1 stycznia (UTC)
      // (wypełnienie = ile czasu minęło od startu do teraz)
      const expDate = new Date(exp);
      const y = expDate.getUTCFullYear();
      const start = Date.UTC(y-1, 11, 15, 0, 0, 0); // 15 Dec poprzedniego roku
      const end = Date.UTC(y, 0, 1, 0, 0, 0);       // 1 Jan bieżącego roku
      const nowClamped = clamp(now, start, end);
      const dur = Math.max(1, end - start);
      const pct = clamp((nowClamped - start) / dur, 0, 1);
      if(bar) bar.style.width = `${Math.floor(pct*100)}%`;

      const sec = Math.floor(diff/1000);
      const d = Math.floor(sec/86400);
      const h = Math.floor((sec%86400)/3600);
      const m = Math.floor((sec%3600)/60);
      const s = sec%60;
      // Always dd:hh:mm:ss to avoid "migrating" formats.
      el.textContent = `${fmt2(d)}:${fmt2(h)}:${fmt2(m)}:${fmt2(s)}`;
    }catch(e){
      el.textContent = "";
    }
  }
  function startLimitedTimer(){
    if(__limitedTimerInt) return;
    __limitedTimerInt = setInterval(updateLimitedTimerOnce, 1000);
  }

// ----------------------------
  // Weekly rewards scaled
  // ----------------------------
  function weeklyRewardsScaled(){
    const m = rewardMult();
    return {
      gold: Math.floor(WEEKLY.rewards.gold * m),
      gems: Math.floor(WEEKLY.rewards.gems * m),
      essence: Math.floor(WEEKLY.rewards.essence * m),
      cores: WEEKLY.rewards.cores,
      bpXP: WEEKLY.rewards.bpXP
    };
  }

  // ----------------------------
  // Arena (uses DMG upgrade!)
  // ----------------------------
  let arenaTimer = null;

  function arenaRecalcHP(){
    const r = Math.max(1, S.arena.rank || 1);
    S.arena.maxHp = ARENA.baseHP + ARENA.hpPerRank * (r-1);
    S.arena.hp = clamp(S.arena.hp || S.arena.maxHp, 0, S.arena.maxHp);
  }

  function arenaDamagePerHit(){
    // Team power = bazowy DMG na hit, DMG upgrade = mnożnik
    const base = Math.max(1, teamPower());
    return Math.max(1, Math.floor(base * dmgMult()));
  }

  function arenaRewards(){
    const r = Math.max(1, S.arena.rank || 1);
    const mult = rewardMult();

    //  Wolniejsze, "zdrowsze" skalowanie nagród:
    // - rank daje mały wzrost (logarytmiczny)
    // - dłuższe granie daje delikatny bonus (max +30%)
    const kills = (S.arena.totalKills || 0);
    const playProg = 1 + Math.min(0.15, kills * 0.0009); // 0..+30% (powoli)

    const rf = Math.log2(r + 1); // 1→1, 3→2, 7→3...
    const baseG = ARENA.baseGems + Math.floor(1.1 * rf);
    const baseGold = ARENA.baseGold + Math.floor(35 * rf);

    return {
      gems: Math.floor(baseG * playProg * mult),
      gold: Math.floor(baseGold * playProg * mult),
      bpXP: 5 + Math.floor(rf),
    };
  }

  function arenaHit(fromAuto=false){
    // Anti auto-clicker (ręczne kliki): blokada przy nienaturalnym spamie
    if(!fromAuto){
      const ac = window.__MG_AC || (window.__MG_AC = { ts:[], lockUntil:0, lastToast:0 });
      const now = Date.now();
      if(ac.lockUntil && now < ac.lockUntil){
        if(now - (ac.lastToast||0) > 1200){
          ac.lastToast = now;
          toast("Anti-autoclicker: zbyt szybkie klikanie — chwilowa blokada");
        }
        return;
      }
      ac.ts.push(now);
      // keep last 1s
      ac.ts = ac.ts.filter(t=> now - t <= 1000);
      if(ac.ts.length >= 16){
        ac.lockUntil = now + 5000;
        ac.ts = [];
        ac.lastToast = now;
        toast("Anti-autoclicker: wykryto spam (blokada 5s)");
        return;
      }
    }
    arenaRecalcHP();
    const dmg = arenaDamagePerHit();
    // Artefakty: gold/click (tylko ręczne kliknięcia)
    try{ const ab = artifactBonuses(); if(!fromAuto && ab.goldClick>0) addGold(Math.floor(ab.goldClick * ab.goldMult)); }catch(e){}

    S.arena.hp = Math.max(0, S.arena.hp - dmg);

    if(S.arena.hp === 0){
      const rw = arenaRewards();
      addGems(rw.gems);
      try{ const ab = artifactBonuses(); addGold(Math.floor(rw.gold*(ab.goldMult||1))); }catch(e){ try{ const ab = artifactBonuses(); addGold(Math.floor(rw.gold*(ab.goldMult||1))); }catch(e){ addGold(rw.gold); } }
      // 🎟️ Rzadki ticket z areny
      let ticketChance = Math.min(0.10, 0.02 + (S.arena.rank||1)*0.002);
      try{ const ab = artifactBonuses(); ticketChance = clamp(ticketChance + (ab.ticketChance||0), 0, 0.25); }catch(e){} // 2% +0.2%/rank, max 10%
      if(Math.random() < ticketChance){
        addPullTickets(1);
        toast("Arena: +1 Ticket!");
      }
      bpAddXP(rw.bpXP);
      addPlayerXP(12 + Math.floor((S.arena.rank||1)/2));
      S.arena.totalKills = (S.arena.totalKills||0) + 1;
      ensureMeta().arenaWins = (ensureMeta().arenaWins||0) + 1;

      sfx("kill");

      if(S.arena.totalKills % 5 === 0){
        S.arena.rank += 1;
        toast(`Arena: awans na rangę ${S.arena.rank}!`);
      }
      arenaRecalcHP();
      S.arena.hp = S.arena.maxHp;

      if(!fromAuto) toast(`Pokonano wroga! +${rw.gems} Gems, +${rw.gold} Gold`);
    }

    save();
    renderTopLite();
    renderArenaHUDOnly();
  }

  function setArenaAuto(on){
    S.arena.auto = !!on;
    save();
    if(arenaTimer){ clearInterval(arenaTimer); arenaTimer=null; }
    window.__arenaTimer = arenaTimer;
    if(S.arena.auto){
      arenaTimer = setInterval(() => {
        const hits = autoHitsPerTick();
        for(let i=0;i<hits;i++) arenaHit(true);
      }, UPG.tickMs);
      window.__arenaTimer = arenaTimer;
    }
    renderArenaHUDOnly();
  }

  function renderArenaHUDOnly(){
    if(currentTab!=="arena") return;
    const hp = S.arena.hp, maxHp = S.arena.maxHp;
    const pct = maxHp>0 ? Math.floor((hp/maxHp)*100) : 0;
    const rw = arenaRewards();
    const dmg = arenaDamagePerHit();

    $("#arenaHPText").textContent = `${hp}/${maxHp} (${pct}%)`;
    $("#arenaHPFill").style.width = `${pct}%`;
    $("#arenaInfo").textContent =
      `Dmg/hit: ${dmg} (x${dmgMult().toFixed(2)}) • Auto CPS: ${autoHitsPerSecond().toFixed(1)} • Reward mult: x${rewardMult().toFixed(2)} • Reward/kill: +${rw.gems} Gems, +${rw.gold} Gold • Rank: ${S.arena.rank}`;
    $("#arenaAutoBtn").textContent = S.arena.auto ? "Auto: ON" : "Auto: OFF";
  }

  // ----------------------------
  // Arena PvP (online simulated)
  // ----------------------------
  const getPvpCache = ()=>{
    if(!window.__MG_PVP) window.__MG_PVP = { me:null, opponents:[], last:null, updatedAt:0, loading:false, error:null };
    return window.__MG_PVP;
  };

  function pvpFetchMeAndOpponents(force=false){
    try{
      const token = localStorage.getItem("ONLINE_TOKEN_V2") || "";

  const findNick = (S.ui && S.ui.lbFindNick) ? String(S.ui.lbFindNick) : "";
  const findRes = (S.ui && S.ui.lbFindRes) ? S.ui.lbFindRes : null;
  const findMsg = (S.ui && S.ui.lbFindMsg) ? String(S.ui.lbFindMsg) : "";
  const searchBox = `
    <div class="row" style="gap:8px; margin:10px 0 6px 0; align-items:center;">
      <input id="lbFindNick" class="input" style="flex:1" placeholder="Wpisz nick gracza…" value="${escapeHtml(findNick)}"/>
      <button class="btn" id="lbFindBtn">Szukaj</button>
    </div>
    <div class="small muted" id="lbFindOut">${findMsg?escapeHtml(findMsg):""}${(findRes&&findRes.results&&findRes.results.length)?
      (`<div style="margin-top:6px;">` + findRes.results.map(r=>{
        const rk = (r.rank!=null) ? (`#${r.rank}${r.total?` / ${r.total}`:""}`) : "-";
        return `<div class="lbRow" style="padding:8px 10px; margin:6px 0;">
          <div class="lbLeft">${rowAvatarTinyHTML(r)}<div class="lbName"><b>${escapeHtml(r.nick||r.login||"?")}</b><div class="small muted">Miejsce: <b>${rk}</b> • Power: <b>${fmt(r.score||0)}</b></div></div></div>
        </div>`;
      }).join("") + `</div>`)
    : ""}</div>
  `;
      if(!token) return;
      const c = getPvpCache();
      const now = Date.now();
      if(c.loading) return;
      if(!force && now - (c.updatedAt||0) < 30_000 && c.me && Array.isArray(c.opponents) && c.opponents.length) return;
      c.loading = true;
      c.error = null;

      Promise.all([
        fetch("/api/arena/pvp/me", { headers:{"Authorization":"Bearer "+token} }).then(r=>r.json()),
        fetch("/api/arena/pvp/opponents?limit=10", { headers:{"Authorization":"Bearer "+token} }).then(r=>r.json()),
        fetch("/api/arena/pvp/rewards_state", { headers:{"Authorization":"Bearer "+token} }).then(r=>r.json()).catch(()=>null)
      ]).then(([me, ops, rewards])=>{
        c.me = me || null;
        try{
          const prevOrder = window.__LAST_PVP_RANK_ORDER || 0;
          const prevLabel = window.__LAST_PVP_RANK_LABEL || "";
          const newOrder = pvpRankOrder(me?.rank);
          const newLabel = (me && me.rank && me.rank.label) ? String(me.rank.label) : "";
          // show overlay only on real upgrade (ignore first load)
          if(prevLabel && newLabel && newOrder > prevOrder){
            openPvpRankUpOverlay(me.rank);
          }
          window.__LAST_PVP_RANK_ORDER = newOrder;
          window.__LAST_PVP_RANK_LABEL = newLabel;
        }catch(e){}
        c.opponents = (ops && ops.opponents) ? ops.opponents : [];
        c.rewards = rewards || null;
        c.updatedAt = Date.now();
      }).catch(e=>{
        c.error = (e && e.message) ? e.message : String(e);
      }).finally(()=>{
        c.loading = false;
        if(currentTab==="pvp"){ try{ renderAll(); }catch(e){} }
      });
    }catch(e){}
  }

  function pvpFight(oppUid){
    const token = localStorage.getItem("ONLINE_TOKEN_V2") || "";

  const findNick = (S.ui && S.ui.lbFindNick) ? String(S.ui.lbFindNick) : "";
  const findRes = (S.ui && S.ui.lbFindRes) ? S.ui.lbFindRes : null;
  const findMsg = (S.ui && S.ui.lbFindMsg) ? String(S.ui.lbFindMsg) : "";
  const searchBox = `
    <div class="row" style="gap:8px; margin:10px 0 6px 0; align-items:center;">
      <input id="lbFindNick" class="input" style="flex:1" placeholder="Wpisz nick gracza…" value="${escapeHtml(findNick)}"/>
      <button class="btn" id="lbFindBtn">Szukaj</button>
    </div>
    <div class="small muted" id="lbFindOut">${findMsg?escapeHtml(findMsg):""}${(findRes&&findRes.results&&findRes.results.length)?
      (`<div style="margin-top:6px;">` + findRes.results.map(r=>{
        const rk = (r.rank!=null) ? (`#${r.rank}${r.total?` / ${r.total}`:""}`) : "-";
        return `<div class="lbRow" style="padding:8px 10px; margin:6px 0;">
          <div class="lbLeft">${rowAvatarTinyHTML(r)}<div class="lbName"><b>${escapeHtml(r.nick||r.login||"?")}</b><div class="small muted">Miejsce: <b>${rk}</b> • Power: <b>${fmt(r.score||0)}</b></div></div></div>
        </div>`;
      }).join("") + `</div>`)
    : ""}</div>
  `;
    if(!token) return toast("Zaloguj się ONLINE.");
    const c = getPvpCache();
    if(c.loading) return;
    c.loading = true;
    
const myEls = (()=>{
  try{
    return (typeof teamUnits==="function" ? teamUnits() : []).map(u=>u?.element).filter(Boolean);
  }catch(e){ return []; }
})();
const oppEls = (()=>{
  try{
    const c=getPvpCache();
    const it=(c&&Array.isArray(c.opponents))?c.opponents.find(o=>String(o.uid)===String(oppUid)):null;
    const td = it?.teamDetails;
    if(Array.isArray(td)) return td.map(u=>u?.element).filter(Boolean);
    return [];
  }catch(e){ return []; }
})();

fetch("/api/arena/pvp/fight", {
  method:"POST",
  headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},
  body: JSON.stringify({
    opponent_uid: oppUid,
    my_power: (typeof teamPower==="function"?teamPower():0),
    opp_power: (()=>{ try{ const c=getPvpCache(); const it=(c&&Array.isArray(c.opponents))?c.opponents.find(o=>String(o.uid)===String(oppUid)):null; return Number(it?.teamPower)||0; }catch(e){ return 0; } })(),
    my_elements: myEls,
    opp_elements: oppEls
  })
}).then(async r=>{
      // Be robust: backend might return HTML if something crashes; always try to parse JSON.
      const txt = await r.text();
      let body = null;
      try{ body = txt ? JSON.parse(txt) : {}; }catch{ body = { error: txt?.slice(0,240) || "Invalid response" }; }
      return { status: r.status, ok: r.ok, body };
    }).then(({status, ok, body:d})=>{
      if(status===409 && d && d.error){
        toast("Już walczyłeś z tym przeciwnikiem w tej godzinie.");
        pvpFetchMeAndOpponents(true);
        return;
      }
      if(d && d.error){ throw new Error(d.error); }
      c.last = d;
      try{ if(d && d.battleLog && typeof openPvpBattleModal==="function"){ openPvpBattleModal(d); } }catch(e){}

      // Rank-up overlay should trigger immediately after crossing the threshold,
      // not only after refreshing opponents.
      try{
        if(d && d.rank_up && d.rank_after){
          openPvpRankUpOverlay(d.rank_after);
          // keep internal tracking in sync so the overlay won't re-trigger on the next fetch
          window.__LAST_PVP_RANK_ORDER = pvpRankOrder(d.rank_after);
          window.__LAST_PVP_RANK_LABEL = (d.rank_after && d.rank_after.label) ? String(d.rank_after.label) : "";
        }
      }catch(e){}

      // Update local PvP cache immediately (W/L/points) so UI refreshes live.
      try{
        if(c.me && d && d.wl){
          c.me.wins = d.wl.wins;
          c.me.losses = d.wl.losses;
        }
        if(c.me && d && d.rating){
          c.me.rating = d.rating.after;
        }
        if(c.me && d && d.pvp_points){
          c.me.pvp_points = d.pvp_points.after;
        }
        if(Array.isArray(c.opponents)){
          const it = c.opponents.find(o=>String(o.uid)===String(oppUid));
          if(it) it.canFightToday = false;
        }
      }catch(e){}
      // rewards are granted client-side (save) to keep the server stateless about economy
      if(d && d.rewards){
        S.gold = (S.gold||0) + (d.rewards.gold||0);
        S.gems = (S.gems||0) + (d.rewards.gems||0);
        S.pvp ||= { wins:0, losses:0 };
        if(d.result==="win") S.pvp.wins = (S.pvp.wins||0) + 1;
        else S.pvp.losses = (S.pvp.losses||0) + 1;
        const ptsTxt = (d && d.pvp_points) ? (` • Punkty ${d.pvp_points.delta>=0?"+":""}${fmt(d.pvp_points.delta||0)}`) : "";
        const streakTxt = (d && d.streaks) ? (` • Streak W:${fmt(d.streaks.win||0)} L:${fmt(d.streaks.loss||0)}`) : "";
        toast(`PvP: ${d.result==="win"?"Zwycięstwo":"Porażka"}! +${d.rewards.gems||0} Gems, +${fmt(d.rewards.gold||0)} Gold${ptsTxt}${streakTxt}`);
        save();
      }
      // Do NOT auto-refresh opponents after every fight (it causes the list to jump/refresh
      // after a few fights). We already have fresh deltas locally.
      // Refresh only the "me" panel occasionally (and keep opponents as-is).
      try{ pvpFetchMeOnly?.(false); }catch(e){}
    }).catch(e=>{
      toast("PvP błąd: " + (e && e.message ? e.message : String(e)));
    }).finally(()=>{
      c.loading = false;
      if(currentTab==="pvp"){ try{ renderAll(); }catch(e){} }
    });
  }

  // Lightweight refresh (me + rewards) without rewriting the opponents list.
  function pvpFetchMeOnly(force=false){
    try{
      const token = localStorage.getItem("ONLINE_TOKEN_V2") || "";
      if(!token) return;
      const c = getPvpCache();
      const now = Date.now();
      if(c.loading) return;
      if(!force && now - (c.meUpdatedAt||0) < 15_000 && c.me) return;
      c.loading = true;
      Promise.all([
        fetch("/api/arena/pvp/me", { headers:{"Authorization":"Bearer "+token} }).then(r=>r.json()),
        fetch("/api/arena/pvp/rewards_state", { headers:{"Authorization":"Bearer "+token} }).then(r=>r.json()).catch(()=>null)
      ]).then(([me, rewards])=>{
        c.me = me || c.me;
        c.rewards = rewards || c.rewards;
        c.meUpdatedAt = Date.now();
        // keep rank overlay tracking up-to-date (but only show on real upgrade)
        try{
          const prevOrder = window.__LAST_PVP_RANK_ORDER || 0;
          const prevLabel = window.__LAST_PVP_RANK_LABEL || "";
          const newOrder = pvpRankOrder(me?.rank);
          const newLabel = (me && me.rank && me.rank.label) ? String(me.rank.label) : "";
          if(prevLabel && newLabel && newOrder > prevOrder){
            openPvpRankUpOverlay(me.rank);
          }
          window.__LAST_PVP_RANK_ORDER = newOrder;
          window.__LAST_PVP_RANK_LABEL = newLabel;
        }catch(e){}
      }).catch(()=>{}).finally(()=>{
        c.loading = false;
        if(currentTab==="pvp"){ try{ renderAll(); }catch(e){} }
      });
    }catch(e){}
  }

  function pvpClaimDailyRank(){
    const token = localStorage.getItem("ONLINE_TOKEN_V2") || "";

  const findNick = (S.ui && S.ui.lbFindNick) ? String(S.ui.lbFindNick) : "";
  const findRes = (S.ui && S.ui.lbFindRes) ? S.ui.lbFindRes : null;
  const findMsg = (S.ui && S.ui.lbFindMsg) ? String(S.ui.lbFindMsg) : "";
  const searchBox = `
    <div class="row" style="gap:8px; margin:10px 0 6px 0; align-items:center;">
      <input id="lbFindNick" class="input" style="flex:1" placeholder="Wpisz nick gracza…" value="${escapeHtml(findNick)}"/>
      <button class="btn" id="lbFindBtn">Szukaj</button>
    </div>
    <div class="small muted" id="lbFindOut">${findMsg?escapeHtml(findMsg):""}${(findRes&&findRes.results&&findRes.results.length)?
      (`<div style="margin-top:6px;">` + findRes.results.map(r=>{
        const rk = (r.rank!=null) ? (`#${r.rank}${r.total?` / ${r.total}`:""}`) : "-";
        return `<div class="lbRow" style="padding:8px 10px; margin:6px 0;">
          <div class="lbLeft">${rowAvatarTinyHTML(r)}<div class="lbName"><b>${escapeHtml(r.nick||r.login||"?")}</b><div class="small muted">Miejsce: <b>${rk}</b> • Power: <b>${fmt(r.score||0)}</b></div></div></div>
        </div>`;
      }).join("") + `</div>`)
    : ""}</div>
  `;
    if(!token) return toast("Zaloguj się ONLINE.");
    const c = getPvpCache();
    if(c.loading) return;
    c.loading = true;
    fetch("/api/arena/pvp/claim_daily_rank", {
      method:"POST",
      headers:{"Authorization":"Bearer "+token}
    }).then(async r=>({ ok:r.ok, status:r.status, body: await r.json().catch(()=>null) })).then(({ok,status,body})=>{
      if(!ok){
        const msg = (body && body.error) ? body.error : ("HTTP "+status);
        toast("Daily: " + msg);
        return;
      }
      if(body && body.reward){
        // server already added to cloud save, but local UI should reflect immediately
        S.gold = (S.gold||0) + (body.reward.gold||0);
        S.gems = (S.gems||0) + (body.reward.gems||0);
        save();
        toast(`Daily rangi: +${body.reward.gems||0} Gems, +${fmt(body.reward.gold||0)} Gold`);
      }
      pvpFetchMeAndOpponents(true);
    }).catch(e=>toast("Daily: " + (e && e.message ? e.message : String(e))))
      .finally(()=>{ c.loading = false; if(currentTab==="pvp") try{ renderAll(); }catch(e){} });
  }

  function pvpClaimSeasonRank(){
    const token = localStorage.getItem("ONLINE_TOKEN_V2") || "";

  const findNick = (S.ui && S.ui.lbFindNick) ? String(S.ui.lbFindNick) : "";
  const findRes = (S.ui && S.ui.lbFindRes) ? S.ui.lbFindRes : null;
  const findMsg = (S.ui && S.ui.lbFindMsg) ? String(S.ui.lbFindMsg) : "";
  const searchBox = `
    <div class="row" style="gap:8px; margin:10px 0 6px 0; align-items:center;">
      <input id="lbFindNick" class="input" style="flex:1" placeholder="Wpisz nick gracza…" value="${escapeHtml(findNick)}"/>
      <button class="btn" id="lbFindBtn">Szukaj</button>
    </div>
    <div class="small muted" id="lbFindOut">${findMsg?escapeHtml(findMsg):""}${(findRes&&findRes.results&&findRes.results.length)?
      (`<div style="margin-top:6px;">` + findRes.results.map(r=>{
        const rk = (r.rank!=null) ? (`#${r.rank}${r.total?` / ${r.total}`:""}`) : "-";
        return `<div class="lbRow" style="padding:8px 10px; margin:6px 0;">
          <div class="lbLeft">${rowAvatarTinyHTML(r)}<div class="lbName"><b>${escapeHtml(r.nick||r.login||"?")}</b><div class="small muted">Miejsce: <b>${rk}</b> • Power: <b>${fmt(r.score||0)}</b></div></div></div>
        </div>`;
      }).join("") + `</div>`)
    : ""}</div>
  `;
    if(!token) return toast("Zaloguj się ONLINE.");
    const c = getPvpCache();
    if(c.loading) return;
    c.loading = true;
    fetch("/api/arena/pvp/claim_season_rank", {
      method:"POST",
      headers:{"Authorization":"Bearer "+token}
    }).then(async r=>({ ok:r.ok, status:r.status, body: await r.json().catch(()=>null) })).then(({ok,status,body})=>{
      if(!ok){
        const msg = (body && body.error) ? body.error : ("HTTP "+status);
        toast("Sezon: " + msg);
        return;
      }
      if(body && body.reward){
        S.gold = (S.gold||0) + (body.reward.gold||0);
        S.gems = (S.gems||0) + (body.reward.gems||0);
        save();
        toast(`Nagroda sezonowa: +${body.reward.gems||0} Gems, +${fmt(body.reward.gold||0)} Gold`);
      }
      pvpFetchMeAndOpponents(true);
    }).catch(e=>toast("Sezon: " + (e && e.message ? e.message : String(e))))
      .finally(()=>{ c.loading = false; if(currentTab==="pvp") try{ renderAll(); }catch(e){} });
  }

  // ----------------------------
  // Views (HTML builders) — Banner + Arena + Shop minimal (full in part 4)
  // ----------------------------
  function renderBanner(){
    const last = S.lastReveal;
    const hasLast = last && Array.isArray(last.drops) && last.drops.length;
    const hist = Array.isArray(S.wishHistory) ? S.wishHistory : [];
    const histShow = hist.slice(0, 10);
    const histHtml = histShow.length ? histShow.map((h, idx)=>{
      const bid = (h && h.bannerId) ? h.bannerId : "default";
      const bname = (BANNERS && BANNERS[bid] && (BANNERS[bid].ui || BANNERS[bid].name)) ? (BANNERS[bid].ui || BANNERS[bid].name) : bid;
      const label = h && h.label ? h.label : summarizeWishDrops(h?.drops||[]);
      const time = h && h.time ? h.time : fmtDateTime(h?.at||Date.now());
      const chips = (h?.drops||[]).slice(0, 6).map(d=>{
        const stars = rarityToStars(d?.rarity);
        const lim = (d?.element === "Limited");
        const star = (stars===6 && lim) ? `<span class="prismaticText">6★</span>` : `${stars}★`;
        return `<span class="tag" title="${escapeHtml(d?.name||"")}">${star} ${escapeHtml(d?.name||"")}</span>`;
      }).join(" ");
      const more = ((h?.drops||[]).length > 6) ? `<span class="tag">+${(h.drops.length-6)}</span>` : "";
      return `
        <div class="wishHistItem">
          <div class="row" style="justify-content:space-between; gap:10px; flex-wrap:wrap">
            <div class="small muted" style="min-width:0">
              <b>${escapeHtml(time)}</b> • ${escapeHtml(bname)} • ${escapeHtml(label)}
            </div>
          </div>
          <div class="row" style="gap:6px; flex-wrap:wrap; margin-top:8px">${chips} ${more}</div>
        </div>
      `;
    }).join("") : `<div class="small muted">Brak historii – zrób pierwszy pull.</div>`;

    return `
      <div class="row" style="justify-content:space-between; align-items:flex-start">
        <div>
          <b>${BANNER.name}</b>
          ${((S.bannerId||'default')==='limited' && isBannerActive('limited')) ? `
            <div class="limitedCountdown" style="margin-top:8px">
              <div class="row" style="justify-content:space-between; align-items:center">
                <span class="small muted"><b>LIMITED</b> kończy się za:</span>
                <span class="tag timerMono" id="limitedTimerText">—</span>
              </div>
              <div class="bar" style="margin-top:6px"><div id="limitedTimerBar" style="width:0%"></div></div>
              
            </div>
          ` : ``}
          <div class="row" style="gap:8px; flex-wrap:wrap; margin-top:10px">
            <button class="btn" data-banner="default">Domyślny</button>
            <button class="btn" data-banner="legenda">Legenda</button>
            <button class="btn" data-banner="fnaf">FNAF</button>
            <button class="btn" data-banner="elo">Elo żelo</button>
            ${isBannerActive("limited") ? `<button class="btn" data-banner="limited">LIMITED</button>` : ``}
          </div>


          <div class="row" style="gap:10px; flex-wrap:wrap; margin-top:8px">
            <span class="tag ${((rbPerk("pity")||0)>0) ? 'pityGold' : ''}">5★ pity: <b>${curPity().s5||0}</b> / ${ssrHardCap()}</span>
            <span class="tag ${((rbPerk("pity")||0)>0) ? 'pityRed' : ''}">6★ pity: <b>${curPity().s6||0}</b> / ${urHardCap()}</span>
            <span id="limited5050Tag" class="tag ${BANNER.id==="limited" ? (curPity().lost5050 ? 'pityGold' : '') : '' }" ${BANNER.id==="limited" ? 'title="50/50 działa tylko na LIMITED: przegrana → gwarant następnej 6★ LIMITED."' : '' }>50/50 gwarant: <b>${BANNER.id==="limited" ? (curPity().lost5050 ? "TAK" : "NIE") : ""}</b></span>
          </div>
          <div class="small muted">
            Szanse bazowe: 6★ 0.5% • 5★ 2% • 4★ 18% • 3★ 79.5% (x10 gwarantuje min. 4★)<br/>
            Soft pity: 5★ od ${ssrSoftCap()} / hard ${ssrHardCap()} • 6★ od ${urSoftCap()} / hard ${urHardCap()}.
          </div>
        </div>
        <div class="row">
          <button class="btn primary" id="pull1">Pull x1 (💎${COST.singleGem} lub 🎟️1)</button>
          <button class="btn gold" id="pull10">Pull x10 (💎${COST.tenGem} lub 🎟️${COST.tenPullTicket})</button>
          <button class="btn" id="autoWishBtn">Auto Wish: ${S.autoWish ? "ON" : "OFF"}</button>
          <button class="btn" id="turboWishBtn">Turbo: ${(S.settings&&S.settings.turboAutoWish) ? "ON" : "OFF"}</button>
        </div>
      </div>

      <div class="hr"></div>

      <div class="row" style="justify-content:space-between">
        <div class="small muted">Reveal</div>
      </div>

      <div class="revealArea card" style="border-radius:16px; border:1px solid var(--line); margin-top:10px;">
        <div class="bd" style="padding:14px; width:100%;">
          <div id="revealMsg" class="small muted">
            ${hasLast ? `Ostatni wynik: ${escapeHtml(last.label)} • ${escapeHtml(last.time)}` : "Zrób pull, żeby zobaczyć wynik."}
          </div>
          <div id="revealCards" class="cards" style="margin-top:10px;"></div>
        </div>
      </div>

      <div class="hr"></div>

      <div class="row" style="justify-content:space-between; align-items:center">
        <div>
          <b>Historia poprzednich wishy</b>
          <div class="small muted">Ostatnie ${Math.min(10, hist.length)} / ${hist.length}</div>
        </div>
      </div>

      <div class="wishHistoryBox" style="margin-top:10px;">
        ${histHtml}
      </div>
    `;
  }

  function renderArena(){
    arenaRecalcHP();
    const rw = arenaRewards();
    const hp = S.arena.hp, maxHp = S.arena.maxHp;
    const pct = maxHp>0 ? Math.floor((hp/maxHp)*100) : 0;

    const rewardLvl = S.upgrades.rewardLvl||0;
    const cpsLvl = S.upgrades.cpsLvl||0;
    const dmgLvl = S.upgrades.dmgLvl||0;
    const costR = UPG.rewardCost(rewardLvl);
    const costC = UPG.cpsCost(cpsLvl);
    const costD = UPG.dmgCost(dmgLvl);

        return `
      <div class="row" style="justify-content:space-between; align-items:flex-start">
        <div>
          <b>Arena (farm Gems)</b>
          <div class="small muted">DMG wpływa na szybkość killowania. Reward wpływa też na idle i weekly.</div>
        </div>
        <div class="tag">Rank: ${S.arena.rank} • Kills: ${S.arena.totalKills||0}</div>
      </div>

      <div class="hr"></div>

      <div class="unit">
        <div class="left" style="align-items:center">
          <div style="min-width:0">
            <div class="title">
              <b>Wróg</b>
              <span class="tag" id="arenaHPText">${hp}/${maxHp} (${pct}%)</span>
            </div>
            <div class="sub">Team power: <b>${fmt(teamPower())}</b> • ${escapeHtml(synergyText())}</div>
            <div class="bar" style="margin-top:8px;"><div id="arenaHPFill" style="width:${pct}%;"></div></div>
            <div class="small muted" id="arenaInfo" style="margin-top:8px;">
              Reward/kill: +${rw.gems} Gems, +${rw.gold} Gold
            </div>
          </div>
        </div>
        <div class="right">
          <button class="btn primary" id="arenaHitBtn">🗡️ Atak</button>
          <button class="btn gold" id="arenaAutoBtn">${S.arena.auto ? "Auto: ON" : "Auto: OFF"}</button>
        </div>
      </div>

      <div class="hr"></div>

      <div class="unit">
        <div class="left">
          <div style="min-width:0">
            <div class="title">
              <b>Ulepszenia (Gold)</b>
              <span class="tag">Reward x${rewardMult().toFixed(2)}</span>
              <span class="tag">Auto CPS ${autoHitsPerSecond().toFixed(1)}/s</span>
              <span class="tag">DMG x${dmgMult().toFixed(2)}</span>
            </div>
            <div class="sub">
              • Reward: +10% do nagród Areny + Weekly + Idle<br/>
              • CPS: więcej hitów w Auto<br/>
              • DMG: większe obrażenia/hit (szybszy kill)
            </div>
          </div>
        </div>
        <div class="right">
          <button class="btn primary" id="buyRewardUpg" ${S.gold>=costR?"":"disabled"}>
            Reward +10% (lvl ${rewardLvl}) • ${fmt(costR)} Gold
          </button>
          <button class="btn gold" id="buyCpsUpg" ${S.gold>=costC?"":"disabled"}>
            Auto CPS +0.5 (lvl ${cpsLvl}) • ${fmt(costC)} Gold
          </button>
          <button class="btn" id="buyDmgUpg" ${S.gold>=costD?"":"disabled"}>
            DMG +12% (lvl ${dmgLvl}) • ${fmt(costD)} Gold
          </button>
        </div>
      </div>

      <div class="hr"></div>

      <div class="card">
        <div class="row" style="justify-content:space-between; align-items:flex-start">
          <div>
            <div class="h2">PvP Arena</div>
            <div class="small muted">Symulowane walki przeciwko botom i prawdziwym graczom (ich prawdziwe teamy i profilowe). Wejdź w osobną zakładkę.</div>
          </div>
          <div class="row" style="gap:8px; flex-wrap:wrap; justify-content:flex-end">
            <button class="btn primary" id="goPvpTabBtn">Otwórz PvP</button>
          </div>
        </div>
      </div>
    `;
  }


function renderPvp(){
    // Lazy-load opponents on tab open
    try{ pvpFetchMeAndOpponents(false); }catch(e){}

    const pvp = getPvpCache();
    const pvpMe = pvp.me;
    const pvpOps = Array.isArray(pvp.opponents) ? pvp.opponents : [];
    const pvpStatus = pvp.loading ? "Ładowanie…" : (pvp.error ? ("Błąd: " + escapeHtml(String(pvp.error))) : (pvpOps.length ? "" : "Brak przeciwników"));

    const unitLabel = (td)=>{
      const id = td && td.id ? String(td.id) : "";
      const u = getUnitById(id);
      const name = u ? u.name : id;
      const rar = u ? u.rarity : "";
      const lv = Number(td?.level) || 1;
      const c = Math.max(0, Math.min(6, Number(td?.const) || 0));
      return escapeHtml(name) + ' ' + (rar ? ('<span class="rar ' + escapeHtml(rar) + '">' + escapeHtml(rar) + '</span>') : '') + ' <span class="tag">Lv ' + lv + '</span> <span class="tag">C' + c + '</span>';
    };

    const avatarBox = (av)=>{
      const icon = (av && av.icon) ? escapeHtml(av.icon) : "🤖";
      const color = (av && av.color) ? escapeHtml(av.color) : "#8fb3ff";
      const img = (av && av.image) ? String(av.image) : "";
      if(img && img.startsWith("data:image/")){
        return `<div class="avatar" style="background:${color}; overflow:hidden"><img src="${img}" alt="" style="width:100%; height:100%; object-fit:cover; border-radius:999px"/></div>`;
      }
      return `<div class="avatar" style="background:${color}">${icon}</div>`;
    };

    const pvpRows = pvpOps.map(o=>{
      const av = o.avatar;
      const motto = (av && av.motto) ? escapeHtml(av.motto) : "";
      const power = fmt(o.teamPower||0);

      const t = Array.isArray(o.teamDetails) && o.teamDetails.length
        ? o.teamDetails.slice(0, o.teamSize||8)
        : (Array.isArray(o.team) ? o.team.slice(0, o.teamSize||8).map(id=>({id})) : []);

      const teamTxt = t.length ? t.map(unitLabel).join(" • ") : "—";

      return `
        <div class="unit">
          <div class="left">
            ${avatarBox(av)}
            <div style="min-width:0">
              <div class="title"><b>${escapeHtml(o.nick||o.login||"Gracz")}</b> <span class="tag">Lv ${o.level||1}</span> <span class="tag">Team ${power}</span> <span class="tag">Rating ${o.rating||1000}</span> <span class="tag">${o.rank?escapeHtml(o.rank.label || `${(o.rank.badge||"")} ${(o.rank.name||"")}`.trim()):""}</span></div>
              <div class="sub">${motto?(`“${motto}” • `):""}<span class="small muted">${teamTxt}</span></div>
            </div>
          </div>
          <div class="right">
            ${o.canFightToday===false ? `<button class="btn" disabled style="opacity:.55; cursor:not-allowed">Cooldown 1h</button>` : `<button class="btn primary" data-act="pvpFight" data-uid="${o.uid}">Walcz</button>`}
          </div>
        </div>
      `;
    }).join("");

    const rewards = pvp.rewards;
    const rankBadge = (pvpMe && pvpMe.rank) ? (pvpMe.rank.label || `${pvpMe.rank.badge||""} ${pvpMe.rank.name||""}`.trim()) : "";
    const myPts = pvpMe ? (Number(pvpMe.pvp_points)||0) : 0;
    const ptsRank = (pvpMe && pvpMe.points_rank) ? pvpMe.points_rank : null;
    const tierPLShort = (t)=>({
      Iron:"Żelazo", Bronze:"Brąz", Silver:"Srebro", Gold:"Złoto", Platinum:"Platyna", Emerald:"Szmaragd", Diamond:"Diament", Master:"Mistrz",
    }[String(t||"")] || String(t||""));
    const ptsNextTxt = (ptsRank && ptsRank.next)
      ? (`${tierPLShort(ptsRank.next.tier)} ${romanDiv(ptsRank.next.div)} • ${fmt(ptsRank.next.min)} pkt`)
      : "—";
    const daily = rewards && rewards.daily ? rewards.daily : null;
    const season = rewards && rewards.season ? rewards.season : null;

    const rewardLine = (rew)=>{
      if(!rew) return "—";
      return `+${fmt(rew.gems||0)} Gems, +${fmt(rew.gold||0)} Gold`;
    };

    const rewardsBox = rewards ? `
      <div class="card" style="margin-top:12px">
        <div class="h2">Nagrody za rangę</div>
        <div class="small muted">Codziennie możesz odebrać nagrodę zależną od Twojej rangi. Sezon trwa od 1. dnia miesiąca do 1. dnia następnego miesiąca.</div>
        <div class="hr"></div>
        <div class="row" style="gap:10px; flex-wrap:wrap; align-items:center">
          <span class="tag">Twoja ranga: <b>${escapeHtml(rankBadge || "—")}</b></span>
          <span class="tag">Sezon: <b>${escapeHtml(rewards.season_key||"—")}</b></span>
        </div>
        <div class="hr"></div>
        <div class="unit">
          <div class="left">
            <div style="min-width:0">
              <div class="title"><b>Daily</b></div>
              <div class="sub">Nagroda: <b>${escapeHtml(rewardLine(daily && daily.reward))}</b></div>
            </div>
          </div>
          <div class="right">
            ${daily && daily.canClaim ? `<button class="btn primary" id="pvpClaimDailyBtn">Odbierz</button>` : `<button class="btn" disabled style="opacity:.55; cursor:not-allowed">Odebrano</button>`}
          </div>
        </div>
        <div class="unit" style="margin-top:8px">
          <div class="left">
            <div style="min-width:0">
              <div class="title"><b>Sezon</b></div>
              <div class="sub">Ostatni sezon: <b>${escapeHtml((season && season.lastSeasonKey) ? season.lastSeasonKey : "—")}</b> • Ranga: <b>${escapeHtml((season && season.lastSeasonRank) ? (season.lastSeasonRank.label || ((season.lastSeasonRank.badge||"")+" "+(season.lastSeasonRank.name||""))) : "—")}</b><br/>
              ${season && season.reward ? `Nagroda sezonowa: <b>${escapeHtml(rewardLine(season.reward))}</b>` : `<span class="muted">Nagroda sezonowa pojawi się po zakończeniu pierwszego sezonu.</span>`}
              </div>
            </div>
          </div>
          <div class="right">
            ${season && season.canClaim ? `<button class="btn gold" id="pvpClaimSeasonBtn">Odbierz</button>` : `<button class="btn" disabled style="opacity:.55; cursor:not-allowed">Brak</button>`}
          </div>
        </div>
      </div>
    ` : "";

    const last = pvp.last;
    const lastBox = last ? `
      <div class="card" style="margin-top:12px">
        <div class="h2">Ostatnia walka</div>
        <div class="small muted">${escapeHtml(last.result||"")} • winProb: ${(last.winProb*100).toFixed(1)}% • roll: ${(last.roll*100).toFixed(1)}%</div>
        <div class="hr"></div>
        <div class="row" style="gap:8px; flex-wrap:wrap">
          <span class="tag">Twoja moc: <b>${fmt(last.myPower||0)}</b></span>
          <span class="tag">Moc rywala: <b>${fmt(last.oppPower||0)}</b></span>
          <span class="tag">Rating: <b>${last.rating?.before||0} → ${last.rating?.after||0}</b> (${last.rating?.delta>=0?"+":""}${last.rating?.delta||0})</span>
        </div>
      </div>
    ` : "";
    const plbCard = "";

    return `
      <div class="card">
        <div class="row" style="justify-content:space-between; align-items:flex-start">
          <div>
            <div class="h2">PvP Arena (symulacja)</div>
            <div class="small muted">Walka jest symulowana na podstawie Team Power + odrobina losowości. Przeciwnicy to boty i prawdziwi gracze (ich prawdziwe teamy i profilowe).</div>
          </div>
          <div class="row" style="gap:8px; flex-wrap:wrap; justify-content:flex-end">
            <button class="btn" id="pvpRefreshBtn">Odśwież</button>
          </div>
        </div>

        <div class="hr"></div>

        <div class="row" style="gap:8px; flex-wrap:wrap">
          <span class="tag">Rating: <b>${pvpMe ? (pvpMe.rating||1000) : "—"}</b></span>
          <span class="tag">Ranga: <b>${escapeHtml(rankBadge || "—")}</b></span>
          <span class="tag">Punkty: <b>${pvpMe ? fmt(myPts) : "—"}</b></span>
          <span class="tag">Do następnej (pkt): <b>${escapeHtml(ptsNextTxt)}</b></span>
          <span class="tag">W/L: <b>${pvpMe ? ((pvpMe.wins||0)+"/"+(pvpMe.losses||0)) : "—"}</b></span>
          <span class="tag">Twój TeamSize: <b>${pvpMe ? (pvpMe.teamSize||4) : "—"}</b></span>
          <span class="tag">Twoja moc: <b>${pvpMe ? fmt(pvpMe.myPower||0) : "—"}</b></span>
        </div>

        <div style="margin-top:10px">
          ${pvpStatus ? `<div class="small muted">${pvpStatus}</div>` : ""}
          ${pvpRows}
        </div>
      </div>
      ${lastBox}
      ${rewardsBox}
      ${renderPvpPointsLadder(pvpMe)}
      ${plbCard}
    `;
  }

  function romanDiv(d){
    const n = Number(d)||0;
    return n===5?"V":n===4?"IV":n===3?"III":n===2?"II":n===1?"I":String(n||"-");
  }

  function renderPvpPointsLadder(pvpMe){
    const ladder = (pvpMe && Array.isArray(pvpMe.points_ladder)) ? pvpMe.points_ladder : null;
    if(!ladder || !ladder.length) return "";
    const myPts = Number(pvpMe?.pvp_points)||0;
    const cur = (pvpMe && pvpMe.points_rank && pvpMe.points_rank.current) ? pvpMe.points_rank.current : null;
    const curKey = cur ? (`${cur.tier}:${cur.div}`) : "";

    const tierPL = (t)=>({
      Iron:"Żelazo",
      Bronze:"Brąz",
      Silver:"Srebro",
      Gold:"Złoto",
      Platinum:"Platyna",
      Emerald:"Szmaragd",
      Diamond:"Diament",
      Master:"Mistrz",
    }[String(t||"")] || String(t||""));

    const rows = ladder.map(it=>{
      const key = `${it.tier}:${it.div}`;
      const active = (key===curKey);
      return `<div class="pvpLadderRow ${active?"active":""}">
        <div class="pvpLadderLeft"><b>${escapeHtml(tierPL(it.tier))}</b> <span class="tag">${romanDiv(it.div)}</span></div>
        <div class="pvpLadderRight">${fmt(it.min)} pkt</div>
      </div>`;
    }).join("");

    return `
      <div class="card" style="margin-top:12px">
        <div class="h2">Progi punktowe rang</div>
        <div class="small muted">To są progi <b>PvP punktów</b> (sezonowych). Master to zawsze <b>TOP10</b> sezonu, więc próg zależy od graczy.</div>
        <div class="hr"></div>
        <div class="row" style="gap:8px; flex-wrap:wrap">
          <span class="tag">Twoje punkty: <b>${fmt(myPts)}</b></span>
          ${cur ? `<span class="tag">Aktualny próg: <b>${escapeHtml(tierPL(cur.tier))} ${romanDiv(cur.div)} (${fmt(cur.min)} pkt)</b></span>` : ""}
        </div>
        <div class="hr"></div>
        <div class="pvpLadder">${rows}</div>
      </div>
    `;
  }

function wirePvp(){
  const ref = document.getElementById("pvpRefreshBtn");
  if(ref) ref.onclick = ()=>pvpFetchMeAndOpponents(true);
  const cd = document.getElementById("pvpClaimDailyBtn");
  if(cd) cd.onclick = ()=>pvpClaimDailyRank();
  const cs = document.getElementById("pvpClaimSeasonBtn");
  if(cs) cs.onclick = ()=>pvpClaimSeasonRank();
  document.querySelectorAll("button[data-act='pvpFight']").forEach(b=>{
    b.onclick = ()=>{
      const uid = parseInt(String(b.getAttribute("data-uid")||"0"),10);
      if(uid) pvpFight(uid);
    };
  });
}

function renderShop(){
    return `
      <div class="row" style="justify-content:space-between; align-items:flex-start">
        <div>
          <b>Sklep</b>
          <div class="small muted">Pakiety + tajne kody.</div>
        </div>
      </div>

      <div class="hr"></div>

      <div class="list">
        <div class="unit">
          <div class="left">
            <div style="min-width:0">
              <div class="title"><b>Paczka materiałów Ascension</b></div>
              <div class="sub">+30 Essence, +1 Core</div>
            </div>
          </div>
          <div class="right">
            <button class="btn gold" id="buyMats">Kup (10 000 Gold)</button>
          </div>
        </div>

        <div class="unit">
          <div class="left">
            <div style="min-width:0">
              <div class="title"><b>Slot do drużyny</b></div>
              <div class="sub">Zwiększa maksymalną liczbę slotów drużyny (do 8)</div>
            </div>
          </div>
          <div class="right">
            <button class="btn gem" id="buyTeamSlot">Kup (10 000 Gems)</button>
          </div>
        </div>

        <div class="unit">
          <div class="left">
            <div style="min-width:0">
              <div class="title"><b>Tokeny C6</b></div>
              <div class="sub">Sprzedaj tokeny zduplikowanych postaci (po C6). Hurtowa sprzedaż wszystkich tokenów.</div>
              <div class="row" style="gap:8px; flex-wrap:wrap; margin-top:8px">
                <span class="tag">3★: <b>${S.tokensC6?.t3||0}</b></span>
                <span class="tag">4★: <b>${S.tokensC6?.t4||0}</b></span>
                <span class="tag">5★: <b>${S.tokensC6?.t5||0}</b></span>
                <span class="tag">6★: <b>${S.tokensC6?.t6||0}</b></span>
              </div>
              <div class="small muted" style="margin-top:6px">
                Ceny: 3★ ${fmt(C6_PRICES.t3)} • 4★ ${fmt(C6_PRICES.t4)} • 5★ ${fmt(C6_PRICES.t5)} • 6★ ${fmt(C6_PRICES.t6)} (Gemy / szt.)
              </div>
            </div>
          </div>
          <div class="right" style="display:flex; flex-direction:column; gap:8px; align-items:flex-end">
            <button class="btn gold" id="sellAllC6Btn">Sprzedaj wszystkie tokeny C6</button>
            <button class="btn" id="buyBreakthroughBtn">Przebicie limitów (C12 / Asc 20) — 100× 6★</button>
            <div class="small muted" id="breakthroughInfo">Odblokowane: <b>${hasBreakthrough() ? "TAK" : "NIE"}</b></div>
          </div>
        </div>

<div class="unit">
          <div class="left">
            <div style="min-width:0">
              <div class="title"><b>Kody</b></div>
              <div class="sub">Wpisz tajny kod i odbierz nagrody (każdy kod tylko raz).</div>
              <div style="display:flex; gap:8px; margin-top:8px; flex-wrap:wrap">
                <input id="codeInput" class="input" placeholder="Wpisz kod..." style="min-width:220px; flex:1; max-width:420px"/>
                <button class="btn" id="redeemCodeBtn">Odbierz</button>
              </div>
              <div class="small muted" id="codesHint" style="margin-top:6px"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

function wireShop(){
    // Kup materiały
    const bm = document.getElementById("buyMats");
    if(bm){
      bm.onclick = ()=>{
        if(S.gold < 10000){ toast("Masz za mało Gold."); return; }
        S.gold -= 10000; S.essence += 30; S.cores += 1;
        toast("Kupiono: +30 Essence, +1 Core");
        save(); renderAll();
      };
    }

    // Slot do drużyny
    const bts = document.getElementById("buyTeamSlot");
    if(bts){
      bts.onclick = ()=>{
        normalizeTeam();
        if((S.teamSlots||4) >= 8){ toast("Masz już max 8 slotów."); return; }
        if(S.gems < 10000){ toast("Masz za mało Gems."); return; }
        S.gems -= 10000;
        S.teamSlots = (S.teamSlots||4) + 1;
        toast(`Kupiono slot drużyny: ${S.teamSlots}/8`);
        save(); renderAll();
      };
    }

    // Tokeny C6 — sprzedaż hurtowa
    const sellBtn = document.getElementById("sellAllC6Btn");
    if(sellBtn){
      sellBtn.onclick = ()=>{
        S.tokensC6 ||= {t3:0,t4:0,t5:0,t6:0};
        const t3 = S.tokensC6.t3||0, t4 = S.tokensC6.t4||0, t5 = S.tokensC6.t5||0, t6 = S.tokensC6.t6||0;
        const total = t3+t4+t5+t6;
        if(total<=0){ toast("Nie masz tokenów C6."); return; }
        const gemsGain = t3*C6_PRICES.t3 + t4*C6_PRICES.t4 + t5*C6_PRICES.t5 + t6*C6_PRICES.t6;
        S.gems = (S.gems||0) + gemsGain;
        S.tokensC6 = {t3:0,t4:0,t5:0,t6:0};
        toast(`Sprzedano ${total} tokenów C6 za ${fmt(gemsGain)} Gemów`);
        save(); renderAll();
      };
    }

    // Przebicie limitów (C12 / Asc20) — koszt: 100 tokenów 6★
    const btBtn = document.getElementById("buyBreakthroughBtn");
    if(btBtn){
      btBtn.onclick = ()=>{
        S.perm ||= {};
        if(S.perm.limitBreakUnlocked){ toast("Masz już odblokowane przebicie limitów."); return; }
        S.tokensC6 ||= {t3:0,t4:0,t5:0,t6:0};
        if((S.tokensC6.t6||0) < 100){ toast("Potrzebujesz 100 tokenów 6★ (UR) po C6."); return; }
        S.tokensC6.t6 -= 100;
        S.perm.limitBreakUnlocked = true;
        toast("Odblokowano: C12 oraz Ascension 20!");
        save(); renderAll();
      };
    }

    // Kody
    S.redeemedCodes ||= [];
    const codes = {
      "dreslaf": { gems:1600, tickets:10, gold:100000 },
      "korsu":   { gems:1600, tickets:10, gold:100000 },
      "corvus":  { gems:1600, tickets:10, gold:100000 },
      "melcia":  { gems:1600, tickets:10, gold:100000 },
      "minigachagift": { gems:16000 },
      "prismatic": { gems:16000 },
      "rekompensatazaflasha": { gems:16000 },
      "gigapsiur": { gems:16000 },
      "giganigga": { gems: 1600},
    };

    const hint = document.getElementById("codesHint");
    if(hint){
      const left = Object.keys(codes).filter(c=>!S.redeemedCodes.includes(c)).length;
      hint.textContent = `Dostępne kody do odebrania: ${left}/${Object.keys(codes).length}`;
    }

    const btn = document.getElementById("redeemCodeBtn");
    const inp = document.getElementById("codeInput");
    const redeem = ()=>{
      const raw = String(inp?.value||"").trim().toLowerCase();
      if(!raw){ try{ sfx("error"); }catch(e){} toast("Wpisz kod."); return; }
      if(!codes[raw]){ try{ sfx("error"); }catch(e){} toast("Nieprawidłowy kod."); return; }
      if(S.redeemedCodes.includes(raw)){ try{ sfx("error"); }catch(e){} toast("Ten kod został już użyty."); return; }

      const r = codes[raw];
      if(r.gems) S.gems += r.gems;
      if(r.tickets) S.tickets = (S.tickets||0) + r.tickets;
      if(r.gold) S.gold += r.gold;

      S.redeemedCodes.push(raw);
      try{ inp.value=""; }catch(e){}
      try{ sfx("success"); }catch(e){}
      toast(`Kod zaakceptowany: ${raw} `);
      save(); renderAll();
    };
    if(btn) btn.onclick = redeem;
    if(inp) inp.addEventListener("keydown", (e)=>{ if(e.key==="Enter") redeem(); });
  }

/* === Global navigation wiring (FIX) === */
function wireNav(){
  document.querySelectorAll('.nav .tab[data-tab]').forEach(el=>{
    el.onclick = ()=>{
      const next = el.getAttribute('data-tab') || "banner";
      mgNavigate(next);
    };
  });

  // Starter (jednorazowy boost) – naprawa: wcześniej brak było handlera kliknięcia
  const stBtn = $("#giveStarterBtn");
  if(stBtn){
    stBtn.onclick = ()=>{
      if(S.starterClaimed){ toast("Starter już odebrany."); return; }
      S.starterClaimed = true;

      // Bonus startowy (pod testy / early game)
      S.gems = (S.gems||0) + 1600;
      S.tickets = (S.tickets||0) + 10;
      S.gold = (S.gold||0) + 100000;

      toast("Starter odebrany: +1600 Gems, +10 Ticketów, +100 000 Gold");
      save();
      renderAll();
    };
  }
}

/* === View transitions + navigation helper === */
let __mgNavBusy = false;
function mgNavigate(tab, opts={}){
  if(__mgNavBusy) return;
  // jeśli tutorial jest otwarty, nie pozwól losowo zmieniać zakładek (tutorial sam przełącza)
  try{ if(__mgTutorial?.open && !opts.force) return; }catch(e){}
  if(!tab) tab = "banner";
  if(tab === currentTab && !opts.force) return;
  __mgNavBusy = true;

  const body = document.getElementById("leftBody");
  // fallback: no element yet
  if(!body){
    currentTab = tab;
    renderAll();
    __mgNavBusy = false;
    return;
  }

  // animate out -> render -> animate in
  body.classList.remove("mg-swap-in","mg-swap-out");
  body.classList.add("mg-swap-out");
  setTimeout(()=>{
    currentTab = tab;
    renderAll();
    // next tick so DOM updates are applied
    requestAnimationFrame(()=>{
      try{
        const b2 = document.getElementById("leftBody");
        if(b2){
          b2.classList.remove("mg-swap-out");
          b2.classList.add("mg-swap-in");
        }
      }catch(e){}
      setTimeout(()=>{ __mgNavBusy = false; }, 220);
    });
  }, 160);
}



/* === Banner wiring (FIX) === */

// ----------------------------
//  Wish logic (fix: doPulls not defined)
// ----------------------------
let revealToken = 0;
let revealSkipping = false;
let __autoWishTimer = null;

function cancelReveal(){
  // invalidate current reveal sequence
  revealSkipping = true;
  revealToken++;
}

function stopAutoWishNow(force=false){
  try{ if(__autoWishTimer) clearInterval(__autoWishTimer); }catch(e){}
  __autoWishTimer = null;
  if(force) S.autoWish = false;
  save(); renderAll();
}

function toggleAutoWish(){
  S.autoWish = !S.autoWish;
  save(); renderAll();
  if(S.autoWish){
    // run every ~1.25s, only when overlay is not currently open
    if(__autoWishTimer) clearInterval(__autoWishTimer);
    __autoWishTimer = setInterval(()=>{
      if(!S.autoWish) return;
      const wishing = document.body.classList.contains("wishing");
      if(!wishing){
        try{ doPulls(10, true); }catch(e){}
      }
    }, getAutoWishInterval());
  } else {
    stopAutoWishNow(false);
  }
}

function getAutoWishInterval(){
  const turbo = !!(S.settings && S.settings.turboAutoWish);
  return turbo ? 250 : 1250;
}

function toggleTurboAutoWish(){
  S.settings ||= {};
  S.settings.turboAutoWish = !S.settings.turboAutoWish;

  // If turbo is enabled/disabled while auto-wishing, restart timer with the new interval.
  if(S.autoWish){
    try{ if(__autoWishTimer) clearInterval(__autoWishTimer); }catch(e){}
    __autoWishTimer = setInterval(()=>{
      if(!S.autoWish) return;
      const wishing = document.body.classList.contains("wishing");
      if(!wishing){
        try{ doPulls(10, true); }catch(e){}
      }
    }, getAutoWishInterval());
  }

  save(); renderAll();
}


function renderLastRevealToBanner(){
  // banner UI reads from S.lastReveal
  try{ renderAll(); }catch(e){}
}

// --- helpers for gacha ---
function allUnitsByRarity(r){
  const rr = (r||"R").toUpperCase();
  if(rr==="UR"){
    const bid = (typeof S!=="undefined" && S && S.bannerId) ? S.bannerId : "default";
    return (bid==="limited") ? [...units.UR, ...unitsLimited] : (units.UR||[]).slice();
  }
  return (units[rr]||[]).slice();
}
function pickRandom(arr){
  if(!arr || !arr.length) return null;
  return arr[Math.floor(Math.random()*arr.length)];
}
	// Banner-specific 6★ pools (user request: Legenda banner => only Legenda UR, etc.)
	function bannerRestrictedURPool(bid){
	  const id = String(bid || (S && S.bannerId) || 'default');
	  const base = (units && Array.isArray(units.UR)) ? units.UR.slice() : [];
	  if(id === 'legenda') return base.filter(u=> (u && u.stars>=6 && u.element === 'Legenda'));
	  if(id === 'fnaf')    return base.filter(u=> (u && u.stars>=6 && u.element === 'FNAF'));
	  if(id === 'elo')     return base.filter(u=> (u && u.stars>=6 && u.element === 'Elo żelo'));
	  return base;
	}
function featuredURPool(){
  const ids = BANNER.featuredURIds;
  // LIMITED banner: featured pool must be ONLY UR LIMITED (nie może wpaść standard UR przez fallback)
  if(BANNER && BANNER.id === "limited"){
    let pool = (typeof unitsLimited!=="undefined" && Array.isArray(unitsLimited)) ? unitsLimited.slice() : [];
    if(ids && ids.length){
      const set = new Set(ids);
      const filtered = pool.filter(u=> set.has(u.id));
      // jeśli ktoś zmienił ids i filtr wyczyścił pool, wróć do pełnej listy limited
      if(filtered.length) pool = filtered;
    }
    return pool;
  }

  if(!ids || !ids.length) return allUnitsByRarity("UR");
  const set = new Set(ids);
  return allUnitsByRarity("UR").filter(u=> set.has(u.id));
}
function nonFeaturedURPool(){
  const ids = BANNER.featuredURIds;

  // LIMITED banner: non-featured = tylko standardowe UR (bez limited)
  if(BANNER && BANNER.id === "limited"){
    let pool = (units && Array.isArray(units.UR)) ? units.UR.slice() : [];
    if(ids && ids.length){
      const set = new Set(ids);
      pool = pool.filter(u=> !set.has(u.id));
    }
    return pool;
  }

  if(!ids || !ids.length) return allUnitsByRarity("UR");
  const set = new Set(ids);
  return allUnitsByRarity("UR").filter(u=> !set.has(u.id));
}

function rollStarsForBanner(){
  const p = curPity();
  // hard caps (pity liczymy na 5★ i 6★)
  if((p.s6||0) + 1 >= urHardCap()) return 6;
  if((p.s5||0) + 1 >= ssrHardCap()) return 5;

  // base rates (legacy keys UR/SSR/SR/R)
  const base = BANNER.rates || {UR:0.0025, SSR:0.02, SR:0.18, R:0.7975};

  // soft pity bonus
  const soft6 = urSoftCap(), hard6 = urHardCap();
  const soft5 = ssrSoftCap(), hard5 = ssrHardCap();

  let c6 = base.UR;
  let c5 = base.SSR;
  const c4 = base.SR;
  // boost chances smoothly after soft cap
  if((p.s6||0) + 1 >= soft6){
    const t = clamp(((p.s6+1) - soft6) / Math.max(1,(hard6-soft6)), 0, 1);
    c6 = base.UR + t * (0.18 - base.UR); // up to ~18% near hard
  }
  if((p.s5||0) + 1 >= soft5){
    const t = clamp(((p.s5+1) - soft5) / Math.max(1,(hard5-soft5)), 0, 1);
    c5 = base.SSR + t * (0.30 - base.SSR); // up to ~30% near hard
  }

  // normalize into [6★, 5★, 4★, 3★]
  const r = Math.random();
  const a = c6;
  const b = a + c5;
  const c = b + c4;
  if(r < a) return 6;
  if(r < b) return 5;
  if(r < c) return 4;
  return 3;
}

function grantPulledUnit(u){
  if(!u) return;
  if(!S.seen) S.seen = {};
  if(!S.tokensC6) S.tokensC6 = {t3:0,t4:0,t5:0,t6:0};

  const st = ensureUnitState(u.id);
  st.ownedCount = (st.ownedCount||0) + 1;

  // constellation / dupes
  if((st.const||0) < constMax()){
    st.const = (st.const||0) + 1;
  } else {
    // C6+ => token
    const star = (unitStars(u)>=6) ? "t6" : (unitStars(u)===5 ? "t5" : (unitStars(u)===4 ? "t4" : "t3"));
    S.tokensC6[star] = (S.tokensC6[star]||0) + 1;
  }
}

function doPulls(n, fromAuto=false){
  n = (n===10?10:1);

  // cost
  const needTickets = (n===10 ? COST.tenPullTicket : COST.singlePullTicket);
  const needGems = (n===10 ? COST.tenGem : COST.singleGem);

  const hasTickets = (S.pulls||0) >= needTickets;
  const hasGems = (S.gems||0) >= needGems;

  if(!hasTickets && !hasGems){
    toast(n===10 ? `Brak ticketów (${needTickets}) ani gemów (${needGems}).` : `Brak ticketa lub gemów (${needGems}).`);
    if(fromAuto) stopAutoWishNow(true);
    return;
  }

  // pay: prefer tickets
  if(hasTickets) S.pulls -= needTickets;
  else S.gems -= needGems;
  // daily quest: count pulls (only when a pull actually happens)
  try{ incDailyProgress('pulls', n); }catch(e){}

  // achievements / meta counters
  const M = ensureMeta();
  M.totalPulls = (M.totalPulls||0) + n;

  // roll
  const drops = [];
  const meta = [];
  
for(let i=0;i<n;i++){
  let stars = rollStarsForBanner();

  // x10 guarantee at least 4★
  if(n===10 && i===n-1 && stars===3){
    stars = 4;
  }

  let unit = null;

  if(stars===6){
    // LIMITED banner: system 50/50 z jednorazową gwarancją po przegranej
    // - jeśli masz gwarant (lost5050 === true): ten 6★ jest wymuszony jako 6★ LIMITED, a gwarant się kasuje
    // - jeśli nie masz gwaranta: los 50/50 -> wygrana = 6★ LIMITED, przegrana = standard 6★ + ustaw gwarant na następny 6★
    if((S.bannerId||"default")==="limited"){
      const p = curPity();
      const hasGuarantee = !!p.lost5050;

      if(hasGuarantee){
        // wymuszony limited
        const pool = featuredURPool();
        unit = pickRandom(pool.length ? pool : (Array.isArray(unitsLimited)?unitsLimited:[]));
        p.lost5050 = false;  // gwarant zużyty
      } else {
        const win5050 = (Math.random() < 0.5);
        if(win5050){
          const pool = featuredURPool();
          unit = pickRandom(pool.length ? pool : (Array.isArray(unitsLimited)?unitsLimited:[]));
          p.lost5050 = false;
        } else {
          unit = pickRandom(nonFeaturedURPool());
          p.lost5050 = true; // przegrana -> następny 6★ będzie gwarantowany limited
        }
      }

      // dodatkowy bezpiecznik
      if(unit && (unit.element==="Limited" || (BANNER.featuredURIds||[]).includes(unit.id))) {
        p.lost5050 = false;
      }

      if(!unit){
        unit = pickRandom(allUnitsByRarity("UR"));
      }
	    } else {
	      // Non-limited banners: enforce strict 6★ pool per banner (Legenda/FNAF/Elo żelo)
	      const bid = (S.bannerId||"default");
	      const strict = (bid === 'legenda' || bid === 'fnaf' || bid === 'elo');
	      const pool = strict ? bannerRestrictedURPool(bid) : featuredURPool();
	      unit = pickRandom(pool);
	      // Safety: if something slipped through, re-pick from strict pool.
	      if(strict && unit && unit.stars>=6){
	        if((bid==='legenda' && unit.element!=='Legenda') || (bid==='fnaf' && unit.element!=='FNAF') || (bid==='elo' && unit.element!=='Elo żelo')){
	          unit = pickRandom(bannerRestrictedURPool(bid));
	        }
	      }
	    }
  } else {
    // 3★/4★/5★
    const rarityKey = (stars===5 ? "SSR" : (stars===4 ? "SR" : "R"));
    unit = pickRandom(allUnitsByRarity(rarityKey));
  }

  if(!unit) unit = pickRandom(allUnitsByRarity("R")) || (ALL_UNITS||[])[0];

  // meta counts for achievements
  if(stars===6){
    M.totalUR = (M.totalUR||0) + 1;
    if((S.bannerId||"default")==="limited"){
      const isLim = !!(unit && (unit.element==="Limited" || (BANNER.featuredURIds||[]).includes(unit.id)));
      if(isLim) M.totalLimitedUR = (M.totalLimitedUR||0) + 1;
    }
  }

  drops.push(unit);
  const preSt = ensureUnitState(unit.id);
  const isNew = ((preSt.ownedCount||0) <= 0);
  meta.push({stars, isNew});
  applyPityForStars(stars);
  grantPulledUnit(unit);
}

  // remember last reveal for banner UI + history
  const revealAt = Date.now();
  const revealDrops = drops.map(u=>({id:u.id, rarity:u.rarity, element:u.element, name:u.name}));
  const revealEntry = {
    at: revealAt,
    bannerId: (S.bannerId||"default"),
    drops: revealDrops,
    label: summarizeWishDrops(revealDrops),
    time: fmtDateTime(revealAt)
  };
  S.lastReveal = revealEntry;

  // push to history (newest first), keep it lightweight
  if(!Array.isArray(S.wishHistory)) S.wishHistory = [];
  S.wishHistory.unshift(revealEntry);
  if(S.wishHistory.length > 30) S.wishHistory = S.wishHistory.slice(0, 30);

  save();
  renderAll();

  // start reveal overlay
  try{
    const token = (++revealToken);
    startWishGridReveal(drops, meta, token);
  }catch(e){
    console.warn("startWishGridReveal failed", e);
  }
}

function wireBanner(){
  // banner selector buttons
  document.querySelectorAll('[data-banner]').forEach(btn=>{
    const id = btn.getAttribute('data-banner');
    if ((S.bannerId||'default') === id) btn.classList.add('primary');
    btn.onclick = ()=>{ setBanner(id); save(); renderAll(); };
  });

  const b1 = document.getElementById('pull1');
  const b10 = document.getElementById('pull10');
  const bAuto = document.getElementById('autoWishBtn');
  const bTurbo = document.getElementById('turboWishBtn');
  if (b1) b1.onclick = ()=>doPulls(1);
  if (b10) b10.onclick = ()=>doPulls(10);
  if (bAuto) bAuto.onclick = ()=>toggleAutoWish();
  if (bTurbo) bTurbo.onclick = ()=>toggleTurboAutoWish();

  // limited banner countdown (single source of truth)
  if((S.bannerId||"default")==="limited" && isBannerActive("limited")){
    try{ updateLimitedTimerOnce(); startLimitedTimer(); }catch(e){}
  }

}

/* === Arena wiring (FIX) === */
function wireArena(){
  const hit = document.getElementById("arenaHitBtn");
  if(hit) hit.onclick = ()=>arenaHit(false);

  const auto = document.getElementById("arenaAutoBtn");
  if(auto) auto.onclick = ()=>setArenaAuto(!S.arena.auto);

  const br = document.getElementById("buyRewardUpg");
  if(br) br.onclick = ()=>{
    const lvl = S.upgrades.rewardLvl||0;
    const cost = UPG.rewardCost(lvl);
    if(S.gold < cost){ toast("Masz za mało Gold."); return; }
    S.gold -= cost;
    S.upgrades.rewardLvl = lvl + 1;
    toast("Ulepszono Reward!");
    save(); renderAll();
  };

  const bc = document.getElementById("buyCpsUpg");
  if(bc) bc.onclick = ()=>{
    const lvl = S.upgrades.cpsLvl||0;
    const cost = UPG.cpsCost(lvl);
    if(S.gold < cost){ toast("Masz za mało Gold."); return; }
    S.gold -= cost;
    S.upgrades.cpsLvl = lvl + 1;
    toast("Ulepszono Auto CPS!");
    save(); renderAll();
  };

  const bd = document.getElementById("buyDmgUpg");
  if(bd) bd.onclick = ()=>{
    const lvl = S.upgrades.dmgLvl||0;
    const cost = UPG.dmgCost(lvl);
    if(S.gold < cost){ toast("Masz za mało Gold."); return; }
    S.gold -= cost;
    S.upgrades.dmgLvl = lvl + 1;
    toast("Ulepszono DMG!");
    save(); renderAll();
  };

  // ensure HUD is correct
  try{ renderArenaHUDOnly(); }catch(e){}

  // Go to PvP tab
  const go = document.getElementById("goPvpTabBtn");
  if(go) go.onclick = ()=>mgNavigate("pvp");
}
function renderAll(){
    renderTopLite();

    const leftTitle = $("#leftTitle");
    const leftBody = $("#leftBody");

    // normalize tab
	    const VALID_TABS = new Set(["banner","collection","arena","pvp","dungeon","domains","endgame","quests","shop","profile","rebirth","leaderboard","settings","notes"]);
    if(!VALID_TABS.has(currentTab)) currentTab = "banner";

    // init banner
    try{ setBanner(S.bannerId || "default"); }catch(e){}

    if(currentTab==="banner"){
      leftTitle.textContent = "Banner";
      leftBody.innerHTML = renderBanner();
      wireBanner();
      startLimitedTimer();
      updateLimitedTimerOnce();
    try{ renderLastRevealToBanner(); }catch(e){}
    } else if(currentTab==="collection"){
      leftTitle.textContent = "Kolekcja & Team";
      leftBody.innerHTML = renderCollection();
      try{ wireCollection(); }catch(e){}
    } else if(currentTab==="arena"){
      leftTitle.textContent = "Arena";
      leftBody.innerHTML = renderArena();
      wireArena();
    } else if(currentTab==="pvp"){
      leftTitle.textContent = "PvP Arena";
      leftBody.innerHTML = renderPvp();
      wirePvp();
    } else if(currentTab==="dungeon"){
      leftTitle.textContent = "Dungeon";
      try{
        leftBody.innerHTML = renderDungeon();
        wireDungeon();
      }catch(e){
        console.error("Dungeon render error:", e);
        leftBody.innerHTML = `<div class="notice bad"><b>Dungeon</b> nie może się wyrenderować przez błąd zapisu/gry.<br><span class="muted small">Kliknij: Ustawienia → Reset save.</span></div>`;
      }
    } else if(currentTab==="quests"){
      leftTitle.textContent = "Daily / BP / Weekly";
      // robust render + wiring (Daily/BP/Weekly)
      try{
        if(typeof renderQuestsHub==="function") leftBody.innerHTML = renderQuestsHub();
        else leftBody.innerHTML = renderQuests();
      }catch(e){
        console.error(e);
        leftBody.innerHTML = `<div class="card"><b>Daily</b><div class="sub">Wystąpił błąd renderowania zakładki Daily.</div></div>`;
      }
      try{
        if(typeof wireQuestsHub==="function") wireQuestsHub();
        else if(typeof wireQuests==="function") wireQuests();
      }catch(e){
        console.error(e);
        toast("Błąd UI Daily/BP/Weekly — odśwież stronę.");
      }
    } else if(currentTab==="shop"){
      leftTitle.textContent = "Sklep";
      leftBody.innerHTML = renderShop();
      wireShop();
    } else if(currentTab==="profile"){
      leftTitle.textContent = "Profil";
      leftBody.innerHTML = renderProfile();
      try{ wireProfile(); }catch(e){}
    } else if(currentTab==="rebirth"){
      leftTitle.textContent = "Rebirth";
      leftBody.innerHTML = renderRebirthTab();
      try{ wireRebirthTab(); }catch(e){}
    } else if(currentTab==="leaderboard"){
      leftTitle.textContent = "Leaderboard";
      leftBody.innerHTML = renderLeaderboard();
      try{ wireLeaderboard(); }catch(e){}
      // brak interakcji — tylko odświeżanie
    } else if(currentTab==="settings"){
      leftTitle.textContent = "Ustawienia";
      leftBody.innerHTML = renderSettings();
      try{ wireSettings(); }catch(e){}
    } else if(currentTab==="notes"){
      leftTitle.textContent = "Patch notes";
      leftBody.innerHTML = renderNotes();
    } else {
      leftTitle.textContent = "—";
      leftBody.innerHTML = `<div class="small muted">Brak widoku dla tej zakładki.</div>`;
    }

    // daily login btn (jeśli istnieje w DOM)
    const btn = document.getElementById("claimLoginBtn");
    if(btn) btn.disabled = !canClaimDailyLogin();

    save();
  }

  // init minimal render
  arenaRecalcHP();
  dailyResetIfNeeded();
  bpEnsureSeason();
  bpWeeklyResetIfNeeded();
  try{ onProfileLevelChanged(); }catch(e){}
  renderAll();

  // ----------------------------
  // Dalej w CZĘŚCI 4/4:
  // Collection & Team, Quests/BP/Weekly, Settings, Notes + final close of IIFE/script/html
  // ----------------------------
  // ----------------------------
  // Collection & Team (FULL DEX + brak duplikatów w teamie)
  // ----------------------------
  function renderCollection(){
    const showAll = !!S.settings.showAllDex;
    const slots = S.teamSlots || 4;

    const slotSelects = Array.from({length: slots}, (_,i)=>`
      <div class="teamSlot" data-slot="${i}">
        <div class="teamSlotHd">
          <span class="tag">Slot ${i+1}</span>
          <span class="muted small" id="tLbl${i}">—</span>
        </div>
        <div class="teamPrev" id="tPrev${i}"></div>
        <select id="t${i}" class="teamSelect"></select>
      </div>
    `).join("");

    return `
      <div class="row" style="justify-content:space-between; align-items:flex-start">
        <div style="min-width:0">
          <b>Team (${slots} slotów) + Synergie</b>
          <div class="small muted">Brak duplikatów w teamie. Więcej slotów kupisz w sklepie (max 8).</div>
        </div>
        <div class="tag">Team power: ${fmt(teamPower())} • ${escapeHtml(synergyText())}</div>
      </div>

      <div class="hr"></div>

      <div class="teamBuilder">
        <div class="teamGrid">${slotSelects}</div>
        <div class="teamActions">
          <button class="btn primary" id="saveTeamBtn">Zapisz team</button>
          <button class="btn" id="clearTeamBtn">Wyczyść</button>
        </div>
      </div>

      <div class="hr"></div>

      <div class="row" style="justify-content:space-between; align-items:flex-start">
        <div>
          <b>Kolekcja (Dex)</b>
          <div class="small muted">Dex ALL pokazuje też postacie nieposiadane.</div>
        </div>
        <div class="row">
          <button class="btn" id="toggleDex">${showAll ? "Dex: ALL" : "Dex: OWNED"}</button>
          <select id="fRarity">
            <option value="ALL">Gwiazdek: wszystkie</option>
            <option value="6">6★</option>
            <option value="5">5★</option>
            <option value="4">4★</option>
            <option value="3">3★</option>
          </select>
          <select id="fElement">
            <option value="ALL">Żywioł: wszystkie</option>
            ${ELEMENTS.map(e=>`<option value="${escapeHtml(e)}">${escapeHtml(e)}</option>`).join("")}
          </select>
          <select id="sortBy">
            <option value="owned">Sort: posiadane</option>
            <option value="power">Sort: moc</option>
            <option value="const">Sort: konstelacje</option>
            <option value="level">Sort: level</option>
            <option value="asc">Sort: asc</option>
            <option value="rarity">Sort: rarity</option>
            <option value="name">Sort: nazwa</option>
          </select>
        </div>
      </div>

      <div class="hr"></div>

      <div id="collectionList" class="list"></div>
    `;
  }

  function buildTeamOptions(selectedId, disabledSet, ownedUnits){
    const base = [`<option value="">(pusto)</option>`];
    for(const u of ownedUnits){
      const st = ensureUnitState(u.id);
      const disabled = disabledSet.has(u.id) && u.id !== selectedId;
      base.push(
        `<option value="${u.id}" ${u.id===selectedId?"selected":""} ${disabled?"disabled":""}>
          ${escapeHtml(u.name)} • ${starLabelText(unitStars(u))} • ${escapeHtml(u.element)} • L${st.level}/A${st.ascTier} • C${st.const}
        </option>`
      );
    }
    return base.join("");
  }

  function wireCollection(){
    const ownedIds = Object.keys(S.seen).filter(id => (S.seen[id]?.ownedCount ?? 0) > 0);
    const ownedUnits = ownedIds.map(getUnitById).filter(Boolean);

    function refreshTeamDropdowns(){
      const picked = new Set(S.team.filter(Boolean));
      const slots = (S.teamSlots||4);
      const ids = Array.from({length:slots}, (_,i)=>"t"+i);
      ids.forEach((sid, i) => {
        const sel = $("#"+sid);
        const current = sel.value || (S.team[i] || "");
        const disabledSet = new Set(picked);
        if(current) disabledSet.delete(current);
        sel.innerHTML = buildTeamOptions(current || "", disabledSet, ownedUnits);

        // preview
        const prev = $("#tPrev"+i);
        const lbl  = $("#tLbl"+i);
        const slotEl = document.querySelector(`.teamSlot[data-slot="${i}"]`);
        if(slotEl) slotEl.classList.toggle("active", !!current);

        if(!current){
          if(prev) prev.innerHTML = `<div class="small muted">Wybierz postać</div>`;
          if(lbl) lbl.textContent = "—";
        }else{
          const u = getUnitById(current);
          const st = ensureUnitState(current);
          const power = u ? unitPower(u) : 0;
          if(prev){
            prev.innerHTML = `
              ${avatarHTML(current)}
              <div class="miniInfo">
                <b>${escapeHtml(u?.name||current)} <span class="tag">${starLabelSpan(unitStars(u), (u?.element==="Limited")||!!u?.limited)}</span></b>
                <span>${escapeHtml(u?.element||"—")} • L${st.level||1}/A${st.ascTier||0} • C${st.const||0} • Moc ${fmt(power)}</span>
              </div>
            `;
          }
          if(lbl) lbl.textContent = `${starLabelText(unitStars(u))} • ${u?.element||""}`;
        }
      });
    }

    Array.from({length:(S.teamSlots||4)}, (_,i)=>"t"+i).forEach((id, i) => {
      const sel = $("#"+id);
      sel.addEventListener("change", () => {
        S.team[i] = sel.value || null;
        // usuń duplikaty (zostaw pierwszy)
        const seen = new Set();
        S.team = S.team.map(x => {
          if(!x) return null;
          if(seen.has(x)) return null;
          seen.add(x); return x;
        });
        refreshTeamDropdowns();
        save();
        renderTopLite();
      });
    });

    $("#saveTeamBtn").onclick = () => {
      const picks = S.team.filter(Boolean);
      if(new Set(picks).size !== picks.length){
        toast("Nie można mieć duplikatów w teamie.");
        return;
      }
      toast(`Zapisano team. Power: ${fmt(teamPower())} (${synergyText()})`);
      save(); renderAll();
    };

    $("#clearTeamBtn").onclick = () => {
      S.team = Array.from({length:(S.teamSlots||4)}, ()=>null);
      toast("Team wyczyszczony.");
      save(); renderAll();
    };

    refreshTeamDropdowns();

    // Dex toggle
    $("#toggleDex").onclick = ()=>{
      S.settings.showAllDex = !S.settings.showAllDex;
      save(); renderAll();
    };

    // Filters
    const fR = $("#fRarity");
    const fE = $("#fElement");
    const sortBy = $("#sortBy");
    const state = { rarity:"ALL", element:"ALL", sort:"owned" };

    function rebuild(){
      const showAll = !!S.settings.showAllDex;
      let list = showAll ? [...ALL_UNITS] : ownedUnits;

      if(state.rarity!=="ALL") list = list.filter(u=>unitStars(u)===Number(state.rarity));
      if(state.element!=="ALL") list = list.filter(u=>u.element===state.element);

      const rarRank = u => unitStars(u);
      const owned = (u)=> (ensureUnitState(u.id).ownedCount||0) > 0;

      list.sort((a,b)=>{
        if(state.sort==="owned") return (owned(b)?1:0) - (owned(a)?1:0) || rarRank(b)-rarRank(a) || unitPower(b)-unitPower(a);
        if(state.sort==="power") return unitPower(b) - unitPower(a);
        if(state.sort==="const") return ensureUnitState(b.id).const - ensureUnitState(a.id).const;
        if(state.sort==="level") return ensureUnitState(b.id).level - ensureUnitState(a.id).level;
        if(state.sort==="asc") return ensureUnitState(b.id).ascTier - ensureUnitState(a.id).ascTier;
        if(state.sort==="rarity") return rarRank(b) - rarRank(a);
        return a.name.localeCompare(b.name);
      });

      const root = $("#collectionList");
      root.innerHTML = "";

      for(const u of list){
        const st = ensureUnitState(u.id);
        const isOwned = st.ownedCount > 0;
        const power = unitPower(u);
        const lb = hasBreakthrough() && ((st.const||0) > 6 || (st.ascTier||0) > 10);

        const mult = (unitRarity(u)==="UR"?4:(unitRarity(u)==="SSR"?3:(unitRarity(u)==="SR"?2:1)));
        const lvlCostGold = 250 * st.level * mult;
        const canLvl = isOwned && S.gold >= lvlCostGold  && st.level < maxLevelForTier(st.ascTier);

        const canAsc = isOwned && st.ascTier < ascMaxTier() && st.level >= maxLevelForTier(st.ascTier);
        const ascCost = ASC.cost(u.rarity, st.ascTier);
        const canPayAsc = isOwned && S.gold>=ascCost.gold  && S.essence>=ascCost.essence && S.cores>=ascCost.cores;

        const el = document.createElement("div");
        el.className = "unit" + (!isOwned ? " locked" : "") + (lb ? " limitBroken" : "");
        el.innerHTML = `
          <div class="left">
            ${avatarHTML(u.id)}
            <div style="min-width:0">
              <div class="title">
                <b>${escapeHtml(u.name)}</b>
                <span class="tag">${rarSpan(u.rarity)}</span>
                <span class="tag">${escapeHtml(u.element)}</span>
                <span class="tag">Klasa: <b>${escapeHtml(u.class||"DPS")}</b></span>
                <span class="tag">Moc: ${power}</span>
                <span class="tag">Asc: ${st.ascTier}</span>
                <span class="tag">C${st.const}/C${constMax()}</span>${lb ? `<span class="lbBadge">LIMIT BROKEN</span>` : ``}
                ${isOwned ? "" : `<span class="tag">🔒 Nie posiadasz</span>`}
              </div>
              <div class="sub">
                Lvl: <b>${st.level}</b> / ${maxLevelForTier(st.ascTier)} • Kopie: <b>${st.ownedCount}</b>
                <br/>
                Talenty: <b>${talentSpent(st)}</b> / ${talentPointsTotalForUnitState(st)} (wolne: <b>${talentPointsFree(st)}</b>)
                <br/>
                Level up: <b>${fmt(lvlCostGold)} Gold</b>
                <br/>
                Ascension: <b>${fmt(ascCost.gold)} Gold</b> + <b>${ascCost.essence} Essence</b> + <b>${ascCost.cores} Cores</b>
              </div>
            </div>
          </div>
          <div class="right">
            <button class="btn primary" data-act="lvl" data-id="${u.id}" ${canLvl?"":"disabled"}>Level up</button>
            <button class="btn gold" data-act="asc" data-id="${u.id}" ${(canAsc && canPayAsc)?"":"disabled"}>Ascend</button>
            <button class="btn" data-act="arts" data-id="${u.id}" ${isOwned?"":"disabled"}>Artefakty</button>
            <button class="btn" data-act="talents" data-id="${u.id}" ${isOwned?"":"disabled"}>Talenty</button>
          </div>
        `;
        root.appendChild(el);
      }

      root.querySelectorAll("button[data-act='lvl']").forEach(btn=>{
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          const u = getUnitById(id);
          const st = ensureUnitState(id);
          if(st.ownedCount<=0) return;

          const mult = (unitRarity(u)==="UR"?4:(unitRarity(u)==="SSR"?3:(unitRarity(u)==="SR"?2:1)));
          const lvlCostGold = 250 * st.level * mult;

          if(st.level >= maxLevelForTier(st.ascTier)){ toast("Najpierw Ascension (cap level)."); return; }
          if(S.gold < lvlCostGold){ toast("Brak golda na level up."); return; }

          S.gold -= lvlCostGold; st.level += 1;
          incDailyProgress("levelUps", 1);
          bpAddXP(12);
          addPlayerXP(10);

          toast(`${u.name} → Lvl ${st.level}!`);
          save(); renderAll();
        });
      });

      root.querySelectorAll("button[data-act='asc']").forEach(btn=>{
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          const u = getUnitById(id);
          const st = ensureUnitState(id);
          if(st.ownedCount<=0) return;

          if(st.ascTier >= ascMaxTier()){ toast("Max ascension."); return; }
          if(st.level < maxLevelForTier(st.ascTier)){ toast("Ascension wymaga max level."); return; }

          const c = ASC.cost(u.rarity, st.ascTier);
          if(S.gold<c.gold || S.essence<c.essence || S.cores<c.cores){
            toast("Brak zasobów na Ascension."); return;
          }

          S.gold -= c.gold; S.essence -= c.essence; S.cores -= c.cores;
          st.ascTier += 1;

          bpAddXP(40);
          addPlayerXP(25);
          toast(`${u.name} → Asc ${st.ascTier}! Nowy cap: ${maxLevelForTier(st.ascTier)}`);
          try{ sfx("ascend"); }catch(e){}
          try{ playGlobalFX("ascend", { color: "#ffd36a", label: "ASCENSION" }); }catch(e){}
          save(); renderAll();
        });
      });

      // Talents (simple skill tree)
      root.querySelectorAll("button[data-act='talents']").forEach(btn=>{
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          try{ if(typeof openTalentModal === "function") openTalentModal(id); }catch(e){ toast("Nie udało się otworzyć talentów."); }
        });
      });
      // Artefakty (per unit)
      root.querySelectorAll("button[data-act='arts']").forEach(btn=>{
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          const st = ensureUnitState(id);
          if(!id || (st.ownedCount||0)<=0){ toast("Nie posiadasz tej postaci."); return; }
          try{
            if(typeof openUnitArtifactsModal === "function") openUnitArtifactsModal(id);
          }catch(e){
            toast("Nie udało się otworzyć panelu artefaktów.");
          }
        });
      });
    }

    fR.onchange = () => { state.rarity = fR.value; rebuild(); };
    fE.onchange = () => { state.element = fE.value; rebuild(); };
    sortBy.onchange = () => { state.sort = sortBy.value; rebuild(); };

    rebuild();
  }

  // ----------------------------
  // Quests / BP / Weekly
  // ----------------------------
  function renderDailyBlock(){
    dailyResetIfNeeded();
    const p = S.daily.progress, c = S.daily.claimed;
    const q1Done = p.pulls >= 1, q2Done = p.pulls >= 5, q3Done = p.levelUps >= 2;

    const card = (title, progNow, progMax, done, claimed, key, rewardLine) => {
      const status = claimed ? "Odebrane" : (done ? "Gotowe" : "W toku");
      const can = done && !claimed;
      const pct = Math.max(0, Math.min(1, progMax ? (progNow/progMax) : (done?1:0)));
      return `
        <div class="questCard">
          <div class="qTop">
            <div class="qTitle">
              <b>${escapeHtml(title)}</b>
              <span>${escapeHtml(status)} • ${progNow}/${progMax}</span>
            </div>
            <span class="tag">${escapeHtml(rewardLine)}</span>
          </div>
          <div class="qBar"><div class="qFill" style="width:${Math.round(pct*100)}%"></div></div>
          <div class="row" style="justify-content:flex-end">
            <button class="btn primary" data-claim="${key}" ${can?"":"disabled"}>${claimed?"Odebrane":"Odbierz"}</button>
          </div>
        </div>
      `;
    };

    return `
      <div class="card" style="border-radius:16px;">
        <div class="hd">
          <h2>Daily</h2>
          <div class="row" style="gap:8px; flex-wrap:wrap">
            <span class="tag">Reset za <b id="dailyReset" class="timerMono">--:--:--</b></span>
            <span class="tag muted">+BP XP za aktywność</span>
          </div>
        </div>
        <div class="bd">
          <div class="questGrid">
            ${card("Zrób 1 pull", p.pulls, 1, q1Done, c.p1, "p1", "+800 Gold • +100 Gems • +20 BP XP")}
            ${card("Zrób 5 pulli", p.pulls, 5, q2Done, c.p5, "p5", "+2400 Gold • +80 Gems • +40 BP XP")}
            ${card("Zrób 2 level up", p.levelUps, 2, q3Done, c.lvl2, "lvl2", "+1 Ticket • +50 BP XP")}
          </div>
        </div>
      </div>
    `;
  }

  function renderBPBlock(){
    bpEnsureSeason();
    bpWeeklyResetIfNeeded();
    const start = S.bp.seasonStart || todayKey();
    const lvl = S.bp.level, xp = S.bp.xp, premium = S.bp.premium;

    S.ui ||= {};
    const showAll = !!S.ui.bpShowAll;
    let rows = "";
    const from = showAll ? 1 : Math.max(1, lvl-2);
    const to   = showAll ? BP.maxLevel : Math.min(BP.maxLevel, lvl+6);
    for(let L=from; L<=to; L++){
      const rew = BP.rewardForLevel(L);
      const cf = !!S.bp.claimedFree[L], cp = !!S.bp.claimedPremium[L];
      rows += `
        <div class="unit">
          <div class="left">
            <div style="min-width:0">
              <div class="title">
                <b>Poziom ${L}</b>
                <span class="tag">Free: ${rew.free.type} x${rew.free.amount}</span>
                <span class="tag">Premium: ${rew.premium.type} x${rew.premium.amount}</span>
              </div>
              <div class="sub small muted">${L<=lvl ? "Możesz odebrać" : "Zablokowane (level za niski)"}</div>
            </div>
          </div>
          <div class="right">
            <button class="btn primary" data-bpclaim="free" data-lvl="${L}" ${(L<=lvl && !cf)?"":"disabled"}>${cf?"Odebrane":"Odbierz Free"}</button>
            <button class="btn gold" data-bpclaim="prem" data-lvl="${L}" ${(premium && L<=lvl && !cp)?"":"disabled"}>${premium ? (cp?"Odebrane":"Odbierz Premium") : "Premium OFF"}</button>
          </div>
        </div>
      `;
    }

    return `
      <div class="card" style="border-radius:16px;">
        <div class="hd">
          <h2>Battle Pass (start: ${escapeHtml(start)})</h2>
          <div class="row"><span class="tag">Lvl ${lvl}/${BP.maxLevel}</span><span class="tag">XP ${xp}/${BP.xpPerLevel}</span></div>
        </div>
        <div class="bd">
          <div class="row" style="justify-content:space-between">
            <div class="small muted">XP wpada z pulli, levelowania, daily, weekly i areny.</div>
            <button class="btn" id="togglePremium">${premium ? "Premium: ON" : "Premium: OFF"}</button>
            <button class="btn primary" id="bpClaimAllFree">Odbierz wszystkie (Free)</button>
            <button class="btn gold" id="bpClaimAllPrem">Odbierz wszystkie (Premium)</button>
          </div>
          <div class="hr"></div>
          <div class="unit">
            <div class="left">
              <div style="min-width:0">
                <div class="title"><b>Tygodniowe cele (reset co tydzień)</b></div>
                <div class="sub">• Odbierz 1 daily nagrodę → +120 BP XP<br/>• Pokonaj weekly bossa → +150 BP XP</div>
              </div>
            </div>
            <div class="right">
              <button class="btn primary" id="bpW1" ${S.bp.weeklyClaimed.w1?"disabled":""}>Odbierz W1</button>
              <button class="btn gold" id="bpWB" ${S.bp.weeklyClaimed.wBoss?"disabled":""}>Odbierz WB</button>
            </div>
          </div>
          <div class="hr"></div>
          <div class="row" style="justify-content:space-between; align-items:center; margin:8px 0 6px;">
  <span class="muted small">Lista leveli</span>
  <button class="btn" id="bpToggleList">${S.ui && S.ui.bpShowAll ? "Pokaż tylko okolice" : "Pokaż wszystkie levele"}</button>
</div>
<div class="list hideScroll bpList">${rows}</div>
        </div>
      </div>
    `;
  }

  function renderWeeklyBlock(){
    const wk = isoWeekKey();
    const done = S.weekly.lastClaimWeek === wk;
    const weekNo = parseInt(wk.slice(wk.indexOf("W")+1), 10) || 1;
    const bossPow = WEEKLY.basePower + WEEKLY.powerPerWeek * Math.max(0, weekNo-1);
    const tp = teamPower();
    const win = tp >= bossPow;

    const rw = weeklyRewardsScaled();

    return `
      <div class="card" id="weeklyBlock" style="border-radius:16px;">
        <div class="hd">
          <h2>Event tygodniowy: ${escapeHtml(WEEKLY.bossName)}</h2>
          <div class="row"><span class="tag">${wk}</span><span class="tag">Boss power: ${bossPow}</span></div><div class="row" style="gap:8px; flex-wrap:wrap; margin-top:6px"><span class="tag">Reset za <b id="weeklyReset">--:--:--</b></span></div>
        </div>
        <div class="bd">
          <div class="unit">
            <div class="left">
              <div style="min-width:0">
                <div class="title">
                  <b>Walka (1x na tydzień)</b>
                  <span class="tag">Twój team: ${fmt(tp)}</span>
                  <span class="tag">${escapeHtml(synergyText())}</span>
                  <span class="tag">Reward x${rewardMult().toFixed(2)}</span>
                </div>
                <div class="sub">
                  Nagrody: +${rw.gold} Gold, +${rw.gems} Gems, +${rw.essence} Essence, +${rw.cores} Cores, +${rw.bpXP} BP XP.
                  <br/>Status: <b>${done ? "Zrobione w tym tygodniu" : (win ? "Masz szansę wygrać" : "Za słaby team")}</b>
                </div>
              </div>
            </div>
            <div class="right">
              <button class="btn primary" id="fightWeekly" ${done?"disabled":""}>⚔️ Atakuj</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderQuestsHub(){
    dailyResetIfNeeded();
    bpEnsureSeason();
    bpWeeklyResetIfNeeded();
    return `<div class="list">${renderDailyBlock()}${renderBPBlock()}${renderWeeklyBlock()}</div>`;
  }

  function wireQuestsHub(){
    $all("button[data-claim]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const k = btn.getAttribute("data-claim");
        dailyResetIfNeeded();
        const p = S.daily.progress, c = S.daily.claimed;

        const claim = ()=>{ c[k]=true; save(); renderAll(); };

        if(k==="p1"){ if(p.pulls<1 || c.p1) return; addGold(800); addGems(40); bpAddXP(20); toast("Daily: +800 Gold, +100 Gems, +20 BP XP"); claim(); }
        if(k==="p5"){ if(p.pulls<5 || c.p5) return; addGold(2400); addGems(80); bpAddXP(40); toast("Daily: +2400 Gold, +80 Gems, +40 BP XP"); claim(); }
        if(k==="lvl2"){ if(p.levelUps<2 || c.lvl2) return; addPullTickets(1); bpAddXP(50); toast("Daily: +1 Pull, +50 BP XP"); claim(); }
      });
    });

    // Premium Battle Pass purchase (one-time) — costs gems.
    $("#togglePremium").onclick = ()=>{
      const COST = 5000;
      if(S.bp.premium){
        toast("Battle Pass Premium jest już aktywny.");
        return;
      }
      if(!confirm(`Kupić Battle Pass Premium za ${COST} gemów?`)) return;
      if((S.gems||0) < COST){
        toast(`Brak gemów. Potrzebujesz ${COST}.`);
        return;
      }
      S.gems -= COST;
      S.bp.premium = true;
      toast("Battle Pass Premium: AKTYWNY ");
      save(); renderAll();
    };

    const claimAll = (mode)=>{
      let got=0;
      for(let L=1; L<=S.bp.level; L++){
        const rew = BP.rewardForLevel(L);
        if(mode==="free"){
          if(S.bp.claimedFree[L]) continue;
          giveReward(rew.free);
          S.bp.claimedFree[L]=true;
          got++;
        } else {
          if(!S.bp.premium) { toast("Premium OFF."); return; }
          if(S.bp.claimedPremium[L]) continue;
          giveReward(rew.premium);
          S.bp.claimedPremium[L]=true;
          got++;
        }
      }
      toast(got?`Odebrano ${got} nagród (${mode==="free"?"Free":"Premium"}).`:`Brak nagród do odebrania.`);
      save(); renderAll();
    };

    $("#bpClaimAllFree")?.addEventListener("click", ()=>claimAll("free"));
    $("#bpClaimAllPrem")?.addEventListener("click", ()=>claimAll("prem"));

    const bpTL = $("#bpToggleList");
    if(bpTL){
      bpTL.onclick = ()=>{
        S.ui ||= {};
        S.ui.bpShowAll = !S.ui.bpShowAll;
        save(); renderAll();
        // po rozwinięciu listy przewiń na górę
        setTimeout(()=>{ const el = document.querySelector(".bpList"); if(el) el.scrollTop = 0; }, 0);
      };
    }

    $all("button[data-bpclaim]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const type = btn.getAttribute("data-bpclaim");
        const L = parseInt(btn.getAttribute("data-lvl"),10);
        if(!(L>0)) return;
        if(L > S.bp.level){ toast("Za niski BP level."); return; }
        const rew = BP.rewardForLevel(L);

        if(type==="free"){
          if(S.bp.claimedFree[L]) return;
          giveReward(rew.free);
          S.bp.claimedFree[L]=true;
          toast(`Odebrano Free reward (lvl ${L}).`);
        } else {
          if(!S.bp.premium){ toast("Premium OFF."); return; }
          if(S.bp.claimedPremium[L]) return;
          giveReward(rew.premium);
          S.bp.claimedPremium[L]=true;
          toast(`Odebrano Premium reward (lvl ${L}).`);
        }
        save(); renderAll();
      });
    });

    $("#bpW1").onclick = ()=>{
      bpWeeklyResetIfNeeded();
      const c = S.daily.claimed;
      if(!(c.p1||c.p5||c.lvl2)){ toast("Odbierz 1 daily nagrodę dzisiaj."); return; }
      if(S.bp.weeklyClaimed.w1) return;
      S.bp.weeklyClaimed.w1=true;
      bpAddXP(120);
      toast("BP weekly: +120 XP");
      save(); renderAll();
    };

    $("#bpWB").onclick = ()=>{
      bpWeeklyResetIfNeeded();
      if(S.bp.weeklyClaimed.wBoss) return;
      if(S.weekly.lastClaimWeek !== isoWeekKey()){ toast("Pokonaj weekly bossa najpierw."); return; }
      S.bp.weeklyClaimed.wBoss=true;
      bpAddXP(150);
      toast("BP weekly: +150 XP");
      save(); renderAll();
    };

    $("#fightWeekly").onclick = ()=>{
      const wk = isoWeekKey();
      if(S.weekly.lastClaimWeek === wk){ toast("Weekly już zrobiony."); return; }

      const weekNo = parseInt(wk.slice(wk.indexOf("W")+1), 10) || 1;
      const bossPow = WEEKLY.basePower + WEEKLY.powerPerWeek * Math.max(0, weekNo-1);
      const tp = teamPower();
      if(tp<=0){ toast("Ustaw team."); return; }
      if(tp<bossPow){ toast(`Przegrana. Team ${tp} < boss ${bossPow}.`); return; }

      S.weekly.lastClaimWeek = wk;

      const rw = weeklyRewardsScaled();
      try{ const ab = artifactBonuses(); addGold(Math.floor(rw.gold*(ab.goldMult||1))); }catch(e){ addGold(rw.gold); } addGems(rw.gems); addEssence(rw.essence); addCores(rw.cores); bpAddXP(rw.bpXP);
      addPlayerXP(80);

      toast(`Wygrana! +${rw.gems} Gems, +${rw.gold} Gold (reward x${rewardMult().toFixed(2)})`);
      save(); renderAll();
    };
  }

  // ----------------------------
  //  Profil (edytowalny avatar + statystyki + wyloguj)
  // ----------------------------

  // ----------------------------

  //  Domains + Artefakty postaci (4 szt. na każdą postać)
  // - Domeny dają artefakty z konkretnych setów (2 sety na domenę)
  // - Każdy set jest przypisany do JEDNEGO żywiołu
  // - Na postać można założyć 4 artefakty (A1-A4)
  // - Bonus setu: 2 szt. i 4 szt. (działa tylko dla postaci o tym samym żywiole)
  function ensureArtifactState(){
    // --- Storage split ---
    // profileArtifacts: stare "artefakty profilu" (meta) – obiekty z count itp.
    // domainArtifacts:  artefakty z Domen (ekwipunek) – tablica, zakładane na postacie
    // Migracja: jeśli ktoś ma jeszcze S.artifacts jako tablicę (stara wersja domen), przenieś do domainArtifacts.
    try{
      if(Array.isArray(S.artifacts) && !Array.isArray(S.domainArtifacts)){
        S.domainArtifacts = S.artifacts;
        // zachowaj profileArtifacts jeśli było w innym polu; w przeciwnym razie wyczyść S.artifacts do obiektu
        if(!S.profileArtifacts) S.profileArtifacts = {};
        S.artifacts = S.profileArtifacts;
      }
      if(!Array.isArray(S.artifacts) && S.artifacts && typeof S.artifacts === 'object' && !S.profileArtifacts){
        S.profileArtifacts = S.artifacts;
      }
    }catch(e){}

    S.domainArtifacts ||= [];     // wspólny ekwipunek artefaktów domen
    S.unitGear ||= {};            // { [unitId]: {a1, a2, a3, a4} }
    S.domains ||= {};             // progres domen (timery)

    // migracje / sanity dla starych zapisów
    try{
      for(const a of (S.domainArtifacts||[])){
        if(!a) continue;
        if(!a.type) a.type = "unit"; // tylko artefakty postaci
        if(a.level == null) a.level = 1;
        if(!a.slot) a.slot = "a1";
        if(!a.rarity) a.rarity = "R";
        if(!a.setId) a.setId = "set_fire_blaze";
        if(a.value == null) a.value = 10; // flat power
        if(!a.id) a.id = "a_"+Math.random().toString(36).slice(2,9);
        // usuń stare profile-sloty jeśli ktoś ma bardzo stary save
        if(!["a1","a2","a3","a4"].includes(a.slot)) a.slot = "a1";
      }
    }catch(e){}
  }

  const ART_SLOTS = ["a1","a2","a3","a4"];
  const SLOT_NAME = {a1:"Artefakt I", a2:"Artefakt II", a3:"Artefakt III", a4:"Artefakt IV"};
  const ART_MAX_LVL = {R:10, SR:20, SSR:30, UR:50};

  // Sety domen (każdy set → 1 żywioł)
  // Bonusy są w % do mocy (działa tylko, jeśli żywioł postaci == żywioł setu)
  const ART_SETS = [
    { id:"set_fire_blaze",   icon:"🔥", name:"Płomień",      element:"Ogień",          bonus2:{pct:0.06}, bonus4:{pct:0.14} },
    { id:"set_water_tide",   icon:"💧", name:"Przypływ",     element:"Woda",           bonus2:{pct:0.06}, bonus4:{pct:0.14} },

    { id:"set_wind_gale",    icon:"🌪️", name:"Wichura",      element:"Wiatr",          bonus2:{pct:0.06}, bonus4:{pct:0.14} },
    { id:"set_earth_root",   icon:"🪨", name:"Korzeń",       element:"Ziemia",         bonus2:{pct:0.06}, bonus4:{pct:0.14} },

    { id:"set_elec_arc",     icon:"⚡", name:"Łuk",          element:"Elektryczność",  bonus2:{pct:0.07}, bonus4:{pct:0.16} },
    { id:"set_ice_frost",    icon:"❄️", name:"Szron",        element:"Lód",            bonus2:{pct:0.07}, bonus4:{pct:0.16} },

    { id:"set_legend_myth",  icon:"🌟", name:"Mit",          element:"Legenda",        bonus2:{pct:0.08}, bonus4:{pct:0.18} },
    { id:"set_limited_prism",icon:"🔮", name:"Pryzmat",      element:"Limited",        bonus2:{pct:0.08}, bonus4:{pct:0.18} },
    { id:"set_elo_rank",    icon:"🏆", name:"Ranga",        element:"Elo żelo",       bonus2:{pct:0.08}, bonus4:{pct:0.18} },
    { id:"set_fnaf_horror",  icon:"🕯️", name:"Horror",      element:"FNAF",          bonus2:{pct:0.08}, bonus4:{pct:0.18} },
  ];
  const ART_SET_BY_ID = Object.fromEntries(ART_SETS.map(s=>[s.id,s]));
  function setIcon(id){ return (ART_SET_BY_ID[id]?.icon)||"🧩"; }
  function setName(id){ return (ART_SET_BY_ID[id]?.name)||"—"; }
  function setElement(id){ return (ART_SET_BY_ID[id]?.element)||"—"; }

  // Domeny: 2 sety / domenę i ZAWSZE 2 różne żywioły (bez duplikatów)
  const DOMAINS = [
    {
      id:"easy",
      name:"Domena Początku",
      req: 1,
      sets:["set_fire_blaze","set_water_tide"],
      levels:[
        {lvl:1, time:0,  stars:4, reqPower:800},
        {lvl:2, time:0,  stars:4, reqPower:2000},
        {lvl:3, time:0,  stars:5, reqPower:4500},
        {lvl:4, time:0,  stars:6, reqPower:8000},
      ],
    },
    {
      id:"mid",
      name:"Domena Żywiołów",
      req: 1,
      sets:["set_wind_gale","set_earth_root"],
      levels:[
        {lvl:1, time:0,  stars:4, reqPower:800},
        {lvl:2, time:0,  stars:4, reqPower:2000},
        {lvl:3, time:0,  stars:5, reqPower:4500},
        {lvl:4, time:0,  stars:6, reqPower:8000},
      ],
    },
    {
      id:"hard",
      name:"Domena Burzy",
      req: 1,
      sets:["set_elec_arc","set_ice_frost"],
      levels:[
        {lvl:1, time:0,  stars:4, reqPower:800},
        {lvl:2, time:0,  stars:4, reqPower:2000},
        {lvl:3, time:0,  stars:5, reqPower:4500},
        {lvl:4, time:0,  stars:6, reqPower:8000},
      ],
    },
    {
      id:"extreme",
      name:"Domena Legend",
      req: 1,
      sets:["set_legend_myth","set_limited_prism"],
      levels:[
        {lvl:1, time:0,  stars:4, reqPower:800},
        {lvl:2, time:0,  stars:4, reqPower:2000},
        {lvl:3, time:0,  stars:5, reqPower:4500},
        {lvl:4, time:0,  stars:6, reqPower:8000},
      ],
    },
    {
      id:"meme",
      name:"Domena Memów",
      req: 1,
      sets:["set_elo_rank","set_fnaf_horror"],
      levels:[
        {lvl:1, time:0,  stars:4,  reqPower:800},
        {lvl:2, time:0,  stars:4,  reqPower:2000},
        {lvl:3, time:0,  stars:5, reqPower:4500},
        {lvl:4, time:0,  stars:6, reqPower:8000},
      ],
    }
 ];

  // sanity: upewnij się, że w żadnej domenie nie ma dwóch setów na ten sam żywioł
  (function validateDomains(){
    try{
      for(const d of DOMAINS){
        const els = (d.sets||[]).map(setElement).filter(Boolean);
        if(new Set(els).size !== els.length){
          console.warn("[DOMAINS] Duplicate set elements in domain:", d.id, els);
        }
      }
    }catch(e){}
  })();
  // Ujednolicone wymagania mocy dla P1–P4 we wszystkich domenach
  const DOMAIN_REQ_POWER_BY_LVL = {1:800, 2:2000, 3:4500, 4:8000};
  (function normalizeDomainReqPower(){
    try{
      for(const d of DOMAINS){
        for(const lv of (d.levels||[])){
          const rp = DOMAIN_REQ_POWER_BY_LVL[Number(lv.lvl)||1];
          if(rp) lv.reqPower = rp;
          // Domeny są walką – time nieużywane
          lv.time = 0;
        }
      }
    }catch(e){}
  })();


  
  function getDomainLevelDef(d, lvl){
    const L = (d.levels||[]).find(x=>x.lvl===lvl) || (d.levels||[])[0];
    return L || {lvl:1, time:d.time||60, rarity:d.rarity||"SR", reqPower:0};
  }


  // Odblokowanie poziomów domen zależnie od poziomu gracza
  // P1: od początku, P2: lvl 10, P3: lvl 20, P4: lvl 40
  function domainTierUnlockLevel(lvl){
    if(lvl<=1) return 1;
    if(lvl===2) return 10;
    if(lvl===3) return 20;
    return 40;
  }

  // Szansa powodzenia dla poziomów domeny (lvl 1 = zawsze sukces)
  function domainSuccessChance(reqPower, lvl){
    if(!reqPower || lvl<=1) return 1;
    const tp = teamPower();
    const ratio = tp / Math.max(1, reqPower);
    // logistycznie, żeby czuć progres (ratio=1 ~ 52%)
    const x = 1 / (1 + Math.exp(-6*(ratio - 1)));
    const ch = 0.10 + x * 0.85; // 10%..95%
    return clamp(ch, 0.10, 0.95);
  }
function artRandInt(a,b){ return Math.floor(a + Math.random()*(b-a+1)); }
  function artPick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

  function artifactPowerScale(level){
    level = Math.max(1, level|0);
    return 1 + (level-1) * 0.10; // +10%/lvl (czytelne, ale nie OP)
  }

  // Zakresy flat power na artefakt (Lvl 1)
  const ART_RANGE = {
    R:   [8, 12],
    SR:  [18, 26],
    SSR: [35, 50],
    UR:  [70, 90],
  };

  
function genArtifact(starsOrRarity, setPoolIds){
  const slot = artPick(ART_SLOTS);
  const pool = Array.isArray(setPoolIds) && setPoolIds.length ? setPoolIds : ART_SETS.map(s=>s.id);

  const stars = (typeof starsOrRarity === "number") ? starsOrRarity : rarityToStars(starsOrRarity);
  const rarity = starsToRarity(stars); // legacy key for ART_RANGE

  const setId = artPick(pool);
  const r = ART_RANGE[rarity] || ART_RANGE.R;
  const value = artRandInt(r[0], r[1]); // flat power
  return {
    id: "a_" + Math.random().toString(36).slice(2, 10),
    type: "unit",
    stars,
    rarity,   // kept for backwards compatibility (sorting, ranges)
    slot,
    setId,
    value,
    level: 1,
    created: Date.now(),
  };
}

  function getArtifactById(id){
    ensureArtifactState();
    return (S.domainArtifacts||[]).find(a=>a && a.id===id) || null;
  }

  function ensureUnitGear(unitId){
    ensureArtifactState();
    if(!S.unitGear[unitId]) S.unitGear[unitId] = {a1:null,a2:null,a3:null,a4:null};
    return S.unitGear[unitId];
  }

  function equippedUnitArtifacts(unitId){
    const g = ensureUnitGear(unitId);
    return ART_SLOTS.map(s=> g[s] ? getArtifactById(g[s]) : null).filter(Boolean);
  }

  function unitArtifactBonuses(unitId){
    const u = getUnitById(unitId);
    if(!u) return {flat:0, pct:0, setCounts:{}};
    const arts = equippedUnitArtifacts(unitId);

    let flat = 0;
    const setCounts = {};
    for(const a of arts){
      const sid = a.setId;
      setCounts[sid] = (setCounts[sid]||0)+1;

      // flat działa tylko jeśli żywioł postaci pasuje do setu
      if(setElement(sid) === u.element){
        flat += Math.floor((a.value||0) * artifactPowerScale(a.level||1));
      }
    }

    // set bonusy: 2 / 4
    let pct = 0;
    for(const [sid,c] of Object.entries(setCounts)){
      const s = ART_SET_BY_ID[sid];
      if(!s) continue;
      if(s.element !== u.element) continue; // bonus tylko dla właściwego żywiołu
      if(c>=4) pct += (s.bonus4?.pct||0);
      else if(c>=2) pct += (s.bonus2?.pct||0);
    }

    return {flat, pct, setCounts};
  }

  // (compat) — zostawiamy, bo używały tego inne miejsca w grze.
  // W tej wersji artefakty domen nie wpływają na gold/tickets.
  function artifactBonuses(){
    return { goldPS:0, goldClick:0, goldMult:1, ticketChance:0, goldMultPct:0, ticketPts:0, setCounts:{} };
  }

  function artifactUpgradeCost(a){
    const r = a.rarity;
    const mult = (r==="UR"?14:(r==="SSR"?8:(r==="SR"?4:2)));
    const gold = Math.floor(1800 * (a.level||1) * mult);
    const essence = Math.floor((r==="UR"?2:(r==="SSR"?1:0)) * Math.max(0, Math.floor((a.level||1)/3)));
    return {gold, essence};
  }

  function upgradeArtifact(id){
    const a = getArtifactById(id);
    if(!a) return;
    const maxL = ART_MAX_LVL[a.rarity] || 10;
    if((a.level||1) >= maxL){ toast(`Max level dla ${a.rarity}: ${maxL}`); return; }
    const c = artifactUpgradeCost(a);
    if(S.gold < c.gold){ toast("Brak golda na ulepszenie."); return; }
    if((S.essence||0) < c.essence){ toast("Brak Essence na ulepszenie."); return; }
    S.gold -= c.gold;
    if(c.essence) S.essence -= c.essence;
    a.level = (a.level||1) + 1;
    toast(`Artefakt +1 lvl (Lvl ${a.level})`);
    save(); renderAll();
  }

  function artifactSellGain(a){
    const base = (a.rarity==="UR"?12000:(a.rarity==="SSR"?6000:(a.rarity==="SR"?2200:800)));
    return Math.floor(base * (1 + (Math.max(1,a.level)-1)*0.14));
  }

  function sellArtifact(id){
    ensureArtifactState();
    const a = getArtifactById(id);
    if(!a) return;

    // zdejmij z postaci jeśli gdzieś założony
    for(const uid of Object.keys(S.unitGear||{})){
      const g = S.unitGear[uid];
      for(const sl of ART_SLOTS){
        if(g?.[sl] === id) g[sl] = null;
      }
    }

    const gain = artifactSellGain(a);
    S.gold += gain;
    S.domainArtifacts = (S.domainArtifacts||[]).filter(x=>x && x.id!==id);
    toast(`Sprzedano artefakt: +${fmt(gain)} Gold`);
    save(); renderAll();
  }

  function domainActive(id){ return !!S.domains?.[id]?.active; }

  function startDomain(id, lvl){
    ensureArtifactState();
    const d = DOMAINS.find(x=>x.id===id);
    if(!d) return;
    const level = Math.max(1, Math.min(4, Number(lvl||1)));
    const def = getDomainLevelDef(d, level);

    const plvl = ensurePlayer().level||1;
    const needLvl = domainTierUnlockLevel(level);
    if(plvl < needLvl){ toast(`Poziom P${level} zablokowany (wymaga lvl ${needLvl}).`); return; }
    if(domainActive(id)){ toast("Ta domena już trwa."); return; }

    if(!S.domains) S.domains = {};
    // max 1 domena na raz
    if(anyDomainActive() && !(S.domains[id] && S.domains[id].active)){
      toast("Możesz robić tylko 1 domenę na raz.");
      return;
    }

    // Walka domeny (nie czas): team bije bossa domeny zależnie od mocy
    const reqPower = Number(def.reqPower||0);
    const maxHp = Math.max(1, Math.floor(reqPower * 1000)); // ok. ~20s przy mocy ~req (w zależności od skalowania DPS)
    S.domains[id] = {
      active: true,
      lvl: level,
      reqPower,
      hp: maxHp,
      maxHp,
      lastTick: Date.now(),
      startedAt: Date.now()
    };
    toast(`Start: ${d.name} • Poziom ${level} (req ${fmt(reqPower)})`);
    save(); renderAll();
  }

  function finishDomain(id){
    ensureArtifactState();
    const d = DOMAINS.find(x=>x.id===id);
    if(!d) return;
    if(!domainActive(id)) return;

    const st = S.domains[id] || {};
    const lvl = Math.max(1, Math.min(4, Number(st.lvl||1)));
    const def = getDomainLevelDef(d, lvl);

    // usuń stan walki
    delete S.domains[id];

    const art = genArtifact(def.stars || def.rarity || 4, d.sets);
    art.domainId = d.id;
    art.domainLvl = lvl;
    S.domainArtifacts.push(art);

    toast(`Wygrana! Zdobyto artefakt ${starLabelText(art.stars||rarityToStars(art.rarity))}: ${SLOT_NAME[art.slot]} • ${setIcon(art.setId)} ${setName(art.setId)} (${setElement(art.setId)})`);
    try{ sfx("win"); }catch(e){}
    try{
      const c = (art.rarity==="UR") ? "#ff3b3b" : (art.rarity==="SSR" ? "#ffd36a" : (art.rarity==="SR" ? "#c7a3ff" : "#3bb2ff"));
      playGlobalFX("artifact", { color: c, label: "ARTIFACT" });
    }catch(e){}
    save(); renderAll();
  }


  // UI helpers
  function anyDomainActive(){
    if(!S.domains) return false;
    return DOMAINS.some(d => S.domains[d.id] && S.domains[d.id].active);
  }

  function updateDomainsUI(){
    if(!S.domains) return;
    const now = Date.now();

    for(const d of DOMAINS){
      const st = S.domains[d.id];
      if(!st || !st.active) continue;

      // tick walki
      const last = Number(st.lastTick||now);
      const dt = Math.max(0, (now - last) / 1000);
      if(dt > 0){
        const lvl = Math.max(1, Math.min(4, Number(st.lvl||1)));
        const def = getDomainLevelDef(d, lvl);
        const reqPower = Number(def.reqPower||st.reqPower||0);

        const tp = teamPower();
        // DPS rośnie z mocą teamu, ale jak jest za mało to nie ma postępu
        let dps = 0;
        const ratio = reqPower>0 ? (tp/reqPower) : 999;
        if(ratio >= 0.35){
          dps = tp * 50 * clamp(ratio, 0.35, 2.5);
        }else{
          dps = 0;
        }

        if(dps > 0){
          st.hp = Math.max(0, Number(st.hp||st.maxHp) - dps*dt);
          st.stalled = false;
        }else{
          st.stalled = true;
        }
        st.lastTick = now;
      }

      // win?
      if(Number(st.hp||0) <= 0){
        finishDomain(d.id);
        continue;
      }

      // UI
      const leftEl = document.querySelector(`[data-domain-left="${d.id}"]`);
      const hpPct = clamp((Number(st.hp||0)/Number(st.maxHp||1)), 0, 1);
      const prog = clamp(1 - hpPct, 0, 1);
      const hpNow = Math.max(0, Math.floor(Number(st.hp||0)));
      const hpMax = Math.max(1, Math.floor(Number(st.maxHp||1)));
      if(leftEl){
        leftEl.textContent = st.stalled ? `HP wroga: ${fmt(hpNow)} / ${fmt(hpMax)} • Brak postępu (${Math.round(prog*100)}%)` : `HP wroga: ${fmt(hpNow)} / ${fmt(hpMax)} • ${Math.round(prog*100)}%`;
      }

      const barEl = document.querySelector(`[data-domain-bar="${d.id}"]`);
      if(barEl){
        // pasek HP wroga (spada do 0%)
        barEl.style.width = `${Math.floor(hpPct*100)}%`;
      }
    }
  }

  function ensureDomainHeartbeat(){
    if(window.__domainHeartbeat) return;
    window.__domainHeartbeat = setInterval(() => {
      try{ updateDomainsUI(); }catch(e){}
    }, 250);
  }

  function artifactLine(a){
    const s = ART_SET_BY_ID[a.setId];
    const el = s?.element || "—";
    const flat = Math.floor((a.value||0) * artifactPowerScale(a.level||1));
    return `${SLOT_NAME[a.slot]} • [${a.rarity}] • Lvl ${a.level} • ${setIcon(a.setId)} ${escapeHtml(setName(a.setId))} (${escapeHtml(el)}) • +${fmt(flat)} Power`;
  }

  function renderDomainSetLegend(){
    return DOMAINS.map(d=>{
      const sets = (d.sets||[]).map(sid=>ART_SET_BY_ID[sid]).filter(Boolean);
      const rows = sets.map(s=>{
        const b2 = Math.round((s.bonus2?.pct||0)*100);
        const b4 = Math.round((s.bonus4?.pct||0)*100);
        return `
          <div class="lbRow" style="align-items:flex-start">
            <div class="lbLeft">
              <div><b>${escapeHtml(s.icon)} ${escapeHtml(s.name)}</b> <span class="tag">${escapeHtml(s.element)}</span></div>
              <div class="small muted">2 szt.: +${b2}% mocy • 4 szt.: +${b4}% mocy</div>
            </div>
          </div>
        `;
      }).join("");
      return `
        <div class="prBox" style="margin-top:8px">
          <div class="row" style="justify-content:space-between; align-items:center">
            <b>${escapeHtml(d.name)}</b>
            <span class="muted small">Sety w domenie (2 różne żywioły)</span>
          </div>
          <div style="margin-top:8px">${rows}</div>
        </div>
      `;
    }).join("");
  }

  function renderArtifactsAndDomainsSection(){
    ensureArtifactState();
    ensureDomainHeartbeat();

    const inv = (S.domainArtifacts||[]).slice().sort((a,b)=> (b.created||0)-(a.created||0));
    const invRows = inv.length ? inv.map(a=>`
      <div class="prRow" style="align-items:flex-start">
        <div class="prLeft" style="min-width:0">
          <div class="prLvl">${escapeHtml(artifactLine(a))}</div>
          <div class="prRew muted small">ID: ${escapeHtml(a.id)}</div>
        </div>
        <div class="prRight" style="display:flex; gap:6px; flex-wrap:wrap">
          <button class="btn gold" data-upg-art="${a.id}">Ulepsz (koszt: ${fmt(artifactUpgradeCost(a).gold)}g${(artifactUpgradeCost(a).essence?(" +"+fmt(artifactUpgradeCost(a).essence)+"🧪"):"")} • cap: ${ART_MAX_LVL[a.rarity]||10})</button>
          <button class="btn danger" data-sell-art="${a.id}">Sprzedaj (+${fmt(artifactSellGain(a))}g)</button>
        </div>
      </div>
    `).join("") : `<div class="small muted">Brak artefaktów. Zrób domenę, aby zdobyć pierwszy!</div>`;

    const domainRows = DOMAINS.map(d=>{
      const st = (S.domains||{})[d.id];
      const plvl = ensurePlayer().level||1;
      const baseReq = 1;
      const baseLocked = plvl < baseReq;
      const active = !!(st && st.active);
      const runningLvl = active ? (st.lvl||1) : 0;

      const setsTxt = (d.sets||[]).map(sid=>`${setIcon(sid)} ${escapeHtml(setName(sid))} (${escapeHtml(setElement(sid))})`).join(" / ");

      const lvlBtns = (d.levels||[]).map(def=>{
        const need = domainTierUnlockLevel(def.lvl);
        const lockedTier = plvl < need;
        const powTxt = `req ${fmt(def.reqPower||0)}`;
        const ratio = (def.reqPower||0) ? (teamPower()/(def.reqPower||1)) : 999;
        const stTxt = (def.lvl<=1) ? "OK" : (ratio>=0.35 ? (ratio>=1 ? "Szybko" : "Wolno") : "Za słaby");
        const lockTxt = (lockedTier && !baseLocked) ? ` • od lvl ${need}` : "";
        const dis = (baseLocked||lockedTier||active) ? "disabled" : "";
        const cls = (baseLocked||lockedTier||active) ? "btn" : (def.lvl===1 ? "btn primary" : "btn");
        return `
          <button class="${cls}" data-domain-start="${d.id}" data-domain-lvl="${def.lvl}" ${dis}>
            P${def.lvl} <span class="tag">${Number(def.stars||0)}★</span>
            <span class="muted small">• ${powTxt} • ${stTxt}${lockTxt}</span>
          </button>
        `;
      }).join("");

      return `
        <div class="prRow domainRow" data-domain="${d.id}">
          <div class="prLeft">
            <div class="prLvl">
              ${escapeHtml(d.name)}
              ${active ? `<span class="tag">W trakcie: P${runningLvl}</span>` : ``}
            </div>
            <div class="prRew muted small">
              ${baseLocked ? `Wymaga lvl ${baseReq}` : `Dostępna`}
              ${active ? ` • <span class="timerMono" data-domain-left="${d.id}">HP wroga: —</span>` : ``}
              • Sety: ${setsTxt}
            </div>
            ${active ? `
              <div class="bar" style="margin-top:8px">
                <div data-domain-bar="${d.id}" style="width:100%"></div>
              </div>` : ``}
          </div>

          <div class="prRight" style="display:flex; flex-direction:column; gap:8px; align-items:stretch">
            ${lvlBtns}
          </div>
        </div>
      `;
    }).join("");

    return `
      <div class="hr"></div>
      <div class="row" style="justify-content:space-between; align-items:center">
        <b>Domeny (artefakty postaci)</b>
        <span class="muted small">Załóż artefakty na konkretną postać w zakładce <b>Team</b> (przycisk „Artefakty”).</span>
      </div>

      <div class="row" style="gap:14px; margin-top:10px; flex-wrap:wrap; align-items:flex-start">
        <div style="flex:1; min-width:320px">
          <div class="prBox">
            <div class="row" style="justify-content:space-between; align-items:center">
              <b>Domeny (walka)</b>
              <span class="muted small">Nagroda: 1 artefakt • im większa moc teamu tym szybciej</span>
            </div>
            <div style="margin-top:8px">${domainRows}</div>
            <div class="hr"></div>
            <div class="small muted" style="margin-top:6px">
              <b>Zasada żywiołów:</b> set bonus działa tylko, jeśli żywioł postaci pasuje do setu.
            </div>
            <div class="prBox" style="margin-top:8px; padding:8px">
              ${renderDomainSetLegend()}
            </div>
          </div>

          <div class="prBox" style="margin-top:10px">
            <div class="row" style="justify-content:space-between; align-items:center">
              <b>Ekwipunek artefaktów</b>
              <span class="muted small">Ulepsz / sprzedaj</span>
            </div>
            <div style="margin-top:8px">${invRows}</div>
          </div>
        </div>
      </div>
    `;
  }

  // Osobna zakładka Domeny (gracze tego oczekują zamiast w profilu)
  function renderDomains(){
    return `
      <div class="row" style="justify-content:space-between; align-items:flex-start">
        <div>
          <b>Domeny</b>
          <div class="small muted">Farm artefaktów do postaci. Każda postać ma 4 sloty.</div>
        </div>
        <div class="tag">Team power: ${fmt(teamPower())}</div>
      </div>
      ${renderArtifactsAndDomainsSection()}
    `;
  }

  function wireArtifactsAndDomains(hostEl){
    const host = hostEl || document.getElementById("leftBody") || document.body;
    if(!host) return;
    if(host.__mgWiredArtsDomains) return;
    host.__mgWiredArtsDomains = true;
    host.addEventListener("click", (e)=>{
      const b = e.target.closest("button");
      if(!b) return;
      const idUpg = b.getAttribute("data-upg-art");
      const idSell = b.getAttribute("data-sell-art");
      const dom = b.getAttribute("data-domain-start") || b.getAttribute("data-start-domain");
      if(idUpg){ upgradeArtifact(idUpg); }
      else if(idSell){ if(confirm("Sprzedać artefakt?")) sellArtifact(idSell); }
      else if(dom){ const lvl = b.getAttribute('data-domain-lvl')||1; startDomain(dom, lvl); }
    });
  }

  function wireDomains(){
    // domeny/inwentarz artefaktów to czysty HTML, więc wystarczy delegacja
    wireArtifactsAndDomains(document.getElementById("leftBody"));
  }

  // expose (używane w delegacji klików)
  window.startDomain = startDomain;
  window.finishDomain = finishDomain;
  window.upgradeArtifact = upgradeArtifact;
  window.sellArtifact = sellArtifact;

  // --- Modal do zakładania artefaktów na postać (wywoływany z Team/Kolekcji) ---
  function closeUnitArtifactsModal(){
    const m = document.getElementById("unitArtModal");
    if(m) m.remove();
  }

  function openUnitArtifactsModal(unitId){
    ensureArtifactState();
    const u = getUnitById(unitId);
    if(!u) return;

    const gear = ensureUnitGear(unitId);

    // render helper
    const render = ()=>{
      const arts = (S.domainArtifacts||[]).slice().sort((a,b)=> (b.created||0)-(a.created||0));
      const ownedOnly = arts;

      const slotBox = (sl)=>{
        const id = gear[sl];
        const a = id ? getArtifactById(id) : null;
        const ok = a && (setElement(a.setId) === u.element);
        return `
          <div class="artSlotBox" style="min-width:170px">
            <div class="small muted">${SLOT_NAME[sl]}</div>
            ${a ? `
              <div class="artMini"><b>${escapeHtml(a.rarity)}</b> <span class="muted small">Lvl ${a.level}</span></div>
              <div class="small">${setIcon(a.setId)} ${escapeHtml(setName(a.setId))} <span class="tag">${escapeHtml(setElement(a.setId))}</span></div>
              <div class="small">${ok?`+${fmt(Math.floor((a.value||0)*artifactPowerScale(a.level||1)))} Power`:`<span class="muted">Nie pasuje do żywiołu (${escapeHtml(u.element)})</span>`}</div>
              <div class="row" style="margin-top:6px; flex-wrap:wrap">
                <button class="btn" data-ua-unequip="${sl}">Zdejmij</button>
              </div>
            ` : `<div class="small muted">Puste</div>`}
          </div>
        `;
      };

      // Sort: first matching artifacts (same element), then the rest.
      const invSorted = ownedOnly.slice().sort((a,b)=>{
        const oka = setElement(a.setId) === u.element;
        const okb = setElement(b.setId) === u.element;
        if(oka !== okb) return oka ? -1 : 1;
        // Within group: higher value first, then level.
        const va = Math.floor((a.value||0) * artifactPowerScale(a.level||1));
        const vb = Math.floor((b.value||0) * artifactPowerScale(b.level||1));
        if(va !== vb) return vb - va;
        return (b.level||0) - (a.level||0);
      });

      const invRows = invSorted.length ? invSorted.map(a=>{
        const ok = setElement(a.setId) === u.element;
        return `
          <div class="prRow artInvRow ${ok?'':'disabled'}" style="align-items:flex-start">
            <div class="prLeft" style="min-width:0">
              <div class="prLvl">${escapeHtml(artifactLine(a))}</div>
              <div class="prRew muted small">${ok?`Pasuje do ${escapeHtml(u.element)}`:`Nie pasuje do ${escapeHtml(u.element)} (zablokowane)`}</div>
            </div>
            <div class="prRight" style="display:flex; gap:6px; flex-wrap:wrap">
              ${ART_SLOTS.map(sl=>`<button class="btn ${ok?'primary':''}" ${ok?'':'disabled'} data-ua-equip="${a.id}" data-ua-slot="${sl}">Załóż → ${SLOT_NAME[sl]}</button>`).join("")}
            </div>
          </div>
        `;
      }).join("") : `<div class="small muted">Brak artefaktów w ekwipunku.</div>`;

      const b = unitArtifactBonuses(unitId);
      const pct = Math.round((b.pct||0)*100);

      return `
        <div class="card" style="max-width:860px; width:calc(100vw - 40px); max-height:86vh; overflow:hidden; border-radius:18px; box-shadow:0 30px 80px rgba(0,0,0,.55)">
          <div class="hd">
            <div class="row" style="justify-content:space-between; align-items:center">
              <h2>Artefakty: ${escapeHtml(u.name)} <span class="tag">${escapeHtml(u.element)}</span></h2>
              <button class="btn" data-ua-close>✕ Zamknij</button>
            </div>
            <div class="small muted">4 sloty. Set bonus: 2/4 szt. (działa tylko dla żywiołu postaci).</div>
            <div class="row" style="gap:8px; flex-wrap:wrap; margin-top:8px">
              <span class="tag">Bonus flat: +${fmt(b.flat)}</span>
              <span class="tag">Bonus set: +${pct}%</span>
              <span class="tag">Moc postaci: ${fmt(unitPower(u))}</span>
            </div>
          </div>
          <div class="bd">
            <div class="row" style="gap:10px; flex-wrap:wrap; align-items:flex-start">
              ${slotBox("a1")}${slotBox("a2")}${slotBox("a3")}${slotBox("a4")}
            </div>
            <div class="hr"></div>
            <div class="row" style="justify-content:space-between; align-items:center">
              <b>Ekwipunek</b>
              <span class="muted small">Tip: najlepiej 4/4 jednego setu dla żywiołu ${escapeHtml(u.element)}</span>
            </div>
            <div class="artInvScroll" style="margin-top:8px">${invRows}</div>
          </div>
        </div>
      `;
    };

    closeUnitArtifactsModal();
    const wrap = document.createElement("div");
    wrap.id = "unitArtModal";
    wrap.style.position = "fixed";
    wrap.style.inset = "0";
    wrap.style.zIndex = "9999";
    wrap.style.background = "rgba(0,0,0,.55)";
    wrap.style.backdropFilter = "blur(4px)";
    wrap.style.display = "flex";
    wrap.style.alignItems = "center";
    wrap.style.justifyContent = "center";
    wrap.style.padding = "20px";
    wrap.innerHTML = render();
    document.body.appendChild(wrap);

    const rerender = ()=>{
      const m = document.getElementById("unitArtModal");
      if(!m) return;
      m.innerHTML = render();
      wire();
      // aktualizuj top (power) bez pełnego renderAll
      try{ renderTopLite(); }catch(e){}
    };

    const wire = ()=>{
      const m = document.getElementById("unitArtModal");
      if(!m) return;

      m.querySelector("[data-ua-close]")?.addEventListener("click", ()=>closeUnitArtifactsModal());
      m.addEventListener("click", (e)=>{
        if(e.target === m) closeUnitArtifactsModal();
      });

      m.querySelectorAll("button[data-ua-unequip]").forEach(btn=>{
        btn.addEventListener("click", ()=>{
          const sl = btn.getAttribute("data-ua-unequip");
          if(!sl) return;
          gear[sl] = null;
          toast(`Zdjęto ${SLOT_NAME[sl]} z ${u.name}.`);
          save();
          rerender();
        });
      });

      m.querySelectorAll("button[data-ua-equip]").forEach(btn=>{
        btn.addEventListener("click", ()=>{
          if(btn.disabled) return;
          const artId = btn.getAttribute("data-ua-equip");
          const sl = btn.getAttribute("data-ua-slot");
          const a = getArtifactById(artId);
          if(!a || !sl) return;
          gear[sl] = a.id;
          toast(`Założono ${SLOT_NAME[sl]} na ${u.name}.`);
          save();
          rerender();
        });
      });
    };

    wire();
  }

  window.openUnitArtifactsModal = openUnitArtifactsModal;


  // --- PvP Battle visual modal ---
  function closePvpBattleModal(){
    const m = document.getElementById("pvpBattleModal");
    if(m) m.remove();
    if(window.__PVP_BATTLE_TIMER){
      clearInterval(window.__PVP_BATTLE_TIMER);
      window.__PVP_BATTLE_TIMER = null;
    }
  }

  function pvpRankOrder(rank){
    try{
      if(!rank) return 0;
      if(rank.name==="Master") return 10_000;
      const tierOrder = ["Iron","Bronze","Silver","Gold","Platinum","Emerald","Diamond"];
      const t = tierOrder.indexOf(rank.name);
      const div = (rank.division==null ? 6 : Number(rank.division)||6);
      // division: V(5) lowest -> I(1) highest
      return (t<0?0:(t*100)) + (10 - div);
    }catch(e){ return 0; }
  }

  function openPvpRankUpOverlay(newRank){
    try{
      const label = (newRank && (newRank.label || newRank.display)) ? String(newRank.label || newRank.display) : "Nowa ranga!";
      // remove existing
      try{ document.getElementById("pvpRankUpOverlay")?.remove(); }catch(e){}
      const wrap = document.createElement("div");
      wrap.id = "pvpRankUpOverlay";
      wrap.style.position = "fixed";
      wrap.style.inset = "0";
      wrap.style.zIndex = "10050";
      wrap.style.display = "flex";
      wrap.style.alignItems = "center";
      wrap.style.justifyContent = "center";
      wrap.style.background = "radial-gradient(ellipse at center, rgba(120,60,255,.35) 0%, rgba(0,0,0,.86) 60%, rgba(0,0,0,.95) 100%)";
      wrap.style.backdropFilter = "blur(6px)";
      wrap.style.webkitBackdropFilter = "blur(6px)";
      wrap.innerHTML = `
        <div style="text-align:center; padding:24px 22px; max-width:760px; width:min(760px, 92vw);">
          <div style="font-weight:1000; letter-spacing:.12em; font-size:56px; line-height:1; text-shadow:0 10px 35px rgba(0,0,0,.6);" class="pvpRankUpPop">RANK UP!</div>
          <div style="margin-top:14px; font-size:22px;" class="muted">Awansowałeś do rangi:</div>
          <div style="margin-top:10px; font-size:34px; font-weight:900;" class="pvpRankUpPop2">${escapeHtml(label)}</div>
          <div style="margin-top:18px;">
            <button class="btn primary" id="pvpRankUpOk">OK</button>
          </div>
        </div>
      `;
      document.body.appendChild(wrap);

      if(!document.getElementById("pvpRankUpStyles")){
        const st = document.createElement("style");
        st.id = "pvpRankUpStyles";
        st.textContent = `
          .pvpRankUpPop{ animation: pvpRankUpIn .8s cubic-bezier(.2,1,.2,1) both; }
          .pvpRankUpPop2{ animation: pvpRankUpIn2 .95s cubic-bezier(.2,1,.2,1) .08s both; }
          @keyframes pvpRankUpIn{
            0%{ opacity:0; transform:translateY(18px) scale(.92); filter:blur(2px); }
            55%{ opacity:1; transform:translateY(-2px) scale(1.03); filter:blur(0); }
            100%{ opacity:1; transform:translateY(0) scale(1); }
          }
          @keyframes pvpRankUpIn2{
            0%{ opacity:0; transform:translateY(10px) scale(.96); }
            65%{ opacity:1; transform:translateY(-1px) scale(1.02); }
            100%{ opacity:1; transform:translateY(0) scale(1); }
          }
        `;
        document.head.appendChild(st);
      }

      // sound
      try{ if(typeof playSfx==="function") playSfx("success"); }catch(e){}

      const close = ()=>{
        try{ wrap.remove(); }catch(e){}
      };
      wrap.addEventListener("click",(e)=>{ if(e.target===wrap) close(); });
      wrap.querySelector("#pvpRankUpOk")?.addEventListener("click", close);
      setTimeout(close, 5500);
    }catch(e){}
  }


  function openPvpBattleModal(data){
    try{ closePvpBattleModal(); }catch(e){}
    const log = Array.isArray(data?.battleLog) ? data.battleLog : [];
    if(!log.length){ toast("Brak logu walki."); return; }

    const opp = data?.opponent || {};
    const myName = "Ty";
    const oppName = opp.nick || opp.login || "Przeciwnik";
    const myPow = Number(data?.myPower)||0;
    const oppPow = Number(data?.oppPower)||0;

    const wrap = document.createElement("div");
    wrap.id = "pvpBattleModal";
    wrap.style.position = "fixed";
    wrap.style.inset = "0";
    wrap.style.zIndex = "9999";
    wrap.style.background = "rgba(0,0,0,.55)";
    wrap.style.backdropFilter = "blur(4px)";
    wrap.style.display = "flex";
    wrap.style.alignItems = "center";
    wrap.style.justifyContent = "center";
    wrap.style.padding = "14px";

    const ptsDelta = Number(data?.pvp_points?.delta || 0);
    const ptsTxtTop = Number.isFinite(ptsDelta) && ptsDelta!==0 ? ` • punkty: <b>${ptsDelta>=0?"+":""}${fmt(ptsDelta)}</b>` : "";

    wrap.innerHTML = `
      <div class="card" style="max-width:780px; width:min(780px, 96vw); max-height:86vh; overflow:auto; border:1px solid rgba(255,255,255,.08)">
        <div class="row" style="justify-content:space-between; align-items:center; gap:10px;">
          <div>
            <div class="h2">PvP: przebieg walki</div>
            <div class="small muted">${escapeHtml(String(data?.result||""))}${ptsTxtTop} • moc: <b>${fmt(myPow)}</b> vs <b>${fmt(oppPow)}</b></div>
          </div>
          <button class="btn" id="pvpBattleCloseBtn">Zamknij</button>
        </div>
        <div class="hr"></div>

        <div style="display:flex; flex-direction:column; gap:10px;">
          <div id="pvpBarMe" style="padding:10px; border:1px solid rgba(255,255,255,.07); border-radius:14px;">
            <div style="display:flex; justify-content:space-between; gap:10px; align-items:center;">
              <b>${escapeHtml(myName)}</b>
              <span class="small muted">HP: <span id="pvpHpMeTxt">100</span>%</span>
            </div>
            <div style="height:12px; border-radius:999px; background:rgba(255,255,255,.08); overflow:hidden; margin-top:8px;">
              <div id="pvpHpMeBar" style="height:100%; width:100%; border-radius:999px; background:rgba(255,255,255,.55)"></div>
            </div>
          </div>

          <div id="pvpBarOpp" style="padding:10px; border:1px solid rgba(255,255,255,.07); border-radius:14px;">
            <div style="display:flex; justify-content:space-between; gap:10px; align-items:center;">
              <b>${escapeHtml(oppName)}</b>
              <span class="small muted">HP: <span id="pvpHpOppTxt">100</span>%</span>
            </div>
            <div style="height:12px; border-radius:999px; background:rgba(255,255,255,.08); overflow:hidden; margin-top:8px;">
              <div id="pvpHpOppBar" style="height:100%; width:100%; border-radius:999px; background:rgba(255,255,255,.55)"></div>
            </div>
          </div>
        </div>

        <div class="row" style="gap:8px; margin-top:10px; flex-wrap:wrap; align-items:center">
          <button class="btn primary" id="pvpBattlePlayBtn">▶ Autoplay</button>
          <button class="btn" id="pvpBattlePauseBtn">⏸ Pauza</button>
          <button class="btn" id="pvpBattleStepBtn">Krok</button>
          <button class="btn" id="pvpBattleSkipBtn">⏭ Pomiń</button>
          <button class="btn" id="pvpBattleResetBtn">↺ Replay</button>
          <div class="small muted" style="margin-left:auto; display:flex; gap:8px; align-items:center">
            <span>Prędkość</span>
            <input id="pvpBattleSpeed" type="range" min="0.5" max="3" step="0.25" value="1.25" style="width:140px"/>
            <span id="pvpBattleSpeedTxt">1.25×</span>
          </div>
        </div>

        <div class="hr"></div>
        <div id="pvpLogBox" style="max-height:220px; overflow:auto; border:1px solid rgba(255,255,255,.07); border-radius:14px; padding:10px;"></div>
        <div id="pvpOutcome" style="margin-top:10px; padding:12px; border-radius:14px; text-align:center; font-weight:900; letter-spacing:.08em; display:none;"></div>
      </div>
    `;
    document.body.appendChild(wrap);

    const meBar = document.getElementById("pvpHpMeBar");
    const oppBar = document.getElementById("pvpHpOppBar");
    const meTxt = document.getElementById("pvpHpMeTxt");
    const oppTxt = document.getElementById("pvpHpOppTxt");
    const logBox = document.getElementById("pvpLogBox");

    // smooth HP animations + floating damage
    try{ meBar.style.transition = "width 280ms linear"; }catch(e){}
    try{ oppBar.style.transition = "width 280ms linear"; }catch(e){}

    // ensure containers allow floating numbers
    try{ document.getElementById("pvpBarMe").style.position = "relative"; }catch(e){}
    try{ document.getElementById("pvpBarOpp").style.position = "relative"; }catch(e){}

    if(!document.getElementById("pvpAnimStyles")) {
      const st = document.createElement("style");
      st.id = "pvpAnimStyles";
      st.textContent = `
        .pvpDmgFloat{position:absolute; right:12px; top:8px; font-weight:800; font-size:18px; opacity:0; transform:translateY(8px) scale(.95); animation:pvpFloat 650ms ease-out forwards; text-shadow:0 6px 18px rgba(0,0,0,.6);} 
        .pvpDmgFloat.crit{font-size:20px;}
        @keyframes pvpFloat{
          0%{opacity:0; transform:translateY(10px) scale(.95);} 
          15%{opacity:1;}
          100%{opacity:0; transform:translateY(-18px) scale(1);}
        }
      `;
      document.head.appendChild(st);
    }

    let i = -1;
    const renderState = (st)=>{
      const mh = Math.max(0, Math.min(100, st?.myHp ?? 100));
      const oh = Math.max(0, Math.min(100, st?.oppHp ?? 100));
      meBar.style.width = mh + "%";
      oppBar.style.width = oh + "%";
      meTxt.textContent = String(mh);
      oppTxt.textContent = String(oh);

      // highlight attacker row
      const meRow = document.getElementById("pvpBarMe");
      const oppRow = document.getElementById("pvpBarOpp");
      if(meRow){ meRow.style.borderColor = (st?.attacker==="me") ? "rgba(255,255,255,.35)" : "rgba(255,255,255,.07)"; }
      if(oppRow){ oppRow.style.borderColor = (st?.attacker==="opp") ? "rgba(255,255,255,.35)" : "rgba(255,255,255,.07)"; }
    };

    
const spawnFloat = (who, st)=>{
  try{
    const host = document.getElementById(who==="me" ? "pvpBarMe" : "pvpBarOpp");
    if(!host) return;
    const d = document.createElement("div");
    d.className = "pvpDmgFloat" + (st.crit ? " crit" : "");
    const multTxt = (st.mult && st.mult!==1) ? (` x${st.mult}`) : "";
    const elTxt = (st.atkEl || st.defEl) ? (` ${st.atkEl||""}→${st.defEl||""}`) : "";
    d.textContent = `-${st.dmg}${multTxt}`;
    d.title = `${st.atkEl||""} vs ${st.defEl||""}`;
    host.appendChild(d);
    setTimeout(()=>{ try{ d.remove(); }catch(e){} }, 800);
  }catch(e){}
};

const appendLine = (st)=>{
  const who = st.attacker==="me" ? myName : oppName;
  const crit = st.crit ? " <span class='tag'>CRIT</span>" : "";
  const mult = (st.mult && st.mult!==1) ? (` <span class='tag'>x${st.mult}</span>`) : "";
  const el = (st.atkEl || st.defEl) ? (` <span class='small muted'>${escapeHtml(st.atkEl||"?")}→${escapeHtml(st.defEl||"?")}</span>`) : "";
  const line = `<div class="pvpLogLine"><span class="small muted">T${st.turn}</span> <b>${escapeHtml(who)}</b> zadaje <b>${st.dmg}</b> dmg${mult}${crit}${el}</div>`;
  logBox.innerHTML += line;
  logBox.scrollTop = logBox.scrollHeight;
};

    const reset = ()=>{
      i = -1;
      logBox.innerHTML = "";
      renderState({ myHp:100, oppHp:100, attacker:null });
    };

    const showOutcome = ()=>{
      try{
        const out = document.getElementById("pvpOutcome");
        if(!out) return;
        const win = String(data?.result||"").toLowerCase()==="win";
        const pts = Number(data?.pvp_points?.delta || 0);
        const ptsPart = Number.isFinite(pts) && pts!==0 ? ` • ${pts>=0?"+":""}${fmt(pts)} pkt` : "";
        out.style.display = "block";
        out.textContent = (win ? "WYGRANA" : "PORAŻKA") + ptsPart;
        out.style.background = win ? "rgba(70, 200, 120, .18)" : "rgba(220, 90, 90, .18)";
        out.style.border = win ? "1px solid rgba(70,200,120,.35)" : "1px solid rgba(220,90,90,.35)";
        out.style.color = win ? "rgba(140,255,190,.95)" : "rgba(255,170,170,.95)";
      }catch(e){}
    };

    const step = ()=>{
      i++;
      if(i >= log.length){
        pause();
        showOutcome();
        return;
      }
      const st = log[i];
      renderState(st);
      appendLine(st);
      // floating damage on the defender bar
      spawnFloat(st.attacker==="me"?"opp":"me", st);
    };

    
let speed = 1.25;
const speedInput = document.getElementById("pvpBattleSpeed");
const speedTxt = document.getElementById("pvpBattleSpeedTxt");
if(speedInput){
  speedInput.addEventListener("input", ()=>{
    speed = Number(speedInput.value) || 1.25;
    if(speedTxt) speedTxt.textContent = speed.toFixed(2).replace(/\.00$/,"") + "×";
    // if running, restart timer with new speed
    if(window.__PVP_BATTLE_TIMER){
      clearInterval(window.__PVP_BATTLE_TIMER);
      window.__PVP_BATTLE_TIMER = null;
      play();
    }
  });
  // init
  speed = Number(speedInput.value) || 1.25;
  if(speedTxt) speedTxt.textContent = speed.toFixed(2).replace(/\.00$/,"") + "×";
}

const pause = ()=>{
  if(window.__PVP_BATTLE_TIMER){
    clearInterval(window.__PVP_BATTLE_TIMER);
    window.__PVP_BATTLE_TIMER = null;
  }
};

const play = ()=>{
  if(window.__PVP_BATTLE_TIMER) return;
  const interval = Math.max(140, Math.floor(650 / (speed || 1)));
  window.__PVP_BATTLE_TIMER = setInterval(()=>{
    step();
  }, interval);
  // start immediately
  step();
};

const skip = ()=>{
  pause();
  while(i < log.length) step();
};

const resetAll = ()=>{
  pause();
  reset();
};

reset();


    // handlers
    wrap.addEventListener("click", (e)=>{
      const t = e.target;
      if(!t) return;
      if(t.id==="pvpBattleCloseBtn" || t===wrap){
        closePvpBattleModal();
      }
      if(t.id==="pvpBattlePlayBtn"){ play(); }
      if(t.id==="pvpBattlePauseBtn"){ pause(); }
      if(t.id==="pvpBattleStepBtn"){ step(); }
      if(t.id==="pvpBattleSkipBtn"){ skip(); }
      if(t.id==="pvpBattleResetBtn"){ resetAll(); }
    });
  }

  window.openPvpBattleModal = openPvpBattleModal;



  // --- Better UI: Talents modal (instead of prompt) ---
  function closeTalentModal(){
    const m = document.getElementById("talentModal");
    if(m) m.remove();
  }

  function openTalentModal(unitId){
    const u = getUnitById(unitId);
    const st = ensureUnitState(unitId);
    if(!u || !st || (st.ownedCount||0) <= 0){ toast("Nie posiadasz tej postaci."); return; }
    if(!st.talents || typeof st.talents !== "object") st.talents = { striker:0, guardian:0, scholar:0 };
    if(st.talents.striker == null) st.talents.striker = 0;
    if(st.talents.guardian == null) st.talents.guardian = 0;
    if(st.talents.scholar == null) st.talents.scholar = 0;
    if(st.talentBought == null) st.talentBought = 0;

    const resetCost = 5000;

    const render = ()=>{
      const total = talentPointsTotalForUnitState(st);
      const spent = talentSpent(st);
      const free = Math.max(0, total - spent);
      const buyCost = talentBuyCost(st);
      const canBuy = (S.gold|0) >= buyCost;

      const row = (key, title)=>{
        const val = st.talents[key]||0;
        const canPlus = free > 0;
        const canMinus = val > 0;
        const per = talentPctPerPointFor(u.class, key);
        const pct = (val * per * 100).toFixed(1);
        const perTxt = (per * 100).toFixed(1);
        return `
          <div class="prRow" style="align-items:center">
            <div class="prLeft" style="min-width:0">
              <div class="prLvl"><b>${escapeHtml(title)}</b> <span class="tag">${val} pkt</span></div>
              <div class="prRew muted small">+${perTxt}% mocy postaci / pkt • Bonus: <b>+${pct}%</b></div>
            </div>
            <div class="prRight" style="display:flex; gap:8px; align-items:center; flex-wrap:wrap">
              <button class="btn" data-tal-dec="${key}" ${canMinus?"":"disabled"}>−</button>
              <button class="btn primary" data-tal-inc="${key}" ${canPlus?"":"disabled"}>+</button>
            </div>
          </div>
        `;
      };

      return `
        <div class="card" style="max-width:860px; width:calc(100vw - 40px); border-radius:18px; box-shadow:0 30px 80px rgba(0,0,0,.55)">
          <div class="hd">
            <div class="row" style="justify-content:space-between; align-items:center">
              <h2>Talenty: ${escapeHtml(u.name)} <span class="tag">${escapeHtml(u.element)}</span></h2>
              <button class="btn" data-tal-close>✕ Zamknij</button>
            </div>
            <div class="row" style="gap:10px; flex-wrap:wrap; margin-top:8px">
              <span class="tag">Punkty: <b>${spent}</b> / ${total}</span>
              <span class="tag">Wolne: <b>${free}</b></span>
              <span class="tag">Rekomendacja (${escapeHtml(u.class)}): <b>${escapeHtml(bestTalentLabelForClass(u.class))}</b></span>
              <span class="tag">Moc postaci: ${fmt(unitPower(u))}</span>
              <button class="btn gold" data-tal-buy ${canBuy?"":"disabled"}>Kup +1 pkt (${fmt(buyCost)}g)</button>
            </div>
            <div class="bar" style="margin-top:10px">
              <div style="width:${total?Math.min(100, Math.round((spent/total)*100)):0}%"></div>
            </div>
            <div class="small muted" style="margin-top:8px">Talenty zwiększają moc postaci. Możesz cofnąć punkty (−) lub zresetować całość.</div>
          </div>
          <div class="bd">
            <div class="prBox">
              ${row("striker", "Striker")}
              ${row("guardian","Guardian")}
              ${row("scholar", "Scholar")}
            </div>
            <div class="hr"></div>
            <div class="row" style="justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap">
              <div class="small muted">Reset: koszt <b>${fmt(resetCost)} Gold</b></div>
              <div style="display:flex; gap:8px; flex-wrap:wrap">
                <button class="btn danger" data-tal-reset ${S.gold>=resetCost?"":"disabled"}>Resetuj</button>
                <button class="btn" data-tal-close2>Zamknij</button>
              </div>
            </div>
          </div>
        </div>
      `;
    };

    closeTalentModal();
    const wrap = document.createElement("div");
    wrap.id = "talentModal";
    wrap.style.position = "fixed";
    wrap.style.inset = "0";
    wrap.style.zIndex = "9999";
    wrap.style.background = "rgba(0,0,0,.55)";
    wrap.style.backdropFilter = "blur(4px)";
    wrap.style.display = "flex";
    wrap.style.alignItems = "center";
    wrap.style.justifyContent = "center";
    wrap.style.padding = "20px";
    wrap.innerHTML = render();
    document.body.appendChild(wrap);

    const rerender = ()=>{
      const m = document.getElementById("talentModal");
      if(!m) return;
      m.innerHTML = render();
      wire();
      try{ renderAll(); }catch(e){}
    };

    const wire = ()=>{
      const m = document.getElementById("talentModal");
      if(!m) return;
      m.querySelector("[data-tal-close]")?.addEventListener("click", closeTalentModal);
      m.querySelector("[data-tal-close2]")?.addEventListener("click", closeTalentModal);
      m.addEventListener("click", (e)=>{ if(e.target === m) closeTalentModal(); });

      m.querySelector("button[data-tal-buy]")?.addEventListener("click", ()=>{
        const cost = talentBuyCost(st);
        if((S.gold|0) < cost){ toast("Brak Gold na zakup punktu."); return; }
        S.gold = (S.gold|0) - cost;
        st.talentBought = (st.talentBought|0) + 1;
        toast(`Kupiono +1 punkt talentu (${fmt(cost)}g).`);
        try{ sfx("buy"); }catch(e){}
        save();
        rerender();
      });

      m.querySelectorAll("button[data-tal-inc]").forEach(btn=>{
        btn.addEventListener("click", ()=>{
          const key = btn.getAttribute("data-tal-inc");
          if(!key) return;
          if(talentPointsFree(st) <= 0){ toast("Brak wolnych punktów."); return; }
          st.talents[key] = (st.talents[key]||0) + 1;
          try{ sfx("click"); }catch(e){}
          save();
          rerender();
        });
      });

      m.querySelectorAll("button[data-tal-dec]").forEach(btn=>{
        btn.addEventListener("click", ()=>{
          const key = btn.getAttribute("data-tal-dec");
          if(!key) return;
          const cur = st.talents[key]||0;
          if(cur <= 0) return;
          st.talents[key] = cur - 1;
          try{ sfx("click"); }catch(e){}
          save();
          rerender();
        });
      });

      m.querySelector("button[data-tal-reset]")?.addEventListener("click", ()=>{
        if(!confirm(`Zresetować talenty? Koszt: ${fmt(resetCost)} Gold`)) return;
        if(S.gold < resetCost){ toast("Brak Gold na reset."); return; }
        S.gold -= resetCost;
        st.talents = { striker:0, guardian:0, scholar:0 };
        toast("Talenty zresetowane.");
        save();
        rerender();
      });
    };

    wire();
  }

  window.openTalentModal = openTalentModal;


  // ----------------------------
  // - działa bez backendu: generujesz kod, wysyłasz komuś, on wkleja i odbiera
  // - kod przenosi KONKRETNĄ postać + ilość
  // ----------------------------

function renderProfile(){
    const p = ensurePlayer();
    const need = xpNeed(p.level);
    const owned = ownedUniqueCount();
    const tp = teamPower();

    return `
      <div class="row" style="justify-content:space-between; align-items:flex-start">
        <div>
          <b>Profil gracza</b>
          </div>
        <div class="tag">Lvl ${p.level} • XP ${p.xp}/${need}</div>
      </div>

      <div class="hr"></div>

      <div class="unit">
        <div class="left" style="align-items:center">
          <div class="avatar" style="width:60px; height:70px; border-radius:18px; background: rgba(255,255,255,.05); overflow:hidden;">
            <div class="glow"></div>
            <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center;">
              ${p.avatar?.image
                ? `<img id="profileImagePreview" src="${escapeHtml(p.avatar.image)}" style="width:100%;height:100%;object-fit:cover;"/>`
                : `<span id="profileIconPreview" style="font-size:28px;">${escapeHtml(p.avatar?.icon || "⭐")}</span>`
              }
            </div>
          </div>
          <div style="min-width:0">
            <div class="title"><b>Ustawienia profilu</b></div>
            <div class="sub small muted">Nick jest brany z konta online. Możesz ustawić ikonkę, kolor, motto i zdjęcie.</div>
            <div class="row" style="margin-top:8px; gap:10px; flex-wrap:wrap">
              <input id="profileDisplay" placeholder="Nick z konta" value="${escapeHtml(p.displayName||"")}" style="min-width:240px; opacity:.85" disabled title="Nick jest brany z konta online"/>
              <input id="profileIcon" placeholder="Ikona (emoji, np. 😈)" value="${escapeHtml(p.avatar?.icon||"⭐")}" style="width:170px"/>
              <input id="profileColor" type="color" value="${escapeHtml(p.avatar?.color||"#8fb3ff")}" title="Kolor profilu"/>
              <label class="btn" style="padding:10px 12px; border-radius:12px; cursor:pointer;">
                Zdjęcie <input id="profileImage" type="file" accept="image/*" style="display:none"/>
              </label>
              <button class="btn" id="removeProfileImageBtn" title="Usuń ustawione zdjęcie">Usuń</button>
            </div>
            <div class="row" style="margin-top:8px">
              <input id="profileMotto" placeholder="Motto (opcjonalnie)" value="${escapeHtml(p.avatar?.motto||"")}" style="min-width:520px; max-width:100%"/>
            </div>
            <div class="row" style="margin-top:10px; gap:10px; flex-wrap:wrap; align-items:center">
              <span class="tag">Tytuł</span>
              <select id="profileTitle" class="input" style="min-width:260px; flex:0 0 auto">
                ${unlockedTitles().map(t=>`<option value="${t.id}" ${ensureTitleSelected()===t.id?"selected":""}>${escapeHtml(t.name)}</option>`).join("")}
              </select>
              <span class="small muted">${escapeHtml(getTitleById(ensureTitleSelected()).desc||"")}</span>
            </div>

          </div>
        </div>
        <div class="right">
          <button class="btn primary" id="saveProfileBtn">Zapisz profil</button>
</div>
      </div>

      <div class="hr"></div>

      <div class="kpi">
        <div class="box">
          <b>${fmt(owned)}</b>
          <span>Unikalne posiadane</span>
        </div>
        <div class="box">
          <b>${fmt(tp)}</b>
          <span>Team power</span>
        </div>
        <div class="box">
          <b>${fmt(S.arena?.rank||1)}</b>
          <span>Arena rank</span>
        </div>
      </div>

      <!-- Domeny/artefakty zostały przeniesione do osobnej zakładki "Domeny" -->
      ${renderProfileRewardsSection()}
      ${renderAchievementsSection()}

      <div class="hr"></div>

      <div class="small muted">
        Tip: jeśli chcesz „prawdziwe” logowanie online, w Electronie można to spiąć z backendem lub chmurą — tutaj to jest lokalnie.
      </div>
    `;
  }

  function wireProfile(){
    const icon = document.getElementById("profileIcon");
    const prevIcon = document.getElementById("profileIconPreview");
    const prevImg = document.getElementById("profileImagePreview");
    const fileInput = document.getElementById("profileImage");

    function syncPreview(){
      const p = ensurePlayer();
      const hasImg = !!p.avatar?.image;

      // If we already have an <img>, just update it
      const img = document.getElementById("profileImagePreview");
      const sp = document.getElementById("profileIconPreview");

      if(hasImg){
        if(img){
          img.src = p.avatar.image;
        } else if(sp){
          const parent = sp.parentElement;
          if(parent){
            parent.innerHTML = `<img id="profileImagePreview" src="${escapeHtml(p.avatar.image)}" style="width:100%;height:100%;object-fit:cover;"/>`;
          }
        }
      } else {
        if(sp){
          sp.textContent = (document.getElementById("profileIcon")?.value || p.avatar?.icon || "⭐");
        } else if(img){
          const parent = img.parentElement;
          if(parent){
            parent.innerHTML = `<span id="profileIconPreview" style="font-size:28px;">${escapeHtml(p.avatar?.icon || "⭐")}</span>`;
            const sp2 = document.getElementById("profileIconPreview");
            if(sp2) sp2.textContent = (document.getElementById("profileIcon")?.value || p.avatar?.icon || "⭐");
          }
        }
      }
    }

    if(icon){
      icon.addEventListener("input", ()=>{
        const p = ensurePlayer();
        if(!p.avatar?.image){
          const sp = document.getElementById("profileIconPreview");
          if(sp) sp.textContent = icon.value || "⭐";
        }
      });
    }

    async function fileToSmallDataUrl(file, maxDim=160){
      // Read image file, resize to maxDim, export JPEG to keep save small
      const dataUrl = await new Promise((resolve, reject)=>{
        const r = new FileReader();
        r.onload = ()=> resolve(String(r.result||""));
        r.onerror = ()=> reject(new Error("Nie udało się wczytać pliku"));
        r.readAsDataURL(file);
      });
      const img = await new Promise((resolve, reject)=>{
        const im = new Image();
        im.onload = ()=> resolve(im);
        im.onerror = ()=> reject(new Error("Nieprawidłowy obraz"));
        im.src = dataUrl;
      });

      const w = img.width || 1, h = img.height || 1;
      const scale = Math.min(1, maxDim / Math.max(w,h));
      const cw = Math.max(1, Math.round(w*scale));
      const ch = Math.max(1, Math.round(h*scale));

      const c = document.createElement("canvas");
      c.width = cw; c.height = ch;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0, cw, ch);

      // JPEG is usually much smaller than PNG for photos
      const out = c.toDataURL("image/jpeg", 0.82);

      // Hard guard (so we don't bloat cloud save). ~220KB
      if(out.length > 220_000) {
        const out2 = c.toDataURL("image/jpeg", 0.72);
        if(out2.length > 220_000) throw new Error("Zdjęcie jest za duże. Wybierz mniejsze.");
        return out2;
      }
      return out;
    }

    fileInput?.addEventListener("change", async ()=>{
      const f = fileInput.files && fileInput.files[0];
      if(!f) return;
      try{
        const p = ensurePlayer();
        p.avatar.image = await fileToSmallDataUrl(f, 160);
        toast("Ustawiono zdjęcie profilowe.");
        save(); renderAll();
        syncPreview();
      }catch(e){
        toast(String(e?.message||e));
      } finally {
        try{ fileInput.value = ""; }catch{}
      }
    });

    document.getElementById("removeProfileImageBtn")?.addEventListener("click", ()=>{
      const p = ensurePlayer();
      p.avatar.image = null;
      toast("Usunięto zdjęcie.");
      save(); renderAll();
      syncPreview();
    });

    document.getElementById("saveProfileBtn")?.addEventListener("click", ()=>{
      const p = ensurePlayer();
      const ic = (document.getElementById("profileIcon")?.value||"").trim();
      const col = (document.getElementById("profileColor")?.value||"#8fb3ff").trim();
      const mo = (document.getElementById("profileMotto")?.value||"").trim();

      // Nick/login są brane z konta online (patrz ensurePlayer()).
      if(ic) p.avatar.icon = ic.slice(0, 4);
      if(col) p.avatar.color = col;
      p.avatar.motto = mo.slice(0, 60);
      const tsel = (document.getElementById("profileTitle")?.value||"").trim();
      if(tsel) p.titleId = tsel;

      toast("Zapisano profil.");
      save(); renderAll();
      syncPreview();
    });

    // --- artifacts/domains wiring (delegation, idempotent) ---
    try{ wireArtifactsAndDomains(document.getElementById("leftBody")); }catch(e){}

  }

// ----------------------------
// Dungeon (endless floors)
// - trudność rośnie co piętro
// - porównanie jak w Weekly: wymagane "power" vs teamPower()
// - nagrody rosną z piętrem
// ----------------------------
// (przeniesione wyżej: DUNGEON config)

function dungeonFloorPower(floor){
  const f = Math.max(1, floor|0);
  return Math.floor(DUNGEON.basePower * Math.pow(DUNGEON.growth, f-1));
}

function dungeonRewards(floor){
  const f = Math.max(1, floor|0);
  // skalowane dość agresywnie, ale bez rozwalenia ekonomii
  const gold = Math.floor((DUNGEON.baseGold + f*180) * (1 + (S.upgrades?.rewardLvl||0)*0.05));
  const gemsRaw = Math.floor((DUNGEON.baseGems + f*2.2) * (1 + (S.upgrades?.rewardLvl||0)*0.03));
  const gems = Math.max(0, Math.floor(gemsRaw * 0.65));
  const essence = (f % 3 === 0) ? 2 : 1;
  const cores = (f % 10 === 0) ? 1 : 0;
  // ticket jako rzadki milestone (np. co 25 pięter)
  const tickets = (f % 25 === 0) ? 1 : 0;
  return { gold, gems, essence, cores, tickets };
}

function renderDungeon(){
  S.dungeon ||= { floor: 1, best: 0, auto: false };
  const f = Math.max(1, S.dungeon.floor|0);
  const best = Math.max(0, S.dungeon.best|0);

  const req = dungeonFloorPower(f);
  const tp = teamPower();
  const ratio = (tp>0) ? (tp/req) : 0;
  const winChance = (tp>=req) ? 1 : Math.max(0.02, Math.min(0.95, Math.pow(ratio, 3)));
  const canAttempt = tp > 0;

  const rw = dungeonRewards(f);

  return `
    <div class="list">
      <div class="unit">
        <div class="left">
          <div style="min-width:0">
            <div class="title">
              <b>Dungeon — piętra bez limitu</b>
              <span class="tag">Aktualne: ${f}</span>
              <span class="tag">Best: ${best}</span>
              <span class="tag">Wymagane: ${fmt(req)}</span>
              <span class="tag">Twój team: ${fmt(tp)}</span>
            </div>
            <div class="sub small muted">
              Zasada: jak w Weekly, ale z twistem — jeśli masz mniej mocy niż wymagane, nadal możesz wygrać, tylko z mniejszą szansą. Im większa różnica, tym mniejsza szansa.
            </div>
          </div>
        </div>
        <div class="right">
          <button class="btn" id="dungeonAutoBtn">${S.dungeon.auto ? "Auto: ON" : "Auto: OFF"}</button>
          <button class="btn primary" id="dungeonFightBtn" ${canAttempt ? "" : "disabled"}>⚔️ Przejdź piętro</button>
        </div>
      </div>

      <div class="unit">
        <div class="left">
          <div style="min-width:0">
            <div class="title"><b>Nagrody za piętro ${f}</b></div>
            <div class="sub">
              +${fmt(goldReward(rw.gold))} Gold • +${fmt(rw.gems)} Gems • +${rw.essence} Essence
              ${rw.cores ? `• +${rw.cores} Cores` : ``}
              ${rw.tickets ? `• +${rw.tickets} Ticket` : ``}
            </div>
          </div>
        </div>
        <div class="right">
          <span class="tag">${canAttempt ? ("Szansa: " + Math.round(winChance*100) + "%") : "Ustaw team"}</span>
        </div>
      </div>

      <div class="unit">
        <div class="left">
          <div style="min-width:0">
            <div class="title"><b>Tip</b></div>
            <div class="sub small muted">
              Jeśli utknąłeś — ulepsz DMG (mnożnik), wzmocnij team i wróć. Co 10 pięter wpadają Cores, a co 25 — Ticket.
            </div>
          </div>
        </div>
        <div class="right">
          <button class="btn danger" id="dungeonResetBtn">Reset piętra</button>
        </div>
      </div>
    </div>
  `;
}

let dungeonAutoTimer = null;

function stopDungeonAuto(){
  if(dungeonAutoTimer){ clearInterval(dungeonAutoTimer); dungeonAutoTimer = null; }
}

function startDungeonAuto(){
  stopDungeonAuto();
  dungeonAutoTimer = setInterval(()=>{
    if(!S?.dungeon?.auto) return;

    const tp = teamPower();
    if(tp <= 0){
      S.dungeon.auto = false;
      toast("Auto Dungeon OFF: ustaw team w Kolekcji.");
      save();
      if(currentTab==="dungeon") renderAll();
      stopDungeonAuto();
      return;
    }

    dungeonFightOnce(true);

    // jeśli auto zostało wyłączone (np. po przegranej), wyłącz timer
    if(!S?.dungeon?.auto){
      stopDungeonAuto();
      if(currentTab==="dungeon") renderAll();
    }
  }, 1200);
}

function dungeonFightOnce(isAuto=false){
  S.dungeon ||= { floor: 1, best: 0, auto: false };
  const f = Math.max(1, S.dungeon.floor|0);
  const req = dungeonFloorPower(f);
  const tp = teamPower();

  if(tp<=0){
    toast("Ustaw team w Kolekcji.");
    if(currentTab==="dungeon") renderAll();
    return;
  }

  // Szansa wygranej gdy jesteś poniżej wymagań:
  const ratio = tp / req;
  const winChance = (tp>=req) ? 1 : Math.max(0.02, Math.min(0.95, Math.pow(ratio, 3)));

  const roll = Math.random();
  const win = roll <= winChance;

  if(!win){
    // przegrana -> reset do 1 piętra, auto OFF
    S.dungeon.floor = 1;
    if(S.dungeon.auto){
      S.dungeon.auto = false;
      stopDungeonAuto();
    }
	    toast(`Przegrana na piętrze ${f}. Szansa ${Math.round(winChance*100)}% (wylosowano ${Math.round(roll*100)}%). Wracasz na 1 piętro.`);
	    // Dungeon: no SFX (user request). Keep only the visual FX.
	    try{ playGlobalFX("lose", { color: "#ff3b3b", label: "DEFEAT", duration: 720 }); }catch(e){}
    save();
    if(currentTab==="dungeon") renderAll();
    return;
  }

  // wygrana
  const rw = dungeonRewards(f);
  try{ const ab = artifactBonuses(); addGold(Math.floor(rw.gold*(ab.goldMult||1))); }catch(e){ addGold(rw.gold); }
  addGems(rw.gems);
  addEssence(rw.essence);
  if(rw.cores) addCores(rw.cores);
  if(rw.tickets) addPullTickets(rw.tickets);
  // Artefakty: dodatkowa szansa na ticket
  let extraTicket=0;
  try{ const ab = artifactBonuses(); if(Math.random() < (ab.ticketChance||0)) extraTicket=1; }catch(e){}
  if(extraTicket) addPullTickets(extraTicket);

  S.dungeon.best = Math.max(S.dungeon.best|0, f);
  S.dungeon.floor = f + 1;

  try{ addProfileXP(6 + Math.floor(f/3)); }catch(e){}
  try{ bpAddXP(4 + Math.floor(f/5)); }catch(e){}

	  // Dungeon: no SFX (user request). Keep only the visual FX.
	  try{ playGlobalFX("win", { color: "#ffd36a", label: "VICTORY", duration: 980 }); }catch(e){}
	  try{ if(tp >= req*1.8) { playGlobalFX("crit", { color: "#c7a3ff", label: "CRIT!", duration: 640 }); } }catch(e){}
  toast(`Dungeon +1 piętro! (+${fmt(goldReward(rw.gold))}G, +${fmt(rw.gems)}💎${rw.tickets?`, +${rw.tickets}🎟️`:``}${rw.cores?`, +${rw.cores}🔩`:``})`);
  save();
  if(currentTab==="dungeon") renderAll();
}

function wireDungeon(){
  // hard guard: ensure dungeon state always exists
  if(!S.dungeon) S.dungeon = { floor:1, best:0, auto:false };
  const autoBtn = document.getElementById("dungeonAutoBtn");
  const fightBtn = document.getElementById("dungeonFightBtn");
  const resetBtn = document.getElementById("dungeonResetBtn");

  if(autoBtn){
    autoBtn.onclick = ()=>{
      S.dungeon ||= { floor:1, best:0, auto:false };
      S.dungeon.auto = !S.dungeon.auto;
      toast(`Auto Dungeon: ${S.dungeon.auto ? "ON" : "OFF"}`);
      save();
      if(S.dungeon.auto) startDungeonAuto(); else stopDungeonAuto();
      renderAll();
    };
  }
  if(fightBtn){
    fightBtn.onclick = ()=> dungeonFightOnce(false);
  }
  if(resetBtn){
    resetBtn.onclick = ()=>{
      if(!confirm("Zresetować aktualne piętro do 1? (Best zostaje)")) return;
      S.dungeon ||= { floor:1, best:0, auto:false };
      S.dungeon.floor = 1;
      S.dungeon.auto = false;
      stopDungeonAuto();
      toast("Dungeon zresetowany do piętra 1.");
      save();
      renderAll();
    };
  }
}

  // ----------------------------
  // Endgame (ultra trudni przeciwnicy)
  // - Szansa przejścia liczona z teamPower vs wymagane
  // - Nawet przy przewadze mocy nie ma 100% (max 95%)
  // - Przegrana resetuje stage do 1 (hard)
  // ----------------------------
  function endgameRequiredPower(stage){
    // dość stromo: endgame ma być "po wszystkim"
    const base = 25000;
    const growth = 1.22;
    stage = Math.max(1, stage|0);
    return Math.floor(base * Math.pow(growth, stage-1));
  }

  function endgameWinChance(tp, req){
    if(tp <= 0 || req <= 0) return 0;
    // ratio=1 => ok. 45-55%, ratio>1 => rośnie, ratio<1 => szybko spada
    const ratio = tp / req;
    const k = 9; // stromość
    const x = (ratio - 1);
    const logistic = 1 / (1 + Math.exp(-k * x));
    return Math.max(0.01, Math.min(0.95, logistic));
  }

  function endgameRewards(stage){
    stage = Math.max(1, stage|0);
    const g = Math.floor(8000 * Math.pow(1.18, stage-1));
    const gems = Math.max(6, Math.floor(6 * Math.pow(1.16, stage-1)));
    const essence = Math.max(4, Math.floor(4 * Math.pow(1.10, stage-1)));
    const cores = (stage % 3 === 0) ? 1 : 0;
    const tickets = (stage % 7 === 0) ? 1 : 0;
    return { gold:g, gems, essence, cores, tickets };
  }

  function renderEndgame(){
    S.endgame ||= { stage:1, best:0, auto:false };
    const st = Math.max(1, S.endgame.stage|0);
    const best = Math.max(0, S.endgame.best|0);
    const tp = teamPower();
    const req = endgameRequiredPower(st);
    const chance = endgameWinChance(tp, req);
    const rw = endgameRewards(st);

    const unlockHint = (S.dungeon?.best|0) < 50
      ? `Odblokuj Endgame: zrób <b>Dungeon Best 50+</b> (masz ${S.dungeon?.best|0}).`
      : `Endgame odblokowany `;
    const unlocked = (S.dungeon?.best|0) >= 50;

    return `
      <div class="list">
        <div class="unit">
          <div class="left"><div style="min-width:0">
            <div class="title"><b>Endgame — Ultra Boss Rush</b>
              <span class="tag">Stage: ${st}</span>
              <span class="tag">Best: ${best}</span>
            </div>
            <div class="sub small muted" id="endgameUnlockHint">${unlockHint}</div>
          </div></div>
          <div class="right">
            <button class="btn" id="endgameAutoBtn" ${unlocked?"":"disabled"}>${S.endgame.auto?"Auto: ON":"Auto: OFF"}</button>
            <button class="btn primary" id="endgameFightBtn" ${unlocked && tp>0 ? "" : "disabled"}>🔥 Walcz</button>
          </div>
        </div>

        <div class="unit">
          <div class="left"><div style="min-width:0">
            <div class="title"><b>Wymagania (stage ${st})</b></div>
            <div class="sub">Wymagane: <b>${fmt(req)}</b> • Twój team: <b>${fmt(tp)}</b></div>
          </div></div>
          <div class="right"><span class="tag">Szansa: ${tp>0?Math.round(chance*100):0}%</span></div>
        </div>

        <div class="unit">
          <div class="left"><div style="min-width:0">
            <div class="title"><b>Nagrody</b></div>
            <div class="sub">+${fmt(goldReward(rw.gold))} Gold • +${fmt(rw.gems)} Gems • +${rw.essence} Essence
              ${rw.cores?`• +${rw.cores} Cores`:``}
              ${rw.tickets?`• +${rw.tickets} Ticket`:``}
            </div>
            <div class="sub small muted" style="margin-top:6px">
              Tip: Endgame nie daje 100% nawet przy przewadze. Ulepszaj DMG, Ascension i team — to ma być "ultra".
            </div>
          </div></div>
          <div class="right">
            <button class="btn danger" id="endgameResetBtn" ${unlocked?"":"disabled"}>Reset stage</button>
          </div>
        </div>
      </div>
    `;
  }

  let endgameAutoTimer = null;
  function stopEndgameAuto(){ if(endgameAutoTimer){ clearInterval(endgameAutoTimer); endgameAutoTimer=null; } }
  function startEndgameAuto(){
    stopEndgameAuto();
    endgameAutoTimer = setInterval(()=>{
      if(!S?.endgame?.auto) return;
      if((S.dungeon?.best|0) < 50){ S.endgame.auto=false; stopEndgameAuto(); save(); if(currentTab==="endgame") renderAll(); return; }
      if(teamPower()<=0){ S.endgame.auto=false; stopEndgameAuto(); toast("Auto Endgame OFF: ustaw team w Kolekcji."); save(); if(currentTab==="endgame") renderAll(); return; }
      endgameFightOnce(true);
      if(!S?.endgame?.auto){ stopEndgameAuto(); if(currentTab==="endgame") renderAll(); }
    }, 1300);
  }

  function endgameFightOnce(isAuto=false){
    S.endgame ||= { stage:1, best:0, auto:false };
    const unlocked = (S.dungeon?.best|0) >= 50;
    if(!unlocked){ toast("Endgame zablokowany: zrób Dungeon Best 50+."); return; }

    const st = Math.max(1, S.endgame.stage|0);
    const req = endgameRequiredPower(st);
    const tp = teamPower();
    if(tp<=0){ toast("Ustaw team w Kolekcji."); if(currentTab==="endgame") renderAll(); return; }

    const chance = endgameWinChance(tp, req);
    const roll = Math.random();
    const win = roll <= chance;

    if(!win){
      S.endgame.stage = 1;
      if(S.endgame.auto){ S.endgame.auto=false; stopEndgameAuto(); }
      toast(`Porażka w Endgame (stage ${st}). Szansa ${Math.round(chance*100)}% (wylosowano ${Math.round(roll*100)}%). Reset do stage 1.`);
      try{ sfx("lose"); }catch(e){}
      try{ playGlobalFX("lose", { color: "#ff3b3b", label: "DEFEAT", duration: 720 }); }catch(e){}
      save();
      if(currentTab==="endgame") renderAll();
      return;
    }

    const rw = endgameRewards(st);
    try{ const ab = artifactBonuses(); addGold(Math.floor(rw.gold*(ab.goldMult||1))); }catch(e){ addGold(rw.gold); }
    addGems(rw.gems);
    addEssence(rw.essence);
    if(rw.cores) addCores(rw.cores);
    if(rw.tickets) addPullTickets(rw.tickets);

    S.endgame.best = Math.max(S.endgame.best|0, st);
    S.endgame.stage = st + 1;
    try{ addProfileXP(10 + Math.floor(st/2)); }catch(e){}
    try{ bpAddXP(7 + Math.floor(st/3)); }catch(e){}

    try{ sfx("win"); }catch(e){}
    try{ playGlobalFX("win", { color: "#ffd36a", label: "VICTORY", duration: 980 }); }catch(e){}
    try{ if(chance <= 0.25) { sfx("crit"); playGlobalFX("crit", { color: "#c7a3ff", label: "CLUTCH!", duration: 640 }); } }catch(e){}
    toast(`Endgame wygrany! Stage +1 (nagrody: +${fmt(goldReward(rw.gold))}G, +${fmt(rw.gems)}💎${rw.tickets?`, +${rw.tickets}🎟️`:``}${rw.cores?`, +${rw.cores}🔩`:``})`);
    save();
    if(currentTab==="endgame") renderAll();
  }

  function wireEndgame(){
    if(!S.endgame) S.endgame = { stage:1, best:0, auto:false };
    const unlocked = (S.dungeon?.best|0) >= 50;
    const autoBtn = document.getElementById("endgameAutoBtn");
    const fightBtn = document.getElementById("endgameFightBtn");
    const resetBtn = document.getElementById("endgameResetBtn");

    if(autoBtn){
      autoBtn.onclick = ()=>{
        if(!unlocked){ toast("Endgame zablokowany: zrób Dungeon Best 50+."); return; }
        S.endgame.auto = !S.endgame.auto;
        toast(`Auto Endgame: ${S.endgame.auto?"ON":"OFF"}`);
        save();
        if(S.endgame.auto) startEndgameAuto(); else stopEndgameAuto();
        renderAll();
      };
    }
    if(fightBtn){ fightBtn.onclick = ()=> endgameFightOnce(false); }
    if(resetBtn){
      resetBtn.onclick = ()=>{
        if(!unlocked) return;
        if(!confirm("Zresetować Endgame do stage 1? (Best zostaje)")) return;
        S.endgame.stage = 1;
        S.endgame.auto = false;
        stopEndgameAuto();
        toast("Endgame zresetowany do stage 1.");
        save();
        renderAll();
      };
    }
  }

  // ----------------------------
  // Settings + Notes
  // ----------------------------

  function renderRebirthPerks(){
    const p = (S.rebirth && S.rebirth.perks) ? S.rebirth.perks : {gold:0,reward:0,dmg:0,cps:0,start:0};
    const e = (S.rebirth && S.rebirth.essence) ? S.rebirth.essence : 0;

    const rows = [
      {k:"gold",  name:"Gold Gain",   desc:"+5% gold gain / lvl (idle + arena + klik)", lvl:p.gold||0},
      {k:"reward",name:"Reward Mult", desc:"+4% do Reward multiplier / lvl", lvl:p.reward||0},
      {k:"dmg",   name:"DMG Mult",    desc:"+3% do DMG multiplier / lvl", lvl:p.dmg||0},
      {k:"cps",   name:"Auto CPS",    desc:"+0.2 hit/s / lvl", lvl:p.cps||0},
      {k:"start", name:"Start Bonus", desc:"+5000g +150 gems +0.5 pull +5 essence / lvl (na start runu)", lvl:p.start||0},
      {k:"essence",name:"Essence Yield", desc:"+8% Rebirth Essence gain / lvl", lvl:p.essence||0},
      {k:"pity",   name:"Pity Tuning",  desc:"-2 UR pity & -1 SSR pity progów / lvl (min. limity)", lvl:p.pity||0},
    ];

    return rows.map(r=>{
      const maxLvl = (r.k==="pity") ? 10 : 999;
      const atMax = r.lvl >= maxLvl;
      const next = r.lvl + 1;
      const cost = rbPerkCost(r.k, next);
      const dis = (atMax || e < cost) ? "disabled" : "";
      return `
        <div class="unit">
          <div class="left"><div style="min-width:0">
            <div class="title"><b>${r.name}</b> <span class="tag">lvl ${r.lvl}${atMax? " MAX":""}</span></div>
            <div class="sub">${r.desc}</div>
          </div></div>
          <div class="right" style="display:flex; gap:8px; align-items:center;">
            <span class="tag">${atMax ? "MAX" : ("Koszt: " + cost)}</span>
            <button class="btn" data-rbperk="${r.k}" ${dis}>Kup</button>
          </div>
        </div>
      `;
    }).join("");
  }

function renderRebirthTab(){
  const can = canRebirth();
  return `
    <div class="card">
      <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:10px; flex-wrap:wrap;">
        <div style="min-width:260px">
          <div class="h2">Rebirth</div>
          <div class="sub">Wymagania: <b>lvl ${rebirthReqLevel()}</b> i <b>${fmt(rebirthCost())} Gold</b>. HARD reset (postacie, waluty, progres). Zostają: <b>Rebirth</b>, <b>Essence</b> i <b>perki</b>. Po rebircie możesz znów odebrać Starter.</div>
        </div>
        <div class="pill"><span>Masz:</span> <b>${fmt(S.gold||0)}</b> <span class="muted">Gold</span></div>
      </div>

      <div class="rowLine" style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
        <span class="tag">Rebirth: <b>${(S.rebirth?.count||0)}</b></span>
        <span class="tag">Essence: <b>${(S.rebirth?.essence||0)}</b></span>
        <button class="btn danger" id="rebirthBtn" ${can ? "" : "disabled"}>♻️ Rebirth (+${rebirthGainDetailed().total} Essence)</button>
      </div>

      <div class="small muted" style="margin-top:8px; line-height:1.35">
        Podgląd: baza <b>${rebirthGainDetailed().base}</b> × (Essence Yield <b>${Math.round(rebirthGainDetailed().mult*100)}%</b>) = <b>${rebirthGainDetailed().total}</b> Essence.
        <span class="muted">Perk „Essence Yield” zwiększa gain z rebirtha.</span>
      </div>

      <div class="hr"></div>
      <b>Drzewko perków</b>
      <div class="small muted" style="margin-top:4px;">Koszty rosną wykładniczo (balans). Bonusy są umiarkowane — wyniki nie eksplodują.</div>

      <div class="list" style="margin-top:10px;">
        ${renderRebirthPerks()}
      </div>

      <div class="small muted" style="margin-top:10px;">
        Tip: Essence jest stała między runami. Rebirth resetuje wszystko inne.
      </div>
    </div>
  `;
    // Domains start buttons
    root.querySelectorAll("[data-domain-start]").forEach(btn=>{
      btn.onclick = ()=>{
        const id = btn.getAttribute("data-domain-start");
        startDomain(id);
      };
    });

  }
function wireRebirthTab(){
  const rbBtn = $("#rebirthBtn");
  if(rbBtn) rbBtn.onclick = ()=>{ doRebirth(); };
  $all("[data-rbperk]").forEach(b=>{
    b.onclick = ()=>{ buyRebirthPerk(b.getAttribute("data-rbperk")); };
  });
}

  // ----------------------------
  // Tutorial dla nowych graczy (onboarding)
  // - Pokazuje się 1 raz (S.tutorialDone)
  // - Automatycznie przełącza zakładki i podświetla elementy
  // ----------------------------
  let __mgTutorial = { open:false, step:0, lockNav:false };

  function ensureTutorialDOM(){
    if(document.getElementById("mgTutorial")) return;
    const root = document.createElement("div");
    root.id = "mgTutorial";
    root.className = "mg-tutorial";
    root.setAttribute("data-open","0");
    root.innerHTML = `
      <div class="mg-tutorial__mask" id="mgTutMask"></div>
      <div class="mg-tutorial__hl" id="mgTutHL" style="left:-9999px; top:-9999px; width:10px; height:10px"></div>
      <div class="mg-tutorial__card" id="mgTutCard" style="left:16px; top:16px">
        <div class="mg-tutorial__title" id="mgTutTitle">Tutorial</div>
        <p class="mg-tutorial__text" id="mgTutText">—</p>
        <div class="mg-tutorial__bar">
          <div class="mg-tutorial__progress" id="mgTutProg">1/1</div>
          <div class="mg-tutorial__actions">
            <button class="btn" id="mgTutBack">Wstecz</button>
            <button class="btn primary" id="mgTutNext">Dalej</button>
            <button class="btn" id="mgTutSkip">Pomiń</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(root);

    const close = ()=>{ tutorialFinish(true); };
    const mask = document.getElementById("mgTutMask");
    if(mask) mask.onclick = close;
  }

  const TUTORIAL_STEPS = [
    { tab:"banner", selector:'.nav .tab[data-tab="banner"]', title:"1) Banner", text:"Tu robisz losowania (single/10x). Pity rośnie i gwarantuje lepsze dropy." },
    { tab:"collection", selector:'.nav .tab[data-tab="collection"]', title:"2) Team", text:"Ustaw team (Twoje top postacie). Team power wpływa na arenę, dungeon i endgame." },
    { tab:"dungeon", selector:'#dungeonFightBtn', title:"3) Dungeon", text:"Bez limitu pięter. Gdy masz mniej mocy niż wymagane, nadal możesz wygrać — z mniejszą szansą." },
    { tab:"endgame", selector:'#endgameFightBtn', title:"4) Endgame", text:"Ultra trudni przeciwnicy. Szansa zależy od mocy teamu, ale max to 95% — to ma boleć 😈" },
    { tab:"shop", selector:'.nav .tab[data-tab="shop"]', title:"5) Sklep", text:"Wymieniaj waluty na ulepszenia. Wróć tu, gdy utkniesz." },
    { tab:"settings", selector:'.nav .tab[data-tab="settings"]', title:"6) Ustawienia", text:"Włącz/wyłącz SFX i dopasuj detale. Miłej gry!" },
  ];

  function tutorialShouldShow(){
    // S.tutorialDone jest w chmurze, ale tutorial może odpalić zanim cloud-save zostanie wczytany.
    // Dlatego trzymamy też małą flagę lokalnie (per przeglądarka).
    try{
      if(localStorage.getItem("MG_TUTORIAL_DONE") === "1") return false;
    }catch(e){}
    return !S.tutorialDone;
  }

  function tutorialOpen(){
    ensureTutorialDOM();
    __mgTutorial.open = true;
    __mgTutorial.step = 0;
    document.getElementById("mgTutorial")?.setAttribute("data-open","1");
    tutorialRenderStep();
  }

  function tutorialFinish(markDone){
    __mgTutorial.open = false;
    __mgTutorial.lockNav = false;
    try{ document.getElementById("mgTutorial")?.setAttribute("data-open","0"); }catch(e){}
    try{ const hl = document.getElementById("mgTutHL"); if(hl) hl.style.left = "-9999px"; }catch(e){}
    if(markDone){
      S.tutorialDone = true;
      try{ localStorage.setItem("MG_TUTORIAL_DONE","1"); }catch(e){}
      save();
    }
  }

  function tutorialWire(){
    const back = document.getElementById("mgTutBack");
    const next = document.getElementById("mgTutNext");
    const skip = document.getElementById("mgTutSkip");
    if(back) back.onclick = ()=>{ __mgTutorial.step = Math.max(0, __mgTutorial.step-1); tutorialRenderStep(); };
    if(next) next.onclick = ()=>{
      if(__mgTutorial.step >= TUTORIAL_STEPS.length-1){ tutorialFinish(true); return; }
      __mgTutorial.step++; tutorialRenderStep();
    };
    if(skip) skip.onclick = ()=> tutorialFinish(true);
  }

  function tutorialRenderStep(){
    if(!__mgTutorial.open) return;
    ensureTutorialDOM();
    tutorialWire();

    const step = TUTORIAL_STEPS[__mgTutorial.step];
    if(!step){ tutorialFinish(true); return; }

    // przełącz tab jeśli trzeba
    if(step.tab && currentTab !== step.tab){
      __mgTutorial.lockNav = true;
      mgNavigate(step.tab, { force:true });
      // poczekaj aż render skończy i dopiero ustaw highlight
      setTimeout(()=>tutorialRenderStep(), 260);
      return;
    }
    __mgTutorial.lockNav = false;

    const titleEl = document.getElementById("mgTutTitle");
    const textEl = document.getElementById("mgTutText");
    const progEl = document.getElementById("mgTutProg");
    if(titleEl) titleEl.textContent = step.title || "Tutorial";
    if(textEl) textEl.textContent = step.text || "";
    if(progEl) progEl.textContent = `${__mgTutorial.step+1}/${TUTORIAL_STEPS.length}`;

    // highlight element
    const target = step.selector ? document.querySelector(step.selector) : null;
    const hl = document.getElementById("mgTutHL");
    const card = document.getElementById("mgTutCard");
    if(target && hl){
      const r = target.getBoundingClientRect();
      const pad = 8;
      const left = Math.max(8, r.left - pad);
      const top = Math.max(8, r.top - pad);
      const w = Math.max(20, r.width + pad*2);
      const h = Math.max(20, r.height + pad*2);
      hl.style.left = left + "px";
      hl.style.top = top + "px";
      hl.style.width = w + "px";
      hl.style.height = h + "px";

      // ustaw kartę obok highlightu
      if(card){
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;
        let cx = Math.min(viewportW - 16 - card.offsetWidth, left + w + 14);
        let cy = Math.min(viewportH - 16 - card.offsetHeight, top);
        // jeśli z prawej brak miejsca, daj pod spodem
        if(cx < 16) cx = 16;
        if(left + w + 14 + card.offsetWidth > viewportW - 16){
          cx = Math.min(viewportW - 16 - card.offsetWidth, left);
          cy = Math.min(viewportH - 16 - card.offsetHeight, top + h + 14);
        }
        card.style.left = Math.max(16, cx) + "px";
        card.style.top = Math.max(16, cy) + "px";
      }
    } else {
      if(hl) hl.style.left = "-9999px";
    }
  }

function renderSettings(){
    const cur = (S.settings && S.settings.theme) ? S.settings.theme : "midnight";
    const themes = [
      {id:"midnight", name:"Midnight", desc:"Klasyczny dark"},
      {id:"neon", name:"Neon", desc:"Cyber / neon"},
      {id:"cozy", name:"Cozy", desc:"Ciepły dark"},
      {id:"aurora", name:"Aurora", desc:"Zorza / gradient"},
      {id:"ember", name:"Ember", desc:"Czerwony żar"},
      {id:"synthwave", name:"Synthwave", desc:"Róż/fiolet + siatka"},
      {id:"terminal", name:"Terminal", desc:"Zielony CRT"},
      {id:"paper", name:"Paper", desc:"Jasny minimalistyczny"},
      {id:"ocean", name:"Ocean", desc:"Niebieski, spokojny"},
    ];

    const themeChips = themes.map(t=>{
      const active = t.id===cur;
      return `<button class="themeChip ${active?"active":""}" data-themeid="${t.id}">
        <div class="themeChipName">${t.name}</div>
        <div class="themeChipDesc">${t.desc}</div>
      </button>`;
    }).join("");

    return `
      <div class="card">
        <div class="hd"><h2>Ustawienia</h2><span class="tag">UI</span></div>
        <div class="bd">
          <div class="list">
            <div class="unit">
              <div class="left"><div style="min-width:0"><div class="title"><b>Animacje reveal</b></div><div class="sub">Wyłącz = szybciej.</div></div></div>
              <div class="right"><button class="btn" id="toggleAnim">${S.settings.animations ? "ON" : "OFF"}</button></div>
            </div>

            <div class="unit">
              <div class="left"><div style="min-width:0"><div class="title"><b>Fast reveal</b></div><div class="sub">Natychmiast pokazuje karty.</div></div></div>
              <div class="right"><button class="btn" id="toggleFast">${S.settings.fastReveal ? "ON" : "OFF"}</button></div>
            </div>

            <div class="unit">
              <div class="left"><div style="min-width:0"><div class="title"><b>Dźwięki (SFX)</b></div><div class="sub">Klik, reveal, kill.</div></div></div>
              <div class="right"><button class="btn" id="toggleSfx">${S.settings.sfx ? "ON" : "OFF"}</button></div>
            </div>

            <div class="unit">
              <div class="left"><div style="min-width:0"><div class="title"><b>Głośność SFX</b></div><div class="sub">0.0–1.0</div></div></div>
              <div class="right">
                <input id="sfxVol" class="in" type="number" min="0" max="1" step="0.05" value="${S.settings.sfxVolume ?? 0.45}" style="width:110px"/>
                <button class="btn primary" id="applyVol">Zapisz</button>
              </div>
            </div>

            <div class="unit">
              <div class="left"><div style="min-width:0"><div class="title"><b>Dex: pokazuj wszystkie postacie</b></div><div class="sub">ALL = także nieposiadane.</div></div></div>
              <div class="right"><button class="btn" id="toggleDexSetting">${S.settings.showAllDex ? "ON" : "OFF"}</button></div>
            </div>

            <div class="unit">
              <div class="left"><div style="min-width:0"><div class="title"><b>Wish FX</b></div><div class="sub">Classic / Portal 2D / Portal 3D (Three.js)</div></div></div>
              <div class="right"><button class="btn" id="toggleWishFx">${(() => {
                const v = S.settings.wishFx || "portal3d";
                return v === "classic" ? "Classic" : (v === "portal3d" ? "Portal 3D" : "Portal 2D");
              })()}</button></div>
            </div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-top:12px">
        <div class="hd"><h2>Motywy</h2><span class="tag">${themes.find(x=>x.id===cur)?.name || cur}</span></div>
        <div class="bd">
          <div class="small muted" style="margin-bottom:10px">Kliknij motyw, aby zmienić wygląd gry (to są mocno różne style, nie tylko kolory).</div>
          <div class="themeGrid">${themeChips}</div>
        </div>
      </div>

      <div class="card" style="margin-top:12px">
        <div class="hd"><h2>Zapis gry</h2><span class="tag warn">Uwaga</span></div>
        <div class="bd">
          <div class="muted">Reset czyści zapis <b>tego konta online</b> (w chmurze). Nie da się tego cofnąć.</div>
          <div class="row" style="margin-top:10px">
            <button class="btn danger" id="resetBtn">Reset Save</button>
          </div>
        </div>
      </div>
    `;
  }

  function wireSettings(){
    // Reset Save (przycisk istnieje tylko w zakładce Ustawienia)
    const _rb = $("#resetBtn");
    if(_rb){
      _rb.onclick = ()=>{
        if(!confirm("Na pewno zresetować zapis?")) return;
        S = defaultSave();
        toast("Zapis zresetowany.");
        save();
        applyOfflineEarnings();
        startIdleLoop();
        renderAll();
      };
    }

    $("#toggleAnim").onclick = ()=>{ S.settings.animations=!S.settings.animations; toast(`Animacje: ${S.settings.animations?"ON":"OFF"}`); save(); renderAll(); };
    $("#toggleFast").onclick = ()=>{ S.settings.fastReveal=!S.settings.fastReveal; toast(`Fast reveal: ${S.settings.fastReveal?"ON":"OFF"}`); save(); renderAll(); };
    $("#toggleSfx").onclick = ()=>{ S.settings.sfx=!S.settings.sfx; toast(`SFX: ${S.settings.sfx?"ON":"OFF"}`); save(); renderAll(); };
    $("#toggleDexSetting").onclick = ()=>{ S.settings.showAllDex=!S.settings.showAllDex; toast(`Dex ALL: ${S.settings.showAllDex?"ON":"OFF"}`); save(); renderAll(); };

    const wf = $("#toggleWishFx");
    if(wf){
      wf.onclick = ()=>{
        const order = ["classic","portal2d","portal3d"];
        const cur = S.settings.wishFx || "portal3d";
        const idx = order.indexOf(cur);
        S.settings.wishFx = order[(idx<0?0:idx+1)%order.length];
        toast(`Wish FX: ${S.settings.wishFx}`);
        save(); renderAll();
      };
    }

    // Theme chips
    document.querySelectorAll(".themeChip[data-themeid]").forEach(btn=>{
      btn.addEventListener("click", (e)=>{
        e.preventDefault();
        const id = btn.getAttribute("data-themeid") || "midnight";
        S.settings.theme = id;
        applyTheme();
        try{ sfx("theme"); }catch(e){}
        toast(`Motyw: ${S.settings.theme}`);
        save();
        renderAll();
      });
    });

    $("#applyVol").onclick = ()=>{
      const v = parseFloat($("#sfxVol").value);
      S.settings.sfxVolume = clamp(isFinite(v)?v:0.45, 0, 1);
      toast(`SFX volume: ${S.settings.sfxVolume}`);
      save(); renderAll();
    };
  }

  function renderNotes(){
    return `
      <div class="list">
        <div class="unit">
          <div class="left">
            <div style="min-width:0">

        <div class="unit">
          <div class="left">
            <div style="min-width:0">

      <div class="title"><b>mini gacha • Patch notes 1.4</b> <span class="tag">2025-12-19</span></div>
      <div class="sub">
        <b>Zmiany:</b><br/>
        • Wishowanie: nowy ekran wyników (karty) zawsze pokazuje co wypadło (nazwa/rarity/żywioł + avatar)<br/>
        • Wishowanie: poprawka – avatar nie ucina „głowy” (lepsze centrowanie i padding w kartach)<br/>
        • Wishowanie: przycisk <b>Zamknij</b> przeniesiony na dół (pod wynikami)<br/>
        • Auto Wish: dodany przycisk <b>Stop Auto</b> na ekranie wishowania (natychmiast wyłącza auto)<br/>
        • UR Limited: całkowicie nowe, bardziej dopracowane i animowane ikonki pryzmatyczne (pełne tło + skan + shimmer)<br/>
        • Sklep → Kody: dodano kod <b>prismatic</b> (+16000 gemów)
      </div>
    </div>
  </div>
</div><div class="title"><b>mini gacha • Full Build 1.2</b> <span class="tag">2025-12-19</span></div>
              <div class="sub">
                <b>Zmiany:</b><br/>
                • Minimalnie szybsze wbijanie levela konta (profil)<br/>
                • Rebirth: wymagany level profilu = 10 na pierwszy rebirth, potem +5 za każdy kolejny<br/>
                • Rebirth: od progu wymaganego lvl ≥ 50 (req) dochodzą gemy: 1000 + 250 za każdy kolejny rebirth<br/>
                • Nerf tokenów C6 (sprzedaż): R=10 💎, SR=100 💎, SSR=500 💎, UR=1000 💎<br/>
                • Limited banner: licznik czasu do zakończenia na bannerze<br/>
                • Limited banner: UR pity = 500 oraz 50/50 (przegrana → gwarancja limitowanej UR na następnym UR); pity tuning nie wpływa na LIMITED
              </div>
            </div>
          </div>
        </div>
<div class="title"><b>mini gacha • Full Build 1.1</b> <span class="tag">2025-12-19</span></div>
              <div class="sub">
                <b>Zmiany:</b><br/>
                • Synergie teamu: +5% (2 ten sam żywioł), +15% (4 ten sam żywioł), +25% (2xLegenda+2xElo żelo+2xFNAF), +50% (4x Legenda / 4x Elo żelo / 4x FNAF / 2x Limited), +100% (4x Limited)<br/>
                • Limited przenoszą się między rebirthami, ale tracą level i ascendy<br/>
                • Limited UR: domyślnie 100 mocy oraz pełna pryzmatyczna ikonka<br/>
                • Nowa animacja wish: start zawsze na niebieskim tle, po 1s zmiana tła wg najlepszej postaci (R=niebieski, SR=fiolet, SSR=złoto, UR=czerwony, UR Limited=pryzmat)<br/>
              </div>
            </div>
          </div>
        </div>

        <div class="unit">
          <div class="left">
            <div style="min-width:0">
              <div class="title"><b>mini gacha • Full Build</b> <span class="tag">2025-12-18</span></div>
              <div class="sub">
                <b>Co jest w grze:</b><br/>
                • Clicker + idle (Gold/s) + offline progress (max 8h)<br/>
                • Gacha: pull x1 / x10 (x10 gwarantuje min. SR), osobne pity dla SSR i UR<br/>
                • Pity Tuning (Rebirth perk): wizualne podświetlenie pity (SSR = złoto, UR = czerwony) + obniżanie progów (max lvl 10)<br/>
                • Bannery: Domyślny + Legenda + FNAF + Elo żelo + LIMITED (znika 1 stycznia 2026) (na bannerach żywiołów UR tylko z featured; SSR/SR/R wszędzie)<br/>
                • Kolekcja: filtry, sortowanie, podgląd posiadania, team builder bez duplikatów<br/>
                • Konstelacje C0–C6 + tokeny za duplikaty po C6<br/>
                • UR ikony: wszystkie UR czarne (jak Legenda), Limited ma pryzmatyczne ikonki<br/>
                • Animacja wish: złoty/czerwony rozbłysk pojawia się z krótkim opóźnieniem<br/>
                • Levelowanie postaci + Ascension (tier) + koszty w gold/essence/cores<br/>
                • Arena (walki na moc teamu) + progres nagród<br/>
                • Dungeon (piętra / best / nagrody) + Weekly boss<br/>
                • Daily login + Daily questy + Battle Pass + Weekly cele<br/>
                • Profil: edytowalny avatar, statystyki, nagrody za level, osiągnięcia<br/>
                • Domeny czasowe → losowe artefakty (hełm/zbroja/rękawice/buty/peleryna/pierścień)<br/>
                • Artefakty: rarity R/SR/SSR/UR, losowe staty i prefix, levelowanie i sprzedaż, sety 3/6 z bonusami<br/>
                • Sklep: waluty, oferty + zakładka Kody (sekretne kody z nagrodami, m.in. <b>rekompensatazaflasha</b> = +16000 gemów)<br/>
                • Online panel: konto, znajomi (zaproszenia), zapis w chmurze (jeśli backend działa)<br/>
              </div>
            </div>
          </div>
        </div>

        <div class="unit">
          <div class="left">
            <div style="min-width:0">
              <div class="title"><b>UR podział żywiołów</b></div>
              <div class="sub">
                • Legenda: Gucio, Arquel, Mammon, KMNT<br/>
                • Elo żelo: Bruno, Anterias, OG Kubson, Chciwy Benek<br/>
                • FNAF: Fredi, Eleven, Bonnie, William Afton<br/>
                • (xFlaShx usunięty)<br/>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ----------------------------
  // Render TOP full (wzbogacony o weekly + idle)
  // ----------------------------
  function renderTop(){
    renderTopLite();

    const wk = isoWeekKey();
    const done = (S.weekly.lastClaimWeek === wk);
    const weeklyEl = $("#weeklyStatus");
    if(weeklyEl) weeklyEl.textContent = done ? `Zrobione (${wk})` : `Dostępne (${wk}) • ${synergyText()}`;
  }

  // ----------------------------
  // FINAL router (override stub from part 3)
  // ----------------------------
  const oldRenderAll = renderAll;
  renderAll = function(){
    // keep nav active state in sync
    document.querySelectorAll('.nav .tab[data-tab]').forEach(t=>{
      t.classList.toggle('active', (t.getAttribute('data-tab')||'') === currentTab);
    });

    dailyResetIfNeeded();
    bpEnsureSeason();
    bpWeeklyResetIfNeeded();
    arenaRecalcHP();

    renderTop();

    const leftTitle = $("#leftTitle");
    const leftBody = $("#leftBody");

    if(currentTab==="banner"){
      leftTitle.textContent = "Banner";
      leftBody.innerHTML = renderBanner();
      wireBanner();
    } else if(currentTab==="collection"){
      leftTitle.textContent = "Kolekcja & Team";
      leftBody.innerHTML = renderCollection();
      wireCollection();
    } else if(currentTab==="arena"){
      leftTitle.textContent = "Arena";
      leftBody.innerHTML = renderArena();
      wireArena();
    } else if(currentTab==="pvp"){
      leftTitle.textContent = "PvP Arena";
      leftBody.innerHTML = renderPvp();
      wirePvp();
    } else if(currentTab==="dungeon"){
      leftTitle.textContent = "Dungeon";
      leftBody.innerHTML = renderDungeon();
      wireDungeon();
    } else if(currentTab==="domains"){
      leftTitle.textContent = "Domeny";
      leftBody.innerHTML = renderDomains();
      try{ wireDomains(); }catch(e){}
    } else if(currentTab==="endgame"){
      leftTitle.textContent = "Endgame";
      leftBody.innerHTML = renderEndgame();
      wireEndgame();
    } else if(currentTab==="quests"){
      leftTitle.textContent = "Daily / Battle Pass / Weekly";
      leftBody.innerHTML = renderQuestsHub();
      wireQuestsHub();
    } else if(currentTab==="shop"){
      leftTitle.textContent = "Sklep";
      leftBody.innerHTML = renderShop();
      wireShop();  } else if(currentTab==="profile"){
      leftTitle.textContent = "Profil";
      leftBody.innerHTML = renderProfile();
      wireProfile();
    } else if(currentTab==="rebirth"){
      leftTitle.textContent = "Rebirth";
      leftBody.innerHTML = renderRebirthTab();
      try{ wireRebirthTab(); }catch(e){}
    } else if(currentTab==="leaderboard"){
      leftTitle.textContent = "Leaderboard";
      leftBody.innerHTML = renderLeaderboard();
      try{ wireLeaderboard(); }catch(e){}
    } else if(currentTab==="settings"){
      leftTitle.textContent = "Ustawienia";
      leftBody.innerHTML = renderSettings();
      wireSettings();
    } else if(currentTab==="notes"){
      leftTitle.textContent = "Patch notes";
      leftBody.innerHTML = renderNotes();
    } else {
      leftTitle.textContent = "—";
      leftBody.innerHTML = `<div class="small muted">Brak widoku.</div>`;
    }

    const __dlb = $("#claimLoginBtn");
    if(__dlb) __dlb.disabled = !canClaimDailyLogin();

    // auto tutorial (new players)
    try{
      if(typeof tutorialShouldShow === "function" && tutorialShouldShow() && !__mgTutorial?.open){
        // nie odpalaj w trakcie wish overlay
        const wishing = document.body.classList.contains("wishing");
        if(!wishing) tutorialOpen();
      }
    }catch(e){}

    save();
  };


  function applyTheme(){
    const t = (S.settings && S.settings.theme) ? S.settings.theme : "midnight";
    try{
      document.documentElement.setAttribute("data-theme", t);
    }catch(e){}
  }

  // timery resetów
  updateResetTimers();
  setInterval(updateResetTimers, 1000);

  // odpal pełny render po podmianie routera
  // Expose a few helpers to `window` so online_client.js can re-render after pulling cloud save.
  try { window.renderAll = renderAll; } catch(e){}
  try { window.save = save; } catch(e){}
  applyTheme();
  try{ wireNav(); }catch(e){}
  renderAll();

})(); // end IIFE