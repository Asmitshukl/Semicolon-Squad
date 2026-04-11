import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import type { BNSSection } from '@prisma/client';

export interface BNSIPCTranslation {
  bnsSection: BNSSection;
  ipcEquivalent: string | null;
  ipcTitle: string | null;
  comparison: {
    similarities: string[];
    differences: string[];
  };
}

export class BNSIPCTranslatorService {
  /**
   * Get BNS section with IPC equivalent
   */
  static async getBNSWithIPC(bnsSectionId: string): Promise<BNSIPCTranslation> {
    const section = await prisma.bNSSection.findUnique({
      where: { id: bnsSectionId },
    });

    if (!section) {
      throw new ApiError(404, 'BNS Section not found');
    }

    return {
      bnsSection: section,
      ipcEquivalent: section.ipcEquivalent,
      ipcTitle: section.ipcTitle,
      comparison: this.getComparison(section),
    };
  }

  /**
   * Search BNS sections by number or title
   */
  static async searchBNSSection(query: string) {
    return prisma.bNSSection.findMany({
      where: {
        OR: [
          { sectionNumber: { contains: query, mode: 'insensitive' } },
          { sectionTitle: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 10,
    });
  }

  /**
   * Get BNS section by number (e.g., "103", "115")
   */
  static async getBNSSectionByNumber(sectionNumber: string): Promise<BNSIPCTranslation> {
    const section = await prisma.bNSSection.findUnique({
      where: { sectionNumber },
    });

    if (!section) {
      throw new ApiError(404, `BNS Section ${sectionNumber} not found`);
    }

    return {
      bnsSection: section,
      ipcEquivalent: section.ipcEquivalent,
      ipcTitle: section.ipcTitle,
      comparison: this.getComparison(section),
    };
  }

  /**
   * Get IPC equivalent for BNS section
   */
  static async getIPCEquivalent(bnsSectionId: string) {
    const section = await prisma.bNSSection.findUnique({
      where: { id: bnsSectionId },
    });

    if (!section) {
      throw new ApiError(404, 'BNS Section not found');
    }

    if (!section.ipcEquivalent) {
      return {
        message: `BNS Section ${section.sectionNumber} has no direct IPC equivalent`,
        bnsSection: section.sectionNumber,
        bnsTitle: section.sectionTitle,
      };
    }

    return {
      bnsSection: section.sectionNumber,
      bnsTitle: section.sectionTitle,
      ipcSection: section.ipcEquivalent,
      ipcTitle: section.ipcTitle,
      note: 'Note: While these sections are equivalent, the BNS 2023 introduces several changes in definitions and punishments.',
    };
  }

  /**
   * Get all BNS sections grouped by category
   */
  static async getAllBNSSectionsByCategory() {
    const categories = [
      'VIOLENT',
      'PROPERTY',
      'CYBERCRIME',
      'DOMESTIC_VIOLENCE',
      'FINANCIAL_FRAUD',
      'SEXUAL_OFFENSE',
      'PUBLIC_ORDER',
      'DRUG_OFFENSE',
      'OTHER',
    ];

    const result: Record<string, BNSSection[]> = {};

    for (const category of categories) {
      result[category] = await prisma.bNSSection.findMany({
        where: { category: category as any },
        orderBy: { sectionNumber: 'asc' },
      });
    }

    return result;
  }

  /**
   * Get detailed legal information for BNS section
   */
  static async getBNSSectionDetails(bnsSectionId: string) {
    const section = await prisma.bNSSection.findUnique({
      where: { id: bnsSectionId },
      include: {
        rightsExplainers: true,
        evidenceChecklists: true,
      },
    });

    if (!section) {
      throw new ApiError(404, 'BNS Section not found');
    }

    return {
      section,
      details: {
        sectionNumber: section.sectionNumber,
        title: section.sectionTitle,
        description: section.description,
        category: section.category,
        punishment: {
          imprisonment: section.isLifeOrDeath
            ? 'Life Imprisonment or Death'
            : section.maxImprisonmentMonths
              ? `${section.minImprisonmentMonths || 0} months to ${Math.round(section.maxImprisonmentMonths / 12)} years`
              : 'N/A',
          fine: section.maxFine ? `Up to ₹${section.maxFine}` : 'N/A',
        },
        bailable: section.isBailable,
        cognizable: section.isCognizable,
        compoundable: section.isCompoundable,
        compensationNote: section.compensationNote,
        victimsRightsNote: section.victimsRightsNote,
        ipcEquivalent: section.ipcEquivalent,
        ipcTitle: section.ipcTitle,
      },
      resources: {
        rightsExplainers: section.rightsExplainers,
        evidenceChecklists: section.evidenceChecklists,
      },
    };
  }

  /**
   * Get comparison between same crime in BNS vs IPC
   */
  private static getComparison(section: BNSSection) {
    const comparisons: Record<string, any> = {
      // Common similarities and differences
      '103': {
        // Murder
        similarities: [
          'Intentional act causing death',
          'Both are cognizable offenses',
          'Both attract severe punishment',
        ],
        differences: [
          'BNS introduces specific definitions clarifying "death"',
          'BNS Section 103 provides life imprisonment or death penalty',
          'Different applicable defenses under new law',
        ],
      },
      '115': {
        // Grievous hurt
        similarities: [
          'Causes grievous injury',
          'Both require medical evidence',
          'Both cognizable under old and new law',
        ],
        differences: ['BNS refines definition of "grievous"', 'Different punishment quantum in some cases'],
      },
      '353': {
        // Criminal intimidation
        similarities: [
          'Threatens person with injury or loss',
          'Bailable offense',
          'Both have similar provisions',
        ],
        differences: ['BNS provisions are more comprehensive', 'Better defined categories of intimidation'],
      },
    };

    return comparisons[section.sectionNumber] || { similarities: [], differences: [] };
  }

  /**
   * Get list of key changes from IPC to BNS
   */
  static async getKeyChangesFromIPCtoBNS() {
    return {
      majorChanges: [
        {
          title: 'Decriminalization of Consensual Acts',
          description: 'Certain acts consensually performed by adults are no longer criminal',
          sections: ['Section 185 (Morality)', 'Section 272 (Cruelty)'],
        },
        {
          title: 'Improved Victim Rights',
          description: 'BNS 2023 provides stronger victim protection and compensation mechanisms',
          sections: ['Section 25', 'Section 357'],
        },
        {
          title: 'Enhanced Definitions',
          description: 'Clearer definitions of crimes like rape, sexual assault, and harassment',
          sections: ['Chapter V (Sexual offenses)'],
        },
        {
          title: 'Bail Provisions',
          description: 'Revised bail framework with specific criteria',
          sections: ['Chapter III (Arrest)'],
        },
        {
          title: 'Zero FIR Provision',
          description: 'Any station can register FIR regardless of jurisdiction',
          sections: ['Section 173'],
        },
      ],
      criticalUpdates: [
        'Private complaints must go through hierarchy (magistrate issues notice)',
        'Victim can directly file charge sheet in some cases',
        'Mandatory investigation completion within 90 days (extendable)',
        'Officers face accountability for defective FIRs',
      ],
    };
  }
}
