#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(
      tauri_plugin_log::Builder::default()
        .level(log::LevelFilter::Info)
        .build(),
    )
    .setup(|app| {
      app.handle().plugin(tauri_plugin_sql::Builder::default().build())?;
      app.handle().plugin(tauri_plugin_fs::init())?;
      app.handle().plugin(tauri_plugin_dialog::init())?;
      app.handle().plugin(tauri_plugin_shell::init())?;
      log::info!("App setup completed successfully");
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
