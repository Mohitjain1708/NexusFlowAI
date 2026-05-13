import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo users
  const hashedPassword = await bcrypt.hash('password123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@nexusflow.ai' },
    update: {},
    create: {
      name: 'Alex Johnson',
      email: 'admin@nexusflow.ai',
      password: hashedPassword,
      role: 'ADMIN',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    },
  });

  const member1 = await prisma.user.upsert({
    where: { email: 'sarah@nexusflow.ai' },
    update: {},
    create: {
      name: 'Sarah Chen',
      email: 'sarah@nexusflow.ai',
      password: hashedPassword,
      role: 'MEMBER',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    },
  });

  const member2 = await prisma.user.upsert({
    where: { email: 'mike@nexusflow.ai' },
    update: {},
    create: {
      name: 'Mike Torres',
      email: 'mike@nexusflow.ai',
      password: hashedPassword,
      role: 'MEMBER',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
    },
  });

  // Create workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: 'product-team' },
    update: {},
    create: {
      name: 'Product Team',
      description: 'Main product development workspace',
      slug: 'product-team',
      color: '#6366f1',
      icon: '🚀',
      ownerId: admin.id,
    },
  });

  // Add members
  await prisma.workspaceMember.upsert({
    where: { userId_workspaceId: { userId: admin.id, workspaceId: workspace.id } },
    update: {},
    create: { userId: admin.id, workspaceId: workspace.id, role: 'ADMIN' },
  });
  await prisma.workspaceMember.upsert({
    where: { userId_workspaceId: { userId: member1.id, workspaceId: workspace.id } },
    update: {},
    create: { userId: member1.id, workspaceId: workspace.id, role: 'MEMBER' },
  });
  await prisma.workspaceMember.upsert({
    where: { userId_workspaceId: { userId: member2.id, workspaceId: workspace.id } },
    update: {},
    create: { userId: member2.id, workspaceId: workspace.id, role: 'MEMBER' },
  });

  // Create board
  const board = await prisma.board.create({
    data: {
      title: 'Sprint 1 - MVP',
      description: 'First sprint for MVP delivery',
      workspaceId: workspace.id,
    },
  });

  // Create tasks
  const tasks = [
    { title: 'Design system setup', status: 'COMPLETED' as const, priority: 'HIGH' as const, position: 0 },
    { title: 'Authentication flow', status: 'COMPLETED' as const, priority: 'URGENT' as const, position: 1 },
    { title: 'Kanban board drag-and-drop', status: 'IN_PROGRESS' as const, priority: 'HIGH' as const, position: 0 },
    { title: 'Real-time collaboration', status: 'IN_PROGRESS' as const, priority: 'HIGH' as const, position: 1 },
    { title: 'AI assistant integration', status: 'TODO' as const, priority: 'MEDIUM' as const, position: 0 },
    { title: 'Analytics dashboard', status: 'TODO' as const, priority: 'MEDIUM' as const, position: 1 },
    { title: 'File upload system', status: 'REVIEW' as const, priority: 'LOW' as const, position: 0 },
    { title: 'Notification system', status: 'TODO' as const, priority: 'HIGH' as const, position: 2 },
  ];

  for (const task of tasks) {
    await prisma.task.create({
      data: {
        ...task,
        boardId: board.id,
        creatorId: admin.id,
        assigneeId: [member1.id, member2.id, admin.id][Math.floor(Math.random() * 3)],
        dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log('📧 Login: admin@nexusflow.ai / password123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
