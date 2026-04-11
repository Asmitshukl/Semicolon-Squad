import { useEffect, useState } from 'react';
import { firService } from '../../../services/firService';

export const useTracker = () => {
  const [cases, setCases] = useState<any[]>([]);
  const [trackedCase, setTrackedCase] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCases = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await firService.listVictimCases();
      setCases(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load your cases.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const trackCase = async (acknowledgmentNo: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await firService.trackByAcknowledgment(acknowledgmentNo);
      setTrackedCase(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to track this case.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCases();
  }, []);

  return { cases, trackedCase, isLoading, error, trackCase, reload: loadCases };
};
