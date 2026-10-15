import React, { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Download } from 'lucide-react';
import { VeyoraTableData, VeyoraAction, VeyoraPagination, TableColumn } from '@/types/veyora';

interface Props {
    title?: string | null;
    summary?: string;
    data: VeyoraTableData;
    pagination?: VeyoraPagination | null;
    actions?: VeyoraAction[];
    onAction?: (action: VeyoraAction) => void;
}

export const VeyoraTable: React.FC<Props> = ({
    title,
    summary,
    data,
    pagination,
    actions,
    onAction,
}) => {
    const [sortCol, setSortCol] = useState<string | null>(null);
    const [sortAsc, setSortAsc] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>('');

    const handleSort = (key: string) => {
        if (sortCol === key) {
            setSortAsc(!sortAsc);
        } else {
            setSortCol(key);
            setSortAsc(true);
        }
    };

    const filteredRows = useMemo(() => {
        let rows = [...data.rows];
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            rows = rows.filter((r) =>
                Object.values(r).some((val) => String(val).toLowerCase().includes(q))
            );
        }
        if (sortCol) {
            rows.sort((a, b) => {
                const valA = a[sortCol];
                const valB = b[sortCol];
                if (typeof valA === 'number' && typeof valB === 'number') {
                    return sortAsc ? valA - valB : valB - valA;
                }
                const strA = String(valA ?? '').toLowerCase();
                const strB = String(valB ?? '').toLowerCase();
                return sortAsc ? strA.localeCompare(strB) : strB.localeCompare(strA);
            });
        }
        return rows;
    }, [data.rows, sortCol, sortAsc, searchQuery]);

    const formatCell = (val: unknown, col: TableColumn) => {
        if (val === null || val === undefined) return <span className="text-gray-400">—</span>;
        if (col.format === 'currency') {
            const num = Number(val);
            return isNaN(num) ? String(val) : `TZS ${num.toLocaleString()}`;
        }
        if (col.format === 'badge') {
            const str = String(val).toLowerCase();
            const colorClass =
                str === 'active' || str === 'available' || str === 'vacant'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : str === 'pending' || str === 'warning'
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
            return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${colorClass}`}>{String(val)}</span>;
        }
        return String(val);
    };

    return (
        <div className="space-y-3 my-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
                <div>
                    {title && <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base">{title}</h3>}
                    {summary && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{summary}</p>}
                </div>
                {data.rows.length > 5 && (
                    <div className="relative w-full sm:w-48">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Filter records..."
                            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                    </div>
                )}
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                    <thead>
                        <tr className="border-b border-gray-200/80 dark:border-gray-800 bg-gray-50/75 dark:bg-gray-800/50">
                            {data.columns.map((col) => (
                                <th
                                    key={col.key}
                                    onClick={() => handleSort(col.key)}
                                    className={`py-2.5 px-3.5 font-semibold text-gray-700 dark:text-gray-300 cursor-pointer select-none hover:bg-gray-100/50 dark:hover:bg-gray-800/80 transition-colors ${
                                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                                    }`}
                                >
                                    <div
                                        className={`inline-flex items-center gap-1 ${
                                            col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'
                                        }`}
                                    >
                                        <span>{col.label}</span>
                                        {sortCol === col.key ? (
                                            sortAsc ? (
                                                <ArrowUp className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                                            ) : (
                                                <ArrowDown className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                                            )
                                        ) : (
                                            <ArrowUpDown className="w-3 h-3 opacity-30" />
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                        {filteredRows.length === 0 ? (
                            <tr>
                                <td colSpan={data.columns.length} className="py-8 text-center text-gray-400">
                                    No records match your search filter.
                                </td>
                            </tr>
                        ) : (
                            filteredRows.map((row, rowIdx) => (
                                <tr
                                    key={rowIdx}
                                    className="hover:bg-teal-50/30 dark:hover:bg-teal-950/20 transition-colors"
                                >
                                    {data.columns.map((col) => (
                                        <td
                                            key={col.key}
                                            className={`py-2.5 px-3.5 text-gray-800 dark:text-gray-200 ${
                                                col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                                            }`}
                                        >
                                            {formatCell(row[col.key], col)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {pagination && pagination.last_page > 1 && (
                <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                    <span>
                        Showing {filteredRows.length} of {pagination.total} records
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
