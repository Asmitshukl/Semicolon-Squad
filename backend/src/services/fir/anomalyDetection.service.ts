import { prisma } from '../../config/database';
import { FIRStatus } from '../../generated/prisma/enums';

export interface AnomalyFlags {
  isHighRisk: boolean;
  suspiciousFIRCount: number;
  timePatternAnomaly: boolean;
  contradictoryDetails: boolean;
  flags: string[];
  recommendedAction: string;
}

export class AnomalyDetectionService {
  /**
   * Detect potential false FIR patterns
   */
  static async analyzeFIRForAnomalies(firId: string): Promise<AnomalyFlags> {
    const fir = await prisma.fIR.findUnique({
      where: { id: firId },
      include: {
        victim: true,
        bnsSections: true,
        victimStatements: true,
      },
    });

    if (!fir) {
      throw new Error('FIR not found');
    }

    const flags: string[] = [];
    let riskScore = 0;

    // Check 1: Multiple FIRs from same complainant in short time
    const recentFIRs = await prisma.fIR.findMany({
      where: {
        victimId: fir.victimId,
        createdAt: {
          gte: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    });

    if (recentFIRs.length > 3) {
      flags.push(
        `Complainant has filed ${recentFIRs.length} FIRs in the last 30 days (typically not normal)`,
      );
      riskScore += 20;
    }

    // Check 2: Time pattern anomaly - FIR filed long after incident
    const incidentDate = new Date(fir.incidentDate);
    const firDate = new Date(fir.createdAt);
    const daysDifference = Math.floor((firDate.getTime() - incidentDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDifference > 30) {
      flags.push(`FIR filed ${daysDifference} days after incident (excessive delay may indicate false complaint)`);
      riskScore += 15;
    }

    // Check 3: Contradictory or vague descriptions
    if (!fir.incidentDescription || fir.incidentDescription.length < 50) {
      flags.push('Incident description is vague or too brief');
      riskScore += 10;
    }

    // Check 4: Missing key details
    const missingDetails: string[] = [];
    if (!fir.incidentTime) missingDetails.push('time');
    if (!fir.incidentLocation) missingDetails.push('location');
    if (fir.victimStatements.length === 0) missingDetails.push('victim statement');

    if (missingDetails.length > 0) {
      flags.push(`Missing critical details: ${missingDetails.join(', ')}`);
      riskScore += 5 * missingDetails.length;
    }

    // Check 5: Pattern of withdrawal
    const historicalFIRs = await prisma.caseUpdate.findMany({
      where: {
        fir: {
          victimId: fir.victimId,
        },
        status: FIRStatus.REJECTED,
      },
    });

    if (historicalFIRs.length >= 2) {
      flags.push(`Complainant has ${historicalFIRs.length} withdrawn/rejected FIRs in history`);
      riskScore += 25;
    }

    // Check 6: Similar incidents with different accusations
    const similarIncidents = await prisma.fIR.findMany({
      where: {
        victimId: fir.victimId,
        incidentDate: fir.incidentDate,
        NOT: {
          id: firId,
        },
      },
    });

    if (similarIncidents.length > 0) {
      flags.push(`Found ${similarIncidents.length} similar incident reports on same date`);
      riskScore += 20;
    }

    // Determine risk level and recommendation
    const isHighRisk = riskScore > 40;
    let recommendedAction = 'Normal processing';

    if (riskScore > 70) {
      recommendedAction = 'CRITICAL: Recommend detailed verification before filing';
    } else if (riskScore > 50) {
      recommendedAction = 'HIGH: Recommend additional verification steps';
    } else if (riskScore > 40) {
      recommendedAction = 'MEDIUM: Recommend preliminary inquiry before formal registration';
    }

    return {
      isHighRisk,
      suspiciousFIRCount: recentFIRs.length,
      timePatternAnomaly: daysDifference > 14,
      contradictoryDetails: missingDetails.length > 0,
      flags,
      recommendedAction,
    };
  }

  /**
   * Check if a statement contains contradictory information
   */
  static analyzeStatementForContradictions(statementText: string, otherStatements: string[]): {
    hasContradictions: boolean;
    contradictions: string[];
  } {
    const contradictions: string[] = [];

    // Simple pattern matching for common contradictions
    const timePatterns = statementText.match(/\b(\d{1,2}:\d{2}\s?(?:AM|PM|am|pm)|morning|noon|evening|night)\b/gi);
    const datePatterns = statementText.match(/\b(\d{1,2}\/\d{1,2}\/\d{4}|yesterday|today|tomorrow)\b/gi);

    for (const other of otherStatements) {
      if (datePatterns) {
        const otherDates = other.match(/\b(\d{1,2}\/\d{1,2}\/\d{4}|yesterday|today|tomorrow)\b/gi);
        if (otherDates && JSON.stringify(datePatterns) !== JSON.stringify(otherDates)) {
          contradictions.push('Different date/time reported in statements');
        }
      }
    }

    return {
      hasContradictions: contradictions.length > 0,
      contradictions,
    };
  }

  /**
   * Generate preliminary inquiry recommendations
   */
  static async generateInquiryRecommendations(firId: string) {
    const fir = await prisma.fIR.findUnique({
      where: { id: firId },
      include: {
        victim: true,
        bnsSections: true,
        victimStatements: true,
      },
    });

    if (!fir) {
      throw new Error('FIR not found');
    }

    const recommendations: string[] = [];

    // Recommendation based on BNS section
    if (fir.bnsSections.length > 0) {
      const section = fir.bnsSections[0];
      if (section.category === 'FINANCIAL_FRAUD') {
        recommendations.push('Verify complainant bank statements and transaction details');
        recommendations.push('Request accused communication records');
      } else if (section.category === 'CYBERCRIME') {
        recommendations.push('Request device logs and server records');
        recommendations.push('Engage cybercrime cell for technical forensics');
      }
    }

    // Recommendations based on evidence availability
    if (!fir.victimStatements || fir.victimStatements.length === 0) {
      recommendations.push('Record detailed statement from victim before filing');
    }

    // Time-based recommendations
    const daysSinceFiling = Math.floor(
      (new Date().getTime() - new Date(fir.createdAt).getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSinceFiling > 7 && fir.status === FIRStatus.DRAFT) {
      recommendations.push('FIR pending registration for over 7 days - immediate action required');
    }

    return {
      firId,
      recommendations,
      priority: recommendations.length > 2 ? 'HIGH' : 'NORMAL',
    };
  }

  /**
   * Monitor FIRs for investigation delays
   */
  static async checkInvestigationDelays() {
    const nineDaysAgo = new Date(new Date().getTime() - 9 * 24 * 60 * 60 * 1000);

    const delayedFIRs = await prisma.fIR.findMany({
      where: {
        createdAt: {
          lte: nineDaysAgo,
        },
        status: {
          in: [FIRStatus.ACKNOWLEDGED, FIRStatus.UNDER_INVESTIGATION],
        },
      },
      include: {
        officer: true,
        station: true,
        victim: true,
      },
    });

    return delayedFIRs.map((fir) => ({
      firId: fir.id,
      firNumber: fir.firNumber,
      daysInvestigating: Math.floor(
        (new Date().getTime() - new Date(fir.createdAt).getTime()) / (1000 * 60 * 60 * 24),
      ),
      status: fir.status,
      assignedOfficer: fir.officer?.badgeNumber,
      station: fir.station.name,
      alert: 'Investigation delay - check compliance with 90-day deadline',
    }));
  }
}
