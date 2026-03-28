<?php
// ============================================================
//  Database Configuration — XAMPP / localhost
// ============================================================

define('DB_HOST',     'localhost');
define('DB_PORT',     3306);
define('DB_NAME',     'crm_leave');
define('DB_USER',     'root');      // XAMPP default
define('DB_PASS',     '');          // XAMPP default (blank password)
define('DB_CHARSET',  'utf8mb4');

/**
 * Returns a PDO connection.  Throws on failure so the API can
 * return a clean JSON error instead of an HTML stack trace.
 */
function getDB(): PDO {
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=%s',
        DB_HOST, DB_PORT, DB_NAME, DB_CHARSET
    );

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    } catch (PDOException $e) {
        // Return JSON error and stop — never expose raw DB errors to the client
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Database connection failed. Check db/db.php settings.',
            'error'   => $e->getMessage()   // remove this line in production!
        ]);
        exit;
    }

    return $pdo;
}
