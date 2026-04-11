export interface BNSSection {
  number: string;
  title: string;
  victimsRightsNote?: string;
  compensationNote?: string;
}

export interface ClassificationResult {
  id: string;
  victimStatementId: string;
  confidenceScore: number;
  urgencyLevel: string;
  urgencyReason?: string;
  severityScore?: number;
  bnsSection: {
    sectionNumber: string;
    sectionTitle: string;
    description: string;
    ipcEquivalent?: string;
  };
}
