import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import StepIndicator from "@/components/StepIndicator";
import NewMusicPlayer from "@/components/NewMusicPlayer";
import FeedbackPopup, { type FeedbackSubmissionPayload } from "@/components/memora/FeedbackPopup";
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
import { HeroCard, GlassButton, GlassButtonGroup, GlassInput, GlassTextarea, GlassSection, GlassSeparator } from '@/components/HeroCard';
import { SectionTitle } from '@/components/ui/SectionTitle'
import { SectionSubtitle } from '@/components/ui/SectionSubtitle'
import { Play, Download, RotateCcw, ArrowLeft, ArrowRight, Music, Sparkles, Edit, Volume2, Loader2, Wand2, RefreshCw, Pause, Check, Search, X } from "lucide-react";
import CountdownTimer from '../components/CountdownTimer';
import { useMusicStore } from '@/store/musicStore';
import type { FormData as MusicFormData } from '@/store/musicStore';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { musicGenres } from '@/data/musicGenres';
import { validateStep, getValidationErrors } from '@/lib/validations';
import i18n from '@/i18n';
import { z } from 'zod';
import { apiRequest } from '@/config/api';

const steps = ["Briefing", "Letra", "Estilo", "Prévia"];

type OptionItem = { key: string; label: string };
type OptionCategory = { key: string; label: string; items: OptionItem[] };

const OCCASION_CATEGORY_CONFIG = [
  {
    key: 'romantic',
    labelKey: 'options.occasions.romantic.category',
    itemKeys: [
      'options.occasions.romantic.anniversary',
      'options.occasions.romantic.valentine',
      'options.occasions.romantic.proposal',
      'options.occasions.romantic.wedding',
      'options.occasions.romantic.engagement',
      'options.occasions.romantic.dateNight',
      'options.occasions.romantic.apology',
      'options.occasions.romantic.longDistance',
    ],
  },
  {
    key: 'celebration',
    labelKey: 'options.occasions.celebration.category',
    itemKeys: [
      'options.occasions.celebration.birthday',
      'options.occasions.celebration.graduation',
      'options.occasions.celebration.newJob',
      'options.occasions.celebration.promotion',
      'options.occasions.celebration.retirement',
      'options.occasions.celebration.newHome',
      'options.occasions.celebration.achievement',
      'options.occasions.celebration.success',
    ],
  },
  {
    key: 'friendship',
    labelKey: 'options.occasions.friendship.category',
    itemKeys: [
      'options.occasions.friendship.friendship',
      'options.occasions.friendship.support',
      'options.occasions.friendship.encouragement',
      'options.occasions.friendship.reunion',
      'options.occasions.friendship.farewell',
      'options.occasions.friendship.thankYou',
      'options.occasions.friendship.justBecause',
      'options.occasions.friendship.missYou',
    ],
  },
  {
    key: 'achievements',
    labelKey: 'options.occasions.achievements.category',
    itemKeys: [
      'options.occasions.achievements.competition',
      'options.occasions.achievements.award',
      'options.occasions.achievements.recognition',
      'options.occasions.achievements.milestone',
      'options.occasions.achievements.goal',
      'options.occasions.achievements.victory',
      'options.occasions.achievements.accomplishment',
      'options.occasions.achievements.breakthrough',
    ],
  },
  {
    key: 'memorial',
    labelKey: 'options.occasions.memorial.category',
    itemKeys: [
      'options.occasions.memorial.memorial',
      'options.occasions.memorial.tribute',
      'options.occasions.memorial.remembrance',
      'options.occasions.memorial.honor',
      'options.occasions.memorial.legacy',
      'options.occasions.memorial.celebration_of_life',
      'options.occasions.memorial.memory',
      'options.occasions.memorial.farewell_tribute',
    ],
  },
] as const;

const RELATIONSHIP_CATEGORY_CONFIG = [
  {
    key: 'family',
    labelKey: 'options.relationships.family.category',
    itemKeys: [
      'options.relationships.family.mother',
      'options.relationships.family.father',
      'options.relationships.family.son',
      'options.relationships.family.daughter',
      'options.relationships.family.brother',
      'options.relationships.family.sister',
      'options.relationships.family.grandmother',
      'options.relationships.family.grandfather',
      'options.relationships.family.aunt',
      'options.relationships.family.uncle',
      'options.relationships.family.cousin',
      'options.relationships.family.nephew',
      'options.relationships.family.niece',
    ],
  },
  {
    key: 'romantic',
    labelKey: 'options.relationships.romantic.category',
    itemKeys: [
      'options.relationships.romantic.wife',
      'options.relationships.romantic.husband',
      'options.relationships.romantic.girlfriend',
      'options.relationships.romantic.boyfriend',
      'options.relationships.romantic.fiancee',
      'options.relationships.romantic.partner',
      'options.relationships.romantic.soulmate',
      'options.relationships.romantic.crush',
    ],
  },
  {
    key: 'friendship',
    labelKey: 'options.relationships.friendship.category',
    itemKeys: [
      'options.relationships.friendship.best_friend',
      'options.relationships.friendship.friend',
      'options.relationships.friendship.colleague',
      'options.relationships.friendship.mentor',
      'options.relationships.friendship.teacher',
      'options.relationships.friendship.student',
      'options.relationships.friendship.neighbor',
      'options.relationships.friendship.acquaintance',
    ],
  },
] as const;

const OCCASION_ITEM_KEYS = OCCASION_CATEGORY_CONFIG.flatMap((category) => category.itemKeys);
const RELATIONSHIP_ITEM_KEYS = RELATIONSHIP_CATEGORY_CONFIG.flatMap((category) => category.itemKeys);

const EMOTION_KEYS = [
  'options.emotions.happy',
  'options.emotions.romantic',
  'options.emotions.nostalgic',
  'options.emotions.energetic',
  'options.emotions.peaceful',
  'options.emotions.emotional',
  'options.emotions.inspiring',
  'options.emotions.playful',
  'options.emotions.melancholic',
  'options.emotions.triumphant',
  'options.emotions.grateful',
  'options.emotions.hopeful',
  'options.emotions.celebratory',
  'options.emotions.tender',
  'options.emotions.uplifting',
  'options.emotions.sentimental',
  'options.emotions.joyful',
  'options.emotions.passionate',
  'options.emotions.serene',
  'options.emotions.motivational',
];

const VOCAL_KEYS = ['style.voice.female', 'style.voice.male', 'style.voice.both'];

const SUPPORTED_LANGUAGES = ['pt', 'en'] as const;

const buildValueToKeyMap = (keys: readonly string[]) => {
  const map: Record<string, string> = {};
  keys.forEach((key) => {
    map[key] = key;
  });
  SUPPORTED_LANGUAGES.forEach((lng) => {
    const fixedT = i18n.getFixedT(lng, 'criar');
    keys.forEach((key) => {
      const label = fixedT(key);
      map[label] = key;
    });
  });
  return map;
};

const OCCASION_VALUE_MAP = buildValueToKeyMap(OCCASION_ITEM_KEYS);
const RELATIONSHIP_VALUE_MAP = buildValueToKeyMap(RELATIONSHIP_ITEM_KEYS);
const EMOTION_VALUE_MAP = buildValueToKeyMap(EMOTION_KEYS);
const VOCAL_VALUE_MAP = buildValueToKeyMap(VOCAL_KEYS);

const getOccasionCategories = (t: TFunction<'criar'>): OptionCategory[] =>
  OCCASION_CATEGORY_CONFIG.map(({ key, labelKey, itemKeys }) => ({
    key,
    label: t(labelKey),
    items: itemKeys.map((itemKey) => ({ key: itemKey, label: t(itemKey) })),
  }));

const getRelationshipCategories = (t: TFunction<'criar'>): OptionCategory[] =>
  RELATIONSHIP_CATEGORY_CONFIG.map(({ key, labelKey, itemKeys }) => ({
    key,
    label: t(labelKey),
    items: itemKeys.map((itemKey) => ({ key: itemKey, label: t(itemKey) })),
  }));

const getEmotions = (t: TFunction<'criar'>): OptionItem[] =>
  EMOTION_KEYS.map((key) => ({ key, label: t(key) }));

const getVocalPreferences = (t: TFunction<'criar'>): OptionItem[] =>
  VOCAL_KEYS.map((key) => ({ key, label: t(key) }));

const optionConfig = {
  occasion: { keys: OCCASION_ITEM_KEYS, map: OCCASION_VALUE_MAP },
  relationship: { keys: RELATIONSHIP_ITEM_KEYS, map: RELATIONSHIP_VALUE_MAP },
  emotion: { keys: EMOTION_KEYS, map: EMOTION_VALUE_MAP },
  vocal: { keys: VOCAL_KEYS, map: VOCAL_VALUE_MAP },
} as const;

type OptionType = keyof typeof optionConfig;

const normalizeOptionValue = (type: OptionType, value: string): string => {
  if (!value) return value;
  const { keys, map } = optionConfig[type];
  if (keys.includes(value)) {
    return value;
  }
  return map[value] ?? value;
};

const translateOptionValue = (
  type: OptionType,
  value: string,
  t: TFunction<'criar'>,
): string => {
  if (!value) return '';
  const normalized = normalizeOptionValue(type, value);
  const { keys } = optionConfig[type];
  if (keys.includes(normalized)) {
    return t(normalized);
  }
  return value;
};

export default function Criar() {
  const { t } = useTranslation('criar');
  
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
    setValidationPopupVisible,
    completeMvpFlow,
    // Nova função centralizada
    startNewCreationFlow,
    generatedLyrics,
  } = musicStore;

  // Hook de navegação
  const navigate = useNavigate();
  const location = useLocation();

  // Estado de autenticação
  const { isLoggedIn } = useAuthStore();

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
  const previousClipsCountRef = React.useRef<number>(0);
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
  // Obter arrays traduzidos
  const occasionCategories = React.useMemo(() => getOccasionCategories(t), [t]);
  const relationshipCategories = React.useMemo(() => getRelationshipCategories(t), [t]);
  const emotions = React.useMemo(() => getEmotions(t), [t]);
  const vocalPreferences = React.useMemo(() => getVocalPreferences(t), [t]);
  const emotionPlaceholder = t('style.emotion.placeholder', { defaultValue: 'Selecione a emoção' });

  // Categoria selecionada no briefing
  const [selectedOccasionCategory, setSelectedOccasionCategory] = useState<string>(() => {
    const normalizedOccasion = normalizeOptionValue('occasion', musicStore.formData.occasion);
    const found = OCCASION_CATEGORY_CONFIG.find((category) =>
      category.itemKeys.includes(normalizedOccasion),
    );
    return found?.key ?? OCCASION_CATEGORY_CONFIG[0]?.key ?? '';
  });
  const [selectedRelationshipCategory, setSelectedRelationshipCategory] = useState<string>(() => {
    const normalizedRelationship = normalizeOptionValue('relationship', musicStore.formData.relationship);
    const found = RELATIONSHIP_CATEGORY_CONFIG.find((category) =>
      category.itemKeys.includes(normalizedRelationship),
    );
    return found?.key ?? RELATIONSHIP_CATEGORY_CONFIG[0]?.key ?? '';
  });

  const handleFeedbackSubmit = React.useCallback(async ({
    difficulty,
    wouldRecommend,
    priceRaw,
  }: FeedbackSubmissionPayload) => {
    await apiRequest('/api/save-feedback', {
      method: 'POST',
      body: {
        difficulty,
        wouldRecommend,
        priceWillingness: priceRaw,
      },
    });
  }, []);

  const handleFeedbackClose = React.useCallback(() => {
    setValidationPopupVisible(false);
  }, [setValidationPopupVisible]);

  const handleFeedbackSuccess = React.useCallback(() => {
    completeMvpFlow();
  }, [completeMvpFlow]);

  const selectedOccasionCategoryData = occasionCategories.find(
    (category) => category.key === selectedOccasionCategory,
  ) ?? occasionCategories[0];
  const selectedRelationshipCategoryData = relationshipCategories.find(
    (category) => category.key === selectedRelationshipCategory,
  ) ?? relationshipCategories[0];





  useEffect(() => {
    const updates: Partial<MusicFormData> = {};

    if (formData.occasion) {
      const normalized = normalizeOptionValue('occasion', formData.occasion);
      if (normalized !== formData.occasion) {
        updates.occasion = normalized;
      }
    }

    if (formData.relationship) {
      const normalized = normalizeOptionValue('relationship', formData.relationship);
      if (normalized !== formData.relationship) {
        updates.relationship = normalized;
      }
    }

    if (formData.emotion) {
      const normalized = normalizeOptionValue('emotion', formData.emotion);
      if (normalized !== formData.emotion) {
        updates.emotion = normalized;
      }
    }

    if (formData.vocalPreference) {
      const normalized = normalizeOptionValue('vocal', formData.vocalPreference);
      if (normalized !== formData.vocalPreference) {
        updates.vocalPreference = normalized;
      }
    }

    if (Object.keys(updates).length > 0) {
      updateFormData(updates);
    }
  }, [formData.occasion, formData.relationship, formData.emotion, formData.vocalPreference, updateFormData]);

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

  // Disparar confetes somente quando a letra for gerada automaticamente (AI),
  // evitando disparo durante edição manual da letra.
  // Usamos generatedLyrics para detectar geração automática.
  useEffect(() => {
    if (currentStep === 1 && generatedLyrics && previousGeneratedLyricsRef.current !== generatedLyrics) {
      setShowConfetti(true);
      scrollToLyricsSection();
    }
    previousGeneratedLyricsRef.current = generatedLyrics;
  }, [generatedLyrics, currentStep, scrollToLyricsSection]);

  // Disparar confetes quando opções de música (previews) forem carregadas
  useEffect(() => {
    const clips = musicStore.audioClips || [];
    const readyCount = clips.filter((clip) => !!clip?.audio_url).length;
    const prevCount = previousClipsCountRef.current;
    const isOnPreviewStep = currentStep === steps.length - 1; // "Prévia"

    // Removemos a dependência de !isLoading para garantir confetes
    // também na primeira música gerada, enquanto ainda há processamento.
    if (isOnPreviewStep && readyCount > prevCount && readyCount >= 1) {
      setShowConfetti(true);
    }

    previousClipsCountRef.current = readyCount;
  }, [musicStore.audioClips, currentStep]);

  // (Mantido acima com confetes + scroll)

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
      // Exibir toast padronizado para campos obrigatórios não preenchidos
      const ns = 'musicStore';
      const message = currentStep === 0
        ? i18n.t('validation.fillRequiredFieldsStep1', { ns })
        : currentStep === 2
        ? i18n.t('validation.fillStyleFields', { ns })
        : i18n.t('validation.fillRequiredFields', { ns });
      toast.error(message, { duration: 6000 });
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
          <HeroCard title={t('briefing.title')}>
            <div className="space-y-8">
              {/* Mensagem de erro global */}
              {error && (
                <div className="bg-accent-coral/10 border border-accent-coral/20 rounded-lg p-4">
                  <p className="text-accent-coral text-sm font-medium">{error}</p>
                </div>
              )}
              
              {/* A Ocasião (por categorias) */}
              <GlassSection title={t('briefing.occasion.title')}>
                <div className="space-y-3">
                  <Label className="text-white/90 font-medium drop-shadow-sm">{t('briefing.occasion.label')}</Label>
                  {/* Categorias */}
                  <GlassButtonGroup>
                    {occasionCategories.map(({ key, label }) => {
                      const active = selectedOccasionCategory === key;
                      return (
                        <GlassButton
                          type="button"
                          key={key}
                          active={active}
                          onClick={() => setSelectedOccasionCategory(key)}
                          aria-pressed={active}
                        >
                          {label}
                        </GlassButton>
                      );
                    })}
                  </GlassButtonGroup>

                  {/* Separador visual entre categoria principal e subcategorias */}
                  {selectedOccasionCategory && selectedOccasionCategoryData?.items && selectedOccasionCategoryData.items.length > 0 && (
                    <GlassSeparator className="my-3" />
                  )}

                  {/* Opções da categoria selecionada */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
                    {selectedOccasionCategoryData?.items.map((item) => {
                      const active = formData.occasion === item.key;
                      return (
                        <GlassButton
                          type="button"
                          key={item.key}
                          active={active}
                          variant="secondary"
                          onClick={() => handleFieldUpdate('occasion', item.key)}
                          className="text-left"
                        >
                          {item.label}
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
              <GlassSection title={t('briefing.person.title')}>
                <div className="space-y-4">
                  <GlassInput
                    id="recipientName"
                    label={t('briefing.person.recipientName.label')}
                    placeholder={t('briefing.person.recipientName.placeholder')}
                    value={formData.recipientName}
                    onChange={(e) => handleFieldUpdate('recipientName', e.target.value)}
                    error={validationErrors.recipientName}
                  />
                  {validationErrors.recipientName && (
                    <p className="text-sm text-red-300/90 drop-shadow-sm">{validationErrors.recipientName}</p>
                  )}
                  
                  <div className="space-y-2">
                    <Label className="text-white/90 font-medium drop-shadow-sm">{t('briefing.person.relationship.label')}</Label>
                    {/* Categorias de relação */}
                    <GlassButtonGroup>
                      {relationshipCategories.map(({ key, label }) => {
                        const active = selectedRelationshipCategory === key;
                        return (
                          <GlassButton
                            type="button"
                            key={key}
                            active={active}
                            onClick={() => setSelectedRelationshipCategory(key)}
                            aria-pressed={active}
                          >
                            {label}
                          </GlassButton>
                        );
                      })}
                    </GlassButtonGroup>

                    {/* Separador visual entre categoria principal e subcategorias */}
                    {selectedRelationshipCategory && selectedRelationshipCategoryData?.items && selectedRelationshipCategoryData.items.length > 0 && (
                      <GlassSeparator className="my-3" />
                    )}

                    {/* Opções da categoria selecionada */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
                      {selectedRelationshipCategoryData?.items.map((item) => {
                        const active = formData.relationship === item.key;
                        return (
                          <GlassButton
                            type="button"
                            key={item.key}
                            active={active}
                            variant="secondary"
                            onClick={() => handleFieldUpdate('relationship', item.key)}
                            className="text-left"
                          >
                            {item.label}
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
                    label={t('briefing.person.senderName.label')}
                    placeholder={t('briefing.person.senderName.placeholder')}
                    value={formData.senderName}
                    onChange={(e) => handleFieldUpdate('senderName', e.target.value)}
                  />
                </div>
              </GlassSection>

              {/* Detalhes e Personalidade */}
              <GlassSection title={t('briefing.details.title')}>
                <div className="space-y-4">
                  <GlassTextarea
                    id="hobbies"
                    label={t('briefing.details.hobbies.label')}
                    placeholder={t('briefing.details.hobbies.placeholder')}
                    value={formData.hobbies}
                    onChange={(e) => handleFieldUpdate('hobbies', e.target.value)}
                    rows={3}
                  />
                  {validationErrors.hobbies && (
                    <p className="text-sm text-red-300/90 drop-shadow-sm">{validationErrors.hobbies}</p>
                  )}
                  
                  <GlassTextarea
                    id="qualities"
                    label={t('briefing.details.qualities.label')}
                    placeholder={t('briefing.details.qualities.placeholder')}
                    value={formData.qualities}
                    onChange={(e) => handleFieldUpdate('qualities', e.target.value)}
                    rows={3}
                  />
                  {validationErrors.qualities && (
                    <p className="text-sm text-red-300/90 drop-shadow-sm">{validationErrors.qualities}</p>
                  )}
                  
                  <GlassTextarea
                    id="uniqueTraits"
                    label={t('briefing.details.uniqueTraits.label')}
                    placeholder={t('briefing.details.uniqueTraits.placeholder')}
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
              <GlassSection title={t('briefing.memories.title')}>
                <GlassTextarea
                  id="memories"
                  label={t('briefing.memories.label')}
                  placeholder={t('briefing.memories.placeholder')}
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
          <HeroCard title={t('lyrics.title')}>
            <div className="space-y-6">
              {!formData.lyrics && !isLoading && (
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    {t('lyrics.description')}
                  </p>
                  <PurpleFormButton 
                    onClick={generateLyrics} 
                    isLoading={isLoading}
                    loadingText={t('lyrics.generating')}
                    disabled={isLoading || !formData.occasion || !formData.recipientName || !formData.relationship}
                  >
                    {t('lyrics.generateButton')}
                  </PurpleFormButton>
                </div>
              )}

              {isLoading && (
                <div className="text-center space-y-4 py-8">
                  <div className="flex justify-center">
                  <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{t('lyrics.creating')}</p>
                    <p className="text-sm text-white/50">
                      {t('lyrics.analyzing')}
                    </p>
                  </div>
                </div>
              )}

              {formData.lyrics && !isLoading && (
                <div className="space-y-4">
                  
                  <LiquidGlassCard variant="primary" size="lg" className="p-6 sm:p-8">
                    {/* Cabeçalho da seção */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/20 backdrop-blur-sm">
                          <Music className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-heading font-semibold text-lg text-white">
                            {t('lyrics.personalizedTitle')}
                          </h3>
                          <p className="text-sm text-white/60 mt-0.5">
                            {isEditingLyrics ? t('lyrics.editModeActive') : t('lyrics.clickToEdit')}
                          </p>
                        </div>
                      </div>
                      <LiquidGlassButtonWhite
                        onClick={toggleLyricsEditor}
                        className="text-sm px-4 py-2.5 h-auto font-medium"
                        aria-label={isEditingLyrics ? t('lyrics.closeEdit') : t('lyrics.editLyrics')}
                        aria-pressed={isEditingLyrics}
                      >
                        {isEditingLyrics ? <X className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                        {isEditingLyrics ? t('lyrics.closeEdit') : t('lyrics.editLyrics')}
                      </LiquidGlassButtonWhite>
                    </div>

                    {!isEditingLyrics ? (
                      <div className="relative">
                        <pre className="whitespace-pre-wrap text-sm leading-relaxed font-medium text-white/90 p-4 rounded-lg bg-white/5 border border-white/10" 
                             dangerouslySetInnerHTML={{ __html: getHighlightHtml(formData.lyrics || '', findText) }} />
                        {findText && (
                          <div className="absolute top-2 right-2">
                            <span className="text-xs px-2 py-1 rounded-md bg-primary/20 text-primary font-medium">
                              {t('lyrics.searching')}: "{findText}"
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
                                  label={t('lyrics.findTextLabel')}
                                  value={findText}
                                  onChange={(e) => setFindText(e.target.value)}
                                  placeholder={t('lyrics.searchPlaceholder')}
                                  className="pl-10 pr-10"
                                />
                                <div className="absolute left-3 top-[42px] pointer-events-none">
                                  <Search className="w-4 h-4 text-white/50" />
                                </div>
                                {findText && (
                                  <button
                                    type="button"
                                    aria-label={t('lyrics.clearSearch')}
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
                                {t('lyrics.restore')}
                              </button>
                              
                              <div className="flex items-center justify-center gap-2 text-xs text-white/70 bg-white/5 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-1.5">
                                  {saveHint === 'saving' && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
                                  {saveHint === 'saved' && <Check className="w-3.5 h-3.5 text-green-400" />}
                                  {saveHint === 'idle' && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                                  <span className="font-medium">
                                    {saveHint === 'saving' ? t('lyrics.saving') : saveHint === 'saved' ? t('lyrics.saved') : t('lyrics.autoSave')}
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
                                {t('lyrics.highlighting')}: "{findText}"
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
                      loadingText={t('lyrics.generatingNew')}
                      iconPosition="right"
                    >
                      {t('lyrics.generateNew')}
                      <RotateCcw className="w-4 h-4" />
                    </PurpleFormButton>

                  </div>
                  
                  <p className="text-xs text-white/60 text-center">
                    💡 {t('lyrics.tip')}
                  </p>
                </div>
              )}
            </div>
          </HeroCard>
        );
      
      case 2:
        return (
          <HeroCard title={t('style.title')}>
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
                    <Label htmlFor="emotion" className="text-base font-semibold text-white">{t('style.emotion.label')}</Label>
                    <Select
                      value={formData.emotion || ''}
                      onValueChange={(value) => handleFieldUpdate('emotion', value)}
                    >
                       <SelectTrigger className="h-12 bg-white/10 backdrop-blur-md border-white/20 text-white placeholder:text-white/60 hover:bg-white/15 focus:bg-white/20 focus:border-white/40">
                         <SelectValue placeholder={emotionPlaceholder} />
                       </SelectTrigger>
                      <SelectContent>
                        {emotions.map((emotion) => (
                          <SelectItem key={emotion.key} value={emotion.key}>
                            {emotion.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {validationErrors.emotion && (
                      <p className="text-sm text-accent-coral mt-1">{validationErrors.emotion}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="vocalPreference" className="text-base font-semibold text-white">{t('style.voice.label')}</Label>
                    <Select
                      value={formData.vocalPreference || ''}
                      onValueChange={(value) => handleFieldUpdate('vocalPreference', value)}
                    >
                       <SelectTrigger className="h-12 bg-white/10 backdrop-blur-md border-white/20 text-white placeholder:text-white/60 hover:bg-white/15 focus:bg-white/20 focus:border-white/40">
                         <SelectValue placeholder={t('style.voice.placeholder')} />
                       </SelectTrigger>
                      <SelectContent>
                        {vocalPreferences.map((preference) => (
                          <SelectItem key={preference.key} value={preference.key}>
                            {preference.label}
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
          { label: t('summary.occasion'), value: translateOptionValue('occasion', formData.occasion, t) },
          { label: t('summary.for'), value: formData.recipientName },
          { label: t('summary.relationship'), value: translateOptionValue('relationship', formData.relationship, t) },
          { label: t('summary.genre'), value: formData.genre },
          { label: t('summary.emotion'), value: translateOptionValue('emotion', formData.emotion, t) },
          { label: t('summary.vocal'), value: translateOptionValue('vocal', formData.vocalPreference, t) },
        ].filter((item) => Boolean(item.value));

        const summaryCard = summaryItems.length > 0 ? (
          <LiquidGlassCard size="lg" className="p-8 space-y-6 text-left">
            <div className="flex justify-end">
              <span className="h-2 w-2 rounded-full bg-secondary shadow-[0_0_12px_rgba(254,198,65,0.65)]" aria-hidden />
            </div>
            <div>
              <h3 className="text-2xl font-semibold font-heading text-white">{t('summary.title')}</h3>
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
                <p className="text-sm text-white/70">{t('generation.connecting')}</p>
              </div>
            ) : (
              <CountdownTimer className="w-full" />
            )}
            <div className="space-y-2">
              <h3 className="text-xl font-semibold font-heading text-white">
                {!currentTaskId ? t('generation.starting') : musicGenerationStatus === 'processing' ? t('generation.creating') : t('generation.processing')}
              </h3>
              <p className="text-sm text-white/70 max-w-md mx-auto">
                  {!currentTaskId
                    ? t('generation.preparing')
                  : totalExpected > 0
                      ? t('generation.generating', {
                          count: Math.max(1, Math.min(completedClips || 0, totalExpected)),
                          total: totalExpected,
                        })
                      : t('generation.finalizing')}
                </p>
            </div>
            {totalExpected > 0 && (
              <div className="w-full max-w-sm space-y-3">
                <div className="text-[11px] uppercase tracking-[0.28em] text-white/60">{t('generation.progress')}</div>
                <div className="flex items-center justify-between text-sm text-white/80">
                  <span>{t('generation.songsReady', { completed: completedClips || 0, total: totalExpected })}</span>
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
                {t('generation.beingGenerated')}
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
                          {t('generation.musicFor', { name: formData.recipientName || t('generation.specialPerson') })}
                        </h3>
                        {audioClips?.length ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-secondary/20 px-4 py-2 text-xs font-medium text-secondary backdrop-blur">
                            ✓ {t('generation.versionsReady', { count: audioClips.filter((clip) => clip.audio_url).length })}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {(isPolling || isPreviewLoading) && totalExpected > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-white/70">
                          <span>{t('generation.generationProgress')}</span>
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
                            {t('generation.personalizedSongs')}
                          </h4>
                          <p className="text-sm text-white/70">{t('generation.listenAndChoose')}</p>
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
                                {t('generation.option', { number: placeholderIndex })}
                                <span className="inline-flex items-center gap-1 rounded-full bg-secondary/15 px-3 py-1 text-xs font-medium text-secondary">
                                  <Loader2 className="h-4 w-4 animate-spin text-secondary" />
                                  {t('generation.generating')}
                                </span>
                              </h4>
                              <p className="text-sm text-white/70">{t('generation.preparing')}</p>
                            </div>
                            <div className="text-sm text-white/60">
                              {t('generation.estimatedDuration')}
                              <p className="font-mono text-lg text-white/80">--:--</p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-4 md:flex-row md:items-center">
                            <LiquidGlassCard size="sm" className="flex h-20 w-full items-center justify-center !p-0 text-white/70 md:w-24">
                              <Music className="h-6 w-6" />
                            </LiquidGlassCard>
                            <LiquidGlassCard size="sm" className="flex-1 !p-0 px-4 py-3 text-sm text-white/70">
                              {t('generation.playerWillAppear')}
                            </LiquidGlassCard>
                          </div>

                          <div className="mt-4">
                            <Button size="sm" variant="outline" className="w-full" disabled>
                              <Download className="mr-2 h-4 w-4" />
                              {t('generation.waitingGeneration')}
                            </Button>
                          </div>
                        </LiquidGlassCard>
                      );
                    })}

                    {(!audioClips || audioClips.length === 0) && !isPolling && (
                      <LiquidGlassCard className="p-6 text-center text-white/70">
                        <h4 className="mb-2 text-lg font-semibold font-heading text-white">{t('generation.noPreviewAvailable')}</h4>
                        <p className="text-sm">{t('generation.tryGenerateAgain')}</p>
                      </LiquidGlassCard>
                    )}
                  </div>

                  {currentStep === steps.length - 1 && isLoggedIn && (
                    <div className="flex justify-center">
                      <LiquidGlassButton
                        onClick={() => {
                          const musicStoreState = useMusicStore.getState();
                          const { token } = useAuthStore.getState();
                          musicStoreState.startNewCreationFlow(navigate, token);
                        }}
                        className="px-8"
                      >
                        {t('generation.createNewMusic')}
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
      <main className="flex-1 pt-24 sm:pt-32 lg:pt-40 pb-6 sm:pb-8 lg:pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-sm sm:max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto">
            <div className="text-center mb-6 sm:mb-8">
              <SectionTitle>
                <span dangerouslySetInnerHTML={{ __html: t('page.title') }} />
              </SectionTitle>
              <SectionSubtitle>
          {t('page.subtitle')}
        </SectionSubtitle>
            </div>
            
            <StepIndicator steps={steps} currentStep={currentStep} />
            {/* Confetes em escopo global para qualquer etapa */}
            <ConfettiAnimation show={showConfetti} onComplete={() => setShowConfetti(false)} />
            
            <div className="space-y-4 sm:space-y-6">
              <div ref={currentStep === 1 ? lyricsSectionRef : null}>
                {renderStepContent(currentStep, isLoading, musicStore.audioClips || [])}
              </div>
              
              {/* Navigation Buttons - Layout responsivo melhorado */}
              <div className={`flex flex-col sm:flex-row gap-4 sm:gap-6 ${currentStep === 0 ? 'sm:justify-end' : 'sm:justify-between'} items-stretch sm:items-center`}>
                {currentStep > 0 && currentStep !== steps.length - 1 && (
                  <LiquidGlassButtonWhiteSmall
                    onClick={handlePrevStep}
                    className="w-full sm:w-auto min-w-[120px] min-h-[48px] px-6 py-3 touch-manipulation text-sm font-medium"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t('navigation.previous')}
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
                      className="w-full sm:w-auto min-w-[160px] min-h-[48px] px-6 py-3 touch-manipulation text-sm font-medium order-first sm:order-last"
                    >
                      {t('navigation.approveAndContinue')}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </LiquidGlassButtonSmall>
                  ) : (
                    <LiquidGlassButtonSmall 
                      onClick={handleNextStep}
                      className="w-full sm:w-auto min-w-[120px] min-h-[48px] px-6 py-3 touch-manipulation text-sm font-medium order-first sm:order-last"
                    >
                      {currentStep === 2 ? t('style.continueButton') : t('navigation.next')}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </LiquidGlassButtonSmall>
                  )
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* FeedbackPopup renderizado condicionalmente */}
      {isValidationPopupVisible && (
        <FeedbackPopup
          isOpen={isValidationPopupVisible}
          onClose={handleFeedbackClose}
          submitFeedback={handleFeedbackSubmit}
          onSubmitSuccess={handleFeedbackSuccess}
          disableClose
        />
      )}
    </div>
  );
}
