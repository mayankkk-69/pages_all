<?php
// ============================================================
//  CRM  Leave Management  —  REST API  (MySQL edition)
// ============================================================
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle pre-flight OPTIONS request (CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__ . '/../db/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

// ─── Helper: unique id ────────────────────────────────────────
function newId(): string {
    return bin2hex(random_bytes(8)); // 16-char hex
}

// ─── Helper: format a DB row for the frontend ────────────────
function formatRow(array $row): array {
    // Build the "date" field the frontend expects: "YYYY-MM-DD" or "YYYY-MM-DD to YYYY-MM-DD"
    $dateStr = $row['from_date'];
    if ($row['to_date'] && $row['to_date'] !== $row['from_date']) {
        $dateStr .= ' to ' . $row['to_date'];
    }
    return [
        'id'                => $row['id'],
        'date'              => $dateStr,
        'leaveType'         => $row['leave_type'],
        'duration'          => $row['duration'],
        'status'            => $row['status'],
        'managerStatus'     => $row['manager_status'],
        'reason'            => $row['reason'],
        'approver'          => $row['approver'],
        // Legacy classes kept for any old code that may read them
        'statusClass'       => statusClass($row['status']),
        'managerStatusClass'=> statusClass($row['manager_status']),
    ];
}

function statusClass(string $s): string {
    return match($s) {
        'Approved'        => 'status-green',
        'Rejected'        => 'status-red',
        'Pending'         => 'status-gray',
        default           => 'status-yellow',
    };
}

// ─────────────────────────────────────────────────────────────
// GET  — return all records (or filter by year-month)
// ─────────────────────────────────────────────────────────────
if ($method === 'GET') {
    $stmt = $db->query(
        "SELECT * FROM leave_applications ORDER BY created_at DESC"
    );
    $rows = $stmt->fetchAll();
    echo json_encode(array_map('formatRow', $rows));
    exit;
}

// ─────────────────────────────────────────────────────────────
// POST  — create a new leave application
// ─────────────────────────────────────────────────────────────
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['from_date']) || empty($input['reason'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing required fields: from_date, reason.']);
        exit;
    }

    $id        = newId();
    $fromDate  = $input['from_date'];
    $toDate    = $input['to_date']    ?? $fromDate;
    $leaveType = $input['leave_type'] ?? 'Casual Leave';
    $duration  = round(floatval($input['duration'] ?? 1), 2);
    $reason    = trim($input['reason']);
    $approver  = $input['approver']   ?? 'Yojna Sharma (Senior Manager - Studio)';

    $stmt = $db->prepare("
        INSERT INTO leave_applications
            (id, from_date, to_date, leave_type, duration, status, manager_status, reason, approver)
        VALUES
            (:id, :from, :to, :type, :dur, 'Pending', 'No Action Taken', :reason, :approver)
    ");
    $stmt->execute([
        ':id'       => $id,
        ':from'     => $fromDate,
        ':to'       => $toDate,
        ':type'     => $leaveType,
        ':dur'      => $duration,
        ':reason'   => $reason,
        ':approver' => $approver,
    ]);

    $new = $db->query("SELECT * FROM leave_applications WHERE id = '$id'")->fetch();
    echo json_encode([
        'success' => true,
        'message' => 'Leave application submitted successfully!',
        'entry'   => formatRow($new)
    ]);
    exit;
}

// ─────────────────────────────────────────────────────────────
// PUT  — update reason / dates of a pending leave
// ─────────────────────────────────────────────────────────────
if ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing id for update.']);
        exit;
    }

    $id       = $input['id'];
    $reason   = trim($input['reason']    ?? '');
    $fromDate = $input['from_date'] ?? null;
    $toDate   = $input['to_date']   ?? null;

    // Only allow editing Pending records
    $check = $db->prepare("SELECT status FROM leave_applications WHERE id = :id");
    $check->execute([':id' => $id]);
    $row = $check->fetch();

    if (!$row) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Record not found.']);
        exit;
    }
    if ($row['status'] === 'Approved') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Approved leaves cannot be edited.']);
        exit;
    }

    $stmt = $db->prepare("
        UPDATE leave_applications
        SET reason    = :reason,
            from_date = :from,
            to_date   = :to
        WHERE id = :id
    ");
    $stmt->execute([
        ':reason' => $reason,
        ':from'   => $fromDate,
        ':to'     => $toDate ?? $fromDate,
        ':id'     => $id,
    ]);

    echo json_encode(['success' => true, 'message' => 'Leave application updated successfully!']);
    exit;
}

// ─────────────────────────────────────────────────────────────
// DELETE  — remove a leave application
// ─────────────────────────────────────────────────────────────
if ($method === 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing id for deletion.']);
        exit;
    }

    $stmt = $db->prepare("DELETE FROM leave_applications WHERE id = :id AND status != 'Approved'");
    $stmt->execute([':id' => $input['id']]);

    if ($stmt->rowCount() === 0) {
        echo json_encode(['success' => false, 'message' => 'Record not found or is Approved (cannot delete).']);
    } else {
        echo json_encode(['success' => true, 'message' => 'Leave application deleted successfully!']);
    }
    exit;
}

// ─── Method not allowed ───────────────────────────────────────
http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
