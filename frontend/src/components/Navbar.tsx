export default function Navbar() {
  return (
    <nav className="h-16 flex items-center justify-between px-6 bg-white/5 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="flex items-center space-x-4">
        <h2 className="text-xl font-semibold text-white tracking-wide">Project Governance Brain</h2>
      </div>
      <div className="flex items-center space-x-4">
        <button className="px-4 py-2 text-sm text-white bg-blue-600/80 hover:bg-blue-500/80 rounded-lg backdrop-blur-sm transition-all border border-blue-400/30">
          Connect Teams
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 border border-white/20"></div>
      </div>
    </nav>
  );
}
