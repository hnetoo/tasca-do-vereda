# Tasca do Vereda - Database Schema & Migration

This document outlines the database schema, security policies, and migration strategy for the Tasca do Vereda application.

## Overview

The database is designed to support a restaurant management system with roles for Admins, Owners, and Staff. It includes tables for menu management, order processing, inventory tracking, financial transactions, and employee management.

### Key Features

1.  **Role-Based Access Control (RBAC)**:
    *   **Admin/Owner**: Full access to all tables, including financial data and system settings.
    *   **Staff**: Restricted access. Can create/update orders, view menu items, and manage their own shifts. Cannot delete audit logs or view sensitive financial data (except their own shift totals).
    *   **Public**: Read-only access to menu categories and dishes (for digital menu/QR code).

2.  **Real-Time Updates**:
    *   The `supabase_realtime` publication includes `orders`, `order_items`, `restaurant_tables`, `expenses`, `revenues`, `transactions`, `cash_shifts`, and `stock_items` to ensure the admin dashboard reflects changes instantly.

3.  **Data Integrity**:
    *   `updated_at` triggers automatically update timestamps on all tables.
    *   Foreign keys ensure referential integrity between orders, customers, tables, and employees.
    *   Check constraints on `role` and `status` fields prevent invalid data.

## Schema Structure

### Core Tables

*   **employees**: Users of the system with roles (ADMIN, OWNER, MANAGER, WAITER, KITCHEN, BAR).
*   **customers**: Customer information for loyalty and order history.
*   **restaurant_tables**: Physical layout and status of tables.

### Menu & Inventory

*   **menu_categories**: Categories for dishes (e.g., Starters, Main Course).
*   **dishes**: Menu items with pricing, stock tracking, and preparation details.
*   **stock_items**: Inventory tracking for raw materials or non-menu items.

### Operations

*   **orders**: Central table for customer orders.
*   **order_items**: Individual items within an order.
*   **cash_shifts**: Tracks employee shifts and cash drawer balances.
*   **deliveries**: Delivery information for orders.

### Financials

*   **expenses**: Records of outgoing payments to suppliers or other costs.
*   **revenues**: Records of income separate from standard orders (e.g., catering events).
*   **payroll_records**: Employee salary payments.
*   **transactions**: A consolidated view or table for all financial movements (Income/Expense).

### System

*   **audit_logs**: Logs critical actions for security and accountability.
*   **daily_analytics**: Aggregated data for reporting.
*   **notifications**: System notifications for users.

## Deployment Instructions

### Prerequisites

*   Supabase CLI installed and authenticated.
*   Docker running (for local development).

### Steps

1.  **Start Local Supabase**:
    ```bash
    supabase start
    ```

2.  **Apply Migrations**:
    The migration file `20260222130000_comprehensive_schema.sql` contains the entire schema definition.
    ```bash
    supabase db reset
    ```
    Or if applying to a remote project:
    ```bash
    supabase db push
    ```

3.  **Verify RLS Policies**:
    Run the test script to ensure security policies are active.
    ```bash
    supabase test db
    ```
    Or execute the SQL manually in the Supabase Dashboard SQL Editor:
    ```sql
    -- Copy content from supabase/tests/database/rls_tests.sql
    ```

4.  **Rollback (if needed)**:
    To revert changes, execute the rollback script:
    ```bash
    psql -h localhost -p 54322 -U postgres -d postgres -f supabase/migrations/20260222130000_comprehensive_schema_down.sql
    ```

## Design Decisions

*   **UUIDs**: Used for all primary keys to ensure uniqueness across distributed systems and prevent enumeration attacks.
*   **JSONB**: Used for `split_payments` and `sales_breakdown` to allow flexible data structures without complex join tables for these specific attributes.
*   **RLS Policies**:
    *   `is_admin_or_owner()` helper function centralizes logic for high-privilege checks.
    *   `get_current_user_role()` allows efficient role retrieval.
    *   Policies are granular (SELECT, INSERT, UPDATE, DELETE) to strictly enforce least privilege.

## Application Integration

*   **Frontend**: The application layout for Admin/Owner has been optimized to show financial data.
*   **Realtime**: The `supabase_realtime` publication is configured to broadcast changes to the dashboard, ensuring the "Transactions" view is always up-to-date.
*   **Types**: The schema aligns with the TypeScript interfaces defined in `src/types.ts`.
