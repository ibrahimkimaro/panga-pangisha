<?php

namespace App\Http\Controllers;

abstract class Controller
{
    /**
     * Streams rows as a CSV download. Cells that a spreadsheet would run as a formula (=, +, -, @) get a leading
     * apostrophe, which also keeps phone numbers like +255... as text.
     */
    protected function csv(string $filename, array $head, iterable $rows)
    {
        return response()->streamDownload(function () use ($head, $rows) {
            $out = fopen('php://output', 'w');
            fputcsv($out, $head, escape: '');
            foreach ($rows as $row) {
                fputcsv($out, array_map(fn ($v) => is_string($v) && preg_match('/^[=+\-@]/', $v) ? "'" . $v : $v, $row), escape: '');
            }
            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv; charset=utf-8']);
    }
}
