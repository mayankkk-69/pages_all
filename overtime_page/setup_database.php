<?php
// setup_database.php
// Visit this script in your browser to automatically create your database and table!

$servername = "localhost";
$username = "root";   // default XAMPP username
$password = "";       // default XAMPP password is empty

try {
    // 1. Connect to MySQL without a database to create the database itself
    $conn = new PDO("mysql:host=$servername", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // 2. Create Database
    $sql = "CREATE DATABASE IF NOT EXISTS crm_app";
    $conn->exec($sql);
    
    // Use the database
    $conn->exec("USE crm_app");
    
    // 3. Create Table
    $tableSql = "CREATE TABLE IF NOT EXISTS overtime_records (
        id INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        submission_date DATE NOT NULL,
        end_time TIME NOT NULL,
        punch_out_time TIME NOT NULL,
        calculated_ot DECIMAL(5,2) NOT NULL,
        accepted_ot DECIMAL(5,2) NULL,
        work_report TEXT NOT NULL,
        overtime_report TEXT NOT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    $conn->exec($tableSql);
    
    // 4. Clean out any old mock data to avoid endless duplicates
    $conn->exec("TRUNCATE TABLE overtime_records");

    // 5. Insert Dummy Data (using your March 2026 example timeframe!)
    $insertSql = "INSERT INTO overtime_records (submission_date, end_time, punch_out_time, calculated_ot, accepted_ot, work_report, overtime_report, status) VALUES 
        ('2026-03-24', '18:00:00', '20:30:00', 2.50, NULL, 'Completed critical monthly financial reconciling for Q1', 'Stayed late to finish financial reconciliation before strict deadline.', 'pending'),
        ('2026-03-22', '18:00:00', '22:00:00', 4.00, 4.00, 'Bug fixing on production server mapping module', 'Deployed critical hotfix for Google Maps integration.', 'approved'),
        ('2026-03-20', '18:00:00', '19:15:00', 1.25, 0.00, 'Waited for key client meeting setup', 'Client arrived exceptionally late to the scheduled evening meeting.', 'rejected'),
        ('2026-03-12', '18:00:00', '19:00:00', 1.00, 1.00, 'Q2 Documentation drafting and review', 'Wrote system documentation specifications alongside the core dev team.', 'approved'),
        ('2026-02-28', '18:00:00', '21:30:00', 3.50, 3.50, 'Emergency server maintenance', 'Updated SSL certificates internally.', 'approved')
    ";
    $conn->exec($insertSql);
    
    echo "<h2>✅ Success! The 'crm_app' database and 'overtime_records' dummy data have been injected.</h2>";
    echo "<p>You can now go back your overtime page and the table will fetch and display perfectly.</p>";

} catch(PDOException $e) {
    echo "<h2>❌ Database Error Setup:</h2><p>" . $e->getMessage() . "</p>";
    echo "<p>Make sure your XAMPP Apache <b>AND</b> MySQL services are actively running.</p>";
}
$conn = null;
?>
