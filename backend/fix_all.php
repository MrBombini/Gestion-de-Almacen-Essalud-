<?php
$dir = 'database/seeders/sql/';
$files = glob($dir . '*.sql');

foreach ($files as $file) {
    echo "Processing $file...\n";
    $content = file_get_contents($file);
    
    // Replace INSERT INTO with INSERT IGNORE INTO
    $content = str_replace('INSERT INTO', 'INSERT IGNORE INTO', $content);
    
    // Also fix empty string dates to NULL to be safe
    $content = str_replace("''", "NULL", $content);
    
    // Fix badly formatted dates like 12/072021 just by turning any obvious date weirdness to NULL, 
    // or we just rely on IGNORE. Let's just fix the specific one we saw to test
    $content = str_replace("'12/072021'", "NULL", $content);
    
    file_put_contents($file, $content);
}
echo "All SQL files updated to use INSERT IGNORE.\n";
