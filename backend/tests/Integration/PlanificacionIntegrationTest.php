<?php

namespace Tests\Integration;

use App\Models\Cylinder;
use App\Models\OwnershipType;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\Service;
use App\Models\Supplier;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * 3.3.3.B — Pruebas de Integración (Flujos Transaccionales entre Módulos)
 * Tabla 28 de PLANIFICACION_PROYECTO_3.3.md (PI-01 a PI-05)
 */
class PlanificacionIntegrationTest extends TestCase
{
    use RefreshDatabase;

    private User $operator;
    private Supplier $supplier;
    private OwnershipType $ownership;

    protected function setUp(): void
    {
        parent::setUp();

        // Fijamos una hora dentro de la ventana diurna (10:00 AM) para que fecha real == fecha operativa Kardex
        Carbon::setTestNow(Carbon::create(2026, 11, 19, 10, 0, 0, 'America/Lima'));

        $this->operator = User::create([
            'operator_code' => 'OP-INT-01',
            'name'          => 'Operador Integración',
            'password'      => 'secret123',
            'role'          => 'Operator',
            'status'        => 'active',
        ]);

        $this->supplier = Supplier::create([
            'name' => 'Linde-Praxair',
            'ruc'  => '20100128056',
        ]);

        $this->ownership = OwnershipType::create([
            'name' => 'Propio EsSalud',
        ]);

        Sanctum::actingAs($this->operator);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    /**
     * PI-01: Inventario (Exchange) + Catálogo de Balones + Kardex + Borradores
     * Escenario: Registro de canje para Servicio de Emergencia (salida de 3 balones llenos de 10 m³
     * y retorno de 3 balones vacíos de 10 m³).
     * Esperado:
     * 1. Se crean los movimientos y sus detalles.
     * 2. Los 3 balones salientes pasan a ubicación HOSPITALIZACION asignados a Emergencia.
     * 3. Los 3 balones entrantes pasan a CENTRAL en estado empty (Vacío).
     * 4. Se elimina el borrador temporal.
     * 5. El Kardex / Dashboard de Consumo refleja +30 m³ despachados a HNAGV.
     */
    public function test_pi_01_canje_emergencia_actualiza_balones_limpia_borrador_e_impacta_kardex(): void
    {
        $emergencia = Service::create([
            'name'         => 'Emergencia',
            'type'         => 'Hospital',
            'abbreviation' => 'EMG',
        ]);

        $outgoingFull = collect();
        $incomingEmpty = collect();

        for ($i = 1; $i <= 3; $i++) {
            $outgoingFull->push(Cylinder::create([
                'serial_number'     => "EMG-FULL-0{$i}",
                'supplier_id'       => $this->supplier->id,
                'ownership_type_id' => $this->ownership->id,
                'gas_type'          => 'OXIGENO MEDICINAL',
                'capacity'          => 10,
                'status'            => 'full',
                'location'          => 'CENTRAL',
            ]));

            $incomingEmpty->push(Cylinder::create([
                'serial_number'      => "EMG-EMPTY-0{$i}",
                'supplier_id'        => $this->supplier->id,
                'ownership_type_id'  => $this->ownership->id,
                'gas_type'           => 'OXIGENO MEDICINAL',
                'capacity'           => 10,
                'status'             => 'in_use',
                'location'           => 'HOSPITALIZACION',
                'current_service_id' => $emergencia->id,
            ]));
        }

        // Guardar borrador previo del operador
        $this->postJson('/api/drafts/exchange', [
            'draft_data' => [
                'service_id' => $emergencia->id,
                'out'        => $outgoingFull->pluck('id')->all(),
                'in'         => $incomingEmpty->pluck('id')->all(),
            ],
        ])->assertStatus(200);

        // Registrar los 3 canjes de 10 m³ hacia Emergencia
        for ($i = 0; $i < 3; $i++) {
            $this->postJson('/api/inventory/exchange', [
                'service_id'   => $emergencia->id,
                'cylinder_out' => $outgoingFull[$i]->id,
                'cylinder_in'  => $incomingEmpty[$i]->id,
                'shift'        => 'Morning',
                'notes'        => 'Canje Servicio de Emergencia',
            ])->assertStatus(201);
        }

        // Limpieza del borrador al finalizar la operación en UI
        $this->deleteJson('/api/drafts/exchange')->assertStatus(200);
        $this->assertDatabaseMissing('user_drafts', [
            'user_id'     => $this->operator->id,
            'module_name' => 'exchange',
        ]);

        // Verificar que los 3 balones salientes están en HOSPITALIZACION (Emergencia)
        foreach ($outgoingFull as $cyl) {
            $cyl->refresh();
            $this->assertSame('in_use', $cyl->status);
            $this->assertSame('HOSPITALIZACION', $cyl->location);
            $this->assertEquals($emergencia->id, $cyl->current_service_id);
        }

        // Verificar que los 3 balones entrantes están en CENTRAL en estado empty
        foreach ($incomingEmpty as $cyl) {
            $cyl->refresh();
            $this->assertSame('empty', $cyl->status);
            $this->assertSame('CENTRAL', $cyl->location);
            $this->assertNull($cyl->current_service_id);
        }

        // Verificar impacto en Kardex / Consumo Diario (+30 m³ en HNAGV)
        $kardexConsumption = $this->getJson('/api/reports/consumption-dashboard?date=2026-11-19');
        $kardexConsumption->assertStatus(200);
        $this->assertEquals(30.0, (float) $kardexConsumption->json('grand_total'));
        $this->assertEquals(30.0, (float) $kardexConsumption->json('shifts.MAÑANA.hnagv'));
    }

    /**
     * PI-02: Inventario (Exchange / Préstamo) + Control de Concurrencia y Validación (ROLLBACK / 422)
     * Escenario: Intento de despachar un balón cuyo estado fue cambiado a Vacío segundos antes
     * (o recibir un balón cuya asignación ya no pertenece al servicio).
     * Esperado: El backend aborta la operación con HTTP 422, ningún balón cambia de ubicación y
     * existen cero registros huérfanos en cylinder_movements.
     */
    public function test_pi_02_aborta_operacion_y_evita_registros_huerfanos_cuando_balon_cambio_de_estado(): void
    {
        $patient = Patient::create([
            'full_name'     => 'Juan Pérez Concurrencia',
            'dni'           => '41223344',
            'exchange_code' => '3401',
        ]);

        $rx = Prescription::create([
            'patient_id' => $patient->id,
            'dosage'     => '2',
            'usage_time' => '24',
            'issued_at'  => '2026-11-01',
            'expires_at' => '2026-12-31',
            'status'     => 'active',
        ]);

        $cylinder = Cylinder::create([
            'serial_number'     => 'BAL-RACE-001',
            'supplier_id'       => $this->supplier->id,
            'ownership_type_id' => $this->ownership->id,
            'gas_type'          => 'OXIGENO MEDICINAL',
            'capacity'          => 10,
            'status'            => 'full',
            'location'          => 'CENTRAL',
        ]);

        // Simular cambio concurrente segundos antes: otro operador marcó el balón como 'empty'
        $cylinder->update(['status' => 'empty']);

        $response = $this->postJson('/api/inventory/patient-loan', [
            'patient_id'      => $patient->id,
            'cylinder_id'     => $cylinder->id,
            'prescription_id' => $rx->id,
            'shift'           => 'Morning',
        ]);

        $response->assertStatus(422);

        // Validar también rechazo en Exchange cuando el balón entrante ya fue liberado segundos antes
        $emergencia = Service::create(['name' => 'UCI', 'type' => 'Hospital', 'abbreviation' => 'UCI']);
        $alreadyReturnedCyl = Cylinder::create([
            'serial_number'      => 'BAL-RACE-002',
            'supplier_id'        => $this->supplier->id,
            'ownership_type_id'  => $this->ownership->id,
            'gas_type'           => 'OXIGENO MEDICINAL',
            'capacity'           => 10,
            'status'             => 'empty',
            'location'           => 'CENTRAL',
            'current_service_id' => null,
        ]);

        $exchangeResponse = $this->postJson('/api/inventory/exchange', [
            'service_id'  => $emergencia->id,
            'cylinder_in' => $alreadyReturnedCyl->id,
            'shift'       => 'Morning',
        ]);

        $exchangeResponse->assertStatus(422);

        // Cero movimientos registrados ni detalles huérfanos
        $this->assertDatabaseCount('inventory_movements', 0);
        $this->assertDatabaseCount('cylinder_movements', 0);

        $cylinder->refresh();
        $this->assertSame('CENTRAL', $cylinder->location);
        $this->assertNull($cylinder->current_patient_id);
    }

    /**
     * PI-03: Pacientes (PADOMI) + Préstamos + Control de Devoluciones (ReturnControl)
     * Escenario: Préstamo de balón a paciente PADOMI y posterior registro de devolución física en almacén.
     * Esperado: Al registrar el préstamo, el balón figura asignado al paciente; al registrar el retorno,
     * la deuda se cierra, la receta pasa a inactiva y el balón vuelve al stock de CENTRAL.
     */
    public function test_pi_03_ciclo_completo_prestamo_y_devolucion_paciente_padomi(): void
    {
        $patient = Patient::create([
            'full_name'     => 'María Quispe Huamán',
            'dni'           => '42334455',
            'exchange_code' => '3402',
            'address'       => 'Av. La Cultura 1200',
        ]);

        $prescription = Prescription::create([
            'patient_id' => $patient->id,
            'dosage'     => '3',
            'usage_time' => '18',
            'issued_at'  => '2026-11-01',
            'expires_at' => '2026-12-31',
            'status'     => 'active',
        ]);

        $cylinder = Cylinder::create([
            'serial_number'     => 'PAD-10M-050',
            'supplier_id'       => $this->supplier->id,
            'ownership_type_id' => $this->ownership->id,
            'gas_type'          => 'OXIGENO MEDICINAL',
            'capacity'          => 10,
            'status'            => 'full',
            'location'          => 'CENTRAL',
        ]);

        // 1. Préstamo PADOMI
        $this->postJson('/api/inventory/patient-loan', [
            'patient_id'      => $patient->id,
            'cylinder_id'     => $cylinder->id,
            'prescription_id' => $prescription->id,
            'shift'           => 'Morning',
            'notes'           => 'Entrega inicial domiciliaria',
        ])->assertStatus(201);

        // Verificar que aparece como balón activo asignado al paciente (consulta de ReturnControl)
        $pendingForPatient = $this->getJson("/api/cylinders?patient_id={$patient->id}&per_page=all");
        $pendingForPatient->assertStatus(200)
                          ->assertJsonCount(1)
                          ->assertJsonFragment(['serial_number' => 'PAD-10M-050', 'location' => 'PADOMI']);

        // Verificar reflejo en PadomiExchanges
        $this->getJson('/api/reports/padomi-exchanges?latest_only=1')
             ->assertStatus(200)
             ->assertJsonFragment(['dni' => '42334455']);

        // 2. Devolución física en almacén (ReturnControl)
        $this->postJson('/api/inventory/patient-return', [
            'patient_id'    => $patient->id,
            'cylinder_id'   => $cylinder->id,
            'reason'        => 'Alta médica',
            'return_status' => 'empty',
            'shift'         => 'Afternoon',
            'notes'         => 'Retorno conforme con manómetro',
        ])->assertStatus(201);

        // 3. El balón ya no figura pendiente para el paciente y regresó a CENTRAL vacío
        $afterReturn = $this->getJson("/api/cylinders?patient_id={$patient->id}&per_page=all");
        $afterReturn->assertStatus(200)->assertJsonCount(0);

        $cylinder->refresh();
        $this->assertSame('CENTRAL', $cylinder->location);
        $this->assertSame('empty', $cylinder->status);
        $this->assertNull($cylinder->current_patient_id);
    }

    /**
     * PI-04: Trasvase (Decanting) + Catálogo de Balones + Kardex General / Búsqueda Unificada
     * Escenario: Trasvase hacia 4 balones portátiles vacíos de 2 m³ para atención hospitalaria.
     * Esperado: Los 4 balones portátiles actualizan su estado y ubicación simultáneamente y su
     * trazabilidad queda registrada en el historial y búsqueda unificada de movimientos.
     */
    public function test_pi_04_trasvase_a_cuatro_balones_portatiles_actualiza_estados_y_trazabilidad(): void
    {
        $ambulanciaService = Service::create([
            'name'         => 'Ambulancia / Transporte Asistido',
            'type'         => 'Hospital',
            'abbreviation' => 'AMB',
        ]);

        // Balón matriz de referencia en planta (10 m³)
        $matrixCylinder = Cylinder::create([
            'serial_number'     => 'MATRIZ-10M-001',
            'supplier_id'       => $this->supplier->id,
            'ownership_type_id' => $this->ownership->id,
            'gas_type'          => 'OXIGENO MEDICINAL',
            'capacity'          => 10,
            'status'            => 'full',
            'location'          => 'CENTRAL',
        ]);
        $this->assertNotNull($matrixCylinder->id);

        $portableCylinders = collect();
        for ($i = 1; $i <= 4; $i++) {
            $portableCylinders->push(Cylinder::create([
                'serial_number'     => "PORT-2M-00{$i}",
                'supplier_id'       => $this->supplier->id,
                'ownership_type_id' => $this->ownership->id,
                'gas_type'          => 'OXIGENO MEDICINAL',
                'capacity'          => 2,
                'status'            => 'empty',
                'location'          => 'CENTRAL',
            ]));
        }

        foreach ($portableCylinders as $portable) {
            $this->postJson('/api/inventory/decanting', [
                'cylinder_id'     => $portable->id,
                'refilled_amount' => 2.0,
                'shift'           => 'Morning',
                'service_id'      => $ambulanciaService->id,
            ])->assertStatus(201);
        }

        // Los 4 portátiles actualizados y con historial de trasiego
        foreach ($portableCylinders as $portable) {
            $portable->refresh();
            $this->assertSame('in_use', $portable->status);
            $this->assertSame('HOSPITALIZACION', $portable->location);

            $historyRes = $this->getJson("/api/reports/history/{$portable->id}");
            $historyRes->assertStatus(200)
                       ->assertJsonFragment([
                           'event_type' => 'Trasiego',
                           'status'     => 'full (refilled)',
                       ]);
        }

        // Verificar que los 4 trasvases aparecen en el reporte unificado
        $searchRes = $this->getJson('/api/reports/movements-search?start_date=2026-11-19&end_date=2026-11-19');
        $searchRes->assertStatus(200);
        $trasiegos = collect($searchRes->json('data'))->where('type', 'Trasiego (Decantación)');
        $this->assertCount(4, $trasiegos);
    }

    /**
     * PI-05: Movimientos con Proveedor + Ingresos Mensuales (MonthlyEntries)
     * Escenario: Recepción de lote de 20 balones llenos de 10 m³ enviados por proveedor externo con guía de remisión.
     * Esperado: Los 20 balones pasan a estado full (Lleno) en CENTRAL y el reporte MonthlyEntries incrementa
     * en 20 cilindros (200 m³) los ingresos del mes para dicho proveedor.
     */
    public function test_pi_05_recepcion_lote_20_balones_proveedor_cuadra_con_ingresos_mensuales(): void
    {
        $cylinders = collect();
        for ($i = 1; $i <= 20; $i++) {
            $code = sprintf('PROV-10M-%03d', $i);
            $cylinders->push(Cylinder::create([
                'serial_number'     => $code,
                'supplier_id'       => $this->supplier->id,
                'ownership_type_id' => $this->ownership->id,
                'gas_type'          => 'OXIGENO MEDICINAL',
                'capacity'          => 10,
                'status'            => 'in_transit',
                'location'          => 'PROVEEDOR',
            ]));
        }

        $this->postJson('/api/inventory/supplier-entry', [
            'supplier_id'        => $this->supplier->id,
            'reference_document' => 'GR-001-004589',
            'shift'              => 'Morning',
            'cylinders_in'       => $cylinders->pluck('id')->all(),
            'notes'              => 'Ingreso de 20 cilindros de 10m3 recargados',
        ])->assertStatus(201);

        // Todos los 20 balones quedan en estado 'full' en CENTRAL
        $fullInCentral = Cylinder::whereIn('id', $cylinders->pluck('id'))
            ->where('status', 'full')
            ->where('location', 'CENTRAL')
            ->count();
        $this->assertSame(20, $fullInCentral);

        // Verificar consolidado mensual (MonthlyEntries) y volumen equivalente (20 * 10 m³ = 200 m³)
        $monthlyRes = $this->getJson('/api/reports/monthly-entries?month=2026-11');
        $monthlyRes->assertStatus(200);

        $entries = collect($monthlyRes->json('entries'));
        $day19 = $entries->firstWhere('fecha', '19/11/2026');
        $totalRow = $entries->firstWhere('is_total', true);

        $this->assertNotNull($day19);
        $this->assertSame(20, $day19['total_ingreso_cilindros']);
        $this->assertSame(20, $totalRow['total_ingreso_cilindros']);

        // Verificar también en Consumo Diario que el ingreso volumétrico es exactamente 200 m³
        $consumptionRes = $this->getJson('/api/reports/consumption-dashboard?date=2026-11-19');
        $consumptionRes->assertStatus(200);
        $this->assertEquals(200.0, (float) $consumptionRes->json('grand_total_ingreso'));
    }
}
