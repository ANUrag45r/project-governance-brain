import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function MeetingDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  
  // Fetch from the backend API directly in the Server Component
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
      <Link href="/meetings" className="text-sm text-blue-400 hover:text-blue-300 flex items-center space-x-2 transition-colors">
        <span>← Back to Meetings</span>
      </Link>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{meeting.title}</h1>
          <p className="text-gray-400 mt-2">{meeting.date}</p>
        </div>
        <div className="flex space-x-2">
          {meeting.participants.map((p: string, i: number) => (
            <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-sm font-medium text-white" title={p}>
              {p.charAt(0)}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white mb-4">Summary</h3>
            <p className="text-gray-300">{meeting.summary}</p>
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white mb-4">Transcript</h3>
            <div className="bg-black/20 p-4 rounded-xl border border-white/5 text-gray-300 whitespace-pre-line font-mono text-sm leading-relaxed max-h-96 overflow-y-auto">
              {meeting.transcript}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-blue-400 mb-4 flex items-center">
              <span className="mr-2">📝</span> Decisions
            </h3>
            <ul className="space-y-3">
              {meeting.decisions.map((d: string, i: number) => (
                <li key={i} className="text-sm text-gray-200 bg-black/20 px-3 py-2 rounded-lg border border-white/5">
                  {d}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-pink-500/10 border border-pink-500/20 p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-pink-400 mb-4 flex items-center">
              <span className="mr-2">⚡</span> Actions
            </h3>
            <ul className="space-y-3">
              {meeting.actions.map((a: any, i: number) => (
                <li key={i} className="flex flex-col text-sm text-gray-200 bg-black/20 px-3 py-2 rounded-lg border border-white/5">
                  <span className="font-medium">{a.task}</span>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-400">Owner: <span className="text-gray-200">{a.owner}</span></span>
                    <span className={`text-[10px] uppercase px-2 py-1 rounded border ${a.status === 'Done' ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' : 'border-orange-500/50 text-orange-400 bg-orange-500/10'}`}>{a.status}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-orange-500/10 border border-orange-500/20 p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-orange-400 mb-4 flex items-center">
              <span className="mr-2">⚠️</span> Risks
            </h3>
            {meeting.risks.length > 0 ? (
              <ul className="space-y-3">
                {meeting.risks.map((r: string, i: number) => (
                  <li key={i} className="text-sm text-gray-200 bg-black/20 px-3 py-2 rounded-lg border border-white/5">
                    {r}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 italic">No risks identified.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
