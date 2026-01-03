import { useApp } from '@/context/AppContext';
import type { PatientProfile, Medication } from '@/types';

const generateId = () => Math.random().toString(36).substring(2, 15);

export function useProfile() {
  const { profile, updateProfile } = useApp();

  const initializeProfile = (data: Partial<PatientProfile>) => {
    const newProfile: PatientProfile = {
      id: generateId(),
      name: data.name || '',
      age: data.age || 0,
      sex: data.sex || 'other',
      medications: data.medications || [],
      conditions: data.conditions || [],
      allergies: data.allergies || [],
    };
    updateProfile(newProfile);
    return newProfile;
  };

  const updateBasicInfo = (data: { name?: string; age?: number; sex?: 'male' | 'female' | 'other' }) => {
    if (!profile) return;
    updateProfile({ ...profile, ...data });
  };

  const addMedication = (medication: Medication) => {
    if (!profile) return;
    updateProfile({
      ...profile,
      medications: [...profile.medications, medication],
    });
  };

  const removeMedication = (index: number) => {
    if (!profile) return;
    updateProfile({
      ...profile,
      medications: profile.medications.filter((_, i) => i !== index),
    });
  };

  const addCondition = (condition: string) => {
    if (!profile) return;
    updateProfile({
      ...profile,
      conditions: [...profile.conditions, condition],
    });
  };

  const removeCondition = (index: number) => {
    if (!profile) return;
    updateProfile({
      ...profile,
      conditions: profile.conditions.filter((_, i) => i !== index),
    });
  };

  const addAllergy = (allergy: string) => {
    if (!profile) return;
    updateProfile({
      ...profile,
      allergies: [...profile.allergies, allergy],
    });
  };

  const removeAllergy = (index: number) => {
    if (!profile) return;
    updateProfile({
      ...profile,
      allergies: profile.allergies.filter((_, i) => i !== index),
    });
  };

  return {
    profile,
    initializeProfile,
    updateBasicInfo,
    addMedication,
    removeMedication,
    addCondition,
    removeCondition,
    addAllergy,
    removeAllergy,
  };
}
