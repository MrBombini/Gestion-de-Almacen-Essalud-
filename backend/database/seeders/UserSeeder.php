<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            ['code' => '444', 'name' => 'ELISBAN CCOHUA HUAMANGUILLA', 'role' => 'technician'],
            ['code' => '102', 'name' => 'FREDY TICUÑA LAURA', 'role' => 'technician'],
            ['code' => '106', 'name' => 'FERMIN CCASA QUISPE', 'role' => 'technician'],
            ['code' => '103', 'name' => 'MATEO ARELA RAMOS', 'role' => 'technician'],
            ['code' => '111', 'name' => 'KEVIN JHONSON QUISPE HUAMÁN', 'role' => 'technician'],
            ['code' => '001', 'name' => 'INGENIERO ADMINISTRADOR', 'role' => 'engineer'],
        ];

        foreach ($users as $u) {
            DB::table('users')->insert([
                'operator_code' => $u['code'],
                'name' => $u['name'],
                'password' => Hash::make('password123'),
                'role' => $u['role'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
