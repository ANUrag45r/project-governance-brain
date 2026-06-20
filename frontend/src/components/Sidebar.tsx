import Link from 'next/link';

export default function Sidebar() {
  const links = [
    { name: 'Dashboard', href: '/' },
    { name: 'Meetings', href: '/meetings' },
    { name: 'Actions', href: '/actions' },
    { name: 'Risks', href: '/risks' },
    { name: 'Reports', href: '/reports' },
    { name: 'Skills', href: '/skills' },
    { name: 'Chat', href: '/chat' },
    { name: 'Settings', href: '/settings' },
  ];

  return (
    <aside className="w-64 h-full bg-zinc-50 dark:bg-[#0a0a0c]/20 backdrop-blur-md border-r border-zinc-200 dark:border-zinc-800/80 flex flex-col p-4 space-y-2 transition-colors duration-200">
      {links.map((link) => (
        <Link
          key={link.name}
          href={link.href}
          className="px-4 py-3 text-sm text-zinc-600 dark:text-gray-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-zinc-800/40 rounded-lg transition-all"
        >
          {link.name}
        </Link>
      ))}
    </aside>
  );
}
