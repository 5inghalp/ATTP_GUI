import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import type { HealthCategory, HealthInsight } from '@/types';

export function useInsights() {
  const { insights, addInsights } = useApp();

  const insightsByCategory = useMemo(() => {
    return insights.reduce((acc, insight) => {
      if (!acc[insight.category]) {
        acc[insight.category] = [];
      }
      acc[insight.category].push(insight);
      return acc;
    }, {} as Record<HealthCategory, HealthInsight[]>);
  }, [insights]);

  const getInsightsByCategory = (category: HealthCategory) => {
    return insightsByCategory[category] || [];
  };

  const getInsightsBySession = (sessionId: string) => {
    return insights.filter((i) => i.sourceSessionId === sessionId);
  };

  const getCategoryCount = (category: HealthCategory) => {
    return (insightsByCategory[category] || []).length;
  };

  const totalInsights = insights.length;

  return {
    insights,
    insightsByCategory,
    addInsights,
    getInsightsByCategory,
    getInsightsBySession,
    getCategoryCount,
    totalInsights,
  };
}
