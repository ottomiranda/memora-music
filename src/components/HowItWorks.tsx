import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Palette, Music, Gift } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    title: "Conte sua história",
    description: "Descreva a memória, pessoa ou momento especial que você quer celebrar"
  },
  {
    icon: Palette,
    title: "Escolha o estilo",
    description: "Selecione o gênero musical que mais combina com sua emoção"
  },
  {
    icon: Music,
    title: "IA cria sua música",
    description: "Nossa inteligência artificial compõe letra e melodia personalizadas"
  },
  {
    icon: Gift,
    title: "Receba e compartilhe",
    description: "Baixe sua música única e compartilhe esse presente especial"
  }
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">Como Funciona</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Quatro passos simples para criar sua música personalizada
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <Card key={index} className="relative group hover:shadow-soft transition-smooth">
              <CardContent className="p-6 text-center space-y-4">
                {/* Step Number */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                
                {/* Icon */}
                <div className="pt-4">
                  <step.icon className="w-12 h-12 text-primary mx-auto group-hover:scale-110 transition-transform" />
                </div>
                
                {/* Content */}
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}