<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\GasType;
use App\Models\CylinderCapacity;
use App\Models\Provider;
use App\Models\Location;
use App\Models\CylinderModel;

class CylinderSeeder extends Seeder
{
    public function run(): void
    {
        // Lookups — nombres exactos como los insertó cada seeder
        $gas      = GasType::where('name', 'Oxígeno Medicinal')->firstOrFail();
        $cap10    = CylinderCapacity::where('value', 10.00)->firstOrFail();
        $linde    = Provider::where('company_name', 'LINDE PERÚ')->firstOrFail();
        $essalud  = Provider::where('company_name', 'ESSALUD')->firstOrFail();
        $praxair  = Provider::where('company_name', 'PRAXAIR')->firstOrFail();
        $warehouse = Location::where('short_code', 'almcen')->firstOrFail();

        // Modelos (tabla nueva normalizada)
        $modelPraxair = CylinderModel::where('name', 'PRAXAIR')->firstOrFail();
        $modelJD      = CylinderModel::where('name', 'JD')->firstOrFail();
        $modelKioshi  = CylinderModel::where('name', 'KIOSHI')->firstOrFail();

        $cylinders = [
            [
                'barcode'             => 'P340033',
                'gas_type_id'         => $gas->id,
                'capacity_id'         => $cap10->id,
                'provider_id'         => $linde->id,       // Dueño: Linde
                'cylinder_model_id'   => $modelPraxair->id,
                'asset_type'          => 'Cylinder',
                'status'              => 'Full',
                'ph_test_date'        => '2021-05-01',
                'current_location_id' => $warehouse->id,
            ],
            [
                'barcode'             => 'K2420115',
                'gas_type_id'         => $gas->id,
                'capacity_id'         => $cap10->id,
                'provider_id'         => $praxair->id,     // Dueño: Praxair
                'cylinder_model_id'   => $modelPraxair->id,
                'asset_type'          => 'Cylinder',
                'status'              => 'Full',
                'ph_test_date'        => '2021-08-01',
                'current_location_id' => $warehouse->id,
            ],
            [
                'barcode'             => 'K4632127',
                'gas_type_id'         => $gas->id,
                'capacity_id'         => $cap10->id,
                'provider_id'         => $essalud->id,     // Dueño: EsSalud
                'cylinder_model_id'   => $modelJD->id,
                'asset_type'          => 'Cylinder',
                'status'              => 'Empty',
                'ph_test_date'        => '2020-05-01',     // PH vencida → ROJO 🔴
                'current_location_id' => $warehouse->id,
            ],
            [
                'barcode'             => 'N832929',
                'gas_type_id'         => $gas->id,
                'capacity_id'         => $cap10->id,
                'provider_id'         => $linde->id,
                'cylinder_model_id'   => $modelKioshi->id,
                'asset_type'          => 'Cylinder',
                'status'              => 'Full',
                'ph_test_date'        => '2016-12-01',     // PH vencida → ROJO 🔴
                'current_location_id' => $warehouse->id,
            ],
        ];

        foreach ($cylinders as $cylinder) {
            DB::table('cylinders')->insert(array_merge($cylinder, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
    }
}
