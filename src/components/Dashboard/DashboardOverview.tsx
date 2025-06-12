import React from 'react';
import { Card } from '../Common/Card';
import { TrendingUp, Users, Zap, Calendar } from 'lucide-react';
import { Owner, MeterReading, Bill } from '../../types';

interface DashboardOverviewProps {
  owners: Owner[];
  readings: MeterReading[];
  bills: Bill[];
}

export function DashboardOverview({ owners, readings, bills }: DashboardOverviewProps) {
  const lastReading = readings[readings.length - 1];
  const lastBill = bills[bills.length - 1];
  const totalConsumption = lastReading 
    ? Object.values(lastReading.readings).reduce((sum, reading) => sum + reading, 0)
    : 0;

  const stats = [
    {
      label: 'Proprietari',
      value: owners.length.toString(),
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
      label: 'Consumo Totale',
      value: `${totalConsumption.toFixed(0)} kWh`,
      icon: Zap,
      color: 'text-accent-600',
      bg: 'bg-accent-50',
    },
    {
      label: 'Ultima Bolletta',
      value: lastBill ? `€${lastBill.totalAmount.toFixed(2)}` : 'N/A',
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h2>
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
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Proprietari Registrati</h3>
          <div className="space-y-3">
            {owners.map((owner) => (
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Azioni Rapide</h3>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Prossima scadenza</p>
              <p className="font-medium text-gray-900">Letture del 1° {new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString('it-IT', { month: 'long' })}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Stato sistema</p>
              <p className="font-medium text-energy-600">Operativo</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}