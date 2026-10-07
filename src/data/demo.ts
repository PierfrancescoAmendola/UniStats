import { Exam } from '../engine/types';

// Demo transcript used by the design mockups (weighted average 27.36 over 66 CFU).
// Only reachable in development builds, to check every screen quickly.
export const demoExams = (cohort: number): Exam[] => {
    const y1 = cohort;
    const y2 = cohort + 1;
    const e = (id: string, name: string, grade: number | null, cfu: number, date: string, year: number, lode = false): Exam => ({ id, name, grade, cfu, date, year, lode });
    return [
        e('d1', 'Lingua Inglese B2', null, 3, `${y1}-12-05`, 1),
        e('d2', 'Analisi Matematica I', 27, 9, `${y2}-01-22`, 1),
        e('d3', 'Fondamenti di Informatica', 30, 12, `${y2}-02-10`, 1, true),
        e('d4', 'Geometria e Algebra', 28, 6, `${y2}-02-24`, 1),
        e('d5', 'Fisica I', 24, 9, `${y2}-06-20`, 1),
        e('d6', 'Programmazione a Oggetti', 30, 9, `${y2}-07-01`, 1),
        e('d7', 'Architettura dei Calcolatori', 26, 6, `${y2}-07-08`, 1),
        e('d8', 'Analisi Matematica II', 22, 6, `${y2}-07-15`, 2),
        e('d9', 'Basi di Dati', 29, 9, `${y2}-09-18`, 2),
    ];
};
