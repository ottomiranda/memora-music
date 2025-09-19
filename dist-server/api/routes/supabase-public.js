import { Router } from 'express';
const router = Router();
// Expose Supabase public config (safe to share anon key)
router.get('/public-config', (req, res) => {
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
        res.status(500).json({ success: false, message: 'Supabase public config missing' });
        return;
    }
    res.status(200).json({ success: true, url, anonKey });
});
export default router;
//# sourceMappingURL=supabase-public.js.map