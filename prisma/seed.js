import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

// BNS Section data with mapping reasoning
const BNS_DATA = [
  {
    sectionNumber: '103',
    sectionTitle: 'Punishment for Murder',
    category: 'VIOLENT',
    mappingReasoning: 'BNS 103 directly corresponds to IPC 302 as both laws define murder with intent to cause death or knowledge that death is likely to result. The transition from IPC to BNS maintained the same legal principle and punishment framework for the most serious form of homicide offense.',
  },
  {
    sectionNumber: '104',
    sectionTitle: 'Punishment for Culpable Homicide not amounting to Murder',
    category: 'VIOLENT',
    mappingReasoning: 'BNS 104 aligns with IPC 304 as both cover homicide where the perpetrator lacked the specific intent to cause death but acted recklessly or negligently, resulting in death. The distinction from murder lies in the absence of premeditation or specific intention.',
  },
  {
    sectionNumber: '115',
    sectionTitle: 'Punishment for Voluntarily Causing Hurt',
    category: 'VIOLENT',
    mappingReasoning: 'BNS 115 corresponds to IPC 323 as both define hurt as bodily pain, sickness, or infirmity caused voluntarily to another person. Both statutes apply to lesser physical injuries not causing serious harm, and both allow for compounding of the offense with victim consent.',
  },
  {
    sectionNumber: '121',
    sectionTitle: 'Punishment for Causing Grievous Hurt',
    category: 'VIOLENT',
    mappingReasoning: 'BNS 121 maps to IPC 325 as both laws define grievous hurt as causing eight specific types of serious injuries including fractures, blindness, or disfigurement. The more severe nature of injuries triggers cognizable offense status and higher penalties compared to simple hurt provisions.',
  },
  {
    sectionNumber: '303',
    sectionTitle: 'Punishment for Theft',
    category: 'PROPERTY',
    mappingReasoning: 'BNS 303 directly corresponds to IPC 379 as both define theft as dishonestly taking movable property intending to deprive the owner permanently. Both statutes form the foundation for property crime prosecution and allow compounding, reflecting the law\'s recognition that property disputes can be settled between parties.',
  },
  {
    sectionNumber: '316',
    sectionTitle: 'Punishment for Cheating',
    category: 'FINANCIAL_FRAUD',
    mappingReasoning: 'BNS 316 aligns with IPC 420 as both prosecute fraudulent deception causing property loss. The key distinction from simple theft is the use of deception or dishonest inducement, making these crimes particularly serious as they exploit victim trust. Higher penalties reflect the moral culpability of deliberate deception.',
  },
  {
    sectionNumber: '351',
    sectionTitle: 'Punishment for Criminal Intimidation',
    category: 'PUBLIC_ORDER',
    mappingReasoning: 'BNS 351 corresponds to IPC 503 as both address threats of injury designed to coerce or frighten a person into action or inaction. Criminal intimidation operates through psychological harm rather than physical harm, and both statutes allow compounding to permit private settlement when appropriate.',
  },
];

async function main() {
  console.log('🌱 Starting database seed...');

  // Update BNS sections with mapping reasoning
  for (const data of BNS_DATA) {
    try {
      const existing = await prisma.bNSSection.findUnique({
        where: { sectionNumber: data.sectionNumber },
      });

      if (existing) {
        // Update existing section with reasoning
        await prisma.bNSSection.update({
          where: { sectionNumber: data.sectionNumber },
          data: {
            mappingReasoning: data.mappingReasoning,
          },
        });
        console.log(`✅ Updated BNS ${data.sectionNumber} with reasoning`);
      } else {
        console.log(`⚠️  BNS ${data.sectionNumber} not found in database. Skipping.`);
      }
    } catch (error) {
      console.error(`❌ Error processing BNS ${data.sectionNumber}:`, error.message);
    }
  }

  console.log('✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
