<?php

/** Providers the admin can pick and the model each one uses unless the admin overrides it. Keys are in config/ai.php (env). */
return [
    'providers' => [
        'gemini' => ['label' => 'Google Gemini', 'model' => env('GEMINI_MODEL', 'gemini-3.1-flash-lite'), 'local' => false],
        'openai' => ['label' => 'OpenAI', 'model' => env('OPENAI_MODEL', 'gpt-4o-mini'), 'local' => false],
        'anthropic' => ['label' => 'Anthropic', 'model' => env('ANTHROPIC_MODEL'), 'local' => false],
        'ollama' => ['label' => 'Ollama (local model)', 'model' => env('OLLAMA_MODEL'), 'local' => true],
        'openai-compatible' => ['label' => 'OpenAI-compatible (local server)', 'model' => env('OPENAI_COMPATIBLE_MODEL'), 'local' => true],
    ],
];
