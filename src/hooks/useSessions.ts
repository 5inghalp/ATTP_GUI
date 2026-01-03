import { useApp } from '@/context/AppContext';

export function useSessions() {
  const {
    sessions,
    activeSessionId,
    activeSession,
    createSession,
    selectSession,
    deleteSession,
    updateSession,
    addMessage,
    addActionItems,
    toggleActionItem,
  } = useApp();

  const incrementQuestionCount = () => {
    if (!activeSession) return;
    updateSession({
      ...activeSession,
      questionCount: activeSession.questionCount + 1,
    });
  };

  const setSummaryMode = (isSummaryMode: boolean) => {
    if (!activeSession) return;
    updateSession({
      ...activeSession,
      isSummaryMode,
    });
  };

  const setRedFlag = (hasRedFlag: boolean) => {
    if (!activeSession) return;
    updateSession({
      ...activeSession,
      hasRedFlag,
    });
  };

  return {
    sessions,
    activeSessionId,
    activeSession,
    createSession,
    selectSession,
    deleteSession,
    updateSession,
    addMessage,
    addActionItems,
    toggleActionItem,
    incrementQuestionCount,
    setSummaryMode,
    setRedFlag,
  };
}
