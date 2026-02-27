/**
 * CrowdControl Configuration
 * All games, rewards, polls, progression, and shop definitions
 */

module.exports = {
    // ── Game Definitions ──
    games: {
        // Chance & Luck Games
        roulette: {
            id: 'roulette', name: 'Roulette StreamFinity', icon: '🎰', category: 'chance',
            description: 'Roue de la fortune avec prix exclusifs',
            players: { min: 1, max: 50 }, duration: 30000,
            difficulty: 'easy', xpReward: 10,
            config: {
                segments: [
                    { value: 100, color: '#10b981', label: '💰 100 Coins', weight: 25 },
                    { value: 50,  color: '#3b82f6', label: '💎 50 Gems',   weight: 15 },
                    { value: 200, color: '#8b5cf6', label: '🎁 Mystery Box', weight: 10 },
                    { value: 0,   color: '#ef4444', label: '😢 Try Again', weight: 30 },
                    { value: 500, color: '#f59e0b', label: '🏆 Jackpot!',  weight: 5 },
                    { value: 25,  color: '#06b6d4', label: '⭐ 25 XP',     weight: 15 }
                ],
                spinDuration: 3000, minBet: 10, maxBet: 1000
            }
        },
        dice: {
            id: 'dice', name: 'Dice Game', icon: '🎲', category: 'chance',
            description: 'Jeu de dés multiplayer — devinez le résultat',
            players: { min: 1, max: 20 }, duration: 20000,
            difficulty: 'easy', xpReward: 8,
            config: { diceCount: 2, sides: 6, modes: ['over_under', 'exact', 'sum'] }
        },
        slots: {
            id: 'slots', name: 'Slot Machine', icon: '🎯', category: 'chance',
            description: 'Machine à sous thématique StreamFinity',
            players: { min: 1, max: 1 }, duration: 10000,
            difficulty: 'easy', xpReward: 5,
            config: {
                reels: 3, symbols: ['🍒', '🍋', '🔔', '⭐', '💎', '7️⃣'],
                payouts: { '7️⃣7️⃣7️⃣': 100, '💎💎💎': 50, '⭐⭐⭐': 25, '🔔🔔🔔': 15, '🍒🍒🍒': 10 },
                minBet: 5, maxBet: 500
            }
        },
        cardDraw: {
            id: 'cardDraw', name: 'Card Draw', icon: '🃏', category: 'chance',
            description: 'Tirage de cartes avec récompenses',
            players: { min: 1, max: 10 }, duration: 15000,
            difficulty: 'easy', xpReward: 8,
            config: { deckSize: 52, drawCount: 5, handRanks: true }
        },
        coinFlip: {
            id: 'coinFlip', name: 'Coin Flip', icon: '💰', category: 'chance',
            description: 'Pile ou face avec mises',
            players: { min: 2, max: 2 }, duration: 10000,
            difficulty: 'easy', xpReward: 5,
            config: { sides: ['heads', 'tails'], multiplier: 1.9 }
        },

        // Knowledge Games
        trivia: {
            id: 'trivia', name: 'Trivia Challenge', icon: '🧠', category: 'knowledge',
            description: 'Quiz sur divers thèmes — testez vos connaissances',
            players: { min: 2, max: 50 }, duration: 120000,
            difficulty: 'medium', xpReward: 20,
            config: {
                categories: ['gaming', 'music', 'movies', 'science', 'history', 'sports', 'technology', 'culture'],
                questionsPerRound: 10, timePerQuestion: 20000,
                scoring: { easy: 50, medium: 100, hard: 200 }
            }
        },
        wordGuess: {
            id: 'wordGuess', name: 'Word Guess', icon: '📝', category: 'knowledge',
            description: 'Devinez le mot mystère lettre par lettre',
            players: { min: 1, max: 30 }, duration: 90000,
            difficulty: 'medium', xpReward: 15,
            config: { maxGuesses: 6, hintAfter: 3, categories: ['animals', 'countries', 'movies', 'games'] }
        },
        scramble: {
            id: 'scramble', name: 'Scramble Game', icon: '🔤', category: 'knowledge',
            description: 'Mots mélangés à retrouver — le plus rapide gagne',
            players: { min: 2, max: 30 }, duration: 60000,
            difficulty: 'medium', xpReward: 15,
            config: { wordsPerRound: 5, timePerWord: 15000 }
        },
        musicQuiz: {
            id: 'musicQuiz', name: 'Music Quiz', icon: '🎵', category: 'knowledge',
            description: 'Devinez les musiques à partir d\'extraits',
            players: { min: 2, max: 50 }, duration: 120000,
            difficulty: 'medium', xpReward: 20,
            config: { rounds: 10, clipDuration: 10000, categories: ['pop', 'rock', 'hiphop', 'electronic', 'classic'] }
        },
        movieTrivia: {
            id: 'movieTrivia', name: 'Movie Trivia', icon: '🎬', category: 'knowledge',
            description: 'Questions sur films et séries',
            players: { min: 2, max: 50 }, duration: 120000,
            difficulty: 'medium', xpReward: 20,
            config: { rounds: 10, timePerQuestion: 20000, categories: ['action', 'comedy', 'horror', 'scifi', 'anime'] }
        },

        // Action & Reflex Games
        reactionTime: {
            id: 'reactionTime', name: 'Reaction Time', icon: '⚡', category: 'action',
            description: 'Testez vos réflexes — le plus rapide gagne',
            players: { min: 2, max: 50 }, duration: 60000,
            difficulty: 'easy', xpReward: 12,
            config: {
                rounds: 5, waitTime: { min: 1000, max: 5000 },
                scoring: { excellent: { max: 200, points: 100 }, good: { max: 400, points: 50 }, ok: { max: 800, points: 25 }, slow: { points: 10 } }
            }
        },
        targetClick: {
            id: 'targetClick', name: 'Target Click', icon: '🎯', category: 'action',
            description: 'Cliquez sur les cibles le plus vite possible',
            players: { min: 1, max: 20 }, duration: 30000,
            difficulty: 'easy', xpReward: 10,
            config: { targets: 20, targetSize: { min: 30, max: 80 }, timeLimit: 30000 }
        },
        raceGame: {
            id: 'raceGame', name: 'Race Game', icon: '🏃', category: 'action',
            description: 'Course de tap — tapez le plus vite possible',
            players: { min: 2, max: 10 }, duration: 15000,
            difficulty: 'easy', xpReward: 10,
            config: { distance: 100, tapMultiplier: 1 }
        },
        clickBattle: {
            id: 'clickBattle', name: 'Click Battle', icon: '🔥', category: 'action',
            description: 'Bataille de clics — qui clique le plus en 10 secondes?',
            players: { min: 2, max: 2 }, duration: 10000,
            difficulty: 'easy', xpReward: 8,
            config: { duration: 10000 }
        },
        battleRoyale: {
            id: 'battleRoyale', name: 'Battle Royale', icon: '⚔️', category: 'action',
            description: 'Tournoi éliminatoire — dernier survivant gagne',
            players: { min: 4, max: 50 }, duration: 300000,
            difficulty: 'hard', xpReward: 50,
            config: { rounds: 'auto', eliminationPerRound: 0.5, finalShowdown: true }
        },

        // Community Games
        teamChallenge: {
            id: 'teamChallenge', name: 'Team Challenge', icon: '👥', category: 'community',
            description: 'Défis d\'équipe — collaborez pour gagner',
            players: { min: 4, max: 50 }, duration: 180000,
            difficulty: 'medium', xpReward: 25,
            config: { teamsCount: 2, challengeTypes: ['trivia', 'speed', 'creativity'] }
        },
        tournament: {
            id: 'tournament', name: 'Tournament', icon: '🏆', category: 'community',
            description: 'Tournoi à élimination directe',
            players: { min: 4, max: 32 }, duration: 600000,
            difficulty: 'hard', xpReward: 50,
            config: { format: 'single_elimination', seedByRank: true }
        },
        eventGames: {
            id: 'eventGames', name: 'Event Games', icon: '🎪', category: 'community',
            description: 'Jeux d\'événements spéciaux et saisonniers',
            players: { min: 2, max: 100 }, duration: 300000,
            difficulty: 'medium', xpReward: 30,
            config: { seasonal: true, specialRewards: true }
        }
    },

    // ── Game Categories ──
    categories: {
        chance:    { label: 'Chance & Luck', icon: '🎰', color: '#f59e0b' },
        knowledge: { label: 'Knowledge',     icon: '🧠', color: '#3b82f6' },
        action:    { label: 'Action & Reflex', icon: '⚡', color: '#ef4444' },
        community: { label: 'Community',     icon: '👥', color: '#8b5cf6' }
    },

    // ── Currency System ──
    currency: {
        coins: { name: 'StreamCoins', symbol: '🪙', maxBalance: 999999 },
        gems:  { name: 'StreamGems',  symbol: '💎', maxBalance: 99999, coinValue: 100 }
    },

    // ── XP & Progression ──
    progression: {
        maxLevel: 100,
        xpPerLevel: 1000,
        xpMultiplier: 1.15, // each level needs 15% more XP
        levelBonuses: {
            5:   { coins: 100,  label: '🎁 100 Coins Bonus' },
            10:  { coins: 250,  item: 'avatar_pro', label: '🎁 Avatar Pro' },
            15:  { gems: 10,    label: '💎 10 Gems' },
            25:  { gems: 50,    item: 'frame_golden', label: '💎 50 Gems + Golden Frame' },
            50:  { gems: 100,   item: 'badge_veteran', label: '🏆 Badge Vétéran' },
            75:  { gems: 200,   item: 'effect_fire', label: '🌟 Effet Feu' },
            100: { gems: 500,   item: 'badge_legend', label: '👑 Légende StreamFinity' }
        }
    },

    // ── Achievements ──
    achievements: [
        { id: 'first_win',       name: 'First Win',       icon: '🏅', desc: 'Gagnez votre premier jeu', xp: 50 },
        { id: 'lucky_seven',     name: 'Lucky Seven',     icon: '🍀', desc: 'Gagnez 7 fois d\'affilée', xp: 200 },
        { id: 'trivia_master',   name: 'Trivia Master',   icon: '🧠', desc: 'Répondez à 100 questions correctement', xp: 300 },
        { id: 'speed_demon',     name: 'Speed Demon',     icon: '⚡', desc: 'Temps de réaction < 150ms', xp: 150 },
        { id: 'community_hero',  name: 'Community Hero',  icon: '👥', desc: 'Participez à 50 jeux communautaires', xp: 250 },
        { id: 'tournament_champ',name: 'Tournament Champ', icon: '🏆', desc: 'Gagnez un tournoi', xp: 500 },
        { id: 'high_roller',     name: 'High Roller',     icon: '💰', desc: 'Misez 10 000 coins au total', xp: 200 },
        { id: 'collector',       name: 'Collector',        icon: '🎨', desc: 'Possédez 10 items', xp: 150 },
        { id: 'social_butterfly',name: 'Social Butterfly', icon: '🦋', desc: 'Jouez avec 100 joueurs différents', xp: 200 },
        { id: 'streak_master',   name: 'Streak Master',   icon: '🔥', desc: 'Jouez 30 jours consécutifs', xp: 500 }
    ],

    // ── Shop Items ──
    shop: {
        avatars: [
            { id: 'default',   name: 'Défaut',      rarity: 'common',    cost: 0,    currency: 'coins' },
            { id: 'pro',       name: 'Pro Player',   rarity: 'rare',      cost: 500,  currency: 'coins' },
            { id: 'diamond',   name: 'Diamant',      rarity: 'epic',      cost: 1000, currency: 'coins' },
            { id: 'legendary', name: 'Légendaire',   rarity: 'legendary', cost: 50,   currency: 'gems' },
            { id: 'cosmic',    name: 'Cosmique',     rarity: 'legendary', cost: 100,  currency: 'gems' }
        ],
        frames: [
            { id: 'basic',   name: 'Basique',  rarity: 'common',    cost: 0,    currency: 'coins' },
            { id: 'silver',  name: 'Argent',   rarity: 'rare',      cost: 300,  currency: 'coins' },
            { id: 'golden',  name: 'Or',       rarity: 'epic',      cost: 800,  currency: 'coins' },
            { id: 'diamond', name: 'Diamant',  rarity: 'legendary', cost: 30,   currency: 'gems' }
        ],
        effects: [
            { id: 'sparkle', name: 'Étincelles', rarity: 'rare',      cost: 400,  currency: 'coins' },
            { id: 'fire',    name: 'Feu',        rarity: 'epic',      cost: 20,   currency: 'gems' },
            { id: 'ice',     name: 'Glace',      rarity: 'epic',      cost: 20,   currency: 'gems' },
            { id: 'thunder', name: 'Tonnerre',   rarity: 'legendary', cost: 50,   currency: 'gems' },
            { id: 'galaxy',  name: 'Galaxie',    rarity: 'legendary', cost: 80,   currency: 'gems' }
        ],
        badges: [
            { id: 'veteran',   name: 'Vétéran',    rarity: 'rare',      cost: 200,  currency: 'coins' },
            { id: 'winner',    name: 'Winner',      rarity: 'epic',      cost: 500,  currency: 'coins' },
            { id: 'moderator', name: 'Modérateur',  rarity: 'epic',      cost: 0,    currency: 'coins', special: true },
            { id: 'legend',    name: 'Légende',     rarity: 'legendary', cost: 100,  currency: 'gems' }
        ]
    },

    // ── Poll Types ──
    polls: {
        standard:   { label: 'Standard',      duration: 60000,  maxOptions: 6, showResults: 'after_vote' },
        weighted:   { label: 'Vote Pondéré',   duration: 120000, maxOptions: 4, weights: { coins: 1, gems: 10 } },
        realtime:   { label: 'Temps Réel',     duration: 30000,  maxOptions: 6, liveResults: true, animated: true },
        tournament: { label: 'Tournoi',        rounds: 3, elimination: true, finalShowdown: true }
    },

    // ── Server Limits ──
    limits: {
        maxConcurrentGames: 100,
        maxPlayersPerGame: 50,
        gameTimeout: 300000,
        cleanupInterval: 60000,
        maxBet: 1000,
        minLevel: 1,
        rateLimit: { windowMs: 60000, max: 100 }
    },

    // ── Rarity Colors ──
    rarityColors: {
        common:    '#9ca3af',
        rare:      '#3b82f6',
        epic:      '#8b5cf6',
        legendary: '#f59e0b'
    }
};
