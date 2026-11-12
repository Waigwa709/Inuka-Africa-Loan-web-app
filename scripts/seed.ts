import pool from '../src/lib/db';
import { INITIAL_CLIENTS, INITIAL_LOANS_DATA, INITIAL_REPAYMENTS } from '../src/lib/mock-data';

async function seedDatabase() {
  try {
    console.log('🌱 Seeding Inuka Africa database...');

    // Clear existing data
    await pool.query('DELETE FROM repayments');
    await pool.query('DELETE FROM loans');
    await pool.query('DELETE FROM clients');

    // Insert clients
    console.log('📋 Inserting clients...');
    for (const client of INITIAL_CLIENTS) {
      await pool.query(
        `INSERT INTO clients (id, client_number, full_name, phone, email, location, notes, date_registered)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          client.id,
          client.clientNumber,
          client.fullName,
          client.phone,
          client.email,
          client.location,
          client.notes,
          client.dateRegistered,
        ]
      );
    }

    // Insert loans
    console.log('💰 Inserting loans...');
    for (const loan of INITIAL_LOANS_DATA) {
      await pool.query(
        `INSERT INTO loans (id, loan_reference, client_id, loan_amount, total_amount_due, purpose, loan_date, due_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          loan.id,
          loan.loanReference,
          loan.clientId,
          loan.loanAmount,
          loan.totalAmountDue,
          loan.purpose,
          loan.loanDate,
          loan.dueDate,
        ]
      );
    }

    // Insert repayments
    console.log('💳 Inserting repayments...');
    for (const repayment of INITIAL_REPAYMENTS) {
      await pool.query(
        `INSERT INTO repayments (id, payment_reference, loan_id, client_id, amount, payment_date, payment_method, notes, date_recorded)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          repayment.id,
          repayment.paymentReference,
          repayment.loanId,
          repayment.clientId,
          repayment.amount,
          repayment.paymentDate,
          repayment.paymentMethod,
          repayment.notes,
          repayment.dateRecorded,
        ]
      );
    }

    console.log('✅ Database seeded successfully!');
    console.log(`   - ${INITIAL_CLIENTS.length} clients`);
    console.log(`   - ${INITIAL_LOANS_DATA.length} loans`);
    console.log(`   - ${INITIAL_REPAYMENTS.length} repayments`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
