import { Sparkles } from "lucide-react";
import { LiquidGlassButton } from "@/components/ui/LiquidGlassButton";
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
    <section className="relative min-h-screen flex items-center justify-center" style={{ marginTop: '-164px', paddingTop: '164px' }}>
      {/* Particles and Waves Animation Background */}
      <ParticlesAndWaves className="opacity-50" />
      
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#7B3FE4]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center w-full gap-10">
          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-heading font-bold text-white leading-tight">
            A música que transforma{" "}
            <span className="bg-gradient-yellow-purple bg-clip-text text-transparent">sentimentos</span>{" "}
            em <span className="bg-gradient-yellow-purple bg-clip-text text-transparent">presente</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl sm:text-2xl text-white/90 leading-relaxed max-w-3xl">
            <span className="block sm:inline">Em até 5 minutos, a Memora cria duas versões profissionais</span>
            <span className="block sm:inline"> e únicas da sua canção para você escolher e emocionar quem ama.</span>
          </p>

          {/* CTA Card */}
          <div className="relative mt-8 text-center">
            <div className="inline-flex flex-col items-center gap-6 bg-gradient-to-br from-purple-900/30 via-indigo-900/25 to-pink-900/20 backdrop-blur-xl border border-white/20 rounded-3xl px-12 py-10 shadow-2xl shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-300 max-w-2xl mx-auto">
              <div className="text-center space-y-3">
                <h3 className="text-white text-xl sm:text-2xl font-bold font-heading leading-tight">
                  Vamos começar?
                </h3>
              </div>
              
              {/* Input and Primary CTA */}
              <div className="flex flex-col lg:flex-row gap-4 justify-center items-center lg:items-end w-full">
                <div className="flex flex-col w-full lg:w-auto">
                  <input
                    id="recipient-name"
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Digite o nome aqui"
                    className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-6 h-[54px] text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#FEC641] focus:border-transparent transition-all duration-300 text-lg w-full lg:w-[280px]"
                    aria-describedby="recipient-name-description"
                  />
                  <span id="recipient-name-description" className="sr-only">
                    Digite o nome da pessoa para quem você quer criar a música
                  </span>
                </div>
                
                <LiquidGlassButton
                  data-attr="hero-cta-primary"
                  onClick={handleCreateMusicClick}
                  className="w-full lg:w-auto hover:-translate-y-1"
                >
                  <Sparkles className="mr-3 h-6 w-6" />
                  Crie sua música agora
                </LiquidGlassButton>
              </div>
              
              {/* Free message */}
              <p className="text-white/70 text-sm font-medium text-center">
                ✨ Grátis na primeira criação - Sem cartão necessário
              </p>
            </div>
          </div>


        </div>
      </div>


    </section>
  );
};

export default Hero;
