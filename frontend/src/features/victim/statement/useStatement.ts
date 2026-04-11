import { useEffect, useState } from 'react';
import { statementService, type VictimStatementPayload } from '../../../services/statementService';

export const useStatement = () => {
  const [latestStatement, setLatestStatement] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLatest = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await statementService.getLatest();
      setLatestStatement(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to load your latest statement.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const saveStatement = async (payload: VictimStatementPayload) => {
    setIsLoading(true);
    setError(null);

    try {
      const created = await statementService.create(payload);
      setLatestStatement(created);
      return created;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to save your statement.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadLatest();
  }, []);

  return { latestStatement, isLoading, error, saveStatement, reload: loadLatest };
};
