import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

import StepIndicator from "@/components/StepIndicator";
import ParticlesAndWaves from "@/components/memora/ParticlesAndWaves";
import NewMusicPlayer from "@/components/NewMusicPlayer";
import ValidationPopup from "@/components/ValidationPopup";
import HighlightedTextarea from "@/components/HighlightedTextarea";
import GenreSelector from "@/components/GenreSelector";
import ConfettiAnimation from "@/components/ConfettiAnimation";
import { Button } from "@/components/ui/button";
import { PurpleFormButton } from "@/components/ui/PurpleFormButton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard';
import { LiquidGlassButton } from "@/components/ui/LiquidGlassButton";
import { LiquidGlassButtonWhite } from "@/components/ui/LiquidGlassButtonWhite";
import { LiquidGlassButtonSmall } from "@/components/ui/LiquidGlassButtonSmall";
import { LiquidGlassButtonWhiteSmall } from "@/components/ui/LiquidGlassButtonWhiteSmall";
import { GlobalTextField } from '@/components/ui/GlobalTextField';
import { HeroCard, GlassInput, GlassTextarea, GlassButton, GlassButtonGroup, GlassSection } from '@/components/HeroCard';
import { SectionTitle } from '@/components/ui/SectionTitle'
import { SectionSubtitle } from '@/components/ui/SectionSubtitle'
import { Play, Download, RotateCcw, ArrowLeft, ArrowRight, Music, Sparkles, Edit, Volume2, Loader2, Wand2, RefreshCw, Pause, Check, Search, X } from "lucide-react";
import CountdownTimer from '../components/CountdownTimer';
import { useMusicStore } from '@/store/musicStore';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { musicGenres } from '@/data/musicGenres';
import { validateStep, getValidationErrors } from '@/lib/validations';
import { z } from 'zod';

const steps = ["Briefing", "Letra", "Estilo", "Prévia"];

// Ocasiões organizadas por categorias para uma seleção mais intuitiva
const occasionCategories: { category: string; items: string[] }[] = [
  {
    category: 'Amor',
    items: [
      'Canção de amor',
      'Aniversário de namoro',
      'Aniversário de casamento',
      'Proposta',
      'Noivado',
      'Casamento',
      'Desculpa',
      'Só porque…',
    ],
  },
  {
    category: 'Família',
    items: [
      'Aniversário',
      'Dia dos Pais',
      'Dia das Mães',
      'Nascimento de criança',
      'Chá de bebê',
      'Batizado',
      'Natal',
    ],
  },
  {
    category: 'Amizade',
    items: ['Melhores amigos', 'Agradecimento', 'Despedida', 'Saudade'],
  },
  {
    category: 'Conquistas',
    items: ['Graduação', 'Formatura', 'Reconhecimento'],
  },
  {
    category: 'Memória',
    items: ['Memorial', 'Homenagem a quem partiu'],
  },
];

// Relações organizadas por categorias
const relationshipCategories: { category: string; items: string[] }[] = [
  {
    category: 'Família',
    items: [
      'Pai ou Mãe',
      'Filho(a)',
      'Irmão ou Irmã',
      'Avô ou Avó',
      'Neto(a)',
      'Tio ou Tia',
      'Sobrinho(a)',
      'Padrasto ou Madrasta',
      'Enteado(a)',
    ],
  },
  {
    category: 'Amor',
    items: ['Namorado(a)', 'Esposo(a) / Esposa', 'Noivo(a)', 'Companheiro(a)'],
  },
  {
    category: 'Amigos & Outros',
    items: [
      'Amigo(a)',
      'Melhores amigos',
      'Colega de trabalho',
      'Professor(a) / Mentor(a)',
      'Chefe / Equipe',
      'Cliente especial',
    ],
  },
];



const emotions = [
  "Feliz e animado",
  "Emocional e profundo",
  "Romântico e terno",
  "Divertido e brincalhão",
  "Nostálgico e reflexivo",
  "Inspirador e motivador",
  "Cómico e peculiar"
];

const vocalPreferences = [
  "Feminino",
  "Masculino",
  "Ambos"
];

export default function Criar() {
  // Estados do store Zustand
  const musicStore = useMusicStore();
  const {
    formData,
    currentStep,
    isLoading,
    isPreviewLoading,
    error,
    updateFormData,
    setCurrentStep,
    nextStep,
    prevStep,
    generateLyrics,
    generateMusic,
    regenerateLyrics,
    resetForm,
    reset: resetMusicFlow,
    setError,
    clearError,
    // Novos estados para polling progressivo
    currentTaskId,
    isPolling,
    musicGenerationStatus,
    completedClips,
    totalExpected,
    // Estados MVP
    isValidationPopupVisible,
    // Nova função centralizada
    startNewCreationFlow,
    generatedLyrics,
  } = musicStore;

  // Hook de navegação
  const navigate = useNavigate();
  const location = useLocation();

  // Estado de bloqueio centralizado
  const { isCreationFlowBlocked } = useUiStore();

  // Estados locais apenas para UI
  const [validationErrors, setValidationErrors] = useState({});
  // Edição de letras
  const [isEditingLyrics, setIsEditingLyrics] = useState(false);
  const [lyricsDraft, setLyricsDraft] = useState("");
  const [saveHint, setSaveHint] = useState<"idle" | "saving" | "saved">("idle");
  const [findText, setFindText] = useState("");
  // Animação de confetes
  const [showConfetti, setShowConfetti] = useState(false);
  // Campo de busca para destaque
  const [replaceText, setReplaceText] = useState(""); // deprecated (mantido para compat, não exibido)
  const saveTimerRef = React.useRef<number | null>(null);
  const lyricsSectionRef = React.useRef<HTMLDivElement | null>(null);
  const previousGeneratedLyricsRef = React.useRef<string | null>(null);
  const previousIsLoadingRef = React.useRef<boolean>(isLoading);
  const previewStatusRef = React.useRef<HTMLDivElement | null>(null);
  const stepScrollTimeoutRef = React.useRef<number | null>(null);
  const scrollToPageTop = React.useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  const scrollToLyricsSection = React.useCallback(() => {
    lyricsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);
  const scrollToPreviewStatus = React.useCallback(() => {
    previewStatusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);
  // Categoria selecionada no briefing
  const [selectedOccasionCategory, setSelectedOccasionCategory] = useState<string>(() => {
    // Tenta inferir a categoria a partir da ocasião já selecionada
    const found = occasionCategories.find((c) => c.items.includes(musicStore.formData.occasion || ''));
    return found ? found.category : occasionCategories[0].category;
  });
  const [selectedRelationshipCategory, setSelectedRelationshipCategory] = useState<string>(() => {
    const rel = musicStore.formData.relationship || '';
    const found = relationshipCategories.find((c) => c.items.includes(rel));
    return found ? found.category : relationshipCategories[0].category;
  });





  // useEffect para posicionar scroll no topo da página
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (stepScrollTimeoutRef.current) {
      window.clearTimeout(stepScrollTimeoutRef.current);
      stepScrollTimeoutRef.current = null;
    }

    scrollToPageTop();

    if (currentStep === 3) {
      stepScrollTimeoutRef.current = window.setTimeout(() => {
        scrollToPreviewStatus();
      }, 200);
    }
  }, [currentStep, scrollToPageTop, scrollToPreviewStatus]);

  // useEffect para processar parâmetros da URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const paraParam = searchParams.get('para');
    
    if (paraParam && paraParam.trim() && !formData.recipientName) {
      updateFormData({ recipientName: paraParam.trim() });
    }
  }, [location.search, formData.recipientName, updateFormData]);

  // useEffect para exibir toasts com mensagens de erro da API
  useEffect(() => {
    if (error) {
      toast.error(error, {
        description: 'Tente novamente em alguns instantes.',
      });
      // Limpa o erro do store após exibi-lo
      clearError();
    }
  }, [error, clearError]);

  // useEffect para monitorar mudanças no currentStep (debug)
  useEffect(() => {
    console.log(`[Criar.tsx] Componente re-renderizado. currentStep agora é: ${currentStep}`);
  }, [currentStep]);

  // Sincronizar rascunho quando entramos na etapa de letra
  useEffect(() => {
    if (currentStep === 1 && formData.lyrics) {
      setLyricsDraft(formData.lyrics);
    }
  }, [currentStep, formData.lyrics]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      if (stepScrollTimeoutRef.current) {
        window.clearTimeout(stepScrollTimeoutRef.current);
        stepScrollTimeoutRef.current = null;
      }
    };
  }, []);

  // useEffect para disparar animação de confetes quando a letra é gerada
  useEffect(() => {
    if (formData.lyrics && !isLoading && currentStep === 1) {
      setShowConfetti(true);
    }
  }, [formData.lyrics, isLoading, currentStep]);

  useEffect(() => {
    if (currentStep === 1 && generatedLyrics && previousGeneratedLyricsRef.current !== generatedLyrics) {
      scrollToLyricsSection();
    }
    previousGeneratedLyricsRef.current = generatedLyrics;
  }, [generatedLyrics, currentStep, scrollToLyricsSection]);

  useEffect(() => {
    if (currentStep === 1 && previousIsLoadingRef.current && !isLoading) {
      scrollToLyricsSection();
    }
    previousIsLoadingRef.current = isLoading;
  }, [currentStep, isLoading, scrollToLyricsSection]);

  const clearPendingAutoSave = () => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  };

  // Auto‑save com debounce de 600ms
  const scheduleAutoSave = (nextLyrics: string) => {
    setSaveHint("saving");
    clearPendingAutoSave();
    saveTimerRef.current = window.setTimeout(() => {
      updateFormData({ lyrics: nextLyrics });
      setSaveHint("saved");
      window.setTimeout(() => setSaveHint("idle"), 1500);
    }, 600);
  };

  const toggleLyricsEditor = () => {
    setIsEditingLyrics((prev) => {
      const next = !prev;

      if (next) {
        clearPendingAutoSave();
        setLyricsDraft(formData.lyrics || "");
        setSaveHint("idle");
      } else {
        clearPendingAutoSave();
        if (lyricsDraft !== formData.lyrics) {
          updateFormData({ lyrics: lyricsDraft });
          setSaveHint("saved");
          window.setTimeout(() => setSaveHint("idle"), 1500);
        } else {
          setSaveHint("idle");
        }
      }

      return next;
    });
  };

  // Util: escapar HTML e realçar termos encontrados
  const escapeHtml = (str: string) => str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  const getHighlightHtml = (text: string, query: string) => {
    const safe = escapeHtml(text || "");
    const q = (query || "").trim();
    if (!q) return safe;
    // Permitir múltiplas palavras separadas por espaço
    const parts = q.split(/\s+/).filter(w => w.length > 0).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (parts.length === 0) return safe;
    const re = new RegExp(`(${parts.join('|')})`, 'gi');
    return safe.replace(re, '<mark>$1</mark>');
  };



  // Função para validar e avançar para o próximo passo
  const handleNextStep = async () => {
    // Guarda de bloqueio global
    const { showPaymentPopup } = useUiStore.getState();
    if (isCreationFlowBlocked) {
      console.log('[PAYWALL] Ação bloqueada. Re-exibindo modal.');
      showPaymentPopup();
      return;
    }

    // Validar o passo atual antes de avançar
    const validationResult = validateStep(currentStep, formData);
    
    if (!validationResult.success) {
      // Usar a função getValidationErrors para processar os erros do Zod
      const errors = getValidationErrors(validationResult.error as any);
      setValidationErrors(errors);
      return;
    }
    
    console.log('✅ Validação passou - Avançando para próximo passo');
    setValidationErrors({});
    
    // Se avançou do passo História (0) para Canção (1), gerar letra automaticamente
    if (currentStep === 0) {
      // Avançar para a etapa 1 primeiro
      nextStep();

      // Gerar letra de forma assíncrona sem bloquear a navegação
      setTimeout(() => {
        generateLyrics();
      }, 100);
      return;
    }
    
    // Se estamos indo para a etapa 3 (prévia), gerar a música
    if (currentStep === 2) {
      console.log('🎵 Transição para Etapa 3 - Iniciando geração de música...');
      console.log('🎵 Dados de estilo capturados:', {
        genre: formData.genre,
        emotion: formData.emotion,
        vocalPreference: formData.vocalPreference
      });
      
      // Avançar para a etapa 3 primeiro
      nextStep();

      // Depois chamar a geração de música
      await generateMusic();
    } else {
      // Para outras etapas, apenas avançar
      nextStep();
    }
  };

  // Função para voltar ao passo anterior
  const handlePrevStep = () => {
    setValidationErrors({});
    setError(null);
    prevStep();
  };

  // Função para atualizar campo e limpar erro específico
  const handleFieldUpdate = (field: string, value: string) => {
    updateFormData({ [field]: value });
    
    // Limpar erro específico do campo
    if (validationErrors[field]) {
      const newErrors = { ...validationErrors };
      delete newErrors[field];
      setValidationErrors(newErrors);
    }
  };

  const renderStepContent = (step: number, isLoading: boolean, audioClips: Array<{id: string; audio_url: string; title?: string; duration?: number}>) => {
    switch (step) {
      case 0:
        return (
          <HeroCard title="Conte sua história">
            <div className="space-y-8">
              {/* Mensagem de erro global */}
              {error && (
                <div className="bg-accent-coral/10 border border-accent-coral/20 rounded-lg p-4">
                  <p className="text-accent-coral text-sm font-medium">{error}</p>
                </div>
              )}
              
              {/* A Ocasião (por categorias) */}
              <GlassSection title="A Ocasião">
                <div className="space-y-3">
                  <Label className="text-white/90 font-medium drop-shadow-sm">Qual a ocasião especial? *</Label>
                  {/* Categorias */}
                  <GlassButtonGroup>
                    {occasionCategories.map(({ category }) => {
                      const active = selectedOccasionCategory === category;
                      return (
                        <GlassButton
                          type="button"
                          key={category}
                          active={active}
                          onClick={() => setSelectedOccasionCategory(category)}
                          aria-pressed={active}
                        >
                          {category}
                        </GlassButton>
                      );
                    })}
                  </GlassButtonGroup>

                  {/* Opções da categoria selecionada */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
                    {occasionCategories
                      .find((c) => c.category === selectedOccasionCategory)!
                      .items.map((item) => {
                        const active = formData.occasion === item;
                        return (
                          <GlassButton
                            type="button"
                            key={item}
                            active={active}
                            onClick={() => handleFieldUpdate('occasion', item)}
                            className="text-left"
                          >
                            {item}
                          </GlassButton>
                        );
                      })}
                  </div>

                  {validationErrors.occasion && (
                    <p className="text-sm text-red-300/90 drop-shadow-sm">{validationErrors.occasion}</p>
                  )}
                </div>
              </GlassSection>

              {/* Sobre a(s) Pessoa(s) */}
              <GlassSection title="Sobre a(s) Pessoa(s)">
                <div className="space-y-4">
                  <GlassInput
                    id="recipientName"
                    label="Qual o nome da pessoa para quem está a criar esta música? *"
                    placeholder="Ex: Maria"
                    value={formData.recipientName}
                    onChange={(e) => handleFieldUpdate('recipientName', e.target.value)}
                    error={validationErrors.recipientName}
                  />
                  {validationErrors.recipientName && (
                    <p className="text-sm text-red-300/90 drop-shadow-sm">{validationErrors.recipientName}</p>
                  )}
                  
                  <div className="space-y-2">
                    <Label className="text-white/90 font-medium drop-shadow-sm">Qual a vossa relação? *</Label>
                    {/* Categorias de relação */}
                    <GlassButtonGroup>
                      {relationshipCategories.map(({ category }) => {
                        const active = selectedRelationshipCategory === category;
                        return (
                          <GlassButton
                            type="button"
                            key={category}
                            active={active}
                            onClick={() => setSelectedRelationshipCategory(category)}
                            aria-pressed={active}
                          >
                            {category}
                          </GlassButton>
                        );
                      })}
                    </GlassButtonGroup>

                    {/* Opções da categoria selecionada */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
                      {relationshipCategories
                        .find((c) => c.category === selectedRelationshipCategory)!
                        .items.map((item) => {
                          const active = formData.relationship === item;
                          return (
                            <GlassButton
                              type="button"
                              key={item}
                              active={active}
                              onClick={() => handleFieldUpdate('relationship', item)}
                              className="text-left"
                            >
                              {item}
                            </GlassButton>
                          );
                        })}
                    </div>

                    {validationErrors.relationship && (
                      <p className="text-sm text-red-300/90 drop-shadow-sm">{validationErrors.relationship}</p>
                    )}
                  </div>
                  
                  <GlassInput
                    id="senderName"
                    label="Qual o seu nome?"
                    placeholder="Ex: João"
                    value={formData.senderName}
                    onChange={(e) => handleFieldUpdate('senderName', e.target.value)}
                  />
                </div>
              </GlassSection>

              {/* Detalhes e Personalidade */}
              <GlassSection title="Detalhes e Personalidade">
                <div className="space-y-4">
                  <GlassTextarea
                    id="hobbies"
                    label="Fale-nos sobre os seus hobbies e interesses! *"
                    placeholder="Ex: Adora cozinhar, fazer caminhadas na natureza, ler livros de ficção..."
                    value={formData.hobbies}
                    onChange={(e) => handleFieldUpdate('hobbies', e.target.value)}
                    rows={3}
                  />
                  {validationErrors.hobbies && (
                    <p className="text-sm text-red-300/90 drop-shadow-sm">{validationErrors.hobbies}</p>
                  )}
                  
                  <GlassTextarea
                    id="qualities"
                    label="Quais as qualidades que você mais admira nessa pessoa? *"
                    placeholder="Ex: É muito generosa, sempre disposta a ajudar, tem um sorriso contagiante..."
                    value={formData.qualities}
                    onChange={(e) => handleFieldUpdate('qualities', e.target.value)}
                    rows={3}
                  />
                  {validationErrors.qualities && (
                    <p className="text-sm text-red-300/90 drop-shadow-sm">{validationErrors.qualities}</p>
                  )}
                  
                  <GlassTextarea
                    id="uniqueTraits"
                    label="O que a torna única ou especial? Tem algum hábito engraçado ou interessante? *"
                    placeholder="Ex: Sempre canta no chuveiro, coleciona postais de viagens, faz as melhores panquecas..."
                    value={formData.uniqueTraits}
                    onChange={(e) => handleFieldUpdate('uniqueTraits', e.target.value)}
                    rows={3}
                  />
                  {validationErrors.uniqueTraits && (
                    <p className="text-sm text-red-300/90 drop-shadow-sm">{validationErrors.uniqueTraits}</p>
                  )}
                </div>
              </GlassSection>

              {/* Memórias e Histórias */}
              <GlassSection title="Memórias e Histórias">
                <GlassTextarea
                  id="memories"
                  label="Partilhe as vossas histórias ou memórias favoritas que gostaria de incluir na música. *"
                  placeholder="Uma é suficiente. Mais é melhor."
                  value={formData.memories}
                  onChange={(e) => handleFieldUpdate('memories', e.target.value)}
                  rows={4}
                />
                {validationErrors.memories && (
                  <p className="text-sm text-red-300/90 drop-shadow-sm">{validationErrors.memories}</p>
                )}
              </GlassSection>
            </div>
          </HeroCard>
        );
      
      case 1:
        return (
          <HeroCard title="Letra da sua música">
            <div className="space-y-6">
              {!formData.lyrics && !isLoading && (
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    Vamos gerar a letra da sua música baseada na história que você contou.
                  </p>
                  <PurpleFormButton 
                    onClick={generateLyrics} 
                    isLoading={isLoading}
                    loadingText="Gerando letra..."
                    disabled={isLoading || !formData.occasion || !formData.recipientName || !formData.relationship}
                  >
                    Gerar Letra da Música
                  </PurpleFormButton>
                </div>
              )}

              {isLoading && (
                <div className="text-center space-y-4 py-8">
                  <div className="flex justify-center">
                  <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Criando sua letra personalizada...</p>
                    <p className="text-sm text-white/50">
                      Estamos analisando sua história e criando versos únicos
                    </p>
                  </div>
                </div>
              )}

              {formData.lyrics && !isLoading && (
                <div className="space-y-4">
                  {/* Animação de confetes */}
                  <ConfettiAnimation show={showConfetti} onComplete={() => setShowConfetti(false)} />
                  
                  <LiquidGlassCard variant="primary" size="lg" className="p-6 sm:p-8">
                    {/* Cabeçalho da seção */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/20 backdrop-blur-sm">
                          <Music className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-heading font-semibold text-lg text-white">
                            Sua Letra Personalizada
                          </h3>
                          <p className="text-sm text-white/60 mt-0.5">
                            {isEditingLyrics ? 'Modo de edição ativo' : 'Clique em editar para personalizar'}
                          </p>
                        </div>
                      </div>
                      <LiquidGlassButtonWhite
                        onClick={toggleLyricsEditor}
                        className="text-sm px-4 py-2.5 h-auto font-medium"
                        aria-label={isEditingLyrics ? 'Fechar edição' : 'Editar letra'}
                        aria-pressed={isEditingLyrics}
                      >
                        {isEditingLyrics ? <X className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                        {isEditingLyrics ? 'Fechar Edição' : 'Editar Letra'}
                      </LiquidGlassButtonWhite>
                    </div>

                    {!isEditingLyrics ? (
                      <div className="relative">
                        <pre className="whitespace-pre-wrap text-sm leading-relaxed font-medium text-white/90 p-4 rounded-lg bg-white/5 border border-white/10" 
                             dangerouslySetInnerHTML={{ __html: getHighlightHtml(formData.lyrics || '', findText) }} />
                        {findText && (
                          <div className="absolute top-2 right-2">
                            <span className="text-xs px-2 py-1 rounded-md bg-primary/20 text-primary font-medium">
                              Buscando: "{findText}"
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Toolbar de edição reorganizado */}
                        <LiquidGlassCard variant="secondary" size="md" className="p-4">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
                            {/* Seção de busca - ocupa 2 colunas em telas grandes */}
                            <div className="lg:col-span-2 space-y-2">
                              <div className="relative">
                                <GlobalTextField
                                  label="Digite o texto que deseja encontrar"
                                  value={findText}
                                  onChange={(e) => setFindText(e.target.value)}
                                  placeholder="Buscar texto na letra..."
                                  className="pl-10 pr-10"
                                />
                                <div className="absolute left-3 top-[42px] pointer-events-none">
                                  <Search className="w-4 h-4 text-white/50" />
                                </div>
                                {findText && (
                                  <button
                                    type="button"
                                    aria-label="Limpar busca"
                                    onClick={() => setFindText("")}
                                    className="absolute right-3 top-[42px] p-1.5 rounded-md hover:bg-white/20 text-white/70 hover:text-white transition-all duration-200 hover:scale-110"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Seção de controles - 1 coluna em telas grandes */}
                            <div className="flex flex-col gap-3">
                              <button
                                type="button"
                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-medium text-white transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                                onClick={() => {
                                  const base = generatedLyrics || formData.lyrics || '';
                                  setLyricsDraft(base);
                                  scheduleAutoSave(base);
                                }}
                              >
                                <RotateCcw className="w-4 h-4" />
                                Restaurar
                              </button>
                              
                              <div className="flex items-center justify-center gap-2 text-xs text-white/70 bg-white/5 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-1.5">
                                  {saveHint === 'saving' && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
                                  {saveHint === 'saved' && <Check className="w-3.5 h-3.5 text-green-400" />}
                                  {saveHint === 'idle' && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                                  <span className="font-medium">
                                    {saveHint === 'saving' ? 'Salvando...' : saveHint === 'saved' ? 'Salvo' : 'Auto-save'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </LiquidGlassCard>

                        {/* Área de edição com melhor espaçamento */}
                        <div className="relative">
                          <HighlightedTextarea
                            value={lyricsDraft}
                            onChange={(val) => { setLyricsDraft(val); scheduleAutoSave(val); }}
                            rows={16}
                            highlightQuery={findText}
                            className="w-full rounded-lg border-2 border-white/20 focus:border-primary/50 transition-colors duration-200"
                          />
                          {findText && (
                            <div className="absolute top-3 right-3">
                              <span className="text-xs px-2 py-1 rounded-md bg-primary/20 text-primary font-medium backdrop-blur-sm">
                                Destacando: "{findText}"
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </LiquidGlassCard>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <PurpleFormButton 
                      onClick={() => {
                        scrollToLyricsSection();
                        regenerateLyrics();
                      }} 
                      className="flex-1"
                      isLoading={isLoading}
                      loadingText="Gerando nova letra..."
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Gerar Nova Letra
                    </PurpleFormButton>

                  </div>
                  
                  <p className="text-xs text-white/60 text-center">
                    💡 Dica: Você pode gerar quantas versões quiser até ficar satisfeito
                  </p>
                </div>
              )}
            </div>
          </HeroCard>
        );
      
      case 2:
        return (
          <HeroCard title="Escolha o estilo musical">
            <div className="space-y-6">
              <div className="grid gap-6">
                <div className="space-y-4">
                  <GenreSelector
                    onGenreSelect={(genreId, subGenreId) => {
                      // Buscar o gênero pelo ID para obter o nome
                      const genre = musicGenres.find(g => g.id === genreId);
                      if (genre) {
                        if (subGenreId) {
                          const subGenre = genre.subGenres.find(sg => sg.id === subGenreId);
                          if (subGenre) {
                            handleFieldUpdate('genre', `${genre.name} - ${subGenre.name}`);
                          }
                        } else {
                          handleFieldUpdate('genre', genre.name);
                        }
                      }
                    }}
                    className="w-full"
                  />
                  {validationErrors.genre && (
                    <p className="text-sm text-accent-coral mt-1">{validationErrors.genre}</p>
                  )}
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emotion" className="text-base font-semibold text-white">Que emoção você quer transmitir? *</Label>
                    <Select value={formData.emotion} onValueChange={(value) => handleFieldUpdate('emotion', value)}>
                       <SelectTrigger className="h-12 bg-white/10 backdrop-blur-md border-white/20 text-white placeholder:text-white/60 hover:bg-white/15 focus:bg-white/20 focus:border-white/40">
                         <SelectValue placeholder="Selecione a emoção" />
                       </SelectTrigger>
                      <SelectContent>
                        {emotions.map((emotion) => (
                          <SelectItem key={emotion} value={emotion}>
                            {emotion}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {validationErrors.emotion && (
                      <p className="text-sm text-accent-coral mt-1">{validationErrors.emotion}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="vocalPreference" className="text-base font-semibold text-white">Escolha o tipo de voz *</Label>
                    <Select value={formData.vocalPreference} onValueChange={(value) => handleFieldUpdate('vocalPreference', value)}>
                       <SelectTrigger className="h-12 bg-white/10 backdrop-blur-md border-white/20 text-white placeholder:text-white/60 hover:bg-white/15 focus:bg-white/20 focus:border-white/40">
                         <SelectValue placeholder="Selecione a preferência vocal" />
                       </SelectTrigger>
                      <SelectContent>
                        {vocalPreferences.map((preference) => (
                          <SelectItem key={preference} value={preference}>
                            {preference}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {validationErrors.vocalPreference && (
                      <p className="text-sm text-accent-coral mt-1">{validationErrors.vocalPreference}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </HeroCard>
        );
      
      case 3: {
        const summaryItems = [
          { label: 'Ocasião', value: formData.occasion },
          { label: 'Para', value: formData.recipientName },
          { label: 'Relação', value: formData.relationship },
          { label: 'Gênero', value: formData.genre },
          { label: 'Emoção', value: formData.emotion },
          { label: 'Vocal', value: formData.vocalPreference },
        ].filter((item) => Boolean(item.value));

        const summaryCard = summaryItems.length > 0 ? (
          <LiquidGlassCard size="lg" className="p-8 space-y-6 text-left">
            <div className="flex justify-end">
              <span className="h-2 w-2 rounded-full bg-secondary shadow-[0_0_12px_rgba(254,198,65,0.65)]" aria-hidden />
            </div>
            <div>
              <h3 className="text-2xl font-semibold font-heading text-white">Resumo da sua música</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {summaryItems.map(({ label, value }) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl">
                  <span className="text-[11px] uppercase tracking-[0.22em] text-white/60">{label}</span>
                  <p className="mt-1 text-sm font-medium text-white">{value}</p>
                </div>
              ))}
            </div>
          </LiquidGlassCard>
        ) : null;

        const showInitialState = (isPreviewLoading || isPolling) && (!musicStore.audioClips || musicStore.audioClips.length === 0);

        const renderProgressCard = (
          <LiquidGlassCard size="lg" className="p-8 flex flex-col items-center gap-6 text-center">
            {!currentTaskId ? (
              <div className="flex flex-col items-center gap-4">
                <div className="h-14 w-14 rounded-full border-2 border-secondary/60 border-t-transparent animate-spin" />
                <p className="text-sm text-white/70">Conectando como nosso estúdio digital...</p>
              </div>
            ) : (
              <CountdownTimer className="w-full" />
            )}
            <div className="space-y-2">
              <h3 className="text-xl font-semibold font-heading text-white">
                {!currentTaskId ? 'Iniciando geração...' : musicGenerationStatus === 'processing' ? 'Criando sua música...' : 'Processando...'}
              </h3>
              <p className="text-sm text-white/70 max-w-md mx-auto">
                {!currentTaskId
                  ? 'Estamos preparando tudo para transformar sua história em canção personalizada.'
                  : totalExpected > 0
                    ? `Gerando ${totalExpected} versões exclusivas para você.`
                    : 'Estamos finalizando os últimos detalhes antes de liberar sua música.'}
              </p>
            </div>
            {totalExpected > 0 && (
              <div className="w-full max-w-sm space-y-3">
                <div className="text-[11px] uppercase tracking-[0.28em] text-white/60">Progresso</div>
                <div className="flex items-center justify-between text-sm text-white/80">
                  <span>{completedClips || 0}/{totalExpected} músicas prontas</span>
                  <span className="text-white/60">{Math.round(((completedClips || 0) / totalExpected) * 100)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-yellow-purple transition-all duration-500"
                    style={{ width: `${totalExpected > 0 ? ((completedClips || 0) / totalExpected) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}
          </LiquidGlassCard>
        );

        return (
          <div className="space-y-8">
            <div ref={previewStatusRef} className="text-center space-y-3">
              <div className="mx-auto h-3 w-36 rounded-full bg-gradient-yellow-purple blur-xl opacity-80" aria-hidden />
              <h2 className="text-3xl font-extrabold font-heading bg-gradient-yellow-purple bg-clip-text text-transparent drop-shadow-sm">
                Sua música está sendo gerada...
              </h2>
            </div>

            {showInitialState ? (
              <div className="grid gap-6">
                {renderProgressCard}
                {summaryCard}
              </div>
            ) : (
              <div className="space-y-6">
                <LiquidGlassCard size="lg" className="p-8 space-y-8">
                  <header className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <h3 className="text-2xl font-semibold font-heading text-white">
                          Música para {formData.recipientName || 'Pessoa Especial'}
                        </h3>
                        {audioClips?.length ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-secondary/20 px-4 py-2 text-xs font-medium text-secondary backdrop-blur">
                            ✓ {audioClips.filter((clip) => clip.audio_url).length} versão{audioClips.filter((clip) => clip.audio_url).length !== 1 ? 's' : ''} pronta{audioClips.filter((clip) => clip.audio_url).length !== 1 ? 's' : ''}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {(isPolling || isPreviewLoading) && totalExpected > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-white/70">
                          <span>Progresso da geração</span>
                          <span>{completedClips || 0}/{totalExpected}</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-gradient-yellow-purple transition-all duration-500 ease-out"
                            style={{ width: `${totalExpected > 0 ? ((completedClips || 0) / totalExpected) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </header>

                  <div className="space-y-4">
                    {audioClips && audioClips.length > 0 && (
                      <LiquidGlassCard className="p-6 space-y-4">
                        <div className="space-y-2">
                          <h4 className="flex items-center gap-2 text-lg font-semibold font-heading text-white">
                            <Music className="h-5 w-5 text-secondary" />
                            Suas músicas personalizadas
                          </h4>
                          <p className="text-sm text-white/70">Ouça, compare e escolha a melhor versão para compartilhar.</p>
                        </div>
                        <NewMusicPlayer clips={audioClips} />
                      </LiquidGlassCard>
                    )}

                    {isPolling && totalExpected > 0 && Array.from({ length: Math.max(0, totalExpected - (audioClips?.length || 0)) }).map((_, index) => {
                      const placeholderIndex = (audioClips?.length || 0) + index + 1;
                      return (
                        <LiquidGlassCard
                          key={`placeholder-${placeholderIndex}`}
                          className="p-6 space-y-4 !border-dashed !border-white/15"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-1">
                              <h4 className="flex items-center gap-2 text-lg font-semibold font-heading text-white">
                                Opção {placeholderIndex}
                                <span className="inline-flex items-center gap-1 rounded-full bg-secondary/15 px-3 py-1 text-xs font-medium text-secondary">
                                  <Loader2 className="h-4 w-4 animate-spin text-secondary" />
                                  Gerando...
                                </span>
                              </h4>
                              <p className="text-sm text-white/70">Aguarde, estamos preparando esta versão com carinho.</p>
                            </div>
                            <div className="text-sm text-white/60">
                              Duração prevista
                              <p className="font-mono text-lg text-white/80">--:--</p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-4 md:flex-row md:items-center">
                            <LiquidGlassCard size="sm" className="flex h-20 w-full items-center justify-center !p-0 text-white/70 md:w-24">
                              <Music className="h-6 w-6" />
                            </LiquidGlassCard>
                            <LiquidGlassCard size="sm" className="flex-1 !p-0 px-4 py-3 text-sm text-white/70">
                              O player aparecerá aqui assim que a versão estiver pronta.
                            </LiquidGlassCard>
                          </div>

                          <div className="mt-4">
                            <Button size="sm" variant="outline" className="w-full" disabled>
                              <Download className="mr-2 h-4 w-4" />
                              Aguardando geração...
                            </Button>
                          </div>
                        </LiquidGlassCard>
                      );
                    })}

                    {(!audioClips || audioClips.length === 0) && !isPolling && (
                      <LiquidGlassCard className="p-6 text-center text-white/70">
                        <h4 className="mb-2 text-lg font-semibold font-heading text-white">Nenhuma prévia disponível</h4>
                        <p className="text-sm">Tente gerar a música novamente.</p>
                      </LiquidGlassCard>
                    )}
                  </div>

                  {currentStep === steps.length - 1 && (
                    <div className="flex justify-center">
                      <LiquidGlassButton
                        onClick={() => {
                          const musicStoreState = useMusicStore.getState();
                          const { token } = useAuthStore.getState();
                          musicStoreState.startNewCreationFlow(navigate, token);
                        }}
                        className="px-8"
                      >
                        Criar Nova Música
                      </LiquidGlassButton>
                    </div>
                  )}
                </LiquidGlassCard>

                {summaryCard}
              </div>
            )}
          </div>
        );
      }
      
      default:
        return null;
    }
  };



  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pt-25 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <SectionTitle>Dê <span className="bg-gradient-to-r from-yellow-400 to-purple-600 bg-clip-text text-transparent">vida</span> à sua <span className="bg-gradient-to-r from-yellow-400 to-purple-600 bg-clip-text text-transparent">canção</span></SectionTitle>
              <SectionSubtitle>
          Compartilhe sentimentos, escolha o estilo e receba sua música final em minutos.
        </SectionSubtitle>
            </div>
            
            <StepIndicator steps={steps} currentStep={currentStep} />
            
            <ParticlesAndWaves className="h-32 -mt-4" maxParticles={60} reducedMotion={false} disableWaves={true} />
            
            <div className="space-y-6">
              <div ref={currentStep === 1 ? lyricsSectionRef : null}>
                {renderStepContent(currentStep, isLoading, musicStore.audioClips || [])}
              </div>
              
              {/* Navigation Buttons */}
              <div className={`flex ${currentStep === 0 ? 'justify-end' : 'justify-between'}`}>
                {currentStep > 0 && currentStep !== steps.length - 1 && (
                  <LiquidGlassButtonWhiteSmall
                    onClick={handlePrevStep}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Anterior
                  </LiquidGlassButtonWhiteSmall>
                )}
                
                {currentStep < steps.length - 1 ? (
                  currentStep === 1 ? (
                    // Na etapa de letra, mostra o botão Aprovar e Continuar
                    <LiquidGlassButtonSmall
                      onClick={() => {
                        // Garante flush do rascunho antes de avançar
                        if (lyricsDraft && lyricsDraft !== formData.lyrics) {
                          updateFormData({ lyrics: lyricsDraft });
                        }
                        nextStep();
                      }}
                      disabled={isEditingLyrics || !formData.lyrics || isLoading}
                    >
                      <ArrowRight className="w-4 h-4" />
                      Aprovar e Continuar
                    </LiquidGlassButtonSmall>
                  ) : (
                    <LiquidGlassButtonSmall onClick={handleNextStep}>
                      Próximo
                      <ArrowRight className="w-4 h-4" />
                    </LiquidGlassButtonSmall>
                  )
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </main>
      

      
      {/* ValidationPopup renderizado condicionalmente */}
      {isValidationPopupVisible && <ValidationPopup />}
    </div>
  );
}
