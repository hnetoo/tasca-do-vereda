import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PayrollRecord, Employee } from '@/types';
import { generateUUID } from '@/utils/uuid';
import { formatCurrency } from '@/utils/formatters';

const PayrollPage = () => {
  const { employees, payroll, addPayroll, removePayroll } = useStore(state => ({
    employees: state.employees,
    payroll: state.payroll,
    addPayroll: state.addPayroll,
    removePayroll: state.removePayroll,
  }));

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [baseSalary, setBaseSalary] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [deductions, setDeductions] = useState(0);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [paymentMethod, setPaymentMethod] = useState('TRANSFERENCIA');

  // Efeito para preencher o salário base quando um funcionário é selecionado
  useEffect(() => {
    if (selectedEmployeeId) {
      const employee = employees.find(emp => emp.id === selectedEmployeeId);
      if (employee) {
        // Usar setTimeout para evitar setState síncrono em useEffect
        setTimeout(() => setBaseSalary(employee.salary || 0), 0);
      }
    } else {
      setTimeout(() => setBaseSalary(0), 0);
    }
  }, [selectedEmployeeId, employees]);

  const netSalary = useMemo(() => baseSalary + bonus - deductions, [baseSalary, bonus, deductions]);

  const resetForm = () => {
    setSelectedEmployeeId('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setBaseSalary(0);
    setBonus(0);
    setDeductions(0);
    setPaymentMethod('TRANSFERENCIA');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      alert('Por favor, selecione um funcionário.');
      return;
    }

    const employee = employees.find(emp => emp.id === selectedEmployeeId);
    if (!employee) {
      alert('Funcionário selecionado não é válido.');
      return;
    }

    const newPayrollRecord: PayrollRecord = {
      id: generateUUID(),
      employeeId: selectedEmployeeId,
      paymentDate: new Date(paymentDate),
      baseSalary,
      bonus,
      deductions,
      netSalary,
      month,
      year,
      paymentMethod: paymentMethod as any,
    };

    addPayroll(newPayrollRecord);
    resetForm();
  };

  const getEmployeeName = (employeeId: string): string => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.name : 'Funcionário Desconhecido';
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Folha de Salário</h1>

      <Card>
        <CardHeader>
          <CardTitle>Criar Novo Pagamento</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee">Funcionário</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger id="employee">
                  <SelectValue placeholder="Selecione um funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp: Employee) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseSalary">Salário Base</Label>
              <Input id="baseSalary" type="number" value={baseSalary} onChange={e => setBaseSalary(Number(e.target.value))} placeholder="Salário base" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bonus">Bónus</Label>
              <Input id="bonus" type="number" value={bonus} onChange={e => setBonus(Number(e.target.value))} placeholder="Valor do bónus" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deductions">Deduções (Faltas, etc.)</Label>
              <Input id="deductions" type="number" value={deductions} onChange={e => setDeductions(Number(e.target.value))} placeholder="Valor a deduzir" />
            </div>

            <div className="space-y-2">
              <Label>Salário Líquido</Label>
              <Input value={formatCurrency(netSalary)} readOnly className="font-bold text-lg bg-gray-100" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentDate">Data de Pagamento</Label>
              <Input id="paymentDate" type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="month">Mês</Label>
              <Input id="month" type="number" value={month} onChange={e => setMonth(Number(e.target.value))} min="1" max="12" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Ano</Label>
              <Input id="year" type="number" value={year} onChange={e => setYear(Number(e.target.value))} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Método de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="paymentMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
                  <SelectItem value="CASH">Dinheiro</SelectItem>
                  <SelectItem value="OUTRO">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit">Adicionar Pagamento</Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Funcionário</TableHead>
                <TableHead>Data Pag.</TableHead>
                <TableHead>Mês/Ano</TableHead>
                <TableHead className="text-right">Salário Base</TableHead>
                <TableHead className="text-right">Bónus</TableHead>
                <TableHead className="text-right">Deduções</TableHead>
                <TableHead className="text-right font-bold">Salário Líquido</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payroll.length > 0 ? (
                payroll.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{getEmployeeName(record.employeeId)}</TableCell>
                    <TableCell>{new Date(record.paymentDate).toLocaleDateString()}</TableCell>
                    <TableCell>{`${record.month}/${record.year}`}</TableCell>
                    <TableCell className="text-right">{formatCurrency(record.baseSalary)}</TableCell>
                    <TableCell className="text-right text-green-600">{formatCurrency((record as any).bonus || 0)}</TableCell>
                    <TableCell className="text-right text-red-500">{formatCurrency(record.deductions)}</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(record.netSalary)}</TableCell>
                    <TableCell>
                      <Button variant="destructive" size="sm" onClick={() => removePayroll(record.id)}>
                        Remover
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">Nenhum pagamento registado.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PayrollPage;