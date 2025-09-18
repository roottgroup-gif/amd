import { useEffect } from "react";
import { useLocation } from "wouter";
import { useLanguage, redirectToLanguage } from "@/lib/i18n";

interface RedirectProps {
  to: string;
}

export function Redirect({ to }: RedirectProps) {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();

  useEffect(() => {
    redirectToLanguage(language, to, setLocation);
  }, [language, to, setLocation]);

  return null;
}