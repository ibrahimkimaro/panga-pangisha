import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { VeyoraActionListData, VeyoraAction } from '@/types/veyora';

interface Props {
    title?: string | null;
    summary?: string;
    data: VeyoraActionListData;
    onAction?: (action: VeyoraAction) => void;
}

export const VeyoraActionList: React.FC<Props> = ({ title, summary, data, onAction }) => {
    return (
        <div className="space-y-3 my-2">
            {title && (
                <div className="border-b border-gray-100 dark:border-gray-800 pb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base">{title}</h3>
                    {summary && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{summary}</p>}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {data.actions.map((act) => (
                    <button
                        key={act.id}
                        onClick={() => onAction?.(act)}
                        className="p-3 rounded-xl border border-teal-200/80 dark:border-teal-900/60 bg-teal-50/50 dark:bg-teal-950/20 hover:bg-teal-100/60 dark:hover:bg-teal-900/40 text-left transition flex items-center justify-between group shadow-2xs"
                    >
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                            <span className="text-xs font-semibold text-teal-900 dark:text-teal-100">{act.label}</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-teal-600 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                ))}
            </div>
        </div>
    );
};
