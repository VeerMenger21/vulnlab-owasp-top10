import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// GET /api/health/target - Probe Juice Shop target
router.get('/target', async (req, res) => {
  try {
    const setting = db.prepare("SELECT value FROM settings WHERE key = 'target_url'").get();
    const targetUrl = setting ? setting.value : 'http://127.0.0.1:3000';

    if (!targetUrl || targetUrl.trim() === '') {
      return res.json({
        status: 'unconfigured',
        target_url: null,
        message: 'Target application URL is not configured in settings.'
      });
    }

    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3-second probe timeout

    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'VulnLab-Health-Probe/1.0'
        }
      });
      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;

      return res.json({
        status: 'connected',
        target_url: targetUrl,
        status_code: response.status,
        status_text: response.statusText,
        latency_ms: latencyMs,
        server_header: response.headers.get('server') || response.headers.get('x-powered-by') || 'Unknown',
        checked_at: new Date().toISOString(),
        message: 'Target application is reachable and responding.'
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;

      let reason = 'Connection failed: Service unreachable or refused connection.';
      if (fetchErr.name === 'AbortError') {
        reason = 'Connection timed out after 3000ms.';
      } else if (fetchErr.code === 'ECONNREFUSED' || fetchErr.message.includes('fetch failed')) {
        reason = 'Connection refused. Juice Shop Docker container may not be started on ' + targetUrl;
      }

      return res.json({
        status: 'disconnected',
        target_url: targetUrl,
        latency_ms: latencyMs,
        error_name: fetchErr.name,
        error_message: reason,
        checked_at: new Date().toISOString(),
        message: 'Target connectivity check failed. Check if Docker container is running.'
      });
    }
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Internal health checker error: ' + err.message
    });
  }
});

// GET /api/health/system - System environment check
router.get('/system', (req, res) => {
  try {
    const findingsCount = db.prepare('SELECT COUNT(*) as count FROM findings').get().count;
    res.json({
      portal_status: 'online',
      node_version: process.version,
      platform: process.platform,
      database: 'SQLite (better-sqlite3) WAL mode',
      findings_loaded: findingsCount,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: 'System health check failed: ' + err.message });
  }
});

export default router;
