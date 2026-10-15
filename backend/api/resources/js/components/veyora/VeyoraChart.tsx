import React, { useState } from 'react';
import { BarChart3, LineChart, Table2, Info } from 'lucide-react';
import { VeyoraChartData, VeyoraAction } from '@/types/veyora';

interface Props {
    title?: string | null;
    summary?: string;
    data: VeyoraChartData;
    actions?: VeyoraAction[];
    onAction?: (action: VeyoraAction) => void;
}

export const VeyoraChart: React.FC<Props> = ({ title, summary, data, actions, onAction }) => {
    const [showTable, setShowTable] = useState<boolean>(false);

    // Calculate maximum value for bar/line scaling
    const allValues = data.series.flatMap((s) => s.data);
    const maxValue = Math.max(...allValues, 1);

    return (
        <div className="space-y-3.5 my-2">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                <div>
                    {title && <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base">{title}</h3>}
                    {summary && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{summary}</p>}
                </div>
                <button
                    onClick={() => setShowTable(!showTable)}
                    className="text-xs font-medium px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition inline-flex items-center gap-1.5"
                >
                    <Table2 className="w-3.5 h-3.5" />
                    {showTable ? 'View Chart' : 'View Table'}
                </button>
            </div>

            {showTable ? (
                /* Accessible Table view of the chart data */
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 p-3">
                    <table className="w-full text-xs text-left">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-800">
                                <th className="py-2 px-3 font-semibold text-gray-600">Month / Period</th>
                                {data.series.map((s, idx) => (
                                    <th key={idx} className="py-2 px-3 font-semibold text-right text-gray-600">
                                        {s.name} ({data.unit})
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {data.labels.map((lbl, idx) => (
                                <tr key={idx} className="hover:bg-gray-50/50">
                                    <td className="py-2 px-3 font-medium text-gray-800 dark:text-gray-200">{lbl}</td>
                                    {data.series.map((s, sIdx) => (
                                        <td key={sIdx} className="py-2 px-3 text-right font-mono text-gray-800 dark:text-gray-200">
                                            {s.data[idx]?.toLocaleString() ?? 0} {data.unit}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* Native Responsive Bar Chart */
                <div className="p-4 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 shadow-xs">
                    <div className="flex items-end justify-between gap-2 h-44 pt-6 pb-2 px-2">
                        {data.labels.map((lbl, idx) => {
                            const val = data.series[0]?.data[idx] ?? 0;
                            const heightPercent = Math.max(8, Math.round((val / maxValue) * 100));

                            return (
                                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                                    <span className="text-[10px] font-mono font-medium text-gray-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {val}
                                    </span>
                                    <div
                                        style={{ height: `${heightPercent}%` }}
                                        className="w-full max-w-[36px] rounded-t-md bg-linear-to-t from-teal-600 to-teal-400 dark:from-teal-700 dark:to-teal-500 transition-all duration-300 hover:brightness-110 shadow-xs"
                                        title={`${lbl}: ${val} ${data.unit}`}
                                    />
                                    <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-2 truncate w-full text-center">
                                        {lbl}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Accessible Textual Summary */}
                    {data.accessible_summary && (
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                            <p className="leading-relaxed">{data.accessible_summary}</p>
                        </div>
                    )}
                </div>
            )}

            {actions && actions.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                    {actions.map((act) => (
                        <button
                            key={act.id}
                            onClick={() => onAction?.(act)}
                            className="text-xs px-3 py-1.5 rounded-lg font-medium bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition"
                        >
                            {act.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
