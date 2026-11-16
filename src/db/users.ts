import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

// Known admin emails or fallback
const DEFAULT_ADMIN_EMAILS = ['kaueia78@gmail.com'];

export async function getOrCreateUser(uid: string, email: string, name?: string) {
  try {
    const existing = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    
    // Check if this email should have admin rights
    const isAdmin = DEFAULT_ADMIN_EMAILS.includes(email.toLowerCase()) || 
      (process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL.toLowerCase() === email.toLowerCase());

    if (existing.length > 0) {
      const user = existing[0];
      // Elevate to admin if designated and not yet marked
      if (isAdmin && user.role !== 'admin') {
        const [updated] = await db.update(users)
          .set({ role: 'admin', name: name || user.name })
          .where(eq(users.uid, uid))
          .returning();
        return updated;
      }
      return user;
    }

    // Check count of users: if first user or matches admin email, grant admin
    const allUsers = await db.select().from(users).limit(1);
    const assignedRole = (isAdmin || allUsers.length === 0) ? 'admin' : 'user';

    const result = await db.insert(users)
      .values({
        uid,
        email,
        name: name || email.split('@')[0],
        role: assignedRole,
        status: 'active',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(name ? { name } : {}),
          ...(isAdmin ? { role: 'admin' } : {}),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Error in getOrCreateUser:', error);
    throw new Error('Falha ao registrar ou buscar usuário', { cause: error });
  }
}

export async function getUserRole(uid: string): Promise<string> {
  try {
    const result = await db.select({ role: users.role, email: users.email })
      .from(users)
      .where(eq(users.uid, uid))
      .limit(1);

    if (result.length > 0) {
      if (DEFAULT_ADMIN_EMAILS.includes(result[0].email.toLowerCase())) {
        return 'admin';
      }
      return result[0].role;
    }
    return 'user';
  } catch (error) {
    console.error('Error fetching user role:', error);
    return 'user';
  }
}
