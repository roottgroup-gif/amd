import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslation } from "@/lib/i18n";
import { useCreateInquiry } from "@/hooks/use-properties";
import { useToast } from "@/hooks/use-toast";
import type { Property, User } from "@/types";
import { Phone, MessageSquare, Mail, Star, Send } from "lucide-react";

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
    <Card className={`sticky top-6 ${className}`} data-testid="contact-form">
      <CardHeader className="text-center pb-4">
        <Avatar className="w-20 h-20 mx-auto mb-4">
          <AvatarImage src={agent?.avatar} alt={agentName} />
          <AvatarFallback className="text-lg">{agentInitials}</AvatarFallback>
        </Avatar>
        
        <CardTitle className="text-lg" data-testid="agent-name">{agentName}</CardTitle>
        <p className="text-sm text-muted-foreground">Licensed Real Estate Agent</p>
        
        <div className="flex items-center justify-center mt-2">
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-current" />
            ))}
          </div>
          <span className="text-sm text-muted-foreground ml-2">5.0 (48 reviews)</span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Quick Contact Buttons */}
        <div className="space-y-3">
          {/* Show contact phone if available */}
          {((property as any).contactPhone || agent?.phone) && (
            <div className="text-center mb-3">
              <p className="text-sm text-muted-foreground mb-1">Contact Number</p>
              <p className="font-semibold text-lg">
                {(property as any).contactPhone || agent?.phone}
              </p>
            </div>
          )}
          
          <Button 
            className="w-full"
            onClick={() => {
              const phone = (property as any).contactPhone || agent?.phone;
              if (phone) {
                window.open(`tel:${phone}`, '_self');
              }
            }}
            disabled={!((property as any).contactPhone || agent?.phone)}
            data-testid="call-button"
          >
            <Phone className="mr-2 h-4 w-4" />
            {t('contact.callNow')}
          </Button>
          
          <Button 
            className="w-full bg-green-600 hover:bg-green-700"
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
            <MessageSquare className="mr-2 h-4 w-4" />
            WhatsApp
          </Button>
          
        </div>
      </CardContent>
    </Card>
  );
}
