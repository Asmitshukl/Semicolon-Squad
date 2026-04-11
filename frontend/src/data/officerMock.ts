export type Urgency = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type FIRStatus = 'AI Ready' | 'Under Review' | 'Document Generated' | 'Signed';

export type VoiceRec = {
  id: string;
  firId?: string;
  firNo: string;
  label: string;
  duration: string;
  language: string;
  verified: boolean;
  recordedAt: string;
  transcript?: string;
  audioUrl?: string;
};

export type TimelineEntry = { action: string; time: string };

export type MockFIR = {
  id: string;
  firNo: string;
  bnsCode: string;
  bnsTitle: string;
  ipcEquiv: string;
  punishmentLine: string;
  cognizable: string;
  bailable: string;
  urgency: Urgency;
  status: FIRStatus;
  received: string;
  location: string;
  aiSummaryLine: string;
  victimName: string;
  victimPhone: string;
  incidentDate: string;
  statement: string;
  statementTags: string[];
  aiSummaryDefault: string;
  voiceNote: string;
  timeline: TimelineEntry[];
  checklistVoiceOk: boolean;
};

export const OFFICER = {
  name: 'SI Rajesh Kumar Singh',
  badge: 'DL-SI-4821',
  station: 'Connaught Place PS',
  district: 'Central Delhi',
  rank: 'Sub-Inspector',
  department: 'Delhi Police',
  cctnsId: 'CCTNS-DL-2024-8821',
  verifiedAt: '10 Apr 2024, 11:23:03 AM',
  docsGenerated: 47,
  firsHandled: 89,
  voiceVerified: 12,
} as const;

const base = (partial: Partial<MockFIR> & Pick<MockFIR, 'id' | 'firNo' | 'urgency' | 'status' | 'received' | 'bnsCode' | 'bnsTitle' | 'ipcEquiv'>): MockFIR => ({
  punishmentLine: 'Death or Life Imprisonment',
  cognizable: 'Cognizable',
  bailable: 'Non-Bailable',
  location: 'Connaught Place, New Delhi',
  aiSummaryLine: 'Ready to review · 1 voice recording',
  victimName: 'R***sh K***r',
  victimPhone: '+91 98XXX XXXXX',
  incidentDate: '12 Apr 2024, 02:30:00 AM',
  statement:
    'मैं रात को सर्कल पर था। दो लोगों ने मारपीट की और धमकी दी। मैंने तुरंत पुलिस को फोन किया। I fear for my safety.',
  statementTags: ['Voice Input', 'Hindi', 'Auto-translated'],
  aiSummaryDefault:
    'Complainant alleges assault and threats by two unknown persons at Connaught Place inner circle on the night of 11–12 Apr 2024. Complainant requests protection and registration of FIR under relevant BNS provisions.',
  voiceNote: '1 voice recording',
  timeline: [
    { action: 'FIR received from victim portal', time: '09 Apr 2024, 09:41:03 AM' },
    { action: 'AI summary generated', time: '09 Apr 2024, 09:41:18 AM' },
    { action: 'Reviewed by SI Rajesh Kumar', time: '09 Apr 2024, 09:52:44 AM' },
  ],
  checklistVoiceOk: false,
  ...partial,
});

export const MOCK_FIRS: MockFIR[] = [
  base({
    id: '2024-DL-00892',
    firNo: '#2024-DL-00892',
    bnsCode: '§103',
    bnsTitle: 'Murder',
    ipcEquiv: '§302',
    urgency: 'CRITICAL',
    status: 'AI Ready',
    received: '09 Apr 2024, 09:41:03 AM',
    aiSummaryLine: 'Ready to review · 1 voice recording',
    checklistVoiceOk: false,
  }),
  base({
    id: '2024-DL-00891',
    firNo: '#2024-DL-00891',
    bnsCode: '§115',
    bnsTitle: 'Grievous Hurt',
    ipcEquiv: '§325',
    urgency: 'HIGH',
    status: 'Under Review',
    received: '08 Apr 2024, 04:22:18 PM',
    punishmentLine: 'Imprisonment up to 7 years',
    aiSummaryLine: 'Medical report pending',
    checklistVoiceOk: true,
  }),
  base({
    id: '2024-DL-00890',
    firNo: '#2024-DL-00890',
    bnsCode: '§316',
    bnsTitle: 'Cheating',
    ipcEquiv: '§420',
    urgency: 'MEDIUM',
    status: 'Document Generated',
    received: '07 Apr 2024, 11:05:00 AM',
    punishmentLine: 'Imprisonment and fine',
    bailable: 'Bailable',
    aiSummaryLine: 'Document pack complete',
    checklistVoiceOk: true,
  }),
  base({
    id: '2024-DL-00889',
    firNo: '#2024-DL-00889',
    bnsCode: '§351',
    bnsTitle: 'Criminal Intimidation',
    ipcEquiv: '§503',
    urgency: 'LOW',
    status: 'Signed',
    received: '06 Apr 2024, 02:15:22 PM',
    punishmentLine: 'Imprisonment up to 2 years',
    bailable: 'Bailable',
    aiSummaryLine: 'Signed and closed loop',
    checklistVoiceOk: true,
  }),
  base({
    id: '2024-DL-00888',
    firNo: '#2024-DL-00888',
    bnsCode: '§303',
    bnsTitle: 'Theft',
    ipcEquiv: '§379',
    urgency: 'MEDIUM',
    status: 'AI Ready',
    received: '05 Apr 2024, 10:00:01 AM',
  }),
  base({
    id: '2024-DL-00887',
    firNo: '#2024-DL-00887',
    bnsCode: '§75',
    bnsTitle: 'Sexual harassment',
    ipcEquiv: '§354A',
    urgency: 'HIGH',
    status: 'Under Review',
    received: '04 Apr 2024, 03:44:09 PM',
  }),
  base({
    id: '2024-DL-00886',
    firNo: '#2024-DL-00886',
    bnsCode: '§115',
    bnsTitle: 'Grievous Hurt',
    ipcEquiv: '§325',
    urgency: 'LOW',
    status: 'Signed',
    received: '03 Apr 2024, 08:12:33 AM',
  }),
  base({
    id: '2024-DL-00885',
    firNo: '#2024-DL-00885',
    bnsCode: '§316',
    bnsTitle: 'Cheating',
    ipcEquiv: '§420',
    urgency: 'LOW',
    status: 'Document Generated',
    received: '02 Apr 2024, 06:30:45 PM',
  }),
  base({
    id: '2024-DL-00884',
    firNo: '#2024-DL-00884',
    bnsCode: '§103',
    bnsTitle: 'Murder',
    ipcEquiv: '§302',
    urgency: 'CRITICAL',
    status: 'Under Review',
    received: '01 Apr 2024, 11:11:11 AM',
  }),
  base({
    id: '2024-DL-00883',
    firNo: '#2024-DL-00883',
    bnsCode: '§351',
    bnsTitle: 'Criminal Intimidation',
    ipcEquiv: '§503',
    urgency: 'MEDIUM',
    status: 'AI Ready',
    received: '31 Mar 2024, 09:09:09 AM',
  }),
  base({
    id: '2024-DL-00882',
    firNo: '#2024-DL-00882',
    bnsCode: '§303',
    bnsTitle: 'Theft',
    ipcEquiv: '§379',
    urgency: 'HIGH',
    status: 'AI Ready',
    received: '30 Mar 2024, 05:55:55 PM',
  }),
  base({
    id: '2024-DL-00881',
    firNo: '#2024-DL-00881',
    bnsCode: '§316',
    bnsTitle: 'Cheating',
    ipcEquiv: '§420',
    urgency: 'MEDIUM',
    status: 'Under Review',
    received: '29 Mar 2024, 12:12:12 PM',
  }),
];

export const MOCK_VOICE_GLOBAL: VoiceRec[] = [
  { id: 'v1', firNo: '#2024-DL-00892', label: 'Recording 1', duration: '02:34', language: 'HI', verified: false, recordedAt: '09 Apr 2024, 09:38:00 AM' },
  { id: 'v2', firNo: '#2024-DL-00892', label: 'Recording 2', duration: '01:12', language: 'HI', verified: true, recordedAt: '09 Apr 2024, 09:40:00 AM' },
  { id: 'v3', firNo: '#2024-DL-00891', label: 'Recording 1', duration: '03:01', language: 'EN', verified: false, recordedAt: '08 Apr 2024, 04:10:00 PM' },
  { id: 'v4', firNo: '#2024-DL-00890', label: 'Recording 1', duration: '00:48', language: 'HI', verified: true, recordedAt: '07 Apr 2024, 10:55:00 AM' },
];

export const getFIR = (id: string | undefined) => MOCK_FIRS.find((f) => f.id === id) ?? MOCK_FIRS[0];

export const DASHBOARD_STATS = [
  { value: '14', label: 'FIRs Received', labelHi: 'प्राप्त एफआईआर' },
  { value: '6', label: 'Documents Pending', labelHi: 'लंबित दस्तावेज़' },
  { value: '3', label: 'Reviewed Today', labelHi: 'आज समीक्षित' },
  { value: '2', label: 'Voice Unverified', labelHi: 'असत्यापित आवाज़' },
] as const;

export const BNS_IPC_MAP: Record<
  string,
  { bnsTitle: string; ipc: string; ipcTitle: string; detail: string; cog: string; bail: string }
> = {
  '103': {
    bnsTitle: 'Murder',
    ipc: '§302',
    ipcTitle: 'Murder',
    detail: 'Death or Life Imprisonment',
    cog: 'Cognizable',
    bail: 'Non-Bailable',
  },
  '115': {
    bnsTitle: 'Grievous Hurt',
    ipc: '§325',
    ipcTitle: 'Grievous Hurt',
    detail: 'Imprisonment up to 7 years',
    cog: 'Cognizable',
    bail: 'Bailable / Non-Bailable (facts dependent)',
  },
  '316': {
    bnsTitle: 'Cheating',
    ipc: '§420',
    ipcTitle: 'Cheating',
    detail: 'Imprisonment and fine',
    cog: 'Cognizable',
    bail: 'Bailable',
  },
  '351': {
    bnsTitle: 'Criminal Intimidation',
    ipc: '§503',
    ipcTitle: 'Criminal Intimidation',
    detail: 'Imprisonment up to 2 years',
    cog: 'Cognizable',
    bail: 'Bailable',
  },
};

export const RECENT_BNS_KEYS = ['103', '115', '316', '351'] as const;
