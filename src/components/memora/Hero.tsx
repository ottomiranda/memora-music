import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useMusicStore } from "@/store/musicStore";
import { useAuthStore } from "@/store/authStore";
import ParticlesAndWaves from "./ParticlesAndWaves";
import { useState } from "react";

const Hero = () => {
  const navigate = useNavigate();
  const { startNewCreationFlow } = useMusicStore();
  const [recipientName, setRecipientName] = useState("");

  const handleCreateMusicClick = async () => {
    const { token } = useAuthStore.getState();
    const queryParam = recipientName.trim() ? `?para=${encodeURIComponent(recipientName.trim())}` : '';
    navigate(`/criar${queryParam}`);
    await startNewCreationFlow(navigate, token);
  };



  return (
    <section className="relative h-screen flex items-center justify-center">
      {/* Particles and Waves Animation Background */}
      <ParticlesAndWaves className="opacity-50" />
      
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#FEC641]/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#7B3FE4]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-center">
        <div className="flex flex-col items-center justify-center text-center w-full">
          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-heading font-bold text-white leading-tight mb-8">
            A música que transforma{" "}
            <span className="text-[#FEC641]">sentimentos</span>{" "}
            em presente
          </h1>

          {/* Subheadline */}
          <p className="text-xl sm:text-2xl text-white/90 leading-relaxed mb-12 max-w-3xl">
            <span className="block sm:inline">Em até 5 minutos, a Memora cria duas versões profissionais</span>
            <span className="block sm:inline"> e únicas da sua canção para você escolher e emocionar quem ama.</span>
          </p>

          {/* Input and Primary CTA */}
          <div className="flex flex-col lg:flex-row gap-4 justify-center items-center mb-6 w-full max-w-2xl">
            <div className="flex flex-col w-full lg:w-auto">
              <label htmlFor="recipient-name" className="text-white/90 text-sm font-medium mb-2 text-left">
                Vamos começar?
              </label>
              <input
                id="recipient-name"
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Digite o nome aqui"
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-6 h-[54px] text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#FEC641] focus:border-transparent transition-all duration-300 text-lg w-full lg:w-[212px]"
                aria-describedby="recipient-name-description"
              />
              <span id="recipient-name-description" className="sr-only">
                Digite o nome da pessoa para quem você quer criar a música
              </span>
            </div>
            
            <Button
              size="lg"
              className="bg-[#FEC641] hover:bg-[#FEC641]/90 text-[#101010] px-10 h-[54px] rounded-2xl font-semibold text-lg shadow-2xl hover:shadow-[#FEC641]/25 hover:-translate-y-1 transition-all duration-300 border-0 w-full lg:w-auto mt-4 lg:mt-8"
              data-attr="hero-cta-primary"
              onClick={handleCreateMusicClick}
            >
              <Sparkles className="mr-3 h-6 w-6" />
              Crie sua música
            </Button>
          </div>


        </div>
      </div>


    </section>
  );
};

export default Hero;
