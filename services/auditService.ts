export interface AuditLogEntry {
  timestamp: string;
  action: string;
  details?: string;
}

const STORAGE_KEY = 'smartfinance_audit_log';

export const logAction = (action: string, details?: string) => {
  try {
    const existingLogsRaw = localStorage.getItem(STORAGE_KEY);
    const logs: AuditLogEntry[] = existingLogsRaw ? JSON.parse(existingLogsRaw) : [];
    
    const newEntry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      action,
      details
    };

    // Keep last 100 entries to prevent storage bloat
    const updatedLogs = [newEntry, ...logs].slice(0, 100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLogs));
  } catch (error) {
    console.error('Audit logging failed', error);
  }
};

export const getAuditLogs = (): AuditLogEntry[] => {
  try {
    const logs = localStorage.getItem(STORAGE_KEY);
    return logs ? JSON.parse(logs) : [];
  } catch (error) {
    return [];
  }
};

export const clearAuditLogs = () => {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Failed to clear logs', error);
    }
}