<?php
// ============================================
// get_policies.php — Fetch all policies for HR
// ============================================
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../../config.php'; // Uses employee_dashboard_db PDO

try {
    $stmt = $pdo->query(
        "SELECT id, title AS heading, short_desc, content AS long_desc, created_at AS updated_at 
         FROM policies 
         ORDER BY created_at DESC"
    );
    $policies = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Polyfill is_active for frontend compatibility
    foreach ($policies as &$p) {
        $p['is_active'] = 1;
    }

    echo json_encode([
        'success' => true,
        'data' => $policies
    ]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error']);
}
