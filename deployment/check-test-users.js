const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSetup() {
  console.log('\n🔍 VÉRIFICATION DU SETUP\n');
  console.log('='.repeat(60));

  try {
    // 1. Vérifier les employés
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select(`
        id,
        first_name,
        last_name,
        email,
        position,
        sector_id,
        department_id,
        sectors (name),
        departments (name)
      `)
      .order('sector_id');

    if (empError) throw empError;

    console.log(`\n✅ EMPLOYÉS CRÉÉS: ${employees.length}\n`);

    // Grouper par rôle
    const directors = employees.filter(e => e.position === 'directeur');
    const managers = employees.filter(e => e.position === 'manager');
    const workers = employees.filter(e => e.position === 'employee');

    console.log(`🎯 Directeurs: ${directors.length}`);
    directors.forEach(e => {
      console.log(`   - ${e.first_name} ${e.last_name} (${e.email})`);
    });

    console.log(`\n👔 Managers: ${managers.length}`);
    managers.forEach(e => {
      console.log(`   - ${e.first_name} ${e.last_name} (${e.email})`);
      console.log(`     Secteur: ${e.sectors?.name || 'Non assigné'}`);
    });

    console.log(`\n👷 Employés: ${workers.length}`);
    workers.forEach(e => {
      console.log(`   - ${e.first_name} ${e.last_name} (${e.email})`);
      console.log(`     Secteur: ${e.sectors?.name || 'Non assigné'}, Rayon: ${e.departments?.name || 'Non assigné'}`);
    });

    // 2. Vérifier les horaires
    const today = new Date().toISOString().split('T')[0];
    const { data: schedules, error: schedError } = await supabase
      .from('employee_schedules')
      .select(`
        id,
        employee_id,
        work_date,
        work_start,
        work_end,
        is_present,
        employees (first_name, last_name)
      `)
      .eq('work_date', today);

    if (schedError) throw schedError;

    console.log(`\n⏰ HORAIRES CRÉÉS POUR AUJOURD'HUI: ${schedules?.length || 0}\n`);
    if (schedules && schedules.length > 0) {
      schedules.forEach(s => {
        console.log(`   - ${s.employees.first_name} ${s.employees.last_name}: ${s.work_start} - ${s.work_end} (${s.is_present ? 'Présent' : 'Absent'})`);
      });
    }

    // 3. Grouper par secteur
    console.log(`\n📊 RÉPARTITION PAR SECTEUR:\n`);
    const bySector = {};
    workers.forEach(e => {
      const sectorName = e.sectors?.name || 'Non assigné';
      if (!bySector[sectorName]) {
        bySector[sectorName] = [];
      }
      bySector[sectorName].push(e);
    });

    Object.keys(bySector).sort().forEach(sector => {
      console.log(`   ${sector}: ${bySector[sector].length} employés`);
      bySector[sector].forEach(e => {
        console.log(`      - ${e.first_name} ${e.last_name} (${e.departments?.name || 'Non assigné'})`);
      });
    });

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ VÉRIFICATION TERMINÉE!');
    console.log('\n📱 CONNEXIONS DE TEST:\n');
    console.log('🎯 Directeur:');
    console.log('   Email: directeur@optines.test');
    console.log('   Password: Test1234!\n');
    console.log('👔 Manager:');
    console.log('   Email: manager@optines.test');
    console.log('   Password: Test1234!\n');
    console.log('👷 Employé (exemple):');
    console.log('   Email: isabelle.fromage@optines.test');
    console.log('   Password: Test1234!\n');

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error(error);
  }
}

checkSetup();
