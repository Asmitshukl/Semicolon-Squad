import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import type { EvidenceChecklist, ChecklistItem, EvidenceItem } from '../../generated/prisma/client';

export class EvidenceChecklistService {
  /**
   * Generate evidence checklist based on BNS section
   * Templates are predefined in DB, create instance for specific FIR
   */
  static async generateChecklistForFIR(firId: string): Promise<{ checklist: EvidenceChecklist; items: ChecklistItem[] }> {
    const fir = await prisma.fIR.findUnique({
      where: { id: firId },
      include: { bnsSections: true },
    });

    if (!fir) {
      throw new ApiError(404, 'FIR not found');
    }

    if (fir.bnsSections.length === 0) {
      throw new ApiError(400, 'FIR must have at least one BNS section to generate checklist');
    }

    // Get checklist template for primary BNS section
    const primarySection = fir.bnsSections[0];
    const template = await prisma.evidenceChecklist.findFirst({
      where: { bnsSectionId: primarySection.id, isTemplate: true },
      include: { checklistItems: true },
    });

    if (!template) {
      // Create default checklist if none exists
      return this.createDefaultChecklist(primarySection.id);
    }

    // Items already exist in template
    return {
      checklist: template,
      items: template.checklistItems,
    };
  }

  /**
   * Create default evidence checklist for a BNS section
   */
  private static async createDefaultChecklist(bnsSectionId: string) {
    const bnsSection = await prisma.bNSSection.findUnique({
      where: { id: bnsSectionId },
    });

    if (!bnsSection) {
      throw new ApiError(404, 'BNS Section not found');
    }

    const defaultItems = this.getDefaultChecklistItems(bnsSection.category);

    const checklist = await prisma.evidenceChecklist.create({
      data: {
        bnsSectionId,
        title: `Evidence Required for ${bnsSection.sectionNumber}`,
        description: `Standard evidence checklist for ${bnsSection.sectionTitle}`,
        isTemplate: true,
        checklistItems: {
          create: defaultItems,
        },
      },
      include: {
        checklistItems: true,
      },
    });

    return { checklist, items: checklist.checklistItems };
  }

  /**
   * Get default checklist items based on crime category
   */
  private static getDefaultChecklistItems(category: string): any[] {
    const templates: Record<string, any[]> = {
      VIOLENT: [
        {
          label: 'Medical Report',
          description: 'Doctor examination report documenting injuries',
          isRequired: true,
          deadline: '24 hours',
          sortOrder: 1,
        },
        {
          label: 'Witness Statements',
          description: 'Written statements from eyewitnesses',
          isRequired: true,
          deadline: '72 hours',
          sortOrder: 2,
        },
        {
          label: 'CCTV Footage Request',
          description: 'Request for CCTV footage from scene location',
          isRequired: false,
          deadline: '72 hours',
          sortOrder: 3,
        },
        {
          label: 'Scene Photographs',
          description: 'Photographs of crime scene',
          isRequired: true,
          deadline: '24 hours',
          sortOrder: 4,
        },
      ],
      PROPERTY: [
        {
          label: 'Ownership Documentation',
          description: 'Property ownership proof (deed, receipt, etc.)',
          isRequired: true,
          deadline: '24 hours',
          sortOrder: 1,
        },
        {
          label: 'Description of Stolen Items',
          description: 'Detailed list of stolen items with serial numbers if applicable',
          isRequired: true,
          deadline: '24 hours',
          sortOrder: 2,
        },
        {
          label: 'Police Patrolling Report',
          description: 'Report from police patrols in the area',
          isRequired: false,
          deadline: '48 hours',
          sortOrder: 3,
        },
      ],
      CYBERCRIME: [
        {
          label: 'Digital Evidence Chain',
          description: 'Screenshots and digital evidence preservation',
          isRequired: true,
          deadline: '24 hours',
          sortOrder: 1,
        },
        {
          label: 'Complaint Email/Message',
          description: 'Original communication evidence',
          isRequired: true,
          deadline: '24 hours',
          sortOrder: 2,
        },
        {
          label: 'Technical Logs',
          description: 'Server logs or system logs from platform',
          isRequired: true,
          deadline: '72 hours',
          sortOrder: 3,
        },
      ],
      DOMESTIC_VIOLENCE: [
        {
          label: 'Medical Certificate',
          description: 'Doctor examination report for injuries',
          isRequired: true,
          deadline: '24 hours',
          sortOrder: 1,
        },
        {
          label: 'Victim Statement in Detail',
          description: 'Recorded statement from victim (video preferred)',
          isRequired: true,
          deadline: '24 hours',
          sortOrder: 2,
        },
        {
          label: 'Shelter/Support Records',
          description: 'Records if victim sought shelter or medical help',
          isRequired: false,
          deadline: '48 hours',
          sortOrder: 3,
        },
      ],
      FINANCIAL_FRAUD: [
        {
          label: 'Bank Statements',
          description: 'Bank statements showing fraudulent transactions',
          isRequired: true,
          deadline: '48 hours',
          sortOrder: 1,
        },
        {
          label: 'Fraudulent Documents',
          description: 'Copies of forged or fraudulent documents',
          isRequired: true,
          deadline: '24 hours',
          sortOrder: 2,
        },
        {
          label: 'Communication Records',
          description: 'Emails, messages, or call logs related to fraud',
          isRequired: true,
          deadline: '48 hours',
          sortOrder: 3,
        },
      ],
      SEXUAL_OFFENSE: [
        {
          label: 'Medical Examination Report',
          description: 'Detailed medical examination (may need special training)',
          isRequired: true,
          deadline: '6 hours',
          sortOrder: 1,
        },
        {
          label: 'Forensic Evidence',
          description: 'DNA samples if applicable',
          isRequired: true,
          deadline: '24 hours',
          sortOrder: 2,
        },
        {
          label: 'Victim Video Statement',
          description: 'Recorded statement (with consent)',
          isRequired: true,
          deadline: '24 hours',
          sortOrder: 3,
        },
      ],
    };

    return templates[category] || [];
  }

  /**
   * Get checklist for a specific FIR
   */
  static async getChecklistForFIR(firId: string) {
    const fir = await prisma.fIR.findUnique({
      where: { id: firId },
      include: { bnsSections: true },
    });

    if (!fir) {
      throw new ApiError(404, 'FIR not found');
    }

    const primarySection = fir.bnsSections[0];
    if (!primarySection) {
      throw new ApiError(400, 'FIR has no BNS section');
    }

    const checklist = await prisma.evidenceChecklist.findFirst({
      where: { bnsSectionId: primarySection.id },
      include: { checklistItems: true },
    });

    return checklist;
  }

  /**
   * Get evidence collection status for FIR
   */
  static async getEvidenceStatus(firId: string) {
    const evidenceItems = await prisma.evidenceItem.findMany({
      where: { firId },
      include: { checklistItem: true },
    });

    const totalRequired = evidenceItems.filter((item) => item.checklistItem?.isRequired).length;
    const collected = evidenceItems.filter((item) => item.isCollected).length;

    return {
      total: evidenceItems.length,
      collected,
      pending: evidenceItems.length - collected,
      percentComplete: evidenceItems.length > 0 ? Math.round((collected / evidenceItems.length) * 100) : 0,
      items: evidenceItems,
    };
  }

  /**
   * Mark evidence item as collected
   */
  static async markEvidenceCollected(evidenceItemId: string, fileUrl?: string): Promise<EvidenceItem> {
    const item = await prisma.evidenceItem.findUnique({
      where: { id: evidenceItemId },
    });

    if (!item) {
      throw new ApiError(404, 'Evidence item not found');
    }

    return prisma.evidenceItem.update({
      where: { id: evidenceItemId },
      data: {
        isCollected: true,
        collectedAt: new Date(),
        fileUrl: fileUrl || item.fileUrl,
      },
    });
  }

  /**
   * Add evidence item to FIR
   */
  static async addEvidenceItem(firId: string, checklistItemId: string, label: string, notes?: string) {
    const fir = await prisma.fIR.findUnique({
      where: { id: firId },
    });

    if (!fir) {
      throw new ApiError(404, 'FIR not found');
    }

    return prisma.evidenceItem.create({
      data: {
        firId,
        checklistItemId,
        label,
        notes,
      },
      include: {
        checklistItem: true,
      },
    });
  }
}
