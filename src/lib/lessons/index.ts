// The written Learn lessons. A module in LEARN_MODULES opens as a lesson once it's listed here.
import type { Lesson } from './types';

export const LESSONS: Lesson[] = [];

export const lessonByKey = (key: string) => LESSONS.find((l) => l.key === key);
