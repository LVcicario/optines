import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Sector {
  id: number;
  store_id: number;
  name: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: number;
  sector_id: number;
  store_id: number;
  name: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface SectorSummary {
  sector_id: number;
  sector_name: string;
  store_id: number;
  total_employees: number;
  active_employees: number;
  total_tasks: number;
  completed_tasks: number;
  total_packages: number;
  completed_packages: number;
  total_work_minutes: number;
  remaining_work_minutes: number;
}

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  position: string;
  department_id: number | null;
  sector_id: number | null;
}

export interface EmployeeWithAvailability extends Employee {
  total_work_minutes: number;
  used_work_minutes: number;
  remaining_work_minutes: number;
  is_available: boolean;
  department_name?: string;
}

export function useSupabaseSectors(storeId?: number) {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSectors();
  }, [storeId]);

  async function fetchSectors() {
    try {
      setLoading(true);
      let query = supabase
        .from('sectors')
        .select('*')
        .order('display_order', { ascending: true });

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data, error: err } = await query;

      if (err) throw err;
      setSectors(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching sectors:', err);
    } finally {
      setLoading(false);
    }
  }

  return { sectors, loading, error, refetch: fetchSectors };
}

export function useSupabaseDepartments(sectorId?: number) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sectorId) {
      fetchDepartments();
    }
  }, [sectorId]);

  async function fetchDepartments() {
    try {
      setLoading(true);
      let query = supabase
        .from('departments')
        .select('*')
        .order('display_order', { ascending: true });

      if (sectorId) {
        query = query.eq('sector_id', sectorId);
      }

      const { data, error: err } = await query;

      if (err) throw err;
      setDepartments(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching departments:', err);
    } finally {
      setLoading(false);
    }
  }

  return { departments, loading, error, refetch: fetchDepartments };
}

export function useSectorSummary(storeId: number) {
  const [summaries, setSummaries] = useState<SectorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (storeId) {
      fetchSectorSummary();
    }
  }, [storeId]);

  async function fetchSectorSummary() {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('sector_summary')
        .select('*')
        .eq('store_id', storeId);

      if (err) throw err;
      setSummaries(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching sector summary:', err);
    } finally {
      setLoading(false);
    }
  }

  return { summaries, loading, error, refetch: fetchSectorSummary };
}

export function useSectorEmployees(sectorId: number) {
  const [employees, setEmployees] = useState<EmployeeWithAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sectorId) {
      fetchEmployees();
    }
  }, [sectorId]);

  async function fetchEmployees() {
    try {
      setLoading(true);

      // Récupérer les employés du secteur
      const { data: employeesData, error: err } = await supabase
        .from('employees')
        .select(`
          id,
          first_name,
          last_name,
          position,
          department_id,
          sector_id,
          departments (
            name
          )
        `)
        .eq('sector_id', sectorId);

      if (err) throw err;

      // Pour chaque employé, calculer la disponibilité
      const employeesWithAvailability = await Promise.all(
        (employeesData || []).map(async (emp: any) => {
          const { data: availability } = await supabase
            .rpc('get_employee_remaining_work_time', {
              p_employee_id: emp.id,
              p_date: new Date().toISOString().split('T')[0]
            });

          return {
            id: emp.id,
            first_name: emp.first_name,
            last_name: emp.last_name,
            position: emp.position,
            department_id: emp.department_id,
            sector_id: emp.sector_id,
            department_name: emp.departments?.name || 'Non assigné',
            total_work_minutes: availability?.[0]?.total_work_minutes || 0,
            used_work_minutes: availability?.[0]?.used_work_minutes || 0,
            remaining_work_minutes: availability?.[0]?.remaining_work_minutes || 0,
            is_available: availability?.[0]?.is_available || false,
          };
        })
      );

      setEmployees(employeesWithAvailability);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching sector employees:', err);
    } finally {
      setLoading(false);
    }
  }

  return { employees, loading, error, refetch: fetchEmployees };
}
