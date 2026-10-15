import React from 'react';
import { AlertTriangle, AlertCircle, Info, Send, PhoneCall } from 'lucide-react';
import { VeyoraAlertListData, VeyoraAction } from '@/types/veyora';

interface Props {
    title?: string | null;
    summary?: string;
    data: VeyoraAlertListData;
    actions?: VeyoraAction[];
    onAction?: (action: VeyoraAction) => void;
}

export const VeyoraAlertList: React.FC<Props> = ({ title, summary, data, actions, onAction }) => {
    const getSeverityStyles = (sev: 'critical' | 'warning' | 'info') => {
        switch (sev) {
            case 'critical':
                return {
                    border: 'border-rose-300 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30',
                    icon: <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />,
                    badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200',
                };
            case 'warning':
                return {
                    border: 'border-amber-300 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30',
                    icon: <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />,
                    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
                };
            case 'info':
            default:
                return {
                    border: 'border-blue-300 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/30',
                    icon: <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />,
                    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200',
                };
        }
    };

    return (
        <div className="space-y-3 my-2">
            {title && (
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base">{title}</h3>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300">
                        {data.total_alerts} Active {data.total_alerts === 1 ? 'Alert' : 'Alerts'}
                    </span>
                </div>
            )}

            {summary && <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{summary}</p>}

            <div className="space-y-2.5">
                {data.alerts.map((alert) => {
                    const styles = getSeverityStyles(alert.severity);
                    return (
                        <div
                            key={alert.id}
                            className={`p-3.5 rounded-xl border ${styles.border} flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs`}
                        >
                            <div className="flex items-start gap-2.5">
                                {styles.icon}
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                                            {alert.title}
                                        </h4>
                                        {alert.days_overdue != null && (
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${styles.badge}`}>
                                                {alert.days_overdue} days overdue
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-300">{alert.message}</p>
                                </div>
                            </div>

                            {alert.action && (
                                <div className="shrink-0 pt-1 sm:pt-0">
                                    <button
                                        onClick={() => onAction?.(alert.action!)}
                                        className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-2xs inline-flex items-center gap-1.5 transition"
                                    >
                                        <Send className="w-3 h-3 text-teal-600" />
                                        {alert.action.label}
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
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
