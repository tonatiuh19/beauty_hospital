import * as React from "react";
import { Input } from "./input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { cn } from "@/lib/utils";

const COUNTRY_CODES = [
  { code: "+52", country: "MX", flag: "🇲🇽", name: "México" },
  { code: "+1", country: "US", flag: "🇺🇸", name: "Estados Unidos" },
  { code: "+1", country: "CA", flag: "🇨🇦", name: "Canadá" },
  { code: "+34", country: "ES", flag: "🇪🇸", name: "España" },
  { code: "+54", country: "AR", flag: "🇦🇷", name: "Argentina" },
  { code: "+56", country: "CL", flag: "🇨🇱", name: "Chile" },
  { code: "+57", country: "CO", flag: "🇨🇴", name: "Colombia" },
  { code: "+51", country: "PE", flag: "🇵🇪", name: "Perú" },
  { code: "+58", country: "VE", flag: "🇻🇪", name: "Venezuela" },
] as const;

export interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value?: string;
  onChange?: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  defaultCountryCode?: string;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      className,
      value = "",
      onChange,
      onValidationChange,
      defaultCountryCode = "+52",
      disabled,
      ...props
    },
    ref,
  ) => {
    // Parse the value to separate country code and phone number
    const parseValue = (val: string) => {
      if (!val) return { countryCode: defaultCountryCode, phoneNumber: "" };

      // Find matching country code
      const matchedCode = COUNTRY_CODES.find((c) => val.startsWith(c.code));
      if (matchedCode) {
        return {
          countryCode: matchedCode.code,
          phoneNumber: val.slice(matchedCode.code.length).trim(),
        };
      }

      return { countryCode: defaultCountryCode, phoneNumber: val };
    };

    const { countryCode: initialCode, phoneNumber: initialNumber } =
      parseValue(value);

    const [countryCode, setCountryCode] = React.useState(initialCode);
    const [phoneNumber, setPhoneNumber] = React.useState(initialNumber);
    const [isValid, setIsValid] = React.useState(false);

    // Validate phone number (10 digits)
    const validatePhoneNumber = (number: string) => {
      const digits = number.replace(/\D/g, "");
      return digits.length === 10;
    };

    // Update validation state
    React.useEffect(() => {
      const valid = validatePhoneNumber(phoneNumber);
      setIsValid(valid);
      onValidationChange?.(valid);
    }, [phoneNumber, onValidationChange]);

    // Handle country code change
    const handleCountryCodeChange = (newCode: string) => {
      setCountryCode(newCode);
      // Store only digits after country code (no spaces)
      const digits = phoneNumber.replace(/\D/g, "");
      const fullValue = digits ? `${newCode}${digits}` : newCode;
      onChange?.(fullValue);
    };

    // Handle phone number change
    const handlePhoneNumberChange = (
      e: React.ChangeEvent<HTMLInputElement>,
    ) => {
      const input = e.target.value;
      // Only allow digits and basic formatting characters
      const cleaned = input.replace(/[^\d\s-]/g, "");
      // Limit to 10 digits (plus formatting)
      const digits = cleaned.replace(/\D/g, "");
      if (digits.length <= 10) {
        setPhoneNumber(cleaned);
        // Store country code + digits without spaces
        const fullValue = digits ? `${countryCode}${digits}` : countryCode;
        onChange?.(fullValue);
      }
    };

    // Format phone number for display (XXX XXX XXXX)
    const formatPhoneNumber = (num: string) => {
      const digits = num.replace(/\D/g, "");
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
    };

    return (
      <div className="flex gap-2">
        <Select
          value={countryCode}
          onValueChange={handleCountryCodeChange}
          disabled={disabled}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue>
              {COUNTRY_CODES.find((c) => c.code === countryCode)?.flag}{" "}
              {countryCode}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {COUNTRY_CODES.map((country) => (
              <SelectItem
                key={`${country.code}-${country.country}`}
                value={country.code}
              >
                {country.flag} {country.code} {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1">
          <Input
            ref={ref}
            type="tel"
            placeholder="123 456 7890"
            value={formatPhoneNumber(phoneNumber)}
            onChange={handlePhoneNumberChange}
            disabled={disabled}
            className={cn(
              className,
              phoneNumber &&
                !isValid &&
                "border-red-500 focus-visible:ring-red-500",
            )}
            {...props}
          />
          {phoneNumber && !isValid && (
            <p className="absolute -bottom-5 left-0 text-xs text-red-500">
              Debe contener 10 dígitos
            </p>
          )}
        </div>
      </div>
    );
  },
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
