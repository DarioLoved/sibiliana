import React from 'react';
import { Card } from '../Common/Card';
import { TrendingUp, Users, Zap, Calendar, Euro, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Property, MeterReading, Bill } from '../../types';
import { CalculationService } from '../../services/calculationService';

interface DashboardOverviewProps {
  property: Property;
  readings: MeterReading[];
  bills: Bill[];
}

export function DashboardOverview({ property, readings, bills }: DashboardOverviewProps) {
  const lastReading = readings[0]; // readings are sorted by date desc
  const lastBill = bills[0]; // bills are sorted by date desc
  
  // Calculate current period consumption
  const currentPeriodConsumption = CalculationService.calculatePeriodConsumption(readings.slice(0, 2), property.owners);
  
  // Get monthly stats for chart
  const monthlyStats = CalculationService.getMonthlyStats(bills, 6);
  const ownerColors = property.owners.reduce((acc, owner) => {
    acc[owner.name] = owner.color;
    return acc;
  }, {} as { [key: string]: string });

  // Get consumption pie chart data
  const consumptionStats = CalculationService.getOwnerConsumptionStats(bills);
  const pieData = consumptionStats.map(stat => {
    const owner = property.owners.find(o => o.name === stat.name);
    return {
      ...stat,
      color: owner?.color || '#6B7280'
    };
  });

  // Calculate total spent and average
  const totalSpent = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
  const averageMonthlySpent = bills.length > 0 ? totalSpent / bills.length : 0;

  const stats = [
    {
      label: 'Proprietari',
      value: property.owners.length.toString(),
      icon: Users,
      color: 'text-primary-600',
      bg: 'bg-primary-50',
    },
    {
      label: 'Ultima Lettura',
      value: lastReading ? new Date(lastReading.date).toLocaleDateString('it-IT') : 'N/A',
      icon: Calendar,
      color: 'text-energy-600',
      bg: 'bg-energy-50',
    },
    {
      label: 'Consumo Periodo',
      value: `${currentPeriodConsumption.toFixed(0)} kWh`,
      icon: Zap,
      color: 'text-accent-600',
      bg: 'bg-accent-50',
    },
    {
      label: 'Ultima Bolletta',
      value: lastBill ? `€${lastBill.totalAmount.toFixed(2)}` : 'N/A',
      icon: Euro,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard - {property.name}</h2>
        <p className="text-gray-600">Panoramica generale del sistema di gestione spese</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="animate-fade-in">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Expenses Chart */}
        <Card>
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Spese Mensili per Proprietario</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => [`€${value.toFixed(2)}`, 'Spesa']} />
                {property.owners.map((owner) => (
                  <Bar 
                    key={owner.id} 
                    dataKey={owner.name} 
                    fill={owner.color}
                    radius={[2, 2, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Consumption Distribution */}
        <Card>
          <div className="flex items-center space-x-2 mb-4">
            <Zap className="h-5 w-5 text-energy-600" />
            <h3 className="text-lg font-semibold text-gray-900">Distribuzione Consumi</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value.toFixed(1)} kWh`, 'Consumo']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Proprietari Registrati</h3>
          <div className="space-y-3">
            {property.owners.map((owner) => (
              <div key={owner.id} className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: owner.color }}
                />
                <span className="text-gray-700 font-medium">{owner.name}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiche</h3>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Spesa totale</p>
              <p className="font-medium text-gray-900">€{totalSpent.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Spesa media per bolletta</p>
              <p className="font-medium text-gray-900">€{averageMonthlySpent.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Ciclo fatturazione</p>
              <p className="font-medium text-energy-600">
                {property.billingCycle === 'monthly' ? 'Mensile' : 'Bimestrale'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}