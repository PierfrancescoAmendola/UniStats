import { Profile } from '../store/AppStore';

/** Current course year from the enrolment year; academic years start in September. */
export const currentCourseYear = (p: Profile, now = new Date()): number => {
    const academicStart = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
    return Math.max(1, Math.min(p.years + 1, academicStart - p.cohort + 1));
};

export const todayIso = (now = new Date()) =>
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
