<?php
header('Content-Type: application/json');  // Set response type to JSON

// Check if request is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Only POST requests allowed']);
    exit;
}

// Get raw POST data
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Basic validation: Ensure data is not empty
if (empty($data)) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid or empty data']);
    exit;
}

// Define the data directory (adjust path if needed)
$dataDir = __DIR__ . '/data/';

// Ensure the data directory exists and is writable
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}
if (!is_writable($dataDir)) {
    http_response_code(500);
    echo json_encode(['message' => 'Data directory not writable']);
    exit;
}

// Generate a unique filename (e.g., data_20251123_123456.json)
$filename = 'data_' . date('Ymd_His') . '.json';
$filePath = $dataDir . $filename;

// Save the data to file
if (file_put_contents($filePath, json_encode($data, JSON_PRETTY_PRINT))) {
    http_response_code(200);
    echo json_encode(['message' => 'Data saved successfully', 'file' => $filename]);
} else {
    http_response_code(500);
    echo json_encode(['message' => 'Failed to save data']);
}
?>