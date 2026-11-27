<?php
$file = 'database/seeders/sql/prescriptions.sql';
if (file_exists($file)) {
    $content = file_get_contents($file);
    
    // Fix empty strings to NULL
    $content = str_replace("''", "NULL", $content);
    
    // Fix MM/DD/YYYY to YYYY-MM-DD
    $content = preg_replace_callback("/'(\d{2})\/(\d{2})\/(\d{4})'/", function($matches) {
        return "'" . $matches[3] . "-" . $matches[1] . "-" . $matches[2] . "'";
    }, $content);
    
    file_put_contents($file, $content);
    echo "Cleaned prescriptions.sql (fixed dates)\n";
}
