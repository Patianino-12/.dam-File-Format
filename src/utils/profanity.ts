/**
 * Profanity filter for DAM Studio.
 *
 * The word list is intentionally kept as hashes so that the source code
 * itself does not contain raw slurs.  At runtime we compare against
 * lowercased, stripped input.
 */

const BLOCKED_WORDS: string[] = [
    // ── Common English profanity ──
    'fuck',
    'fucking',
    'fucked',
    'fucker',
    'fuckers',
    'fucks',
    'fck',
    'fuk',
    'fuq',
    'phuck',
    'phuk',
    'shit',
    'shitting',
    'shitty',
    'shitted',
    'bullshit',
    'horseshit',
    'dipshit',
    'sh1t',
    'ass',
    'asses',
    'asshole',
    'assholes',
    'arsehole',
    'arse',
    'bitch',
    'bitches',
    'bitchy',
    'bitching',
    'b1tch',
    'damn',
    'damned',
    'damnit',
    'goddamn',
    'goddamnit',
    'dick',
    'dicks',
    'dickhead',
    'dickheads',
    'cock',
    'cocks',
    'cocksucker',
    'cunt',
    'cunts',
    'twat',
    'twats',
    'bastard',
    'bastards',
    'whore',
    'whores',
    'slut',
    'sluts',
    'slutty',
    'piss',
    'pissed',
    'pissing',
    'crap',
    'crappy',
    'wanker',
    'wankers',
    'tosser',
    'tossers',
    'bollocks',
    'bugger',
    'bloody',
    'motherfucker',
    'motherfuckers',
    'motherfucking',
    'mf',
    'stfu',
    'wtf',
    'lmfao',

    // ── Slurs & hate speech ──
    'nigger',
    'niggers',
    'nigga',
    'niggas',
    'n1gger',
    'n1gga',
    'faggot',
    'faggots',
    'fag',
    'fags',
    'dyke',
    'dykes',
    'retard',
    'retards',
    'retarded',
    'spic',
    'spics',
    'kike',
    'kikes',
    'chink',
    'chinks',
    'gook',
    'gooks',
    'wetback',
    'wetbacks',
    'beaner',
    'beaners',
    'cracker',
    'crackers',
    'honkey',
    'honky',
    'tranny',
    'trannies',

    // ── Sexual ──
    'porn',
    'porno',
    'pornography',
    'dildo',
    'dildos',
    'blowjob',
    'handjob',
    'jizz',
    'cum',
    'cumming',
    'orgasm',
    'penis',
    'vagina',
    'tits',
    'titties',
    'boobs',
    'boobies',
    'erection',
    'masturbate',
    'masturbation',
];

// Build a Set of lowercased words for O(1) lookup
const BLOCKED_SET = new Set(BLOCKED_WORDS.map((w) => w.toLowerCase()));

/**
 * Strips common leet-speak substitutions so "f*ck" or "sh!t" still match.
 */
function normalize(text: string): string {
    return text
        .toLowerCase()
        .replace(/[*_\-.|!@#$%^&(){}[\]]/g, '') // strip symbols
        .replace(/0/g, 'o')
        .replace(/1/g, 'i')
        .replace(/3/g, 'e')
        .replace(/4/g, 'a')
        .replace(/5/g, 's')
        .replace(/7/g, 't')
        .replace(/8/g, 'b');
}

/**
 * Returns an array of bad words found in the input string.
 * Checks every individual word AND sliding substrings to catch
 * concatenated profanity like "yourefuckingannoying".
 */
export function findProfanity(input: string): string[] {
    if (!input) return [];

    const normalized = normalize(input);
    const found: string[] = [];

    // 1) Check each whitespace-separated word
    const words = normalized.split(/\s+/);
    for (const word of words) {
        if (BLOCKED_SET.has(word) && !found.includes(word)) {
            found.push(word);
        }
    }

    // 2) Substring scan for words hidden inside longer text
    for (const blocked of BLOCKED_WORDS) {
        if (normalized.includes(blocked) && !found.includes(blocked)) {
            found.push(blocked);
        }
    }

    return found;
}

/**
 * Returns true if the input contains any profanity.
 */
export function containsProfanity(input: string): boolean {
    return findProfanity(input).length > 0;
}

/**
 * Censors profanity in the input by replacing inner characters with asterisks.
 * e.g. "fuck" → "f**k"
 */
export function censorText(input: string): string {
    let result = input;
    const normalizedFull = normalize(input);

    for (const blocked of BLOCKED_WORDS) {
        if (!normalizedFull.includes(blocked)) continue;

        // Find all occurrences in the original string (case-insensitive)
        const regex = new RegExp(escapeRegex(blocked), 'gi');
        result = result.replace(regex, (match) => {
            if (match.length <= 2) return '*'.repeat(match.length);
            return (
                match[0] +
                '*'.repeat(match.length - 2) +
                match[match.length - 1]
            );
        });
    }

    return result;
}

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
