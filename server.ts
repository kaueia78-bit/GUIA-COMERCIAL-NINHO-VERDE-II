import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import {
  getActiveCategories,
  getAllCategories,
  getApprovedBusinesses,
  createBusinessRequest,
  getAdminBusinesses,
  updateBusinessStatus,
  updateBusiness,
  deleteBusiness,
  getAdminStats,
  saveContactMessage,
  getContactMessages,
  removeAccents,
} from './src/db/queries.ts';
import { db } from './src/db/index.ts';
import { businesses, categories, contactMessages } from './src/db/schema.ts';
import { eq, ne } from 'drizzle-orm';
import { requireAdmin, AuthRequest } from './src/middleware/auth.ts';
import { adminAuth } from './src/lib/firebase-admin.ts';
import { getOrCreateUser } from './src/db/users.ts';
import { SITE_CONFIG } from './src/config/site.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Prevent browser/proxy/CDN caching on all API endpoints so updates appear immediately for everyone
  app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  });

  // Real-time Server-Sent Events (SSE) clients to push live catalog/category updates to all devices
  const sseClients = new Set<Response>();
  const broadcastUpdate = (type: 'businesses' | 'categories' | 'messages' | 'all') => {
    const payload = `data: ${JSON.stringify({ type, ts: Date.now() })}\n\n`;
    for (const client of sseClients) {
      try {
        client.write(payload);
      } catch {
        sseClients.delete(client);
      }
    }
  };

  app.get('/api/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    res.write(`data: ${JSON.stringify({ type: 'connected', ts: Date.now() })}\n\n`);
    sseClients.add(res);

    const heartbeat = setInterval(() => {
      try {
        res.write(': heartbeat\n\n');
      } catch {
        clearInterval(heartbeat);
        sseClients.delete(res);
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(heartbeat);
      sseClients.delete(res);
    });
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Guia Comercial Ninho Verde II' });
  });

  // 1. Categorias públicas ativas
  app.get('/api/categories', async (req, res) => {
    try {
      const data = await getActiveCategories();
      res.json(data);
    } catch (error: any) {
      console.error('Error in /api/categories:', error);
      res.status(500).json({ error: error.message || 'Erro ao carregar categorias' });
    }
  });

  // 2. Negócios aprovados (com pesquisa em tempo real e filtro por categoria/subcategoria)
  app.get('/api/businesses', async (req, res) => {
    try {
      const { search, category, subcategory } = req.query;
      const data = await getApprovedBusinesses(
        search ? String(search) : undefined,
        category ? String(category) : undefined,
        subcategory ? String(subcategory) : undefined
      );
      res.json(data);
    } catch (error: any) {
      console.error('Error in /api/businesses:', error);
      res.status(500).json({ error: error.message || 'Erro ao buscar negócios' });
    }
  });

  // 3. Morador solicita cadastro do seu negócio (Status sempre PENDENTE de aprovação)
  app.post('/api/businesses/request', async (req, res) => {
    try {
      const {
        ownerName,
        name,
        categoryId,
        categoryName,
        subcategory,
        customNiche,
        description,
        whatsapp,
        keywords,
      } = req.body;

      if (!ownerName || !name || !categoryId || !description || !whatsapp) {
        return res.status(400).json({
          error: 'Todos os campos são obrigatórios: Responsável, Nome do negócio, Categoria, Descrição e WhatsApp.',
        });
      }

      // Look up category record so categoryName & description always sync cleanly
      const [catRow] = await db
        .select()
        .from(categories)
        .where(eq(categories.id, Number(categoryId)))
        .limit(1);

      const resolvedCategoryName = catRow?.name || categoryName || 'Geral';
      const resolvedSubcategory = customNiche?.trim() || subcategory?.trim() || null;

      // Build comprehensive search keywords from category, subcategory/niche, and category description
      const keywordParts = [
        resolvedCategoryName,
        resolvedSubcategory,
        catRow?.description,
        keywords?.trim(),
      ].filter(Boolean);
      const combinedKeywords = Array.from(new Set(keywordParts)).join(', ');

      // Check optional token if user is signed in
      let ownerUid: string | undefined = undefined;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.split('Bearer ')[1];
          const decoded = await adminAuth.verifyIdToken(token);
          ownerUid = decoded.uid;
        } catch (e) {
          // Token invalid or guest submission, proceed with unlinked owner
        }
      }

      const created = await createBusinessRequest({
        ownerUid,
        ownerName,
        name,
        categoryId: Number(categoryId),
        categoryName: resolvedCategoryName,
        subcategory: resolvedSubcategory,
        description,
        whatsapp,
        keywords: combinedKeywords,
      });

      // Construct WhatsApp notification link to the support number (55 11 988615298)
      const categoryLabel = created.subcategory
        ? `${created.categoryName} • ${created.subcategory}`
        : created.categoryName;
      const adminWaText = `Olá! Nova solicitação de cadastro no Guia Comercial Ninho Verde II:\n\n*Nome do Negócio:* ${created.name}\n*Responsável:* ${created.ownerName}\n*Categoria:* ${categoryLabel}\n*WhatsApp:* ${created.whatsapp}\n*Descrição:* ${created.description}\n\nFavor analisar para aprovação no catálogo. Obrigado!`;
      const notifyAdminUrl = `https://wa.me/${SITE_CONFIG.supportPhone}?text=${encodeURIComponent(adminWaText)}`;

      broadcastUpdate('businesses');

      res.status(201).json({
        message: 'Solicitação registrada com sucesso! Seu cadastro passará por análise da administração antes de ser publicado.',
        data: created,
        notifyAdminUrl,
        supportPhone: SITE_CONFIG.supportPhoneDisplay,
      });
    } catch (error: any) {
      console.error('Error in /api/businesses/request:', error);
      res.status(500).json({ error: error.message || 'Falha ao registrar solicitação' });
    }
  });

  // 4. Mensagem de contato institucional
  app.post('/api/contact', async (req, res) => {
    try {
      const { name, email, phone, subject, message } = req.body;
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: 'Por favor, preencha todos os campos obrigatórios.' });
      }

      const created = await saveContactMessage({ name, email, phone, subject, message });
      broadcastUpdate('messages');
      res.status(201).json({
        message: 'Mensagem enviada com sucesso! A equipe de apoio responderá em breve.',
        data: created,
      });
    } catch (error: any) {
      console.error('Error in /api/contact:', error);
      res.status(500).json({ error: error.message || 'Erro ao registrar mensagem' });
    }
  });

  // 5. Perfil e papel do usuário logado
  // 5. Perfil e papel do usuário logado
  app.get('/api/auth/me', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.json({ user: null, role: 'guest' });
    }

    const token = authHeader.split('Bearer ')[1];

    // Check admin password token
    if (token === SITE_CONFIG.adminPassword || token.startsWith('admin_session_Kd523107')) {
      return res.json({
        user: {
          uid: 'admin_local',
          email: SITE_CONFIG.adminEmail,
          name: 'Administrador Ninho Verde II',
        },
        role: 'admin',
      });
    }

    try {
      const decoded = await adminAuth.verifyIdToken(token);
      const dbUser = await getOrCreateUser(decoded.uid, decoded.email || '', decoded.name);

      res.json({
        user: {
          uid: decoded.uid,
          email: decoded.email,
          name: decoded.name || dbUser.name,
          picture: decoded.picture,
        },
        role: dbUser.role,
      });
    } catch (error) {
      res.json({ user: null, role: 'guest' });
    }
  });

  // 6. Login administrativo direto por senha
  app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Por favor, informe a senha de acesso.' });
    }

    if (password.trim() === SITE_CONFIG.adminPassword) {
      const sessionToken = `admin_session_Kd523107_${Date.now()}`;
      return res.json({
        success: true,
        token: sessionToken,
        role: 'admin',
        user: {
          uid: 'admin_local',
          email: SITE_CONFIG.adminEmail,
          name: 'Administrador Ninho Verde II',
        },
      });
    }

    return res.status(401).json({ error: 'Senha incorreta. Verifique a senha de administrador.' });
  });

  // ================= ADMIN ROUTES (requireAdmin) ================= //

  app.get('/api/admin/stats', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const stats = await getAdminStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/admin/businesses', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const statusFilter = req.query.status as string;
      const list = await getAdminBusinesses(statusFilter);
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/admin/businesses/:id/status', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      const { status, rejectionReason } = req.body;
      const reviewer = req.user?.email || 'Administrador';

      if (!['approved', 'rejected', 'suspended', 'pending'].includes(status)) {
        return res.status(400).json({ error: 'Status inválido' });
      }

      const updated = await updateBusinessStatus(id, status, reviewer, rejectionReason);
      broadcastUpdate('businesses');
      res.json({ message: 'Status atualizado com sucesso', data: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/admin/businesses/:id', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID de negócio inválido' });
      }

      const {
        name,
        ownerName,
        categoryId,
        categoryName,
        subcategory,
        description,
        whatsapp,
        keywords,
        status,
      } = req.body;

      const updatePayload: Partial<typeof businesses.$inferInsert> = {};
      if (typeof name === 'string' && name.trim()) updatePayload.name = name.trim();
      if (typeof ownerName === 'string' && ownerName.trim()) updatePayload.ownerName = ownerName.trim();
      if (typeof description === 'string' && description.trim()) updatePayload.description = description.trim();
      if (typeof whatsapp === 'string' && whatsapp.trim()) {
        updatePayload.whatsapp = whatsapp.replace(/\D/g, '');
      }
      if (subcategory !== undefined) {
        updatePayload.subcategory = typeof subcategory === 'string' && subcategory.trim() ? subcategory.trim() : null;
      }
      if (typeof keywords === 'string') updatePayload.keywords = keywords.trim();
      if (status && ['approved', 'rejected', 'suspended', 'pending'].includes(status)) {
        updatePayload.status = status;
      }

      if (categoryId !== undefined && !isNaN(Number(categoryId))) {
        const [catRow] = await db
          .select()
          .from(categories)
          .where(eq(categories.id, Number(categoryId)))
          .limit(1);
        if (catRow) {
          updatePayload.categoryId = catRow.id;
          updatePayload.categoryName = catRow.name;
        }
      } else if (typeof categoryName === 'string' && categoryName.trim()) {
        updatePayload.categoryName = categoryName.trim();
      }

      const updated = await updateBusiness(id, updatePayload);
      if (!updated) {
        return res.status(404).json({ error: 'Negócio não encontrado' });
      }

      broadcastUpdate('businesses');
      res.json({ message: 'Dados atualizados com sucesso', data: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/admin/businesses/:id', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      const deleted = await deleteBusiness(id);
      broadcastUpdate('businesses');
      res.json({ message: 'Negócio removido com sucesso', data: deleted });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Categories CRUD
  app.get('/api/admin/categories', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const list = await getAllCategories();
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const sanitizeSlug = (input: string) =>
    removeAccents(input)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `categoria-${Date.now()}`;

  app.post('/api/admin/categories', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { name, slug, description, icon, subcategories, active, sortOrder } = req.body;
      if (!name || !String(name).trim()) {
        return res.status(400).json({ error: 'O nome da categoria é obrigatório' });
      }

      const cleanSlug = sanitizeSlug(slug && String(slug).trim() ? String(slug) : String(name));

      const existing = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, cleanSlug))
        .limit(1);
      if (existing.length > 0) {
        return res.status(400).json({ error: 'Já existe uma categoria com esse identificador (slug).' });
      }

      const parsedSubcategories = Array.isArray(subcategories)
        ? subcategories.map((s: string) => s.trim()).filter(Boolean)
        : typeof subcategories === 'string'
        ? subcategories.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const [created] = await db.insert(categories)
        .values({
          name: String(name).trim(),
          slug: cleanSlug,
          description: description?.trim() || null,
          icon: icon || 'Store',
          subcategories: parsedSubcategories,
          active: active ?? true,
          sortOrder: Number(sortOrder) || 0,
        })
        .returning();

      broadcastUpdate('categories');
      res.status(201).json({ message: 'Categoria criada com sucesso', data: created });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/admin/categories/:id', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      const { name, slug, description, icon, subcategories, active, sortOrder } = req.body;

      const parsedSubcategories = Array.isArray(subcategories)
        ? subcategories.map((s: string) => s.trim()).filter(Boolean)
        : typeof subcategories === 'string'
        ? subcategories.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined;

      const cleanName = typeof name === 'string' && name.trim() ? name.trim() : undefined;
      const cleanSlug = typeof slug === 'string' && slug.trim() ? sanitizeSlug(slug) : undefined;

      const [updated] = await db.update(categories)
        .set({
          ...(cleanName ? { name: cleanName } : {}),
          ...(cleanSlug ? { slug: cleanSlug } : {}),
          ...(description !== undefined ? { description: description?.trim() || null } : {}),
          ...(icon ? { icon } : {}),
          ...(parsedSubcategories !== undefined ? { subcategories: parsedSubcategories } : {}),
          ...(active !== undefined ? { active: Boolean(active) } : {}),
          ...(sortOrder !== undefined ? { sortOrder: Number(sortOrder) } : {}),
        })
        .where(eq(categories.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: 'Categoria não encontrada' });
      }

      // Keep businesses.categoryName synchronized if the category was renamed
      if (cleanName) {
        await db
          .update(businesses)
          .set({ categoryName: cleanName, updatedAt: new Date() })
          .where(eq(businesses.categoryId, id));
      }

      broadcastUpdate('all');
      res.json({ message: 'Categoria atualizada', data: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/admin/categories/:id', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      const remaining = await db
        .select()
        .from(categories)
        .where(ne(categories.id, id));

      if (remaining.length === 0) {
        return res.status(400).json({ error: 'Não é possível excluir a única categoria do catálogo.' });
      }

      const fallback =
        remaining.find((c) => c.slug === 'outros-servicos') ||
        remaining.find((c) => c.active) ||
        remaining[0];

      // Reassign any businesses using this category before deleting to avoid FK errors
      await db
        .update(businesses)
        .set({
          categoryId: fallback.id,
          categoryName: fallback.name,
          updatedAt: new Date(),
        })
        .where(eq(businesses.categoryId, id));

      const [deleted] = await db.delete(categories).where(eq(categories.id, id)).returning();
      broadcastUpdate('all');
      res.json({ message: 'Categoria excluída', data: deleted });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Messages
  app.get('/api/admin/messages', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const messages = await getContactMessages();
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/admin/messages/:id/status', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      const { status } = req.body;
      const [updated] = await db.update(contactMessages)
        .set({ status })
        .where(eq(contactMessages.id, id))
        .returning();
      broadcastUpdate('messages');
      res.json({ message: 'Mensagem atualizada', data: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Unknown API routes return clean JSON 404 instead of SPA HTML
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: 'Rota da API não encontrada' });
  });

  const httpServer = http.createServer(app);

  // VITE INTEGRATION FOR DEV & STATIC SERVE FOR PROD
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use('/assets', express.static(path.join(distPath, 'assets'), {
      maxAge: '1y',
      immutable: true,
    }));
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        }
      },
    }));
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const hmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: hmrDisabled ? false : { server: httpServer },
        ...(hmrDisabled ? { ws: false as const } : {}),
      },
      appType: 'spa',
    });

    // Ensure /@vite/client never throws unhandled WebSocket rejections in proxied/disabled-HMR previews
    app.get('/@vite/client', async (req, res, next) => {
      try {
        const result = await vite.transformRequest('/@vite/client');
        if (!result?.code) return next();

        const connectCall = 'transport.connect(createHMRHandler(handleMessage));';
        let safeCode = hmrDisabled
          ? result.code.replace(connectCall, '/* HMR WebSocket disabled */')
          : result.code.replace(
              connectCall,
              'Promise.resolve(transport.connect(createHMRHandler(handleMessage))).catch(() => {});'
            );

        safeCode = safeCode.replaceAll(
          'console.error(`[vite] failed to connect to websocket',
          'console.debug(`[vite] websocket unavailable'
        );

        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Cache-Control', 'no-store');
        res.send(safeCode);
      } catch {
        next();
      }
    });

    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Guia Comercial Ninho Verde II rodando na porta ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Falha crítica ao iniciar servidor:', err);
});
