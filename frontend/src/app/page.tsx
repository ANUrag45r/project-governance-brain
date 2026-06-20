export default function Home() {
  const cards = [
    { title: 'Total Meetings', value: '142', color: 'from-blue-500 to-cyan-400' },
    { title: 'Total Decisions', value: '38', color: 'from-purple-500 to-indigo-400' },
    { title: 'Open Actions', value: '24', color: 'from-pink-500 to-rose-400' },
    { title: 'Risks', value: '3', color: 'from-orange-500 to-red-400' },
    { title: 'Health Score', value: '92%', color: 'from-emerald-500 to-teal-400' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card, index) => (
          <div key={index} className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm group hover:bg-white/10 transition-all">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.color} opacity-20 blur-3xl group-hover:opacity-40 transition-opacity rounded-full -mr-16 -mt-16`}></div>
            <h3 className="text-sm font-medium text-gray-400">{card.title}</h3>
            <p className="text-3xl font-bold text-white mt-2">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm min-h-[300px]">
          <h3 className="text-lg font-semibold text-white mb-4">Meeting Trends</h3>
          <div className="flex items-center justify-center h-48 border border-dashed border-white/20 rounded-xl text-gray-500">Chart Placeholder</div>
        </div>
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm min-h-[300px]">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activities</h3>
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="flex items-center space-x-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">MA</div>
                <div>
                  <p className="text-sm text-white font-medium">New Meeting Analyzed</p>
                  <p className="text-xs text-gray-400">Sprint Planning - 2 hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
