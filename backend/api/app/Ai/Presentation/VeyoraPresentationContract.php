<?php

namespace App\Ai\Presentation;

use InvalidArgumentException;

/**
 * Standardized presentation contract and runtime validator for Veyora AI responses.
 * Supported presentation types:
 * - text: conversational prose and explanations
 * - summary: KPI tiles and key metrics
 * - entity_list: responsive cards (properties, units, tenants)
 * - table: structured columns and sortable records
 * - chart: validated data series (bar, line, donut) with accessible text
 * - detail: deep entity profile (unit, property, tenancy)
 * - alert_list: urgent overdue rent, maintenance and offline device notices
 * - action_list: direct authorized next steps and workflow triggers
 * - report: executive summary + KPIs + structured subsections
 */
class VeyoraPresentationContract
{
    public const TYPE_TEXT = 'text';
    public const TYPE_SUMMARY = 'summary';
    public const TYPE_ENTITY_LIST = 'entity_list';
    public const TYPE_TABLE = 'table';
    public const TYPE_CHART = 'chart';
    public const TYPE_DETAIL = 'detail';
    public const TYPE_ALERT_LIST = 'alert_list';
    public const TYPE_ACTION_LIST = 'action_list';
    public const TYPE_REPORT = 'report';

    public const SUPPORTED_TYPES = [
        self::TYPE_TEXT,
        self::TYPE_SUMMARY,
        self::TYPE_ENTITY_LIST,
        self::TYPE_TABLE,
        self::TYPE_CHART,
        self::TYPE_DETAIL,
        self::TYPE_ALERT_LIST,
        self::TYPE_ACTION_LIST,
        self::TYPE_REPORT,
    ];

    /**
     * Validate and normalize a response presentation contract.
     *
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public static function validate(array $payload): array
    {
        $type = $payload['presentation'] ?? self::TYPE_TEXT;
        if (! in_array($type, self::SUPPORTED_TYPES, true)) {
            $type = self::TYPE_TEXT;
        }

        return [
            'presentation' => $type,
            'title' => isset($payload['title']) ? (string) $payload['title'] : null,
            'summary' => (string) ($payload['summary'] ?? $payload['response'] ?? ''),
            'data' => isset($payload['data']) && is_array($payload['data']) ? $payload['data'] : null,
            'pagination' => isset($payload['pagination']) && is_array($payload['pagination']) ? $payload['pagination'] : null,
            'actions' => isset($payload['actions']) && is_array($payload['actions']) ? array_values($payload['actions']) : [],
        ];
    }

    /**
     * Build a text response.
     */
    public static function text(string $markdown, array $actions = []): array
    {
        return [
            'presentation' => self::TYPE_TEXT,
            'title' => null,
            'summary' => $markdown,
            'data' => null,
            'pagination' => null,
            'actions' => $actions,
        ];
    }

    /**
     * Build a KPI summary response.
     */
    public static function summary(string $title, string $summary, array $metrics, array $actions = [], ?array $period = null): array
    {
        return [
            'presentation' => self::TYPE_SUMMARY,
            'title' => $title,
            'summary' => $summary,
            'data' => [
                'period' => $period ?: ['label' => 'Current Month', 'currency' => 'TZS'],
                'metrics' => $metrics,
            ],
            'pagination' => null,
            'actions' => $actions,
        ];
    }

    /**
     * Build an entity list response (properties, units, tenants).
     */
    public static function entityList(
        string $title,
        string $summary,
        string $entityType,
        array $items,
        ?array $pagination = null,
        array $actions = []
    ): array {
        return [
            'presentation' => self::TYPE_ENTITY_LIST,
            'title' => $title,
            'summary' => $summary,
            'data' => [
                'entity_type' => $entityType,
                'items' => array_values($items),
            ],
            'pagination' => $pagination,
            'actions' => $actions,
        ];
    }

    /**
     * Build a table response with named columns.
     */
    public static function table(
        string $title,
        string $summary,
        array $columns,
        array $rows,
        ?array $pagination = null,
        array $actions = []
    ): array {
        return [
            'presentation' => self::TYPE_TABLE,
            'title' => $title,
            'summary' => $summary,
            'data' => [
                'columns' => array_values($columns),
                'rows' => array_values($rows),
            ],
            'pagination' => $pagination,
            'actions' => $actions,
        ];
    }

    /**
     * Build a chart response with validated series, labels, and accessible summary.
     */
    public static function chart(
        string $title,
        string $summary,
        string $chartType,
        array $labels,
        array $series,
        string $unit,
        string $accessibleSummary,
        array $actions = []
    ): array {
        $allowed = ['bar', 'line', 'donut', 'pie'];
        $type = in_array($chartType, $allowed, true) ? $chartType : 'bar';

        return [
            'presentation' => self::TYPE_CHART,
            'title' => $title,
            'summary' => $summary,
            'data' => [
                'chart_type' => $type,
                'labels' => array_values($labels),
                'series' => array_values($series),
                'unit' => $unit,
                'accessible_summary' => $accessibleSummary,
            ],
            'pagination' => null,
            'actions' => $actions,
        ];
    }

    /**
     * Build an entity detail response.
     */
    public static function detail(
        string $title,
        string $summary,
        string $entityType,
        array $profile,
        array $sections = [],
        array $actions = []
    ): array {
        return [
            'presentation' => self::TYPE_DETAIL,
            'title' => $title,
            'summary' => $summary,
            'data' => [
                'entity_type' => $entityType,
                'profile' => $profile,
                'sections' => array_values($sections),
            ],
            'pagination' => null,
            'actions' => $actions,
        ];
    }

    /**
     * Build an alert list response (overdue rent, maintenance, utility outage).
     */
    public static function alertList(string $title, string $summary, array $alerts, array $actions = []): array
    {
        return [
            'presentation' => self::TYPE_ALERT_LIST,
            'title' => $title,
            'summary' => $summary,
            'data' => [
                'total_alerts' => count($alerts),
                'alerts' => array_values($alerts),
            ],
            'pagination' => null,
            'actions' => $actions,
        ];
    }

    /**
     * Build an action list response.
     */
    public static function actionList(string $title, string $summary, array $actions): array
    {
        return [
            'presentation' => self::TYPE_ACTION_LIST,
            'title' => $title,
            'summary' => $summary,
            'data' => [
                'actions' => array_values($actions),
            ],
            'pagination' => null,
            'actions' => array_values($actions),
        ];
    }

    /**
     * Build an executive report response.
     */
    public static function report(
        string $title,
        string $executiveSummary,
        array $kpis,
        array $sections,
        array $actions = []
    ): array {
        return [
            'presentation' => self::TYPE_REPORT,
            'title' => $title,
            'summary' => $executiveSummary,
            'data' => [
                'kpis' => array_values($kpis),
                'sections' => array_values($sections),
            ],
            'pagination' => null,
            'actions' => $actions,
        ];
    }
}
