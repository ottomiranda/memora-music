import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="w-full max-w-md mx-auto mb-8">
      <div className="flex items-center">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center flex-1">
            {/* Step Circle */}
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-smooth border-2",
                index < currentStep
                  ? "bg-primary text-primary-foreground border-primary"
                  : index === currentStep
                  ? "bg-primary text-primary-foreground border-primary shadow-primary"
                  : "bg-background text-muted-foreground border-border"
              )}
            >
              {index < currentStep ? (
                <Check className="w-5 h-5" />
              ) : (
                index + 1
              )}
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 mx-2 transition-smooth",
                  index < currentStep ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </div>
        ))}
      </div>
      
      {/* Step Labels */}
      <div className="flex mt-2">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center flex-1">
            <div className="w-10 flex justify-center">
              <p
                className={cn(
                  "text-xs font-medium transition-smooth text-center",
                  index <= currentStep ? "text-primary" : "text-muted-foreground"
                )}
              >
                {step}
              </p>
            </div>
            {/* Spacer for connector line */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-2" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}