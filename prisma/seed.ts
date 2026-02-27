/**
 * ==========================================================================
 * Prisma Seed Script
 * ==========================================================================
 * Populates the database with realistic enterprise data for development.
 * Run with: npx prisma db seed
 *
 * Generates:
 * - 50 resources across multiple providers and regions
 * - 24 team members across departments
 * - 12 projects with allocations
 * - Audit log entries
 * ==========================================================================
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ---------- Seed Data ----------

const RESOURCE_PREFIXES = ['prod', 'staging', 'dev', 'edge', 'core', 'cache', 'proxy', 'worker', 'analytics', 'ml'];
const RESOURCE_TYPES = ['COMPUTE', 'STORAGE', 'NETWORK', 'DATABASE', 'CDN', 'CONTAINER'] as const;
const PROVIDERS = ['AWS', 'GCP', 'Azure', 'On-Premise'] as const;
const REGIONS = ['us-east-1', 'us-west-2', 'eu-west-1', 'eu-central-1', 'ap-southeast-1', 'ap-northeast-1'];
const STATUSES = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'IDLE', 'OVERLOADED', 'MAINTENANCE'] as const;
const DEPARTMENTS = ['Engineering', 'Design', 'Product', 'Data Science', 'DevOps', 'QA', 'Security', 'Management'];

const FIRST_NAMES = ['Alex', 'Jordan', 'Morgan', 'Taylor', 'Casey', 'Riley', 'Drew', 'Quinn', 'Reese', 'Avery', 'Harper', 'Emerson', 'Sage', 'Dakota', 'Remy', 'Blair', 'Skyler', 'Ellis', 'Jamie', 'Rowan', 'Andi', 'Kai', 'Nico', 'Sasha'];
const LAST_NAMES = ['Chen', 'Nakamura', 'Singh', 'Mueller', 'Santos', 'Kim', 'Okafor', 'Petrov', 'Andersen', 'Tanaka', 'Ivanova', 'Costa', 'Park', 'Novak', 'Yamamoto', 'Fernandez', 'Johansson', 'Liu', 'Patel', 'Bergström', 'Williams', 'Garcia', 'Martinez', 'Robinson'];
const ROLES = ['Senior Engineer', 'Staff Engineer', 'Principal Engineer', 'Engineering Manager', 'DevOps Lead', 'Data Engineer', 'Cloud Architect', 'SRE Lead', 'Security Engineer', 'Platform Engineer', 'Product Manager', 'Tech Lead'];
const SKILLS_LIST = ['React', 'TypeScript', 'Node.js', 'Python', 'Go', 'Rust', 'AWS', 'GCP', 'Kubernetes', 'Docker', 'Terraform', 'GraphQL', 'PostgreSQL', 'Redis', 'Kafka', 'gRPC', 'CI/CD', 'Monitoring'];

const PROJECT_NAMES = ['Phoenix Migration', 'Atlas Platform', 'Nebula Analytics', 'Horizon Gateway', 'Quantum Pipeline', 'Apex Integration', 'Catalyst Engine', 'Summit Orchestration', 'Zenith Monitoring', 'Nova Deployment', 'Prism Data Lake', 'Vertex ML Pipeline'];

// ---------- Helpers ----------

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

// ---------- Main Seed Function ----------

async function main() {
  console.log('🌱 Seeding database...\n');

  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.allocation.deleteMany();
  await prisma.resourceTag.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.project.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.user.deleteMany();

  // -- Create Admin User --
  console.log('👑 Creating default Admin user...');
  await prisma.user.create({
    data: {
      clerkId: 'seed_admin_clerk_id',
      email: 'admin@enterprise.io',
      firstName: 'System',
      lastName: 'Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log('  ✅ Created default Admin user (admin@enterprise.io)');

  // -- Create Resources --
  console.log('📦 Creating resources...');
  const resources = [];
  for (let i = 0; i < 50; i++) {
    const type = randomItem(RESOURCE_TYPES);
    const status = randomItem(STATUSES);
    const resource = await prisma.resource.create({
      data: {
        name: `${randomItem(RESOURCE_PREFIXES)}-${type.toLowerCase()}-${String(i).padStart(3, '0')}`,
        type,
        status,
        region: randomItem(REGIONS),
        provider: randomItem(PROVIDERS),
        cpuUtilization: status === 'OVERLOADED' ? randomBetween(85, 99) : randomBetween(10, 80),
        memoryUtilization: status === 'OVERLOADED' ? randomBetween(80, 98) : randomBetween(15, 75),
        costPerHour: randomBetween(0.02, 12.5),
        department: randomItem(DEPARTMENTS),
        lastHealthCheck: new Date(Date.now() - Math.floor(Math.random() * 3600000)),
        tags: {
          create: [
            { name: type.toLowerCase() },
            { name: status.toLowerCase() },
          ],
        },
      },
    });
    resources.push(resource);
  }
  console.log(`  ✅ Created ${resources.length} resources`);

  // -- Create Team Members --
  console.log('👥 Creating team members...');
  const teamMembers = [];
  for (let i = 0; i < 24; i++) {
    const firstName = FIRST_NAMES[i]!;
    const lastName = LAST_NAMES[i]!;
    const numSkills = Math.floor(Math.random() * 4) + 3;
    const memberSkills = [...new Set(Array.from({ length: numSkills }, () => randomItem(SKILLS_LIST)))];

    const member = await prisma.teamMember.create({
      data: {
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@enterprise.io`,
        role: randomItem(ROLES),
        department: randomItem(DEPARTMENTS),
        avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${firstName}${lastName}`,
        currentAllocation: randomBetween(40, 100),
        isActive: Math.random() > 0.1,
        joinedAt: new Date(Date.now() - Math.floor(Math.random() * 365 * 3 * 24 * 3600000)),
        skills: {
          create: memberSkills.map((skill) => ({ name: skill })),
        },
      },
    });
    teamMembers.push(member);
  }
  console.log(`  ✅ Created ${teamMembers.length} team members`);

  // -- Create Projects --
  console.log('📋 Creating projects...');
  const priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const projectStatuses = ['IN_PROGRESS', 'IN_PROGRESS', 'PLANNING', 'ON_HOLD', 'COMPLETED'];

  for (let i = 0; i < 12; i++) {
    const budget = randomBetween(50000, 2000000);
    const progress = Math.floor(Math.random() * 100);

    const project = await prisma.project.create({
      data: {
        name: PROJECT_NAMES[i]!,
        code: `PRJ-${String(i + 100).padStart(4, '0')}`,
        priority: randomItem(priorities),
        status: randomItem(projectStatuses),
        department: randomItem(DEPARTMENTS),
        leadId: randomItem(teamMembers).id,
        startDate: new Date(Date.now() - Math.floor(Math.random() * 180 * 24 * 3600000)),
        endDate: Math.random() > 0.3
          ? new Date(Date.now() + Math.floor(Math.random() * 180 * 24 * 3600000))
          : null,
        budget,
        spent: budget * (progress / 100) * randomBetween(0.8, 1.2),
        progress,
        resourceCount: Math.floor(Math.random() * 30) + 5,
        teamSize: Math.floor(Math.random() * 15) + 3,
      },
    });

    // Create some allocations for this project
    const numAllocations = Math.floor(Math.random() * 5) + 1;
    for (let j = 0; j < numAllocations; j++) {
      await prisma.allocation.create({
        data: {
          resourceId: randomItem(resources).id,
          projectId: project.id,
          teamMemberId: randomItem(teamMembers).id,
          percentage: randomBetween(10, 100),
          status: 'ACTIVE',
        },
      });
    }

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'Project',
        entityId: project.id,
        changes: JSON.stringify({ name: project.name, status: project.status }),
        performedBy: randomItem(teamMembers).name,
      },
    });
  }
  console.log('  ✅ Created 12 projects with allocations');

  // -- Summary --
  const counts = {
    users: await prisma.user.count(),
    resources: await prisma.resource.count(),
    teamMembers: await prisma.teamMember.count(),
    projects: await prisma.project.count(),
    allocations: await prisma.allocation.count(),
    auditLogs: await prisma.auditLog.count(),
  };

  console.log('\n🎉 Seed complete!');
  console.log(`   Users:        ${counts.users}`);
  console.log(`   Resources:    ${counts.resources}`);
  console.log(`   Team Members: ${counts.teamMembers}`);
  console.log(`   Projects:     ${counts.projects}`);
  console.log(`   Allocations:  ${counts.allocations}`);
  console.log(`   Audit Logs:   ${counts.auditLogs}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
