"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureVictimCatalog = void 0;
const enums_1 = require("../../generated/prisma/enums");
const database_1 = require("../../config/database");
const defaultSections = [
    {
        sectionNumber: '303',
        sectionTitle: 'Theft',
        description: 'Dishonestly taking movable property without consent.',
        category: enums_1.CrimeCategory.PROPERTY,
        ipcEquivalent: '379',
        ipcTitle: 'Theft',
        minImprisonmentMonths: 0,
        maxImprisonmentMonths: 36,
        minFine: 0,
        maxFine: 25000,
        isBailable: true,
        isCognizable: true,
        compensationNote: 'Victims may seek return of property and compensation for documented loss.',
        victimsRightsNote: 'You may file a Zero FIR and request a free FIR copy within 24 hours.',
    },
    {
        sectionNumber: '115',
        sectionTitle: 'Voluntarily causing hurt',
        description: 'Acts causing bodily pain, disease, or infirmity.',
        category: enums_1.CrimeCategory.VIOLENT,
        ipcEquivalent: '323',
        ipcTitle: 'Voluntarily causing hurt',
        minImprisonmentMonths: 0,
        maxImprisonmentMonths: 12,
        minFine: 0,
        maxFine: 10000,
        isBailable: true,
        isCognizable: true,
        compensationNote: 'Medical expenses and interim compensation may be ordered where applicable.',
        victimsRightsNote: 'You may provide medical records, witness details, and request protection if threatened.',
    },
    {
        sectionNumber: '351',
        sectionTitle: 'Criminal intimidation',
        description: 'Threatening a person with injury to cause alarm.',
        category: enums_1.CrimeCategory.PUBLIC_ORDER,
        ipcEquivalent: '506',
        ipcTitle: 'Criminal intimidation',
        minImprisonmentMonths: 0,
        maxImprisonmentMonths: 24,
        minFine: 0,
        maxFine: 10000,
        isBailable: true,
        isCognizable: true,
        compensationNote: 'Victims can seek protection measures and document repeated threats.',
        victimsRightsNote: 'Preserve calls, chats, and witness details. Threats can still justify a Zero FIR.',
    },
    {
        sectionNumber: '316',
        sectionTitle: 'Cheating',
        description: 'Dishonestly inducing delivery of property or money.',
        category: enums_1.CrimeCategory.FINANCIAL_FRAUD,
        ipcEquivalent: '420',
        ipcTitle: 'Cheating and dishonestly inducing delivery of property',
        minImprisonmentMonths: 0,
        maxImprisonmentMonths: 84,
        minFine: 0,
        maxFine: 100000,
        isBailable: false,
        isCognizable: true,
        compensationNote: 'Victims may claim refund records, bank trail evidence, and compensation orders.',
        victimsRightsNote: 'Keep receipts, transaction IDs, screenshots, and bank statements ready.',
    },
    {
        sectionNumber: '75',
        sectionTitle: 'Sexual harassment',
        description: 'Unwelcome sexual conduct or remarks causing harassment.',
        category: enums_1.CrimeCategory.SEXUAL_OFFENSE,
        ipcEquivalent: '354A',
        ipcTitle: 'Sexual harassment',
        minImprisonmentMonths: 0,
        maxImprisonmentMonths: 36,
        minFine: 0,
        maxFine: 50000,
        isBailable: false,
        isCognizable: true,
        compensationNote: 'Victim support, counseling, and compensation mechanisms may be available.',
        victimsRightsNote: 'You can request a woman officer, privacy, and supportive recording conditions.',
    },
];
const ensureVictimCatalog = async () => {
    await Promise.all(defaultSections.map((section) => database_1.prisma.bNSSection.upsert({
        where: { sectionNumber: section.sectionNumber },
        update: section,
        create: section,
    })));
    const stationCount = await database_1.prisma.policeStation.count();
    if (stationCount === 0) {
        await database_1.prisma.policeStation.createMany({
            data: [
                {
                    name: 'Andheri East Police Station',
                    stationCode: 'MH-ANDHERI-E',
                    address: 'Andheri East, Mumbai',
                    district: 'Mumbai Suburban',
                    state: 'Maharashtra',
                    pincode: '400069',
                    latitude: 19.1136,
                    longitude: 72.8697,
                    phone: '02226830123',
                    email: 'andherieast@police.gov.in',
                    jurisdictionArea: 'Andheri East and MIDC belt',
                },
                {
                    name: 'Connaught Place Police Station',
                    stationCode: 'DL-CP-01',
                    address: 'Connaught Place, New Delhi',
                    district: 'New Delhi',
                    state: 'Delhi',
                    pincode: '110001',
                    latitude: 28.6315,
                    longitude: 77.2167,
                    phone: '01123456789',
                    email: 'cpstation@police.gov.in',
                    jurisdictionArea: 'Connaught Place and nearby circles',
                },
                {
                    name: 'T Nagar Police Station',
                    stationCode: 'TN-TNAGAR',
                    address: 'T Nagar, Chennai',
                    district: 'Chennai',
                    state: 'Tamil Nadu',
                    pincode: '600017',
                    latitude: 13.0418,
                    longitude: 80.2337,
                    phone: '04428150111',
                    email: 'tnagar@police.gov.in',
                    jurisdictionArea: 'T Nagar and adjoining residential areas',
                },
            ],
        });
    }
    const rightsCount = await database_1.prisma.rightsExplainer.count();
    if (rightsCount === 0) {
        const sections = await database_1.prisma.bNSSection.findMany({ take: 5 });
        await Promise.all(sections.map((section) => database_1.prisma.rightsExplainer.create({
            data: {
                bnsSectionId: section.id,
                title: `${section.sectionNumber} Victim Rights Guide`,
                content: section.victimsRightsNote ??
                    'Victims are entitled to FIR acknowledgment, updates, and respectful recording of their complaint.',
                legalBasis: section.ipcEquivalent ? `Earlier linked to IPC ${section.ipcEquivalent}` : null,
                language: enums_1.Language.ENGLISH,
            },
        })));
    }
};
exports.ensureVictimCatalog = ensureVictimCatalog;
