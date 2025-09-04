import React from 'react';
import { useState, useEffect } from "react";
import { toast } from 'sonner';

import StepIndicator from "@/components/StepIndicator";
import MusicPreview from "@/components/MusicPreview";
import ValidationPopup from "@/components/ValidationPopup";
import GenreSelector from "@/components/GenreSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Download, RotateCcw, ArrowLeft, ArrowRight, Music, Sparkles, Edit, Volume2, Loader2, Wand2, RefreshCw, Pause } from "lucide-react";
import { useMusicStore } from '@/store/musicStore';
import { useUiStore } from '@/store/uiStore';
import { musicGenres } from '@/data/musicGenres';
import { validateStep, getValidationErrors } from '@/lib/validations';
import { z } from 'zod';

const steps = ["Briefing", "Letra", "Estilo", "Prévia"];

const occasions = [
  "Aniversário",
  "Aniversário de Namoro/Casamento",
  "Casamento",
  "Pedido de Casamento",
  "Agradecimento",
  "Formatura",
  "Desculpa",
  "Feriado",
  "Melhoras",
  "Outro"
];

const relationships = [
  "Parceiro(a)/Cônjuge",
  "Filho(a)",
  "Pai/Mãe",
  "Irmão/Irmã",
  "Avô/Avó",
  "Neto(a)",
  "Amigo(a)",
  "Colega"
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
  "Ambos",
  "Indiferente"
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
    reset,
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
  } = musicStore;

  // Estado de bloqueio centralizado
  const { isCreationFlowBlocked } = useUiStore();

  // Estados locais apenas para UI
  const [validationErrors, setValidationErrors] = useState({});





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

  // Função para validar e avançar para o próximo passo
  const handleNextStep = async () => {
    // Guarda de bloqueio global
    const { showPaymentPopup } = useUiStore.getState();
    if (isCreationFlowBlocked) {
      console.log('[PAYWALL] Ação bloqueada. Re-exibindo modal.');
      showPaymentPopup();
      return;
    }

    console.log('=== DEBUG HANDLE NEXT STEP ===');
    console.log('Current step:', currentStep);
    console.log('FormData antes da validação:', JSON.stringify(formData, null, 2));
    
    // Validar o passo atual antes de avançar
    const validationResult = validateStep(currentStep, formData);
    console.log('Resultado da validação:', validationResult);
    
    if (!validationResult.success) {
      console.log('❌ Validação falhou:', validationResult.error?.issues);
      const errorMessages = validationResult.error.issues?.map(issue => issue.message).join('\n') || 'Erro de validação';
      console.error('Mensagens de erro:', errorMessages);
      
      // Se o erro tem a estrutura do Zod, usar getValidationErrors
      if (validationResult.error && 'errors' in validationResult.error) {
        const errors = getValidationErrors(validationResult.error);
        setValidationErrors(errors);
      } else {
        // Para erros customizados (como passo inválido), mostrar no console
        console.error('Erro de validação:', errorMessages);
      }
      return;
    }
    
    console.log('✅ Validação passou - Avançando para próximo passo');
    setValidationErrors({});
    
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
          <Card>
            <CardHeader>
              <CardTitle>Conte sua história</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Mensagem de erro global */}
              {error && (
                <div className="bg-accent-coral/10 border border-accent-coral/20 rounded-lg p-4">
                  <p className="text-accent-coral text-sm font-medium">{error}</p>
                </div>
              )}
              
              {/* A Ocasião */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold font-heading">A Ocasião</h3>
                <div className="space-y-2">
                  <Label htmlFor="occasion">Qual a ocasião especial? *</Label>
                  <Select value={formData.occasion} onValueChange={(value) => handleFieldUpdate('occasion', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a ocasião" />
                    </SelectTrigger>
                    <SelectContent>
                      {occasions.map((occasion) => (
                        <SelectItem key={occasion} value={occasion}>
                          {occasion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.occasion && (
                    <p className="text-sm text-accent-coral mt-1">{validationErrors.occasion}</p>
                  )}
                </div>
              </div>

              {/* Sobre a(s) Pessoa(s) */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold font-heading">Sobre a(s) Pessoa(s)</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipientName">Qual o nome da pessoa para quem está a criar esta música? *</Label>
                    <Input
                      id="recipientName"
                      placeholder="Ex: Maria"
                      value={formData.recipientName}
                      onChange={(e) => handleFieldUpdate('recipientName', e.target.value)}
                      className={validationErrors.recipientName ? 'border-accent-coral focus:ring-accent-coral' : ''}
                    />
                    {validationErrors.recipientName && (
                      <p className="text-sm text-accent-coral mt-1">{validationErrors.recipientName}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="relationship">Qual a vossa relação? *</Label>
                    <Select value={formData.relationship} onValueChange={(value) => handleFieldUpdate('relationship', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a relação" />
                      </SelectTrigger>
                      <SelectContent>
                        {relationships.map((relationship) => (
                          <SelectItem key={relationship} value={relationship}>
                            {relationship}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {validationErrors.relationship && (
                      <p className="text-sm text-accent-coral mt-1">{validationErrors.relationship}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="senderName">Qual o seu nome?</Label>
                    <Input
                      id="senderName"
                      placeholder="Ex: João"
                      value={formData.senderName}
                      onChange={(e) => handleFieldUpdate('senderName', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Detalhes e Personalidade */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold font-heading">Detalhes e Personalidade</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="hobbies">Fale-nos sobre os seus hobbies e interesses!</Label>
                    <Textarea
                      id="hobbies"
                      placeholder="Ex: Adora cozinhar, fazer caminhadas na natureza, ler livros de ficção..."
                      value={formData.hobbies}
                      onChange={(e) => handleFieldUpdate('hobbies', e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="qualities">Quais as qualidades que você mais admira nessa pessoa?</Label>
                    <Textarea
                      id="qualities"
                      placeholder="Ex: É muito generosa, sempre disposta a ajudar, tem um sorriso contagiante..."
                      value={formData.qualities}
                      onChange={(e) => handleFieldUpdate('qualities', e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="uniqueTraits">O que a torna única ou especial? Tem algum hábito engraçado ou interessante?</Label>
                    <Textarea
                      id="uniqueTraits"
                      placeholder="Ex: Sempre canta no chuveiro, coleciona postais de viagens, faz as melhores panquecas..."
                      value={formData.uniqueTraits}
                      onChange={(e) => handleFieldUpdate('uniqueTraits', e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Memórias e Histórias */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold font-heading">Memórias e Histórias</h3>
                <div className="space-y-2">
                  <Label htmlFor="memories">Partilhe as vossas histórias ou memórias favoritas que gostaria de incluir na música.</Label>
                  <Textarea
                    id="memories"
                    placeholder="Uma é suficiente. Mais é melhor."
                    value={formData.memories}
                    onChange={(e) => handleFieldUpdate('memories', e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Letra da sua música</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!formData.lyrics && !isLoading && (
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    Vamos gerar a letra da sua música baseada na história que você contou.
                  </p>
                  <Button 
                    onClick={generateLyrics} 
                    variant="default" 
                    size="lg"
                    disabled={isLoading || !formData.occasion || !formData.recipientName || !formData.relationship}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Gerando letra...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Gerar Letra da Música
                      </>
                    )}
                  </Button>
                </div>
              )}

              {isLoading && (
                <div className="text-center space-y-4 py-8">
                  <div className="pulse-music">
                    <Music className="w-12 h-12 text-primary mx-auto" />
                  </div>
                  <div>
                    <p className="font-medium">Criando sua letra personalizada...</p>
                    <p className="text-sm text-muted-foreground">
                      Nossa IA está analisando sua história e criando versos únicos
                    </p>
                  </div>
                </div>
              )}

              {formData.lyrics && !isLoading && (
                <div className="space-y-4">
                  <div className="bg-muted p-6 rounded-lg">
                    <h3 className="font-heading font-semibold mb-3 flex items-center gap-2">
                      <Music className="w-5 h-5 text-primary" />
                      Sua Letra Personalizada
                    </h3>
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed font-medium">
                      {formData.lyrics}
                    </pre>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      variant="outline" 
                      onClick={regenerateLyrics} 
                      className="flex-1"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RotateCcw className="w-4 h-4" />
                      )}
                      Gerar Nova Letra
                    </Button>
                    <Button variant="default" onClick={nextStep} className="flex-1">
                      <ArrowRight className="w-4 h-4" />
                      Aprovar e Continuar
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground text-center">
                    💡 Dica: Você pode gerar quantas versões quiser até ficar satisfeito
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold font-heading mb-2">Escolha o estilo musical</h2>
              <p className="text-muted-foreground">
                Selecione o gênero musical e as preferências para sua música
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <Label className="text-base font-semibold">Estilo Musical *</Label>
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
              
              <div className="space-y-2">
                <Label htmlFor="emotion" className="text-base font-semibold">Que emoção você quer transmitir? *</Label>
                <Select value={formData.emotion} onValueChange={(value) => handleFieldUpdate('emotion', value)}>
                  <SelectTrigger className="h-12">
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
                <Label htmlFor="vocalPreference" className="text-base font-semibold">Prefere vocais masculinos ou femininos? *</Label>
                <Select value={formData.vocalPreference} onValueChange={(value) => handleFieldUpdate('vocalPreference', value)}>
                  <SelectTrigger className="h-12">
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
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold font-heading mb-2">Ouça a sua criação</h2>
              <p className="text-muted-foreground">
                Sua música está pronta! Ouça uma prévia e escolha o que fazer a seguir
              </p>
            </div>

            {(isPreviewLoading || isPolling) && (!musicStore.audioClips || musicStore.audioClips.length === 0) ? (
              <div className="text-center space-y-6 py-12">
                <div className="w-16 h-16 bg-accent-turquoise/20 rounded-full flex items-center justify-center mx-auto">
                  <Loader2 className="w-8 h-8 text-accent-turquoise animate-spin" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-heading mb-2">
                    {musicGenerationStatus === 'PROCESSING' ? 'Criando sua música...' : 'Iniciando geração...'}
                  </h3>
                  <p className="text-muted-foreground">
                    {totalExpected > 0 
                      ? `Gerando ${totalExpected} versões da sua música personalizada.`
                      : 'Estamos finalizando os últimos detalhes da sua música personalizada.'
                    }
                  </p>
                  {/* Indicador de progresso */}
                  {totalExpected > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <span>Progresso: {completedClips}/{totalExpected} músicas prontas</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 mt-2">
                        <div 
                          className="bg-accent-turquoise h-2 rounded-full transition-all duration-500"
                          style={{ width: `${totalExpected > 0 ? (completedClips / totalExpected) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                  <h4 className="font-semibold font-heading text-lg">Resumo da sua música:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Ocasião:</span> {formData.occasion}
                    </div>
                    <div>
                      <span className="font-medium">Para:</span> {formData.recipientName}
                    </div>
                    <div>
                      <span className="font-medium">Relação:</span> {formData.relationship}
                    </div>
                    <div>
                      <span className="font-medium">Gênero:</span> {formData.genre}
                    </div>
                    <div>
                      <span className="font-medium">Emoção:</span> {formData.emotion}
                    </div>
                    <div>
                      <span className="font-medium">Vocal:</span> {formData.vocalPreference}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="w-5 h-5" />
                    Música para {formData.recipientName || 'Pessoa Especial'}
                  </CardTitle>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Estilo: {formData.genre ? formData.genre.charAt(0).toUpperCase() + formData.genre.slice(1) : 'Pop'} • 
                      Emoção: {formData.emotion || 'Feliz e animado'} • 
                      Vocal: {formData.vocalPreference || 'Feminino'}
                    </p>
                    {/* Barra de progresso quando está gerando */}
                    {(isPolling || isPreviewLoading) && totalExpected > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Progresso da geração</span>
                          <span>{completedClips || 0}/{totalExpected}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${totalExpected > 0 ? ((completedClips || 0) / totalExpected) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Sistema Progressivo - Mostra músicas prontas + placeholders para as que estão sendo geradas */}
                  <div className="space-y-4">
                    {/* Renderizar músicas prontas */}
                    {audioClips && audioClips.length > 0 && audioClips.map((clip, index) => (
                      <div key={clip.id || index} className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-lg border">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold font-heading text-lg flex items-center gap-2">
                              Opção {index + 1}
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ✓ Pronta
                              </span>
                            </h3>
                            <p className="text-sm text-muted-foreground">{clip.title || `Prévia ${index + 1}`}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Duração</p>
                            <p className="font-mono text-lg">{clip.duration || '3:24'}</p>
                          </div>
                        </div>
                        
                        {/* Usar o componente MusicPreview que inclui a lógica de fade-out e controle de download */}
                        <MusicPreview clip={clip} index={index} />
                      </div>
                    ))}
                    
                    {/* Renderizar placeholders para músicas ainda sendo geradas */}
                    {isPolling && totalExpected > 0 && Array.from({ length: Math.max(0, totalExpected - (audioClips?.length || 0)) }).map((_, index) => {
                      const placeholderIndex = (audioClips?.length || 0) + index + 1;
                      return (
                        <div key={`placeholder-${placeholderIndex}`} className="bg-gradient-to-r from-muted/50 to-muted/30 p-6 rounded-lg border border-dashed">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="font-semibold font-heading text-lg flex items-center gap-2">
                                Opção {placeholderIndex}
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  Gerando...
                                </span>
                              </h3>
                              <p className="text-sm text-muted-foreground">Aguarde, sua música está sendo criada</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Duração</p>
                              <p className="font-mono text-lg text-muted-foreground">--:--</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 mb-4">
                            {/* Placeholder para capa */}
                            <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                              <Music className="w-8 h-8 text-muted-foreground" />
                            </div>
                            {/* Placeholder para player */}
                            <div className="flex-1 h-12 bg-muted rounded-md flex items-center justify-center">
                              <span className="text-sm text-muted-foreground">Player será exibido quando a música estiver pronta</span>
                            </div>
                          </div>

                          {/* Placeholder para botão de download */}
                          <div className="flex justify-center">
                            <Button size="sm" variant="outline" className="w-full" disabled>
                              <Download className="w-4 h-4 mr-2" />
                              Aguardando geração...
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Fallback quando não há músicas nem polling ativo */}
                    {(!audioClips || audioClips.length === 0) && !isPolling && (
                      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-lg border">
                        <div className="text-center">
                          <h3 className="font-heading font-semibold text-lg mb-2">Nenhuma prévia disponível</h3>
                          <p className="text-sm text-muted-foreground">Tente gerar a música novamente.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Botões de Ação */}
                  <div className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-3">
                      <Button 
                        variant="outline" 
                        size="lg"
                        onClick={() => setCurrentStep(2)}
                        className="w-full"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Alterar Estilo
                      </Button>
                      <Button 
                        variant="link" 
                        size="lg"
                        onClick={() => setCurrentStep(0)}
                        className="w-full"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar Briefing
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };



  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pt-20 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold font-heading mb-4">
                Criar sua <span className="bg-gradient-music bg-clip-text text-transparent">música personalizada</span>
              </h1>
              <p className="text-muted-foreground">
                Siga os passos abaixo para criar sua canção única
              </p>
            </div>
            
            <StepIndicator steps={steps} currentStep={currentStep} />
            
            <div className="space-y-6">
              {renderStepContent(currentStep, isLoading, musicStore.audioClips || [])}
              
              {/* Navigation Buttons */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={currentStep === 0}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Anterior
                </Button>
                
                {currentStep < steps.length - 1 ? (
                  currentStep === 1 ? (
                    // Na etapa de letra, só mostra próximo se tiver letra aprovada
                    formData.lyrics && !isLoading ? null : (
                      <div></div> // Espaço vazio para manter o layout
                    )
                  ) : (
                    <Button onClick={handleNextStep}>
                      Próximo
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  )
                ) : (
                  <Button variant="secondary" onClick={async () => {
                    console.log('[RESET_FLOW] Limpando o estado antes de criar uma nova música.');
                    const { token } = useAuthStore.getState(); // Pega o token mais atualizado
                    reset();
                    await startNewCreationFlow(() => setCurrentStep(0), token);
                  }}>
                    Criar Nova Música
                  </Button>
                )}
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