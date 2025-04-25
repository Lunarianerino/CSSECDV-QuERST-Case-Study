// Its api is very similar to the input-OTP component
// Supply a Schema, current Value, and a onChange function props
// I have exported a schema type just to help

import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NextComponentType } from "next";
import { useState } from "react";

interface Option {
  value: string;
  label: string;
  // Optional email field for search functionality
  email?: string;
}

// make a interface called ComboboxSchema that extends Option[]
export type ComboboxSchema = Option[];

interface ComboboxProps {
  schema?: Option[];
  options?: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const Combobox: NextComponentType<{}, {}, ComboboxProps> = ({
  schema,
  options,
  value,
  onChange,
  placeholder = "Select option...",
}) => {
  // Use options if provided, otherwise use schema
  const items = options || schema || [];
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span className="truncate flex-1">
            {value
              ? items.find((option) => option.value === value)?.label
              : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 z-[9999]">
        <Command>
          <CommandInput placeholder="Search option..." />
          <CommandEmpty>No option found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {items.map((option) => (
                <CommandItem
                  key={option.value}
                  // Include both name (from label) and email in the searchable value
                  value={option.email ? `${option.label} ${option.email}` : option.label}
                  onSelect={() => {
                    onChange(option.value === value ? "" : option.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default Combobox;