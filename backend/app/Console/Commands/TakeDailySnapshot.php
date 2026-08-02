<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Cylinder;
use App\Models\DailySnapshot;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class TakeDailySnapshot extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'snapshot:take {--date= : The date of the snapshot (YYYY-MM-DD)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Take a daily snapshot of the cylinder inventory for Kardex reporting';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // El kardex considera un "día" desde 7AM hasta 7AM. 
        // Si corremos esto a las 07:00 AM de hoy, el snapshot le pertenece a AYER.
        $targetDate = $this->option('date') ? Carbon::parse($this->option('date'))->toDateString() : Carbon::yesterday()->toDateString();
        
        $this->info("Taking inventory snapshot for date: {$targetDate}");

        $fullStock = Cylinder::where('status', 'full')
            ->select('location', 'capacity', 'ownership_type_id', 'supplier_id', DB::raw('count(*) as total'))
            ->groupBy('location', 'capacity', 'ownership_type_id', 'supplier_id')
            ->with(['ownershipType', 'supplier'])
            ->get();

        $emptyStock = Cylinder::where('status', 'empty')
            ->select('location', 'capacity', 'ownership_type_id', 'supplier_id', DB::raw('count(*) as total'))
            ->groupBy('location', 'capacity', 'ownership_type_id', 'supplier_id')
            ->with(['ownershipType', 'supplier'])
            ->get();

        $snapshotData = [
            'full' => $fullStock->toArray(),
            'empty' => $emptyStock->toArray(),
            'timestamp' => Carbon::now()->toIso8601String()
        ];

        DailySnapshot::updateOrCreate(
            ['date' => $targetDate],
            ['snapshot_data' => $snapshotData]
        );

        $this->info("Snapshot saved successfully.");
        return 0;
    }
}
