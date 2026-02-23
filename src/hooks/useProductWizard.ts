"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface WizardState {
    currentStep: number;
    completedSteps: number[];
    isGuidedMode: boolean; // Show/Hide Context Helper

    setStep: (step: number) => void;
    toggleGuidedMode: () => void;
    markStepComplete: (step: number) => void;
    resetWizard: () => void;
}

export const useProductWizard = create<WizardState>()(
    persist(
        (set) => ({
            currentStep: 0,
            completedSteps: [],
            isGuidedMode: true,

            setStep: (step) => set({ currentStep: step }),
            toggleGuidedMode: () => set((state) => ({ isGuidedMode: !state.isGuidedMode })),
            markStepComplete: (step) => set((state) => {
                if (state.completedSteps.includes(step)) return state;
                return { completedSteps: [...state.completedSteps, step] };
            }),
            resetWizard: () => set({ currentStep: 0, completedSteps: [] }),
        }),
        {
            name: "product-wizard-storage",
            storage: createJSONStorage(() => sessionStorage), // Session storage to clear on close tabs usually, but user asked for persistence.
        }
    )
);
