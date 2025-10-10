import { z } from 'zod';
import { API_BASE_URL } from '../config/api';

export const MigrationStatusSchema = z.object({
  success: z.boolean(),
  migrationId: z.string(),
  completedAt: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed']),
});

export const MigrationResultSchema = z.object({
  success: z.boolean(),
  migrationId: z.string(),
  completedAt: z.string().optional(),
  data: z.object({
    migratedCount: z.number(),
  }).optional(),
});

export type MigrationStatus = z.infer<typeof MigrationStatusSchema>;
export type MigrationResult = z.infer<typeof MigrationResultSchema>;

export interface MigrationApi {
  checkStatus: (migrationId: string) => Promise<MigrationStatus>;
  runMigration: (data: { type: string }) => Promise<MigrationResult>;
  migrateGuestData: (guestId: string) => Promise<MigrationResult>;
}

export const migrationApi: MigrationApi = {
  checkStatus: async (migrationId: string): Promise<MigrationStatus> => {
    const response = await fetch(`${API_BASE_URL}/migrations/${migrationId}/status`);
    if (!response.ok) {
      throw new Error(`Failed to check migration status: ${response.statusText}`);
    }
    const data = await response.json();
    return MigrationStatusSchema.parse(data);
  },

  runMigration: async (data: { type: string }): Promise<MigrationResult> => {
    const response = await fetch(`${API_BASE_URL}/migrations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Failed to run migration: ${response.statusText}`);
    }
    const responseData = await response.json();
    return MigrationResultSchema.parse(responseData);
  },

  migrateGuestData: async (guestId: string): Promise<MigrationResult> => {
    try {
      const response = await fetch(`${API_BASE_URL}/migrations/guest-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ guestId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to migrate guest data: ${response.statusText}`);
      }

      const data = await response.json();
      return MigrationResultSchema.parse({
        success: true,
        migrationId: data.migrationId,
        completedAt: data.completedAt,
        data: {
          migratedCount: data.migratedCount || 0,
        },
      });
    } catch (error) {
      console.error('Error migrating guest data:', error);
      throw error;
    }
  },
};