<?php
header('Content-Type: application/json');
require_once '../../config.php';

// Get JSON input
$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Invalid data payload']);
    exit;
}

$heading = trim($data['heading'] ?? '');
$shortDesc = trim($data['shortDesc'] ?? '');
$longDesc = trim($data['longDesc'] ?? '');

if (empty($heading) || empty($longDesc)) {
    echo json_encode(['success' => false, 'message' => 'Heading and Long Description are required']);
    exit;
}

try {
    // Generate a quick version string
    $version = 'v' . date('Y.m');
    
    // Combine short and long desc into the HTML content, format similarly to existing static policies
    $htmlContent = "<h3>{$heading}</h3>";
    if (!empty($shortDesc)) {
        $htmlContent .= "<p>{$shortDesc}</p>";
    }
    $htmlContent .= "<div>{$longDesc}</div>";
    
    $stmt = $pdo->prepare("INSERT INTO policies (title, short_desc, version, content, is_mandatory) VALUES (?, ?, ?, ?, 1)");
    $stmt->execute([$heading, $shortDesc, $version, $htmlContent]);
    
    echo json_encode(['success' => true, 'message' => 'Policy successfully published!']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
