-- ============================================================
--  CRM · Leave Management  —  Database Setup
--  Run this once in phpMyAdmin or via MySQL CLI:
--    mysql -u root -p < setup.sql
-- ============================================================

-- 1. Create & select the database
CREATE DATABASE IF NOT EXISTS crm_leave
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE crm_leave;

-- 2. Leave applications table
CREATE TABLE IF NOT EXISTS leave_applications (
    id              VARCHAR(32)     NOT NULL PRIMARY KEY,
    from_date       DATE            NOT NULL,
    to_date         DATE            NOT NULL,
    leave_type      VARCHAR(60)     NOT NULL DEFAULT 'Casual Leave',
    duration        DECIMAL(6,2)    NOT NULL DEFAULT 1.00,
    status          VARCHAR(30)     NOT NULL DEFAULT 'Pending',
    manager_status  VARCHAR(30)     NOT NULL DEFAULT 'No Action Taken',
    reason          TEXT            NOT NULL,
    approver        VARCHAR(120)    NOT NULL DEFAULT 'Yojna Sharma (Senior Manager - Studio)',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Seed data — two sample records so the history table loads right away
INSERT INTO leave_applications
    (id, from_date, to_date, leave_type, duration, status, manager_status, reason, approver)
VALUES
(
    'seed001',
    '2026-03-13', '2026-03-13',
    'Short Leave', 0.17,
    'Pending', 'No Action Taken',
    'Due to some personal reasons need short leave',
    'Yojna Sharma (Senior Manager - Studio)'
),
(
    'seed002',
    '2026-03-10', '2026-03-10',
    'Unpaid Leave', 1.00,
    'Approved', 'Approved',
    'Brother\'s wedding',
    'Yojna Sharma (Senior Manager - Studio)'
);
