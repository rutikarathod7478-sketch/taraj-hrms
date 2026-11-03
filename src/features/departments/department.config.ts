import { DepartmentCode } from '@/types/department';

export interface DepartmentConfig {
  id: number;
  code: DepartmentCode;
  name: string;
  description: string;
  color: string;
  bgLight: string;
  borderColor: string;
  defaultRoles: Array<{ code: string; title: string; description: string }>;
  roles?: Array<{ code: string; title: string; description: string }>;
}

export const DEPARTMENTS_CONFIG: DepartmentConfig[] = [
  {
    id: 1,
    code: 'QUALITY',
    name: 'Quality',
    description: 'Quality Assurance, Software Testing, Automation & Compliance',
    color: '#0284c7', // Sky
    bgLight: 'bg-sky-50 dark:bg-sky-950/40',
    borderColor: 'border-sky-300 dark:border-sky-800',
    defaultRoles: [
      { code: 'QA_ENG', title: 'QA Automation Engineer', description: 'Selenium, Playwright, Cypress test frameworks' },
      { code: 'QA_MAN', title: 'Manual Test Specialist', description: 'Functional, cross-browser, regression test cases' },
    ],
  },
  {
    id: 2,
    code: 'DEV',
    name: 'Development',
    description: 'Software Engineering, Full Stack, Mobile & Cloud Engineering',
    color: '#3b82f6', // Blue
    bgLight: 'bg-blue-50 dark:bg-blue-950/40',
    borderColor: 'border-blue-300 dark:border-blue-800',
    defaultRoles: [
      { code: 'DEV_FULLSTACK', title: 'Full Stack Developer', description: 'Next.js, Node.js, TypeScript & MySQL architecture' },
      { code: 'DEV_BACKEND', title: 'Backend Engineer', description: 'REST APIs, Microservices, Performance & Database' },
      { code: 'DEV_FRONTEND', title: 'Frontend Engineer', description: 'Modern responsive UI, React, accessibility & animations' },
    ],
  },
  {
    id: 3,
    code: 'MGMT',
    name: 'Management',
    description: 'Project Management, Product Leadership & Executive Operations',
    color: '#8b5cf6', // Purple
    bgLight: 'bg-purple-50 dark:bg-purple-950/40',
    borderColor: 'border-purple-300 dark:border-purple-800',
    defaultRoles: [
      { code: 'PM_TECH', title: 'Technical Project Manager', description: 'Agile sprints, Jira, cross-team technical delivery' },
      { code: 'PROD_MGR', title: 'Product Manager', description: 'Product roadmaps, user stories, metrics & growth' },
    ],
  },
  {
    id: 4,
    code: 'SALES',
    name: 'Sales',
    description: 'Enterprise Sales, Business Development & Account Acquisition',
    color: '#10b981', // Emerald
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderColor: 'border-emerald-300 dark:border-emerald-800',
    defaultRoles: [
      { code: 'SALES_BDE', title: 'Business Development Executive', description: 'B2B client outreach, discovery calls, pipeline build' },
      { code: 'SALES_MGR', title: 'Enterprise Sales Manager', description: 'High-value contracts, client negotiations, leadership' },
      { code: 'DEMAND_GEN', title: 'Demand Generation Specialist', description: 'B2B pipeline, ABM, ICP qualification & MQLs' },
    ],
  },
  {
    id: 5,
    code: 'HR',
    name: 'HR',
    description: 'Talent Acquisition, People Operations and Employee Relations',
    color: '#ec4899', // Pink
    bgLight: 'bg-pink-50 dark:bg-pink-950/40',
    borderColor: 'border-pink-300 dark:border-pink-800',
    defaultRoles: [
      { code: 'HR_RECRUITER', title: 'Technical Recruiter', description: 'Talent sourcing, behavioral screening & interview panels' },
      { code: 'HR_EXEC', title: 'HR Operations Executive', description: 'Onboarding, compliance, joining documentation & employee welfare' },
    ],
  },
  {
    id: 6,
    code: 'OPS',
    name: 'Operations',
    description: 'IT Infrastructure, Facilities & Daily Business Operations',
    color: '#f59e0b', // Amber
    bgLight: 'bg-amber-50 dark:bg-amber-950/40',
    borderColor: 'border-amber-300 dark:border-amber-800',
    defaultRoles: [
      { code: 'OPS_SYSADMIN', title: 'System Administrator', description: 'Workstation security, network infrastructure, hardware' },
      { code: 'OPS_COORD', title: 'Operations Coordinator', description: 'Facilities, procurement, office vendors & logistics' },
    ],
  },
  {
    id: 7,
    code: 'DBMS',
    name: 'DBMS',
    description: 'Database Administration, Data Engineering & Storage Architecture',
    color: '#06b6d4', // Cyan
    bgLight: 'bg-cyan-50 dark:bg-cyan-950/40',
    borderColor: 'border-cyan-300 dark:border-cyan-800',
    defaultRoles: [
      { code: 'DBA_MYSQL', title: 'MySQL Database Administrator', description: 'Indexing, replication, high-availability & query optimization' },
      { code: 'DATA_ENG', title: 'Data Engineer', description: 'ETL pipelines, normalization, warehouse modeling' },
    ],
  },
  {
    id: 8,
    code: 'EMAIL_MKT',
    name: 'Email Marketing',
    description: 'Campaign Management, Deliverability & Retention Marketing',
    color: '#f97316', // Orange
    bgLight: 'bg-orange-50 dark:bg-orange-950/40',
    borderColor: 'border-orange-300 dark:border-orange-800',
    defaultRoles: [
      { code: 'EMAIL_SPEC', title: 'Email Marketing Specialist', description: 'Campaign execution, HTML email templates, A/B testing' },
      { code: 'EMAIL_STRAT', title: 'Lifecycle Campaign Strategist', description: 'Drip sequences, segmentation, deliverability (SPF/DKIM)' },
    ],
  },
];

export function getDepartmentById(id: number): DepartmentConfig | undefined {
  return DEPARTMENTS_CONFIG.find((d) => d.id === Number(id));
}

export function getDepartmentByCode(code: string): DepartmentConfig | undefined {
  return DEPARTMENTS_CONFIG.find((d) => d.code.toLowerCase() === code.toLowerCase());
}
