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
    <aside className="w-64 h-full bg-white/5 backdrop-blur-md border-r border-white/10 flex flex-col p-4 space-y-2">
      {links.map((link) => (
        <Link
          key={link.name}
          href={link.href}
          className="px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
        >
          {link.name}
        </Link>
      ))}
    </aside>
  );
}
