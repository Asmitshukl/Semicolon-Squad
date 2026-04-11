"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runHeuristicClassification = void 0;
const enums_1 = require("../../generated/prisma/enums");
const PATTERNS = [
    {
        keywords: ['kill', 'murder', 'knife', 'attack', 'beating', 'injury', 'hurt', 'assault'],
        sectionNumber: '115',
        urgencyLevel: enums_1.UrgencyLevel.HIGH,
        urgencyReason: 'The statement suggests physical violence or immediate safety concerns.',
        severityScore: 0.82,
    },
    {
        keywords: ['threat', 'intimidat', 'blackmail', 'extort'],
        sectionNumber: '351',
        urgencyLevel: enums_1.UrgencyLevel.HIGH,
        urgencyReason: 'The statement suggests ongoing intimidation or coercion.',
        severityScore: 0.76,
    },
    {
        keywords: ['fraud', 'cheat', 'scam', 'money', 'upi', 'bank', 'loan'],
        sectionNumber: '316',
        urgencyLevel: enums_1.UrgencyLevel.MEDIUM,
        urgencyReason: 'The statement suggests a financial fraud requiring evidence preservation.',
        severityScore: 0.69,
    },
    {
        keywords: ['harass', 'touch', 'sexual', 'stalk', 'molest'],
        sectionNumber: '75',
        urgencyLevel: enums_1.UrgencyLevel.HIGH,
        urgencyReason: 'The statement suggests sexual harassment or gender-based harm.',
        severityScore: 0.88,
    },
];
const runHeuristicClassification = (text) => {
    const lower = text.toLowerCase();
    const match = PATTERNS.find((pattern) => pattern.keywords.some((keyword) => lower.includes(keyword)));
    return (match ?? {
        sectionNumber: '303',
        urgencyLevel: enums_1.UrgencyLevel.MEDIUM,
        urgencyReason: 'The statement suggests a property or general complaint requiring station review.',
        severityScore: 0.58,
    });
};
exports.runHeuristicClassification = runHeuristicClassification;
