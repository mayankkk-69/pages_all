<?php
// api_overtime.php
// Basic backend API endpoint using pure PHP to deliver our dummy data array as JSON
header('Content-Type: application/json');

$servername = "localhost";
$username = "root";
$password = "";

try {
    $conn = new PDO("mysql:host=$servername;dbname=crm_app", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Query records sorting by the newest date first
    $stmt = $conn->prepare("SELECT * FROM overtime_records ORDER BY submission_date DESC");
    $stmt->execute();
    
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(["status" => "success", "data" => $results]);

} catch(PDOException $e) {
    // If the database isn't setup yet, gracefully fail without breaking the UI
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
$conn = null;
?>
