<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Overtime Management System</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/@phosphor-icons/web"></script>
    
    <!-- Base Global Styles -->
    <link rel="stylesheet" href="style.css">
    
    <!-- Component Specific Styles -->
    <link rel="stylesheet" href="header.css">
    <link rel="stylesheet" href="filters.css">
    <link rel="stylesheet" href="stats.css">
    <link rel="stylesheet" href="table.css">

    <!-- Layout Overrides per Viewport -->
    <link rel="stylesheet" href="desktop.css">
    <link rel="stylesheet" href="mobile.css">
</head>
<body>
    <div class="app-container" id="app-root">

<?php 
// Native server-side includes of the standalone HTML component snippets
@include 'header.html';
@include 'filters.html';
@include 'stats.html';
@include 'table.html'; 
?>

    </div><!-- /.app-container -->

    <script src="script.js"></script>
</body>
</html>
