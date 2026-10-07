import { parseTranscript, prettyName, yearFromDate } from '../pdf/transcriptParser';
import { base64ToBytes } from '../pdf/pdfText';
import { findUniversity, searchUniversities, shortUniName } from '../data/universities';

describe('transcript parser', () => {
    it('reads Esse3-style lines with code, date, grade and CFU, joining wrapped names', () => {
        const exams = parseTranscript([
            'Insegnamento   Data   Voto   CFU   Ateneo   SSD',
            'U2356   BASI DI DATI I   28/10/2025   25   9   016   INF/01',
            '13917   LABORATORIO DI ALGORITMI E   28/07/2025   30 e lode   6   016   INF/01',
            'STRUTTURE DATI',
            '00013   LINGUA INGLESE   19/12/2023   Idoneo   3   016   0',
        ]);
        expect(exams).toHaveLength(3);
        expect(exams[0]).toMatchObject({ name: 'Basi di Dati I', date: '2025-10-28', grade: 25, lode: false, cfu: 9, uncertain: false });
        expect(exams[1]).toMatchObject({ name: 'Laboratorio di Algoritmi e Strutture Dati', grade: 30, lode: true, cfu: 6 });
        expect(exams[2]).toMatchObject({ name: 'Lingua Inglese', grade: null, cfu: 3 });
    });

    it('reads results written before the date and 30L', () => {
        const [e] = parseTranscript(['Analisi Matematica 1   9   30L   12/02/2025']);
        expect(e).toMatchObject({ name: 'Analisi Matematica 1', grade: 30, lode: true, cfu: 9 });
    });

    it('flags missing credits', () => {
        const [e] = parseTranscript(['FISICA I 20/06/2025 24']);
        expect(e).toMatchObject({ grade: 24, cfu: 0, uncertain: true });
    });

    it('ignores lines without a result', () => {
        expect(parseTranscript(['Napoli, 16/12/2025   Il Capo dell’Ufficio', 'nato il 30/09/2005 a NAPOLI (NA)'])).toHaveLength(0);
    });

    it('formats upper-case names', () => {
        expect(prettyName('CALCOLO DELLE PROBABILITA\' E STATISTICA')).toBe('Calcolo delle Probabilita\' e Statistica');
        expect(prettyName('Machine Learning')).toBe('Machine Learning');
    });

    it('derives the course year from the exam date', () => {
        expect(yearFromDate('2024-02-29', 2023, 3)).toBe(1);
        expect(yearFromDate('2024-10-29', 2023, 3)).toBe(2);
        expect(yearFromDate('2030-01-10', 2023, 3)).toBe(3);
    });

    it('decodes base64', () => {
        expect(Array.from(base64ToBytes('JVBERi0='))).toEqual([37, 80, 68, 70, 45]);
    });
});

describe('university names', () => {
    it('shortens long names for subtitles', () => {
        expect(shortUniName(findUniversity('sapienza')!)).toBe('Sapienza');
        expect(shortUniName(findUniversity('torvergata')!)).toBe('Roma Tor Vergata');
        expect(shortUniName(findUniversity('polimi')!)).toBe('Politecnico di Milano');
    });
    it('searches ignoring accents and apostrophes', () => {
        expect(searchUniversities('ca foscari').map((u: any) => u.id)).toContain('unive');
        expect(searchUniversities('napoli', 'state').length).toBeGreaterThan(2);
    });
});
