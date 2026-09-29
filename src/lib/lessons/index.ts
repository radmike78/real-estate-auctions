// The written Learn lessons. A module in LEARN_MODULES opens as a lesson once it's listed here.
import { markets } from './markets';
import type { Lesson } from './types';
import { typesOfProperty } from './types-of-property';
import { whoInvests } from './who-invests';

export const LESSONS: Lesson[] = [markets, typesOfProperty, whoInvests];

export const lessonByKey = (key: string) => LESSONS.find((l) => l.key === key);
