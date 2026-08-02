<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;

// Take a snapshot every day at 07:00 AM (End of Night Shift)
Schedule::command('snapshot:take')->dailyAt('07:00');
