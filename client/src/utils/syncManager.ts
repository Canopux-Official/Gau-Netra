import localforage from 'localforage';
import { registerCowAPI } from '../apis/apis';
import { queryClient } from '../queryClient';

// Initialize stores
export const pendingCowsStore = localforage.createInstance({
    name: 'GauNetra',
    storeName: 'pendingCows'
});

export const syncManager = {
    // Save a cow locally when offline
    savePendingCow: async (cowData: any) => {
        try {
            const id = Date.now().toString();
            await pendingCowsStore.setItem(id, { ...cowData, id, syncStatus: 'pending' });
            return id;
        } catch (err) {
            console.error('Error saving pending cow:', err);
            throw err;
        }
    },

    // Get all pending cows
    getPendingCows: async () => {
        try {
            const cows: any[] = [];
            await pendingCowsStore.iterate((value: any) => {
                cows.push(value);
            });
            return cows;
        } catch (err) {
            console.error('Error getting pending cows:', err);
            return [];
        }
    },

    // Remove a synced cow
    removePendingCow: async (id: string) => {
        try {
            await pendingCowsStore.removeItem(id);
        } catch (err) {
            console.error(`Error removing pending cow ${id}:`, err);
        }
    },

    // Upload all pending data when back online (stub function)
    syncAll: async () => {
        if (!navigator.onLine) return { success: false, syncedCount: 0 };

        try {
            const pendingCows = await syncManager.getPendingCows();
            if (pendingCows.length === 0) return { success: true, syncedCount: 0 };

            console.log(`Starting sync for ${pendingCows.length} cows...`);
            let syncedCount = 0;

            for (const cow of pendingCows) {
                try {
                    // Send to backend API
                    await registerCowAPI(cow);
                    // Remove from pending store if successful
                    await syncManager.removePendingCow(cow.id);
                    syncedCount++;
                } catch (apiErr: any) {
                    console.error(`Failed to sync cow ${cow.id}:`, apiErr);

                    // If it is a validation error from server (4xx), flag it as failed so user can fix it
                    if (apiErr.responseStatus && apiErr.responseStatus >= 400 && apiErr.responseStatus < 500) {
                        try {
                            await pendingCowsStore.setItem(cow.id, {
                                ...cow,
                                syncStatus: 'failed',
                                errorMessage: apiErr.message || 'Validation error from server',
                            });
                        } catch (updateErr) {
                            console.error('Failed to update pending cow status:', updateErr);
                        }
                    }
                }
            }

            console.log(`Successfully synced ${syncedCount} cows.`);

            if (syncedCount > 0) {
                // Invalidate the 'cows' query so the UI automatically fetches the latest herd list
                queryClient.invalidateQueries({ queryKey: ['cows'] });
            }

            return { success: true, syncedCount };

        } catch (err) {
            console.error('Sync failed:', err);
            return { success: false, syncedCount: 0 };
        }
    }
};
