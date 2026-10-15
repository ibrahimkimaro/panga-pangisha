import React from 'react';
import { FileBarChart, CheckCircle } from 'lucide-react';
import { VeyoraReportData, VeyoraAction } from '@/types/veyora';
import { VeyoraTable } from './VeyoraTable';

interface Props {
    title?: string | null;
    summary?: string;
    data: VeyoraReportData;
    actions?: VeyoraAction[];
    onAction?: (action: VeyoraAction) => void;
}

export const VeyoraReport: React.FC<Props> = ({ title, summary, data, actions, onAction }) => {
    return (
        <div className="space-y-4 my-2">
            <div className="border-b border-gray-100 dark:border-gray-800 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FileBarChart className="w-5 h-5 text-teal-600" />
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base">
                        {title || 'Veyora Executive Report'}
                    </h3>
                </div>
            </div>

            {summary && (
                <div className="p-3.5 rounded-xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-900/40 text-xs text-teal-950 dark:text-teal-200 leading-relaxed">
                    {summary}
                </div>
            )}

            {data.kpis && data.kpis.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {data.kpis.map((kpi, idx) => (
                        <div
                            key={idx}
                            className="p-3 rounded-lg border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900"
                        >
                            <span className="text-[11px] text-gray-500 block truncate">{kpi.label}</span>
                            <span className="font-bold text-sm text-gray-900 dark:text-gray-100">{kpi.value}</span>
                        </div>
                    ))}
                </div>
            )}

            <div className="space-y-4">
                {data.sections.map((section, idx) => (
                    <div key={idx} className="space-y-2">
                        <h4 className="font-semibold text-xs text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                            {section.title}
                        </h4>
                        {section.content && <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{section.content}</p>}
                        {section.table && (
                            <VeyoraTable
                                data={section.table}
                                onAction={onAction}
                            />
                        )}
                    </div>
                ))}
            </div>

            {actions && actions.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
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
