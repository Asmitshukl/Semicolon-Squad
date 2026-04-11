import { useCallback, useState } from 'react';
import { bnsService } from '../../../services/bnsService';

export const useClassification = () => {
  const [classification, setClassification] = useState<any>(null);
  const [resolution, setResolution] = useState<any>(null);
  const [rights, setRights] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const classify = useCallback(async (statementId?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await bnsService.classify(statementId);
      setClassification(result);
      if (result?.victimStatementId) {
        const [resolutionData, rightsData] = await Promise.all([
          bnsService.getResolution(result.victimStatementId),
          bnsService.getRights(result.victimStatementId),
        ]);
        setResolution(resolutionData);
        setRights(rightsData);
      }
      return result;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to classify your statement.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { classification, resolution, rights, isLoading, error, classify };
};
