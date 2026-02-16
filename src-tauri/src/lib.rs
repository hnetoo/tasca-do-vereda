use tauri::Manager;
use std::fs;

mod migration;

#[tauri::command]
fn save_backup_file(app_handle: tauri::AppHandle, content: String, filename: String) -> Result<String, String> {
  let docs_dir = app_handle.path().document_dir().map_err(|e| e.to_string())?;
  let backup_dir = docs_dir.join("TascaDoVeredaBackups");
  
  if !backup_dir.exists() {
    fs::create_dir_all(&backup_dir).map_err(|e| e.to_string())?;
  }
  
  let file_path = backup_dir.join(&filename);
  fs::write(&file_path, content).map_err(|e| e.to_string())?;
  
  Ok(file_path.to_string_lossy().into_owned())
}

#[tauri::command]
fn read_backup_file(filepath: String) -> Result<String, String> {
  fs::read_to_string(filepath).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(
      tauri_plugin_log::Builder::default()
        .level(log::LevelFilter::Info)
        .build(),
    )
    .invoke_handler(tauri::generate_handler![save_backup_file, read_backup_file, migration::migrate_to_cloud])
    .setup(|app| {
      app.handle().plugin(tauri_plugin_sql::Builder::default().build())?;
      app.handle().plugin(tauri_plugin_fs::init())?;
      app.handle().plugin(tauri_plugin_dialog::init())?;
      app.handle().plugin(tauri_plugin_shell::init())?;
      
      let window = app.get_window("main").unwrap();
      // Hide window on startup to prevent white flash/blue screen
      window.hide().unwrap();
      
      let window_clone = window.clone();
      app.listen_global("frontend-ready", move |_| {
          window_clone.show().unwrap();
          window_clone.set_focus().unwrap();
      });

      log::info!("App setup completed successfully");
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
