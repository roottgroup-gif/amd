import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n";
import { useCreateInquiry } from "@/hooks/use-properties";
import { useToast } from "@/hooks/use-toast";
import type { Property, User } from "@/types";
import { Phone, MessageSquare, Mail, Star, Send, CheckCircle } from "lucide-react";

// Helper function to format phone number in international format
const formatPhoneNumberInternational = (phoneNumber: string): string => {
  if (!phoneNumber) return '';
  
  // Remove all non-digit characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // If it already starts with +, use as is, otherwise add + if it looks like international format
  if (cleaned.startsWith('+')) {
    // Format: +964 750 123 4567
    const countryCode = cleaned.substring(1, 4); // 964
    const number = cleaned.substring(4);
    
    if (number.length >= 9) {
      return `+${countryCode} ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6)}`;
    }
  }
  
  // If no + and starts with 964, add + and format
  if (cleaned.startsWith('964') && cleaned.length >= 12) {
    const countryCode = cleaned.substring(0, 3);
    const number = cleaned.substring(3);
    return `+${countryCode} ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6)}`;
  }
  
  // Return original if can't format
  return phoneNumber;
};

interface ContactFormProps {
  property: Property;
  agent?: User;
  className?: string;
}

export default function ContactForm({ property, agent, className }: ContactFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const createInquiry = useCreateInquiry();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: `I'm interested in ${property.title}. Could you please provide more information?`
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createInquiry.mutateAsync({
        propertyId: property.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
      });
      
      toast({
        title: "Message Sent",
        description: "Your inquiry has been sent to the agent. They will contact you soon.",
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: `I'm interested in ${property.title}. Could you please provide more information?`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const agentInitials = agent ? 
    `${agent.firstName?.[0] || ''}${agent.lastName?.[0] || ''}`.toUpperCase() : 
    'A';

  const agentName = agent ? 
    `${agent.firstName || ''} ${agent.lastName || ''}`.trim() || agent.username : 
    'Real Estate Agent';

  return (
    <Card className={`sticky top-6 border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 ${className}`} data-testid="contact-form">
      <CardHeader className="text-center pb-6 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-gray-800 dark:to-gray-700 rounded-t-lg">
        <Avatar className="w-24 h-24 mx-auto mb-6 ring-4 ring-orange-200 ring-offset-2 shadow-lg">
          <AvatarImage src={agent?.avatar} alt={agentName} />
          <AvatarFallback className="text-xl font-semibold bg-gradient-to-br from-orange-400 to-orange-600 text-white">{agentInitials}</AvatarFallback>
        </Avatar>
        
        <div className="flex items-center justify-center gap-2 mb-2">
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100" data-testid="agent-name">{agentName}</CardTitle>
          {agent?.isVerified && (
            <Badge 
              className="bg-orange-500 text-white hover:bg-orange-600 border-0 p-1.5 shadow-md"
              data-testid="verified-badge"
            >
              <CheckCircle className="h-4 w-4" />
            </Badge>
          )}
        </div>
        <p className="text-sm font-medium text-orange-700 dark:text-orange-300 bg-white/50 dark:bg-gray-800/50 px-3 py-1 rounded-full mx-auto text-center w-fit">{t('contact.agentTitle')}</p>
        
      </CardHeader>
      
      <CardContent className="p-6 space-y-5">
        {/* Contact Information */}
        {((property as any).contactPhone || agent?.phone) && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 p-4 rounded-lg border border-blue-100 dark:border-gray-600">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">{t('contact.contactNumber')}</p>
            </div>
            <div className="flex justify-center">
              <p className="font-bold text-lg text-center text-gray-900 dark:text-gray-100 tracking-wide" dir="ltr">
                {formatPhoneNumberInternational((property as any).contactPhone || agent?.phone)}
              </p>
            </div>
          </div>
        )}
        
        {/* Contact Buttons */}
        <div className="space-y-4">
          <Button 
            className="w-full h-14 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 text-white font-bold shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-[1.03] hover:-translate-y-1 rounded-xl border border-blue-400/20 backdrop-blur-sm"
            onClick={() => {
              const phone = (property as any).contactPhone || agent?.phone;
              if (phone) {
                window.open(`tel:${phone}`, '_self');
              }
            }}
            disabled={!((property as any).contactPhone || agent?.phone)}
            data-testid="call-button"
          >
            <Phone className="mr-3 h-5 w-5 drop-shadow-lg" />
            <span className="text-lg tracking-wide">{t('contact.callNow')}</span>
          </Button>
          
          <Button 
            className="w-full h-14 bg-gradient-to-r from-green-500 via-green-600 to-green-700 hover:from-green-600 hover:via-green-700 hover:to-green-800 text-white font-bold shadow-2xl hover:shadow-green-500/25 transition-all duration-300 transform hover:scale-[1.03] hover:-translate-y-1 rounded-xl border border-green-400/20 backdrop-blur-sm"
            onClick={() => {
              const phone = (property as any).contactPhone || agent?.phone;
              if (phone) {
                const whatsappPhone = phone.replace(/[^\d+]/g, '');
                const message = encodeURIComponent(`Hi! I'm interested in the property: ${property.title}. Could you please provide more information?`);
                window.open(`https://wa.me/${whatsappPhone}?text=${message}`, '_blank');
              }
            }}
            disabled={!((property as any).contactPhone || agent?.phone)}
            data-testid="whatsapp-button"
          >
            <MessageSquare className="mr-3 h-5 w-5 drop-shadow-lg" />
            <span className="text-lg tracking-wide">{t('contact.whatsapp')}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
