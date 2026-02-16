use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgPoolOptions, sqlite::SqlitePoolOptions, Row};
use std::time::Duration;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Order {
    pub id: String,
    pub table_id: Option<i64>,
    pub status: Option<String>,
    pub timestamp: Option<String>, // Handling as string for simplicity
    pub total: Option<f64>,
    pub tax_total: Option<f64>,
    pub payment_method: Option<String>,
    pub customer_id: Option<String>,
    pub shift_id: Option<String>,
    pub sub_account_name: Option<String>,
    pub invoice_number: Option<String>,
    pub hash: Option<String>,
    pub previous_hash: Option<String>,
    pub signature: Option<String>,
    pub jws_payload: Option<String>,
    pub is_synced_agt: Option<i64>, // Boolean as Integer in SQLite
    pub agt_submission_uuid: Option<String>,
    pub user_id: Option<String>,
    pub user_name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct OrderItem {
    pub id: i64,
    pub order_id: String,
    pub dish_id: String,
    pub quantity: Option<i64>,
    pub unit_price: f64,
    pub tax_amount: Option<f64>,
    pub tax_percentage: Option<f64>,
    pub tax_code: Option<String>,
    pub notes: Option<String>,
    pub status: Option<String>,
}

#[tauri::command]
pub async fn migrate_to_cloud(
    sqlite_path: String,
    postgres_url: String,
) -> Result<String, String> {
    // 1. Connect to SQLite
    let sqlite_pool = SqlitePoolOptions::new()
        .connect(&sqlite_path)
        .await
        .map_err(|e| format!("Failed to connect to SQLite: {}", e))?;

    // 2. Connect to Postgres (Supabase)
    let pg_pool = PgPoolOptions::new()
        .max_connections(5)
        .acquire_timeout(Duration::from_secs(3))
        .connect(&postgres_url)
        .await
        .map_err(|e| format!("Failed to connect to Postgres: {}", e))?;

    // 3. Fetch Data from SQLite
    let orders: Vec<Order> = sqlx::query_as("SELECT * FROM orders")
        .fetch_all(&sqlite_pool)
        .await
        .map_err(|e| format!("Failed to fetch orders: {}", e))?;

    let items: Vec<OrderItem> = sqlx::query_as("SELECT * FROM order_items")
        .fetch_all(&sqlite_pool)
        .await
        .map_err(|e| format!("Failed to fetch items: {}", e))?;

    // 4. Begin Postgres Transaction
    let mut tx = pg_pool.begin().await.map_err(|e| e.to_string())?;

    // 5. Insert Orders
    for order in &orders {
        // Ensure table exists (basic check, ideally schema is synced via migration files)
        // For this command, we assume the schema exists or we could create it. 
        // User asked to "inserir os dados". Assuming schema exists.
        
        // We use ON CONFLICT DO NOTHING to avoid duplicates if re-running
        let q = "INSERT INTO orders (id, table_id, status, timestamp, total, tax_total, payment_method, customer_id, shift_id, sub_account_name, invoice_number, hash, previous_hash, signature, jws_payload, is_synced_agt, agt_submission_uuid, user_id, user_name) 
                 VALUES ($1, $2, $3, $4::timestamp, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
                 ON CONFLICT (id) DO NOTHING";
        
        sqlx::query(q)
            .bind(&order.id)
            .bind(order.table_id)
            .bind(&order.status)
            .bind(&order.timestamp)
            .bind(order.total)
            .bind(order.tax_total)
            .bind(&order.payment_method)
            .bind(&order.customer_id)
            .bind(&order.shift_id)
            .bind(&order.sub_account_name)
            .bind(&order.invoice_number)
            .bind(&order.hash)
            .bind(&order.previous_hash)
            .bind(&order.signature)
            .bind(&order.jws_payload)
            .bind(order.is_synced_agt.unwrap_or(0))
            .bind(&order.agt_submission_uuid)
            .bind(&order.user_id)
            .bind(&order.user_name)
            .execute(&mut *tx)
            .await
            .map_err(|e| format!("Failed to insert order {}: {}", order.id, e))?;
    }

    // 6. Insert Items
    for item in &items {
        let q = "INSERT INTO order_items (order_id, dish_id, quantity, unit_price, tax_amount, tax_percentage, tax_code, notes, status) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)";
        
        // Note: order_items usually has auto-inc ID in SQLite. In Postgres it might be serial.
        // We ignore the ID to let Postgres generate new ones, or we should map them if relations depend on item ID.
        // Assuming order_id is the foreign key and is preserved (it is UUID/String).
        
        sqlx::query(q)
            .bind(&item.order_id)
            .bind(&item.dish_id)
            .bind(item.quantity)
            .bind(item.unit_price)
            .bind(item.tax_amount)
            .bind(item.tax_percentage)
            .bind(&item.tax_code)
            .bind(&item.notes)
            .bind(&item.status)
            .execute(&mut *tx)
            .await
            .map_err(|e| format!("Failed to insert item for order {}: {}", item.order_id, e))?;
    }

    // 7. Commit
    tx.commit().await.map_err(|e| format!("Failed to commit transaction: {}", e))?;

    Ok(format!("Migrated {} orders and {} items successfully.", orders.len(), items.len()))
}
