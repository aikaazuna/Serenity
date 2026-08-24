import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
}

export function Select({ value, onValueChange, options, placeholder }: SelectProps) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger
        className="flex h-9 min-w-[160px] items-center justify-between gap-2 rounded-lg border border-[color:var(--panel-border)] bg-[color:var(--panel-bg)] px-3 text-sm text-[color:var(--text-primary)] outline-none transition hover:bg-[color:var(--panel-bg-strong)] focus-ring"
        aria-label={placeholder}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown className="h-3.5 w-3.5 text-secondary" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="z-[200] overflow-hidden rounded-xl border border-[color:var(--panel-border)] bg-[color:var(--sidebar-bg)] p-1 shadow-glass-lg backdrop-blur-xl"
        >
          <SelectPrimitive.Viewport>
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className="relative flex h-8 cursor-pointer select-none items-center rounded-lg px-3 pr-7 text-sm text-[color:var(--text-primary)] outline-none data-[highlighted]:bg-[color:var(--panel-bg-strong)] data-[state=checked]:text-[color:var(--text-primary)]"
              >
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="absolute right-2 inline-flex items-center">
                  <Check className="h-3.5 w-3.5" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
