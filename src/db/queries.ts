import { and, desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import { businesses, categories, contactMessages } from './schema.ts';

// Normalize string removing accents for search
export function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// Busca categorias ativas
export async function getActiveCategories() {
  try {
    return await db.select()
      .from(categories)
      .where(eq(categories.active, true))
      .orderBy(categories.sortOrder, categories.name);
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw new Error('Falha ao carregar categorias do banco de dados', { cause: error });
  }
}

// Busca todas as categorias (para admin)
export async function getAllCategories() {
  try {
    return await db.select()
      .from(categories)
      .orderBy(categories.sortOrder, categories.name);
  } catch (error) {
    console.error('Error fetching all categories:', error);
    throw new Error('Falha ao listar categorias', { cause: error });
  }
}

// Busca negócios aprovados com suporte a busca multi-termos, categoria e subcategoria
export async function getApprovedBusinesses(
  search?: string,
  categorySlugOrId?: string | number,
  subcategory?: string
) {
  try {
    const conditions = [eq(businesses.status, 'approved')];

    if (categorySlugOrId) {
      if (typeof categorySlugOrId === 'number' || !isNaN(Number(categorySlugOrId))) {
        conditions.push(eq(businesses.categoryId, Number(categorySlugOrId)));
      } else {
        const cat = await db
          .select()
          .from(categories)
          .where(eq(categories.slug, String(categorySlugOrId)))
          .limit(1);
        if (cat.length > 0) {
          conditions.push(eq(businesses.categoryId, cat[0].id));
        }
      }
    }

    let allApproved = await db.select()
      .from(businesses)
      .where(and(...conditions))
      .orderBy(desc(businesses.createdAt));

    if (subcategory && subcategory.trim()) {
      const cleanSub = removeAccents(subcategory.trim());
      const subTokens = cleanSub.split(/\s+/).filter((t) => t.length > 2 && t !== 'para' && t !== 'com');
      allApproved = allApproved.filter((b) => {
        const subTarget = removeAccents(
          `${b.subcategory || ''} ${b.keywords} ${b.description} ${b.name}`
        );
        if (subTarget.includes(cleanSub)) return true;
        return subTokens.length > 0 && subTokens.some((tok) => subTarget.includes(tok));
      });
    }

    if (search && search.trim()) {
      const cleanTerm = removeAccents(search.trim());
      const terms = cleanTerm.split(/\s+/).filter(Boolean);

      allApproved = allApproved.filter((b) => {
        const textTarget = removeAccents(
          `${b.name} ${b.ownerName} ${b.categoryName} ${b.subcategory || ''} ${b.description} ${b.keywords}`
        );
        return terms.every((term) => textTarget.includes(term));
      });
    }

    return allApproved;
  } catch (error) {
    console.error('Error fetching approved businesses:', error);
    throw new Error('Falha ao pesquisar negócios no banco de dados', { cause: error });
  }
}

// Solicitação de cadastro de negócio (morador/empreendedor) - Status sempre 'pending'
export async function createBusinessRequest(data: {
  ownerUid?: string;
  ownerName: string;
  name: string;
  categoryId: number;
  categoryName: string;
  subcategory?: string | null;
  description: string;
  whatsapp: string;
  keywords: string;
}) {
  try {
    const cleanPhone = data.whatsapp.replace(/\D/g, '');

    const [created] = await db.insert(businesses)
      .values({
        ownerUid: data.ownerUid || null,
        ownerName: data.ownerName.trim(),
        name: data.name.trim(),
        categoryId: data.categoryId,
        categoryName: data.categoryName.trim(),
        subcategory: data.subcategory?.trim() || null,
        description: data.description.trim(),
        whatsapp: cleanPhone,
        keywords: data.keywords.trim(),
        status: 'pending',
      })
      .returning();

    return created;
  } catch (error) {
    console.error('Error creating business request:', error);
    throw new Error('Falha ao registrar solicitação de cadastro', { cause: error });
  }
}

// Admin: listar negócios com filtro de status
export async function getAdminBusinesses(statusFilter?: string) {
  try {
    if (statusFilter && statusFilter !== 'all') {
      return await db.select()
        .from(businesses)
        .where(eq(businesses.status, statusFilter))
        .orderBy(desc(businesses.createdAt));
    }

    return await db.select()
      .from(businesses)
      .orderBy(desc(businesses.createdAt));
  } catch (error) {
    console.error('Error in getAdminBusinesses:', error);
    throw new Error('Falha ao listar negócios para o administrador', { cause: error });
  }
}

// Admin: atualizar status de negócio
export async function updateBusinessStatus(
  id: number,
  status: 'approved' | 'rejected' | 'suspended' | 'pending',
  reviewer: string,
  rejectionReason?: string
) {
  try {
    const [updated] = await db.update(businesses)
      .set({
        status,
        reviewedAt: new Date(),
        reviewedBy: reviewer,
        rejectionReason: rejectionReason || null,
        updatedAt: new Date(),
      })
      .where(eq(businesses.id, id))
      .returning();

    return updated;
  } catch (error) {
    console.error('Error in updateBusinessStatus:', error);
    throw new Error('Falha ao atualizar status do negócio', { cause: error });
  }
}

// Admin: atualizar dados de um negócio
export async function updateBusiness(
  id: number,
  data: Partial<typeof businesses.$inferInsert>
) {
  try {
    const [updated] = await db.update(businesses)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(businesses.id, id))
      .returning();

    return updated;
  } catch (error) {
    console.error('Error in updateBusiness:', error);
    throw new Error('Falha ao atualizar dados do negócio', { cause: error });
  }
}

// Admin: remover negócio
export async function deleteBusiness(id: number) {
  try {
    const [deleted] = await db.delete(businesses)
      .where(eq(businesses.id, id))
      .returning();

    return deleted;
  } catch (error) {
    console.error('Error in deleteBusiness:', error);
    throw new Error('Falha ao excluir negócio', { cause: error });
  }
}

// Admin: estatísticas gerais
export async function getAdminStats() {
  try {
    const all = await db.select({ status: businesses.status }).from(businesses);
    const catList = await db.select({ id: categories.id }).from(categories);
    const messages = await db.select({ status: contactMessages.status }).from(contactMessages);

    const total = all.length;
    const pending = all.filter((b) => b.status === 'pending').length;
    const approved = all.filter((b) => b.status === 'approved').length;
    const rejected = all.filter((b) => b.status === 'rejected').length;
    const suspended = all.filter((b) => b.status === 'suspended').length;
    const unreadMessages = messages.filter((m) => m.status === 'unread').length;

    return {
      total,
      pending,
      approved,
      rejected,
      suspended,
      categoriesCount: catList.length,
      unreadMessages,
    };
  } catch (error) {
    console.error('Error in getAdminStats:', error);
    throw new Error('Falha ao calcular estatísticas', { cause: error });
  }
}

// Contato institucional
export async function saveContactMessage(data: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}) {
  try {
    const [created] = await db.insert(contactMessages)
      .values({
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone?.trim() || null,
        subject: data.subject.trim(),
        message: data.message.trim(),
        status: 'unread',
      })
      .returning();

    return created;
  } catch (error) {
    console.error('Error saving contact message:', error);
    throw new Error('Falha ao salvar mensagem de contato', { cause: error });
  }
}

export async function getContactMessages() {
  try {
    return await db.select()
      .from(contactMessages)
      .orderBy(desc(contactMessages.createdAt));
  } catch (error) {
    console.error('Error in getContactMessages:', error);
    throw new Error('Falha ao listar mensagens de contato', { cause: error });
  }
}
