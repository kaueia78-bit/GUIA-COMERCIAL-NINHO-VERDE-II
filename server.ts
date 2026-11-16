import express, { Request, Response } from 'express';
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
} from './src/db/queries.ts';
import { db } from './src/db/index.ts';
import { categories, contactMessages } from './src/db/schema.ts';
import { eq } from 'drizzle-orm';
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
      res.json({ message: 'Status atualizado com sucesso', data: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/admin/businesses/:id', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      const updated = await updateBusiness(id, req.body);
      res.json({ message: 'Dados atualizados com sucesso', data: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/admin/businesses/:id', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      const deleted = await deleteBusiness(id);
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

  app.post('/api/admin/categories', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { name, slug, description, icon, subcategories, active, sortOrder } = req.body;
      if (!name || !slug) {
        return res.status(400).json({ error: 'Nome e slug são obrigatórios' });
      }

      const parsedSubcategories = Array.isArray(subcategories)
        ? subcategories.map((s: string) => s.trim()).filter(Boolean)
        : typeof subcategories === 'string'
        ? subcategories.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const [created] = await db.insert(categories)
        .values({
          name: name.trim(),
          slug: slug.trim().toLowerCase(),
          description: description?.trim() || null,
          icon: icon || 'Store',
          subcategories: parsedSubcategories,
          active: active ?? true,
          sortOrder: Number(sortOrder) || 0,
        })
        .returning();

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

      const [updated] = await db.update(categories)
        .set({
          ...(name ? { name: name.trim() } : {}),
          ...(slug ? { slug: slug.trim().toLowerCase() } : {}),
          ...(description !== undefined ? { description: description?.trim() || null } : {}),
          ...(icon ? { icon } : {}),
          ...(parsedSubcategories !== undefined ? { subcategories: parsedSubcategories } : {}),
          ...(active !== undefined ? { active } : {}),
          ...(sortOrder !== undefined ? { sortOrder: Number(sortOrder) } : {}),
        })
        .where(eq(categories.id, id))
        .returning();

      res.json({ message: 'Categoria atualizada', data: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/admin/categories/:id', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      const [deleted] = await db.delete(categories).where(eq(categories.id, id)).returning();
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
      res.json({ message: 'Mensagem atualizada', data: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // VITE INTEGRATION FOR DEV & STATIC SERVE FOR PROD
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Guia Comercial Ninho Verde II rodando na porta ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Falha crítica ao iniciar servidor:', err);
});
