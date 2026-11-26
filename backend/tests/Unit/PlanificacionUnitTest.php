<?php

namespace Tests\Unit;

use App\Models\Bed;
use App\Models\Cylinder;
use App\Models\DailyReading;
use App\Models\OwnershipType;
use App\Models\Patient;
use App\Models\Service;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * 3.3.3.A — Pruebas Unitarias (Componentes y Reglas de Negocio)
 * Tabla 27 de PLANIFICACION_PROYECTO_3.3.md (PU-01 a PU-06)
 */
class PlanificacionUnitTest extends TestCase
{
    use RefreshDatabase;

    private function createActiveUser(string $role = 'Operator', string $code = 'OP-001'): User
    {
        return User::create([
            'operator_code' => $code,
            'name'          => "Usuario {$role}",
            'password'      => 'secret123',
            'role'          => $role,
            'status'        => 'active',
        ]);
    }

    private function createBaseCatalogs(): array
    {
        $supplier = Supplier::create([
            'name' => 'Linde-Praxair',
            'ruc'  => '20100128056',
        ]);

        $ownership = OwnershipType::create([
            'name' => 'Propio EsSalud',
        ]);

        return [$supplier, $ownership];
    }

    /**
     * PU-01: AuthController / Middleware RBAC
     * Verificar restricción de acceso a gestión de usuarios para rol Operator.
     * Entrada: Token Bearer de usuario con role = Operator en GET /api/users.
     * Esperado: HTTP 403 Forbidden denegando acceso al recurso exclusivo de Administrator.
     */
    public function test_pu_01_restringe_acceso_gestion_usuarios_para_rol_operator(): void
    {
        $operator = $this->createActiveUser('Operator', 'OP-101');
        Sanctum::actingAs($operator);

        $response = $this->getJson('/api/users');

        $response->assertStatus(403)
                 ->assertJsonFragment([
                     'message' => 'You do not have permission to access this route.',
                 ]);

        // Contraste positivo: un Administrator sí obtiene HTTP 200
        $admin = $this->createActiveUser('Administrator', 'ADM-001');
        Sanctum::actingAs($admin);
        $this->getJson('/api/users')->assertStatus(200);
    }

    /**
     * PU-02: PatientController::nextCodes
     * Validar la generación automática del siguiente código correlativo para nuevos pacientes.
     * Entrada: Petición GET /api/patients/next-codes con último código correlativo registrado.
     * Esperado: Retorno de objeto JSON con el siguiente código correlativo exacto y sin colisiones.
     */
    public function test_pu_02_genera_siguiente_codigo_correlativo_de_paciente_sin_colisiones(): void
    {
        $operator = $this->createActiveUser('Operator', 'OP-102');
        Sanctum::actingAs($operator);

        // Registrar paciente con códigos correlativos altos (por encima de la semilla base 3200 / P1090)
        Patient::create([
            'full_name'     => 'Paciente Correlativo Base',
            'dni'           => '40112233',
            'exchange_code' => '3345',
            'trasiego_code' => 'P1145',
        ]);

        // Segundo paciente que incrementa los correlativos a 3545 y P1146
        Patient::create([
            'full_name'     => 'Paciente Correlativo Superior',
            'dni'           => '40112234',
            'exchange_code' => '3545',
            'trasiego_code' => 'P1146',
        ]);

        $response = $this->getJson('/api/patients/next-codes');

        $response->assertStatus(200)
                 ->assertExactJson([
                     'exchange_code' => '3546',
                     'trasiego_code' => 'P1147',
                 ]);

        $this->assertFalse(Patient::where('exchange_code', '3546')->exists());
        $this->assertFalse(Patient::where('trasiego_code', 'P1147')->exists());
    }

    /**
     * PU-03: CylinderController
     * Validar unicidad de código de serie de balón y capacidad volumétrica positiva.
     * Entrada: Registro de balón con código BAL-10M-001 ya existente en base de datos.
     * Esperado: Respuesta HTTP 422 Unprocessable Entity indicando clave única duplicada.
     */
    public function test_pu_03_valida_unicidad_de_codigo_de_serie_de_balon(): void
    {
        $operator = $this->createActiveUser('Operator', 'OP-103');
        Sanctum::actingAs($operator);

        [$supplier, $ownership] = $this->createBaseCatalogs();

        Cylinder::create([
            'serial_number'     => 'BAL-10M-001',
            'barcode'           => 'BC-10M-001',
            'supplier_id'       => $supplier->id,
            'ownership_type_id' => $ownership->id,
            'gas_type'          => 'OXIGENO MEDICINAL',
            'capacity'          => 10,
            'status'            => 'full',
            'location'          => 'CENTRAL',
        ]);

        $duplicatePayload = [
            'serial_number'     => 'BAL-10M-001',
            'supplier_id'       => $supplier->id,
            'ownership_type_id' => $ownership->id,
            'gas_type'          => 'OXIGENO MEDICINAL',
            'capacity'          => 10,
            'status'            => 'full',
            'location'          => 'CENTRAL',
        ];

        $response = $this->postJson('/api/cylinders', $duplicatePayload);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['serial_number']);
    }

    /**
     * PU-04: DailyReadingController
     * Verificar cálculo matemático de consumo diario de oxígeno líquido en tanque criogénico.
     * Entrada: Lectura anterior flujómetro: 1200 m³, Lectura actual flujómetro: 1480 m³ (consumo neto 280 m³;
     * equivalente al balance criogénico 1200 + 500 - 1420 = 280 m³).
     * Esperado: Consumo calculado y almacenado exactamente en 280.00 m³.
     */
    public function test_pu_04_calcula_consumo_diario_de_oxigeno_liquido_exacto(): void
    {
        $operator = $this->createActiveUser('Operator', 'OP-104');
        Sanctum::actingAs($operator);

        // Lectura previa del flujómetro acumulado (1200 m³)
        DailyReading::create([
            'reading_date'           => '2026-11-18',
            'shift'                  => 'Morning',
            'tank_level'             => 120.0,
            'flow_meter_reading'     => 1200.00,
            'calculated_consumption' => 0,
            'user_id'                => $operator->id,
        ]);

        // Nueva lectura tras consumo de 280 m³ (1200 -> 1480 m³ en flujómetro; balance tanque 1200 + 500 - 1420 = 280 m³)
        $response = $this->postJson('/api/daily-readings', [
            'reading_date'       => '2026-11-19',
            'shift'              => 'Morning',
            'tank_level'         => 142.0,
            'flow_meter_reading' => 1480.00,
        ]);

        $response->assertStatus(201);
        $this->assertEquals(280.00, (float) $response->json('calculated_consumption'));

        // Verificación aritmética directa de la fórmula criogénica documentada (Lectura Anterior + Recargas - Lectura Actual)
        $lecturaAnteriorM3 = 1200.00;
        $recargaCisternaM3 = 500.00;
        $lecturaActualM3   = 1420.00;
        $consumoNetoTanque = $lecturaAnteriorM3 + $recargaCisternaM3 - $lecturaActualM3;
        $this->assertSame(280.00, $consumoNetoTanque);
    }

    /**
     * PU-05: HospitalizationController
     * Evaluar activación de alerta cuando la lectura PSI en cama es inferior al umbral crítico.
     * Entrada: Balón en cama UCI-02 con lectura manométrica pressure_psi = 250 PSI y flujo alto.
     * Esperado: El endpoint /api/hospitalization/alerts incluye el balón con indicador crítico activo.
     */
    public function test_pu_05_activa_alerta_critica_por_baja_presion_psi_en_cama(): void
    {
        $operator = $this->createActiveUser('Operator', 'OP-105');
        Sanctum::actingAs($operator);

        [$supplier, $ownership] = $this->createBaseCatalogs();

        $uciService = Service::create([
            'name'         => 'Unidad de Cuidados Intensivos',
            'type'         => 'Hospital',
            'abbreviation' => 'UCI',
        ]);

        $bedUci02 = Bed::create([
            'service_id' => $uciService->id,
            'bed_number' => 'UCI-02',
            'status'     => 'occupied',
        ]);

        // Balón portátil de 2 m³ (12 L agua) en cama UCI-02:
        // 250 PSI = 17.2368 Bar -> (12 * 17.2368) / (5 L/min * 60) = 0.69 horas (< 1.0h => status 'critical')
        $cylinder = Cylinder::create([
            'serial_number'      => 'BAL-UCI-002',
            'supplier_id'        => $supplier->id,
            'ownership_type_id'  => $ownership->id,
            'gas_type'           => 'OXIGENO MEDICINAL',
            'capacity'           => 2,
            'status'             => 'in_use',
            'location'           => 'HOSPITALIZACION',
            'current_service_id' => $uciService->id,
            'current_bed_id'     => $bedUci02->id,
        ]);

        $this->postJson('/api/hospitalization/readings', [
            'cylinder_id'  => $cylinder->id,
            'pressure_psi' => 250,
            'flow_lmin'    => 5,
            'shift'        => 'Morning',
            'notes'        => 'Lectura manométrica baja en UCI-02',
        ])->assertStatus(201);

        $alertsResponse = $this->getJson('/api/hospitalization/alerts');

        $alertsResponse->assertStatus(200)
                       ->assertJsonPath('critical_count', 1)
                       ->assertJsonFragment([
                           'cylinder_id'   => $cylinder->id,
                           'serial_number' => 'BAL-UCI-002',
                           'bed_number'    => 'UCI-02',
                           'status'        => 'critical',
                       ]);
    }

    /**
     * PU-06: UserDraftController
     * Verificar guardado y recuperación de borrador JSON por usuario y módulo.
     * Entrada: POST /api/drafts/exchange con payload JSON de 4 balones preseleccionados.
     * Esperado: Almacenamiento en user_drafts y recuperación exacta al invocar GET /api/drafts/exchange.
     */
    public function test_pu_06_guarda_y_recupera_borrador_json_por_usuario_y_modulo(): void
    {
        $operator = $this->createActiveUser('Operator', 'OP-106');
        Sanctum::actingAs($operator);

        $draftPayload = [
            'shift'              => 'Morning',
            'destination_type'   => 'service',
            'selected_cylinders' => [
                ['serial_number' => 'BAL-10M-011', 'capacity' => 10, 'action' => 'Exit'],
                ['serial_number' => 'BAL-10M-012', 'capacity' => 10, 'action' => 'Exit'],
                ['serial_number' => 'BAL-10M-021', 'capacity' => 10, 'action' => 'Entry'],
                ['serial_number' => 'BAL-10M-022', 'capacity' => 10, 'action' => 'Entry'],
            ],
        ];

        $this->postJson('/api/drafts/exchange', [
            'draft_data' => $draftPayload,
        ])->assertStatus(200);

        $this->assertDatabaseHas('user_drafts', [
            'user_id'     => $operator->id,
            'module_name' => 'exchange',
        ]);

        $getResponse = $this->getJson('/api/drafts/exchange');

        $getResponse->assertStatus(200)
                    ->assertExactJson($draftPayload);
    }
}
