<?php
$file = 'database/seeders/sql/pacientes.sql';
$lines = file($file);
$seen_ids = [];
$seen_dnis = [];
$output = [];

foreach ($lines as $line) {
    if (trim($line) === '') continue;
    
    // Check for null full_name
    if (strpos($line, 'VALUES (null, null') !== false || strpos($line, 'VALUES (NULL, NULL') !== false) {
        continue; // Skip completely null rows
    }
    
    // Extract ID
    preg_match("/VALUES \('(\d+)'/", $line, $id_matches);
    if (!empty($id_matches[1])) {
        $id = $id_matches[1];
        if (isset($seen_ids[$id])) {
            continue; // Skip duplicate ID
        }
        $seen_ids[$id] = true;
    }
    
    // Extract DNI (it's the 3rd value: VALUES ('id', 'name', 'dni')
    preg_match("/VALUES \([^,]+, [^,]+, (?:'([^']+)'|null|NULL)/", $line, $dni_matches);
    if (!empty($dni_matches[1])) {
        $dni = $dni_matches[1];
        if ($dni !== 'NULL' && $dni !== 'null' && isset($seen_dnis[$dni])) {
            continue; // Skip duplicate DNI
        }
        if ($dni !== 'NULL' && $dni !== 'null') {
            $seen_dnis[$dni] = true;
        }
    }

    $output[] = $line;
}

file_put_contents($file, implode("", $output));
echo "Cleaned pacientes.sql. Removed duplicate IDs and DNIs.\n";
