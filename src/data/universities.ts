// Italian universities. `kind`: state, private (non statale) or online (telematica).
export type UniKind = 'state' | 'private' | 'online';

export interface University {
    id: string;
    name: string;
    short: string;
    city: string;
    kind: UniKind;
}

const u = (id: string, name: string, short: string, city: string, kind: UniKind = 'state'): University => ({ id, name, short, city, kind });

export const UNIVERSITIES: University[] = [
    // Piemonte, Valle d'Aosta, Liguria
    u('unito', 'Università di Torino', 'UT', 'Torino'),
    u('polito', 'Politecnico di Torino', 'PT', 'Torino'),
    u('uniupo', 'Università del Piemonte Orientale', 'UP', 'Vercelli'),
    u('unisg', 'Università di Scienze Gastronomiche', 'SG', 'Pollenzo', 'private'),
    u('univda', 'Università della Valle d’Aosta', 'VA', 'Aosta', 'private'),
    u('unige', 'Università di Genova', 'GE', 'Genova'),
    // Lombardia
    u('unimi', 'Università degli Studi di Milano (Statale)', 'MI', 'Milano'),
    u('polimi', 'Politecnico di Milano', 'PM', 'Milano'),
    u('unimib', 'Università di Milano-Bicocca', 'BI', 'Milano'),
    u('bocconi', 'Università Bocconi', 'BO', 'Milano', 'private'),
    u('unicatt', 'Università Cattolica del Sacro Cuore', 'UC', 'Milano', 'private'),
    u('iulm', 'Università IULM', 'IU', 'Milano', 'private'),
    u('unisr', 'Università Vita-Salute San Raffaele', 'SR', 'Milano', 'private'),
    u('hunimed', 'Humanitas University', 'HU', 'Pieve Emanuele', 'private'),
    u('liuc', 'LIUC Università Cattaneo', 'LC', 'Castellanza', 'private'),
    u('unipv', 'Università di Pavia', 'PV', 'Pavia'),
    u('iusspavia', 'IUSS Pavia', 'IS', 'Pavia'),
    u('unibs', 'Università di Brescia', 'BS', 'Brescia'),
    u('unibg', 'Università di Bergamo', 'BG', 'Bergamo'),
    u('uninsubria', 'Università dell’Insubria', 'IN', 'Varese'),
    // Triveneto, Trentino-Alto Adige, Friuli
    u('unipd', 'Università di Padova', 'PD', 'Padova'),
    u('unive', 'Università Ca’ Foscari Venezia', 'CF', 'Venezia'),
    u('iuav', 'Università Iuav di Venezia', 'IV', 'Venezia'),
    u('univr', 'Università di Verona', 'VR', 'Verona'),
    u('unitn', 'Università di Trento', 'TN', 'Trento'),
    u('unibz', 'Libera Università di Bolzano', 'BZ', 'Bolzano', 'private'),
    u('units', 'Università di Trieste', 'TS', 'Trieste'),
    u('sissa', 'SISSA Trieste', 'SI', 'Trieste'),
    u('uniud', 'Università di Udine', 'UD', 'Udine'),
    // Emilia-Romagna
    u('unibo', 'Università di Bologna', 'UB', 'Bologna'),
    u('unimore', 'Università di Modena e Reggio Emilia', 'MO', 'Modena'),
    u('unipr', 'Università di Parma', 'PR', 'Parma'),
    u('unife', 'Università di Ferrara', 'FE', 'Ferrara'),
    // Toscana
    u('unifi', 'Università di Firenze', 'FI', 'Firenze'),
    u('unipi', 'Università di Pisa', 'PI', 'Pisa'),
    u('sns', 'Scuola Normale Superiore', 'NS', 'Pisa'),
    u('santanna', 'Scuola Superiore Sant’Anna', 'SA', 'Pisa'),
    u('unisi', 'Università di Siena', 'SI', 'Siena'),
    u('unistrasi', 'Università per Stranieri di Siena', 'SS', 'Siena'),
    u('imtlucca', 'Scuola IMT Alti Studi Lucca', 'IM', 'Lucca'),
    // Umbria, Marche
    u('unipg', 'Università di Perugia', 'PG', 'Perugia'),
    u('unistrapg', 'Università per Stranieri di Perugia', 'SP', 'Perugia'),
    u('univpm', 'Università Politecnica delle Marche', 'AN', 'Ancona'),
    u('unimc', 'Università di Macerata', 'MC', 'Macerata'),
    u('unicam', 'Università di Camerino', 'CA', 'Camerino'),
    u('uniurb', 'Università di Urbino Carlo Bo', 'UR', 'Urbino'),
    // Lazio
    u('sapienza', 'Sapienza Università di Roma', 'SA', 'Roma'),
    u('torvergata', 'Università di Roma Tor Vergata', 'TV', 'Roma'),
    u('roma3', 'Università Roma Tre', 'R3', 'Roma'),
    u('uniroma4', 'Università di Roma Foro Italico', 'FI', 'Roma'),
    u('luiss', 'LUISS Guido Carli', 'LU', 'Roma', 'private'),
    u('lumsa', 'LUMSA', 'LM', 'Roma', 'private'),
    u('unicampus', 'Università Campus Bio-Medico di Roma', 'CB', 'Roma', 'private'),
    u('unint', 'UNINT Università degli Studi Internazionali di Roma', 'UN', 'Roma', 'private'),
    u('unier', 'Università Europea di Roma', 'UE', 'Roma', 'private'),
    u('unicas', 'Università di Cassino e del Lazio Meridionale', 'CS', 'Cassino'),
    u('unitus', 'Università della Tuscia', 'VT', 'Viterbo'),
    // Abruzzo, Molise
    u('univaq', 'Università dell’Aquila', 'AQ', 'L’Aquila'),
    u('unich', 'Università G. d’Annunzio Chieti-Pescara', 'CH', 'Chieti'),
    u('unite', 'Università di Teramo', 'TE', 'Teramo'),
    u('gssi', 'Gran Sasso Science Institute', 'GS', 'L’Aquila'),
    u('unimol', 'Università del Molise', 'CB', 'Campobasso'),
    // Campania
    u('unina', 'Università di Napoli Federico II', 'FE', 'Napoli'),
    u('unicampania', 'Università della Campania Luigi Vanvitelli', 'LV', 'Caserta'),
    u('unior', 'Università di Napoli L’Orientale', 'OR', 'Napoli'),
    u('uniparthenope', 'Università di Napoli Parthenope', 'PA', 'Napoli'),
    u('unisob', 'Università Suor Orsola Benincasa', 'SB', 'Napoli', 'private'),
    u('unisa', 'Università di Salerno', 'SA', 'Fisciano'),
    u('unisannio', 'Università del Sannio', 'BN', 'Benevento'),
    // Puglia, Basilicata
    u('uniba', 'Università di Bari Aldo Moro', 'BA', 'Bari'),
    u('poliba', 'Politecnico di Bari', 'PB', 'Bari'),
    u('unifg', 'Università di Foggia', 'FG', 'Foggia'),
    u('unisalento', 'Università del Salento', 'LE', 'Lecce'),
    u('lum', 'Università LUM Giuseppe Degennaro', 'LG', 'Casamassima', 'private'),
    u('unibas', 'Università della Basilicata', 'PZ', 'Potenza'),
    // Calabria
    u('unical', 'Università della Calabria', 'CS', 'Rende'),
    u('unicz', 'Università Magna Græcia di Catanzaro', 'CZ', 'Catanzaro'),
    u('unirc', 'Università Mediterranea di Reggio Calabria', 'RC', 'Reggio Calabria'),
    // Sicilia, Sardegna
    u('unipa', 'Università di Palermo', 'PA', 'Palermo'),
    u('unict', 'Università di Catania', 'CT', 'Catania'),
    u('unime', 'Università di Messina', 'ME', 'Messina'),
    u('unikore', 'Università Kore di Enna', 'KE', 'Enna', 'private'),
    u('unica', 'Università di Cagliari', 'CA', 'Cagliari'),
    u('uniss', 'Università di Sassari', 'SS', 'Sassari'),
    // Online universities
    u('unipegaso', 'Università Telematica Pegaso', 'PE', 'Napoli', 'online'),
    u('unimercatorum', 'Universitas Mercatorum', 'ME', 'Roma', 'online'),
    u('ecampus', 'Università eCampus', 'EC', 'Novedrate', 'online'),
    u('unicusano', 'Università Niccolò Cusano', 'NC', 'Roma', 'online'),
    u('uninettuno', 'Uninettuno', 'UN', 'Roma', 'online'),
    u('unimarconi', 'Università Guglielmo Marconi', 'GM', 'Roma', 'online'),
    u('sanraffaeleonline', 'Università San Raffaele Roma', 'SR', 'Roma', 'online'),
    u('unifortunato', 'Università Giustino Fortunato', 'GF', 'Benevento', 'online'),
    u('iul', 'Università Telematica IUL', 'IL', 'Firenze', 'online'),
    u('unitelma', 'Unitelma Sapienza', 'TS', 'Roma', 'online'),
    u('unidav', 'Università Leonardo da Vinci', 'DV', 'Torrevecchia Teatina', 'online'),
];

export const findUniversity = (id: string | null | undefined) => UNIVERSITIES.find((x) => x.id === id);

const norm = (s: string) =>
    s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[’']/g, '');

export const searchUniversities = (query: string, kind: UniKind | 'all' = 'all'): University[] => {
    const q = norm(query.trim());
    return UNIVERSITIES.filter((x) => (kind === 'all' || x.kind === kind) && (!q || norm(`${x.name} ${x.city} ${x.id}`).includes(q)));
};

/** Name short enough for a subtitle: "Sapienza", "Roma Tor Vergata", "Politecnico di Milano". */
export const shortUniName = (u: University): string => {
    if (u.name.length <= 22) return u.name;
    const before = u.name.split(/\s+Università(?=\s|$)/)[0];
    if (before && before !== u.name && !before.startsWith('Università')) return before;
    return u.name.replace(/^Università (degli Studi )?(di |del |della |dell\u2019)/, '').replace(/^Università /, '');
};
