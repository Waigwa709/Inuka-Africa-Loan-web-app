-- =====================================================================
-- Inuka Africa - Microfinance Loan Repayment Tracker
-- MySQL Production Database Schema (Engine: InnoDB, Charset: utf8mb4)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `inukaloanapp` 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `inukaloanapp`;

-- 1. Clients Table
CREATE TABLE IF NOT EXISTS `clients` (
  `id` VARCHAR(36) NOT NULL,
  `client_number` VARCHAR(50) NOT NULL,
  `full_name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(30) NULL,
  `email` VARCHAR(255) NULL,
  `location` VARCHAR(255) NULL,
  `date_registered` DATE NOT NULL DEFAULT (CURRENT_DATE),
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_clients_number` (`client_number`),
  INDEX `idx_clients_name` (`full_name`),
  INDEX `idx_clients_location` (`location`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Loans Table
CREATE TABLE IF NOT EXISTS `loans` (
  `id` VARCHAR(36) NOT NULL,
  `loan_reference` VARCHAR(50) NOT NULL,
  `client_id` VARCHAR(36) NOT NULL,
  `loan_amount` DECIMAL(12,2) NOT NULL,
  `total_amount_due` DECIMAL(12,2) NOT NULL,
  `purpose` VARCHAR(255) NULL,
  `loan_date` DATE NOT NULL DEFAULT (CURRENT_DATE),
  `due_date` DATE NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_loans_reference` (`loan_reference`),
  INDEX `idx_loans_client` (`client_id`),
  INDEX `idx_loans_date` (`loan_date`),
  CONSTRAINT `fk_loans_client` FOREIGN KEY (`client_id`) 
    REFERENCES `clients` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Repayments Ledger Table
CREATE TABLE IF NOT EXISTS `repayments` (
  `id` VARCHAR(36) NOT NULL,
  `payment_reference` VARCHAR(50) NOT NULL,
  `loan_id` VARCHAR(36) NOT NULL,
  `client_id` VARCHAR(36) NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `payment_date` DATE NOT NULL DEFAULT (CURRENT_DATE),
  `payment_method` VARCHAR(50) NOT NULL DEFAULT 'M-Pesa',
  `notes` VARCHAR(255) NULL,
  `date_recorded` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_repayments_ref` (`payment_reference`),
  INDEX `idx_repayments_loan` (`loan_id`),
  INDEX `idx_repayments_client` (`client_id`),
  INDEX `idx_repayments_date` (`payment_date`),
  CONSTRAINT `fk_repayments_loan` FOREIGN KEY (`loan_id`) 
    REFERENCES `loans` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_repayments_client` FOREIGN KEY (`client_id`) 
    REFERENCES `clients` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. AI Audit and Interactions Table
CREATE TABLE IF NOT EXISTS `ai_interactions` (
  `id` VARCHAR(36) NOT NULL,
  `question` TEXT NOT NULL,
  `intent` VARCHAR(100) NULL,
  `response` TEXT NOT NULL,
  `model` VARCHAR(100) NOT NULL,
  `verified_data_json` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. AI Management Reports Table
CREATE TABLE IF NOT EXISTS `ai_reports` (
  `id` VARCHAR(36) NOT NULL,
  `report_type` VARCHAR(100) NOT NULL,
  `period` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content_json` MEDIUMTEXT NOT NULL,
  `generated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Users Table (authentication)
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'admin',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Materialized Portfolio Summary View
CREATE OR REPLACE VIEW `vw_loan_portfolio_summary` AS
SELECT 
  l.id AS loan_id,
  l.loan_reference,
  c.id AS client_id,
  c.client_number,
  c.full_name AS client_name,
  l.loan_amount,
  l.total_amount_due,
  COALESCE(SUM(r.amount), 0.00) AS total_repaid,
  GREATEST(0.00, l.total_amount_due - COALESCE(SUM(r.amount), 0.00)) AS outstanding_balance,
  CASE 
    WHEN COALESCE(SUM(r.amount), 0.00) >= l.total_amount_due THEN 'Fully Paid'
    WHEN COALESCE(SUM(r.amount), 0.00) > 0 THEN 'Partially Paid'
    ELSE 'Outstanding'
  END AS status,
  MAX(r.payment_date) AS last_payment_date,
  l.loan_date,
  l.due_date
FROM `loans` l
JOIN `clients` c ON l.client_id = c.id
LEFT JOIN `repayments` r ON l.id = r.loan_id
GROUP BY l.id, l.loan_reference, c.id, c.client_number, c.full_name, l.loan_amount, l.total_amount_due, l.loan_date, l.due_date;
