# Guia de Implementação: Sistema de Salvamento Automático

## 1. Resumo Executivo

Este guia detalha a implementação prática do sistema de salvamento automático de músicas para usuários autenticados e convidados, incluindo modificações nos endpoints existentes e criação de novos serviços.

## 2. Análise do Código Atual

### 2.1 Estrutura Identificada

**Endpoints Existentes:**
- `api/generate-preview.ts` - Geração inicial de música
- `api/check-music-status.ts` - Verificação de status (polling)

**Stores Existentes:**
- `src/store/musicStore.ts` - Estado da aplicação de música
- `src/store/authStore.ts` - Estado de autenticação

**Banco de Dados:**
- Supabase configurado
- Tabela `mvp_feedback` existente
- Necessário criar tabela `songs`

## 3. Plano de Implementação

### Milestone 1: Preparação do Banco de Dados
**Critérios de Aceite:**
- [ ] Tabela `songs` criada com todas as colunas necessárias
- [ ] Índices otimizados implementados
- [ ] Políticas RLS configuradas
- [ ] Migração testada em ambiente de desenvolvimento

### Milestone 2: Modificação dos Endpoints Existentes
**Critérios de Aceite:**
- [ ] `generate-preview.ts` modificado para aceitar `userId` e `guestId`
- [ ] `check-music-status.ts` implementa salvamento automático
- [ ] Validação Zod implementada em ambos endpoints
- [ ] Testes unitários passando

### Milestone 3: Novos Endpoints
**Critérios de Aceite:**
- [ ] `GET /api/songs` implementado e testado
- [ ] `POST /api/migrate-guest-data` implementado e testado
- [ ] Rate limiting configurado
- [ ] Documentação OpenAPI gerada

### Milestone 4: Integração Frontend
**Critérios de Aceite:**
- [ ] Frontend gera e gerencia `guestId`
- [ ] Chamadas de API atualizadas
- [ ] Fluxo de migração implementado
- [ ] Testes E2E passando

## 4. Modificações Detalhadas

### 4.1 Criação da Migration

```sql
-- supabase/migrations/002_create_songs_table.sql
CREATE TABLE songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    guest_id VARCHAR(255),
    title VARCHAR(500) NOT NULL,
    lyrics TEXT,
    prompt TEXT,
    genre VARCHAR(100),
    mood VARCHAR(100),
    audio_url_option1 TEXT,
    audio_url_option2 TEXT,
    suno_task_id VARCHAR(255),
    generation_status VARCHAR(50) DEFAULT 'completed' CHECK (generation_status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT check_user_or_guest CHECK (
        (user_id IS NOT NULL AND guest_id IS NULL) OR 
        (user_id IS NULL AND guest_id IS NOT NULL)
    )
);

-- Índices para performance
CREATE INDEX idx_songs_user_id ON songs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_songs_guest_id ON songs(guest_id) WHERE guest_id IS NOT NULL;
CREATE INDEX idx_songs_created_at ON songs(created_at DESC);
CREATE INDEX idx_songs_suno_task_id ON songs(suno_task_id) WHERE suno_task_id IS NOT NULL;

-- RLS Policies
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own songs" ON songs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own songs" ON songs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy para service_role (backend operations)
CREATE POLICY "Service role full access" ON songs
    FOR ALL TO service_role USING (true);
```

### 4.2 Schemas Zod

```typescript
// src/lib/schemas/song.ts
import { z } from 'zod';

export const SongSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().nullable(),
  guestId: z.string().nullable(),
  title: z.string().min(1).max(500),
  lyrics: z.string().nullable(),
  prompt: z.string().nullable(),
  genre: z.string().nullable(),
  mood: z.string().nullable(),
  audioUrlOption1: z.string().url().nullable(),
  audioUrlOption2: z.string().url().nullable(),
  sunoTaskId: z.string().nullable(),
  generationStatus: z.enum(['pending', 'processing', 'completed', 'failed']),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
});

export const CreateSongRequestSchema = z.object({
  userId: z.string().uuid().optional(),
  guestId: z.string().min(1).optional(),
  title: z.string().min(1).max(500),
  lyrics: z.string().optional(),
  prompt: z.string().optional(),
  genre: z.string().optional(),
  mood: z.string().optional(),
  sunoTaskId: z.string().optional()
}).refine(
  (data) => data.userId || data.guestId,
  { 
    message: "Either userId or guestId must be provided",
    path: ["userId", "guestId"]
  }
);

export const ListSongsQuerySchema = z.object({
  guestId: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  sortBy: z.enum(['created_at', 'title']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const MigrateGuestDataSchema = z.object({
  guestId: z.string().min(1, "Guest ID is required")
});

export const CheckStatusQuerySchema = z.object({
  taskId: z.string().min(1, "Task ID is required"),
  userId: z.string().uuid().optional(),
  guestId: z.string().optional()
}).refine(
  (data) => data.userId || data.guestId,
  { 
    message: "Either userId or guestId must be provided",
    path: ["userId", "guestId"]
  }
);

export type Song = z.infer<typeof SongSchema>;
export type CreateSongRequest = z.infer<typeof CreateSongRequestSchema>;
export type ListSongsQuery = z.infer<typeof ListSongsQuerySchema>;
export type MigrateGuestData = z.infer<typeof MigrateGuestDataSchema>;
export type CheckStatusQuery = z.infer<typeof CheckStatusQuerySchema>;
```

### 4.3 Serviço de Banco de Dados

```typescript
// src/lib/services/songService.ts
import { createClient } from '@supabase/supabase-js';
import { Song, CreateSongRequest } from '@/lib/schemas/song';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role para bypass RLS
);

export class SongService {
  static async createSong(songData: CreateSongRequest): Promise<Song> {
    const { data, error } = await supabase
      .from('songs')
      .insert({
        user_id: songData.userId || null,
        guest_id: songData.guestId || null,
        title: songData.title,
        lyrics: songData.lyrics || null,
        prompt: songData.prompt || null,
        genre: songData.genre || null,
        mood: songData.mood || null,
        audio_url_option1: songData.audioUrlOption1 || null,
        audio_url_option2: songData.audioUrlOption2 || null,
        suno_task_id: songData.sunoTaskId || null,
        generation_status: 'completed'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create song: ${error.message}`);
    }

    return this.mapDbToSong(data);
  }

  static async getSongsByUser(userId: string, limit = 20, offset = 0): Promise<Song[]> {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch user songs: ${error.message}`);
    }

    return (data || []).map(this.mapDbToSong);
  }

  static async getSongsByGuest(guestId: string, limit = 20, offset = 0): Promise<Song[]> {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('guest_id', guestId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch guest songs: ${error.message}`);
    }

    return (data || []).map(this.mapDbToSong);
  }

  static async migrateGuestSongs(guestId: string, userId: string): Promise<number> {
    // Primeiro, verificar quantas músicas existem
    const { data: existingSongs, error: countError } = await supabase
      .from('songs')
      .select('id')
      .eq('guest_id', guestId)
      .is('user_id', null);

    if (countError) {
      throw new Error(`Failed to count guest songs: ${countError.message}`);
    }

    if (!existingSongs || existingSongs.length === 0) {
      return 0;
    }

    // Migrar as músicas
    const { error: updateError } = await supabase
      .from('songs')
      .update({
        user_id: userId,
        guest_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('guest_id', guestId)
      .is('user_id', null);

    if (updateError) {
      throw new Error(`Failed to migrate songs: ${updateError.message}`);
    }

    return existingSongs.length;
  }

  static async getSongByTaskId(taskId: string): Promise<Song | null> {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('suno_task_id', taskId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null;
      }
      throw new Error(`Failed to fetch song by task ID: ${error.message}`);
    }

    return this.mapDbToSong(data);
  }

  private static mapDbToSong(dbRow: any): Song {
    return {
      id: dbRow.id,
      userId: dbRow.user_id,
      guestId: dbRow.guest_id,
      title: dbRow.title,
      lyrics: dbRow.lyrics,
      prompt: dbRow.prompt,
      genre: dbRow.genre,
      mood: dbRow.mood,
      audioUrlOption1: dbRow.audio_url_option1,
      audioUrlOption2: dbRow.audio_url_option2,
      sunoTaskId: dbRow.suno_task_id,
      generationStatus: dbRow.generation_status,
      createdAt: new Date(dbRow.created_at),
      updatedAt: new Date(dbRow.updated_at)
    };
  }
}
```

### 4.4 Modificação do check-music-status.ts

```typescript
// api/check-music-status.ts (versão modificada)
import { NextRequest, NextResponse } from 'next/server';
import { CheckStatusQuerySchema } from '@/lib/schemas/song';
import { SongService } from '@/lib/services/songService';

// Armazenamento global existente (manter)
const musicTasks: Record<string, any> = {};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validar parâmetros
    const queryParams = CheckStatusQuerySchema.parse({
      taskId: searchParams.get('taskId'),
      userId: searchParams.get('userId'),
      guestId: searchParams.get('guestId')
    });

    const { taskId, userId, guestId } = queryParams;

    // Verificar se já existe no banco (evitar duplicação)
    const existingSong = await SongService.getSongByTaskId(taskId);
    if (existingSong) {
      return NextResponse.json({
        status: 'COMPLETO',
        clips: [
          {
            audio_url: existingSong.audioUrlOption1,
            title: existingSong.title,
            lyrics: existingSong.lyrics
          },
          existingSong.audioUrlOption2 ? {
            audio_url: existingSong.audioUrlOption2,
            title: existingSong.title,
            lyrics: existingSong.lyrics
          } : null
        ].filter(Boolean),
        message: 'Música já foi salva anteriormente',
        songId: existingSong.id
      });
    }

    // Lógica existente de verificação na Suno API
    const taskInfo = musicTasks[taskId];
    if (!taskInfo) {
      return NextResponse.json(
        { error: 'Tarefa não encontrada' },
        { status: 404 }
      );
    }

    // Verificar status na API da Suno
    const sunoResponse = await fetch(`https://api.suno.ai/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.SUNO_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (!sunoResponse.ok) {
      throw new Error(`Suno API error: ${sunoResponse.status}`);
    }

    const taskData = await sunoResponse.json();
    const elapsedTime = Date.now() - taskInfo.startTime;

    // Se completado com sucesso, salvar automaticamente
    if (taskData.status === 'completed' && taskData.clips?.length > 0) {
      try {
        const clips = taskData.clips;
        const primaryClip = clips[0];
        
        const savedSong = await SongService.createSong({
          userId,
          guestId,
          title: primaryClip.title || taskInfo.originalPrompt?.substring(0, 100) || 'Música Gerada',
          lyrics: primaryClip.lyrics,
          prompt: taskInfo.originalPrompt,
          genre: taskInfo.genre,
          mood: taskInfo.mood,
          audioUrlOption1: clips[0]?.audio_url,
          audioUrlOption2: clips[1]?.audio_url,
          sunoTaskId: taskId
        });

        // Limpar da memória após salvar
        delete musicTasks[taskId];

        return NextResponse.json({
          status: 'COMPLETO',
          clips: taskData.clips,
          message: 'Música gerada e salva com sucesso!',
          songId: savedSong.id,
          elapsedTime
        });
      } catch (saveError) {
        console.error('Erro ao salvar música:', saveError);
        // Retornar sucesso mesmo se o salvamento falhar
        return NextResponse.json({
          status: 'COMPLETO',
          clips: taskData.clips,
          message: 'Música gerada com sucesso (erro no salvamento)',
          elapsedTime,
          saveError: true
        });
      }
    }

    // Status ainda em processamento
    const statusMap = {
      'pending': 'PROCESSANDO',
      'processing': 'PROCESSANDO', 
      'completed': 'COMPLETO',
      'failed': 'FALHOU'
    };

    const messageMap = {
      'PROCESSANDO': 'Sua música está sendo gerada... Isso pode levar alguns minutos.',
      'COMPLETO': 'Música gerada com sucesso!',
      'FALHOU': 'Falha na geração. Tente novamente.'
    };

    const mappedStatus = statusMap[taskData.status] || 'PROCESSANDO';

    return NextResponse.json({
      status: mappedStatus,
      clips: taskData.clips || [],
      message: messageMap[mappedStatus],
      elapsedTime,
      progress: taskData.progress || 0
    });

  } catch (error) {
    console.error('Erro ao verificar status da música:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
```

### 4.5 Novo Endpoint: GET /api/songs

```typescript
// app/api/songs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ListSongsQuerySchema } from '@/lib/schemas/song';
import { SongService } from '@/lib/services/songService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session = await getServerSession(authOptions);
    
    // Validar parâmetros de query
    const queryParams = ListSongsQuerySchema.parse({
      guestId: searchParams.get('guestId'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder')
    });

    let songs;
    let userType: 'authenticated' | 'guest';

    // Determinar se é usuário autenticado ou convidado
    if (session?.user?.id) {
      songs = await SongService.getSongsByUser(
        session.user.id,
        queryParams.limit,
        queryParams.offset
      );
      userType = 'authenticated';
    } else if (queryParams.guestId) {
      songs = await SongService.getSongsByGuest(
        queryParams.guestId,
        queryParams.limit,
        queryParams.offset
      );
      userType = 'guest';
    } else {
      return NextResponse.json(
        { 
          error: 'Acesso negado',
          message: 'Usuário não autenticado ou guestId não fornecido'
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      songs,
      pagination: {
        limit: queryParams.limit,
        offset: queryParams.offset,
        total: songs.length,
        hasMore: songs.length === queryParams.limit
      },
      userType,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao listar músicas:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
```

### 4.6 Novo Endpoint: POST /api/migrate-guest-data

```typescript
// app/api/migrate-guest-data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MigrateGuestDataSchema } from '@/lib/schemas/song';
import { SongService } from '@/lib/services/songService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rateLimit } from '@/lib/middleware/rateLimit';

// Rate limiting: máximo 3 migrações por hora por usuário
const migrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3,
  keyGenerator: (req) => {
    // Usar user ID como chave para rate limiting
    return req.headers.get('x-user-id') || req.ip;
  }
});

export async function POST(request: NextRequest) {
  try {
    // Aplicar rate limiting
    const rateLimitResult = await migrationLimiter(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Limite de migrações excedido',
          message: 'Tente novamente em 1 hora',
          retryAfter: rateLimitResult.retryAfter
        },
        { status: 429 }
      );
    }

    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          error: 'Não autorizado',
          message: 'Usuário deve estar autenticado para migrar dados'
        },
        { status: 401 }
      );
    }

    // Validar corpo da requisição
    const body = await request.json();
    const { guestId } = MigrateGuestDataSchema.parse(body);

    // Executar migração
    const migratedCount = await SongService.migrateGuestSongs(
      guestId,
      session.user.id
    );

    // Log da operação
    console.log('Migração concluída:', {
      userId: session.user.id,
      guestId,
      migratedCount,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: migratedCount > 0 
        ? `${migratedCount} música(s) migrada(s) com sucesso`
        : 'Nenhuma música encontrada para migrar',
      migratedCount,
      userId: session.user.id
    });

  } catch (error) {
    console.error('Erro na migração de dados:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: 'Falha ao migrar dados do convidado',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
```

## 5. Modificações no Frontend

### 5.1 Geração e Gerenciamento de GuestId

```typescript
// src/lib/utils/guestId.ts
import { v4 as uuidv4 } from 'uuid';

const GUEST_ID_KEY = 'memora_guest_id';

export class GuestIdManager {
  static getOrCreateGuestId(): string {
    if (typeof window === 'undefined') {
      // Server-side: gerar ID temporário
      return `temp_${uuidv4()}`;
    }

    let guestId = localStorage.getItem(GUEST_ID_KEY);
    
    if (!guestId) {
      guestId = `guest_${uuidv4()}`;
      localStorage.setItem(GUEST_ID_KEY, guestId);
    }
    
    return guestId;
  }

  static clearGuestId(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(GUEST_ID_KEY);
    }
  }

  static hasGuestId(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem(GUEST_ID_KEY);
  }

  static getCurrentGuestId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(GUEST_ID_KEY);
  }
}
```

### 5.2 Hook para Migração Automática

```typescript
// src/hooks/useAutoMigration.ts
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { GuestIdManager } from '@/lib/utils/guestId';

export function useAutoMigration() {
  const { user, isLoggedIn } = useAuthStore();

  useEffect(() => {
    async function handleMigration() {
      // Só executar se usuário acabou de fazer login e existe guestId
      if (isLoggedIn && user && GuestIdManager.hasGuestId()) {
        const guestId = GuestIdManager.getCurrentGuestId();
        
        if (guestId) {
          try {
            const response = await fetch('/api/migrate-guest-data', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ guestId })
            });

            if (response.ok) {
              const result = await response.json();
              console.log('Migração concluída:', result);
              
              // Limpar guestId após migração bem-sucedida
              GuestIdManager.clearGuestId();
              
              // Opcional: mostrar notificação ao usuário
              if (result.migratedCount > 0) {
                // toast.success(`${result.migratedCount} música(s) migrada(s) para sua conta!`);
              }
            } else {
              console.warn('Falha na migração:', await response.text());
            }
          } catch (error) {
            console.error('Erro na migração automática:', error);
          }
        }
      }
    }

    handleMigration();
  }, [isLoggedIn, user]);
}
```

## 6. Testes

### 6.1 Teste do Serviço de Songs

```typescript
// __tests__/services/songService.test.ts
import { SongService } from '@/lib/services/songService';
import { createClient } from '@supabase/supabase-js';

// Mock do Supabase
jest.mock('@supabase/supabase-js');
const mockSupabase = createClient as jest.MockedFunction<typeof createClient>;

describe('SongService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSong', () => {
    it('deve criar uma música para usuário autenticado', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'song-123',
              user_id: 'user-123',
              guest_id: null,
              title: 'Test Song',
              created_at: new Date().toISOString()
            },
            error: null
          })
        })
      });

      mockSupabase.mockReturnValue({
        from: jest.fn().mockReturnValue({
          insert: mockInsert
        })
      } as any);

      const result = await SongService.createSong({
        userId: 'user-123',
        title: 'Test Song'
      });

      expect(result.id).toBe('song-123');
      expect(result.userId).toBe('user-123');
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'user-123',
        guest_id: null,
        title: 'Test Song',
        lyrics: null,
        prompt: null,
        genre: null,
        mood: null,
        audio_url_option1: null,
        audio_url_option2: null,
        suno_task_id: null,
        generation_status: 'completed'
      });
    });
  });

  describe('migrateGuestSongs', () => {
    it('deve migrar músicas de convidado para usuário', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [{ id: 'song-1' }, { id: 'song-2' }],
        error: null
      });

      const mockUpdate = jest.fn().mockResolvedValue({
        error: null
      });

      mockSupabase.mockReturnValue({
        from: jest.fn().mockReturnValue({
          select: mockSelect,
          update: mockUpdate,
          eq: jest.fn().mockReturnThis(),
          is: jest.fn().mockReturnThis()
        })
      } as any);

      const result = await SongService.migrateGuestSongs('guest-123', 'user-123');

      expect(result).toBe(2);
      expect(mockUpdate).toHaveBeenCalledWith({
        user_id: 'user-123',
        guest_id: null,
        updated_at: expect.any(String)
      });
    });
  });
});
```

## 7. Comandos de Execução

```bash
# Instalar dependências
pnpm install uuid @types/uuid

# Aplicar migração
npx supabase db push

# Executar testes
pnpm test

# Executar testes específicos
pnpm test songService

# Verificar tipos
pnpm typecheck

# Executar em desenvolvimento
pnpm dev
```

## 8. Checklist de Validação

### Banco de Dados
- [ ] Tabela `songs` criada com sucesso
- [ ] Índices funcionando (verificar com EXPLAIN)
- [ ] Políticas RLS ativas e funcionais
- [ ] Constraint check_user_or_guest funcionando

### Endpoints
- [ ] `check-music-status` salva automaticamente
- [ ] `GET /api/songs` retorna músicas corretas
- [ ] `POST /api/migrate-guest-data` funciona
- [ ] Rate limiting ativo
- [ ] Validação Zod funcionando

### Frontend
- [ ] GuestId gerado e persistido
- [ ] Migração automática no login
- [ ] Chamadas de API atualizadas
- [ ] Estados de loading/error tratados

### Testes
- [ ] Testes unitários passando
- [ ] Testes de integração passando
- [ ] Cobertura > 80% nos módulos críticos

## 9. Plano de Rollback

1. **Reverter migração do banco:**
   ```sql
   DROP TABLE IF EXISTS songs;
   ```

2. **Reverter endpoints:**
   - Restaurar versão anterior de `check-music-status.ts`
   - Remover arquivos `app/api/songs/route.ts` e `app/api/migrate-guest-data/route.ts`

3. **Reverter frontend:**
   - Remover `GuestIdManager` e `useAutoMigration`
   - Restaurar chamadas de API originais

## 10. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|----------|
| Falha no salvamento automático | Alto | Retry logic + fallback manual |
| Migração duplicada | Médio | Validação de estado + idempotência |
| Performance degradada | Médio | Índices otimizados + paginação |
| Perda de dados de convidados | Alto | Backup antes da migração |

Esta implementação garante um sistema robusto e escalável para o salvamento automático de músicas com suporte completo a usuários e convidados.