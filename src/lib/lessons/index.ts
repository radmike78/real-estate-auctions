// The written Learn lessons. A module in LEARN_MODULES opens as a lesson once it's listed here.
import { analyze } from './analyze';
import { creative } from './creative';
import { financing } from './financing';
import { forcedSales } from './forced-sales';
import { markets } from './markets';
import { negotiate } from './negotiate';
import { redFlags } from './red-flags';
import { tools } from './tools';
import type { Lesson } from './types';
import { typesOfProperty } from './types-of-property';
import { veterans } from './veterans';
import { whoInvests } from './who-invests';

export const LESSONS: Lesson[] = [markets, typesOfProperty, whoInvests, analyze, negotiate, financing, creative, redFlags, tools, forcedSales, veterans];

export const lessonByKey = (key: string) => LESSONS.find((l) => l.key === key);
