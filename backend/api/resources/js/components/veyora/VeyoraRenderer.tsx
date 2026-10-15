import React from 'react';
import {
    VeyoraStructuredResponse,
    VeyoraAction,
    VeyoraSummaryData,
    VeyoraEntityListData,
    VeyoraTableData,
    VeyoraChartData,
    VeyoraDetailData,
    VeyoraAlertListData,
    VeyoraActionListData,
    VeyoraReportData,
} from '@/types/veyora';
import { VeyoraSummary } from './VeyoraSummary';
import { VeyoraEntityList } from './VeyoraEntityList';
import { VeyoraTable } from './VeyoraTable';
import { VeyoraChart } from './VeyoraChart';
import { VeyoraDetail } from './VeyoraDetail';
import { VeyoraAlertList } from './VeyoraAlertList';
import { VeyoraActionList } from './VeyoraActionList';
import { VeyoraReport } from './VeyoraReport';

interface Props {
    response: VeyoraStructuredResponse;
    onAction?: (action: VeyoraAction) => void;
    onSelectEntity?: (id: string | number) => void;
}

/**
 * Production-ready Adaptive Presentation Renderer for Veyora AI.
 * Selects and renders the appropriate presentation component according to the structured response contract.
 */
export const VeyoraRenderer: React.FC<Props> = ({ response, onAction, onSelectEntity }) => {
    const { presentation, title, response: textResponse, structured_data, actions, pagination } = response;

    // Graceful fallback to pure text if no structured data is provided
    if (!structured_data || presentation === 'text') {
        return (
            <div className="space-y-2">
                <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {textResponse}
                </p>
                {actions && actions.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
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
    }

    switch (presentation) {
        case 'summary':
            return (
                <VeyoraSummary
                    title={title}
                    summary={textResponse}
                    data={structured_data as unknown as VeyoraSummaryData}
                    actions={actions}
                    onAction={onAction}
                />
            );

        case 'entity_list':
            return (
                <VeyoraEntityList
                    title={title}
                    summary={textResponse}
                    data={structured_data as unknown as VeyoraEntityListData}
                    pagination={pagination}
                    actions={actions}
                    onAction={onAction}
                    onSelectEntity={onSelectEntity}
                />
            );

        case 'table':
            return (
                <VeyoraTable
                    title={title}
                    summary={textResponse}
                    data={structured_data as unknown as VeyoraTableData}
                    pagination={pagination}
                    actions={actions}
                    onAction={onAction}
                />
            );

        case 'chart':
            return (
                <VeyoraChart
                    title={title}
                    summary={textResponse}
                    data={structured_data as unknown as VeyoraChartData}
                    actions={actions}
                    onAction={onAction}
                />
            );

        case 'detail':
            return (
                <VeyoraDetail
                    title={title}
                    summary={textResponse}
                    data={structured_data as unknown as VeyoraDetailData}
                    actions={actions}
                    onAction={onAction}
                />
            );

        case 'alert_list':
            return (
                <VeyoraAlertList
                    title={title}
                    summary={textResponse}
                    data={structured_data as unknown as VeyoraAlertListData}
                    actions={actions}
                    onAction={onAction}
                />
            );

        case 'action_list':
            return (
                <VeyoraActionList
                    title={title}
                    summary={textResponse}
                    data={structured_data as unknown as VeyoraActionListData}
                    onAction={onAction}
                />
            );

        case 'report':
            return (
                <VeyoraReport
                    title={title}
                    summary={textResponse}
                    data={structured_data as unknown as VeyoraReportData}
                    actions={actions}
                    onAction={onAction}
                />
            );

        default:
            return (
                <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {textResponse}
                </p>
            );
    }
};
