import React, { useState } from 'react';
import { calculateIRT, calculateINSS } from '../services/salaryCalculatorAngola';
import { Calculator } from 'lucide-react';

const SalaryCalculatorAngola = () => {
  const [baseSalary, setBaseSalary] = useState<number>(0);
  
  const irt = calculateIRT(baseSalary);
  const inss = calculateINSS(baseSalary);
  const liquid = baseSalary - irt - inss;

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
        <Calculator size={20} />
        Simulador de Salário (Angola)
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Salário Base (Kz)</label>
          <input 
            type="number" 
            value={baseSalary || ''} 
            onChange={(e) => setBaseSalary(Number(e.target.value))}
            className="w-full p-2 border rounded"
            placeholder="Ex: 100000"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-2 bg-gray-50 rounded">
            <span className="text-gray-500">INSS (3%)</span>
            <p className="font-bold">{inss.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <span className="text-gray-500">IRT</span>
            <p className="font-bold">{irt.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
          </div>
        </div>

        <div className="pt-2 border-t mt-2">
          <div className="flex justify-between items-center">
            <span className="font-bold">Salário Líquido:</span>
            <span className="text-xl font-bold text-green-600">
              {liquid.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalaryCalculatorAngola;
