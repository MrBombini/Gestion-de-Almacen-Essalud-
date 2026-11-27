import { useState } from 'react';
import { MdPrint, MdLocalHospital, MdPerson } from 'react-icons/md';
import AsyncSelect from 'react-select/async';
import api from '../../services/api';
import { printControlFormat } from '../../utils/printTemplates';

const selectStyles = {
  control: (base, state) => ({
    ...base,
    padding: "4px",
    borderRadius: "0.75rem",
    borderColor: state.isFocused ? "#3b82f6" : "#cbd5e1",
    boxShadow: state.isFocused ? "0 0 0 3px rgba(59,130,246,0.15)" : "none",
    "&:hover": { borderColor: "#3b82f6" }
  })
};

const ControlFormat = () => {
  const [selectedPatient, setSelectedPatient] = useState(null);

  const loadPatientOptions = async (inputValue) => {
    if (!inputValue || inputValue.length < 2) return [];
    try {
      // Solo pacientes con receta activa
      const response = await api.get(`/patients?search=${inputValue}&rx_status=ACTIVE&per_page=20`);
      const data = response.data.data || response.data || [];
      return data.map(p => ({
        value: p.id,
        label: `${p.full_name} — DNI: ${p.dni || "S/D"}`,
        patient: p
      }));
    } catch {
      return [];
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
          <MdLocalHospital className="text-3xl" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Formatos de Control</h2>
          <p className="text-slate-500 text-sm mt-1">
            Generación e impresión de la hoja de Control de Atención Paciente.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 max-w-3xl mx-auto">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b pb-4">
          <MdPerson className="text-2xl text-blue-500" /> 
          Seleccionar Paciente (Solo con Recetas Activas)
        </h3>
        
        <div className="mb-8">
          <label className="block text-sm font-bold text-slate-700 mb-2">Buscar Paciente</label>
          <AsyncSelect
            cacheOptions
            loadOptions={loadPatientOptions}
            defaultOptions={[]}
            onChange={(option) => setSelectedPatient(option)}
            placeholder="Escribe DNI o Nombre del paciente..."
            noOptionsMessage={() => "No se encontraron pacientes con receta activa"}
            loadingMessage={() => "Buscando..."}
            styles={selectStyles}
            value={selectedPatient}
          />
        </div>

        {selectedPatient ? (
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-center space-y-6">
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Paciente Seleccionado</p>
              <p className="text-xl font-bold text-slate-800">{selectedPatient.patient.full_name}</p>
              <div className="flex justify-center gap-4 mt-2 text-sm text-slate-500 font-mono">
                <span>DNI: {selectedPatient.patient.dni || 'S/M'}</span>
                <span>CÓDIGO: {selectedPatient.patient.exchange_code || 'S/M'}</span>
              </div>
            </div>

            <button
              onClick={() => printControlFormat(selectedPatient.patient)}
              className="w-full sm:w-auto px-10 py-4 bg-blue-600 text-white rounded-xl font-black text-lg shadow-lg hover:bg-blue-700 transition-all hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-3 mx-auto"
            >
              <MdPrint className="text-2xl" /> 
              IMPRIMIR FORMATO A4
            </button>
            <p className="text-xs text-slate-400 italic">El formato se generará en una hoja A4 con cuadrícula para llenado manual.</p>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-2xl p-10 border border-slate-200 border-dashed text-center">
            <MdPrint className="text-5xl text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Busca y selecciona un paciente para habilitar la impresión.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ControlFormat;
