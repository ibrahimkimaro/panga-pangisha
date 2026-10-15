export type PresentationType =
    | 'text'
    | 'summary'
    | 'entity_list'
    | 'table'
    | 'chart'
    | 'detail'
    | 'alert_list'
    | 'action_list'
    | 'report';

export interface VeyoraAction {
    id: string;
    label: string;
    type: 'navigate' | 'message' | 'mcp_call' | 'url';
    payload?: Record<string, unknown>;
}

export interface VeyoraPagination {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
}

export interface MetricItem {
    label: string;
    value: string;
    raw_value?: number;
    trend?: string;
    direction?: 'up' | 'down' | 'warning' | 'neutral';
    icon?: string;
}

export interface VeyoraSummaryData {
    period?: { label: string; currency: string };
    metrics: MetricItem[];
}

export interface EntityItem {
    id: number | string;
    title: string;
    subtitle?: string;
    badge?: string;
    status?: string;
    price?: string;
    specs?: string;
    image_url?: string | null;
    actions?: VeyoraAction[];
}

export interface VeyoraEntityListData {
    entity_type: 'property' | 'unit' | 'tenant' | string;
    items: EntityItem[];
}

export interface TableColumn {
    key: string;
    label: string;
    align?: 'left' | 'center' | 'right';
    format?: 'currency' | 'date' | 'badge' | 'text';
}

export interface VeyoraTableData {
    columns: TableColumn[];
    rows: Record<string, unknown>[];
}

export interface ChartSeries {
    name: string;
    data: number[];
    color?: string;
}

export interface VeyoraChartData {
    chart_type: 'bar' | 'line' | 'donut' | 'pie';
    labels: string[];
    series: ChartSeries[];
    unit: string;
    accessible_summary: string;
}

export interface DetailSectionItem {
    label: string;
    value: string;
}

export interface DetailSection {
    title: string;
    type: 'key_value' | 'list' | 'text';
    items: DetailSectionItem[];
}

export interface VeyoraDetailData {
    entity_type: string;
    profile: Record<string, unknown>;
    sections: DetailSection[];
}

export interface AlertItem {
    id: string;
    severity: 'critical' | 'warning' | 'info';
    category?: string;
    title: string;
    message: string;
    amount_due?: number;
    currency?: string;
    days_overdue?: number;
    action?: VeyoraAction;
}

export interface VeyoraAlertListData {
    total_alerts: number;
    alerts: AlertItem[];
}

export interface VeyoraActionListData {
    actions: VeyoraAction[];
}

export interface VeyoraReportData {
    kpis: MetricItem[];
    sections: {
        title: string;
        content?: string;
        table?: VeyoraTableData;
    }[];
}

export interface VeyoraStructuredResponse {
    conversation_id?: string;
    response: string;
    route?: string;
    presentation: PresentationType;
    title?: string | null;
    structured_data?: Record<string, unknown> | null;
    actions?: VeyoraAction[];
    pagination?: VeyoraPagination | null;
    latency_ms?: number;
    usage?: { input_tokens: number; output_tokens: number };
    tools_invoked?: string[];
}
