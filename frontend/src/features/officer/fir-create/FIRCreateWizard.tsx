import { useState, useEffect } from 'react';
import { ChevronRight, AlertCircle, CheckCircle2, Loader2, Info } from 'lucide-react';
import { officerService } from '../../../services/officerService';

type FIRFormData = {
  incidentDate: string;
  incidentTime: string;
  incidentLocation: string;
  incidentDescription: string;
  bnsSection: string;
  victimName: string;
  victimPhone: string;
  victimAddress: string;
  victimEmail?: string;
  weaponUsed?: string;
  eyewitnesses?: string;
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
};

type BNSSectionDetail = {
  sectionNumber: string;
  sectionTitle: string;
  ipcEquivalent?: string;
  ipcTitle?: string;
  ipcDescription?: string;
  mappingReasoning?: string;
};

type Step = 1 | 2 | 3 | 4 | 5;

const STEPS = [
  { id: 1, label: 'Incident Details', icon: '📍' },
  { id: 2, label: 'Victim Information', icon: '👤' },
  { id: 3, label: 'Crime Classification', icon: '🏛️' },
  { id: 4, label: 'Evidence & Witness', icon: '🔍' },
  { id: 5, label: 'Review & Submit', icon: '✓' },
];

const BNS_SECTIONS = [
  { value: '103', label: '103 - Murder' },
  { value: '104', label: '104 - Culpable Homicide' },
  { value: '115', label: '115 - Voluntarily Causing Hurt' },
  { value: '121', label: '121 - Causing Grievous Hurt' },
  { value: '303', label: '303 - Theft' },
  { value: '316', label: '316 - Cheating' },
  { value: '351', label: '351 - Criminal Intimidation' },
];

export const FIRCreateWizard = () => {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedBnsDetail, setSelectedBnsDetail] = useState<BNSSectionDetail | null>(null);
  const [loadingBnsDetail, setLoadingBnsDetail] = useState(false);

  const [formData, setFormData] = useState<FIRFormData>({
    incidentDate: new Date().toISOString().split('T')[0],
    incidentTime: '12:00',
    incidentLocation: '',
    incidentDescription: '',
    bnsSection: '351',
    victimName: '',
    victimPhone: '',
    victimAddress: '',
    victimEmail: '',
    weaponUsed: '',
    eyewitnesses: '',
    urgencyLevel: 'MEDIUM',
  });

  // Fetch BNS section details when selection changes
  useEffect(() => {
    if (!formData.bnsSection) {
      setSelectedBnsDetail(null);
      return;
    }

    const fetchBnsDetail = async () => {
      setLoadingBnsDetail(true);
      try {
        const response = await officerService.getBnsBySectionNumber(formData.bnsSection);
        if (response?.bnsSection) {
          setSelectedBnsDetail({
            sectionNumber: response.bnsSection.sectionNumber,
            sectionTitle: response.bnsSection.sectionTitle,
            ipcEquivalent: response.bnsSection.ipcEquivalent || undefined,
            ipcTitle: response.bnsSection.ipcTitle || undefined,
            ipcDescription: response.bnsSection.ipcDescription || undefined,
            mappingReasoning: response.bnsSection.mappingReasoning || undefined,
          });
        }
      } catch (err) {
        console.error('Failed to fetch BNS details:', err);
        // Set minimal details if API fails
        const section = BNS_SECTIONS.find(s => s.value === formData.bnsSection);
        if (section) {
          setSelectedBnsDetail({
            sectionNumber: formData.bnsSection,
            sectionTitle: section.label.split(' - ')[1],
          });
        }
      } finally {
        setLoadingBnsDetail(false);
      }
    };

    fetchBnsDetail();
  }, [formData.bnsSection]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const validateStep = (step: Step): boolean => {
    switch (step) {
      case 1:
        if (!formData.incidentDate || !formData.incidentLocation || !formData.incidentDescription) {
          setError('Please fill in all incident details');
          return false;
        }
        return true;
      case 2:
        if (!formData.victimName || !formData.victimPhone || !formData.victimAddress) {
          setError('Please fill in all victim information');
          return false;
        }
        return true;
      case 3:
        if (!formData.bnsSection) {
          setError('Please select a crime classification');
          return false;
        }
        return true;
      case 4:
        // Evidence and witnesses are optional
        return true;
      case 5:
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 5) {
        setCurrentStep((currentStep + 1) as Step);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate all steps
      for (let step = 1; step <= 5; step++) {
        if (!validateStep(step as Step)) {
          setLoading(false);
          return;
        }
      }

      // Combine date and time
      const incidentDateTime = new Date(`${formData.incidentDate}T${formData.incidentTime}`);

      // Create FIR payload
      const firPayload = {
        incidentDate: incidentDateTime,
        incidentTime: formData.incidentTime,
        incidentLocation: formData.incidentLocation,
        incidentDescription: formData.incidentDescription,
        bnsSection: formData.bnsSection,
        victimName: formData.victimName,
        victimPhone: formData.victimPhone,
        victimAddress: formData.victimAddress,
        victimEmail: formData.victimEmail,
        weaponUsed: formData.weaponUsed,
        eyewitnesses: formData.eyewitnesses,
        urgencyLevel: formData.urgencyLevel,
      };

      // Call API to create FIR
      const result = await officerService.createFIR(firPayload);

      setSuccess(`FIR ${result.firNumber} has been successfully created and registered.`);

      // Reset form after successful submission
      setTimeout(() => {
        setCurrentStep(1);
        setFormData({
          incidentDate: new Date().toISOString().split('T')[0],
          incidentTime: '12:00',
          incidentLocation: '',
          incidentDescription: '',
          bnsSection: '351',
          victimName: '',
          victimPhone: '',
          victimAddress: '',
          victimEmail: '',
          weaponUsed: '',
          eyewitnesses: '',
          urgencyLevel: 'MEDIUM',
        });
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create FIR');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <button
                onClick={() => {
                  if (step.id < currentStep || validateStep(currentStep)) {
                    setCurrentStep(step.id as Step);
                  }
                }}
                className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-colors ${
                  step.id === currentStep
                    ? 'bg-[#F97316] text-white'
                    : step.id < currentStep
                      ? 'bg-[#10b981] text-white'
                      : 'bg-gray-700 text-gray-300'
                }`}
              >
                {step.id < currentStep ? '✓' : step.id}
              </button>
              <div className="ml-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{step.label}</p>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`flex-1 h-1 mx-4 mt-1 ${step.id < currentStep ? 'bg-[#10b981]' : 'bg-gray-700'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-8 mb-6">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-300">{success}</p>
          </div>
        )}

        {/* Step 1: Incident Details */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-white mb-6">Incident Details</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Date of Incident</label>
                <input
                  type="date"
                  name="incidentDate"
                  value={formData.incidentDate}
                  onChange={handleInputChange}
                  className="w-full rounded-lg bg-[#2a2a2a] border border-white/10 px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Time of Incident</label>
                <input
                  type="time"
                  name="incidentTime"
                  value={formData.incidentTime}
                  onChange={handleInputChange}
                  className="w-full rounded-lg bg-[#2a2a2a] border border-white/10 px-4 py-2 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Location of Incident</label>
              <input
                type="text"
                name="incidentLocation"
                placeholder="e.g., Market Street, Sector 5, City"
                value={formData.incidentLocation}
                onChange={handleInputChange}
                className="w-full rounded-lg bg-[#2a2a2a] border border-white/10 px-4 py-2 text-white placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description of Incident</label>
              <textarea
                name="incidentDescription"
                placeholder="Provide a detailed description of what happened..."
                value={formData.incidentDescription}
                onChange={handleInputChange}
                rows={5}
                className="w-full rounded-lg bg-[#2a2a2a] border border-white/10 px-4 py-2 text-white placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Urgency Level</label>
              <select
                name="urgencyLevel"
                value={formData.urgencyLevel}
                onChange={handleInputChange}
                className="w-full rounded-lg bg-[#2a2a2a] border border-white/10 px-4 py-2 text-white"
              >
                <option value="LOW">Low - Minor incident</option>
                <option value="MEDIUM">Medium - Standard incident</option>
                <option value="HIGH">High - Serious incident</option>
                <option value="CRITICAL">Critical - Immediate danger</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 2: Victim Information */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-white mb-6">Victim Information</h2>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Victim Name</label>
              <input
                type="text"
                name="victimName"
                placeholder="Full name of victim"
                value={formData.victimName}
                onChange={handleInputChange}
                className="w-full rounded-lg bg-[#2a2a2a] border border-white/10 px-4 py-2 text-white placeholder-gray-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                <input
                  type="tel"
                  name="victimPhone"
                  placeholder="+91-9876543210"
                  value={formData.victimPhone}
                  onChange={handleInputChange}
                  className="w-full rounded-lg bg-[#2a2a2a] border border-white/10 px-4 py-2 text-white placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email (Optional)</label>
                <input
                  type="email"
                  name="victimEmail"
                  placeholder="victim@example.com"
                  value={formData.victimEmail}
                  onChange={handleInputChange}
                  className="w-full rounded-lg bg-[#2a2a2a] border border-white/10 px-4 py-2 text-white placeholder-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
              <textarea
                name="victimAddress"
                placeholder="Enter victim's address..."
                value={formData.victimAddress}
                onChange={handleInputChange}
                rows={3}
                className="w-full rounded-lg bg-[#2a2a2a] border border-white/10 px-4 py-2 text-white placeholder-gray-500"
              />
            </div>
          </div>
        )}

        {/* Step 3: Crime Classification */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-white mb-6">Crime Classification (BNS Section)</h2>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Select Applicable BNS Section</label>
              <select
                name="bnsSection"
                value={formData.bnsSection}
                onChange={handleInputChange}
                className="w-full rounded-lg bg-[#2a2a2a] border border-white/10 px-4 py-2 text-white"
              >
                {BNS_SECTIONS.map((section) => (
                  <option key={section.value} value={section.value}>
                    {section.label}
                  </option>
                ))}
              </select>
            </div>

            {loadingBnsDetail ? (
              <div className="bg-[#2a2a2a] rounded-lg p-6 border border-white/10 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#F97316]" />
                <p className="text-sm text-gray-400">Loading section details...</p>
              </div>
            ) : selectedBnsDetail ? (
              <>
                {/* BNS Section Details Card */}
                <div className="bg-[#2a2a2a] rounded-lg p-4 border border-white/10">
                  <p className="text-sm text-gray-300 mb-2">
                    <strong>BNS Section {selectedBnsDetail.sectionNumber}:</strong> {selectedBnsDetail.sectionTitle}
                  </p>
                  {selectedBnsDetail.ipcEquivalent && (
                    <p className="text-sm text-gray-400">
                      <strong>IPC Equivalent:</strong> Section {selectedBnsDetail.ipcEquivalent} {selectedBnsDetail.ipcTitle && `- ${selectedBnsDetail.ipcTitle}`}
                    </p>
                  )}
                </div>

                {/* Mapping Reasoning */}
                {selectedBnsDetail.mappingReasoning && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex gap-3">
                      <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-300 mb-2">Mapping Reasoning</p>
                        <p className="text-sm text-blue-200">{selectedBnsDetail.mappingReasoning}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* IPC Description */}
                {selectedBnsDetail.ipcDescription && (
                  <div className="bg-[#2a2a2a] rounded-lg p-4 border border-white/10">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">IPC Section Description</p>
                    <p className="text-sm text-gray-300">{selectedBnsDetail.ipcDescription}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-[#2a2a2a] rounded-lg p-4 border border-white/10">
                <p className="text-sm text-gray-400">Select a BNS section to view detailed information and mapping reasoning.</p>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Evidence & Witnesses */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-white mb-6">Evidence & Witnesses</h2>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Weapon Used (if any)</label>
              <input
                type="text"
                name="weaponUsed"
                placeholder="e.g., Knife, Gun, Blunt object..."
                value={formData.weaponUsed}
                onChange={handleInputChange}
                className="w-full rounded-lg bg-[#2a2a2a] border border-white/10 px-4 py-2 text-white placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Eyewitnesses</label>
              <textarea
                name="eyewitnesses"
                placeholder="Names and contact details of eyewitnesses..."
                value={formData.eyewitnesses}
                onChange={handleInputChange}
                rows={4}
                className="w-full rounded-lg bg-[#2a2a2a] border border-white/10 px-4 py-2 text-white placeholder-gray-500"
              />
            </div>

            <div className="bg-[#2a2a2a] rounded-lg p-4 border border-white/10">
              <p className="text-sm text-gray-400">Evidence and witnesses can be updated after FIR creation.</p>
            </div>
          </div>
        )}

        {/* Step 5: Review & Submit */}
        {currentStep === 5 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-white mb-6">Review & Submit FIR</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#2a2a2a] rounded-lg p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Incident Details</p>
                <div className="space-y-1 text-sm text-gray-300">
                  <p><strong>Date:</strong> {formData.incidentDate} {formData.incidentTime}</p>
                  <p><strong>Location:</strong> {formData.incidentLocation}</p>
                  <p><strong>Urgency:</strong> {formData.urgencyLevel}</p>
                </div>
              </div>

              <div className="bg-[#2a2a2a] rounded-lg p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Victim Information</p>
                <div className="space-y-1 text-sm text-gray-300">
                  <p><strong>Name:</strong> {formData.victimName}</p>
                  <p><strong>Phone:</strong> {formData.victimPhone}</p>
                  <p><strong>Address:</strong> {formData.victimAddress.substring(0, 30)}...</p>
                </div>
              </div>

              <div className="bg-[#2a2a2a] rounded-lg p-4 col-span-2">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Crime Classification</p>
                <div className="space-y-2 text-sm text-gray-300">
                  <p><strong>BNS Section:</strong> {BNS_SECTIONS.find((s) => s.value === formData.bnsSection)?.label}</p>
                  {selectedBnsDetail?.ipcEquivalent && (
                    <p><strong>IPC Equivalent:</strong> Section {selectedBnsDetail.ipcEquivalent}</p>
                  )}
                  {selectedBnsDetail?.mappingReasoning && (
                    <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-200">
                      <p className="font-semibold mb-1">Mapping Reasoning:</p>
                      <p>{selectedBnsDetail.mappingReasoning}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-sm text-blue-300">
                By submitting this FIR, you confirm that all the information provided is accurate and true to the best
                of your knowledge.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-4">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 1 || loading}
          className="px-6 py-2 rounded-lg bg-gray-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <div className="flex gap-4">
          {currentStep < 5 ? (
            <button
              onClick={handleNext}
              disabled={loading}
              className="px-8 py-2 rounded-lg bg-[#F97316] text-white font-medium hover:bg-[#ea580c] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {loading ? 'Creating FIR...' : 'Create FIR'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};