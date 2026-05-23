"use client";

import type { StudentProfile, WeeklyReport, HeatmapCell, StudentObserverResult } from "@/lib/api";
import type { FormatRecommendation } from "@/lib/ilm-formats";
import { FormatBadge } from "@/app/components/ilm/FormatBadge";

type Props = {
  students: StudentProfile[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  formatRec: FormatRecommendation | null;
  selectedStudent: StudentProfile | null;
  heatmapCells: HeatmapCell[];
  sessionTopics: { topic: string; difficulty: number }[];
  reports: WeeklyReport[];
  reportGenerating: boolean;
  reportError: string | null;
  onGenerateReport: () => void;
  onClose: () => void;
  observerResults: StudentObserverResult[] | null;
  observerLoading: boolean;
  observerError: string | null;
  onRunObserver: () => void;
};

function conditionChip(condition: string) {
  if (/dyslexia/i.test(condition)) return "bg-[#E8F4FD] text-[#1A5C96]";
  if (/autism|spectrum/i.test(condition)) return "bg-honey-lo text-bark-deep";
  if (/adhd/i.test(condition)) return "bg-dust-lo text-dust";
  return "bg-sand text-bark-soft";
}

export function EducatorSidebar({
  students,
  selectedId,
  onSelect,
  formatRec,
  selectedStudent,
  heatmapCells,
  sessionTopics,
  reports,
  reportGenerating,
  reportError,
  onGenerateReport,
  onClose,
  observerResults,
  observerLoading,
  observerError,
  onRunObserver,
}: Props) {
  const topicMap = new Map<string, number[]>();
  for (const cell of heatmapCells) {
    const arr = topicMap.get(cell.topic) ?? [];
    arr.push(cell.difficulty);
    topicMap.set(cell.topic, arr);
  }
  for (const ev of sessionTopics) {
    const arr = topicMap.get(ev.topic) ?? [];
    arr.push(ev.difficulty);
    topicMap.set(ev.topic, arr);
  }
  const topics = Array.from(topicMap.entries()).slice(0, 4);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-sand-mid">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-sand text-bark-soft hover:bg-sand-mid hover:text-bark-deep transition-colors shrink-0"
          aria-label="Collapse class panel"
          title="Collapse"
        >
          <span className="text-lg leading-none" aria-hidden>
            ›
          </span>
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-bark-deep text-sm">My class</p>
          <p className="text-[10px] text-bark-faint lg:hidden">Tap outside or Esc to close</p>
        </div>
      </div>

      <p className="text-[11px] text-bark-faint">Tap who you are helping today.</p>

      <div className="space-y-2">
        {students.map((s) => {
          const on = selectedId === s.id;
          const low = s.weekly_progress < 55;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left border-2 transition-all ${
                on ? "border-terra bg-terra-lo" : "border-transparent bg-sand hover:bg-sand-mid"
              }`}
            >
              <span className="text-2xl">{s.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-bark-deep truncate">{s.name}</p>
                <p className={`text-[10px] inline-block mt-0.5 px-1.5 py-0.5 rounded-full ${conditionChip(s.condition)}`}>
                  {s.condition.split("·")[0].trim()}
                </p>
              </div>
              <div className="text-right shrink-0">
                {low ? (
                  <span className="text-[10px] text-terra-hi font-bold">⚠</span>
                ) : (
                  <span className="text-[10px] text-bark-faint">{s.weekly_progress}%</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedStudent && formatRec && (
        <div
          className={`rounded-2xl border-2 p-3 ${formatRec.theme.border} ${formatRec.theme.bgLo}`}
        >
          <p className={`text-[10px] font-bold uppercase mb-1 ${formatRec.theme.textHi}`}>Best format</p>
          <p className="text-sm font-bold text-bark-deep flex items-center gap-2 flex-wrap">
            <span>{formatRec.emoji}</span>
            {formatRec.label}
            <FormatBadge kind={formatRec.kind} />
          </p>
          <p className="text-xs text-bark-soft mt-0.5">{formatRec.oneLine}</p>
          <ul className="mt-2 space-y-1">
            {formatRec.tips.map((t) => (
              <li key={t} className="text-[11px] text-bark-deep">
                · {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      {topics.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-bark-faint uppercase mb-2">Hard topics</p>
          <div className="space-y-1.5">
            {topics.map(([topic, vals]) => {
              const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
              const w = Math.round((avg / 5) * 100);
              return (
                <div key={topic} className="flex items-center gap-2">
                  <span className="text-[10px] text-bark-soft w-20 truncate">{topic}</span>
                  <div className="flex-1 h-2 bg-sand-mid rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${avg >= 4 ? "bg-terra" : avg >= 3 ? "bg-honey" : "bg-sage"}`}
                      style={{ width: `${w}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-2xl border-2 border-sand-mid bg-parch p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold text-bark-faint uppercase">Student Observer</p>
          <button
            type="button"
            onClick={onRunObserver}
            disabled={observerLoading}
            className="text-[11px] font-semibold text-terra-hi hover:underline disabled:opacity-50"
          >
            {observerLoading ? "…" : "Scan class"}
          </button>
        </div>
        {observerError && <p className="text-[11px] text-terra-hi mb-2">{observerError}</p>}
        {!observerResults && !observerLoading && (
          <p className="text-[11px] text-bark-faint">Flags who needs attention after you generate content.</p>
        )}
        {observerResults && observerResults.length > 0 && (
          <ul className="space-y-2 mt-1">
            {observerResults.map((row) => (
              <li
                key={row.student_id}
                className={`rounded-xl px-2.5 py-2 text-[11px] ${
                  row.needs_attention ? "bg-terra-lo border border-terra/30" : "bg-sand"
                }`}
              >
                <p className="font-semibold text-bark-deep flex items-center justify-between gap-2">
                  <span>{row.name}</span>
                  {row.needs_attention && <span className="text-terra-hi text-[10px]">Needs help</span>}
                </p>
                <p className="text-bark-soft mt-0.5">{row.recommendation}</p>
                <p className="text-bark-faint mt-0.5">Coverage {row.coverage_pct}%</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="pt-2 border-t border-sand-mid">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold text-bark-faint uppercase">Weekly note</p>
          <button
            type="button"
            onClick={onGenerateReport}
            disabled={reportGenerating}
            className="text-[11px] font-semibold text-terra-hi hover:underline disabled:opacity-50"
          >
            {reportGenerating ? "…" : "Make"}
          </button>
        </div>
        {reportError && <p className="text-[11px] text-terra-hi mb-2">{reportError}</p>}
        {reports[0] ? (
          <p className="text-[11px] text-bark-soft line-clamp-4">{reports[0].summary}</p>
        ) : (
          <p className="text-[11px] text-bark-faint">No report yet.</p>
        )}
      </div>
    </div>
  );
}
