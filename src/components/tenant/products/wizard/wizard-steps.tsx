import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
    id: number;
    label: string;
}

interface WizardStepsProps {
    steps: Step[];
    currentStep: number;
}

export function WizardSteps({ steps, currentStep }: WizardStepsProps) {
    return (
        <div className="space-y-4">
            {steps.map((step, index) => {
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;

                return (
                    <div
                        key={step.id}
                        className={cn(
                            "flex items-center gap-3 p-2 rounded-md transition-colors",
                            isActive ? "bg-accent/50 text-accent-foreground font-medium" : "text-muted-foreground"
                        )}
                    >
                        <div
                            className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-full border text-xs transition-all",
                                isActive ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground",
                                isCompleted && "border-primary bg-primary/20 text-primary"
                            )}
                        >
                            {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                        </div>
                        <span className="text-sm">{step.label}</span>
                    </div>
                );
            })}
        </div>
    );
}
