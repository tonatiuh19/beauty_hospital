import React from "react";
import logoHeader from "../assets/images/logos/logo-header.png";

interface LogoProps {
  variant?: "full" | "icon" | "text";
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  inverted?: boolean; // For dark backgrounds
}

/**
 * Logo component that displays the All Beauty Luxury & Wellness brand logo
 * Combines logo3 (icon) and logo6 (text) inline to create the complete brand identity
 */
export const Logo: React.FC<LogoProps> = ({
  variant = "full",
  className = "",
  iconClassName = "",
  textClassName = "",
  inverted = false,
}) => {
  // Add brightness/invert filters for dark backgrounds
  const filterClass = inverted ? "brightness-0 invert" : "";

  if (variant === "icon") {
    return (
      <img
        src={logoHeader}
        alt="All Beauty Luxury & Wellness Icon"
        className={`h-12 w-auto ${filterClass} ${iconClassName}`}
      />
    );
  }

  // Full logo - icon and text inline
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <img
        src={logoHeader}
        alt="All Beauty Icon"
        className={`h-20 w-auto ${filterClass} ${iconClassName}`}
      />
    </div>
  );
};

export default Logo;
