import { prisma } from '../../config/database';
import { ensureVictimCatalog } from './catalog.service';

const defaultRights = [
  {
    title: 'Free FIR copy within 24 hours',
    basis: 'BNSS procedural protection',
    detail: 'Victims can request a copy of the FIR or acknowledgment after registration.',
  },
  {
    title: 'Zero FIR at any police station',
    basis: 'Zero FIR practice',
    detail: 'You can report a cognizable offense even if that police station is outside jurisdiction.',
  },
  {
    title: 'Right to respectful statement recording',
    basis: 'Victim-sensitive process',
    detail: 'You may request language support and clear recording of your complaint.',
  },
  {
    title: 'Updates on investigation progress',
    basis: 'Victim information rights',
    detail: 'Keep your acknowledgment number to track progress and follow-up actions.',
  },
  {
    title: 'Compensation and support where applicable',
    basis: 'Victim compensation principles',
    detail: 'Courts and state schemes may support compensation based on harm and evidence.',
  },
];

export const getVictimRights = async (userId: string, statementId?: string) => {
  await ensureVictimCatalog();

  const statement = statementId
    ? await prisma.victimStatement.findFirst({
        where: { id: statementId, userId },
        include: {
          classification: {
            include: {
              bnsSection: true,
            },
          },
        },
      })
    : null;

  const section = statement?.classification?.bnsSection;

  return {
    section: section
      ? {
          number: section.sectionNumber,
          title: section.sectionTitle,
          victimsRightsNote: section.victimsRightsNote,
          compensationNote: section.compensationNote,
        }
      : null,
    rights: defaultRights,
    preFirChecklist: [
      'Write the incident in your own words with date, time, and place.',
      'Keep witness names, phone numbers, screenshots, receipts, or medical reports ready.',
      'If urgent danger exists, go to the nearest police station immediately and mention urgency.',
    ],
    zeroFirGuidance:
      'If the incident happened in another area, you can still approach the nearest police station and ask to lodge a Zero FIR.',
  };
};
