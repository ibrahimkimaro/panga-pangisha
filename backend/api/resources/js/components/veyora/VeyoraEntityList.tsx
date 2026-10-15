import React, { useState } from 'react';
import { Home, BedDouble, ChevronRight, MapPin, Tag } from 'lucide-react';
import { VeyoraEntityListData, VeyoraAction, VeyoraPagination } from '@/types/veyora';

interface Props {
    title?: string | null;
    summary?: string;
    data: VeyoraEntityListData;
    pagination?: VeyoraPagination | null;
    actions?: VeyoraAction[];
    onAction?: (action: VeyoraAction) => void;
    onSelectEntity?: (id: string | number) => void;
}

export const VeyoraEntityList: React.FC<Props> = ({
    title,
    summary,
    data,
    pagination,
    actions,
    onAction,
    onSelectEntity,
}) => {
    const [expandedId, setExpandedId] = useState<string | number | null>(null);

    const getStatusBadge = (status?: string) => {
        switch (status?.toLowerCase()) {
            case 'available':
            case 'vacant':
                return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
            case 'occupied':
            case 'active':
                return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800';
            case 'maintenance':
                return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800';
            default:
                return 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
        }
    };

    return (
        <div className="space-y-4 my-2">
            {title && (
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base">{title}</h3>
                    <span className="text-xs text-gray-500 font-medium">
                        {data.items.length} {data.entity_type}s
                    </span>
                </div>
            )}

            {summary && <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{summary}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.items.map((item) => {
                    const isExpanded = expandedId === item.id;
                    return (
                        <div
                            key={item.id}
                            className={`rounded-xl border transition-all duration-150 p-3.5 bg-white/80 dark:bg-gray-900/70 shadow-2xs ${
                                isExpanded
                                    ? 'border-teal-500 ring-1 ring-teal-500/20'
                                    : 'border-gray-200/80 dark:border-gray-800 hover:border-teal-400/40'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-50">{item.title}</h4>
                                        {item.badge && (
                                            <span
                                                className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${getStatusBadge(
                                                    item.status || item.badge
                                                )}`}
                                            >
                                                {item.badge}
                                            </span>
                                        )}
                                    </div>
                                    {item.subtitle && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                            <MapPin className="w-3 h-3 text-gray-400" />
                                            {item.subtitle}
                                        </p>
                                    )}
                                </div>
                                {item.price && (
                                    <div className="text-right shrink-0">
                                        <span className="font-bold text-sm text-teal-700 dark:text-teal-400">{item.price}</span>
                                    </div>
                                )}
                            </div>

                            {item.specs && (
                                <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <BedDouble className="w-3.5 h-3.5 text-gray-400" />
                                        {item.specs}
                                    </span>
                                    <button
                                        onClick={() => {
                                            setExpandedId(isExpanded ? null : item.id);
                                            onSelectEntity?.(item.id);
                                        }}
                                        className="text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center gap-0.5 font-medium"
                                    >
                                        {isExpanded ? 'Less' : 'Details'}
                                        <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                    </button>
                                </div>
                            )}

                            {isExpanded && item.actions && item.actions.length > 0 && (
                                <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-2">
                                    {item.actions.map((act) => (
                                        <button
                                            key={act.id}
                                            onClick={() => onAction?.(act)}
                                            className="text-xs px-2.5 py-1 rounded bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/50 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 font-medium"
                                        >
                                            {act.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {pagination && pagination.last_page > 1 && (
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <span>
                        Page {pagination.current_page} of {pagination.last_page} ({pagination.total} total)
                    </span>
                    <div className="space-x-1">
                        <button
                            disabled={pagination.current_page <= 1}
                            className="px-2.5 py-1 rounded border border-gray-200 dark:border-gray-800 disabled:opacity-40"
                        >
                            Previous
                        </button>
                        <button
                            disabled={pagination.current_page >= pagination.last_page}
                            className="px-2.5 py-1 rounded border border-gray-200 dark:border-gray-800 disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
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
