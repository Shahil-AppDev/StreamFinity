/**
 * CrowdControl Game Engine
 * Individual game logic for all 18 game types
 */

const ccConfig = require('../../config/crowdcontrol');

class GameEngine {

    // ── ROULETTE ──
    static rouletteSpin(betAmount) {
        const cfg = ccConfig.games.roulette.config;
        const segments = cfg.segments;
        const totalWeight = segments.reduce((s, seg) => s + seg.weight, 0);
        let r = Math.random() * totalWeight;
        let winning = segments[segments.length - 1];
        for (const seg of segments) {
            r -= seg.weight;
            if (r <= 0) { winning = seg; break; }
        }
        const won = winning.value > 0;
        const prize = won ? Math.round(winning.value * (betAmount / cfg.minBet)) : 0;
        return { won, prize, segment: winning, spinAngle: Math.random() * 360 + 720, animation: won ? 'gold_confetti' : 'none' };
    }

    // ── DICE ──
    static diceRoll(prediction, betAmount) {
        const cfg = ccConfig.games.dice.config;
        const dice = Array.from({ length: cfg.diceCount }, () => Math.floor(Math.random() * cfg.sides) + 1);
        const total = dice.reduce((s, d) => s + d, 0);
        const maxTotal = cfg.diceCount * cfg.sides;
        const mid = maxTotal / 2;
        let result;
        if (prediction === 'over_under') result = total > mid ? 'over' : 'under';
        else if (prediction === 'exact') result = String(total);
        else result = total > mid ? 'high' : 'low';

        const won = (prediction === 'high' && total > mid) || (prediction === 'low' && total <= mid)
            || (prediction === 'over' && total > mid) || (prediction === 'under' && total <= mid)
            || (prediction === String(total));
        const multiplier = prediction === String(total) ? 6.0 : 1.9;
        const prize = won ? Math.round(betAmount * multiplier) : 0;
        return { dice, total, result, won, prize, multiplier: won ? multiplier : 0 };
    }

    // ── SLOTS ──
    static slotsSpin(betAmount) {
        const cfg = ccConfig.games.slots.config;
        const symbols = cfg.symbols;
        const reels = Array.from({ length: cfg.reels }, () => symbols[Math.floor(Math.random() * symbols.length)]);
        const combo = reels.join('');
        let prize = 0;
        let bonus = null;
        for (const [pattern, mult] of Object.entries(cfg.payouts)) {
            if (combo === pattern) { prize = mult * betAmount; bonus = mult >= 50 ? 'jackpot' : 'win'; break; }
        }
        // Two matching
        if (!prize && reels[0] === reels[1]) { prize = Math.round(betAmount * 1.5); }
        return { reels, combo, won: prize > 0, prize, bonus, winLines: prize > 0 ? [{ symbols: combo, win: prize }] : [] };
    }

    // ── CARD DRAW ──
    static cardDraw() {
        const suits = ['♠', '♥', '♦', '♣'];
        const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
        const deck = [];
        for (const s of suits) for (const r of ranks) deck.push({ rank: r, suit: s, value: ranks.indexOf(r) + 2 });
        // Shuffle
        for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
        const hand = deck.slice(0, 5);
        const values = hand.map(c => c.value).sort((a, b) => b - a);
        let handRank = 'high_card';
        let points = values[0];
        const counts = {};
        values.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
        const pairs = Object.values(counts).filter(c => c === 2).length;
        const trips = Object.values(counts).filter(c => c === 3).length;
        const quads = Object.values(counts).filter(c => c === 4).length;
        if (quads) { handRank = 'four_of_a_kind'; points = 800; }
        else if (trips && pairs) { handRank = 'full_house'; points = 600; }
        else if (trips) { handRank = 'three_of_a_kind'; points = 300; }
        else if (pairs === 2) { handRank = 'two_pair'; points = 200; }
        else if (pairs === 1) { handRank = 'pair'; points = 100; }
        return { hand, handRank, points };
    }

    // ── COIN FLIP ──
    static coinFlip(choice) {
        const result = Math.random() < 0.5 ? 'heads' : 'tails';
        const won = choice === result;
        return { result, choice, won, multiplier: won ? 1.9 : 0 };
    }

    // ── TRIVIA ──
    static triviaQuestions = {
        gaming: [
            { q: 'Quel jeu a vendu le plus d\'exemplaires?', options: ['Minecraft', 'GTA V', 'Tetris', 'Wii Sports'], answer: 0, difficulty: 'easy' },
            { q: 'En quelle année est sorti Fortnite Battle Royale?', options: ['2016', '2017', '2018', '2019'], answer: 1, difficulty: 'medium' },
            { q: 'Quel studio a créé The Witcher 3?', options: ['Bethesda', 'CD Projekt Red', 'BioWare', 'Rockstar'], answer: 1, difficulty: 'medium' },
            { q: 'Combien de Pokémon dans la 1ère génération?', options: ['150', '151', '152', '149'], answer: 1, difficulty: 'easy' },
            { q: 'Quel est le vrai nom de Mario?', options: ['Mario Mario', 'Mario Luigi', 'Mario Jumpman', 'Mario Bros'], answer: 0, difficulty: 'hard' },
        ],
        music: [
            { q: 'Qui a chanté "Bohemian Rhapsody"?', options: ['The Beatles', 'Queen', 'Led Zeppelin', 'Pink Floyd'], answer: 1, difficulty: 'easy' },
            { q: 'En quelle année est sorti "Thriller" de Michael Jackson?', options: ['1980', '1982', '1984', '1986'], answer: 1, difficulty: 'medium' },
            { q: 'Quel instrument joue Jimi Hendrix?', options: ['Batterie', 'Basse', 'Guitare', 'Piano'], answer: 2, difficulty: 'easy' },
        ],
        movies: [
            { q: 'Qui a réalisé Inception?', options: ['Spielberg', 'Nolan', 'Scorsese', 'Tarantino'], answer: 1, difficulty: 'easy' },
            { q: 'Combien de films Harry Potter?', options: ['7', '8', '9', '6'], answer: 1, difficulty: 'easy' },
            { q: 'Quel film a gagné le plus d\'Oscars?', options: ['Titanic', 'Ben-Hur', 'Le Seigneur des Anneaux', 'Les trois ex-aequo'], answer: 3, difficulty: 'hard' },
        ],
        science: [
            { q: 'Quelle planète est la plus proche du Soleil?', options: ['Vénus', 'Mercure', 'Mars', 'Terre'], answer: 1, difficulty: 'easy' },
            { q: 'Quel est le symbole chimique de l\'or?', options: ['Or', 'Au', 'Ag', 'Go'], answer: 1, difficulty: 'easy' },
            { q: 'Combien d\'os dans le corps humain adulte?', options: ['196', '206', '216', '226'], answer: 1, difficulty: 'medium' },
        ],
        history: [
            { q: 'En quelle année a eu lieu la Révolution française?', options: ['1776', '1789', '1799', '1804'], answer: 1, difficulty: 'easy' },
            { q: 'Qui a peint la Joconde?', options: ['Michel-Ange', 'Raphaël', 'Léonard de Vinci', 'Botticelli'], answer: 2, difficulty: 'easy' },
        ]
    };

    static getTrivia(category, difficulty) {
        const cats = category && GameEngine.triviaQuestions[category] ? [category] : Object.keys(GameEngine.triviaQuestions);
        const pool = cats.flatMap(c => GameEngine.triviaQuestions[c]);
        const filtered = difficulty ? pool.filter(q => q.difficulty === difficulty) : pool;
        const list = filtered.length > 0 ? filtered : pool;
        const q = list[Math.floor(Math.random() * list.length)];
        const id = 'q_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
        return { id, question: q.q, options: q.options, timeLimit: 20, points: { easy: 50, medium: 100, hard: 200 }[q.difficulty] || 100, _answer: q.answer, difficulty: q.difficulty };
    }

    static checkTriviaAnswer(question, answerIndex, timeTaken) {
        const correct = answerIndex === question._answer;
        const timeBonus = correct ? Math.max(0, Math.round((20000 - timeTaken) / 200)) : 0;
        const points = correct ? question.points + timeBonus : 0;
        return { correct, points, timeBonus, correctAnswer: question._answer };
    }

    // ── REACTION TIME ──
    static reactionStart() {
        const waitTime = 1000 + Math.floor(Math.random() * 4000);
        const sessionId = 'rt_' + Date.now();
        return { sessionId, waitTime, targetColor: '#ff0000', startedAt: Date.now() };
    }

    static reactionClick(startedAt, waitTime, clickTime) {
        const expectedGo = startedAt + waitTime;
        const reactionTime = clickTime - expectedGo;
        if (reactionTime < 0) return { reactionTime: -1, points: 0, rank: 'too_early', valid: false };
        let rank, points;
        if (reactionTime < 200) { rank = 'excellent'; points = 100; }
        else if (reactionTime < 400) { rank = 'good'; points = 50; }
        else if (reactionTime < 800) { rank = 'ok'; points = 25; }
        else { rank = 'slow'; points = 10; }
        return { reactionTime, points, rank, valid: true };
    }

    // ── TARGET CLICK ──
    static targetClickGenerate(count = 20) {
        const targets = [];
        for (let i = 0; i < count; i++) {
            targets.push({
                id: i, x: Math.random() * 90 + 5, y: Math.random() * 80 + 10,
                size: 30 + Math.floor(Math.random() * 50), delay: i * 1200 + Math.random() * 500
            });
        }
        return { targets, timeLimit: 30000 };
    }

    // ── WORD GUESS ──
    static wordGuessWords = {
        animals: ['ELEPHANT', 'GIRAFFE', 'DOLPHIN', 'PENGUIN', 'PANTHER', 'CHEETAH', 'BUFFALO', 'OCTOPUS'],
        countries: ['FRANCE', 'JAPAN', 'BRAZIL', 'CANADA', 'GERMANY', 'AUSTRALIA', 'MEXICO', 'SWEDEN'],
        movies: ['AVATAR', 'TITANIC', 'INCEPTION', 'GLADIATOR', 'INTERSTELLAR', 'MATRIX'],
        games: ['MINECRAFT', 'FORTNITE', 'VALORANT', 'OVERWATCH', 'CYBERPUNK', 'SKYRIM']
    };

    static wordGuessNew(category) {
        const cats = category && GameEngine.wordGuessWords[category] ? [category] : Object.keys(GameEngine.wordGuessWords);
        const pool = cats.flatMap(c => GameEngine.wordGuessWords[c]);
        const word = pool[Math.floor(Math.random() * pool.length)];
        const revealed = word.split('').map((c, i) => (i === 0 || Math.random() < 0.2) ? c : '_');
        return { word, hint: revealed.join(''), category: category || 'mixed', maxGuesses: 6 };
    }

    static wordGuessCheck(word, guess) {
        const correct = guess.toUpperCase() === word.toUpperCase();
        return { correct, word, points: correct ? 200 : 0 };
    }

    // ── SCRAMBLE ──
    static scrambleNew() {
        const words = ['STREAM', 'GAMING', 'PLAYER', 'REWARD', 'BATTLE', 'TROPHY', 'LEGEND', 'MASTER', 'WINNER', 'POINTS'];
        const word = words[Math.floor(Math.random() * words.length)];
        const chars = word.split('');
        for (let i = chars.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [chars[i], chars[j]] = [chars[j], chars[i]]; }
        return { scrambled: chars.join(''), word, timeLimit: 15000 };
    }

    // ── RACE GAME ──
    static raceTap(currentPos, tapMultiplier = 1) {
        const advance = (1 + Math.random() * 2) * tapMultiplier;
        return { advance: Math.round(advance * 10) / 10, newPos: Math.min(100, currentPos + advance) };
    }

    // ── CLICK BATTLE ──
    static clickBattleResult(clicks1, clicks2) {
        const winner = clicks1 > clicks2 ? 1 : clicks2 > clicks1 ? 2 : 0;
        return { player1Clicks: clicks1, player2Clicks: clicks2, winner, draw: winner === 0 };
    }

    // ── MYSTERY BOX ──
    static openMysteryBox(tier = 'standard') {
        const tables = {
            standard: [
                { type: 'coins', amount: 50, weight: 40 }, { type: 'coins', amount: 100, weight: 25 },
                { type: 'coins', amount: 250, weight: 10 }, { type: 'gems', amount: 5, weight: 15 },
                { type: 'gems', amount: 15, weight: 5 }, { type: 'xp', amount: 50, weight: 5 }
            ],
            gold: [
                { type: 'coins', amount: 200, weight: 30 }, { type: 'coins', amount: 500, weight: 20 },
                { type: 'gems', amount: 10, weight: 20 }, { type: 'gems', amount: 25, weight: 15 },
                { type: 'item', itemId: 'effect_sparkle', weight: 10 }, { type: 'xp', amount: 100, weight: 5 }
            ]
        };
        const table = tables[tier] || tables.standard;
        const totalW = table.reduce((s, r) => s + r.weight, 0);
        const rewards = [];
        for (let i = 0; i < (tier === 'gold' ? 3 : 2); i++) {
            let roll = Math.random() * totalW;
            for (const row of table) { roll -= row.weight; if (roll <= 0) { rewards.push({ ...row }); delete rewards[rewards.length - 1].weight; break; } }
        }
        const rarity = rewards.some(r => r.type === 'item') ? 'epic' : rewards.some(r => r.amount >= 200) ? 'rare' : 'common';
        return { rewards, rarity, tier };
    }

    // ── DAILY REWARD ──
    static dailyReward(streak = 0) {
        const base = { coins: 50, gems: 2, xp: 25 };
        const mult = 1 + Math.min(streak, 7) * 0.15;
        const coins = Math.round(base.coins * mult);
        const gems = Math.round(base.gems * mult);
        const xp = Math.round(base.xp * mult);
        const bonus = streak >= 7 ? 'streak_bonus' : streak >= 3 ? 'streak_small' : null;
        return { coins, gems, xp, streak: streak + 1, bonus };
    }
}

module.exports = GameEngine;
