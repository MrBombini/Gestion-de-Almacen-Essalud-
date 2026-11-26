<?php

namespace Tests\System;

use App\Models\Authority;
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
 * 3.3.3.C — Pruebas de Sistema y Validación Funcional (End-to-End API & Requisitos RF/RNF)
 * Tabla 29 de PLANIFICACION_PROYECTO_3.3.md (PS-01 a PS-05)
 */
class PlanificacionSystemTest extends TestCase
{
    use RefreshDatabase;

    private User $operator;
    private Supplier $supplier;
    private OwnershipType $ownership;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow(Carbon::create(2026, 11, 19, 10, 30, 0, 'America/Lima'));

        $this->operator = User::create([
            'operator_code' => 'OP-SYS-01',
            'name'          => 'Operador Sistema',
            'password'      => 'secret123',
            'role'          => 'Operator',
            'status'        => 'active',
        ]);

        $this->supplier = Supplier::create([
            'name' => 'Linde-Praxair',
            'ruc'  => '20100128056',
        ]);

        $this->ownership = OwnershipType::create([
            'name' => 'EsSalud Propio',
        ]);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    /**
     * PS-01: RF-13 (Kardex y Formatos Oficiales)
     * Conciliación de saldos de Kardex Diario y Resumen Mensual en unidades y volumen (m³).
     * Criterio: Saldo Final = Saldo Inicial + Ingresos - Salidas, coincidiendo al 100%
     * tanto por capacidad de balón como en total de m³.
     */
    public function test_ps_01_conciliacion_exacta_de_saldos_kardex_en_unidades_y_m3(): void
    {
        Sanctum::actingAs($this->operator);

        $hospitalService = Service::create([
            'name'         => 'Medicina Interna',
            'type'         => 'Hospital',
            'abbreviation' => 'MED',
        ]);

        // Stock inicial a las 07:00 AM en CENTRAL: 5 balones llenos de 10 m³ (50 m³)
        $initialFull = collect();
        for ($i = 1; $i <= 5; $i++) {
            $initialFull->push(Cylinder::create([
                'serial_number'     => "KAR-INI-0{$i}",
                'supplier_id'       => $this->supplier->id,
                'ownership_type_id' => $this->ownership->id,
                'gas_type'          => 'OXIGENO MEDICINAL',
                'capacity'          => 10,
                'status'            => 'full',
                'location'          => 'CENTRAL',
            ]));
        }

        // 2 balones en tránsito que ingresarán llenos desde proveedor (+20 m³)
        $supplierIncoming = collect();
        for ($i = 1; $i <= 2; $i++) {
            $supplierIncoming->push(Cylinder::create([
                'serial_number'     => "KAR-SUP-0{$i}",
                'supplier_id'       => $this->supplier->id,
                'ownership_type_id' => $this->ownership->id,
                'gas_type'          => 'OXIGENO MEDICINAL',
                'capacity'          => 10,
                'status'            => 'in_transit',
                'location'          => 'PROVEEDOR',
            ]));
        }

        // Ingreso de proveedor: +2 balones (+20 m³)
        $this->postJson('/api/inventory/supplier-entry', [
            'supplier_id'        => $this->supplier->id,
            'reference_document' => 'GR-KARDEX-01',
            'shift'              => 'Morning',
            'cylinders_in'       => $supplierIncoming->pluck('id')->all(),
        ])->assertStatus(201);

        // Salida por atención hospitalaria: -3 balones (-30 m³)
        for ($i = 0; $i < 3; $i++) {
            $this->postJson('/api/inventory/exchange', [
                'service_id'   => $hospitalService->id,
                'cylinder_out' => $initialFull[$i]->id,
                'shift'        => 'Afternoon',
            ])->assertStatus(201);
        }

        // Validar Consumo Ejecutivo / Conciliación Kardex:
        // Saldo Inicial = 5 und (50 m³) | Ingresos = 2 und (20 m³) | Salidas = 3 und (30 m³)
        // Saldo Final esperado = 5 + 2 - 3 = 4 und (40 m³)
        $execRes = $this->getJson('/api/reports/executive-consumption?date=2026-11-19');
        $execRes->assertStatus(200);

        $saldoInicialM3 = (float) $execRes->json('gaseoso.saldo_inicial.total_m3');
        $ingresosM3     = (float) $execRes->json('gaseoso.ingreso.total_m3');
        $salidasM3      = (float) $execRes->json('gaseoso.consumo.total_m3');
        $saldoFinalM3   = (float) $execRes->json('gaseoso.reserva_llenos.total_m3');

        $this->assertEquals(50.0, $saldoInicialM3);
        $this->assertEquals(20.0, $ingresosM3);
        $this->assertEquals(30.0, $salidasM3);
        $this->assertEquals($saldoInicialM3 + $ingresosM3 - $salidasM3, $saldoFinalM3);
        $this->assertEquals(4, (int) $execRes->json('gaseoso.reserva_llenos.total_und.10'));

        // Conciliación contra Resumen Mensual (30 m³ consumidos el 19/11/2026)
        $monthlySummary = $this->getJson('/api/reports/monthly-summary?month=2026-11');
        $monthlySummary->assertStatus(200);
        $totalGasRow = collect($monthlySummary->json('gas_consumption'))->firstWhere('is_total', true);
        $this->assertEquals(30.0, (float) $totalGasRow['total']);
    }

    /**
     * PS-02: RF-13 (Exportación Institucional e Insumos de Reportes Oficiales)
     * Verifica que los endpoints que alimentan las exportaciones Excel y Formatos de Control
     * entreguen estructura consolidada completa, pacientes con receta activa y autoridades firmantes.
     * (La generación física del binario .xlsx con ExcelJS se valida complementariamente en SystemValidation.test.mjs).
     */
    public function test_ps_02_estructura_de_datos_para_exportacion_institucional_y_autoridades(): void
    {
        Sanctum::actingAs($this->operator);

        Authority::create([
            'name' => 'Ing. Wily Chuquipiunta Saavedra',
            'type' => 'Jefe de Mantenimiento',
        ]);

        $patient = Patient::create([
            'full_name'     => 'Rosa Mamani Condori',
            'dni'           => '43445566',
            'exchange_code' => '3500',
        ]);

        Prescription::create([
            'patient_id' => $patient->id,
            'dosage'     => '2',
            'usage_time' => '24',
            'issued_at'  => '2026-11-01',
            'expires_at' => '2026-12-31',
            'status'     => 'active',
        ]);

        // 1. Insumo de ControlFormat.jsx (pacientes con receta activa)
        $this->getJson('/api/patients?search=Rosa&rx_status=ACTIVE&per_page=20')
             ->assertStatus(200)
             ->assertJsonFragment(['full_name' => 'Rosa Mamani Condori', 'exchange_code' => '3500']);

        // 2. Insumo de autoridades firmantes
        $this->getJson('/api/authorities')
             ->assertStatus(200)
             ->assertJsonFragment(['name' => 'Ing. Wily Chuquipiunta Saavedra']);

        // 3. Insumos de DailyKardexReport.jsx y MonthlyResumenReport.jsx
        $this->getJson('/api/reports/daily-kardex?date=2026-11-19')
             ->assertStatus(200)
             ->assertJsonStructure(['date', 'stock_summary', 'initial_balance', 'shifts']);

        $this->getJson('/api/reports/monthly-summary?month=2026-11')
             ->assertStatus(200)
             ->assertJsonStructure(['month', 'liquid_readings', 'gas_consumption']);
    }

    /**
     * PS-03: RF-14 (Trazabilidad Unitaria de Balón)
     * Búsqueda del historial completo de un cilindro en CylinderTracking y UnifiedMovements.
     * Criterio: Visualización cronológica exacta de todos los movimientos del balón en < 400 ms.
     */
    public function test_ps_03_trazabilidad_unitaria_cronologica_completa_de_balon(): void
    {
        Sanctum::actingAs($this->operator);

        $service = Service::create(['name' => 'Cirugía General', 'type' => 'Hospital', 'abbreviation' => 'CIR']);
        $patient = Patient::create(['full_name' => 'Carlos Ramos', 'dni' => '44556677', 'exchange_code' => '3501']);
        $rx = Prescription::create([
            'patient_id' => $patient->id,
            'dosage'     => '2',
            'usage_time' => '12',
            'issued_at'  => '2026-11-01',
            'expires_at' => '2026-12-31',
            'status'     => 'active',
        ]);

        $cylinder = Cylinder::create([
            'serial_number'     => 'TRAZA-10M-777',
            'barcode'           => 'BC-TRAZA-777',
            'supplier_id'       => $this->supplier->id,
            'ownership_type_id' => $this->ownership->id,
            'gas_type'          => 'OXIGENO MEDICINAL',
            'capacity'          => 10,
            'status'            => 'in_transit',
            'location'          => 'PROVEEDOR',
        ]);

        // Evento 1 (08:00): Ingreso de proveedor
        Carbon::setTestNow(Carbon::create(2026, 11, 19, 8, 0, 0, 'America/Lima'));
        $this->postJson('/api/inventory/supplier-entry', [
            'supplier_id'        => $this->supplier->id,
            'reference_document' => 'GR-TRAZA-001',
            'shift'              => 'Morning',
            'cylinders_in'       => [$cylinder->id],
        ])->assertStatus(201);

        // Evento 2 (09:00): Salida por canje a servicio hospitalario
        Carbon::setTestNow(Carbon::create(2026, 11, 19, 9, 0, 0, 'America/Lima'));
        $this->postJson('/api/inventory/exchange', [
            'service_id'   => $service->id,
            'cylinder_out' => $cylinder->id,
            'shift'        => 'Morning',
        ])->assertStatus(201);

        // Evento 3 (10:00): Retorno vacío desde servicio hospitalario
        Carbon::setTestNow(Carbon::create(2026, 11, 19, 10, 0, 0, 'America/Lima'));
        $this->postJson('/api/inventory/exchange', [
            'service_id'  => $service->id,
            'cylinder_in' => $cylinder->id,
            'shift'       => 'Morning',
        ])->assertStatus(201);

        // Evento 4 (11:00): Recarga por proveedor y posterior préstamo PADOMI (12:00)
        Carbon::setTestNow(Carbon::create(2026, 11, 19, 11, 0, 0, 'America/Lima'));
        $this->postJson('/api/inventory/supplier-entry', [
            'supplier_id'        => $this->supplier->id,
            'reference_document' => 'GR-TRAZA-002',
            'shift'              => 'Morning',
            'cylinders_in'       => [$cylinder->id],
        ])->assertStatus(201);

        Carbon::setTestNow(Carbon::create(2026, 11, 19, 12, 0, 0, 'America/Lima'));
        $this->postJson('/api/inventory/patient-loan', [
            'patient_id'      => $patient->id,
            'cylinder_id'     => $cylinder->id,
            'prescription_id' => $rx->id,
            'shift'           => 'Morning',
        ])->assertStatus(201);

        // Evento 5 (15:00): Devolución del paciente PADOMI
        Carbon::setTestNow(Carbon::create(2026, 11, 19, 15, 0, 0, 'America/Lima'));
        $this->postJson('/api/inventory/patient-return', [
            'patient_id'    => $patient->id,
            'cylinder_id'   => $cylinder->id,
            'reason'        => 'Alta médica',
            'return_status' => 'empty',
            'shift'         => 'Afternoon',
        ])->assertStatus(201);

        $start = microtime(true);
        $historyRes = $this->getJson("/api/reports/history/{$cylinder->id}");
        $elapsedMs = (microtime(true) - $start) * 1000;

        $historyRes->assertStatus(200);
        $this->assertLessThan(400, $elapsedMs, "El endpoint de trazabilidad tardó {$elapsedMs} ms (límite 400 ms)");

        $history = $historyRes->json('history');
        $this->assertCount(6, $history);
        // Orden cronológico descendente: el evento más reciente es PatientReturn, el más antiguo SupplierEntry
        $this->assertSame('PatientReturn', $history[0]['event_type']);
        $this->assertSame('PatientLoan', $history[1]['event_type']);
        $this->assertSame('SupplierEntry', $history[5]['event_type']);

        // También verificable desde UnifiedMovements (/api/reports/movements-search)
        $unifiedRes = $this->getJson('/api/reports/movements-search?cylinder=TRAZA-10M-777');
        $unifiedRes->assertStatus(200);
        $this->assertCount(6, $unifiedRes->json('data'));
    }

    /**
     * PS-04: RNF-01 / RNF-02 (Rendimiento de Endpoints Analíticos)
     * Criterio: Consultas de reportes analíticos responden en < 2.5 s (2500 ms).
     */
    public function test_ps_04_rendimiento_de_endpoints_analiticos_bajo_umbral_sla(): void
    {
        Sanctum::actingAs($this->operator);

        $endpoints = [
            '/api/dashboard/stats',
            '/api/reports/daily-kardex?date=2026-11-19',
            '/api/reports/consumption-dashboard?date=2026-11-19',
            '/api/reports/executive-consumption?date=2026-11-19',
            '/api/reports/monthly-summary?month=2026-11',
            '/api/reports/monthly-entries?month=2026-11',
        ];

        foreach ($endpoints as $uri) {
            $t0 = microtime(true);
            $res = $this->getJson($uri);
            $elapsedMs = (microtime(true) - $t0) * 1000;

            $res->assertStatus(200);
            $this->assertLessThan(
                2500,
                $elapsedMs,
                "El reporte {$uri} excedió el SLA de 2.5s ({$elapsedMs} ms)"
            );
        }
    }

    /**
     * PS-05: RNF-03 (Seguridad de Sesiones y Rutas)
     * Intento de acceso directo sin sesión activa a rutas protegidas (/inventory/exchange, /users, etc.).
     * Criterio: Rechazo HTTP 401 Unauthorized ante peticiones directas a la API sin token válido.
     */
    public function test_ps_05_rechaza_con_401_accesos_sin_token_a_rutas_protegidas(): void
    {
        // Sin Sanctum::actingAs -> usuario anónimo o con token inválido
        $protectedCalls = [
            ['POST', '/api/inventory/exchange', ['shift' => 'Morning']],
            ['GET',  '/api/users', []],
            ['GET',  '/api/auth/me', []],
            ['GET',  '/api/reports/daily-kardex', []],
        ];

        foreach ($protectedCalls as [$method, $uri, $payload]) {
            $response = $this->json($method, $uri, $payload, [
                'Authorization' => 'Bearer token-invalido-o-expirado',
            ]);

            $response->assertStatus(401);
        }
    }
}
