import React from 'react';
import { Building, ShieldCheck, Zap, User, FileText } from 'lucide-react';
import { VeyoraDetailData, VeyoraAction } from '@/types/veyora';

interface Props {
    title?: string | null;
    summary?: string;
    data: VeyoraDetailData;
    actions?: VeyoraAction[];
    onAction?: (action: VeyoraAction) => void;
}

export const VeyoraDetail: React.FC<Props> = ({ title, summary, data, actions, onAction }) => {
    return (
        <div className="space-y-4 my-2">
            {title && (
                <div className="border-b border-gray-100 dark:border-gray-800 pb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base">{title}</h3>
                    {summary && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{summary}</p>}
                </div>
            )}

            <div className="p-4 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 shadow-xs space-y-4">
                {/* Header Profile Highlights */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600">
                            <Building className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                                {String(data.profile.unit_number ? `Unit ${data.profile.unit_number}` : data.profile.property_name || 'Profile Details')}
                            </h4>
                            <p className="text-xs text-gray-500">
                                {String(data.profile.property_name || data.profile.district || '')}
                            </p>
                        </div>
                    </div>
                    {data.profile.monthly_rent != null && (
                        <div className="text-right">
                            <span className="text-xs text-gray-400 block font-medium">Monthly Rent</span>
                            <span className="font-bold text-teal-700 dark:text-teal-400 text-base">
                                TZS {Number(data.profile.monthly_rent).toLocaleString()}
                            </span>
                        </div>
                    )}
                </div>

                {/* Subsections Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.sections.map((section, idx) => (
                        <div
                            key={idx}
                            className="p-3 rounded-lg border border-gray-100 dark:border-gray-800/80 bg-gray-50/50 dark:bg-gray-800/30"
                        >
                            <h5 className="font-semibold text-xs text-gray-700 dark:text-gray-300 mb-2 border-b border-gray-200/60 dark:border-gray-800 pb-1">
                                {section.title}
                            </h5>
                            <dl className="space-y-1.5 text-xs">
                                {section.items.map((item, itemIdx) => (
                                    <div key={itemIdx} className="flex justify-between items-baseline gap-2">
                                        <dt className="text-gray-500 dark:text-gray-400 shrink-0">{item.label}</dt>
                                        <dd className="font-medium text-gray-900 dark:text-gray-100 text-right truncate">
                                            {item.value}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    ))}
                </div>
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
