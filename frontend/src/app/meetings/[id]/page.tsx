import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function MeetingDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  
  let meeting = null;
  try {
    const res = await fetch(`http://localhost:8000/api/meetings/${id}`, { cache: 'no-store' });
    if (res.ok) {
      meeting = await res.json();
      if (meeting.error) meeting = null;
    }
  } catch (err) {
    console.error("Error fetching meeting details:", err);
  }

  if (!meeting) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link href="/meetings" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 flex items-center space-x-2 transition-colors font-medium">
        <span>← Back to Meetings</span>
      </Link>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-zinc-800 dark:text-white tracking-tight">{meeting.title}</h1>
          <p className="text-zinc-500 dark:text-gray-400 mt-2 font-mono text-sm">{meeting.date}</p>
        </div>
        <div className="flex space-x-2">
          {meeting.participants.map((p: string, i: number) => (
            <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-500/20 border border-zinc-300 dark:border-white/10 flex items-center justify-center text-sm font-semibold text-zinc-800 dark:text-white" title={p}>
              {p.charAt(0)}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl bg-white/40 dark:bg-white/5 border border-zinc-200 dark:border-white/10 p-6 backdrop-blur-sm shadow-sm">
            <h3 className="text-lg font-semibold text-zinc-800 dark:text-white mb-4">Summary</h3>
            <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-sm">{meeting.summary}</p>
          </div>

          <div className="rounded-2xl bg-white/40 dark:bg-white/5 border border-zinc-200 dark:border-white/10 p-6 backdrop-blur-sm shadow-sm">
            <h3 className="text-lg font-semibold text-zinc-800 dark:text-white mb-4">Transcript</h3>
            <div className="bg-zinc-200/30 dark:bg-black/20 p-4 rounded-xl border border-zinc-200 dark:border-white/5 text-zinc-700 dark:text-zinc-300 whitespace-pre-line font-mono text-sm leading-relaxed max-h-96 overflow-y-auto">
              {meeting.transcript}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 p-6 backdrop-blur-sm shadow-sm">
            <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4 flex items-center">
              <span className="mr-2">📝</span> Decisions
            </h3>
            <ul className="space-y-3">
              {meeting.decisions.map((d: string, i: number) => (
                <li key={i} className="text-sm text-zinc-800 dark:text-zinc-200 bg-white/60 dark:bg-black/20 px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/5 leading-relaxed">
                  {d}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-pink-500/5 dark:bg-pink-500/10 border border-pink-500/20 p-6 backdrop-blur-sm shadow-sm">
            <h3 className="text-lg font-semibold text-pink-600 dark:text-pink-400 mb-4 flex items-center">
              <span className="mr-2">⚡</span> Actions
            </h3>
            <ul className="space-y-3">
              {meeting.actions.map((a: any, i: number) => (
                <li key={i} className="flex flex-col text-sm text-zinc-800 dark:text-zinc-200 bg-white/60 dark:bg-black/20 px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/5">
                  <span className="font-semibold text-zinc-800 dark:text-gray-100">{a.task}</span>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-zinc-550 dark:text-gray-400">Owner: <span className="text-zinc-700 dark:text-zinc-200 font-medium">{a.owner}</span></span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${a.status === 'Done' ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' : 'border-orange-500/30 text-orange-600 dark:text-orange-400 bg-orange-500/10'}`}>{a.status}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-orange-500/5 dark:bg-orange-500/10 border border-orange-500/20 p-6 backdrop-blur-sm shadow-sm">
            <h3 className="text-lg font-semibold text-orange-600 dark:text-orange-400 mb-4 flex items-center">
              <span className="mr-2">⚠️</span> Risks
            </h3>
            {meeting.risks.length > 0 ? (
              <ul className="space-y-3">
                {meeting.risks.map((r: string, i: number) => (
                  <li key={i} className="text-sm text-zinc-800 dark:text-zinc-200 bg-white/60 dark:bg-black/20 px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/5">
                    {r}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-500 dark:text-gray-400 italic">No risks identified.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
