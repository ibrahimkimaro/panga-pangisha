import React from 'react';
import { ArrowDownRight, ArrowUpRight, AlertCircle, Banknote, Calendar, CheckCircle2 } from 'lucide-react';
import { VeyoraSummaryData, VeyoraAction } from '@/types/veyora';

interface Props {
    title?: string | null;
    summary?: string;
    data: VeyoraSummaryData;
    actions?: VeyoraAction[];
    onAction?: (action: VeyoraAction) => void;
}

export const VeyoraSummary: React.FC<Props> = ({ title, summary, data, actions, onAction }) => {
    const getIcon = (iconName?: string) => {
        switch (iconName) {
            case 'banknotes':
                return <Banknote className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
            case 'alert':
                return <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
            case 'calendar':
                return <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
            default:
                return <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />;
        }
    };

    return (
        <div className="space-y-4 my-2">
            {title && (
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base">{title}</h3>
                    {data.period && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-medium">
                            {data.period.label} ({data.period.currency})
                        </span>
                    )}
                </div>
            )}

            {summary && <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{summary}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.metrics.map((metric, idx) => (
                    <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 shadow-xs hover:border-teal-500/40 transition-colors"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{metric.label}</span>
                            <div className="p-1.5 rounded-lg bg-gray-50 dark:bg-gray-800/80">{getIcon(metric.icon)}</div>
                        </div>
                        <div className="flex items-baseline justify-between gap-2">
                            <span className="text-lg font-bold text-gray-900 dark:text-gray-50 tracking-tight">{metric.value}</span>
                            {metric.trend && (
                                <span
                                    className={`inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded ${
                                        metric.direction === 'up'
                                            ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40'
                                            : metric.direction === 'warning'
                                            ? 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/40'
                                            : 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800'
                                    }`}
                                >
                                    {metric.direction === 'up' && <ArrowUpRight className="w-3 h-3 mr-0.5" />}
                                    {metric.direction === 'down' && <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                                    {metric.trend}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

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
