<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Administrator
        User::updateOrCreate(
            ['operator_code' => 'ADMIN01'],
            [
                'name'          => 'System Administrator',
                'password'      => Hash::make('password'),
                'role'          => 'Administrator',
                'status'        => 'active'
            ]
        );

        // 2. Engineer
        User::updateOrCreate(
            ['operator_code' => 'ENG001'],
            [
                'name'          => 'Chief Engineer',
                'password'      => Hash::make('password'),
                'role'          => 'Engineer',
                'status'        => 'active'
            ]
        );

        // 3. Operators
        User::updateOrCreate(
            ['operator_code' => 'OP001'],
            [
                'name'          => 'John Doe Operator',
                'password'      => Hash::make('password'),
                'role'          => 'Operator',
                'status'        => 'active'
            ]
        );

        User::updateOrCreate(
            ['operator_code' => 'OP002'],
            [
                'name'          => 'Jane Smith Operator',
                'password'      => Hash::make('password'),
                'role'          => 'Operator',
                'status'        => 'active'
            ]
        );
    }
}
