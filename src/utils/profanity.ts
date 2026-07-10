/**
 * Profanity filter for DAM Studio.
 *
 * Covers English, Italian, Spanish, French, German, Portuguese,
 * religious blasphemy, slurs, and common leet-speak evasions.
 */

const BLOCKED_WORDS: string[] = [
    // ════════════════════════════════════════
    //  ENGLISH — General profanity
    // ════════════════════════════════════════
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
    'douchebag',
    'douchebags',
    'jackass',
    'prick',
    'pricks',
    'scumbag',
    'scumbags',
    'skank',
    'skanky',
    'hellhole',
    'sonofabitch',
    'sob',

    // ════════════════════════════════════════
    //  ENGLISH — Slurs & hate speech
    // ════════════════════════════════════════
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
    'coon',
    'coons',
    'darkie',
    'darkies',
    'raghead',
    'ragheads',
    'towelhead',
    'towelheads',
    'zipperhead',
    'halfbreed',
    'mongrel',
    'negro',
    'negros',
    'chinaman',
    'paki',
    'pakis',
    'jap',
    'japs',
    'kraut',
    'krauts',
    'wop',
    'wops',
    'dago',
    'dagos',
    'polack',
    'polacks',
    'gringo',
    'gringos',

    // ════════════════════════════════════════
    //  ENGLISH — Sexual
    // ════════════════════════════════════════
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
    'cumshot',
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
    'hentai',
    'milf',
    'boner',
    'buttplug',
    'deepthroat',
    'gangbang',
    'orgy',
    'queef',
    'rimjob',
    'sexting',

    // ════════════════════════════════════════
    //  ENGLISH — Religious blasphemy
    // ════════════════════════════════════════
    'goddamn',
    'goddamnit',
    'goddamned',
    'goddam',
    'jesusf',
    'jesusfuck',
    'jesusfucking',
    'jesuschrist',
    'christsake',
    'holyfuck',
    'holyshit',
    'helldamn',
    'godforsaken',
    'blaspheme',
    'blasphemy',
    'sacrilege',
    'sacrilegious',
    'heathen',
    'infidel',
    'infidels',
    'heretic',
    'heretics',
    'godless',

    // ════════════════════════════════════════
    //  ITALIAN — Profanity & blasphemy
    // ════════════════════════════════════════
    'cazzo', // dick/fuck
    'cazzi',
    'minchia', // dick (Sicilian)
    'vaffanculo', // fuck off
    'fanculo',
    'affanculo',
    'stronzo', // asshole
    'stronza',
    'stronzi',
    'stronze',
    'merda', // shit
    'merdoso',
    'merdosa',
    'coglione', // idiot/balls
    'coglioni',
    'cogliona',
    'puttana', // whore
    'puttane',
    'puttaniere',
    'troia', // slut
    'troie',
    'troione',
    'bastardo', // bastard
    'bastarda',
    'bastardi',
    'figlio di puttana', // son of a whore
    'figlia di puttana',
    'culo', // ass
    'culone',
    'sega', // wank
    'seghe',
    'pompino', // blowjob
    'pompini',
    'scopare', // to fuck
    'scopata',
    'incazzato', // pissed off
    'incazzata',
    'cornuto', // cuckold
    'cornuta',
    'porco dio', // blasphemy (pig god)
    'porcodio',
    'porca madonna', // blasphemy
    'porcamadonna',
    'dio cane', // blasphemy (god dog)
    'diocane',
    'orco dio',
    'orcodio',
    'madonna puttana',
    'madonnaputtana',
    'dio bestia',
    'diobestia',
    'dio porco',
    'dioporco',
    'porco giuda',
    'mannaggia',
    'cristo', // used as a swear
    'cretino', // moron
    'cretina',
    'cretini',
    'idiota',
    'imbecille',

    // ════════════════════════════════════════
    //  SPANISH — Profanity & blasphemy
    // ════════════════════════════════════════
    'mierda', // shit
    'mierdas',
    'puta', // whore
    'putas',
    'puto',
    'putos',
    'hijo de puta', // son of a whore
    'hija de puta',
    'hijueputa',
    'hijoputa',
    'coño', // cunt/damn
    'cono',
    'joder', // fuck
    'jodido',
    'jodida',
    'cabrón', // bastard
    'cabron',
    'cabrona',
    'cabrones',
    'pendejo', // asshole
    'pendeja',
    'pendejos',
    'pendejas',
    'culero', // asshole
    'culera',
    'chingar', // to fuck
    'chingada',
    'chingado',
    'chingón',
    'chingon',
    'pinche', // damn/fucking
    'verga', // dick
    'vergas',
    'vergudo',
    'mamón', // sucker
    'mamon',
    'mamona',
    'culo', // ass (also IT)
    'nalgas',
    'huevón', // lazy/balls
    'huevon',
    'güey', // (insult, colloquial)
    'guey',
    'maricón', // faggot
    'maricon',
    'maricona',
    'marica',
    'zorra', // bitch/fox
    'zorras',
    'polla', // dick (Spain)
    'pollas',
    'hostia', // blasphemy (host/communion)
    'hostias',
    'hostia puta',
    'me cago en dios', // blasphemy
    'mecagoen',
    'blasfemia',
    'carajo', // damn
    'carajos',
    'cojones', // balls
    'cojón',
    'cojon',
    'concha', // cunt (Latin America)
    'conchatumadre',
    'concha de tu madre',
    'malparido',
    'malparida',
    'gonorrea', // insult (Colombia)

    // ════════════════════════════════════════
    //  FRENCH — Profanity & blasphemy
    // ════════════════════════════════════════
    'merde', // shit
    'merdes',
    'merdeux',
    'merdeuse',
    'putain', // fuck/whore
    'pute', // whore
    'putes',
    'fils de pute', // son of a whore
    'filsdepute',
    'salaud', // bastard
    'salauds',
    'salope', // slut
    'salopes',
    'connard', // asshole
    'connards',
    'connasse',
    'connasses',
    'enculé', // fucked (ass)
    'encule',
    'enculer',
    'nique', // fuck
    'niquer',
    'nique ta mère',
    'niquetamere',
    'ntm',
    'baise', // fuck
    'baiser',
    'foutre', // fuck/cum
    'va te faire foutre',
    'bordel', // brothel/damn
    'bordel de merde',
    'bite', // dick
    'bites',
    'couille', // ball
    'couilles',
    'con', // cunt/idiot
    'conne',
    'enfoiré', // bastard
    'enfoire',
    'enfoirée',
    'enfoiree',
    'branleur', // wanker
    'branleurs',
    'branleuse',
    'branler',
    'chier', // to shit
    'chiasse',
    'chieur',
    'chieuse',
    'dégueulasse', // disgusting
    'degueulasse',
    'ta gueule', // shut up
    'tagueule',
    'ferme ta gueule',
    'nom de dieu', // blasphemy
    'nomdedieu',
    'sacré bleu', // blasphemy (archaic)
    'sacrebleu',
    'sacré nom',
    'tabernacle', // blasphemy (Québec)
    'tabarnak',
    'câlice', // blasphemy (Québec)
    'calice',
    'crisse', // blasphemy (Québec)
    'ostie', // blasphemy (Québec)
    'osti',
    'ciboire', // blasphemy (Québec)
    'sacrament', // blasphemy (Québec)

    // ════════════════════════════════════════
    //  GERMAN — Profanity & blasphemy
    // ════════════════════════════════════════
    'scheiße', // shit
    'scheisse',
    'scheiss',
    'scheiß',
    'dreck', // dirt/crap
    'dreckig',
    'drecksau',
    'arschloch', // asshole
    'arschlöcher',
    'arschlocher',
    'arsch', // ass
    'fick', // fuck
    'ficken',
    'ficker',
    'gefickt',
    'verfickt',
    'hurensohn', // son of a whore
    'hurensöhne',
    'hure', // whore
    'huren',
    'nutte', // whore
    'nutten',
    'fotze', // cunt
    'fotzen',
    'wichser', // wanker
    'wichsen',
    'schwanz', // dick
    'schwänze',
    'schlampe', // slut
    'schlampen',
    'miststück', // bitch
    'miststuck',
    'mistkerl',
    'dummkopf', // idiot
    'depp', // idiot
    'trottel', // fool
    'vollidiот',
    'vollidiot',
    'idiot',
    'blödmann',
    'blodmann',
    'blöd',
    'blod',
    'saukerl',
    'schweinehund', // pig-dog
    'gotterdammerung', // blasphemy-adjacent
    'gottverdammt', // goddamn
    'verdammt', // damn
    'verflucht', // cursed/damn
    'herrgott', // lord god (blasphemy)
    'herrgottnochmal',
    'kreuzfix', // blasphemy (Bavarian)
    'sakrament', // blasphemy
    'himmelherrgott',
    'kruzifix',

    // ════════════════════════════════════════
    //  PORTUGUESE — Profanity & blasphemy
    // ════════════════════════════════════════
    'merda', // shit (also IT)
    'bosta', // shit
    'porra', // fuck/cum
    'caralho', // dick/fuck
    'caralhos',
    'foda', // fuck
    'foder',
    'fodido',
    'fodida',
    'fodase',
    'foda-se', // fuck it
    'puta', // whore (also ES)
    'putas',
    'filho da puta', // son of a whore
    'filha da puta',
    'filhodaputa',
    'corno', // cuckold
    'corna',
    'viado', // faggot
    'veado',
    'arrombado', // asshole
    'arrombada',
    'buceta', // cunt
    'boceta',
    'piroca', // dick
    'pau', // dick
    'rola', // dick
    'cu', // ass
    'cuzão',
    'cuzao',
    'babaca', // idiot
    'otário', // sucker
    'otario',
    'otária',
    'otaria',
    'desgraçado', // wretched
    'desgracado',
    'desgraçada',
    'desgracada',
    'vagabundo', // bum/slut
    'vagabunda',
    'sacana', // bastard
    'punheta', // handjob
    'punheteiro',

    // ════════════════════════════════════════
    //  DUTCH
    // ════════════════════════════════════════
    'godverdomme', // goddamn
    'verdomme', // damn
    'klootzak', // asshole
    'lul', // dick
    'kut', // cunt
    'hoer', // whore
    'kanker', // cancer (used as insult)
    'tering', // tuberculosis (insult)
    'tyfus', // typhus (insult)
    'mongool', // slur
    'mof', // slur for Germans

    // ════════════════════════════════════════
    //  POLISH
    // ════════════════════════════════════════
    'kurwa', // whore/fuck
    'kurwy',
    'kurde',
    'cholera', // damn
    'pierdolić',
    'pierdolic',
    'pierdol',
    'jebać',
    'jebac',
    'jebany',
    'dupa', // ass
    'dupek',
    'skurwysyn', // son of a whore
    'suka', // bitch
    'chuj', // dick
    'cipa', // cunt
    'spierdalaj', // fuck off
    'zasraniec', // shithead
    'kurwa mać',
    'kurwamac',

    // ════════════════════════════════════════
    //  RUSSIAN (transliterated)
    // ════════════════════════════════════════
    'blyad', // whore
    'blyat',
    'suka', // bitch (also PL)
    'pizdec', // fucked
    'pizda', // cunt
    'huy', // dick
    'hui',
    'ebat', // to fuck
    'yebat',
    'nahui', // to the dick
    'nahuy',
    'mudak', // asshole
    'mudilo',
    'gandon', // condom (insult)
    'debil', // moron
    'zalupa', // dickhead
    'perdun', // old fart

    // ════════════════════════════════════════
    //  JAPANESE (romaji)
    // ════════════════════════════════════════
    'kuso', // shit/damn
    'chikusho', // damn it
    'baka', // idiot
    'aho', // idiot
    'kisama', // bastard (you)
    'temee', // bastard (you)
    'yarichin', // manwhore
    'yariman', // slut
    'ketsu', // ass
    'chinpo', // dick
    'manko', // cunt
    'shimatta', // damn

    // ════════════════════════════════════════
    //  ARABIC (transliterated)
    // ════════════════════════════════════════
    'kuss', // cunt
    'kos',
    'sharmouta', // whore
    'sharmout',
    'sharmuta',
    'ibn el sharmouta',
    'kalb', // dog (insult)
    'himar', // donkey (insult)
    'ibn el kalb', // son of a dog
    'zibbi', // my dick
    'ayreh', // my dick
    'telhas teezi', // lick my ass
    'kol khara', // eat shit

    // ════════════════════════════════════════
    //  TURKISH
    // ════════════════════════════════════════
    'siktir', // fuck off
    'siktirgit',
    'amina', // to your cunt
    'orospu', // whore
    'orospu çocuğu',
    'orospu cocugu',
    'piç', // bastard
    'pic',
    'yarrak', // dick
    'göt', // ass
    'got',
    'pezevenk', // pimp

    // ════════════════════════════════════════
    //  KOREAN (romanized)
    // ════════════════════════════════════════
    'shibal', // fuck
    'ssibal',
    'jot', // dick
    'gaesaekki', // son of a bitch
    'byungshin', // cripple (insult)
    'michin', // crazy (insult)
    'nom', // bastard

    // ════════════════════════════════════════
    //  HINDI / URDU (transliterated)
    // ════════════════════════════════════════
    'chutiya', // idiot/cunt
    'chutiye',
    'madarchod', // motherfucker
    'behenchod', // sisterfucker
    'bhenchod',
    'gaand', // ass
    'gandu', // idiot (ass-related)
    'lund', // dick
    'lauda', // dick
    'randi', // whore
    'harami', // bastard
    'haramzada', // bastard
    'bhosdike', // born of a cunt
    'sala', // brother-in-law (insult)
    'saala',
    'kutta', // dog (insult)
    'kutti', // bitch (dog)
    'ullu', // owl (idiot)

    // ════════════════════════════════════════
    //  CHINESE (pinyin)
    // ════════════════════════════════════════
    'tama', // damn (他妈)
    'tamade', // his mother's (他妈的)
    'cao', // fuck (肏)
    'caonima', // fuck your mother
    'shabi', // stupid cunt
    'niubi',
    'gou ri de', // dog-born
    'wangbadan', // bastard (王八蛋)
    'hundan', // bastard (混蛋)
    'bendan', // idiot (笨蛋)
];

// Build a Set of lowercased words for O(1) lookup
const BLOCKED_SET = new Set(BLOCKED_WORDS.map((w) => w.toLowerCase()));

/**
 * Strips common leet-speak substitutions and diacritics
 * so "f*ck", "sh!t", "café" → "cafe" still match.
 */
function normalize(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // strip accents
        .replace(/[*_\-.|!@#$%^&(){}[\]<>~`'"]/g, '') // strip symbols
        .replace(/0/g, 'o')
        .replace(/1/g, 'i')
        .replace(/3/g, 'e')
        .replace(/4/g, 'a')
        .replace(/5/g, 's')
        .replace(/7/g, 't')
        .replace(/8/g, 'b')
        .replace(/ß/g, 'ss'); // German eszett
}

// Pre-normalize blocked words once
const BLOCKED_NORMALIZED = BLOCKED_WORDS.map((w) => normalize(w));

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
    for (let i = 0; i < BLOCKED_NORMALIZED.length; i++) {
        const blocked = BLOCKED_NORMALIZED[i];
        if (
            blocked.length >= 3 &&
            normalized.includes(blocked) &&
            !found.includes(BLOCKED_WORDS[i])
        ) {
            found.push(BLOCKED_WORDS[i]);
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
        const normalizedBlocked = normalize(blocked);
        if (!normalizedFull.includes(normalizedBlocked)) continue;

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
