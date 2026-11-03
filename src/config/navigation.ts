export interface NavItem {
  title: string;
  href: string;
  iconName: string;
  badge?: string;
  roles: string[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAVIGATION_CONFIG: NavSection[] = [
  {
    title: 'Recruitment & HR',
    items: [
      {
        title: 'Dashboard',
        href: '/hr',
        iconName: 'LayoutDashboard',
        roles: ['super_admin', 'admin', 'hr_manager'],
      },
      {
        title: 'Applied Candidate',
        href: '/hr/candidates',
        iconName: 'Users',
        roles: ['super_admin', 'admin', 'hr_manager'],
      },
      {
        title: 'Employees',
        href: '/employees',
        iconName: 'UserCheck',
        roles: ['super_admin', 'admin', 'hr_manager'],
      },
      {
        title: 'Interview Management',
        href: '/hr/interviews',
        iconName: 'CalendarCheck',
        roles: ['super_admin', 'admin', 'hr_manager', 'interviewer', 'dept_manager'],
      },
      {
        title: 'Interview Result',
        href: '/hr/decisions',
        iconName: 'Award',
        roles: ['super_admin', 'admin', 'hr_manager'],
      },
      {
        title: 'Question Bank',
        href: '/hr/questions',
        iconName: 'HelpCircle',
        roles: ['super_admin', 'admin', 'hr_manager', 'dept_manager'],
      },
      {
        title: 'Offer Letter',
        href: '/hr/offers',
        iconName: 'FileText',
        roles: ['super_admin', 'admin', 'hr_manager'],
      },
      {
        title: 'Joining',
        href: '/hr/joining',
        iconName: 'ClipboardCheck',
        roles: ['super_admin', 'admin', 'hr_manager'],
      },
    ],
  },
  {
    title: 'System & Configuration',
    items: [
      {
        title: 'System Settings',
        href: '/settings',
        iconName: 'Settings',
        roles: ['super_admin', 'admin', 'hr_manager'],
      },
    ],
  },
];

export function getAuthorizedNav(role: string): NavSection[] {
  return NAVIGATION_CONFIG.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.roles.includes(role) || role === 'super_admin'),
  })).filter((section) => section.items.length > 0);
}
