// Comprehensive BNS to IPC Mapping Data
// This seed data populates the database with BNS sections and their IPC equivalents

export const BNS_IPC_MAPPINGS = [
  {
    sectionNumber: "103",
    sectionTitle: "Punishment for Murder",
    description:
      "Whoever commits murder shall be punished with imprisonment of either description for a term which may extend to life imprisonment, or with death.",
    category: "VIOLENT",
    ipcEquivalent: "302",
    ipcTitle: "IPC Section 302 - Punishment for Murder",
    ipcDescription:
      "Whoever commits murder shall be punished with imprisonment of either description for a term which may extend to life imprisonment, and shall also be liable to fine.",
    minImprisonmentMonths: 0,
    maxImprisonmentMonths: undefined,
    isLifeOrDeath: true,
    minFine: 0,
    maxFine: null,
    isBailable: false,
    isCognizable: true,
    isCompoundable: false,
    compensationNote:
      "Victim compensation may be awarded under Bharatiya Nyaya Sanhita.",
    victimsRightsNote:
      "Victims families have rights to legal aid, compensation, and witness protection.",
    mappingReasoning:
      "BNS 103 directly corresponds to IPC 302 as both laws define murder with intent to cause death or knowledge that death is likely to result. The transition from IPC to BNS maintained the same legal principle and punishment framework for the most serious form of homicide offense.",
  },
  {
    sectionNumber: "104",
    sectionTitle: "Punishment for Culpable Homicide not amounting to Murder",
    description:
      "Whoever commits culpable homicide not amounting to murder shall be punished with imprisonment of either description for a term which may extend to life imprisonment, or with fine which may extend to rupees one lakh.",
    category: "VIOLENT",
    ipcEquivalent: "304",
    ipcTitle: "IPC Section 304 - Punishment for Culpable Homicide",
    ipcDescription:
      "Whoever commits culpable homicide not amounting to murder shall be punished with imprisonment of either description for a term which may extend to ten years, or with fine which may extend to rupees one thousand.",
    minImprisonmentMonths: 0,
    maxImprisonmentMonths: 120,
    isLifeOrDeath: false,
    minFine: 0,
    maxFine: 100000,
    isBailable: true,
    isCognizable: true,
    isCompoundable: false,
    victimsRightsNote:
      "Victim families entitled to compensation and representation in court.",
    mappingReasoning:
      "BNS 104 aligns with IPC 304 as both cover homicide where the perpetrator lacked the specific intent to cause death but acted recklessly or negligently, resulting in death. The distinction from murder lies in the absence of premeditation or specific intention.",
  },
  {
    sectionNumber: "115",
    sectionTitle: "Punishment for Voluntarily Causing Hurt",
    description:
      "Whoever voluntarily causes hurt shall be punished with imprisonment of either description for a term which may extend to three months, or with fine which may extend to rupees two hundred and fifty, or with both.",
    category: "VIOLENT",
    ipcEquivalent: "323",
    ipcTitle: "IPC Section 323 - Causing Hurt",
    ipcDescription:
      "Whoever, by doing any rash or negligent act not amounting to culpable homicide, causes hurt to any person, shall be punished with imprisonment of either description for a term which may extend to three months, or with fine which may extend to rupees two hundred and fifty.",
    minImprisonmentMonths: 0,
    maxImprisonmentMonths: 3,
    isLifeOrDeath: false,
    minFine: 0,
    maxFine: 250,
    isBailable: true,
    isCognizable: false,
    isCompoundable: true,
    victimsRightsNote:
      "Victim may claim compensation for medical and other expenses.",
    mappingReasoning:
      "BNS 115 corresponds to IPC 323 as both define hurt as bodily pain, sickness, or infirmity caused voluntarily to another person. Both statutes apply to lesser physical injuries not causing serious harm, and both allow for compounding of the offense with victim consent.",
  },
  {
    sectionNumber: "121",
    sectionTitle: "Punishment for Causing Grievous Hurt",
    description:
      "Whoever voluntarily causes grievous hurt shall be punished with imprisonment of either description for a term which may extend to five years and also shall be liable to fine which may extend to rupees ten thousand.",
    category: "VIOLENT",
    ipcEquivalent: "325",
    ipcTitle: "IPC Section 325 - Voluntarily Causing Grievous Hurt",
    ipcDescription:
      "Whoever voluntarily causes grievous hurt shall be punished with imprisonment of either description for a term which may extend to seven years, and shall also be liable to fine which may extend to rupees one thousand.",
    minImprisonmentMonths: 0,
    maxImprisonmentMonths: 60,
    isLifeOrDeath: false,
    minFine: 0,
    maxFine: 10000,
    isBailable: true,
    isCognizable: true,
    isCompoundable: false,
    victimsRightsNote:
      "Victims entitled to claim compensation, medical expenses, and lost wages.",
    mappingReasoning:
      "BNS 121 maps to IPC 325 as both laws define grievous hurt as causing eight specific types of serious injuries including fractures, blindness, or disfigurement. The more severe nature of injuries triggers cognizable offense status and higher penalties compared to simple hurt provisions.",
  },
  {
    sectionNumber: "303",
    sectionTitle: "Punishment for Theft",
    description:
      "Whoever commits theft shall be punished with imprisonment of either description for a term which may extend to three years, or with fine, or with both.",
    category: "PROPERTY",
    ipcEquivalent: "379",
    ipcTitle: "IPC Section 379 - Punishment for Theft",
    ipcDescription:
      "Whoever commits theft shall be punished with imprisonment of either description for a term which may extend to three years, or with fine which may extend to rupees two hundred and fifty, or with both.",
    minImprisonmentMonths: 0,
    maxImprisonmentMonths: 36,
    isLifeOrDeath: false,
    minFine: 0,
    maxFine: 3000,
    isBailable: true,
    isCognizable: true,
    isCompoundable: true,
    compensationNote:
      "Victim entitled to claim value of stolen property plus damages.",
    victimsRightsNote:
      "Victims can claim restitution and compensation for economic loss.",
    mappingReasoning:
      "BNS 303 directly corresponds to IPC 379 as both define theft as dishonestly taking movable property intending to deprive the owner permanently. Both statutes form the foundation for property crime prosecution and allow compounding, reflecting the law's recognition that property disputes can be settled between parties.",
  },
  {
    sectionNumber: "316",
    sectionTitle: "Punishment for Cheating",
    description:
      "Whoever commits fraud shall be punished with imprisonment of either description for a term which may extend to three years, or with fine which may extend to rupees two lakh, or with both.",
    category: "FINANCIAL_FRAUD",
    ipcEquivalent: "420",
    ipcTitle: "IPC Section 420 - Cheating and Dishonestly Inducing Delivery",
    ipcDescription:
      "Whoever cheats and by means of such cheating dishonestly induces the person deceived to deliver any property to any person, or to make, alter or destroy the whole or any part of a valuable security, shall be punished with imprisonment of either description for a term which may extend to seven years, and shall also be liable to fine.",
    minImprisonmentMonths: 0,
    maxImprisonmentMonths: 36,
    isLifeOrDeath: false,
    minFine: 0,
    maxFine: 200000,
    isBailable: true,
    isCognizable: true,
    isCompoundable: false,
    compensationNote:
      "Victim can seek compensation equal to the amount defrauded.",
    victimsRightsNote:
      "Fraud victims entitled to restitution and compensation.",
    mappingReasoning:
      "BNS 316 aligns with IPC 420 as both prosecute fraudulent deception causing property loss. The key distinction from simple theft is the use of deception or dishonest inducement, making these crimes particularly serious as they exploit victim trust. Higher penalties reflect the moral culpability of deliberate deception.",
  },
  {
    sectionNumber: "351",
    sectionTitle: "Punishment for Criminal Intimidation",
    description:
      "Whoever intentionally puts any person in fear of any injury to that person, or to any other, and thereby causes that person to do any act which he would not otherwise do, or omit to do any act which that person would otherwise do, commits criminal intimidation.",
    category: "PUBLIC_ORDER",
    ipcEquivalent: "503",
    ipcTitle: "IPC Section 503 - Criminal Intimidation",
    ipcDescription:
      "Whoever threatens another with any injury to his person, reputation or property, or to the person or reputation of any one in whom that person is interested, with intent to cause alarm to that person, or to cause that person to do any act which he is legally entitled to do, or to omit to do any act which that person is legally entitled to do, commits criminal intimidation.",
    minImprisonmentMonths: 0,
    maxImprisonmentMonths: 6,
    isLifeOrDeath: false,
    minFine: 0,
    maxFine: 25000,
    isBailable: true,
    isCognizable: true,
    isCompoundable: true,
    victimsRightsNote:
      "Victims of intimidation entitled to protective orders and legal aid.",
    mappingReasoning:
      "BNS 351 corresponds to IPC 503 as both address threats of injury designed to coerce or frighten a person into action or inaction. Criminal intimidation operates through psychological harm rather than physical harm, and both statutes allow compounding to permit private settlement when appropriate.",
  },
];
